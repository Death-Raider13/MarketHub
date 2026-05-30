import { NextRequest, NextResponse } from "next/server"
import { getAdminFirestore } from "@/lib/firebase/admin"
import { FieldValue } from "firebase-admin/firestore"
import { verifyAuthToken } from "@/lib/api-auth"

// GET - Get store settings for creator (public read — storefronts are public)
export async function GET(request: NextRequest) {
  try {
    const adminDb = getAdminFirestore()

    if (!adminDb) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const creatorId = searchParams.get("creatorId")

    if (!creatorId) {
      return NextResponse.json(
        { error: "Missing creatorId" },
        { status: 400 }
      )
    }

    const settingsDoc = await adminDb
      .collection("storeSettings")
      .doc(creatorId)
      .get()

    if (!settingsDoc.exists) {
      // Return default settings if none exist
      return NextResponse.json({
        settings: {
          storeInfo: {},
          businessInfo: {},
          paymentSettings: {},
          shippingSettings: {},
          notifications: {},
          policies: {},
        }
      })
    }

    return NextResponse.json({
      settings: settingsDoc.data()
    })
  } catch (error) {
    console.error("Error fetching store settings:", error)
    return NextResponse.json(
      { error: "Failed to fetch store settings" },
      { status: 500 }
    )
  }
}

// POST/PUT - Save store settings (auth required, ownership enforced)
export async function POST(request: NextRequest) {
  const auth = await verifyAuthToken(request)
  if ('error' in auth) return auth.error

  try {
    const adminDb = getAdminFirestore()

    if (!adminDb) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      )
    }

    const data = await request.json()
    // Always derive creatorId from the authenticated user — never from the body.
    const creatorId = auth.user.uid
    const { creatorId: _bodyCreatorId, ...settings } = data

    // Save settings
    await adminDb.collection("storeSettings").doc(creatorId).set({
      ...settings,
      creatorId,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true })

    return NextResponse.json({
      success: true,
      message: "Store settings saved successfully",
    })
  } catch (error) {
    console.error("Error saving store settings:", error)
    return NextResponse.json(
      { error: "Failed to save store settings" },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from "next/server"
import { getAdminFirestore } from "@/lib/firebase/admin"
import { FieldValue } from "firebase-admin/firestore"

// GET - Get store settings for vendor
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
    const vendorId = searchParams.get("vendorId")

    if (!vendorId) {
      return NextResponse.json(
        { error: "Missing vendorId" },
        { status: 400 }
      )
    }

    const settingsDoc = await adminDb
      .collection("storeSettings")
      .doc(vendorId)
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

// POST/PUT - Save store settings
export async function POST(request: NextRequest) {
  try {
    const adminDb = getAdminFirestore()
    
    if (!adminDb) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      )
    }
    
    const data = await request.json()
    const { vendorId, ...settings } = data

    if (!vendorId) {
      return NextResponse.json(
        { error: "Missing vendorId" },
        { status: 400 }
      )
    }

    // Save settings
    await adminDb.collection("storeSettings").doc(vendorId).set({
      ...settings,
      vendorId,
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

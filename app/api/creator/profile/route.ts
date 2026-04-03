import { NextRequest, NextResponse } from "next/server"
import { getAdminFirestore } from "@/lib/firebase/admin-simple"
import { verifyAuthToken } from "@/lib/api-auth"
import { FieldValue } from "firebase-admin/firestore"
import { logger } from "@/lib/logger"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// GET - Get creator profile
export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate
    const authResult = await verifyAuthToken(request)
    if ('error' in authResult) {
      return authResult.error
    }

    const { user } = authResult
    const creatorId = user.uid

    const adminDb = getAdminFirestore()
    if (!adminDb) return NextResponse.json({ error: "Database error" }, { status: 500 })

    const userDoc = await adminDb.collection("users").doc(creatorId).get()

    if (!userDoc.exists) {
      return NextResponse.json(
        { error: "creator profile not found" },
        { status: 404 }
      )
    }

    const userData = userDoc.data()

    return NextResponse.json({
      profile: {
        hubName: userData?.hubName || userData?.storeName || "",
        storeName: userData?.hubName || userData?.storeName || "",
        email: userData?.email || "",
        phone: userData?.phone || userData?.phoneNumber || "",
        hubDescription: userData?.hubDescription || userData?.storeDescription || "",
        storeDescription: userData?.hubDescription || userData?.storeDescription || "",
        address: {
          addressLine1: userData?.address?.addressLine1 || "",
          addressLine2: userData?.address?.addressLine2 || "",
          city: userData?.address?.city || "",
          state: userData?.address?.state || "",
          zipCode: userData?.address?.zipCode || "",
          country: userData?.address?.country || "Nigeria",
        },
        storeCategory: userData?.storeCategory || [],
        verified: userData?.verified || false,
      }
    })
  } catch (error: any) {
    logger.error("Error fetching creator profile", undefined, error)
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    )
  }
}

// PUT - Update creator profile
export async function PUT(request: NextRequest) {
  try {
    // 1. Authenticate
    const authResult = await verifyAuthToken(request)
    if ('error' in authResult) {
      return authResult.error
    }

    const { user } = authResult
    const creatorId = user.uid

    const adminDb = getAdminFirestore()
    if (!adminDb) return NextResponse.json({ error: "Database error" }, { status: 500 })
    const profileData = await request.json()

    // 2. Update user profile
    await adminDb.collection("users").doc(creatorId).update({
      hubName: profileData.hubName || profileData.storeName || "",
      storeName: profileData.hubName || profileData.storeName || "",
      phone: profileData.phone || "",
      hubDescription: profileData.hubDescription || profileData.storeDescription || "",
      storeDescription: profileData.hubDescription || profileData.storeDescription || "",
      address: profileData.address || {},
      updatedAt: FieldValue.serverTimestamp(),
    })

    logger.info(`creator profile updated for: ${creatorId}`)

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
    })
  } catch (error: any) {
    logger.error("Error updating creator profile", undefined, error)
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    )
  }
}


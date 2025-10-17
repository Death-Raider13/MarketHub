import { NextRequest, NextResponse } from "next/server"
import { getAdminFirestore } from "@/lib/firebase/admin"
import { FieldValue } from "firebase-admin/firestore"

// GET - Get vendor profile
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

    const userDoc = await adminDb.collection("users").doc(vendorId).get()

    if (!userDoc.exists) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    const userData = userDoc.data()
    
    return NextResponse.json({
      profile: {
        storeName: userData?.storeName || "",
        email: userData?.email || "",
        phone: userData?.phone || "",
        storeDescription: userData?.storeDescription || "",
        address: {
          addressLine1: userData?.address?.addressLine1 || "",
          addressLine2: userData?.address?.addressLine2 || "",
          city: userData?.address?.city || "",
          state: userData?.address?.state || "",
          zipCode: userData?.address?.zipCode || "",
          country: userData?.address?.country || "Nigeria",
        },
        storeCategory: userData?.storeCategory || [],
      }
    })
  } catch (error) {
    console.error("Error fetching vendor profile:", error)
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    )
  }
}

// PUT - Update vendor profile
export async function PUT(request: NextRequest) {
  try {
    const adminDb = getAdminFirestore()
    
    if (!adminDb) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      )
    }
    
    const data = await request.json()
    const { vendorId, ...profileData } = data

    if (!vendorId) {
      return NextResponse.json(
        { error: "Missing vendorId" },
        { status: 400 }
      )
    }

    // Update user profile (use set with merge to create if doesn't exist)
    await adminDb.collection("users").doc(vendorId).set({
      storeName: profileData.storeName,
      phone: profileData.phone,
      storeDescription: profileData.storeDescription,
      address: profileData.address,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true })

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
    })
  } catch (error) {
    console.error("Error updating vendor profile:", error)
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    )
  }
}

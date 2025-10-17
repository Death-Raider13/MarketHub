import { NextRequest, NextResponse } from "next/server"
import { getAdminFirestore } from "@/lib/firebase/admin"
import { FieldValue } from "firebase-admin/firestore"

export async function POST(request: NextRequest) {
  try {
    const { userId, amount, reference } = await request.json()

    console.log("Add funds request:", { userId, amount, reference })

    if (!userId || !amount || !reference) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Get Admin Firestore
    const adminDb = getAdminFirestore()
    
    if (!adminDb) {
      console.error("Firebase Admin not initialized")
      return NextResponse.json(
        { error: "Server configuration error - Admin SDK not initialized" },
        { status: 500 }
      )
    }

    // Verify payment with Paystack (you can add this later)
    // For now, we'll trust the reference

    try {
      // Update advertiser balance using Admin SDK (bypasses security rules)
      const advertiserRef = adminDb.collection("advertisers").doc(userId)
      
      console.log("Updating advertiser balance with Admin SDK...")
      await advertiserRef.update({
        accountBalance: FieldValue.increment(amount),
        updatedAt: FieldValue.serverTimestamp(),
      })
      console.log("Balance updated successfully")

      // Create transaction record
      console.log("Creating transaction record...")
      await adminDb.collection("transactions").add({
        userId,
        type: "credit",
        amount,
        reference,
        description: "Account top-up",
        status: "completed",
        createdAt: FieldValue.serverTimestamp(),
      })
      console.log("Transaction created successfully")

      return NextResponse.json({
        success: true,
        message: "Funds added successfully",
      })
    } catch (firestoreError: any) {
      console.error("Firestore error:", firestoreError)
      console.error("Error code:", firestoreError.code)
      console.error("Error message:", firestoreError.message)
      
      return NextResponse.json(
        { 
          error: "Database error",
          details: firestoreError.message 
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error("Error adding funds:", error)
    return NextResponse.json(
      { error: "Failed to add funds", details: error.message },
      { status: 500 }
    )
  }
}

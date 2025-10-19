import { NextRequest, NextResponse } from "next/server"

// Temporary debug endpoint to check what's happening
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vendorId = searchParams.get("vendorId")

    // Check if we can import admin
    let adminDb
    try {
      const { getAdminFirestore } = await import("@/lib/firebase/admin")
      adminDb = getAdminFirestore()
    } catch (error: any) {
      return NextResponse.json({
        error: "Failed to import admin",
        message: error.message,
        stack: error.stack
      }, { status: 500 })
    }

    if (!adminDb) {
      return NextResponse.json({
        error: "Admin DB is null",
        message: "getAdminFirestore returned null or undefined"
      }, { status: 500 })
    }

    // Try to query products
    try {
      const productsSnapshot = await adminDb
        .collection("products")
        .where("vendorId", "==", vendorId)
        .limit(1)
        .get()

      return NextResponse.json({
        success: true,
        message: "Admin DB working",
        productsCount: productsSnapshot.size,
        vendorId
      })
    } catch (error: any) {
      return NextResponse.json({
        error: "Query failed",
        message: error.message,
        code: error.code,
        stack: error.stack
      }, { status: 500 })
    }

  } catch (error: any) {
    return NextResponse.json({
      error: "Unexpected error",
      message: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from "next/server"
import { devOnlyGuard } from "@/lib/api-auth"

// Temporary debug endpoint — dev-only, never reaches production.
export async function GET(request: NextRequest) {
  const blocked = devOnlyGuard()
  if (blocked) return blocked
  try {
    const { searchParams } = new URL(request.url)
    const creatorId = searchParams.get("creatorId")

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
        .where("creatorId", "==", creatorId)
        .limit(1)
        .get()

      return NextResponse.json({
        success: true,
        message: "Admin DB working",
        productsCount: productsSnapshot.size,
        creatorId
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

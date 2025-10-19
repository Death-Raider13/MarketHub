import { NextRequest, NextResponse } from "next/server"
import { getAdminFirestore } from "@/lib/firebase/admin"

// GET - List all orders for vendor's products
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

    // Get all orders that contain products from this vendor
    // Try using vendorIds array-contains query first
    let ordersSnapshot
    try {
      ordersSnapshot = await adminDb
        .collection("orders")
        .where("vendorIds", "array-contains", vendorId)
        .orderBy("createdAt", "desc")
        .get()
    } catch (error) {
      // Fallback: get all orders and filter client-side
      console.log("Falling back to client-side filtering for vendor orders")
      ordersSnapshot = await adminDb
        .collection("orders")
        .orderBy("createdAt", "desc")
        .limit(100) // Limit to prevent excessive reads
        .get()
    }

    // Filter and map orders
    const orders = ordersSnapshot.docs
      .filter((doc: any) => {
        const data = doc.data()
        // Check if any item in the order belongs to this vendor
        return data.items?.some((item: any) => item.vendorId === vendorId)
      })
      .map((doc: any) => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        }
      })

    return NextResponse.json({ 
      orders,
      success: true 
    })
  } catch (error) {
    console.error("Error fetching orders:", error)
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    )
  }
}

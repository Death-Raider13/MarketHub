import { NextRequest, NextResponse } from "next/server"
import { getAdminFirestore } from "@/lib/firebase/admin"
import { verifyAuthToken } from "@/lib/api-auth"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// GET - List all orders for creator's products
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const requestedCreatorId = searchParams.get("creatorId")

    const isAdmin = auth.user.role === 'admin' || auth.user.role === 'super_admin'
    if (requestedCreatorId && requestedCreatorId !== auth.user.uid && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const creatorId = requestedCreatorId || auth.user.uid

    if (!creatorId) {
      return NextResponse.json(
        { error: "Missing creatorId" },
        { status: 400 }
      )
    }

    // Get all orders that contain products from this creator
    // Try using creatorIds array-contains query first
    let ordersSnapshot
    try {
      ordersSnapshot = await adminDb
        .collection("orders")
        .where("creatorIds", "array-contains", creatorId)
        .orderBy("createdAt", "desc")
        .get()
    } catch (error) {
      // Fallback: get all orders and filter client-side
      console.log("Falling back to client-side filtering for creator orders")
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
        // Check if any item in the order belongs to this creator
        return data.items?.some((item: any) => item.creatorId === creatorId)
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

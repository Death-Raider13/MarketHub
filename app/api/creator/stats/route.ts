import { NextRequest, NextResponse } from "next/server"
import { getAdminFirestore } from "@/lib/firebase/admin"
import { verifyAuthToken } from "@/lib/api-auth"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

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

    // Ownership check: a creator can only read their own stats.
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

    // Get products stats
    const productsSnapshot = await adminDb
      .collection("products")
      .where("creatorId", "==", creatorId)
      .get()

    const products = productsSnapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }))

    const totalProducts = products.length
    const activeProducts = products.filter((p: any) => p.status === "active").length
    const lowStockProducts = products.filter((p: any) =>
      p.type === "physical" && p.stock !== null && p.stock < 10
    ).length

    // Calculate total views from product stats
    const totalViews = products.reduce((sum: number, p: any) =>
      sum + (p.stats?.views || 0), 0
    )

    // Get recent orders from orders collection
    // Note: Orders have creatorIds array, so we need to query differently
    let ordersSnapshot
    try {
      ordersSnapshot = await adminDb
        .collection("orders")
        .where("creatorIds", "array-contains", creatorId)
        .orderBy("createdAt", "desc")
        .limit(5)
        .get()
    } catch (error) {
      // Fallback if creatorIds field doesn't exist or index not ready
      console.log("Falling back to all orders query")
      ordersSnapshot = await adminDb
        .collection("orders")
        .orderBy("createdAt", "desc")
        .limit(5)
        .get()
    }

    const recentOrders = ordersSnapshot.docs
      .filter((doc: any) => {
        const data = doc.data()
        // Filter orders that contain items from this creator
        return data.items?.some((item: any) => item.creatorId === creatorId)
      })
      .slice(0, 5)
      .map((doc: any) => {
        const data = doc.data()
        return {
          id: doc.id,
          customerName: data.customerName || data.shippingAddress?.fullName || "Guest",
          total: data.total || 0,
          status: data.status || "pending",
          date: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          items: data.items || []
        }
      })

    // Calculate sales trend (last 7 days) from actual orders
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    let recentOrdersSnapshot
    try {
      recentOrdersSnapshot = await adminDb
        .collection("orders")
        .where("creatorIds", "array-contains", creatorId)
        .where("createdAt", ">=", sevenDaysAgo)
        .get()
    } catch (error) {
      // Fallback
      recentOrdersSnapshot = await adminDb
        .collection("orders")
        .where("createdAt", ">=", sevenDaysAgo)
        .get()
    }

    // Helper to calculate revenue for this creator within a single order
    const calculatecreatorOrderRevenue = (order: any): number => {
      if (!order.items || !Array.isArray(order.items)) return 0
      return order.items
        .filter((item: any) => item.creatorId === creatorId)
        .reduce((sum: number, item: any) => {
          const price = item.productPrice || item.price || item.product?.price || 0
          const quantity = item.quantity || 1
          return sum + price * quantity
        }, 0)
    }

    const calculatecreatorOrderQuantity = (order: any): number => {
      if (!order.items || !Array.isArray(order.items)) return 0
      return order.items
        .filter((item: any) => item.creatorId === creatorId)
        .reduce((sum: number, item: any) => sum + (item.quantity || 1), 0)
    }

    // Group orders by day using creator-specific revenue
    const salesByDay: { [key: string]: number } = {}
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

    recentOrdersSnapshot.docs.forEach((doc: any) => {
      const data = doc.data()
      if (!data.items?.some((item: any) => item.creatorId === creatorId)) return

      const orderDate = data.createdAt?.toDate?.() || new Date()
      const dayName = daysOfWeek[orderDate.getDay()]
      const orderRevenue = calculatecreatorOrderRevenue(data)
      salesByDay[dayName] = (salesByDay[dayName] || 0) + orderRevenue
    })

    // Build sales data for last 7 days
    const salesData = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dayName = daysOfWeek[date.getDay()]
      salesData.push({
        date: dayName,
        sales: salesByDay[dayName] || 0
      })
    }

    // Compute total revenue and total sales across all orders for this creator
    let allcreatorOrdersSnapshot
    try {
      allcreatorOrdersSnapshot = await adminDb
        .collection("orders")
        .where("creatorIds", "array-contains", creatorId)
        .get()
    } catch (error) {
      allcreatorOrdersSnapshot = await adminDb
        .collection("orders")
        .get()
    }

    const allcreatorOrders = allcreatorOrdersSnapshot.docs
      .filter((doc: any) => {
        const data = doc.data()
        return data.items?.some((item: any) => item.creatorId === creatorId)
      })
      .map((doc: any) => doc.data())

    let totalRevenue = 0
    let totalSales = 0

    allcreatorOrders.forEach((order: any) => {
      const orderRevenue = calculatecreatorOrderRevenue(order)
      if (orderRevenue <= 0) return

      totalRevenue += orderRevenue
      totalSales += calculatecreatorOrderQuantity(order)
    })

    return NextResponse.json({
      stats: {
        totalProducts,
        activeProducts,
        lowStockProducts,
        totalRevenue,
        totalViews,
        totalSales,
      },
      recentOrders,
      salesData,
      products: products.slice(0, 5), // Top 5 products
    })
  } catch (error) {
    console.error("Error fetching creator stats:", error)
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from "next/server"
import { getAdminFirestore } from "@/lib/firebase/admin"

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

    // Get products stats
    const productsSnapshot = await adminDb
      .collection("products")
      .where("vendorId", "==", vendorId)
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

    // Calculate total revenue from product stats
    const totalRevenue = products.reduce((sum: number, p: any) => 
      sum + (p.stats?.revenue || 0), 0
    )

    // Calculate total views
    const totalViews = products.reduce((sum: number, p: any) => 
      sum + (p.stats?.views || 0), 0
    )

    // Calculate total sales
    const totalSales = products.reduce((sum: number, p: any) => 
      sum + (p.stats?.sales || 0), 0
    )

    // Get recent orders from orders collection
    const ordersSnapshot = await adminDb
      .collection("orders")
      .where("vendorId", "==", vendorId)
      .orderBy("createdAt", "desc")
      .limit(5)
      .get()

    const recentOrders = ordersSnapshot.docs.map((doc: any) => {
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

    const recentOrdersSnapshot = await adminDb
      .collection("orders")
      .where("vendorId", "==", vendorId)
      .where("createdAt", ">=", sevenDaysAgo)
      .get()

    // Group orders by day
    const salesByDay: { [key: string]: number } = {}
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    
    recentOrdersSnapshot.docs.forEach((doc: any) => {
      const data = doc.data()
      const orderDate = data.createdAt?.toDate?.() || new Date()
      const dayName = daysOfWeek[orderDate.getDay()]
      salesByDay[dayName] = (salesByDay[dayName] || 0) + (data.total || 0)
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
    console.error("Error fetching vendor stats:", error)
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    )
  }
}

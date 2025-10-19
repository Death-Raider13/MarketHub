import { NextRequest, NextResponse } from "next/server"
import { getAdminFirestore } from "@/lib/firebase/admin"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

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
    const period = parseInt(searchParams.get("period") || "30") // days

    if (!vendorId) {
      return NextResponse.json(
        { error: "Missing vendorId" },
        { status: 400 }
      )
    }

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - period)

    // Calculate previous period for growth comparison
    const prevStartDate = new Date(startDate)
    prevStartDate.setDate(prevStartDate.getDate() - period)

    // Get vendor's products
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

    // Get orders for current period
    const ordersSnapshot = await adminDb
      .collection("orders")
      .where("vendorId", "==", vendorId)
      .where("createdAt", ">=", startDate)
      .where("createdAt", "<=", endDate)
      .get()

    const orders = ordersSnapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date()
    }))

    // Get orders for previous period (for growth calculation)
    const prevOrdersSnapshot = await adminDb
      .collection("orders")
      .where("vendorId", "==", vendorId)
      .where("createdAt", ">=", prevStartDate)
      .where("createdAt", "<", startDate)
      .get()

    const prevOrders = prevOrdersSnapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }))

    // Calculate metrics
    const totalRevenue = orders.reduce((sum: number, order: any) => 
      sum + (order.total || 0), 0
    )
    const totalOrders = orders.length
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // Previous period metrics
    const prevRevenue = prevOrders.reduce((sum: number, order: any) => 
      sum + (order.total || 0), 0
    )
    const prevOrderCount = prevOrders.length
    const prevAvgOrderValue = prevOrderCount > 0 ? prevRevenue / prevOrderCount : 0

    // Calculate growth percentages
    const revenueGrowth = prevRevenue > 0 
      ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 
      : 0
    const ordersGrowth = prevOrderCount > 0 
      ? ((totalOrders - prevOrderCount) / prevOrderCount) * 100 
      : 0
    const avgOrderValueGrowth = prevAvgOrderValue > 0 
      ? ((avgOrderValue - prevAvgOrderValue) / prevAvgOrderValue) * 100 
      : 0

    // Calculate store views (from product stats)
    const storeViews = products.reduce((sum: number, p: any) => 
      sum + (p.stats?.views || 0), 0
    )

    // Get all orders for views growth (simplified)
    const allOrdersSnapshot = await adminDb
      .collection("orders")
      .where("vendorId", "==", vendorId)
      .get()
    
    const prevViewsCount = allOrdersSnapshot.size
    const viewsGrowth = prevViewsCount > 0 
      ? ((storeViews - prevViewsCount) / prevViewsCount) * 100 
      : 0

    // Build sales data by date
    const salesByDate: { [key: string]: { revenue: number; orders: number } } = {}
    
    orders.forEach((order: any) => {
      const dateKey = order.createdAt.toISOString().split('T')[0]
      if (!salesByDate[dateKey]) {
        salesByDate[dateKey] = { revenue: 0, orders: 0 }
      }
      salesByDate[dateKey].revenue += order.total || 0
      salesByDate[dateKey].orders += 1
    })

    // Convert to array and format dates
    const salesData = Object.entries(salesByDate)
      .map(([date, data]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: data.revenue,
        orders: data.orders
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    // If no data, create empty array for the period
    if (salesData.length === 0) {
      const daysToShow = Math.min(period, 7) // Show last 7 days if period is longer
      for (let i = daysToShow - 1; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        salesData.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          revenue: 0,
          orders: 0
        })
      }
    }

    // Get top products by revenue
    const productSales: { [key: string]: { sales: number; revenue: number; product: any } } = {}
    
    orders.forEach((order: any) => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item: any) => {
          if (!productSales[item.productId]) {
            const product = products.find((p: any) => p.id === item.productId)
            productSales[item.productId] = {
              sales: 0,
              revenue: 0,
              product: product || { name: item.productName || "Unknown", image: "" }
            }
          }
          productSales[item.productId].sales += item.quantity || 1
          productSales[item.productId].revenue += (item.price || 0) * (item.quantity || 1)
        })
      }
    })

    const topProducts = Object.entries(productSales)
      .map(([id, data]) => ({
        id,
        name: data.product.name,
        image: data.product.images?.[0] || "",
        sales: data.sales,
        revenue: data.revenue
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    // Build conversion funnel (simplified estimates)
    const storeVisits = storeViews
    const productViews = Math.floor(storeViews * 0.7) // Estimate 70% view products
    const addToCart = Math.floor(productViews * 0.3) // Estimate 30% add to cart
    const checkout = Math.floor(addToCart * 0.8) // Estimate 80% proceed to checkout
    const purchase = totalOrders

    // Recent orders
    const recentOrders = orders
      .sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 5)
      .map((order: any) => ({
        id: order.id,
        customerName: order.customerName || order.shippingAddress?.fullName || "Guest",
        total: order.total || 0,
        status: order.status || "pending",
        date: order.createdAt
      }))

    return NextResponse.json({
      success: true,
      analytics: {
        totalRevenue,
        totalOrders,
        avgOrderValue,
        storeViews,
        totalProducts,
        activeProducts,
        salesData,
        topProducts,
        recentOrders,
        conversionFunnel: {
          storeVisits,
          productViews,
          addToCart,
          checkout,
          purchase
        },
        growthMetrics: {
          revenueGrowth,
          ordersGrowth,
          avgOrderValueGrowth,
          viewsGrowth
        }
      }
    })
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return NextResponse.json(
      { error: "Failed to fetch analytics", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

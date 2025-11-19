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
    let ordersSnapshot
    try {
      ordersSnapshot = await adminDb
        .collection("orders")
        .where("vendorIds", "array-contains", vendorId)
        .where("createdAt", ">=", startDate)
        .where("createdAt", "<=", endDate)
        .get()
    } catch (error) {
      // Fallback if vendorIds index is not available
      ordersSnapshot = await adminDb
        .collection("orders")
        .where("createdAt", ">=", startDate)
        .where("createdAt", "<=", endDate)
        .get()
    }

    const orders = ordersSnapshot.docs
      .filter((doc: any) => {
        const data = doc.data()
        // Ensure this order actually contains items for this vendor
        return data.items?.some((item: any) => item.vendorId === vendorId)
      })
      .map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date()
      }))

    // Get orders for previous period (for growth calculation)
    let prevOrdersSnapshot
    try {
      prevOrdersSnapshot = await adminDb
        .collection("orders")
        .where("vendorIds", "array-contains", vendorId)
        .where("createdAt", ">=", prevStartDate)
        .where("createdAt", "<", startDate)
        .get()
    } catch (error) {
      prevOrdersSnapshot = await adminDb
        .collection("orders")
        .where("createdAt", ">=", prevStartDate)
        .where("createdAt", "<", startDate)
        .get()
    }

    const prevOrders = prevOrdersSnapshot.docs
      .filter((doc: any) => {
        const data = doc.data()
        return data.items?.some((item: any) => item.vendorId === vendorId)
      })
      .map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      }))

    // Helper to calculate revenue for this vendor within a single order
    const calculateVendorOrderRevenue = (order: any): number => {
      if (!order.items || !Array.isArray(order.items)) return 0
      return order.items
        .filter((item: any) => item.vendorId === vendorId)
        .reduce((sum: number, item: any) => {
          const price = item.productPrice || item.price || item.product?.price || 0
          const quantity = item.quantity || 1
          return sum + price * quantity
        }, 0)
    }

    // Calculate metrics using vendor-specific revenue
    let totalRevenue = 0
    let totalOrders = 0

    orders.forEach((order: any) => {
      const orderRevenue = calculateVendorOrderRevenue(order)
      if (orderRevenue <= 0) return
      totalRevenue += orderRevenue
      totalOrders += 1
    })

    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // Previous period metrics (vendor-specific)
    let prevRevenue = 0
    let prevOrderCount = 0

    prevOrders.forEach((order: any) => {
      const orderRevenue = calculateVendorOrderRevenue(order)
      if (orderRevenue <= 0) return
      prevRevenue += orderRevenue
      prevOrderCount += 1
    })

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

    // Calculate product views (from product stats)
    const productViewsTotal = products.reduce((sum: number, p: any) => 
      sum + (p.stats?.views || 0), 0
    )

    // Load store page views from vendorStats collection
    let storeViews = 0
    try {
      const vendorStatsDoc = await adminDb
        .collection("vendorStats")
        .doc(vendorId)
        .get()

      if (vendorStatsDoc.exists) {
        const data = vendorStatsDoc.data()
        storeViews = data?.storeViews || 0
      }
    } catch (error) {
      console.error("Error loading vendorStats for store views:", error)
    }

    // Get all orders for views growth (simplified)
    let allOrdersSnapshot
    try {
      allOrdersSnapshot = await adminDb
        .collection("orders")
        .where("vendorIds", "array-contains", vendorId)
        .get()
    } catch (error) {
      allOrdersSnapshot = await adminDb
        .collection("orders")
        .get()
    }

    const prevViewsCount = allOrdersSnapshot.docs.filter((doc: any) => {
      const data = doc.data()
      return data.items?.some((item: any) => item.vendorId === vendorId)
    }).length
    const viewsGrowth = prevViewsCount > 0 
      ? ((storeViews - prevViewsCount) / prevViewsCount) * 100 
      : 0

    // Build sales data by date (vendor-specific revenue)
    const salesByDate: { [key: string]: { revenue: number; orders: number } } = {}
    
    orders.forEach((order: any) => {
      const orderRevenue = calculateVendorOrderRevenue(order)
      if (orderRevenue <= 0) return

      const dateKey = order.createdAt.toISOString().split('T')[0]
      if (!salesByDate[dateKey]) {
        salesByDate[dateKey] = { revenue: 0, orders: 0 }
      }
      salesByDate[dateKey].revenue += orderRevenue
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

    // Get top products by revenue (only this vendor's items)
    const productSales: { [key: string]: { sales: number; revenue: number; product: any } } = {}
    
    orders.forEach((order: any) => {
      if (order.items && Array.isArray(order.items)) {
        order.items
          .filter((item: any) => item.vendorId === vendorId)
          .forEach((item: any) => {
            const productId = item.productId
            if (!productSales[productId]) {
              const product = products.find((p: any) => p.id === productId)
              productSales[productId] = {
                sales: 0,
                revenue: 0,
                product: product || { name: item.productName || "Unknown", image: "" }
              }
            }
            productSales[productId].sales += item.quantity || 1
            const price = item.productPrice || item.price || item.product?.price || 0
            productSales[productId].revenue += price * (item.quantity || 1)
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

    // Build conversion funnel (simplified)
    const storeVisits = storeViews
    const productViews = productViewsTotal
    const addToCart = Math.floor(productViews * 0.3) // Estimate 30% add to cart
    const checkout = Math.floor(addToCart * 0.8) // Estimate 80% proceed to checkout
    const purchase = totalOrders

    // Recent orders (with vendor-specific totals)
    const recentOrders = orders
      .sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 5)
      .map((order: any) => ({
        id: order.id,
        customerName: order.customerName || order.shippingAddress?.fullName || "Guest",
        total: calculateVendorOrderRevenue(order),
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

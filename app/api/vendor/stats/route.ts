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

    // Get recent orders (you'll need to implement orders collection)
    // For now, return empty array
    const recentOrders: any[] = []

    // Calculate sales trend (last 7 days)
    const salesData = [
      { date: "Mon", sales: 0 },
      { date: "Tue", sales: 0 },
      { date: "Wed", sales: 0 },
      { date: "Thu", sales: 0 },
      { date: "Fri", sales: 0 },
      { date: "Sat", sales: 0 },
      { date: "Sun", sales: 0 },
    ]

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

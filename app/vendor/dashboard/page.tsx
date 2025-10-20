"use client"

import { useAuth } from "@/lib/firebase/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ProtectedRoute } from "@/lib/firebase/protected-route"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  TrendingUp,
  DollarSign,
  Users,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Megaphone,
  StoreIcon,
  Star,
  Eye,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  MessageSquare,
  TrendingDown,
  Calendar,
  Target,
  ShoppingBag,
  ArrowLeftRight,
  Wallet,
  Palette,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

function VendorDashboardContent() {
  const { user, userProfile } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    lowStockProducts: 0,
    totalRevenue: 0,
    totalViews: 0,
    totalSales: 0,
  })
  const [salesData, setSalesData] = useState<Array<{ date: string; sales: number }>>([])
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [topProducts, setTopProducts] = useState<any[]>([])
  const [dashboardStats, setDashboardStats] = useState({
    todaysSales: 0,
    totalOrders: 0,
    totalCustomers: 0,
    pendingOrders: 0,
    completedOrders: 0,
    inTransitOrders: 0,
    cancelledOrders: 0,
    totalReviews: 0,
  })

  useEffect(() => {
    // Redirect if email not verified
    if (user && !user.emailVerified) {
      router.push("/auth/vendor-verify")
      return
    }

    // Redirect if vendor not approved by admin
    if (userProfile && userProfile.role === "vendor" && !userProfile.verified) {
      router.push("/vendor/pending-approval")
      return
    }
  }, [user, userProfile, router])

  // Load vendor stats
  useEffect(() => {
    async function loadStats() {
      if (!user) return

      try {
        const response = await fetch(`/api/vendor/stats?vendorId=${user.uid}`)
        
        if (!response.ok) {
          console.error('Stats API error:', response.status)
          throw new Error('Failed to fetch stats')
        }
        
        const data = await response.json()

        setStats({
          totalProducts: data.stats?.totalProducts || 0,
          activeProducts: data.stats?.activeProducts || 0,
          lowStockProducts: data.stats?.lowStockProducts || 0,
          totalRevenue: data.stats?.totalRevenue || 0,
          totalViews: data.stats?.totalViews || 0,
          totalSales: data.stats?.totalSales || 0,
        })
        setSalesData(data.salesData || [])
        setRecentOrders(data.recentOrders || [])

        // Fetch additional dashboard stats from orders
        const ordersResponse = await fetch(`/api/vendor/orders?vendorId=${user.uid}`)
        const ordersData = await ordersResponse.json()
        const orders = ordersData.orders || []

        // Calculate today's sales
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const todayOrders = orders.filter((order: any) => {
          const orderDate = new Date(order.createdAt)
          orderDate.setHours(0, 0, 0, 0)
          return orderDate.getTime() === today.getTime()
        })
        const todaysSales = todayOrders.reduce((sum: number, order: any) => sum + (order.total || 0), 0)

        // Count unique customers
        const uniqueCustomers = new Set(orders.map((order: any) => order.userId || order.customerEmail)).size

        // Count orders by status
        const pendingOrders = orders.filter((o: any) => o.status === 'pending').length
        const completedOrders = orders.filter((o: any) => o.status === 'completed' || o.status === 'delivered').length
        const inTransitOrders = orders.filter((o: any) => o.status === 'shipped' || o.status === 'processing').length
        const cancelledOrders = orders.filter((o: any) => o.status === 'cancelled').length

        setDashboardStats({
          todaysSales,
          totalOrders: orders.length,
          totalCustomers: uniqueCustomers,
          pendingOrders,
          completedOrders,
          inTransitOrders,
          cancelledOrders,
          totalReviews: 0, // TODO: Implement reviews system
        })

        // Calculate top selling products from orders
        const productSales: { [key: string]: { name: string; sold: number; revenue: number; image?: string } } = {}
        
        orders.forEach((order: any) => {
          if (order.items && Array.isArray(order.items)) {
            order.items.forEach((item: any) => {
              const productId = item.productId || item.id
              if (!productSales[productId]) {
                productSales[productId] = {
                  name: item.name || item.productName || 'Unknown Product',
                  sold: 0,
                  revenue: 0,
                  image: item.image || item.imageUrl
                }
              }
              productSales[productId].sold += item.quantity || 1
              productSales[productId].revenue += (item.price || 0) * (item.quantity || 1)
            })
          }
        })

        // Convert to array and sort by revenue
        const topProductsArray = Object.entries(productSales)
          .map(([id, data]) => ({ id, ...data }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 3) // Top 3 products

        setTopProducts(topProductsArray)
      } catch (error) {
        console.error("Error loading stats:", error)
      } finally {
        setLoading(false)
      }
    }

    if (user && user.emailVerified && userProfile?.verified) {
      loadStats()
    }
  }, [user, userProfile]);

  // Show loading while checking
  if (!user || !user.emailVerified || (userProfile && !userProfile.verified)) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold">Vendor Dashboard</h1>
                <p className="text-muted-foreground">Welcome back! Here's what's happening with your store</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" asChild className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200">
                  <Link href={`/store/${userProfile?.uid}`} target="_blank">
                    <Eye className="mr-2 h-4 w-4" />
                    View My Store
                  </Link>
                </Button>
                <Button variant="outline" asChild className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-blue-200">
                  <Link href="/">
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    Switch to Buying Mode
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/vendor/orders">
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Orders
                  </Link>
                </Button>
                <Button asChild>
                  <Link href="/vendor/products/new">
                    <Package className="mr-2 h-4 w-4" />
                    Add Product
                  </Link>
                </Button>
              </div>
            </div>
            
            {/* Quick Stats Bar */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Loading dashboard...</span>
              </div>
            ) : (
              <>
              <div className="grid gap-4 sm:grid-cols-4 mb-6">
              <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-green-800 dark:text-green-200">Total Revenue</p>
                      <p className="text-xl font-bold text-green-900 dark:text-green-100">
                        ₦{stats.totalRevenue.toLocaleString()}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-blue-800 dark:text-blue-200">Total Sales</p>
                      <p className="text-xl font-bold text-blue-900 dark:text-blue-100">{stats.totalSales}</p>
                    </div>
                    <ShoppingCart className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-purple-800 dark:text-purple-200">Total Views</p>
                      <p className="text-xl font-bold text-purple-900 dark:text-purple-100">
                        {stats.totalViews.toLocaleString()}
                      </p>
                    </div>
                    <Eye className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-orange-800 dark:text-orange-200">Active Products</p>
                      <p className="text-xl font-bold text-orange-900 dark:text-orange-100">
                        {stats.activeProducts}/{stats.totalProducts}
                      </p>
                    </div>
                    <Package className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Payout Quick Access Card */}
            <Card className="mb-6 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-green-500/10 p-3">
                      <Wallet className="h-8 w-8 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">Earnings & Payouts</h3>
                      <p className="text-sm text-green-700 dark:text-green-300">Manage your withdrawals and view earning history</p>
                    </div>
                  </div>
                  <Button asChild className="bg-green-600 hover:bg-green-700">
                    <Link href="/vendor/payouts">
                      <Wallet className="mr-2 h-4 w-4" />
                      View Payouts
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
              </>
            )}
          </div>

          <div className="grid gap-6 lg:grid-cols-4">
            {/* Sidebar */}
            <aside className="space-y-2">
              <Link href="/vendor/dashboard">
                <Button variant="default" className="w-full justify-start">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
              <Link href="/vendor/products">
                <Button variant="ghost" className="w-full justify-start">
                  <Package className="mr-2 h-4 w-4" />
                  Products
                </Button>
              </Link>
              <Link href="/vendor/orders">
                <Button variant="ghost" className="w-full justify-start">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Orders
                </Button>
              </Link>
              <Link href="/vendor/analytics">
                <Button variant="ghost" className="w-full justify-start">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Analytics
                </Button>
              </Link>
              <Link href="/vendor/store-customize">
                <Button variant="ghost" className="w-full justify-start">
                  <Palette className="mr-2 h-4 w-4" />
                  Customize Store
                </Button>
              </Link>
              <Link href="/vendor/payouts">
                <Button variant="ghost" className="w-full justify-start">
                  <Wallet className="mr-2 h-4 w-4" />
                  Payouts
                </Button>
              </Link>
            </aside>

            {/* Main Content */}
            <div className="lg:col-span-3 space-y-6">
              {/* Stats Cards */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Today's Sales</p>
                        <p className="text-2xl font-bold">₦{dashboardStats.todaysSales.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Sales made today
                        </p>
                      </div>
                      <div className="rounded-full bg-green-500/10 p-3">
                        <DollarSign className="h-5 w-5 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Orders</p>
                        <p className="text-2xl font-bold">{dashboardStats.totalOrders}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {dashboardStats.pendingOrders} pending
                        </p>
                      </div>
                      <div className="rounded-full bg-blue-500/10 p-3">
                        <ShoppingCart className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Products</p>
                        <p className="text-2xl font-bold">{stats.totalProducts}</p>
                        <p className="text-xs text-muted-foreground mt-1">{stats.lowStockProducts} low stock</p>
                      </div>
                      <div className="rounded-full bg-purple-500/10 p-3">
                        <Package className="h-5 w-5 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Customers</p>
                        <p className="text-2xl font-bold">{dashboardStats.totalCustomers}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Unique buyers
                        </p>
                      </div>
                      <div className="rounded-full bg-orange-500/10 p-3">
                        <Users className="h-5 w-5 text-orange-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sales Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Sales Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={salesData}>
                      <XAxis dataKey="date" stroke="#888888" fontSize={12} />
                      <YAxis stroke="#888888" fontSize={12} />
                      <Tooltip />
                      <Line type="monotone" dataKey="sales" stroke="hsl(var(--primary))" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Action Items & Alerts */}
              <div className="grid gap-6 lg:grid-cols-3 mb-6">
                <Card className="border-orange-200 bg-orange-50/50 dark:bg-orange-950/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
                      <AlertCircle className="h-5 w-5" />
                      Action Required
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-orange-500/10 p-2">
                        <Package className="h-4 w-4 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{stats.lowStockProducts} products low stock</p>
                        <Button variant="link" className="h-auto p-0 text-xs" asChild>
                          <Link href="/vendor/products">View products →</Link>
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-orange-500/10 p-2">
                        <Clock className="h-4 w-4 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{dashboardStats.pendingOrders} orders pending</p>
                        <Button variant="link" className="h-auto p-0 text-xs" asChild>
                          <Link href="/vendor/orders">Process orders →</Link>
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-orange-500/10 p-2">
                        <MessageSquare className="h-4 w-4 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">5 customer messages</p>
                        <Button variant="link" className="h-auto p-0 text-xs" asChild>
                          <Link href="/vendor/messages">Reply now →</Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                      <Target className="h-5 w-5" />
                      Performance Goals
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium">Monthly Sales</p>
                        <p className="text-sm text-muted-foreground">₦{stats.totalRevenue.toLocaleString()}</p>
                      </div>
                      <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600" style={{width: '100%'}}></div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Total revenue this month</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium">Active Products</p>
                        <p className="text-sm text-muted-foreground">{stats.activeProducts}/{stats.totalProducts}</p>
                      </div>
                      <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600" style={{width: `${stats.totalProducts > 0 ? (stats.activeProducts / stats.totalProducts * 100) : 0}%`}}></div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Products currently active</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium">Order Fulfillment</p>
                        <p className="text-sm text-muted-foreground">{dashboardStats.totalOrders > 0 ? Math.round((dashboardStats.completedOrders / dashboardStats.totalOrders) * 100) : 0}%</p>
                      </div>
                      <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
                        <div className="h-full bg-green-600" style={{width: `${dashboardStats.totalOrders > 0 ? (dashboardStats.completedOrders / dashboardStats.totalOrders * 100) : 0}%`}}></div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{dashboardStats.completedOrders} of {dashboardStats.totalOrders} orders completed</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
                      <TrendingUp className="h-5 w-5" />
                      Quick Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <p className="text-sm">Completed Orders</p>
                      </div>
                      <p className="text-sm font-bold">{dashboardStats.completedOrders}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-blue-600" />
                        <p className="text-sm">In Transit</p>
                      </div>
                      <p className="text-sm font-bold">{dashboardStats.inTransitOrders}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <p className="text-sm">Cancelled</p>
                      </div>
                      <p className="text-sm font-bold">{dashboardStats.cancelledOrders}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-600" />
                        <p className="text-sm">Total Reviews</p>
                      </div>
                      <p className="text-sm font-bold">{dashboardStats.totalReviews}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                {/* Recent Orders */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Recent Orders</CardTitle>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/vendor/orders">View All</Link>
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {recentOrders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${
                            order.status === 'pending' ? 'bg-orange-500' :
                            order.status === 'processing' ? 'bg-blue-500' :
                            'bg-green-500'
                          }`} />
                          <div>
                            <p className="font-medium">{order.id}</p>
                            <p className="text-sm text-muted-foreground">{order.customer}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">₦{order.total.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground capitalize">{order.status}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Top Products */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Top Selling Products</CardTitle>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/vendor/analytics">View All</Link>
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {topProducts.length > 0 ? (
                      topProducts.map((product, index) => (
                        <div key={product.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded bg-muted flex items-center justify-center overflow-hidden">
                              {product.image ? (
                                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                              ) : (
                                <Package className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-sm text-muted-foreground">{product.sold} sold</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">₦{product.revenue.toLocaleString()}</p>
                            <p className={`text-xs flex items-center justify-end ${
                              index === 0 ? 'text-green-600' : index === 1 ? 'text-blue-600' : 'text-orange-600'
                            }`}>
                              {index === 0 && <TrendingUp className="h-3 w-3 mr-1" />}
                              {index === 1 && <ArrowUpRight className="h-3 w-3 mr-1" />}
                              {index === 2 && <ArrowDownRight className="h-3 w-3 mr-1" />}
                              #{index + 1}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No sales data yet</p>
                        <p className="text-xs">Start selling to see your top products here</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default function VendorDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={["vendor"]}>
      <VendorDashboardContent />
    </ProtectedRoute>
  )
}

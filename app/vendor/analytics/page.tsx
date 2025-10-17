"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/firebase/auth-context"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ProtectedRoute } from "@/lib/firebase/protected-route"
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  TrendingUp,
  Megaphone,
  StoreIcon,
  DollarSign,
  Eye,
  Download,
  Loader2,
  ArrowUp,
  ArrowDown,
  Calendar,
  Users,
  BarChart3,
} from "lucide-react"
import Link from "next/link"
import { Line, LineChart, Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface AnalyticsData {
  totalRevenue: number
  totalOrders: number
  avgOrderValue: number
  storeViews: number
  totalProducts: number
  activeProducts: number
  salesData: Array<{ date: string; revenue: number; orders: number }>
  topProducts: Array<{ id: string; name: string; image: string; sales: number; revenue: number }>
  recentOrders: Array<{ id: string; customerName: string; total: number; status: string; date: Date }>
  conversionFunnel: {
    storeVisits: number
    productViews: number
    addToCart: number
    checkout: number
    purchase: number
  }
  growthMetrics: {
    revenueGrowth: number
    ordersGrowth: number
    avgOrderValueGrowth: number
    viewsGrowth: number
  }
}

function VendorAnalyticsContent() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [period, setPeriod] = useState("30") // days
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    if (user) {
      fetchAnalytics()
    }
  }, [user, period])

  const fetchAnalytics = async () => {
    if (!user) return

    setLoading(true)
    try {
      const response = await fetch(`/api/vendor/analytics?vendorId=${user.uid}&period=${period}`)
      const data = await response.json()

      if (data.success) {
        setAnalytics(data.analytics)
      } else {
        toast.error(data.error || "Failed to fetch analytics")
      }
    } catch (error) {
      console.error("Error fetching analytics:", error)
      toast.error("Failed to load analytics data")
    } finally {
      setLoading(false)
    }
  }

  const exportReport = () => {
    setExporting(true)
    try {
      // Create CSV content
      const csvContent = [
        ["Metric", "Value"],
        ["Total Revenue", `₦${analytics?.totalRevenue.toLocaleString()}`],
        ["Total Orders", analytics?.totalOrders],
        ["Average Order Value", `₦${analytics?.avgOrderValue.toLocaleString()}`],
        ["Store Views", analytics?.storeViews],
        ["Total Products", analytics?.totalProducts],
        ["Active Products", analytics?.activeProducts],
        [""],
        ["Top Products"],
        ["Product Name", "Sales", "Revenue"],
        ...(analytics?.topProducts.map((p) => [p.name, p.sales, `₦${p.revenue.toLocaleString()}`]) || []),
      ]
        .map((row) => row.join(","))
        .join("\n")

      // Create download link
      const blob = new Blob([csvContent], { type: "text/csv" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `analytics-report-${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast.success("Report exported successfully!")
    } catch (error) {
      console.error("Export error:", error)
      toast.error("Failed to export report")
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 bg-muted/30 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading analytics...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
              <div>
                <h1 className="text-3xl font-bold">Sales Analytics</h1>
                <p className="text-muted-foreground">Track your store performance and insights</p>
              </div>
              <div className="flex gap-3 flex-wrap">
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger className="w-[180px]">
                    <Calendar className="mr-2 h-4 w-4" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                    <SelectItem value="365">Last year</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={exportReport} disabled={exporting}>
                  {exporting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Export Report
                </Button>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-4">
            {/* Sidebar */}
            <aside className="space-y-2">
              <Link href="/vendor/dashboard">
                <Button variant="ghost" className="w-full justify-start">
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
                <Button variant="default" className="w-full justify-start">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Analytics
                </Button>
              </Link>
             
              <Link href="/vendor/store">
                <Button variant="ghost" className="w-full justify-start">
                  <StoreIcon className="mr-2 h-4 w-4" />
                  Store Settings
                </Button>
              </Link>
            </aside>

            {/* Main Content */}
            <div className="lg:col-span-3 space-y-6">
              {/* Key Metrics */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Revenue</p>
                        <p className="text-2xl font-bold">₦{analytics?.totalRevenue.toLocaleString()}</p>
                        <div className="flex items-center gap-1 mt-1">
                          {analytics?.growthMetrics.revenueGrowth >= 0 ? (
                            <ArrowUp className="h-3 w-3 text-green-600" />
                          ) : (
                            <ArrowDown className="h-3 w-3 text-red-600" />
                          )}
                          <p className={`text-xs ${
                            analytics?.growthMetrics.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {Math.abs(analytics?.growthMetrics.revenueGrowth || 0).toFixed(1)}% from previous period
                          </p>
                        </div>
                      </div>
                      <div className="rounded-full bg-green-500/10 p-3">
                        <DollarSign className="h-5 w-5 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Orders</p>
                        <p className="text-2xl font-bold">{analytics?.totalOrders}</p>
                        <div className="flex items-center gap-1 mt-1">
                          {analytics?.growthMetrics.ordersGrowth >= 0 ? (
                            <ArrowUp className="h-3 w-3 text-green-600" />
                          ) : (
                            <ArrowDown className="h-3 w-3 text-red-600" />
                          )}
                          <p className={`text-xs ${
                            analytics?.growthMetrics.ordersGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {Math.abs(analytics?.growthMetrics.ordersGrowth || 0).toFixed(1)}% from previous period
                          </p>
                        </div>
                      </div>
                      <div className="rounded-full bg-blue-500/10 p-3">
                        <ShoppingCart className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Avg Order Value</p>
                        <p className="text-2xl font-bold">₦{analytics?.avgOrderValue.toLocaleString()}</p>
                        <div className="flex items-center gap-1 mt-1">
                          {analytics?.growthMetrics.avgOrderValueGrowth >= 0 ? (
                            <ArrowUp className="h-3 w-3 text-green-600" />
                          ) : (
                            <ArrowDown className="h-3 w-3 text-red-600" />
                          )}
                          <p className={`text-xs ${
                            analytics?.growthMetrics.avgOrderValueGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {Math.abs(analytics?.growthMetrics.avgOrderValueGrowth || 0).toFixed(1)}% from previous period
                          </p>
                        </div>
                      </div>
                      <div className="rounded-full bg-purple-500/10 p-3">
                        <TrendingUp className="h-5 w-5 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Store Views</p>
                        <p className="text-2xl font-bold">{analytics?.storeViews.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {analytics?.activeProducts} active products
                        </p>
                      </div>
                      <div className="rounded-full bg-orange-500/10 p-3">
                        <Eye className="h-5 w-5 text-orange-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Revenue Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Revenue & Orders Trend</CardTitle>
                  <CardDescription>
                    Daily performance over the selected period
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {analytics?.salesData && analytics.salesData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={analytics.salesData}>
                        <XAxis dataKey="date" stroke="#888888" fontSize={12} />
                        <YAxis stroke="#888888" fontSize={12} />
                        <Tooltip
                          formatter={(value: any, name: string) => [
                            name === "Revenue (₦)" ? `₦${value.toLocaleString()}` : value,
                            name,
                          ]}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="revenue"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          name="Revenue (₦)"
                          dot={{ r: 3 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="orders"
                          stroke="#10b981"
                          strokeWidth={2}
                          name="Orders"
                          dot={{ r: 3 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                      <div className="text-center">
                        <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No sales data available for this period</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Top Products */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Selling Products</CardTitle>
                  <CardDescription>
                    Your best performers in the selected period
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {analytics?.topProducts && analytics.topProducts.length > 0 ? (
                    <div className="space-y-4">
                      {analytics.topProducts.map((product, index) => (
                        <div key={product.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                              {index + 1}
                            </div>
                            {product.image && (
                              <img
                                src={product.image}
                                alt={product.name}
                                className="h-12 w-12 rounded object-cover"
                              />
                            )}
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-sm text-muted-foreground">{product.sales} units sold</p>
                            </div>
                          </div>
                          <p className="font-bold">₦{product.revenue.toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No product sales yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Conversion Funnel */}
              <Card>
                <CardHeader>
                  <CardTitle>Conversion Funnel</CardTitle>
                  <CardDescription>
                    Customer journey from visit to purchase
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {analytics?.conversionFunnel ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={[
                          { stage: "Store Visits", count: analytics.conversionFunnel.storeVisits },
                          { stage: "Product Views", count: analytics.conversionFunnel.productViews },
                          { stage: "Add to Cart", count: analytics.conversionFunnel.addToCart },
                          { stage: "Checkout", count: analytics.conversionFunnel.checkout },
                          { stage: "Purchase", count: analytics.conversionFunnel.purchase },
                        ]}
                        layout="vertical"
                      >
                        <XAxis type="number" stroke="#888888" fontSize={12} />
                        <YAxis dataKey="stage" type="category" stroke="#888888" fontSize={12} width={120} />
                        <Tooltip formatter={(value: any) => value.toLocaleString()} />
                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                      <div className="text-center">
                        <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No conversion data available</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default function VendorAnalyticsPage() {
  return (
    <ProtectedRoute allowedRoles={["vendor"]}>
      <VendorAnalyticsContent />
    </ProtectedRoute>
  )
}

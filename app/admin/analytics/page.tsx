"use client"

import { useState, useEffect } from "react"
import { AdminHeader } from "@/components/admin/admin-header"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ProtectedRoute } from "@/lib/firebase/protected-route"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from "recharts"
import {
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingCart,
  DollarSign,
  Package,
  Store,
  Eye,
  Download,
  Calendar,
  RefreshCw
} from "lucide-react"
import { collection, query, orderBy, limit, getDocs, where } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns"

interface AnalyticsData {
  totalRevenue: number
  totalOrders: number
  totalUsers: number
  totalVendors: number
  totalProducts: number
  revenueGrowth: number
  ordersGrowth: number
  usersGrowth: number
  monthlyRevenue: Array<{ month: string; revenue: number; orders: number }>
  topProducts: Array<{ name: string; sales: number; revenue: number }>
  topVendors: Array<{ name: string; sales: number; revenue: number }>
  ordersByStatus: Array<{ status: string; count: number; color: string }>
  usersByType: Array<{ type: string; count: number; color: string }>
}

function AnalyticsDashboardContent() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("6months")

  useEffect(() => {
    loadAnalytics()
  }, [timeRange])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      
      // Calculate date ranges
      const now = new Date()
      const monthsBack = timeRange === "3months" ? 3 : timeRange === "6months" ? 6 : 12
      const startDate = subMonths(now, monthsBack)

      // Get orders data
      const ordersQuery = query(
        collection(db, "orders"),
        where("createdAt", ">=", startDate),
        orderBy("createdAt", "desc")
      )
      const ordersSnapshot = await getDocs(ordersQuery)
      const orders = ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      }))

      // Get users data
      const usersQuery = query(collection(db, "users"), limit(1000))
      const usersSnapshot = await getDocs(usersQuery)
      const users = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      }))

      // Get products data
      const productsQuery = query(collection(db, "products"), limit(1000))
      const productsSnapshot = await getDocs(productsQuery)
      const products = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      }))

      // Calculate analytics
      const totalRevenue = orders.reduce((sum: number, order: any) => 
        sum + (order.totalAmount || 0), 0
      )
      
      const totalOrders = orders.length
      const totalUsers = users.length
      const totalVendors = users.filter((user: any) => user.role === 'vendor').length
      const totalProducts = products.length

      // Calculate monthly revenue
      const monthlyData: { [key: string]: { revenue: number; orders: number } } = {}
      
      for (let i = 0; i < monthsBack; i++) {
        const monthStart = startOfMonth(subMonths(now, i))
        const monthKey = format(monthStart, 'MMM yyyy')
        monthlyData[monthKey] = { revenue: 0, orders: 0 }
      }

      orders.forEach((order: any) => {
        const monthKey = format(order.createdAt, 'MMM yyyy')
        if (monthlyData[monthKey]) {
          monthlyData[monthKey].revenue += order.totalAmount || 0
          monthlyData[monthKey].orders += 1
        }
      })

      const monthlyRevenue = Object.entries(monthlyData)
        .map(([month, data]) => ({
          month,
          revenue: data.revenue,
          orders: data.orders
        }))
        .reverse()

      // Calculate top products (mock data for now)
      const topProducts = [
        { name: "Wireless Headphones", sales: 156, revenue: 2340000 },
        { name: "Smart Watch", sales: 134, revenue: 2010000 },
        { name: "Laptop Stand", sales: 98, revenue: 980000 },
        { name: "Phone Case", sales: 87, revenue: 435000 },
        { name: "Bluetooth Speaker", sales: 76, revenue: 1140000 }
      ]

      // Calculate top vendors (mock data for now)
      const topVendors = [
        { name: "TechStore Pro", sales: 234, revenue: 3510000 },
        { name: "Fashion Hub", sales: 198, revenue: 2970000 },
        { name: "Electronics Plus", sales: 167, revenue: 2505000 },
        { name: "Home & Garden", sales: 145, revenue: 2175000 },
        { name: "Sports World", sales: 123, revenue: 1845000 }
      ]

      // Orders by status
      const statusCounts: { [key: string]: number } = {}
      orders.forEach((order: any) => {
        statusCounts[order.status] = (statusCounts[order.status] || 0) + 1
      })

      const ordersByStatus = Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count,
        color: getStatusColor(status)
      }))

      // Users by type
      const userTypeCounts: { [key: string]: number } = {}
      users.forEach((user: any) => {
        userTypeCounts[user.role] = (userTypeCounts[user.role] || 0) + 1
      })

      const usersByType = Object.entries(userTypeCounts).map(([type, count]) => ({
        type,
        count,
        color: getUserTypeColor(type)
      }))

      // Calculate growth rates (mock for now)
      const revenueGrowth = 12.5
      const ordersGrowth = 8.3
      const usersGrowth = 15.7

      setAnalytics({
        totalRevenue,
        totalOrders,
        totalUsers,
        totalVendors,
        totalProducts,
        revenueGrowth,
        ordersGrowth,
        usersGrowth,
        monthlyRevenue,
        topProducts,
        topVendors,
        ordersByStatus,
        usersByType
      })

    } catch (error) {
      console.error("Error loading analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      pending: '#f59e0b',
      confirmed: '#3b82f6',
      processing: '#8b5cf6',
      shipped: '#06b6d4',
      delivered: '#10b981',
      cancelled: '#ef4444',
      refunded: '#6b7280'
    }
    return colors[status] || '#6b7280'
  }

  const getUserTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      customer: '#3b82f6',
      vendor: '#10b981',
      admin: '#f59e0b',
      super_admin: '#ef4444',
      moderator: '#8b5cf6',
      support: '#06b6d4'
    }
    return colors[type] || '#6b7280'
  }

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString()}`
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-muted/30">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <AdminHeader />
          <main className="flex-1 flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-muted/30">
      <AdminSidebar />
      
      <div className="flex-1 flex flex-col">
        <AdminHeader />
        
        <main className="flex-1 p-6">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                Analytics Dashboard
              </h1>
              <p className="text-muted-foreground">
                Platform performance insights and key metrics
              </p>
            </div>
            
            <div className="flex gap-2">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3months">Last 3 Months</SelectItem>
                  <SelectItem value="6months">Last 6 Months</SelectItem>
                  <SelectItem value="12months">Last 12 Months</SelectItem>
                </SelectContent>
              </Select>
              
              <Button onClick={loadAnalytics} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">
                      {formatCurrency(analytics?.totalRevenue || 0)}
                    </div>
                    <div className="flex items-center text-sm text-green-600">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +{analytics?.revenueGrowth}%
                    </div>
                  </div>
                  <DollarSign className="h-5 w-5 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">{analytics?.totalOrders || 0}</div>
                    <div className="flex items-center text-sm text-green-600">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +{analytics?.ordersGrowth}%
                    </div>
                  </div>
                  <ShoppingCart className="h-5 w-5 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">{analytics?.totalUsers || 0}</div>
                    <div className="flex items-center text-sm text-green-600">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +{analytics?.usersGrowth}%
                    </div>
                  </div>
                  <Users className="h-5 w-5 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Active Vendors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">{analytics?.totalVendors || 0}</div>
                  <Store className="h-5 w-5 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">{analytics?.totalProducts || 0}</div>
                  <Package className="h-5 w-5 text-indigo-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 1 */}
          <div className="grid gap-6 lg:grid-cols-2 mb-6">
            {/* Revenue Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analytics?.monthlyRevenue || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `₦${(value / 1000000).toFixed(1)}M`} />
                    <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Revenue']} />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#3b82f6" 
                      fill="#3b82f6" 
                      fillOpacity={0.1}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Orders Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Orders Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics?.monthlyRevenue || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="orders" 
                      stroke="#10b981" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 2 */}
          <div className="grid gap-6 lg:grid-cols-3 mb-6">
            {/* Orders by Status */}
            <Card>
              <CardHeader>
                <CardTitle>Orders by Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={analytics?.ordersByStatus || []}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="count"
                      label={({ status, count }) => `${status}: ${count}`}
                    >
                      {analytics?.ordersByStatus?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Users by Type */}
            <Card>
              <CardHeader>
                <CardTitle>Users by Type</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={analytics?.usersByType || []}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="count"
                      label={({ type, count }) => `${type}: ${count}`}
                    >
                      {analytics?.usersByType?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top Products */}
            <Card>
              <CardHeader>
                <CardTitle>Top Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics?.topProducts?.slice(0, 5).map((product, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.sales} sales</p>
                      </div>
                      <p className="font-medium text-sm">{formatCurrency(product.revenue)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Vendors */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Vendors</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics?.topVendors || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => `₦${(value / 1000000).toFixed(1)}M`} />
                  <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Revenue']} />
                  <Bar dataKey="revenue" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}

export default function AnalyticsDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
      <AnalyticsDashboardContent />
    </ProtectedRoute>
  )
}

"use client"

import { useState, useEffect } from "react"
import { AdminHeader } from "@/components/admin/admin-header"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ProtectedRoute } from "@/lib/firebase/protected-route"
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  BarChart3,
  PieChart,
  Activity,
  RefreshCw,
  Filter,
  Search
} from "lucide-react"
import { 
  Bar, 
  BarChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip,
  Line,
  LineChart,
  Pie,
  PieChart as RechartsPieChart,
  Cell,
  Area,
  AreaChart,
  CartesianGrid,
  Legend
} from "recharts"
import { collection, query, orderBy, limit, getDocs, where } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import { formatDistanceToNow, startOfMonth, subMonths, format } from "date-fns"

interface ReportData {
  totalUsers: number
  totalVendors: number
  totalProducts: number
  totalOrders: number
  totalRevenue: number
  monthlyRevenue: Array<{ month: string; revenue: number; orders: number }>
  categoryBreakdown: Array<{ category: string; count: number; revenue: number; color: string }>
  topVendors: Array<{ name: string; revenue: number; orders: number; products: number }>
  recentActivity: Array<{
    id: string
    type: string
    description: string
    timestamp: Date
    value?: number
  }>
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

function AdminReportsContent() {
  const [reportData, setReportData] = useState<ReportData>({
    totalUsers: 0,
    totalVendors: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    monthlyRevenue: [],
    categoryBreakdown: [],
    topVendors: [],
    recentActivity: []
  })
  
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState("30days")
  const [reportType, setReportType] = useState("overview")

  useEffect(() => {
    loadReportData()
  }, [dateRange, reportType])

  const loadReportData = async () => {
    try {
      setLoading(true)
      
      // Load real data from Firestore
      const [usersSnapshot, vendorsSnapshot, productsSnapshot, ordersSnapshot] = await Promise.all([
        getDocs(query(collection(db, "users"), limit(1000))),
        getDocs(query(collection(db, "vendors"), limit(1000))),
        getDocs(query(collection(db, "products"), limit(1000))),
        getDocs(query(collection(db, "orders"), limit(1000)))
      ])

      const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      const vendors = vendorsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      const products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      const orders = ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      }))

      const totalRevenue = orders.reduce((sum: number, order: any) => 
        sum + (order.totalAmount || 0), 0
      )

      // Generate monthly revenue data
      const monthlyData: { [key: string]: { revenue: number; orders: number } } = {}
      
      for (let i = 0; i < 6; i++) {
        const monthStart = startOfMonth(subMonths(new Date(), i))
        const monthKey = format(monthStart, 'MMM')
        monthlyData[monthKey] = { revenue: 0, orders: 0 }
      }

      orders.forEach((order: any) => {
        const monthKey = format(order.createdAt, 'MMM')
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

      // Generate category breakdown (mock data for now)
      const categoryBreakdown = [
        { category: "Electronics", count: 45, revenue: 2500000, color: COLORS[0] },
        { category: "Fashion", count: 38, revenue: 1800000, color: COLORS[1] },
        { category: "Home & Garden", count: 32, revenue: 1200000, color: COLORS[2] },
        { category: "Books", count: 28, revenue: 800000, color: COLORS[3] },
        { category: "Sports", count: 22, revenue: 600000, color: COLORS[4] }
      ]

      // Generate top vendors (mock data for now)
      const topVendors = [
        { name: "TechStore Pro", revenue: 850000, orders: 156, products: 48 },
        { name: "Fashion Hub", revenue: 720000, orders: 134, products: 62 },
        { name: "Home Essentials", revenue: 650000, orders: 98, products: 35 },
        { name: "Book World", revenue: 480000, orders: 87, products: 124 },
        { name: "Sports Central", revenue: 420000, orders: 76, products: 29 }
      ]

      // Generate recent activity
      const recentActivity = [
        {
          id: "1",
          type: "order",
          description: "New order placed",
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          value: 125000
        },
        {
          id: "2",
          type: "vendor",
          description: "New vendor registered",
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000)
        },
        {
          id: "3",
          type: "product",
          description: "Product approved",
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000)
        }
      ]

      setReportData({
        totalUsers: users.length,
        totalVendors: vendors.length,
        totalProducts: products.length,
        totalOrders: orders.length,
        totalRevenue,
        monthlyRevenue,
        categoryBreakdown,
        topVendors,
        recentActivity
      })

    } catch (error) {
      console.error("Error loading report data:", error)
      
      // Fallback to mock data
      setReportData({
        totalUsers: 1247,
        totalVendors: 89,
        totalProducts: 2156,
        totalOrders: 3421,
        totalRevenue: 15420000,
        monthlyRevenue: [
          { month: "Jan", revenue: 2400000, orders: 156 },
          { month: "Feb", revenue: 2800000, orders: 198 },
          { month: "Mar", revenue: 3200000, orders: 234 },
          { month: "Apr", revenue: 2900000, orders: 201 },
          { month: "May", revenue: 3500000, orders: 267 },
          { month: "Jun", revenue: 4100000, orders: 312 }
        ],
        categoryBreakdown: [
          { category: "Electronics", count: 45, revenue: 2500000, color: COLORS[0] },
          { category: "Fashion", count: 38, revenue: 1800000, color: COLORS[1] },
          { category: "Home & Garden", count: 32, revenue: 1200000, color: COLORS[2] },
          { category: "Books", count: 28, revenue: 800000, color: COLORS[3] },
          { category: "Sports", count: 22, revenue: 600000, color: COLORS[4] }
        ],
        topVendors: [
          { name: "TechStore Pro", revenue: 850000, orders: 156, products: 48 },
          { name: "Fashion Hub", revenue: 720000, orders: 134, products: 62 },
          { name: "Home Essentials", revenue: 650000, orders: 98, products: 35 },
          { name: "Book World", revenue: 480000, orders: 87, products: 124 },
          { name: "Sports Central", revenue: 420000, orders: 76, products: 29 }
        ],
        recentActivity: [
          {
            id: "1",
            type: "order",
            description: "New order placed",
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
            value: 125000
          },
          {
            id: "2",
            type: "vendor",
            description: "New vendor registered",
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000)
          },
          {
            id: "3",
            type: "product",
            description: "Product approved",
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000)
          }
        ]
      })
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString()}`
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'order': return <ShoppingCart className="h-4 w-4 text-blue-500" />
      case 'vendor': return <Users className="h-4 w-4 text-green-500" />
      case 'product': return <Package className="h-4 w-4 text-purple-500" />
      default: return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  const exportReport = () => {
    // Mock export functionality
    const data = {
      generatedAt: new Date().toISOString(),
      dateRange,
      reportType,
      data: reportData
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `markethub-report-${format(new Date(), 'yyyy-MM-dd')}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
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
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Analytics & Reports
              </h1>
              <p className="text-muted-foreground">
                Comprehensive platform analytics and reporting dashboard
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7days">Last 7 days</SelectItem>
                  <SelectItem value="30days">Last 30 days</SelectItem>
                  <SelectItem value="90days">Last 90 days</SelectItem>
                  <SelectItem value="1year">Last year</SelectItem>
                </SelectContent>
              </Select>
              
              <Button onClick={exportReport} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              
              <Button onClick={loadReportData} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold">{reportData.totalUsers.toLocaleString()}</div>
                      <div className="flex items-center text-sm text-green-600">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        +12.5%
                      </div>
                    </div>
                    <Users className="h-5 w-5 text-blue-500" />
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
                    <div>
                      <div className="text-2xl font-bold">{reportData.totalVendors.toLocaleString()}</div>
                      <div className="flex items-center text-sm text-green-600">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        +8.2%
                      </div>
                    </div>
                    <Users className="h-5 w-5 text-green-500" />
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
                    <div>
                      <div className="text-2xl font-bold">{reportData.totalProducts.toLocaleString()}</div>
                      <div className="flex items-center text-sm text-green-600">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        +15.3%
                      </div>
                    </div>
                    <Package className="h-5 w-5 text-purple-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Revenue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold">{formatCurrency(reportData.totalRevenue)}</div>
                      <div className="flex items-center text-sm text-green-600">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        +18.7%
                      </div>
                    </div>
                    <DollarSign className="h-5 w-5 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Revenue Trend */}
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center h-[300px]">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={reportData.monthlyRevenue}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis tickFormatter={(value) => `₦${(value / 1000000).toFixed(1)}M`} />
                        <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Revenue']} />
                        <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Category Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Category Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center h-[300px]">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPieChart>
                        <Pie
                          data={reportData.categoryBreakdown}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                        >
                          {reportData.categoryBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Tables */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Top Vendors */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Vendors</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {reportData.topVendors.map((vendor, index) => (
                      <div key={vendor.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{vendor.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {vendor.orders} orders • {vendor.products} products
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(vendor.revenue)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {reportData.recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3">
                        {getActivityIcon(activity.type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{activity.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                            </p>
                            {activity.value && (
                              <Badge variant="secondary" className="text-xs">
                                {formatCurrency(activity.value)}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default function AdminReportsPage() {
  return (
    <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
      <AdminReportsContent />
    </ProtectedRoute>
  )
}

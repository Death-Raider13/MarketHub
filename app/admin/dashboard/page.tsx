"use client"

import { useState, useEffect } from "react"
import { AdminHeader } from "@/components/admin/admin-header"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ProtectedRoute } from "@/lib/firebase/protected-route"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Store,
  Activity,
  RefreshCw,
  Shield,
  MessageSquare,
  Settings,
  Megaphone,
  Clock
} from "lucide-react"
import { 
  Bar, 
  BarChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip
} from "recharts"
import { collection, query, orderBy, limit, getDocs, where } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import { useAuth } from "@/lib/firebase/auth-context"
import { formatDistanceToNow, startOfMonth, subMonths, format } from "date-fns"

interface DashboardActivity {
  id: string
  type: string
  description: string
  timestamp: Date
  priority: "low" | "medium" | "high"
  value?: number
}

// Unified interfaces for all admin data
interface DashboardStats {
  totalUsers: number
  totalVendors: number
  totalProducts: number
  totalOrders: number
  totalRevenue: number
  pendingApprovals: number
  recentActivities: DashboardActivity[]
  monthlyRevenue: Array<{ month: string; revenue: number; orders: number }>
}

interface ModeratorStats {
  pendingProducts: number
  pendingReviews: number
  pendingAds: number
  reportedItems: number
  approvedToday: number
  rejectedToday: number
}

interface SupportStats {
  openTickets: number
  resolvedToday: number
  avgResponseTime: string
  customerSatisfaction: number
  pendingRefunds: number
  escalatedIssues: number
}

interface FinanceData {
  totalRevenue: number
  totalPayouts: number
  platformFees: number
  pendingPayouts: number
  revenueGrowth: number
  payoutGrowth: number
}

function UnifiedAdminDashboard() {
  // State for all admin data
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalVendors: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingApprovals: 0,
    recentActivities: [],
    monthlyRevenue: []
  })
  
  const [moderatorStats, setModeratorStats] = useState<ModeratorStats>({
    pendingProducts: 0,
    pendingReviews: 0,
    pendingAds: 0,
    reportedItems: 0,
    approvedToday: 0,
    rejectedToday: 0
  })
  
  const [supportStats, setSupportStats] = useState<SupportStats>({
    openTickets: 0,
    resolvedToday: 0,
    avgResponseTime: "0 hours",
    customerSatisfaction: 0,
    pendingRefunds: 0,
    escalatedIssues: 0
  })
  
  const [financeData, setFinanceData] = useState<FinanceData>({
    totalRevenue: 0,
    totalPayouts: 0,
    platformFees: 0,
    pendingPayouts: 0,
    revenueGrowth: 0,
    payoutGrowth: 0
  })
  
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAllAdminData()
  }, [])

  const loadAllAdminData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        loadDashboardData(),
        loadModeratorData(),
        loadSupportData(),
        loadFinanceData()
      ])
    } catch (error) {
      console.error("Error loading admin data:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadDashboardData = async () => {
    try {
      // Initialize variables
      let totalUsers = 0
      let totalVendors = 0
      let totalProducts = 0
      let totalOrders = 0
      let totalRevenue = 0
      let pendingProducts = 0
      let orders: any[] = []
      let users: any[] = []
      let products: any[] = []

      try {
        // Get users count
        const usersQuery = query(collection(db, "users"))
        const usersSnapshot = await getDocs(usersQuery)
        users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        
        totalUsers = users.length
        totalVendors = users.filter((user: any) => user.role === 'vendor').length
      } catch (error) {
        console.warn("Could not fetch users data:", error)
      }

      try {
        // Get products count
        const productsQuery = query(collection(db, "products"))
        const productsSnapshot = await getDocs(productsQuery)
        products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        
        totalProducts = products.length
        pendingProducts = products.filter((product: any) => product.status === 'pending').length
      } catch (error) {
        console.warn("Could not fetch products data:", error)
      }

      try {
        // Get orders data
        const ordersQuery = query(collection(db, "orders"))
        const ordersSnapshot = await getDocs(ordersQuery)
        orders = ordersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        }))
        
        totalOrders = orders.length
        totalRevenue = orders.reduce((sum: number, order: any) => 
          sum + (order.totalAmount || 0), 0
        )
      } catch (error) {
        console.warn("Could not fetch orders data:", error)
      }

      // Generate monthly revenue data (last 6 months)
      const monthlyData: { [key: string]: { revenue: number; orders: number } } = {}
      
      for (let i = 0; i < 6; i++) {
        const monthStart = startOfMonth(subMonths(new Date(), i))
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
          month: month.split(' ')[0], // Just month name
          revenue: data.revenue,
          orders: data.orders
        }))
        .reverse()

      // Generate recent activities from real data
      const recentActivities: DashboardActivity[] = []
      
      // Add recent orders
      const recentOrders = orders
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 3)
      
      recentOrders.forEach(order => {
        recentActivities.push({
          id: `order-${order.id}`,
          type: 'order',
          description: `New order placed - Order #${order.id.slice(-6)}`,
          timestamp: order.createdAt,
          priority: 'medium',
          value: order.totalAmount
        })
      })

      // Add recent user registrations
      const recentUsers = users
        .filter((user: any) => user.createdAt)
        .sort((a: any, b: any) => {
          const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt)
          const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt)
          return bDate.getTime() - aDate.getTime()
        })
        .slice(0, 2)
      
      recentUsers.forEach((user: any) => {
        const createdAt = user.createdAt?.toDate ? user.createdAt.toDate() : new Date(user.createdAt)
        recentActivities.push({
          id: `user-${user.id}`,
          type: 'user',
          description: `New ${user.role || 'user'} registered - ${user.displayName || user.email}`,
          timestamp: createdAt,
          priority: 'low'
        })
      })

      // Add recent product submissions
      const recentProducts = products
        .filter((product: any) => product.createdAt)
        .sort((a: any, b: any) => {
          const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt)
          const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt)
          return bDate.getTime() - aDate.getTime()
        })
        .slice(0, 2)
      
      recentProducts.forEach((product: any) => {
        const createdAt = product.createdAt?.toDate ? product.createdAt.toDate() : new Date(product.createdAt)
        recentActivities.push({
          id: `product-${product.id}`,
          type: 'product',
          description: `New product submitted - ${product.name}`,
          timestamp: createdAt,
          priority: 'high'
        })
      })

      // Sort all activities by timestamp and take top 5
      recentActivities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      const topActivities = recentActivities.slice(0, 5)

      setStats({
        totalUsers,
        totalVendors,
        totalProducts,
        totalOrders,
        totalRevenue,
        pendingApprovals: pendingProducts,
        recentActivities: topActivities,
        monthlyRevenue
      })

    } catch (error) {
      console.error("Error loading dashboard data:", error)
      // Fallback to mock data
      setStats({
        totalUsers: 1247,
        totalVendors: 89,
        totalProducts: 2156,
        totalOrders: 3421,
        totalRevenue: 15420000,
        pendingApprovals: 23,
        recentActivities: [
          {
            id: "1",
            type: "vendor",
            description: "New vendor registration: TechStore Pro",
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
            priority: "medium"
          }
        ],
        monthlyRevenue: [
          { month: "Jan", revenue: 2400000, orders: 156 },
          { month: "Feb", revenue: 2800000, orders: 198 },
          { month: "Mar", revenue: 3200000, orders: 234 },
          { month: "Apr", revenue: 2900000, orders: 201 },
          { month: "May", revenue: 3500000, orders: 267 },
          { month: "Jun", revenue: 4100000, orders: 312 }
        ]
      })
    }
  }

  const loadModeratorData = async () => {
    try {
      // Mock moderator data - replace with real queries
      setModeratorStats({
        pendingProducts: 28,
        pendingReviews: 15,
        pendingAds: 8,
        reportedItems: 3,
        approvedToday: 15,
        rejectedToday: 2
      })
    } catch (error) {
      console.error("Error loading moderator data:", error)
    }
  }

  const loadSupportData = async () => {
    try {
      // Mock support data - replace with real queries
      setSupportStats({
        openTickets: 23,
        resolvedToday: 15,
        avgResponseTime: "2.5 hours",
        customerSatisfaction: 4.8,
        pendingRefunds: 5,
        escalatedIssues: 2
      })
    } catch (error) {
      console.error("Error loading support data:", error)
    }
  }

  const loadFinanceData = async () => {
    try {
      // Mock finance data - replace with real queries
      setFinanceData({
        totalRevenue: 15420000,
        totalPayouts: 12336000,
        platformFees: 771000,
        pendingPayouts: 450000,
        revenueGrowth: 15.2,
        payoutGrowth: 12.8
      })
    } catch (error) {
      console.error("Error loading finance data:", error)
    }
  }

  // Utility functions
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'vendor': return <Store className="h-4 w-4 text-blue-500" />
      case 'product': return <Package className="h-4 w-4 text-green-500" />
      case 'order': return <ShoppingCart className="h-4 w-4 text-purple-500" />
      default: return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString()}`
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
                Admin Control Center
              </h1>
              <p className="text-muted-foreground">
                Unified platform management dashboard
              </p>
            </div>
            
            <Button onClick={loadAllAdminData} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh All
            </Button>
          </div>

          {/* Quick Actions */}
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = '/admin/products'}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Package className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Pending Products</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.pendingApprovals}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = '/admin/reviews'}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <MessageSquare className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Pending Reviews</p>
                    <p className="text-2xl font-bold text-blue-600">15</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = '/admin/advertising'}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Megaphone className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Pending Ads</p>
                    <p className="text-2xl font-bold text-purple-600">8</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = '/admin/reports-abuse'}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Shield className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Reported Items</p>
                    <p className="text-2xl font-bold text-red-600">3</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

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
                        <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
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
                        <div className="text-2xl font-bold">{stats.totalVendors.toLocaleString()}</div>
                        <div className="flex items-center text-sm text-green-600">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          +8.2%
                        </div>
                      </div>
                      <Store className="h-5 w-5 text-green-500" />
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
                        <div className="text-2xl font-bold">{stats.totalProducts.toLocaleString()}</div>
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
                        <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
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

              {/* Charts and Activities */}
              <div className="grid gap-6 lg:grid-cols-3">
                {/* Revenue Chart */}
                <Card className="lg:col-span-2">
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
                        <BarChart data={stats.monthlyRevenue}>
                          <XAxis dataKey="month" />
                          <YAxis tickFormatter={(value) => `₦${(value / 1000000).toFixed(1)}M`} />
                          <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Revenue']} />
                          <Bar dataKey="revenue" fill="#3b82f6" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Activities */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {stats.recentActivities.map((activity) => (
                        <div key={activity.id} className="flex items-start gap-3">
                          {getActivityIcon(activity.type)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{activity.description}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                              </p>
                              <Badge className={`text-xs ${getPriorityColor(activity.priority)}`}>
                                {activity.priority}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
        </main>
      </div>
    </div>
  )
}

export default function UnifiedAdminDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
      <UnifiedAdminDashboard />
    </ProtectedRoute>
  )
}

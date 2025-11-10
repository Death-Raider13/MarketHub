"use client"

import { useState, useEffect } from "react"
import { AdminHeader } from "@/components/admin/admin-header"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Wallet,
  RefreshCw,
  Download,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Banknote,
  Receipt
} from "lucide-react"
import { collection, query, orderBy, limit, getDocs, where } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import { startOfMonth, endOfMonth, subMonths, format, startOfDay, endOfDay } from "date-fns"

interface FinanceData {
  totalRevenue: number
  totalPayouts: number
  platformFees: number
  pendingPayouts: number
  revenueGrowth: number
  payoutGrowth: number
  monthlyRevenue: Array<{ month: string; revenue: number; payouts: number; fees: number }>
  revenueByCategory: Array<{ category: string; revenue: number; color: string }>
  topVendorsByRevenue: Array<{ name: string; revenue: number; orders: number }>
  recentTransactions: Array<{
    id: string
    type: 'payment' | 'payout' | 'fee' | 'refund'
    amount: number
    vendor?: string
    customer?: string
    status: string
    date: Date
  }>
  paymentMethods: Array<{ method: string; count: number; revenue: number }>
}

function FinanceDashboardContent() {
  const [financeData, setFinanceData] = useState<FinanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("6months")
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    loadFinanceData()
  }, [timeRange])

  const loadFinanceData = async () => {
    try {
      setLoading(true)
      
      // Calculate date ranges
      const now = new Date()
      const monthsBack = timeRange === "3months" ? 3 : timeRange === "6months" ? 6 : 12
      const startDate = subMonths(now, monthsBack)

      // Get orders data for revenue calculation
      const ordersQuery = query(
        collection(db, "orders"),
        where("createdAt", ">=", startDate),
        where("paymentStatus", "==", "paid"),
        orderBy("createdAt", "desc")
      )
      const ordersSnapshot = await getDocs(ordersQuery)
      const orders = ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      }))

      // Get payouts data
      const payoutsQuery = query(
        collection(db, "payouts"),
        where("createdAt", ">=", startDate),
        orderBy("createdAt", "desc")
      )
      const payoutsSnapshot = await getDocs(payoutsQuery)
      const payouts = payoutsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      }))

      // Calculate totals
      const totalRevenue = orders.reduce((sum: number, order: any) => 
        sum + (order.totalAmount || 0), 0
      )
      
      const totalPayouts = payouts.reduce((sum: number, payout: any) => 
        sum + (payout.amount || 0), 0
      )
      
      const platformFeeRate = 0.05 // 5% platform fee
      const platformFees = totalRevenue * platformFeeRate
      
      const pendingPayouts = payouts
        .filter((payout: any) => payout.status === 'pending')
        .reduce((sum: number, payout: any) => sum + (payout.amount || 0), 0)

      // Calculate monthly data
      const monthlyData: { [key: string]: { revenue: number; payouts: number; fees: number } } = {}
      
      for (let i = 0; i < monthsBack; i++) {
        const monthStart = startOfMonth(subMonths(now, i))
        const monthKey = format(monthStart, 'MMM yyyy')
        monthlyData[monthKey] = { revenue: 0, payouts: 0, fees: 0 }
      }

      orders.forEach((order: any) => {
        const monthKey = format(order.createdAt, 'MMM yyyy')
        if (monthlyData[monthKey]) {
          monthlyData[monthKey].revenue += order.totalAmount || 0
          monthlyData[monthKey].fees += (order.totalAmount || 0) * platformFeeRate
        }
      })

      payouts.forEach((payout: any) => {
        const monthKey = format(payout.createdAt, 'MMM yyyy')
        if (monthlyData[monthKey]) {
          monthlyData[monthKey].payouts += payout.amount || 0
        }
      })

      const monthlyRevenue = Object.entries(monthlyData)
        .map(([month, data]) => ({
          month,
          revenue: data.revenue,
          payouts: data.payouts,
          fees: data.fees
        }))
        .reverse()

      // Revenue by category (mock data for now)
      const revenueByCategory = [
        { category: "Electronics", revenue: totalRevenue * 0.35, color: "#3b82f6" },
        { category: "Clothing", revenue: totalRevenue * 0.25, color: "#10b981" },
        { category: "Home & Garden", revenue: totalRevenue * 0.20, color: "#f59e0b" },
        { category: "Books", revenue: totalRevenue * 0.10, color: "#8b5cf6" },
        { category: "Sports", revenue: totalRevenue * 0.10, color: "#ef4444" }
      ]

      // Top vendors by revenue (mock data)
      const topVendorsByRevenue = [
        { name: "TechStore Pro", revenue: totalRevenue * 0.15, orders: 234 },
        { name: "Fashion Hub", revenue: totalRevenue * 0.12, orders: 198 },
        { name: "Electronics Plus", revenue: totalRevenue * 0.10, orders: 167 },
        { name: "Home Essentials", revenue: totalRevenue * 0.08, orders: 145 },
        { name: "Sports World", revenue: totalRevenue * 0.07, orders: 123 }
      ]

      // Recent transactions (mix of real and mock data)
      const recentTransactions = [
        {
          id: "txn1",
          type: "payment" as const,
          amount: 250000,
          customer: "John Doe",
          status: "completed",
          date: new Date(Date.now() - 2 * 60 * 60 * 1000)
        },
        {
          id: "txn2",
          type: "payout" as const,
          amount: 180000,
          vendor: "TechStore Pro",
          status: "completed",
          date: new Date(Date.now() - 4 * 60 * 60 * 1000)
        },
        {
          id: "txn3",
          type: "fee" as const,
          amount: 12500,
          vendor: "Fashion Hub",
          status: "collected",
          date: new Date(Date.now() - 6 * 60 * 60 * 1000)
        },
        {
          id: "txn4",
          type: "refund" as const,
          amount: 75000,
          customer: "Jane Smith",
          status: "processed",
          date: new Date(Date.now() - 8 * 60 * 60 * 1000)
        }
      ]

      // Payment methods distribution
      const paymentMethods = [
        { method: "Card Payment", count: Math.floor(orders.length * 0.6), revenue: totalRevenue * 0.6 },
        { method: "Bank Transfer", count: Math.floor(orders.length * 0.25), revenue: totalRevenue * 0.25 },
        { method: "USSD", count: Math.floor(orders.length * 0.10), revenue: totalRevenue * 0.10 },
        { method: "QR Code", count: Math.floor(orders.length * 0.05), revenue: totalRevenue * 0.05 }
      ]

      // Calculate growth rates (mock for now)
      const revenueGrowth = 15.2
      const payoutGrowth = 12.8

      setFinanceData({
        totalRevenue,
        totalPayouts,
        platformFees,
        pendingPayouts,
        revenueGrowth,
        payoutGrowth,
        monthlyRevenue,
        revenueByCategory,
        topVendorsByRevenue,
        recentTransactions,
        paymentMethods
      })

    } catch (error) {
      console.error("Error loading finance data:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString()}`
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'payment': return <ArrowUpRight className="h-4 w-4 text-green-500" />
      case 'payout': return <ArrowDownRight className="h-4 w-4 text-blue-500" />
      case 'fee': return <Receipt className="h-4 w-4 text-purple-500" />
      case 'refund': return <ArrowDownRight className="h-4 w-4 text-red-500" />
      default: return <DollarSign className="h-4 w-4 text-gray-500" />
    }
  }

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'payment': return 'text-green-600'
      case 'payout': return 'text-blue-600'
      case 'fee': return 'text-purple-600'
      case 'refund': return 'text-red-600'
      default: return 'text-gray-600'
    }
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
              <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                Finance Dashboard
              </h1>
              <p className="text-muted-foreground">
                Monitor revenue, payouts, and financial performance
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
              
              <Button onClick={loadFinanceData} variant="outline">
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
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
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
                      {formatCurrency(financeData?.totalRevenue || 0)}
                    </div>
                    <div className="flex items-center text-sm text-green-600">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +{financeData?.revenueGrowth}%
                    </div>
                  </div>
                  <DollarSign className="h-5 w-5 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Payouts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">
                      {formatCurrency(financeData?.totalPayouts || 0)}
                    </div>
                    <div className="flex items-center text-sm text-blue-600">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +{financeData?.payoutGrowth}%
                    </div>
                  </div>
                  <Wallet className="h-5 w-5 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Platform Fees
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">
                    {formatCurrency(financeData?.platformFees || 0)}
                  </div>
                  <Receipt className="h-5 w-5 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pending Payouts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-orange-600">
                    {formatCurrency(financeData?.pendingPayouts || 0)}
                  </div>
                  <CreditCard className="h-5 w-5 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="revenue">Revenue</TabsTrigger>
              <TabsTrigger value="payouts">Payouts</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Revenue Trend */}
              <Card>
                <CardHeader>
                  <CardTitle>Revenue & Payouts Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={financeData?.monthlyRevenue || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => `₦${(value / 1000000).toFixed(1)}M`} />
                      <Tooltip formatter={(value) => [formatCurrency(Number(value)), '']} />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stackId="1"
                        stroke="#10b981" 
                        fill="#10b981" 
                        fillOpacity={0.6}
                        name="Revenue"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="payouts" 
                        stackId="2"
                        stroke="#3b82f6" 
                        fill="#3b82f6" 
                        fillOpacity={0.6}
                        name="Payouts"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="grid gap-6 lg:grid-cols-2">
                {/* Revenue by Category */}
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue by Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={financeData?.revenueByCategory || []}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="revenue"
                          label={({ category, revenue }) => `${category}: ${formatCurrency(revenue)}`}
                        >
                          {financeData?.revenueByCategory?.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Revenue']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Top Vendors */}
                <Card>
                  <CardHeader>
                    <CardTitle>Top Vendors by Revenue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {financeData?.topVendorsByRevenue?.map((vendor, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{vendor.name}</p>
                            <p className="text-sm text-muted-foreground">{vendor.orders} orders</p>
                          </div>
                          <p className="font-medium">{formatCurrency(vendor.revenue)}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="revenue" className="space-y-6">
              {/* Monthly Revenue Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Revenue Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={financeData?.monthlyRevenue || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => `₦${(value / 1000000).toFixed(1)}M`} />
                      <Tooltip formatter={(value) => [formatCurrency(Number(value)), '']} />
                      <Legend />
                      <Bar dataKey="revenue" fill="#10b981" name="Gross Revenue" />
                      <Bar dataKey="fees" fill="#8b5cf6" name="Platform Fees" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Payment Methods */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Methods Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Payment Method</TableHead>
                        <TableHead>Transactions</TableHead>
                        <TableHead>Revenue</TableHead>
                        <TableHead>Percentage</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {financeData?.paymentMethods?.map((method, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{method.method}</TableCell>
                          <TableCell>{method.count.toLocaleString()}</TableCell>
                          <TableCell>{formatCurrency(method.revenue)}</TableCell>
                          <TableCell>
                            {((method.revenue / (financeData?.totalRevenue || 1)) * 100).toFixed(1)}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payouts" className="space-y-6">
              {/* Payout Status */}
              <div className="grid gap-6 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Completed Payouts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency((financeData?.totalPayouts || 0) - (financeData?.pendingPayouts || 0))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Pending Payouts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">
                      {formatCurrency(financeData?.pendingPayouts || 0)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Payout Rate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {financeData?.totalRevenue 
                        ? ((financeData.totalPayouts / financeData.totalRevenue) * 100).toFixed(1)
                        : '0'}%
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Monthly Payouts */}
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Payouts</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={financeData?.monthlyRevenue || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => `₦${(value / 1000000).toFixed(1)}M`} />
                      <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Payouts']} />
                      <Line 
                        type="monotone" 
                        dataKey="payouts" 
                        stroke="#3b82f6" 
                        strokeWidth={3}
                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="transactions" className="space-y-6">
              {/* Recent Transactions */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Party</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {financeData?.recentTransactions?.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getTransactionIcon(transaction.type)}
                              <span className="capitalize font-medium">{transaction.type}</span>
                            </div>
                          </TableCell>
                          <TableCell className={`font-medium ${getTransactionColor(transaction.type)}`}>
                            {transaction.type === 'payment' ? '+' : '-'}{formatCurrency(transaction.amount)}
                          </TableCell>
                          <TableCell>
                            {transaction.vendor || transaction.customer || 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{transaction.status}</Badge>
                          </TableCell>
                          <TableCell>
                            {format(transaction.date, 'MMM dd, HH:mm')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}

export default function FinanceDashboardPage() {
  return (
    <ProtectedRoute requiredPermission="finance.view">
      <FinanceDashboardContent />
    </ProtectedRoute>
  )
}

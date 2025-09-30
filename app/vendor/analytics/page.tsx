"use client"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
} from "lucide-react"
import Link from "next/link"
import { Line, LineChart, Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts"

const salesData = [
  { date: "Jan", revenue: 4200, orders: 42 },
  { date: "Feb", revenue: 5800, orders: 58 },
  { date: "Mar", revenue: 4500, orders: 45 },
  { date: "Apr", revenue: 6100, orders: 61 },
  { date: "May", revenue: 5800, orders: 58 },
  { date: "Jun", revenue: 7300, orders: 73 },
]

const topProducts = [
  { name: "Wireless Headphones", sales: 234, revenue: 46800 },
  { name: "Smart Watch", sales: 189, revenue: 37800 },
  { name: "Laptop Stand", sales: 156, revenue: 7800 },
  { name: "USB-C Cable", sales: 423, revenue: 8460 },
]

function VendorAnalyticsContent() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Sales Analytics</h1>
              <p className="text-muted-foreground">Track your store performance and insights</p>
            </div>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
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
              <Link href="/vendor/advertising">
                <Button variant="ghost" className="w-full justify-start">
                  <Megaphone className="mr-2 h-4 w-4" />
                  Advertising
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
              <div className="grid gap-4 sm:grid-cols-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Revenue</p>
                        <p className="text-2xl font-bold">$33,700</p>
                        <p className="text-xs text-green-600 mt-1">+12.5% from last month</p>
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
                        <p className="text-2xl font-bold">337</p>
                        <p className="text-xs text-green-600 mt-1">+8.2% from last month</p>
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
                        <p className="text-sm text-muted-foreground">Avg Order Value</p>
                        <p className="text-2xl font-bold">$100.00</p>
                        <p className="text-xs text-green-600 mt-1">+3.8% from last month</p>
                      </div>
                      <div className="rounded-full bg-purple-500/10 p-3">
                        <TrendingUp className="h-5 w-5 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Store Views</p>
                        <p className="text-2xl font-bold">12,458</p>
                        <p className="text-xs text-green-600 mt-1">+24.5% from last month</p>
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
                  <CardTitle>Revenue & Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={salesData}>
                      <XAxis dataKey="date" stroke="#888888" fontSize={12} />
                      <YAxis stroke="#888888" fontSize={12} />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        name="Revenue ($)"
                      />
                      <Line type="monotone" dataKey="orders" stroke="#10b981" strokeWidth={2} name="Orders" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Top Products */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Selling Products</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topProducts.map((product, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-muted-foreground">{product.sales} sales</p>
                          </div>
                        </div>
                        <p className="font-bold">${product.revenue.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Conversion Funnel */}
              <Card>
                <CardHeader>
                  <CardTitle>Conversion Funnel</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={[
                        { stage: "Store Visits", count: 12458 },
                        { stage: "Product Views", count: 8920 },
                        { stage: "Add to Cart", count: 2340 },
                        { stage: "Checkout", count: 890 },
                        { stage: "Purchase", count: 337 },
                      ]}
                      layout="vertical"
                    >
                      <XAxis type="number" stroke="#888888" fontSize={12} />
                      <YAxis dataKey="stage" type="category" stroke="#888888" fontSize={12} width={120} />
                      <Tooltip />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
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

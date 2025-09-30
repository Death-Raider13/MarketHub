"use client"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ProtectedRoute } from "@/lib/firebase/protected-route"
import { LayoutDashboard, Package, ShoppingCart, TrendingUp, Megaphone, StoreIcon, Eye } from "lucide-react"
import Link from "next/link"
import type { Order } from "@/lib/types"

const mockOrders: Order[] = [
  {
    id: "ORD-001",
    userId: "user1",
    items: [],
    subtotal: 199.99,
    tax: 19.99,
    shipping: 0,
    total: 219.98,
    status: "pending",
    shippingAddress: {
      fullName: "John Doe",
      addressLine1: "123 Main St",
      city: "New York",
      state: "NY",
      zipCode: "10001",
      country: "United States",
      phone: "555-0123",
    },
    paymentMethod: "Credit Card",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "ORD-002",
    userId: "user2",
    items: [],
    subtotal: 89.99,
    tax: 8.99,
    shipping: 9.99,
    total: 108.97,
    status: "processing",
    shippingAddress: {
      fullName: "Jane Smith",
      addressLine1: "456 Oak Ave",
      city: "Los Angeles",
      state: "CA",
      zipCode: "90001",
      country: "United States",
      phone: "555-0456",
    },
    paymentMethod: "Credit Card",
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
  },
]

function VendorOrdersContent() {
  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "delivered":
        return "bg-green-500/10 text-green-600"
      case "shipped":
        return "bg-blue-500/10 text-blue-600"
      case "processing":
        return "bg-yellow-500/10 text-yellow-600"
      case "pending":
        return "bg-gray-500/10 text-gray-600"
      case "cancelled":
        return "bg-red-500/10 text-red-600"
      default:
        return "bg-gray-500/10 text-gray-600"
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <h1 className="mb-8 text-3xl font-bold">Orders Management</h1>

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
                <Button variant="default" className="w-full justify-start">
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

            {/* Orders List */}
            <div className="lg:col-span-3 space-y-6">
              {/* Filters */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <Select defaultValue="all">
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Orders</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="shipped">Shipped</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Orders Table */}
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b border-border bg-muted/50">
                        <tr>
                          <th className="p-4 text-left text-sm font-medium">Order ID</th>
                          <th className="p-4 text-left text-sm font-medium">Customer</th>
                          <th className="p-4 text-left text-sm font-medium">Date</th>
                          <th className="p-4 text-left text-sm font-medium">Total</th>
                          <th className="p-4 text-left text-sm font-medium">Status</th>
                          <th className="p-4 text-left text-sm font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mockOrders.map((order) => (
                          <tr key={order.id} className="border-b border-border">
                            <td className="p-4 font-medium">{order.id}</td>
                            <td className="p-4">
                              <div>
                                <p className="font-medium">{order.shippingAddress.fullName}</p>
                                <p className="text-sm text-muted-foreground">{order.shippingAddress.phone}</p>
                              </div>
                            </td>
                            <td className="p-4 text-sm">{order.createdAt.toLocaleDateString()}</td>
                            <td className="p-4 font-medium">${order.total.toFixed(2)}</td>
                            <td className="p-4">
                              <Badge className={getStatusColor(order.status)} variant="secondary">
                                {order.status}
                              </Badge>
                            </td>
                            <td className="p-4">
                              <Button variant="ghost" size="sm">
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
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

export default function VendorOrdersPage() {
  return (
    <ProtectedRoute allowedRoles={["vendor"]}>
      <VendorOrdersContent />
    </ProtectedRoute>
  )
}

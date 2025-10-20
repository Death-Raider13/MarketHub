"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/firebase/auth-context"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ProtectedRoute } from "@/lib/firebase/protected-route"
import { LayoutDashboard, Package, ShoppingCart, TrendingUp, Megaphone, StoreIcon, Eye, Loader2 } from "lucide-react"
import Link from "next/link"
import type { Order } from "@/lib/types"
import { toast } from "sonner"

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
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>("all")

  // Load orders from Firestore
  useEffect(() => {
    async function loadOrders() {
      if (!user) return

      try {
        const response = await fetch(`/api/vendor/orders?vendorId=${user.uid}`)
        const data = await response.json()

        if (data.orders) {
          setOrders(data.orders)
        }
      } catch (error) {
        console.error("Error loading orders:", error)
        toast.error("Failed to load orders")
      } finally {
        setLoading(false)
      }
    }

    loadOrders()
  }, [user])

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/vendor/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      const data = await response.json()

      if (data.success) {
        setOrders(orders.map(order => 
          order.id === orderId ? { ...order, status: newStatus as any } : order
        ))
        toast.success("Order status updated successfully")
      } else {
        toast.error(data.error || "Failed to update order status")
      }
    } catch (error) {
      console.error("Error updating order:", error)
      toast.error("Failed to update order status")
    }
  }

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

  // Filter orders
  const filteredOrders = filterStatus === "all" 
    ? orders 
    : orders.filter(order => order.status === filterStatus)

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
              <Link href="/vendor/store">
                <Button variant="ghost" className="w-full justify-start">
                  <StoreIcon className="mr-2 h-4 w-4" />
                  Store Settings
                </Button>
              </Link>
            </aside>

            {/* Orders List */}
            <div className="lg:col-span-3 space-y-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Loading orders...</span>
                </div>
              ) : (
                <>
              {/* Filters */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
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
                          <th className="p-4 text-left text-sm font-medium">Date</th>
                          <th className="p-4 text-left text-sm font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOrders.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-muted-foreground">
                              No orders found
                            </td>
                          </tr>
                        ) : (
                          filteredOrders.map((order) => (
                            <tr key={order.id} className="border-b border-border">
                              <td className="p-4 font-medium">{order.id}</td>
                              <td className="p-4">
                                {order.shippingAddress?.fullName || "N/A"}
                              </td>
                              <td className="p-4">
                                ₦{typeof order.total === 'number' ? order.total.toLocaleString() : parseFloat(order.total || '0').toLocaleString()}
                              </td>
                              <td className="p-4">
                                <Select
                                  value={order.status}
                                  onValueChange={(value) => handleStatusUpdate(order.id, value)}
                                >
                                  <SelectTrigger className="w-[140px]">
                                    <Badge className={getStatusColor(order.status)}>
                                      {order.status}
                                    </Badge>
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="processing">Processing</SelectItem>
                                    <SelectItem value="shipped">Shipped</SelectItem>
                                    <SelectItem value="delivered">Delivered</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                  </SelectContent>
                                </Select>
                              </td>
                              <td className="p-4 text-sm text-muted-foreground">
                                {new Date(order.createdAt).toLocaleDateString()}
                              </td>
                              <td className="p-4">
                                <Button variant="outline" size="sm">
                                  <Eye className="mr-2 h-4 w-4" />
                                  View
                                </Button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
              </>
              )}
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

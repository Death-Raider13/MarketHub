"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/firebase/auth-context"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ProtectedRoute } from "@/lib/firebase/protected-route"
import { LayoutDashboard, Package, ShoppingCart, StoreIcon, TrendingUp, Truck, CheckCircle, XCircle, Clock, Eye, Loader2,Calendar, Edit,Mail,HelpCircle,Wallet,Palette } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

interface VendorOrder {
  id: string
  userId: string
  userEmail: string
  items: any[]
  subtotal: number
  tax: number
  shipping: number
  total: number
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  paymentStatus: string
  shippingAddress: any
  paymentMethod: string
  trackingNumber?: string
  createdAt: string
  updatedAt: string
  paidAt?: string
  shippedAt?: string
  deliveredAt?: string
}

interface StatusUpdateData {
  status: string
  trackingNumber?: string
  notes?: string
}

interface OrderManagementSystem {
  orders: VendorOrder[]
  status: string
  trackingNumber: string
  notes: string
}

function VendorOrdersContent() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<VendorOrder[]>([])
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

  const getStatusColor = (status: VendorOrder["status"]) => {
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
              <Link href="/vendor/services">
                <Button variant="ghost" className="w-full justify-start">
                  <Calendar className="mr-2 h-4 w-4" />
                  Services
                </Button>
              </Link>
              <Link href="/vendor/messages">
                <Button variant="ghost" className="w-full justify-start">
                  <Mail className="mr-2 h-4 w-4" />
                  Messages
                </Button>
              </Link>
              <Link href="/vendor/questions">
                <Button variant="ghost" className="w-full justify-start">
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Q&A
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
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="outline" size="sm">
                                      <Eye className="mr-2 h-4 w-4" />
                                      View
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-lg">
                                    <DialogHeader>
                                      <DialogTitle>Order Details</DialogTitle>
                                      <DialogDescription>
                                        Full details for order {order.id}
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 text-sm">
                                      <div>
                                        <h4 className="font-medium mb-1">Order Summary</h4>
                                        <p>Customer: {order.shippingAddress?.fullName || "N/A"}</p>
                                        <p>Email: {order.userEmail}</p>
                                        <p>Status: <span className="capitalize">{order.status}</span></p>
                                        <p>Date: {new Date(order.createdAt).toLocaleString()}</p>
                                      </div>

                                      <div>
                                        <h4 className="font-medium mb-1">Payment</h4>
                                        <p>Method: {order.paymentMethod}</p>
                                        <p>Subtotal: ₦{Number(order.subtotal || 0).toLocaleString()}</p>
                                        <p>Tax: ₦{Number(order.tax || 0).toLocaleString()}</p>
                                        <p>Shipping: ₦{Number(order.shipping || 0).toLocaleString()}</p>
                                        <p className="font-semibold mt-1">Total: ₦{Number(order.total || 0).toLocaleString()}</p>
                                      </div>

                                      {order.shippingAddress && (
                                        <div>
                                          <h4 className="font-medium mb-1">Shipping Address</h4>
                                          <p>
                                            {order.shippingAddress.fullName}<br />
                                            {order.shippingAddress.addressLine1}<br />
                                            {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}<br />
                                            {order.shippingAddress.phone}
                                          </p>
                                        </div>
                                      )}

                                      <div>
                                        <h4 className="font-medium mb-1">Items</h4>
                                        <div className="space-y-2 max-h-60 overflow-y-auto">
                                          {order.items?.map((item: any, index: number) => (
                                            <div key={index} className="flex justify-between">
                                              <div>
                                                <p className="font-medium">{item.productName || item.name}</p>
                                                <p className="text-muted-foreground">
                                                  Qty: {item.quantity} · ₦{Number(item.productPrice || item.price || 0).toLocaleString()}
                                                </p>
                                              </div>
                                              <p className="font-medium">
                                                ₦{(Number(item.productPrice || item.price || 0) * (item.quantity || 1)).toLocaleString()}
                                              </p>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>
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

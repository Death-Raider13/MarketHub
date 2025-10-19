"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/firebase/auth-context"
import { useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { ProtectedRoute } from "@/lib/firebase/protected-route"
import {
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Download,
  RotateCcw,
  Loader2,
  ShoppingBag,
  Calendar,
  MapPin,
  CreditCard,
  MessageSquare
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"

interface OrderItem {
  productId: string
  productName: string
  productPrice: number
  productImage?: string
  quantity: number
  vendorId: string
  vendorName: string
}

interface Order {
  id: string
  userId: string
  userEmail: string
  items: OrderItem[]
  subtotal: number
  tax: number
  shipping: number
  total: number
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
  shippingAddress: any
  shippingMethod: string
  paymentMethod: string
  trackingNumber?: string
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
}

// Currency formatter
const formatNGN = (amount: number) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

function OrdersContent() {
  const { user } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    if (user) {
      loadOrders()
    }
  }, [user])

  const loadOrders = async () => {
    if (!user) return

    try {
      setLoading(true)
      const response = await fetch(`/api/customer/orders?userId=${user.uid}`)
      const data = await response.json()

      if (data.success) {
        const ordersData = data.orders.map((order: any) => ({
          ...order,
          createdAt: new Date(order.createdAt),
          updatedAt: new Date(order.updatedAt),
          completedAt: order.completedAt ? new Date(order.completedAt) : undefined
        }))
        setOrders(ordersData)
      } else {
        toast.error('Failed to load orders')
      }
    } catch (error) {
      console.error('Error loading orders:', error)
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-orange-500" />
      case 'processing':
        return <Package className="h-5 w-5 text-blue-500" />
      case 'shipped':
        return <Truck className="h-5 w-5 text-purple-500" />
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Package className="h-5 w-5" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: any } = {
      pending: 'secondary',
      processing: 'default',
      shipped: 'default',
      delivered: 'default',
      cancelled: 'destructive'
    }
    return (
      <Badge variant={variants[status] || 'secondary'} className="capitalize">
        {status}
      </Badge>
    )
  }

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order?')) return

    try {
      const response = await fetch(`/api/orders/${orderId}/cancel`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.uid })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Order cancelled successfully')
        loadOrders()
      } else {
        toast.error(data.error || 'Failed to cancel order')
      }
    } catch (error) {
      console.error('Error cancelling order:', error)
      toast.error('Failed to cancel order')
    }
  }

  const handleReorder = (order: Order) => {
    // Add all items to cart
    order.items.forEach(item => {
      // This would need to fetch the full product data
      toast.info('Reorder functionality coming soon!')
    })
  }

  const filteredOrders = orders.filter(order => {
    if (statusFilter === 'all') return true
    return order.status === statusFilter
  })

  const orderStats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 bg-muted/30">
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading your orders...</span>
            </div>
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
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold">My Orders</h1>
            <p className="text-muted-foreground">Track and manage your orders</p>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Orders</p>
                    <p className="text-2xl font-bold">{orderStats.total}</p>
                  </div>
                  <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pending</p>
                    <p className="text-2xl font-bold">{orderStats.pending}</p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Processing</p>
                    <p className="text-2xl font-bold">{orderStats.processing}</p>
                  </div>
                  <Package className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Delivered</p>
                    <p className="text-2xl font-bold">{orderStats.delivered}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Cancelled</p>
                    <p className="text-2xl font-bold">{orderStats.cancelled}</p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filter Tabs */}
          <Tabs defaultValue="all" className="space-y-6" onValueChange={setStatusFilter}>
            <TabsList>
              <TabsTrigger value="all">All Orders ({orderStats.total})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({orderStats.pending})</TabsTrigger>
              <TabsTrigger value="processing">Processing ({orderStats.processing})</TabsTrigger>
              <TabsTrigger value="delivered">Delivered ({orderStats.delivered})</TabsTrigger>
              <TabsTrigger value="cancelled">Cancelled ({orderStats.cancelled})</TabsTrigger>
            </TabsList>

            <TabsContent value={statusFilter} className="space-y-4">
              {filteredOrders.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No orders found</h3>
                    <p className="text-muted-foreground mb-4">
                      {statusFilter === 'all' 
                        ? "You haven't placed any orders yet."
                        : `You don't have any ${statusFilter} orders.`}
                    </p>
                    <Button asChild>
                      <Link href="/products">Start Shopping</Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                filteredOrders.map((order) => (
                  <Card key={order.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {getStatusIcon(order.status)}
                          <div>
                            <CardTitle className="text-lg">Order #{order.id.slice(0, 8)}</CardTitle>
                            <p className="text-sm text-muted-foreground">
                              Placed {formatDistanceToNow(order.createdAt)} ago
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">{formatNGN(order.total)}</div>
                          {getStatusBadge(order.status)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Order Items */}
                      <div className="space-y-3">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                              <Image
                                src={item.productImage || "/placeholder.svg"}
                                alt={item.productName}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <Link 
                                href={`/products/${item.productId}`}
                                className="font-medium hover:underline line-clamp-1"
                              >
                                {item.productName}
                              </Link>
                              <p className="text-sm text-muted-foreground">
                                by {item.vendorName} • Qty: {item.quantity}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">{formatNGN(item.productPrice * item.quantity)}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <Separator />

                      {/* Order Details */}
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <div className="flex items-start gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="font-medium">Shipping Address</p>
                              <p className="text-muted-foreground">
                                {order.shippingAddress?.fullName}<br />
                                {order.shippingAddress?.addressLine1}<br />
                                {order.shippingAddress?.city}, {order.shippingAddress?.state}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-start gap-2 text-sm">
                            <CreditCard className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="font-medium">Payment</p>
                              <p className="text-muted-foreground">
                                {order.paymentMethod} • {order.paymentStatus}
                              </p>
                            </div>
                          </div>
                          {order.trackingNumber && (
                            <div className="flex items-start gap-2 text-sm">
                              <Truck className="h-4 w-4 text-muted-foreground mt-0.5" />
                              <div>
                                <p className="font-medium">Tracking Number</p>
                                <p className="text-muted-foreground font-mono">
                                  {order.trackingNumber}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <Separator />

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleReorder(order)}>
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Reorder
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/my-purchases?orderId=${order.id}`}>
                            <Download className="mr-2 h-4 w-4" />
                            Downloads
                          </Link>
                        </Button>
                        {order.status === 'pending' && (
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleCancelOrder(order.id)}
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Cancel Order
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default function OrdersPage() {
  return (
    <ProtectedRoute allowedRoles={["customer", "vendor"]}>
      <OrdersContent />
    </ProtectedRoute>
  )
}

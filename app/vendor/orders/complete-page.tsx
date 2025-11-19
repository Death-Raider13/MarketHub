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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ProtectedRoute } from "@/lib/firebase/protected-route"
import { Package, Truck, CheckCircle, XCircle, Clock, Eye, Loader2, Edit } from "lucide-react"
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

function VendorOrdersContent() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<VendorOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [selectedOrder, setSelectedOrder] = useState<VendorOrder | null>(null)
  const [updateLoading, setUpdateLoading] = useState(false)
  
  // Status update form
  const [newStatus, setNewStatus] = useState("")
  const [trackingNumber, setTrackingNumber] = useState("")
  const [notes, setNotes] = useState("")

  // Load orders from API
  useEffect(() => {
    if (user) {
      loadOrders()
    }
  }, [user])

  const loadOrders = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/vendor/orders?vendorId=${user?.uid}`)
      
      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders || [])
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

  const updateOrderStatus = async (orderId: string, statusData: {
    status: string
    trackingNumber?: string
    notes?: string
  }) => {
    try {
      setUpdateLoading(true)
      
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...statusData,
          vendorId: user?.uid
        })
      })

      if (response.ok) {
        toast.success('Order status updated successfully')
        loadOrders() // Reload orders
        setSelectedOrder(null)
        setNewStatus("")
        setTrackingNumber("")
        setNotes("")
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update order status')
      }
    } catch (error) {
      console.error('Error updating order status:', error)
      toast.error('Failed to update order status')
    } finally {
      setUpdateLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      paid: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      processing: { color: 'bg-orange-100 text-orange-800', icon: Package },
      shipped: { color: 'bg-purple-100 text-purple-800', icon: Truck },
      delivered: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const Icon = config.icon

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getValidNextStatuses = (currentStatus: string) => {
    const transitions: Record<string, string[]> = {
      'pending': ['processing', 'cancelled'],
      'paid': ['processing', 'cancelled'],
      'processing': ['shipped', 'cancelled'],
      'shipped': ['delivered'],
      'delivered': [],
      'cancelled': []
    }
    return transitions[currentStatus] || []
  }

  const filteredOrders = orders.filter(order => {
    if (filterStatus === "all") return true
    return order.status === filterStatus
  })

  const getOrderStats = () => {
    const stats = {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending' || o.status === 'paid').length,
      processing: orders.filter(o => o.status === 'processing').length,
      shipped: orders.filter(o => o.status === 'shipped').length,
      delivered: orders.filter(o => o.status === 'delivered').length
    }
    return stats
  }

  const stats = getOrderStats()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading orders...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Order Management</h1>
          <p className="text-gray-600">Manage and fulfill your customer orders</p>
        </div>

        {/* Order Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Orders</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-600">{stats.processing}</div>
              <div className="text-sm text-gray-600">Processing</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-600">{stats.shipped}</div>
              <div className="text-sm text-gray-600">Shipped</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{stats.delivered}</div>
              <div className="text-sm text-gray-600">Delivered</div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Controls */}
        <div className="flex justify-between items-center mb-6">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={loadOrders} variant="outline">
            Refresh Orders
          </Button>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">No orders found</h3>
                <p className="text-gray-600">
                  {filterStatus === "all" 
                    ? "You haven't received any orders yet." 
                    : `No orders with status "${filterStatus}".`
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredOrders.map((order) => (
              <Card key={order.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">Order #{order.id}</h3>
                      <p className="text-sm text-gray-600">
                        Customer: {order.userEmail}
                      </p>
                      <p className="text-sm text-gray-600">
                        Placed: {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(order.status)}
                      <div className="text-lg font-bold mt-2">
                        ₦{order.total.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Items:</h4>
                    <div className="space-y-2">
                      {order.items?.filter(item => item.vendorId === user?.uid).map((item, index) => (
                        <div key={index} className="flex justify-between items-center bg-gray-50 p-3 rounded">
                          <div>
                            <span className="font-medium">{item.productName}</span>
                            <span className="text-sm text-gray-600 ml-2">x{item.quantity}</span>
                          </div>
                          <span className="font-medium">₦{(item.productPrice * item.quantity).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Shipping Address */}
                  <div className="mb-4 p-3 bg-gray-50 rounded">
                    <h4 className="font-medium mb-2">Shipping Address:</h4>
                    <p className="text-sm">
                      {order.shippingAddress?.fullName}<br />
                      {order.shippingAddress?.addressLine1}<br />
                      {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.zipCode}<br />
                      {order.shippingAddress?.phone}
                    </p>
                  </div>

                  {/* Tracking Number */}
                  {order.trackingNumber && (
                    <div className="mb-4">
                      <span className="text-sm font-medium">Tracking Number: </span>
                      <span className="text-sm bg-blue-100 px-2 py-1 rounded">{order.trackingNumber}</span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedOrder(order)}
                          disabled={getValidNextStatuses(order.status).length === 0}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Update Status
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Update Order Status</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium">Current Status</label>
                            <div className="mt-1">{getStatusBadge(order.status)}</div>
                          </div>
                          
                          <div>
                            <label className="text-sm font-medium">New Status</label>
                            <Select value={newStatus} onValueChange={setNewStatus}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select new status" />
                              </SelectTrigger>
                              <SelectContent>
                                {getValidNextStatuses(order.status).map(status => (
                                  <SelectItem key={status} value={status}>
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {newStatus === 'shipped' && (
                            <div>
                              <label className="text-sm font-medium">Tracking Number</label>
                              <Input
                                value={trackingNumber}
                                onChange={(e) => setTrackingNumber(e.target.value)}
                                placeholder="Enter tracking number"
                              />
                            </div>
                          )}

                          <div>
                            <label className="text-sm font-medium">Notes (Optional)</label>
                            <Textarea
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                              placeholder="Add any notes about this status update"
                            />
                          </div>

                          <div className="flex gap-2">
                            <Button
                              onClick={() => updateOrderStatus(order.id, {
                                status: newStatus,
                                trackingNumber: trackingNumber || undefined,
                                notes: notes || undefined
                              })}
                              disabled={!newStatus || updateLoading}
                            >
                              {updateLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                              Update Status
                            </Button>
                            <Button variant="outline" onClick={() => setSelectedOrder(null)}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default function VendorOrdersPage() {
  return (
    <ProtectedRoute requiredRole="vendor">
      <VendorOrdersContent />
    </ProtectedRoute>
  )
}

"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/firebase/auth-context"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ProtectedRoute } from "@/lib/firebase/protected-route"
import { 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  XCircle,
  Eye,
  Loader2,
  Download,
  Calendar,
  Star
} from "lucide-react"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"

interface Order {
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

function MyOrdersContent() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")
  const [rating, setRating] = useState(0)
  const [review, setReview] = useState("")
  const [submittingRating, setSubmittingRating] = useState(false)
  const [reviewedProducts, setReviewedProducts] = useState<Record<string, boolean>>({})

  // Helper function to safely format dates
  const formatDateSafely = (dateString: string | undefined, fallback: string = 'Recently') => {
    if (!dateString) return fallback
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return fallback
    return formatDistanceToNow(date, { addSuffix: true })
  }

  useEffect(() => {
    if (user) {
      loadOrders()
    }
  }, [user])

  async function loadReviewedProductsForOrders(ordersData: Order[]) {
    if (!user) return

    try {
      const physicalProductIds = Array.from(
        new Set(
          ordersData.flatMap(order => order.items || [])
            .filter((item: any) => item.product?.type === 'physical' && item.productId)
            .map((item: any) => item.productId as string)
        )
      )

      const reviewedMap: Record<string, boolean> = {}

      await Promise.all(
        physicalProductIds.map(async (productId) => {
          try {
            const response = await fetch(`/api/products/${productId}/reviews/user?userId=${user.uid}`)
            if (!response.ok) return

            const data = await response.json()
            if (data.success && data.review) {
              reviewedMap[productId] = true
            }
          } catch (error) {
            console.error('Error checking product review status:', productId, error)
          }
        })
      )

      if (Object.keys(reviewedMap).length > 0) {
        setReviewedProducts(prev => ({ ...prev, ...reviewedMap }))
      }
    } catch (error) {
      console.error('Error loading reviewed products for orders:', error)
    }
  }

  const loadOrders = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/customer/orders?userId=${user?.uid}`)
      
      if (response.ok) {
        const data = await response.json()
        const ordersData: Order[] = data.orders || []
        setOrders(ordersData)
        await loadReviewedProductsForOrders(ordersData)
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

  const getOrdersByType = (type: string) => {
    if (type === "all") return orders
    if (type === "physical") return orders.filter(order => 
      order.items?.some(item => item.product?.type === 'physical')
    )
    if (type === "digital") return orders.filter(order => 
      order.items?.some(item => item.product?.type === 'digital')
    )
    if (type === "service") return orders.filter(order => 
      order.items?.some(item => item.product?.type === 'service')
    )
    return orders
  }

  const filteredOrders = getOrdersByType(activeTab)

  const submitProductRating = async (productId: string, vendorId?: string) => {
    if (!user) {
      toast.error('Please login to submit a review')
      return
    }

    if (rating === 0) {
      toast.error('Please select a rating')
      return
    }

    if (!review.trim()) {
      toast.error('Please write a short review')
      return
    }

    try {
      setSubmittingRating(true)

      const trimmedReview = review.trim()
      const titleFromReview = trimmedReview.split("\n")[0].slice(0, 80) || 'Review'

      const response = await fetch(`/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user.uid,
          userName: user.displayName || 'Anonymous',
          rating,
          title: titleFromReview,
          comment: trimmedReview,
          vendorId
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast.success('Review submitted successfully!')
        setRating(0)
        setReview("")
        setReviewedProducts(prev => ({ ...prev, [productId]: true }))
      } else {
        toast.error(data.error || 'Failed to submit review')
      }
    } catch (error) {
      console.error('Error submitting review:', error)
      toast.error('Failed to submit review')
    } finally {
      setSubmittingRating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading your orders...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Orders</h1>
          <p className="text-gray-600">Track and manage your orders</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All Orders</TabsTrigger>
            <TabsTrigger value="physical">Physical</TabsTrigger>
            <TabsTrigger value="digital">Digital</TabsTrigger>
            <TabsTrigger value="service">Services</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {filteredOrders.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2">No orders found</h3>
                  <p className="text-gray-600 mb-4">
                    {activeTab === "all" 
                      ? "You haven't placed any orders yet." 
                      : `No ${activeTab} orders found.`
                    }
                  </p>
                  <Link href="/products">
                    <Button>Start Shopping</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              filteredOrders.map((order) => (
                <Card key={order.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">Order #{order.id.substring(0, 8).toUpperCase()}</h3>
                        <p className="text-sm text-gray-600">
                          Placed {formatDateSafely(order.createdAt)}
                        </p>
                        {order.paidAt && (
                          <p className="text-sm text-gray-600">
                            Paid {formatDateSafely(order.paidAt)}
                          </p>
                        )}
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
                        {order.items?.map((item, index) => (
                          <div key={index} className="bg-gray-50 p-3 rounded space-y-2">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                                  {item.product?.type === 'digital' && <Download className="w-5 h-5" />}
                                  {item.product?.type === 'service' && <Calendar className="w-5 h-5" />}
                                  {item.product?.type === 'physical' && <Package className="w-5 h-5" />}
                                </div>
                                <div>
                                  <span className="font-medium">{item.productName}</span>
                                  <div className="text-sm text-gray-600">
                                    {item.product?.type && (
                                      <Badge variant="outline" className="mr-2">
                                        {item.product.type}
                                      </Badge>
                                    )}
                                    Qty: {item.quantity}
                                  </div>
                                </div>
                              </div>
                              <span className="font-medium">₦{(item.productPrice * item.quantity).toLocaleString()}</span>
                            </div>

                            {/* Physical product review (delivered or cancelled) */}
                            {item.product?.type === 'physical' && (order.status === 'delivered' || order.status === 'cancelled') && !reviewedProducts[item.productId] && (
                              <div className="pt-2 border-t border-gray-100 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-xs text-gray-600">
                                  {order.status === 'delivered'
                                    ? 'Your order was delivered. Share your experience with this product.'
                                    : 'This order was cancelled. You can still leave feedback about this product.'}
                                </p>
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setRating(0)
                                        setReview("")
                                      }}
                                    >
                                      <Star className="w-4 h-4 mr-2" />
                                      Review Product
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-md">
                                    <DialogHeader>
                                      <DialogTitle>Review Product</DialogTitle>
                                      <DialogDescription>
                                        Share your experience with {item.productName}.
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      {/* Star Rating */}
                                      <div>
                                        <label className="block text-sm font-medium mb-2">Rating</label>
                                        <div className="flex gap-1">
                                          {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                              key={star}
                                              type="button"
                                              onClick={() => setRating(star)}
                                              className="focus:outline-none"
                                            >
                                              <Star
                                                className={`w-6 h-6 ${
                                                  star <= rating
                                                    ? 'text-yellow-400 fill-yellow-400'
                                                    : 'text-gray-300'
                                                }`}
                                              />
                                            </button>
                                          ))}
                                        </div>
                                      </div>

                                      {/* Review Text */}
                                      <div>
                                        <label className="block text-sm font-medium mb-2">Review</label>
                                        <Textarea
                                          value={review}
                                          onChange={(e) => setReview(e.target.value)}
                                          placeholder="Tell others about the product quality, delivery and your overall experience..."
                                          rows={4}
                                        />
                                      </div>

                                      {/* Submit Button */}
                                      <div className="flex gap-2">
                                        <Button
                                          onClick={() => submitProductRating(item.productId, item.vendorId)}
                                          disabled={rating === 0 || submittingRating}
                                          className="flex-1"
                                        >
                                          {submittingRating ? (
                                            <>
                                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                              Submitting...
                                            </>
                                          ) : (
                                            'Submit Review'
                                          )}
                                        </Button>
                                        <Button
                                          variant="outline"
                                          onClick={() => {
                                            setRating(0)
                                            setReview("")
                                          }}
                                        >
                                          Cancel
                                        </Button>
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Tracking Number */}
                    {order.trackingNumber && (
                      <div className="mb-4 p-3 bg-blue-50 rounded">
                        <h4 className="font-medium mb-1">Tracking Information:</h4>
                        <p className="text-sm">
                          Tracking Number: <span className="font-mono bg-blue-100 px-2 py-1 rounded">{order.trackingNumber}</span>
                        </p>
                      </div>
                    )}

                    {/* Shipping Address */}
                    {order.shippingAddress && (
                      <div className="mb-4 p-3 bg-gray-50 rounded">
                        <h4 className="font-medium mb-2">Shipping Address:</h4>
                        <p className="text-sm">
                          {order.shippingAddress.fullName}<br />
                          {order.shippingAddress.addressLine1}<br />
                          {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}<br />
                          {order.shippingAddress.phone}
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 flex-wrap">
                      {/* Digital Products */}
                      {order.items?.some(item => item.product?.type === 'digital') && order.status === 'paid' && (
                        <Link href="/my-purchases">
                          <Button size="sm">
                            <Download className="w-4 h-4 mr-2" />
                            Download Files
                          </Button>
                        </Link>
                      )}

                      {/* Service Bookings */}
                      {order.items?.some(item => item.product?.type === 'service') && order.status === 'paid' && (
                        <Link href="/my-services">
                          <Button size="sm" variant="outline">
                            <Calendar className="w-4 h-4 mr-2" />
                            Manage Services
                          </Button>
                        </Link>
                      )}

                      {/* Physical Order Tracking */}
                      {order.items?.some(item => item.product?.type === 'physical') && order.trackingNumber && (
                        <Button size="sm" variant="outline">
                          <Truck className="w-4 h-4 mr-2" />
                          Track Package
                        </Button>
                      )}

                      {/* Order Details */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="ghost">
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                          <DialogHeader>
                            <DialogTitle>Order Details</DialogTitle>
                            <DialogDescription>
                              Full summary for order #{order.id.substring(0, 8).toUpperCase()}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-medium mb-1">Order Summary</h4>
                              <p className="text-sm text-gray-600">
                                Status: {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </p>
                              <p className="text-sm text-gray-600">
                                Placed: {formatDateSafely(order.createdAt)}
                              </p>
                              {order.paidAt && (
                                <p className="text-sm text-gray-600">
                                  Paid: {formatDateSafely(order.paidAt)}
                                </p>
                              )}
                              {order.shippedAt && (
                                <p className="text-sm text-gray-600">
                                  Shipped: {formatDateSafely(order.shippedAt)}
                                </p>
                              )}
                              {order.deliveredAt && (
                                <p className="text-sm text-gray-600">
                                  Delivered: {formatDateSafely(order.deliveredAt)}
                                </p>
                              )}
                            </div>

                            <div>
                              <h4 className="font-medium mb-1">Payment</h4>
                              <p className="text-sm text-gray-600">Method: {order.paymentMethod}</p>
                              <p className="text-sm text-gray-600">Subtotal: ₦{order.subtotal.toLocaleString()}</p>
                              <p className="text-sm text-gray-600">Tax: ₦{order.tax.toLocaleString()}</p>
                              <p className="text-sm text-gray-600">Shipping: ₦{order.shipping.toLocaleString()}</p>
                              <p className="text-sm font-semibold mt-1">Total: ₦{order.total.toLocaleString()}</p>
                            </div>

                            {order.shippingAddress && (
                              <div>
                                <h4 className="font-medium mb-1">Shipping Address</h4>
                                <p className="text-sm text-gray-600">
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
                                {order.items?.map((item, index) => (
                                  <div key={index} className="flex justify-between text-sm">
                                    <div>
                                      <p className="font-medium">{item.productName}</p>
                                      <p className="text-gray-600">
                                        Qty: {item.quantity} · ₦{item.productPrice.toLocaleString()}
                                      </p>
                                    </div>
                                    <p className="font-medium">
                                      ₦{(item.productPrice * item.quantity).toLocaleString()}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  )
}

export default function MyOrdersPage() {
  return (
    <ProtectedRoute>
      <MyOrdersContent />
    </ProtectedRoute>
  )
}

"use client"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ProtectedRoute } from "@/lib/firebase/protected-route"
import { Package, Heart, MapPin, CreditCard, Settings, Star, Download } from "lucide-react"
import Link from "next/link"
import type { Order } from "@/lib/types"

// Mock orders
const mockOrders: Order[] = [
  {
    id: "ORD-001",
    userId: "user1",
    items: [],
    subtotal: 199.99,
    tax: 19.99,
    shipping: 0,
    total: 219.98,
    status: "delivered",
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
    trackingNumber: "TRK123456789",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
  },
  {
    id: "ORD-002",
    userId: "user1",
    items: [],
    subtotal: 89.99,
    tax: 8.99,
    shipping: 9.99,
    total: 108.97,
    status: "shipped",
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
    trackingNumber: "TRK987654321",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
  },
]

function DashboardContent() {
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
          <h1 className="mb-8 text-3xl font-bold">My Dashboard</h1>

          <div className="grid gap-6 lg:grid-cols-4">
            {/* Sidebar */}
            <aside className="space-y-2">
              <Link href="/dashboard">
                <Button variant="default" className="w-full justify-start">
                  <Package className="mr-2 h-4 w-4" />
                  My Orders
                </Button>
              </Link>
              <Link href="/dashboard/purchases">
                <Button variant="ghost" className="w-full justify-start">
                  <Download className="mr-2 h-4 w-4" />
                  My Purchases
                </Button>
              </Link>
              <Link href="/dashboard/wishlist">
                <Button variant="ghost" className="w-full justify-start">
                  <Heart className="mr-2 h-4 w-4" />
                  Wishlist
                </Button>
              </Link>
              <Link href="/dashboard/addresses">
                <Button variant="ghost" className="w-full justify-start">
                  <MapPin className="mr-2 h-4 w-4" />
                  Addresses
                </Button>
              </Link>
              <Link href="/dashboard/payment-methods">
                <Button variant="ghost" className="w-full justify-start">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Payment Methods
                </Button>
              </Link>
              <Link href="/dashboard/reviews">
                <Button variant="ghost" className="w-full justify-start">
                  <Star className="mr-2 h-4 w-4" />
                  My Reviews
                </Button>
              </Link>
              <Link href="/dashboard/settings">
                <Button variant="ghost" className="w-full justify-start">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Button>
              </Link>
            </aside>

            {/* Main Content */}
            <div className="lg:col-span-3 space-y-6">
              {/* Stats */}
              <div className="grid gap-4 sm:grid-cols-3">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">12</div>
                    <p className="text-sm text-muted-foreground">Total Orders</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">3</div>
                    <p className="text-sm text-muted-foreground">In Progress</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">8</div>
                    <p className="text-sm text-muted-foreground">Wishlist Items</p>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Orders */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Orders</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mockOrders.map((order) => (
                    <div key={order.id} className="rounded-lg border border-border p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{order.id}</p>
                            <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Placed on {order.createdAt.toLocaleDateString()}
                          </p>
                          {order.trackingNumber && (
                            <p className="text-sm text-muted-foreground">Tracking: {order.trackingNumber}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-bold">${order.total.toFixed(2)}</p>
                          <Button variant="outline" size="sm" className="mt-2 bg-transparent">
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {mockOrders.length === 0 && (
                    <div className="py-12 text-center">
                      <Package className="mx-auto h-12 w-12 text-muted-foreground" />
                      <p className="mt-4 text-muted-foreground">No orders yet</p>
                      <Button asChild className="mt-4">
                        <Link href="/products">Start Shopping</Link>
                      </Button>
                    </div>
                  )}
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

export default function DashboardPage() {
  return (
    <ProtectedRoute allowedRoles={["customer"]}>
      <DashboardContent />
    </ProtectedRoute>
  )
}

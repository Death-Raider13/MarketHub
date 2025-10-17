"use client"

import { useState } from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/lib/firebase/auth-context"
import { ProtectedRoute } from "@/lib/firebase/protected-route"
import {
  User,
  Package,
  MapPin,
  CreditCard,
  Heart,
  Bell,
  Shield,
  Edit,
  Trash2,
  Plus,
  Eye,
  Download,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

// Mock data - replace with real data from Firebase
const mockOrders = [
  {
    id: "ORD-001",
    date: "2025-09-28",
    status: "delivered",
    total: 199.99,
    items: [
      {
        id: "1",
        name: "Wireless Headphones",
        image: "/placeholder.svg",
        quantity: 1,
        price: 199.99,
      },
    ],
    trackingNumber: "TRK123456789",
  },
  {
    id: "ORD-002",
    date: "2025-09-25",
    status: "shipped",
    total: 89.99,
    items: [
      {
        id: "2",
        name: "Smart Watch",
        image: "/placeholder.svg",
        quantity: 1,
        price: 89.99,
      },
    ],
    trackingNumber: "TRK987654321",
  },
  {
    id: "ORD-003",
    date: "2025-09-20",
    status: "processing",
    total: 149.99,
    items: [
      {
        id: "3",
        name: "Bluetooth Speaker",
        image: "/placeholder.svg",
        quantity: 1,
        price: 149.99,
      },
    ],
    trackingNumber: null,
  },
]

const mockAddresses = [
  {
    id: "1",
    type: "Home",
    fullName: "John Doe",
    addressLine1: "123 Main Street",
    addressLine2: "Apt 4B",
    city: "New York",
    state: "NY",
    zipCode: "10001",
    country: "United States",
    phone: "+1 (555) 123-4567",
    isDefault: true,
  },
  {
    id: "2",
    type: "Work",
    fullName: "John Doe",
    addressLine1: "456 Business Ave",
    addressLine2: "Suite 200",
    city: "New York",
    state: "NY",
    zipCode: "10002",
    country: "United States",
    phone: "+1 (555) 987-6543",
    isDefault: false,
  },
]

const mockPaymentMethods = [
  {
    id: "1",
    type: "Visa",
    last4: "4242",
    expiryMonth: "12",
    expiryYear: "2025",
    isDefault: true,
  },
  {
    id: "2",
    type: "Mastercard",
    last4: "5555",
    expiryMonth: "06",
    expiryYear: "2026",
    isDefault: false,
  },
]

function AccountPageContent() {
  const { user, userProfile } = useAuth()
  const [activeTab, setActiveTab] = useState("profile")
  const [isEditing, setIsEditing] = useState(false)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case "shipped":
        return <Truck className="h-5 w-5 text-blue-600" />
      case "processing":
        return <Clock className="h-5 w-5 text-orange-600" />
      case "cancelled":
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return <Package className="h-5 w-5 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800"
      case "shipped":
        return "bg-blue-100 text-blue-800"
      case "processing":
        return "bg-orange-100 text-orange-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold">My Account</h1>
            <p className="text-muted-foreground">Manage your account settings and view your orders</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-4">
            {/* Sidebar */}
            <aside className="space-y-2">
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center">
                    <Avatar className="h-24 w-24 mb-4">
                      <AvatarImage src={userProfile?.photoURL} />
                      <AvatarFallback className="text-2xl">
                        {userProfile?.displayName?.charAt(0) || user?.email?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="font-semibold text-lg">{userProfile?.displayName || "User"}</h3>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                    <Badge variant="secondary" className="mt-2">
                      {userProfile?.role}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Button
                variant={activeTab === "profile" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("profile")}
              >
                <User className="mr-2 h-4 w-4" />
                Profile
              </Button>
              <Button
                variant={activeTab === "orders" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("orders")}
              >
                <Package className="mr-2 h-4 w-4" />
                Orders
              </Button>
              <Link href="/dashboard/purchases">
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                >
                  <Download className="mr-2 h-4 w-4" />
                  My Purchases
                </Button>
              </Link>
              <Button
                variant={activeTab === "addresses" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("addresses")}
              >
                <MapPin className="mr-2 h-4 w-4" />
                Addresses
              </Button>
              <Button
                variant={activeTab === "payment" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("payment")}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Payment Methods
              </Button>
              <Button
                variant={activeTab === "wishlist" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("wishlist")}
              >
                <Heart className="mr-2 h-4 w-4" />
                Wishlist
              </Button>
              <Button
                variant={activeTab === "notifications" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("notifications")}
              >
                <Bell className="mr-2 h-4 w-4" />
                Notifications
              </Button>
              <Button
                variant={activeTab === "security" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("security")}
              >
                <Shield className="mr-2 h-4 w-4" />
                Security
              </Button>
            </aside>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* Profile Tab */}
              {activeTab === "profile" && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Personal Information</CardTitle>
                      <CardDescription>Update your personal details</CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(!isEditing)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      {isEditing ? "Cancel" : "Edit"}
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                          id="fullName"
                          defaultValue={userProfile?.displayName || ""}
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          defaultValue={user?.email || ""}
                          disabled
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+1 (555) 123-4567"
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="birthday">Date of Birth</Label>
                        <Input
                          id="birthday"
                          type="date"
                          disabled={!isEditing}
                        />
                      </div>
                    </div>

                    {isEditing && (
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsEditing(false)}>
                          Cancel
                        </Button>
                        <Button onClick={() => setIsEditing(false)}>
                          Save Changes
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Orders Tab */}
              {activeTab === "orders" && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Order History</CardTitle>
                      <CardDescription>View and track your orders</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {mockOrders.map((order) => (
                        <Card key={order.id}>
                          <CardContent className="p-6">
                            <div className="flex flex-col gap-4">
                              {/* Order Header */}
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-semibold">{order.id}</h3>
                                    <Badge className={getStatusColor(order.status)}>
                                      {order.status}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    Placed on {new Date(order.date).toLocaleDateString()}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold">${order.total.toFixed(2)}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {order.items.length} item(s)
                                  </p>
                                </div>
                              </div>

                              <Separator />

                              {/* Order Items */}
                              <div className="space-y-3">
                                {order.items.map((item) => (
                                  <div key={item.id} className="flex items-center gap-4">
                                    <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-muted">
                                      <Image
                                        src={item.image}
                                        alt={item.name}
                                        fill
                                        className="object-cover"
                                      />
                                    </div>
                                    <div className="flex-1">
                                      <p className="font-medium">{item.name}</p>
                                      <p className="text-sm text-muted-foreground">
                                        Qty: {item.quantity}
                                      </p>
                                    </div>
                                    <p className="font-medium">${item.price.toFixed(2)}</p>
                                  </div>
                                ))}
                              </div>

                              {/* Order Actions */}
                              <div className="flex flex-wrap gap-2">
                                <Button variant="outline" size="sm" asChild>
                                  <Link href={`/orders/${order.id}`}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                  </Link>
                                </Button>
                                {order.trackingNumber && (
                                  <Button variant="outline" size="sm" asChild>
                                    <Link href={`/orders/${order.id}/track`}>
                                      <Truck className="mr-2 h-4 w-4" />
                                      Track Order
                                    </Link>
                                  </Button>
                                )}
                                <Button variant="outline" size="sm">
                                  <Download className="mr-2 h-4 w-4" />
                                  Invoice
                                </Button>
                                {order.status === "delivered" && (
                                  <Button variant="outline" size="sm">
                                    Reorder
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Addresses Tab */}
              {activeTab === "addresses" && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle>Saved Addresses</CardTitle>
                        <CardDescription>Manage your delivery addresses</CardDescription>
                      </div>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Address
                      </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {mockAddresses.map((address) => (
                        <Card key={address.id}>
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="font-semibold">{address.type}</h3>
                                  {address.isDefault && (
                                    <Badge variant="secondary">Default</Badge>
                                  )}
                                </div>
                                <p className="text-sm">{address.fullName}</p>
                                <p className="text-sm text-muted-foreground">
                                  {address.addressLine1}
                                  {address.addressLine2 && `, ${address.addressLine2}`}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {address.city}, {address.state} {address.zipCode}
                                </p>
                                <p className="text-sm text-muted-foreground">{address.country}</p>
                                <p className="text-sm text-muted-foreground mt-1">{address.phone}</p>
                              </div>
                              <div className="flex gap-2">
                                <Button variant="ghost" size="icon">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon">
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Payment Methods Tab */}
              {activeTab === "payment" && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle>Payment Methods</CardTitle>
                        <CardDescription>Manage your payment options</CardDescription>
                      </div>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Card
                      </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {mockPaymentMethods.map((method) => (
                        <Card key={method.id}>
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="rounded-lg bg-muted p-3">
                                  <CreditCard className="h-6 w-6" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-semibold">
                                      {method.type} •••• {method.last4}
                                    </p>
                                    {method.isDefault && (
                                      <Badge variant="secondary">Default</Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    Expires {method.expiryMonth}/{method.expiryYear}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button variant="ghost" size="icon">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon">
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Wishlist Tab */}
              {activeTab === "wishlist" && (
                <Card>
                  <CardHeader>
                    <CardTitle>My Wishlist</CardTitle>
                    <CardDescription>Items you've saved for later</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Your wishlist is empty</h3>
                      <p className="text-muted-foreground mb-4">
                        Start adding items you love to your wishlist
                      </p>
                      <Button asChild>
                        <Link href="/products">Browse Products</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Notifications Tab */}
              {activeTab === "notifications" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Notification Preferences</CardTitle>
                    <CardDescription>Manage how you receive updates</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Order Updates</p>
                          <p className="text-sm text-muted-foreground">
                            Get notified about your order status
                          </p>
                        </div>
                        <input type="checkbox" defaultChecked className="h-4 w-4" />
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Promotional Emails</p>
                          <p className="text-sm text-muted-foreground">
                            Receive deals and special offers
                          </p>
                        </div>
                        <input type="checkbox" defaultChecked className="h-4 w-4" />
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Product Recommendations</p>
                          <p className="text-sm text-muted-foreground">
                            Get personalized product suggestions
                          </p>
                        </div>
                        <input type="checkbox" className="h-4 w-4" />
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Price Drop Alerts</p>
                          <p className="text-sm text-muted-foreground">
                            Get notified when wishlist items go on sale
                          </p>
                        </div>
                        <input type="checkbox" defaultChecked className="h-4 w-4" />
                      </div>
                    </div>
                    <Button>Save Preferences</Button>
                  </CardContent>
                </Card>
              )}

              {/* Security Tab */}
              {activeTab === "security" && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Password</CardTitle>
                      <CardDescription>Change your password</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <Input id="currentPassword" type="password" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input id="newPassword" type="password" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input id="confirmPassword" type="password" />
                      </div>
                      <Button>Update Password</Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Two-Factor Authentication</CardTitle>
                      <CardDescription>Add an extra layer of security</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        Two-factor authentication is not enabled for your account.
                      </p>
                      <Button>Enable 2FA</Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Delete Account</CardTitle>
                      <CardDescription>Permanently delete your account</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        Once you delete your account, there is no going back. Please be certain.
                      </p>
                      <Button variant="destructive">Delete Account</Button>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default function AccountPage() {
  return (
    <ProtectedRoute allowedRoles={["customer", "vendor", "admin"]}>
      <AccountPageContent />
    </ProtectedRoute>
  )
}

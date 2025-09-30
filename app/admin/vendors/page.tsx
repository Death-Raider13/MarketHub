"use client"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ProtectedRoute } from "@/lib/firebase/protected-route"
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  Megaphone,
  Settings,
  Store,
  Search,
  CheckCircle,
  XCircle,
  Eye,
} from "lucide-react"
import Link from "next/link"

interface Vendor {
  id: string
  storeName: string
  email: string
  joinDate: Date
  products: number
  revenue: number
  verified: boolean
  status: "active" | "pending" | "suspended"
}

const mockVendors: Vendor[] = [
  {
    id: "v1",
    storeName: "TechStore Pro",
    email: "tech@example.com",
    joinDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    products: 48,
    revenue: 24580,
    verified: true,
    status: "active",
  },
  {
    id: "v2",
    storeName: "Fashion Hub",
    email: "fashion@example.com",
    joinDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    products: 156,
    revenue: 45200,
    verified: true,
    status: "active",
  },
  {
    id: "v3",
    storeName: "Home Essentials",
    email: "home@example.com",
    joinDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    products: 0,
    revenue: 0,
    verified: false,
    status: "pending",
  },
]

function AdminVendorsContent() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <h1 className="mb-8 text-3xl font-bold">Vendor Management</h1>

          <div className="grid gap-6 lg:grid-cols-4">
            {/* Sidebar */}
            <aside className="space-y-2">
              <Link href="/admin/dashboard">
                <Button variant="ghost" className="w-full justify-start">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
              <Link href="/admin/vendors">
                <Button variant="default" className="w-full justify-start">
                  <Store className="mr-2 h-4 w-4" />
                  Vendors
                </Button>
              </Link>
              <Link href="/admin/products">
                <Button variant="ghost" className="w-full justify-start">
                  <Package className="mr-2 h-4 w-4" />
                  Products
                </Button>
              </Link>
              <Link href="/admin/orders">
                <Button variant="ghost" className="w-full justify-start">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Orders
                </Button>
              </Link>
              <Link href="/admin/users">
                <Button variant="ghost" className="w-full justify-start">
                  <Users className="mr-2 h-4 w-4" />
                  Users
                </Button>
              </Link>
              <Link href="/admin/advertising">
                <Button variant="ghost" className="w-full justify-start">
                  <Megaphone className="mr-2 h-4 w-4" />
                  Advertising
                </Button>
              </Link>
              <Link href="/admin/settings">
                <Button variant="ghost" className="w-full justify-start">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Button>
              </Link>
            </aside>

            {/* Vendors List */}
            <div className="lg:col-span-3 space-y-6">
              {/* Search */}
              <Card>
                <CardContent className="pt-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Search vendors..." className="pl-10" />
                  </div>
                </CardContent>
              </Card>

              {/* Stats */}
              <div className="grid gap-4 sm:grid-cols-3">
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Total Vendors</p>
                    <p className="text-2xl font-bold">248</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Pending Approval</p>
                    <p className="text-2xl font-bold text-orange-600">12</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Active Vendors</p>
                    <p className="text-2xl font-bold text-green-600">236</p>
                  </CardContent>
                </Card>
              </div>

              {/* Vendors Table */}
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b border-border bg-muted/50">
                        <tr>
                          <th className="p-4 text-left text-sm font-medium">Store Name</th>
                          <th className="p-4 text-left text-sm font-medium">Email</th>
                          <th className="p-4 text-left text-sm font-medium">Products</th>
                          <th className="p-4 text-left text-sm font-medium">Revenue</th>
                          <th className="p-4 text-left text-sm font-medium">Status</th>
                          <th className="p-4 text-left text-sm font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mockVendors.map((vendor) => (
                          <tr key={vendor.id} className="border-b border-border">
                            <td className="p-4">
                              <div>
                                <p className="font-medium">{vendor.storeName}</p>
                                <p className="text-sm text-muted-foreground">
                                  Joined {vendor.joinDate.toLocaleDateString()}
                                </p>
                              </div>
                            </td>
                            <td className="p-4 text-sm">{vendor.email}</td>
                            <td className="p-4 text-sm">{vendor.products}</td>
                            <td className="p-4 font-medium">${vendor.revenue.toLocaleString()}</td>
                            <td className="p-4">
                              <Badge
                                variant={vendor.status === "active" ? "default" : "secondary"}
                                className="capitalize"
                              >
                                {vendor.status}
                              </Badge>
                            </td>
                            <td className="p-4">
                              <div className="flex gap-2">
                                {vendor.status === "pending" ? (
                                  <>
                                    <Button size="sm" variant="outline">
                                      <CheckCircle className="mr-1 h-4 w-4" />
                                      Approve
                                    </Button>
                                    <Button size="sm" variant="outline">
                                      <XCircle className="mr-1 h-4 w-4" />
                                      Reject
                                    </Button>
                                  </>
                                ) : (
                                  <Button size="sm" variant="outline">
                                    <Eye className="mr-1 h-4 w-4" />
                                    View
                                  </Button>
                                )}
                              </div>
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

export default function AdminVendorsPage() {
  return (
    <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
      <AdminVendorsContent />
    </ProtectedRoute>
  )
}

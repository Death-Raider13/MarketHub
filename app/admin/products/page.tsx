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
import Image from "next/image"
import type { Product } from "@/lib/types"

const mockProducts: Product[] = [
  {
    id: "1",
    vendorId: "v1",
    vendorName: "TechStore Pro",
    name: "Wireless Noise-Cancelling Headphones",
    description: "Premium audio experience",
    price: 199.99,
    category: "electronics",
    images: ["/diverse-people-listening-headphones.png"],
    stock: 45,
    sku: "WH-1000",
    rating: 4.5,
    reviewCount: 128,
    featured: false,
    sponsored: false,
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    vendorId: "v2",
    vendorName: "Fashion Hub",
    name: "Premium Cotton T-Shirt",
    description: "Comfortable wear",
    price: 29.99,
    category: "fashion",
    images: ["/plain-white-tshirt.png"],
    stock: 120,
    sku: "TS-2000",
    rating: 4.8,
    reviewCount: 89,
    featured: false,
    sponsored: false,
    status: "pending",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

function AdminProductsContent() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <h1 className="mb-8 text-3xl font-bold">Product Moderation</h1>

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
                <Button variant="ghost" className="w-full justify-start">
                  <Store className="mr-2 h-4 w-4" />
                  Vendors
                </Button>
              </Link>
              <Link href="/admin/products">
                <Button variant="default" className="w-full justify-start">
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

            {/* Products List */}
            <div className="lg:col-span-3 space-y-6">
              {/* Search */}
              <Card>
                <CardContent className="pt-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Search products..." className="pl-10" />
                  </div>
                </CardContent>
              </Card>

              {/* Products Table */}
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b border-border bg-muted/50">
                        <tr>
                          <th className="p-4 text-left text-sm font-medium">Product</th>
                          <th className="p-4 text-left text-sm font-medium">Vendor</th>
                          <th className="p-4 text-left text-sm font-medium">Price</th>
                          <th className="p-4 text-left text-sm font-medium">Status</th>
                          <th className="p-4 text-left text-sm font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mockProducts.map((product) => (
                          <tr key={product.id} className="border-b border-border">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                                  <Image
                                    src={product.images[0] || "/placeholder.svg"}
                                    alt={product.name}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                                <div>
                                  <p className="font-medium">{product.name}</p>
                                  <p className="text-sm text-muted-foreground">{product.category}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4 text-sm">{product.vendorName}</td>
                            <td className="p-4 font-medium">${product.price.toFixed(2)}</td>
                            <td className="p-4">
                              <Badge
                                variant={product.status === "active" ? "default" : "secondary"}
                                className="capitalize"
                              >
                                {product.status}
                              </Badge>
                            </td>
                            <td className="p-4">
                              <div className="flex gap-2">
                                {product.status === "pending" ? (
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

export default function AdminProductsPage() {
  return (
    <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
      <AdminProductsContent />
    </ProtectedRoute>
  )
}

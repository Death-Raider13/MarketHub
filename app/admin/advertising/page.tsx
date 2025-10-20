"use client"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ProtectedRoute } from "@/lib/firebase/protected-route"
import { LayoutDashboard, Users, Package, ShoppingCart, Megaphone, Settings, Store, Pause, Eye } from "lucide-react"
import Link from "next/link"
import type { Advertisement } from "@/lib/types"

const mockAds: Advertisement[] = [
  {
    id: "ad1",
    vendorId: "v1",
    type: "banner",
    title: "Summer Sale Campaign",
    imageUrl: "/summer-sale-banner.png",
    linkUrl: "/products?sale=true",
    placement: "homepage-top",
    impressions: 12450,
    clicks: 234,
    budget: 500,
    spent: 123.45,
    status: "active",
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000),
  },
  {
    id: "ad2",
    vendorId: "v2",
    type: "sponsored-product",
    title: "New Product Launch",
    imageUrl: "/placeholder.svg",
    linkUrl: "/products/2",
    placement: "product-listing",
    impressions: 0,
    clicks: 0,
    budget: 300,
    spent: 0,
    status: "paused",
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  },
]

function AdminAdvertisingContent() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <h1 className="mb-8 text-3xl font-bold">Advertising Management</h1>

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
                <Button variant="default" className="w-full justify-start">
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

            {/* Ads List */}
            <div className="lg:col-span-3 space-y-6">
              {/* Stats */}
              <div className="grid gap-4 sm:grid-cols-3">
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Active Campaigns</p>
                    <p className="text-2xl font-bold">24</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Pending Approval</p>
                    <p className="text-2xl font-bold text-orange-600">8</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold">₦12,450,000</p>
                  </CardContent>
                </Card>
              </div>

              {/* Ads Table */}
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b border-border bg-muted/50">
                        <tr>
                          <th className="p-4 text-left text-sm font-medium">Campaign</th>
                          <th className="p-4 text-left text-sm font-medium">Vendor</th>
                          <th className="p-4 text-left text-sm font-medium">Type</th>
                          <th className="p-4 text-left text-sm font-medium">Performance</th>
                          <th className="p-4 text-left text-sm font-medium">Status</th>
                          <th className="p-4 text-left text-sm font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mockAds.map((ad) => {
                          const ctr = ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(2) : "0.00"

                          return (
                            <tr key={ad.id} className="border-b border-border">
                              <td className="p-4">
                                <div>
                                  <p className="font-medium">{ad.title}</p>
                                  <p className="text-sm text-muted-foreground">{ad.placement}</p>
                                </div>
                              </td>
                              <td className="p-4 text-sm">Vendor #{ad.vendorId}</td>
                              <td className="p-4">
                                <Badge variant="outline" className="capitalize">
                                  {ad.type.replace("-", " ")}
                                </Badge>
                              </td>
                              <td className="p-4 text-sm">
                                <div>
                                  <p>{ad.impressions.toLocaleString()} impressions</p>
                                  <p className="text-muted-foreground">
                                    {ad.clicks} clicks ({ctr}% CTR)
                                  </p>
                                </div>
                              </td>
                              <td className="p-4">
                                <Badge
                                  variant={ad.status === "active" ? "default" : "secondary"}
                                  className="capitalize"
                                >
                                  {ad.status}
                                </Badge>
                              </td>
                              <td className="p-4">
                                <div className="flex gap-2">
                                  <Button size="sm" variant="outline">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button size="sm" variant="outline">
                                    <Pause className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
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

export default function AdminAdvertisingPage() {
  return (
    <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
      <AdminAdvertisingContent />
    </ProtectedRoute>
  )
}

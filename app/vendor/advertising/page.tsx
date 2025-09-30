"use client"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ProtectedRoute } from "@/lib/firebase/protected-route"
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  TrendingUp,
  Megaphone,
  StoreIcon,
  Plus,
  Eye,
  Pause,
  Play,
  BarChart3,
} from "lucide-react"
import Link from "next/link"
import type { Advertisement } from "@/lib/types"

const mockCampaigns: Advertisement[] = [
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
    vendorId: "v1",
    type: "sponsored-product",
    title: "Headphones Promotion",
    imageUrl: "/diverse-people-listening-headphones.png",
    linkUrl: "/products/1",
    placement: "product-listing",
    impressions: 8920,
    clicks: 178,
    budget: 300,
    spent: 89.2,
    status: "active",
    startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 27 * 24 * 60 * 60 * 1000),
  },
]

function VendorAdvertisingContent() {
  const totalSpent = mockCampaigns.reduce((sum, ad) => sum + ad.spent, 0)
  const totalImpressions = mockCampaigns.reduce((sum, ad) => sum + ad.impressions, 0)
  const totalClicks = mockCampaigns.reduce((sum, ad) => sum + ad.clicks, 0)
  const avgCTR = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : "0.00"

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Advertising Campaigns</h1>
              <p className="text-muted-foreground">Manage your ad campaigns and track performance</p>
            </div>
            <Button asChild>
              <Link href="/vendor/advertising/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Campaign
              </Link>
            </Button>
          </div>

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
                <Button variant="ghost" className="w-full justify-start">
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
              <Link href="/vendor/advertising">
                <Button variant="default" className="w-full justify-start">
                  <Megaphone className="mr-2 h-4 w-4" />
                  Advertising
                </Button>
              </Link>
              <Link href="/vendor/store">
                <Button variant="ghost" className="w-full justify-start">
                  <StoreIcon className="mr-2 h-4 w-4" />
                  Store Settings
                </Button>
              </Link>
            </aside>

            {/* Main Content */}
            <div className="lg:col-span-3 space-y-6">
              {/* Performance Stats */}
              <div className="grid gap-4 sm:grid-cols-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Spent</p>
                        <p className="text-2xl font-bold">${totalSpent.toFixed(2)}</p>
                      </div>
                      <div className="rounded-full bg-blue-500/10 p-3">
                        <BarChart3 className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Impressions</p>
                        <p className="text-2xl font-bold">{totalImpressions.toLocaleString()}</p>
                      </div>
                      <div className="rounded-full bg-purple-500/10 p-3">
                        <Eye className="h-5 w-5 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Clicks</p>
                        <p className="text-2xl font-bold">{totalClicks.toLocaleString()}</p>
                      </div>
                      <div className="rounded-full bg-green-500/10 p-3">
                        <Megaphone className="h-5 w-5 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Avg CTR</p>
                        <p className="text-2xl font-bold">{avgCTR}%</p>
                      </div>
                      <div className="rounded-full bg-orange-500/10 p-3">
                        <TrendingUp className="h-5 w-5 text-orange-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Active Campaigns */}
              <Card>
                <CardHeader>
                  <CardTitle>Active Campaigns</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mockCampaigns.map((campaign) => {
                    const ctr =
                      campaign.impressions > 0 ? ((campaign.clicks / campaign.impressions) * 100).toFixed(2) : "0.00"
                    const budgetUsed = ((campaign.spent / campaign.budget) * 100).toFixed(0)

                    return (
                      <div key={campaign.id} className="rounded-lg border border-border p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">{campaign.title}</h3>
                              <Badge
                                variant={campaign.status === "active" ? "default" : "secondary"}
                                className="capitalize"
                              >
                                {campaign.status}
                              </Badge>
                              <Badge variant="outline" className="capitalize">
                                {campaign.type.replace("-", " ")}
                              </Badge>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">Impressions</p>
                                <p className="font-medium">{campaign.impressions.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Clicks</p>
                                <p className="font-medium">{campaign.clicks.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">CTR</p>
                                <p className="font-medium">{ctr}%</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Budget Used</p>
                                <p className="font-medium">
                                  ${campaign.spent.toFixed(2)} / ${campaign.budget.toFixed(2)} ({budgetUsed}%)
                                </p>
                              </div>
                            </div>

                            <div className="mt-3">
                              <div className="h-2 w-full rounded-full bg-muted">
                                <div className="h-2 rounded-full bg-primary" style={{ width: `${budgetUsed}%` }} />
                              </div>
                            </div>

                            <p className="text-xs text-muted-foreground mt-2">
                              {campaign.startDate.toLocaleDateString()} - {campaign.endDate.toLocaleDateString()}
                            </p>
                          </div>

                          <div className="flex gap-2 ml-4">
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              {campaign.status === "active" ? (
                                <Pause className="h-4 w-4" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {mockCampaigns.length === 0 && (
                    <div className="py-12 text-center">
                      <Megaphone className="mx-auto h-12 w-12 text-muted-foreground" />
                      <p className="mt-4 text-muted-foreground">No campaigns yet</p>
                      <Button asChild className="mt-4">
                        <Link href="/vendor/advertising/new">Create Your First Campaign</Link>
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

export default function VendorAdvertisingPage() {
  return (
    <ProtectedRoute allowedRoles={["vendor"]}>
      <VendorAdvertisingContent />
    </ProtectedRoute>
  )
}

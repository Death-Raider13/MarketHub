"use client"

import { useState, useEffect } from "react"
import { AdminHeader } from "@/components/admin/admin-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProtectedRoute } from "@/lib/firebase/protected-route"
import {
  Package,
  MessageSquare,
  Flag,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  AlertTriangle,
  Eye,
  Megaphone,
  Users
} from "lucide-react"
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import Link from "next/link"

interface ModeratorStats {
  pendingProducts: number
  pendingReviews: number
  pendingAds: number
  reportedItems: number
  approvedToday: number
  rejectedToday: number
}

function ModeratorDashboardContent() {
  const [stats, setStats] = useState<ModeratorStats>({
    pendingProducts: 0,
    pendingReviews: 0,
    pendingAds: 0,
    reportedItems: 0,
    approvedToday: 0,
    rejectedToday: 0
  })
  const [loading, setLoading] = useState(true)
  const [recentItems, setRecentItems] = useState<any[]>([])

  useEffect(() => {
    loadModeratorData()
  }, [])

  const loadModeratorData = async () => {
    try {
      setLoading(true)

      // Get pending products
      const pendingProductsQuery = query(
        collection(db, "products"),
        where("status", "==", "pending")
      )
      const pendingProductsSnapshot = await getDocs(pendingProductsQuery)

      // Get pending reviews
      const pendingReviewsQuery = query(
        collection(db, "reviews"),
        where("status", "==", "pending")
      )
      const pendingReviewsSnapshot = await getDocs(pendingReviewsQuery)

      // Get pending ads
      const pendingAdsQuery = query(
        collection(db, "advertisements"),
        where("status", "==", "pending")
      )
      const pendingAdsSnapshot = await getDocs(pendingAdsQuery)

      // Get reported items
      const reportedItemsQuery = query(
        collection(db, "reports"),
        where("status", "==", "pending")
      )
      const reportedItemsSnapshot = await getDocs(reportedItemsQuery)

      // Get today's approvals/rejections
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const approvedTodayQuery = query(
        collection(db, "products"),
        where("status", "==", "approved"),
        where("updatedAt", ">=", today)
      )
      const approvedTodaySnapshot = await getDocs(approvedTodayQuery)

      const rejectedTodayQuery = query(
        collection(db, "products"),
        where("status", "==", "rejected"),
        where("updatedAt", ">=", today)
      )
      const rejectedTodaySnapshot = await getDocs(rejectedTodayQuery)

      // Get recent items for moderation (mix of products and reviews)
      const recentProductsQuery = query(
        collection(db, "products"),
        where("status", "==", "pending"),
        orderBy("createdAt", "desc"),
        limit(3)
      )
      const recentProductsSnapshot = await getDocs(recentProductsQuery)

      const recentReviewsQuery = query(
        collection(db, "reviews"),
        where("status", "==", "pending"),
        orderBy("createdAt", "desc"),
        limit(2)
      )
      const recentReviewsSnapshot = await getDocs(recentReviewsQuery)

      const recentProducts = recentProductsSnapshot.docs.map(doc => ({
        id: doc.id,
        type: "product",
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      }))

      const recentReviews = recentReviewsSnapshot.docs.map(doc => ({
        id: doc.id,
        type: "review",
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      }))

      const recentItemsData = [...recentProducts, ...recentReviews]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)

      setStats({
        pendingProducts: pendingProductsSnapshot.size,
        pendingReviews: pendingReviewsSnapshot.size,
        pendingAds: pendingAdsSnapshot.size,
        reportedItems: reportedItemsSnapshot.size,
        approvedToday: approvedTodaySnapshot.size,
        rejectedToday: rejectedTodaySnapshot.size
      })

      setRecentItems(recentItemsData)
    } catch (error) {
      console.error("Error loading moderator data:", error)
    } finally {
      setLoading(false)
    }
  }

  const quickActions = [
    {
      title: "Review Products",
      description: `${stats.pendingProducts} products pending approval`,
      href: "/admin/products",
      icon: Package,
      color: "bg-blue-500",
      urgent: stats.pendingProducts > 10
    },
    {
      title: "Moderate Reviews",
      description: `${stats.pendingReviews} reviews to moderate`,
      href: "/admin/reviews",
      icon: MessageSquare,
      color: "bg-green-500",
      urgent: stats.pendingReviews > 20
    },
    {
      title: "Check Advertisements",
      description: `${stats.pendingAds} ads awaiting review`,
      href: "/admin/advertising",
      icon: Megaphone,
      color: "bg-purple-500",
      urgent: stats.pendingAds > 5
    },
    {
      title: "Handle Reports",
      description: `${stats.reportedItems} reported items`,
      href: "/admin/reports-abuse",
      icon: Flag,
      color: "bg-red-500",
      urgent: stats.reportedItems > 0
    }
  ]

  return (
    <div className="flex min-h-screen flex-col">
      <AdminHeader />

      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Content Moderation Dashboard
            </h1>
            <p className="text-muted-foreground">
              Review and moderate platform content to maintain quality standards
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pending Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">{stats.pendingProducts}</div>
                  <Package className="h-5 w-5 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pending Reviews
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">{stats.pendingReviews}</div>
                  <MessageSquare className="h-5 w-5 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Approved Today
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-green-600">{stats.approvedToday}</div>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-red-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Reported Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-red-600">{stats.reportedItems}</div>
                  <Flag className="h-5 w-5 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Priority Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {quickActions.map((action) => (
                  <Link key={action.href} href={action.href}>
                    <Card className={`cursor-pointer transition-all hover:shadow-md ${
                      action.urgent ? 'ring-2 ring-red-200 bg-red-50' : ''
                    }`}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${action.color} text-white`}>
                            <action.icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-sm">{action.title}</h3>
                            <p className="text-xs text-muted-foreground mt-1">
                              {action.description}
                            </p>
                            {action.urgent && (
                              <Badge variant="destructive" className="mt-2 text-xs">
                                Urgent
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Items for Review */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Submissions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No recent items to review
                    </p>
                  ) : (
                    recentItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-sm">{item.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.createdAt ? item.createdAt.toLocaleDateString() : 'Recently'}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="text-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Approve
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600">
                            <XCircle className="h-3 w-3 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Moderation Guidelines
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-sm text-blue-800">Product Review</h4>
                    <p className="text-xs text-blue-600 mt-1">
                      Check for appropriate images, accurate descriptions, and compliance with platform policies
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <h4 className="font-semibold text-sm text-green-800">Review Moderation</h4>
                    <p className="text-xs text-green-600 mt-1">
                      Ensure reviews are authentic, relevant, and follow community guidelines
                    </p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <h4 className="font-semibold text-sm text-purple-800">Ad Approval</h4>
                    <p className="text-xs text-purple-600 mt-1">
                      Verify ad content is appropriate and meets advertising standards
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function ModeratorDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={['moderator', 'admin', 'super_admin']}>
      <ModeratorDashboardContent />
    </ProtectedRoute>
  )
}

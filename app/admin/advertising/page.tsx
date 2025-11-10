"use client"

import { useState, useEffect } from "react"
import { AdminHeader } from "@/components/admin/admin-header"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ProtectedRoute } from "@/lib/firebase/protected-route"
import { PermissionGuard } from "@/components/admin/permission-guard"
import { LayoutDashboard, Users, Package, ShoppingCart, Megaphone, Settings, Store, Pause, Eye, Search, RefreshCw, Play } from "lucide-react"
import Link from "next/link"
import { collection, query, orderBy, limit, getDocs, doc, updateDoc, where } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import { toast } from "sonner"
import { createNotification, createAdminNotification } from "@/lib/notifications/service"
import { formatDistanceToNow } from "date-fns"

interface Advertisement {
  id: string
  vendorId: string
  vendorName?: string
  type: "banner" | "sponsored-product" | "featured-listing"
  title: string
  imageUrl: string
  linkUrl: string
  placement: string
  impressions: number
  clicks: number
  budget: number
  spent: number
  status: "active" | "paused" | "completed" | "rejected"
  startDate: Date
  endDate: Date
  createdAt: Date
}

function AdminAdvertisingContent() {
  const [ads, setAds] = useState<Advertisement[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    loadAdvertisements()
  }, [])

  const loadAdvertisements = async () => {
    try {
      setLoading(true)
      
      // Get advertisements from Firestore
      const adsQuery = query(
        collection(db, "advertisements"),
        orderBy("createdAt", "desc")
      )
      
      const adsSnapshot = await getDocs(adsQuery)
      console.log("Advertisements found:", adsSnapshot.docs.length)
      
      const adsData = adsSnapshot.docs.map(doc => {
        const data = doc.data()
        
        return {
          id: doc.id,
          vendorId: data.vendorId || "",
          vendorName: data.vendorName || "Unknown Vendor",
          type: data.type || "banner",
          title: data.title || "Untitled Campaign",
          imageUrl: data.imageUrl || "/placeholder.svg",
          linkUrl: data.linkUrl || "#",
          placement: data.placement || "homepage",
          impressions: data.impressions || 0,
          clicks: data.clicks || 0,
          budget: data.budget || 0,
          spent: data.spent || 0,
          status: data.status || "paused",
          startDate: data.startDate?.toDate() || new Date(),
          endDate: data.endDate?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date()
        }
      }) as Advertisement[]

      setAds(adsData)
    } catch (error) {
      console.error("Error loading advertisements:", error)
      toast.error("Failed to load advertisements")
      
      // Fallback to mock data
      const mockAds: Advertisement[] = [
        {
          id: "ad1",
          vendorId: "v1",
          vendorName: "TechStore Pro",
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
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
        {
          id: "ad2",
          vendorId: "v2",
          vendorName: "Fashion Hub",
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
          createdAt: new Date(),
        },
      ]
      setAds(mockAds)
    } finally {
      setLoading(false)
    }
  }

  const updateAdStatus = async (adId: string, newStatus: Advertisement['status']) => {
    try {
      await updateDoc(doc(db, "advertisements", adId), {
        status: newStatus,
        updatedAt: new Date()
      })
      
      // Find the ad to get vendor info
      const ad = ads.find(a => a.id === adId)
      
      setAds(prev => prev.map(ad => 
        ad.id === adId ? { ...ad, status: newStatus } : ad
      ))
      
      // Send notification to vendor about ad status change
      if (ad?.vendorId && (newStatus === 'approved' || newStatus === 'rejected')) {
        const notificationType = newStatus === 'approved' ? 'ad_pending_approval' : 'ad_pending_approval'
        await createNotification(ad.vendorId, notificationType, {
          title: `Advertisement ${newStatus === 'approved' ? 'Approved' : 'Rejected'}`,
          message: `Your advertisement "${ad.title}" has been ${newStatus}`,
          metadata: {
            adId: adId,
            actionUrl: `/vendor/advertising/${adId}`
          }
        })
      }
      
      toast.success(`Advertisement ${newStatus} and vendor notified`)
      
    } catch (error) {
      console.error("Error updating ad status:", error)
      toast.error("Failed to update advertisement status")
    }
  }

  const filteredAds = ads.filter(ad =>
    ad.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ad.vendorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ad.placement.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusColor = (status: Advertisement['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'paused': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const calculateCTR = (clicks: number, impressions: number): string => {
    if (impressions === 0) return "0.00"
    return ((clicks / impressions) * 100).toFixed(2)
  }

  return (
    <div className="flex min-h-screen bg-muted/30">
      <AdminSidebar />
      
      <div className="flex-1 flex flex-col">
        <AdminHeader />
        
        <main className="flex-1 p-6">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Advertising Management
              </h1>
              <p className="text-muted-foreground">
                Manage and monitor advertising campaigns across the platform
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-6">
            {/* Search */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input 
                      placeholder="Search campaigns..." 
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button onClick={loadAdvertisements} variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-4">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Total Campaigns</p>
                  <p className="text-2xl font-bold">{ads.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Active Campaigns</p>
                  <p className="text-2xl font-bold text-green-600">
                    {ads.filter(ad => ad.status === 'active').length}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Paused Campaigns</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {ads.filter(ad => ad.status === 'paused').length}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold">
                    ₦{ads.reduce((sum, ad) => sum + ad.spent, 0).toLocaleString()}
                  </p>
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
                      {loading ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center">
                            <div className="flex items-center justify-center">
                              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                            </div>
                          </td>
                        </tr>
                      ) : filteredAds.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-muted-foreground">
                            No advertisements found
                          </td>
                        </tr>
                      ) : (
                        filteredAds.map((ad) => {
                          const ctr = calculateCTR(ad.clicks, ad.impressions)

                          return (
                            <tr key={ad.id} className="border-b border-border">
                              <td className="p-4">
                                <div>
                                  <p className="font-medium">{ad.title}</p>
                                  <p className="text-sm text-muted-foreground">{ad.placement}</p>
                                </div>
                              </td>
                              <td className="p-4 text-sm">{ad.vendorName || `Vendor #${ad.vendorId}`}</td>
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
                                <Badge className={getStatusColor(ad.status)}>
                                  {ad.status}
                                </Badge>
                              </td>
                              <td className="p-4">
                                <div className="flex gap-2">
                                  <Button size="sm" variant="outline">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <PermissionGuard permission="ads.pause">
                                    {ad.status === 'active' ? (
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={() => updateAdStatus(ad.id, 'paused')}
                                      >
                                        <Pause className="h-4 w-4" />
                                      </Button>
                                    ) : ad.status === 'paused' ? (
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={() => updateAdStatus(ad.id, 'active')}
                                      >
                                        <Play className="h-4 w-4" />
                                      </Button>
                                    ) : null}
                                  </PermissionGuard>
                                </div>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}

export default function AdminAdvertisingPage() {
  return (
    <ProtectedRoute requiredPermission="ads.view">
      <AdminAdvertisingContent />
    </ProtectedRoute>
  )
}
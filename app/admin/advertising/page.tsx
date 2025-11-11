"use client"

import { useState, useEffect } from "react"
import { AdminHeader } from "@/components/admin/admin-header"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ProtectedRoute } from "@/lib/firebase/protected-route"
import { PermissionGuard } from "@/components/admin/permission-guard"
import { LayoutDashboard, Users, Package, ShoppingCart, Megaphone, Settings, Store, Pause, Eye, Search, RefreshCw, Play, Check, X, Clock, AlertCircle } from "lucide-react"
import Link from "next/link"
import { collection, query, orderBy, limit, getDocs, doc, updateDoc, where } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import { toast } from "sonner"
import { createNotification, createAdminNotification } from "@/lib/notifications/service"
import { formatDistanceToNow } from "date-fns"

interface Advertisement {
  id: string
  advertiserId: string
  advertiserInfo?: {
    companyName: string
    contactEmail: string
    phone: string
    accountBalance: number
  }
  campaignName: string
  budget: {
    total: number
    spent: number
    remaining: number
    dailyLimit: number
  }
  creative: {
    title: string
    description: string
    imageUrl: string
    destinationUrl: string
    ctaText: string
  }
  placement: {
    type: string
    targetVendors: string[]
    targetCategories: string[]
  }
  stats: {
    impressions: number
    clicks: number
    conversions: number
    ctr: number
  }
  status: "pending_review" | "active" | "paused" | "completed" | "rejected"
  fundsReserved: boolean
  reviewReason?: string
  reviewedBy?: string
  createdAt: Date
  updatedAt: Date
}

function AdminAdvertisingContent() {
  const [ads, setAds] = useState<Advertisement[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState<Advertisement | null>(null)
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null)
  const [reviewReason, setReviewReason] = useState("")
  const [submittingReview, setSubmittingReview] = useState(false)

  useEffect(() => {
    loadAdvertisements()
  }, [statusFilter])

  const loadAdvertisements = async () => {
    try {
      setLoading(true)
      
      // TEMPORARY: Skip auth headers for testing
      // TODO: Re-enable after Firebase login is fixed
      
      // Fetch from admin API
      const response = await fetch(`/api/admin/advertising?status=${statusFilter}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch campaigns')
      }
      
      const data = await response.json()
      setAds(data.campaigns || [])
    } catch (error) {
      console.error("Error loading advertisements:", error)
      toast.error("Failed to load advertisements")
      setAds([])
    } finally {
      setLoading(false)
    }
  }

  const handleReviewCampaign = (campaign: Advertisement, action: 'approve' | 'reject') => {
    setSelectedCampaign(campaign)
    setReviewAction(action)
    setReviewReason("")
    setShowReviewModal(true)
  }

  const submitReview = async () => {
    if (!selectedCampaign || !reviewAction) return
    
    try {
      setSubmittingReview(true)
      
      // TEMPORARY: Skip auth headers for testing
      // TODO: Re-enable after Firebase login is fixed
      
      const response = await fetch('/api/admin/advertising', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          campaignId: selectedCampaign.id,
          action: reviewAction,
          reason: reviewReason
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update campaign')
      }
      
      toast.success(`Campaign ${reviewAction}d successfully`)
      setShowReviewModal(false)
      loadAdvertisements() // Reload data
    } catch (error) {
      console.error('Error reviewing campaign:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to review campaign')
    } finally {
      setSubmittingReview(false)
    }
  }

  const updateAdStatus = async (adId: string, action: 'pause' | 'resume') => {
    try {
      // TEMPORARY: Skip auth headers for testing
      // TODO: Re-enable after Firebase login is fixed
      
      const response = await fetch('/api/admin/advertising', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          campaignId: adId,
          action: action
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update campaign')
      }
      
      toast.success(`Campaign ${action}d successfully`)
      loadAdvertisements() // Reload data
    } catch (error) {
      console.error('Error updating campaign:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update campaign')
    }
  }

  const filteredAds = ads.filter(ad =>
    (ad.creative?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     ad.advertiserInfo?.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     ad.placement?.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     ad.campaignName?.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (statusFilter === 'all' || ad.status === statusFilter)
  )

  const getStatusColor = (status: Advertisement['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'paused': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'pending_review': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: Advertisement['status']) => {
    switch (status) {
      case 'active': return <Play className="h-4 w-4" />
      case 'paused': return <Pause className="h-4 w-4" />
      case 'completed': return <Check className="h-4 w-4" />
      case 'rejected': return <X className="h-4 w-4" />
      case 'pending_review': return <Clock className="h-4 w-4" />
      default: return <AlertCircle className="h-4 w-4" />
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
            {/* Search and Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input 
                      placeholder="Search campaigns..." 
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <select 
                    value={statusFilter} 
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-input bg-background rounded-md text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="pending_review">Pending Review</option>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="rejected">Rejected</option>
                    <option value="completed">Completed</option>
                  </select>
                  <Button onClick={loadAdvertisements} variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-5">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Total Campaigns</p>
                  <p className="text-2xl font-bold">{ads.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Pending Review</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {ads.filter(ad => ad.status === 'pending_review').length}
                  </p>
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
                    ₦{ads.reduce((sum, ad) => sum + (ad.budget?.spent || 0), 0).toLocaleString()}
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
                        <th className="p-4 text-left text-sm font-medium">Advertiser</th>
                        <th className="p-4 text-left text-sm font-medium">Budget</th>
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
                          const ctr = calculateCTR(ad.stats?.clicks || 0, ad.stats?.impressions || 0)

                          return (
                            <tr key={ad.id} className="border-b border-border">
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <img 
                                    src={ad.creative?.imageUrl || '/placeholder.svg'} 
                                    alt={ad.creative?.title || 'Campaign'}
                                    className="w-12 h-12 object-cover rounded"
                                  />
                                  <div>
                                    <p className="font-medium">{ad.campaignName || ad.creative?.title}</p>
                                    <p className="text-sm text-muted-foreground">{ad.placement?.type}</p>
                                    <p className="text-xs text-muted-foreground">
                                      Created {formatDistanceToNow(new Date(ad.createdAt))} ago
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4 text-sm">
                                <div>
                                  <p className="font-medium">{ad.advertiserInfo?.companyName || 'Unknown'}</p>
                                  <p className="text-xs text-muted-foreground">{ad.advertiserInfo?.contactEmail}</p>
                                  <p className="text-xs text-muted-foreground">
                                    Balance: ₦{ad.advertiserInfo?.accountBalance?.toLocaleString() || 0}
                                  </p>
                                </div>
                              </td>
                              <td className="p-4 text-sm">
                                <div>
                                  <p className="font-medium">₦{ad.budget?.total?.toLocaleString() || 0}</p>
                                  <p className="text-xs text-muted-foreground">
                                    Spent: ₦{ad.budget?.spent?.toLocaleString() || 0}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Daily: ₦{ad.budget?.dailyLimit?.toLocaleString() || 0}
                                  </p>
                                </div>
                              </td>
                              <td className="p-4 text-sm">
                                <div>
                                  <p>{(ad.stats?.impressions || 0).toLocaleString()} impressions</p>
                                  <p className="text-muted-foreground">
                                    {ad.stats?.clicks || 0} clicks ({ctr}% CTR)
                                  </p>
                                  <p className="text-muted-foreground">
                                    {ad.stats?.conversions || 0} conversions
                                  </p>
                                </div>
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-2">
                                  {getStatusIcon(ad.status)}
                                  <Badge className={getStatusColor(ad.status)}>
                                    {ad.status.replace('_', ' ')}
                                  </Badge>
                                </div>
                                {ad.reviewReason && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {ad.reviewReason}
                                  </p>
                                )}
                              </td>
                              <td className="p-4">
                                <div className="flex gap-2 flex-wrap">
                                  {ad.status === 'pending_review' && (
                                    <PermissionGuard permission="ads.approve">
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        className="text-green-600 hover:text-green-700"
                                        onClick={() => handleReviewCampaign(ad, 'approve')}
                                      >
                                        <Check className="h-4 w-4" />
                                      </Button>
                                    </PermissionGuard>
                                  )}
                                  {ad.status === 'pending_review' && (
                                    <PermissionGuard permission="ads.reject">
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        className="text-red-600 hover:text-red-700"
                                        onClick={() => handleReviewCampaign(ad, 'reject')}
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </PermissionGuard>
                                  )}
                                  <Button size="sm" variant="outline">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <PermissionGuard permission="ads.pause">
                                    {ad.status === 'active' ? (
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={() => updateAdStatus(ad.id, 'pause')}
                                      >
                                        <Pause className="h-4 w-4" />
                                      </Button>
                                    ) : ad.status === 'paused' ? (
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={() => updateAdStatus(ad.id, 'resume')}
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

      {/* Review Modal */}
      {showReviewModal && selectedCampaign && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {reviewAction === 'approve' ? 'Approve' : 'Reject'} Campaign
            </h3>
            
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-2">
                Campaign: <span className="font-medium">{selectedCampaign.campaignName}</span>
              </p>
              <p className="text-sm text-muted-foreground mb-2">
                Advertiser: <span className="font-medium">{selectedCampaign.advertiserInfo?.companyName}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Budget: <span className="font-medium">₦{selectedCampaign.budget?.total?.toLocaleString()}</span>
              </p>
            </div>

            {reviewAction === 'approve' && (
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                <p className="text-sm text-green-800 dark:text-green-200">
                  ✓ Approving will deduct ₦{selectedCampaign.budget?.total?.toLocaleString()} from advertiser's account
                </p>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                {reviewAction === 'approve' ? 'Approval Notes (Optional)' : 'Rejection Reason'}
              </label>
              <textarea
                value={reviewReason}
                onChange={(e) => setReviewReason(e.target.value)}
                placeholder={reviewAction === 'approve' ? 'Add any notes...' : 'Please provide a reason for rejection...'}
                className="w-full p-2 border border-input rounded-md text-sm"
                rows={3}
                required={reviewAction === 'reject'}
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button 
                variant="outline" 
                onClick={() => setShowReviewModal(false)}
                disabled={submittingReview}
              >
                Cancel
              </Button>
              <Button 
                onClick={submitReview}
                disabled={submittingReview || (reviewAction === 'reject' && !reviewReason.trim())}
                className={reviewAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
              >
                {submittingReview ? 'Processing...' : (reviewAction === 'approve' ? 'Approve' : 'Reject')}
              </Button>
            </div>
          </div>
        </div>
      )}
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
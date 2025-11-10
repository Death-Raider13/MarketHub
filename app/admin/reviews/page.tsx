"use client"

import { useState, useEffect } from "react"
import { AdminHeader } from "@/components/admin/admin-header"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ProtectedRoute } from "@/lib/firebase/protected-route"
import {
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Eye,
  Star,
  MessageSquare,
  Flag,
  RefreshCw,
  AlertTriangle
} from "lucide-react"
import { collection, query, orderBy, limit, getDocs, doc, updateDoc, where } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import { formatDistanceToNow } from "date-fns"

interface Review {
  id: string
  productId: string
  productName: string
  customerId: string
  customerName: string
  vendorId: string
  vendorName: string
  rating: number
  comment: string
  status: 'pending' | 'approved' | 'rejected' | 'flagged'
  moderatorNote?: string
  createdAt: Date
  updatedAt: Date
  isVerifiedPurchase: boolean
  helpfulCount: number
  reportCount: number
}

function ReviewsModerationContent() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("pending")
  const [ratingFilter, setRatingFilter] = useState("all")
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [showReviewDetails, setShowReviewDetails] = useState(false)
  const [moderatorNote, setModeratorNote] = useState("")

  useEffect(() => {
    loadReviews()
  }, [])

  const loadReviews = async () => {
    try {
      setLoading(true)
      
      // Get reviews from Firestore
      const reviewsQuery = query(
        collection(db, "reviews"),
        orderBy("createdAt", "desc"),
        limit(100)
      )
      
      const reviewsSnapshot = await getDocs(reviewsQuery)
      const reviewsData = reviewsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Review[]

      setReviews(reviewsData)
    } catch (error) {
      console.error("Error loading reviews:", error)
    } finally {
      setLoading(false)
    }
  }

  const moderateReview = async (reviewId: string, action: 'approved' | 'rejected', note?: string) => {
    try {
      const reviewRef = doc(db, "reviews", reviewId)
      await updateDoc(reviewRef, {
        status: action,
        moderatorNote: note || '',
        updatedAt: new Date()
      })
      
      // Update local state
      setReviews(reviews.map(review => 
        review.id === reviewId 
          ? { ...review, status: action, moderatorNote: note || '', updatedAt: new Date() }
          : review
      ))
      
      console.log(`Review ${reviewId} ${action}`)
      setShowReviewDetails(false)
      setModeratorNote("")
    } catch (error) {
      console.error("Error moderating review:", error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'approved': return 'bg-green-100 text-green-800 border-green-200'
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200'
      case 'flagged': return 'bg-orange-100 text-orange-800 border-orange-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ))
  }

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = 
      review.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.comment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.vendorName?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || review.status === statusFilter
    const matchesRating = ratingFilter === "all" || review.rating.toString() === ratingFilter
    
    return matchesSearch && matchesStatus && matchesRating
  })

  const stats = {
    total: reviews.length,
    pending: reviews.filter(r => r.status === 'pending').length,
    approved: reviews.filter(r => r.status === 'approved').length,
    rejected: reviews.filter(r => r.status === 'rejected').length,
    flagged: reviews.filter(r => r.status === 'flagged').length,
    averageRating: reviews.length > 0 
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : '0.0'
  }

  return (
    <div className="flex min-h-screen bg-muted/30">
      <AdminSidebar />
      
      <div className="flex-1 flex flex-col">
        <AdminHeader />
        
        <main className="flex-1 p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Reviews Moderation
            </h1>
            <p className="text-muted-foreground">
              Review and moderate customer feedback to maintain quality standards
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Reviews
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <MessageSquare className="h-5 w-5 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pending Review
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Approved
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Flagged
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-orange-600">{stats.flagged}</div>
                  <Flag className="h-5 w-5 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Avg Rating
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">{stats.averageRating}</div>
                  <Star className="h-5 w-5 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Search */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Filter Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <Label htmlFor="search">Search Reviews</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search by product, customer, or review content..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="flagged">Flagged</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="rating">Rating</Label>
                  <Select value={ratingFilter} onValueChange={setRatingFilter}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Ratings</SelectItem>
                      <SelectItem value="5">5 Stars</SelectItem>
                      <SelectItem value="4">4 Stars</SelectItem>
                      <SelectItem value="3">3 Stars</SelectItem>
                      <SelectItem value="2">2 Stars</SelectItem>
                      <SelectItem value="1">1 Star</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button onClick={loadReviews} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Reviews Table */}
          <Card>
            <CardHeader>
              <CardTitle>Reviews ({filteredReviews.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Review</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReviews.map((review) => (
                      <TableRow key={review.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{review.productName || 'N/A'}</div>
                            <div className="text-sm text-muted-foreground">
                              by {review.vendorName || 'N/A'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{review.customerName || 'N/A'}</div>
                            {review.isVerifiedPurchase && (
                              <Badge variant="secondary" className="text-xs">
                                Verified Purchase
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {renderStars(review.rating)}
                            <span className="ml-1 text-sm">({review.rating})</span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <p className="truncate" title={review.comment}>
                            {review.comment || 'No comment'}
                          </p>
                          {review.reportCount > 0 && (
                            <Badge variant="destructive" className="text-xs mt-1">
                              {review.reportCount} reports
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(review.status)}>
                            {review.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {review.createdAt ? formatDistanceToNow(review.createdAt, { addSuffix: true }) : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedReview(review)
                                setShowReviewDetails(true)
                              }}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            
                            {review.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => moderateReview(review.id, 'approved')}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="h-3 w-3" />
                                </Button>
                                
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => moderateReview(review.id, 'rejected')}
                                >
                                  <XCircle className="h-3 w-3" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Review Details Dialog */}
          <Dialog open={showReviewDetails} onOpenChange={setShowReviewDetails}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Review Details</DialogTitle>
                <DialogDescription>
                  Review by {selectedReview?.customerName} for {selectedReview?.productName}
                </DialogDescription>
              </DialogHeader>
              
              {selectedReview && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Product</Label>
                      <p className="font-medium">{selectedReview.productName}</p>
                      <p className="text-sm text-muted-foreground">by {selectedReview.vendorName}</p>
                    </div>
                    <div>
                      <Label>Customer</Label>
                      <p className="font-medium">{selectedReview.customerName}</p>
                      {selectedReview.isVerifiedPurchase && (
                        <Badge variant="secondary" className="text-xs">
                          Verified Purchase
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <Label>Rating</Label>
                    <div className="flex items-center gap-2 mt-1">
                      {renderStars(selectedReview.rating)}
                      <span className="font-medium">({selectedReview.rating}/5)</span>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Review Comment</Label>
                    <p className="mt-1 p-3 bg-muted rounded-lg">
                      {selectedReview.comment || 'No comment provided'}
                    </p>
                  </div>
                  
                  {selectedReview.reportCount > 0 && (
                    <div>
                      <Label className="text-red-600">Reports</Label>
                      <p className="text-red-600 font-medium">
                        This review has been reported {selectedReview.reportCount} times
                      </p>
                    </div>
                  )}
                  
                  {selectedReview.status === 'pending' && (
                    <div>
                      <Label htmlFor="moderatorNote">Moderator Note (Optional)</Label>
                      <Textarea
                        id="moderatorNote"
                        placeholder="Add a note about your moderation decision..."
                        value={moderatorNote}
                        onChange={(e) => setModeratorNote(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  )}
                  
                  {selectedReview.moderatorNote && (
                    <div>
                      <Label>Previous Moderator Note</Label>
                      <p className="mt-1 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
                        {selectedReview.moderatorNote}
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowReviewDetails(false)}>
                  Cancel
                </Button>
                
                {selectedReview?.status === 'pending' && (
                  <>
                    <Button
                      onClick={() => moderateReview(selectedReview.id, 'rejected', moderatorNote)}
                      variant="destructive"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                    
                    <Button
                      onClick={() => moderateReview(selectedReview.id, 'approved', moderatorNote)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                  </>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  )
}

export default function ReviewsModerationPage() {
  return (
    <ProtectedRoute allowedRoles={['moderator', 'admin', 'super_admin']}>
      <ReviewsModerationContent />
    </ProtectedRoute>
  )
}

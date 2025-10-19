"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/firebase/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Star, ThumbsUp, MessageSquare, User, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"

interface Review {
  id: string
  productId: string
  userId: string
  userName: string
  userAvatar?: string
  rating: number
  title: string
  comment: string
  images?: string[]
  helpful: number
  verified: boolean
  createdAt: Date
  updatedAt: Date
}

interface ProductReviewsProps {
  productId: string
  vendorId: string
  canReview?: boolean // If user has purchased this product
}

export function ProductReviews({ productId, vendorId, canReview = false }: ProductReviewsProps) {
  const { user } = useAuth()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showReviewDialog, setShowReviewDialog] = useState(false)
  const [userReview, setUserReview] = useState<Review | null>(null)
  const [reviewStats, setReviewStats] = useState({
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  })

  const [reviewForm, setReviewForm] = useState({
    rating: 0,
    title: '',
    comment: ''
  })

  useEffect(() => {
    loadReviews()
    if (user) {
      checkUserReview()
    }
  }, [productId, user])

  const loadReviews = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/products/${productId}/reviews`)
      const data = await response.json()

      if (data.success) {
        setReviews(data.reviews || [])
        setReviewStats(data.stats || {
          averageRating: 0,
          totalReviews: 0,
          ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
        })
      }
    } catch (error) {
      console.error('Error loading reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkUserReview = async () => {
    if (!user) return

    try {
      const response = await fetch(`/api/products/${productId}/reviews/user?userId=${user.uid}`)
      const data = await response.json()

      if (data.success && data.review) {
        setUserReview(data.review)
      }
    } catch (error) {
      console.error('Error checking user review:', error)
    }
  }

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast.error('Please login to submit a review')
      return
    }

    if (reviewForm.rating === 0) {
      toast.error('Please select a rating')
      return
    }

    if (!reviewForm.title.trim() || !reviewForm.comment.trim()) {
      toast.error('Please fill in all fields')
      return
    }

    try {
      setSubmitting(true)

      const response = await fetch(`/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          userName: user.displayName || 'Anonymous',
          rating: reviewForm.rating,
          title: reviewForm.title.trim(),
          comment: reviewForm.comment.trim(),
          vendorId
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Review submitted successfully!')
        setShowReviewDialog(false)
        setReviewForm({ rating: 0, title: '', comment: '' })
        loadReviews()
        checkUserReview()
      } else {
        toast.error(data.error || 'Failed to submit review')
      }
    } catch (error) {
      console.error('Error submitting review:', error)
      toast.error('Failed to submit review')
    } finally {
      setSubmitting(false)
    }
  }

  const markHelpful = async (reviewId: string) => {
    if (!user) {
      toast.error('Please login to mark reviews as helpful')
      return
    }

    try {
      const response = await fetch(`/api/products/${productId}/reviews/${reviewId}/helpful`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid })
      })

      const data = await response.json()

      if (data.success) {
        loadReviews() // Refresh to show updated helpful count
        toast.success('Thank you for your feedback!')
      } else {
        toast.error(data.error || 'Failed to mark as helpful')
      }
    } catch (error) {
      console.error('Error marking helpful:', error)
      toast.error('Failed to mark as helpful')
    }
  }

  const renderStars = (rating: number, interactive = false, onRatingChange?: (rating: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => interactive && onRatingChange?.(star)}
            className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
            disabled={!interactive}
          >
            <Star
              className={`h-5 w-5 ${
                star <= rating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    )
  }

  const renderRatingDistribution = () => {
    const total = reviewStats.totalReviews
    if (total === 0) return null

    return (
      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map((rating) => {
          const count = reviewStats.ratingDistribution[rating as keyof typeof reviewStats.ratingDistribution] || 0
          const percentage = total > 0 ? (count / total) * 100 : 0

          return (
            <div key={rating} className="flex items-center gap-2 text-sm">
              <span className="w-8">{rating}★</span>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-400 h-2 rounded-full transition-all"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="w-8 text-muted-foreground">{count}</span>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Review Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Customer Reviews</span>
            {canReview && !userReview && (
              <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Star className="mr-2 h-4 w-4" />
                    Write Review
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Write a Review</DialogTitle>
                    <DialogDescription>
                      Share your experience with this product to help other customers.
                    </DialogDescription>
                  </DialogHeader>

                  <form onSubmit={submitReview} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Rating</Label>
                      {renderStars(reviewForm.rating, true, (rating) => 
                        setReviewForm(prev => ({ ...prev, rating }))
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="title">Review Title</Label>
                      <Input
                        id="title"
                        placeholder="Summarize your experience"
                        value={reviewForm.title}
                        onChange={(e) => setReviewForm(prev => ({ ...prev, title: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="comment">Your Review</Label>
                      <Textarea
                        id="comment"
                        placeholder="Tell others about your experience with this product..."
                        rows={4}
                        value={reviewForm.comment}
                        onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowReviewDialog(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={submitting || reviewForm.rating === 0}
                        className="flex-1"
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          'Submit Review'
                        )}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading reviews...</span>
            </div>
          ) : reviewStats.totalReviews === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Star className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No reviews yet</p>
              <p className="text-sm">Be the first to review this product!</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl font-bold">{reviewStats.averageRating.toFixed(1)}</div>
                  <div className="flex items-center justify-center gap-1 mb-2">
                    {renderStars(Math.round(reviewStats.averageRating))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Based on {reviewStats.totalReviews} review{reviewStats.totalReviews !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <div>
                {renderRatingDistribution()}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User's Review */}
      {userReview && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="text-sm">Your Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {renderStars(userReview.rating)}
                <Badge variant="secondary">Verified Purchase</Badge>
              </div>
              <h4 className="font-semibold">{userReview.title}</h4>
              <p className="text-muted-foreground">{userReview.comment}</p>
              <p className="text-xs text-muted-foreground">
                Reviewed {formatDistanceToNow(new Date(userReview.createdAt))} ago
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      {reviews.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">All Reviews</h3>
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={review.userAvatar} />
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{review.userName}</span>
                          {review.verified && (
                            <Badge variant="secondary" className="text-xs">
                              Verified Purchase
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {renderStars(review.rating)}
                          <span className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(review.createdAt))} ago
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">{review.title}</h4>
                    <p className="text-muted-foreground whitespace-pre-wrap">{review.comment}</p>
                  </div>

                  <div className="flex items-center gap-4 pt-2 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markHelpful(review.id)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <ThumbsUp className="mr-2 h-4 w-4" />
                      Helpful ({review.helpful})
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

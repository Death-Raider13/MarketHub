"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, User, Download } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface Review {
  id: string
  customerId: string
  rating: number
  review: string
  productName: string
  createdAt: string
}

interface DigitalProductReviewsProps {
  productId: string
  className?: string
}

export function DigitalProductReviews({ productId, className = "" }: DigitalProductReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [averageRating, setAverageRating] = useState(0)
  const [totalReviews, setTotalReviews] = useState(0)
  const [ratingDistribution, setRatingDistribution] = useState<Record<number, number>>({})

  useEffect(() => {
    loadReviews()
  }, [productId])

  const loadReviews = async () => {
    try {
      setLoading(true)
      
      const response = await fetch(`/api/digital-product-reviews/${productId}?limit=20`)
      
      if (response.ok) {
        const data = await response.json()
        setReviews(data.reviews || [])
        setAverageRating(data.averageRating || 0)
        setTotalReviews(data.totalReviews || 0)
        setRatingDistribution(data.ratingDistribution || {})
      } else {
        console.error('Reviews API error:', response.status, response.statusText)
        // For now, show no reviews instead of crashing
        setReviews([])
        setAverageRating(0)
        setTotalReviews(0)
        setRatingDistribution({})
      }
    } catch (error) {
      console.error('Error loading reviews:', error)
      // Fallback to no reviews if API fails
      setReviews([])
      setAverageRating(0)
      setTotalReviews(0)
      setRatingDistribution({})
    } finally {
      setLoading(false)
    }
  }

  const renderStars = (rating: number, size = "w-4 h-4") => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${size} ${
              star <= rating
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (totalReviews === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5" />
            Product Reviews
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 text-center py-8">
            No reviews yet. Be the first to review this digital product!
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="w-5 h-5" />
          Product Reviews
        </CardTitle>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {renderStars(Math.round(averageRating))}
            <span className="font-semibold">{averageRating}</span>
            <span className="text-gray-600">({totalReviews} reviews)</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Rating Distribution */}
        <div className="space-y-2">
          <h4 className="font-medium">Rating Breakdown</h4>
          {[5, 4, 3, 2, 1].map((rating) => (
            <div key={rating} className="flex items-center gap-2 text-sm">
              <span className="w-8">{rating}</span>
              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-400 h-2 rounded-full"
                  style={{
                    width: `${totalReviews > 0 ? (ratingDistribution[rating] / totalReviews) * 100 : 0}%`
                  }}
                ></div>
              </div>
              <span className="w-8 text-right">{ratingDistribution[rating] || 0}</span>
            </div>
          ))}
        </div>

        {/* Individual Reviews */}
        <div className="space-y-4">
          <h4 className="font-medium">Customer Reviews</h4>
          {reviews.map((review) => (
            <div key={review.id} className="border-b border-gray-100 pb-4 last:border-b-0">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-gray-100 p-2">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {renderStars(review.rating)}
                    <span className="text-sm text-gray-600">
                      {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  {review.review && (
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {review.review}
                    </p>
                  )}
                  <div className="mt-2 flex gap-2">
                    <Badge variant="outline" className="text-xs">
                      <Download className="w-3 h-3 mr-1" />
                      Verified Download
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

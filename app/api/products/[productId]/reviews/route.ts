import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'

export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const productId = params.productId

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    // Get all reviews for this product
    const reviewsSnapshot = await adminDb
      .collection('reviews')
      .where('productId', '==', productId)
      .orderBy('createdAt', 'desc')
      .get()

    const reviews = reviewsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    }))

    // Calculate review statistics
    const totalReviews = reviews.length
    const averageRating = totalReviews > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
      : 0

    const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    reviews.forEach(review => {
      if (review.rating >= 1 && review.rating <= 5) {
        ratingDistribution[review.rating as keyof typeof ratingDistribution]++
      }
    })

    const stats = {
      totalReviews,
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      ratingDistribution
    }

    return NextResponse.json({
      success: true,
      reviews,
      stats
    })

  } catch (error) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const productId = params.productId
    const {
      userId,
      userName,
      rating,
      title,
      comment,
      vendorId
    } = await request.json()

    if (!productId || !userId || !userName || !rating || !title || !comment || !vendorId) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    // Check if user has already reviewed this product
    const existingReviewSnapshot = await adminDb
      .collection('reviews')
      .where('productId', '==', productId)
      .where('userId', '==', userId)
      .get()

    if (!existingReviewSnapshot.empty) {
      return NextResponse.json(
        { error: 'You have already reviewed this product' },
        { status: 400 }
      )
    }

    // Check if user has purchased this product (for verified purchase badge)
    const purchaseSnapshot = await adminDb
      .collection('purchasedProducts')
      .where('userId', '==', userId)
      .where('productId', '==', productId)
      .get()

    const verified = !purchaseSnapshot.empty

    // Create the review
    const reviewData = {
      productId,
      userId,
      userName,
      rating,
      title: title.trim(),
      comment: comment.trim(),
      helpful: 0,
      verified,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const reviewRef = await adminDb.collection('reviews').add(reviewData)

    // Update product rating statistics
    await updateProductRating(productId)

    return NextResponse.json({
      success: true,
      reviewId: reviewRef.id,
      message: 'Review submitted successfully'
    })

  } catch (error) {
    console.error('Error creating review:', error)
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    )
  }
}

// Helper function to update product rating
async function updateProductRating(productId: string) {
  try {
    // Get all reviews for this product
    const reviewsSnapshot = await adminDb
      .collection('reviews')
      .where('productId', '==', productId)
      .get()

    const reviews = reviewsSnapshot.docs.map(doc => doc.data())
    const totalReviews = reviews.length
    const averageRating = totalReviews > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
      : 0

    // Update product document
    await adminDb.collection('products').doc(productId).update({
      rating: Math.round(averageRating * 10) / 10,
      reviewCount: totalReviews,
      updatedAt: new Date()
    })

  } catch (error) {
    console.error('Error updating product rating:', error)
  }
}

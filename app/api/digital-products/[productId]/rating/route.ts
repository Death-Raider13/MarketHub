import { NextRequest, NextResponse } from 'next/server'
import { getAdminFirestore } from '@/lib/firebase/admin'

export async function POST(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const { productId } = params
    const { rating, review, customerId, orderId } = await request.json()

    if (!rating || !customerId || !productId) {
      return NextResponse.json(
        { error: 'Rating, customer ID, and product ID are required' },
        { status: 400 }
      )
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    const adminDb = getAdminFirestore()
    if (!adminDb) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Verify the customer has purchased this digital product
    const purchaseQuery = await adminDb
      .collection('purchasedProducts')
      .where('userId', '==', customerId)
      .where('productId', '==', productId)
      .get()

    if (purchaseQuery.empty) {
      return NextResponse.json(
        { error: 'You can only rate products you have purchased' },
        { status: 403 }
      )
    }

    // Check if already rated
    const existingReviewQuery = await adminDb
      .collection('digitalProductReviews')
      .where('customerId', '==', customerId)
      .where('productId', '==', productId)
      .get()

    if (!existingReviewQuery.empty) {
      return NextResponse.json(
        { error: 'You have already rated this product' },
        { status: 400 }
      )
    }

    // Get product details
    const productDoc = await adminDb.collection('products').doc(productId).get()
    const productData = productDoc.data()

    // Create the review record
    const reviewData = {
      productId,
      customerId,
      orderId: orderId || null,
      productName: productData?.name || 'Unknown Product',
      vendorId: productData?.vendorId || null,
      rating,
      review: review || '',
      createdAt: new Date()
    }

    await adminDb.collection('digitalProductReviews').add(reviewData)

    // Recalculate and update product rating & review count on the main products document
    try {
      const reviewsSnapshot = await adminDb
        .collection('digitalProductReviews')
        .where('productId', '==', productId)
        .get()

      const reviews = reviewsSnapshot.docs.map(doc => doc.data()) as any[]
      const totalReviews = reviews.length
      const averageRating = totalReviews > 0
        ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / totalReviews
        : 0

      await adminDb.collection('products').doc(productId).update({
        rating: Math.round(averageRating * 10) / 10,
        reviewCount: totalReviews,
        updatedAt: new Date()
      })
    } catch (updateError) {
      console.error('Error updating digital product rating stats:', updateError)
      // Do not fail the request if stats update fails
    }

    return NextResponse.json({
      success: true,
      message: 'Rating submitted successfully'
    })

  } catch (error) {
    console.error('Error submitting digital product rating:', error)
    return NextResponse.json(
      { error: 'Failed to submit rating' },
      { status: 500 }
    )
  }
}

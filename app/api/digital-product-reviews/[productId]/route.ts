import { NextRequest, NextResponse } from 'next/server'
import { getAdminFirestore } from '@/lib/firebase/admin'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const { productId } = params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    const adminDb = getAdminFirestore()
    if (!adminDb) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Get reviews for this digital product
    let reviewsSnapshot
    try {
      reviewsSnapshot = await adminDb
        .collection('digitalProductReviews')
        .where('productId', '==', productId)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get()
    } catch (firestoreError) {
      console.error('Firestore query error:', firestoreError)
      // Fallback: get all reviews for this product without ordering
      reviewsSnapshot = await adminDb
        .collection('digitalProductReviews')
        .where('productId', '==', productId)
        .limit(limit)
        .get()
    }

    const reviews = reviewsSnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt
      }
    })

    // Calculate average rating
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0)
    const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0

    // Get rating distribution
    const ratingDistribution = {
      5: reviews.filter(r => r.rating === 5).length,
      4: reviews.filter(r => r.rating === 4).length,
      3: reviews.filter(r => r.rating === 3).length,
      2: reviews.filter(r => r.rating === 2).length,
      1: reviews.filter(r => r.rating === 1).length
    }

    const roundedAverage = Math.round(averageRating * 10) / 10

    // Best-effort sync with main products document so product header shows correct stats
    try {
      await adminDb.collection('products').doc(productId).update({
        rating: roundedAverage,
        reviewCount: reviews.length,
        updatedAt: new Date()
      })
    } catch (updateError) {
      console.error('Error syncing digital product rating to products doc:', updateError)
      // Do not fail the response if this update fails
    }

    return NextResponse.json({
      success: true,
      reviews,
      totalReviews: reviews.length,
      averageRating: roundedAverage, // Round to 1 decimal
      ratingDistribution
    })

  } catch (error) {
    console.error('Error fetching digital product reviews:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    )
  }
}

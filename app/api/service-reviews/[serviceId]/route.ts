import { NextRequest, NextResponse } from 'next/server'
import { getAdminFirestore } from '@/lib/firebase/admin'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { serviceId: string } }
) {
  try {
    const { serviceId } = params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')


    const adminDb = getAdminFirestore()
    if (!adminDb) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Get reviews for this service
    let reviewsSnapshot
    try {
      reviewsSnapshot = await adminDb
        .collection('serviceReviews')
        .where('serviceId', '==', serviceId)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get()
    } catch (firestoreError: any) {
      console.error('Firestore query error:', firestoreError)
      // Fallback: get all reviews for this service without ordering
      reviewsSnapshot = await adminDb
        .collection('serviceReviews')
        .where('serviceId', '==', serviceId)
        .limit(limit)
        .get()
    }

    const reviews: any[] = reviewsSnapshot.docs.map((doc: any): any => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt
      }
    })

    // Calculate average rating
    const totalRating = reviews.reduce((sum: number, review: any) => sum + (review.rating || 0), 0)
    const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0

    // Get rating distribution
    const ratingDistribution = {
      5: reviews.filter((r: any) => r.rating === 5).length,
      4: reviews.filter((r: any) => r.rating === 4).length,
      3: reviews.filter((r: any) => r.rating === 3).length,
      2: reviews.filter((r: any) => r.rating === 2).length,
      1: reviews.filter((r: any) => r.rating === 1).length
    }

    const roundedAverage = Math.round(averageRating * 10) / 10

    // Best-effort sync with main products document so service header shows correct stats
    try {
      await adminDb.collection('products').doc(serviceId).update({
        rating: roundedAverage,
        reviewCount: reviews.length,
        updatedAt: new Date()
      })
    } catch (updateError: any) {
      console.error('Error syncing service product rating to products doc:', updateError)
      // Do not fail the response if this update fails
    }

    return NextResponse.json({
      success: true,
      reviews,
      totalReviews: reviews.length,
      averageRating: roundedAverage, // Round to 1 decimal
      ratingDistribution
    })

  } catch (error: any) {
    console.error('Error fetching service reviews:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    )
  }
}

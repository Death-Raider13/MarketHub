import { NextRequest, NextResponse } from 'next/server'
import { getAdminFirestore } from '@/lib/firebase/admin-simple'
import { verifyAuthToken } from '@/lib/api-auth'
import { logger } from '@/lib/logger'

export async function POST(
  request: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  try {
    const { bookingId } = params

    // 1. Authenticate
    const authResult = await verifyAuthToken(request)
    if ('error' in authResult) {
      return authResult.error
    }

    const { user } = authResult
    const customerId = user.uid

    // 2. Validate input
    const { rating, review } = await request.json()

    if (!rating) {
      return NextResponse.json(
        { error: 'Rating is required' },
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

    // 3. Get the booking and verify ownership
    const bookingRef = adminDb.collection('serviceBookings').doc(bookingId)
    const bookingDoc = await bookingRef.get()

    if (!bookingDoc.exists) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    const bookingData = bookingDoc.data()

    // SECURITY: Verify the authenticated user is the one who bought the service
    if (bookingData?.customerId !== customerId) {
      logger.warn(`Unauthorized rating attempt: booking=${bookingId}, user=${customerId}`)
      return NextResponse.json(
        { error: 'Unauthorized: You did not book this service' },
        { status: 403 }
      )
    }

    // Check if service is completed
    if (bookingData?.status !== 'completed') {
      return NextResponse.json(
        { error: 'Can only rate completed services' },
        { status: 400 }
      )
    }

    // Check if already rated
    if (bookingData?.rating) {
      return NextResponse.json(
        { error: 'Service already rated' },
        { status: 400 }
      )
    }

    // 4. Update the booking and create review record
    await bookingRef.update({
      rating,
      review: review || '',
      ratedAt: new Date(),
      updatedAt: new Date()
    })

    const reviewData = {
      bookingId,
      serviceId: bookingData.serviceId,
      creatorId: bookingData.creatorId,
      customerId,
      serviceName: bookingData.serviceName,
      rating,
      review: review || '',
      createdAt: new Date()
    }

    await adminDb.collection('serviceReviews').add(reviewData)

    // 5. Async recalculate product rating stats
    try {
      const serviceId = bookingData.serviceId
      const reviewsSnapshot = await adminDb
        .collection('serviceReviews')
        .where('serviceId', '==', serviceId)
        .get()

      const reviews = reviewsSnapshot.docs.map((doc: any) => doc.data()) as any[]
      const totalReviews = reviews.length
      const averageRating = totalReviews > 0
        ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / totalReviews
        : 0

      await adminDb.collection('products').doc(serviceId).update({
        rating: Math.round(averageRating * 10) / 10,
        reviewCount: totalReviews,
        updatedAt: new Date()
      })
    } catch (statsError: any) {
      logger.error('Error updating service product rating stats', { serviceId: bookingData.serviceId }, statsError)
    }

    return NextResponse.json({
      success: true,
      message: 'Rating submitted successfully'
    })

  } catch (error: any) {
    logger.error('Error submitting service rating', { bookingId: params.bookingId }, error)
    return NextResponse.json(
      { error: 'Failed to submit rating' },
      { status: 500 }
    )
  }
}


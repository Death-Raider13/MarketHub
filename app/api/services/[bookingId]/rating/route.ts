import { NextRequest, NextResponse } from 'next/server'
import { getAdminFirestore } from '@/lib/firebase/admin'

export async function POST(
  request: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  try {
    const { bookingId } = params
    const { rating, review, customerId } = await request.json()

    if (!rating || !customerId) {
      return NextResponse.json(
        { error: 'Rating and customer ID are required' },
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

    // Get the booking
    const bookingRef = adminDb.collection('serviceBookings').doc(bookingId)
    const bookingDoc = await bookingRef.get()

    if (!bookingDoc.exists) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    const bookingData = bookingDoc.data()

    // Verify authorization
    if (bookingData?.customerId !== customerId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
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

    // Update the booking with rating
    await bookingRef.update({
      rating,
      review: review || '',
      ratedAt: new Date(),
      updatedAt: new Date()
    })

    // Also create a separate review record for the service/vendor
    const reviewData = {
      bookingId,
      serviceId: bookingData.serviceId,
      vendorId: bookingData.vendorId,
      customerId,
      serviceName: bookingData.serviceName,
      rating,
      review: review || '',
      createdAt: new Date()
    }


    await adminDb.collection('serviceReviews').add(reviewData)

    // Recalculate and update service product rating & review count on the main products document
    try {
      const serviceId = bookingData.serviceId
      const reviewsSnapshot = await adminDb
        .collection('serviceReviews')
        .where('serviceId', '==', serviceId)
        .get()

      const reviews = reviewsSnapshot.docs.map(doc => doc.data()) as any[]
      const totalReviews = reviews.length
      const averageRating = totalReviews > 0
        ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / totalReviews
        : 0

      await adminDb.collection('products').doc(serviceId).update({
        rating: Math.round(averageRating * 10) / 10,
        reviewCount: totalReviews,
        updatedAt: new Date()
      })
    } catch (updateError) {
      console.error('Error updating service product rating stats:', updateError)
      // Do not fail the request if stats update fails
    }

    return NextResponse.json({
      success: true,
      message: 'Rating submitted successfully'
    })

  } catch (error) {
    console.error('Error submitting rating:', error)
    return NextResponse.json(
      { error: 'Failed to submit rating' },
      { status: 500 }
    )
  }
}

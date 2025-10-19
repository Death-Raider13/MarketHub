import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'

export async function POST(
  request: NextRequest,
  { params }: { params: { productId: string; reviewId: string } }
) {
  try {
    const { reviewId } = params
    const { userId } = await request.json()

    if (!reviewId || !userId) {
      return NextResponse.json(
        { error: 'Review ID and User ID are required' },
        { status: 400 }
      )
    }

    // Check if user has already marked this review as helpful
    const helpfulSnapshot = await adminDb
      .collection('reviewHelpful')
      .where('reviewId', '==', reviewId)
      .where('userId', '==', userId)
      .get()

    if (!helpfulSnapshot.empty) {
      return NextResponse.json(
        { error: 'You have already marked this review as helpful' },
        { status: 400 }
      )
    }

    // Add helpful record
    await adminDb.collection('reviewHelpful').add({
      reviewId,
      userId,
      createdAt: new Date()
    })

    // Increment helpful count on review
    const reviewRef = adminDb.collection('reviews').doc(reviewId)
    const reviewDoc = await reviewRef.get()
    
    if (reviewDoc.exists) {
      const currentHelpful = reviewDoc.data()?.helpful || 0
      await reviewRef.update({
        helpful: currentHelpful + 1,
        updatedAt: new Date()
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Review marked as helpful'
    })

  } catch (error) {
    console.error('Error marking review as helpful:', error)
    return NextResponse.json(
      { error: 'Failed to mark review as helpful' },
      { status: 500 }
    )
  }
}

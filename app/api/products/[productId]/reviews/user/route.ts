import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'

export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const productId = params.productId
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!productId || !userId) {
      return NextResponse.json(
        { error: 'Product ID and User ID are required' },
        { status: 400 }
      )
    }

    // Get user's review for this product
    const reviewSnapshot = await adminDb
      .collection('reviews')
      .where('productId', '==', productId)
      .where('userId', '==', userId)
      .get()

    if (reviewSnapshot.empty) {
      return NextResponse.json({
        success: true,
        review: null
      })
    }

    const reviewDoc = reviewSnapshot.docs[0]
    const review = {
      id: reviewDoc.id,
      ...reviewDoc.data(),
      createdAt: reviewDoc.data().createdAt?.toDate(),
      updatedAt: reviewDoc.data().updatedAt?.toDate()
    }

    return NextResponse.json({
      success: true,
      review
    })

  } catch (error) {
    console.error('Error fetching user review:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user review' },
      { status: 500 }
    )
  }
}

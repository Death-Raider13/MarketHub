import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Get all purchased products for this user
    const purchasesSnapshot = await adminDb
      .collection('purchasedProducts')
      .where('userId', '==', userId)
      .orderBy('purchasedAt', 'desc')
      .get()

    // Helper to safely convert Firestore Timestamp or JS Date to JS Date
    const toDateSafe = (val: any) => {
      if (!val) return null
      if (typeof val.toDate === 'function') return val.toDate()
      if (val instanceof Date) return val
      try {
        return new Date(val)
      } catch {
        return null
      }
    }

    let purchases = []

    try {
      // Get all purchases first
      const purchaseData = purchasesSnapshot.docs.map(doc => {
        const data = doc.data()

        const purchasedAt = toDateSafe(data.purchasedAt)
        const accessExpiresAt = toDateSafe(data.accessExpiresAt)
        const lastDownloadedAt = toDateSafe(data.lastDownloadedAt)

        return {
          id: doc.id,
          ...data,
          // Convert Dates to ISO strings to ensure JSON serializability
          purchasedAt: purchasedAt ? purchasedAt.toISOString() : null,
          accessExpiresAt: accessExpiresAt ? accessExpiresAt.toISOString() : null,
          lastDownloadedAt: lastDownloadedAt ? lastDownloadedAt.toISOString() : null
        }
      })

      // For digital products, fetch rating information
      purchases = await Promise.all(
        purchaseData.map(async (purchase) => {
          // Only fetch ratings for digital products
          if (purchase.product?.type === 'digital') {
            try {
              const ratingQuery = await adminDb
                .collection('digitalProductReviews')
                .where('customerId', '==', userId)
                .where('productId', '==', purchase.productId)
                .limit(1)
                .get()

              if (!ratingQuery.empty) {
                const ratingData = ratingQuery.docs[0].data()
                const ratedAt = toDateSafe(ratingData.createdAt)
                
                return {
                  ...purchase,
                  rating: ratingData.rating,
                  review: ratingData.review,
                  ratedAt: ratedAt ? ratedAt.toISOString() : null
                }
              }
            } catch (ratingError) {
              console.error('Error fetching rating for product:', purchase.productId, ratingError)
            }
          }
          
          return purchase
        })
      )
    } catch (mapError) {
      console.error('Error mapping purchases snapshot:', mapError)
      return NextResponse.json({ error: 'Failed to process purchases', details: String(mapError) }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      purchases
    })

  } catch (error) {
    console.error('Error fetching purchases:', error)
    return NextResponse.json(
      { error: 'Failed to fetch purchases' },
      { status: 500 }
    )
  }
}

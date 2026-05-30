import { NextRequest, NextResponse } from 'next/server'
import { getAdminFirestore } from '@/lib/firebase/admin-simple'
import { verifyAuthToken } from '@/lib/api-auth'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const auth = await verifyAuthToken(request)
  if ('error' in auth) return auth.error

  try {
    const { searchParams } = new URL(request.url)
    const requestedUserId = searchParams.get('userId')

    // Users may only list their own purchases; admins may read any.
    const isAdmin = auth.user.role === 'admin' || auth.user.role === 'super_admin'
    if (requestedUserId && requestedUserId !== auth.user.uid && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const userId = requestedUserId || auth.user.uid

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const adminDb = getAdminFirestore()
    if (!adminDb) {
      console.error('❌ Admin Firestore not available')
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 500 }
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

    let purchases: any[] = []

    try {
      // Get all purchases first
      const purchaseData = purchasesSnapshot.docs.map((doc: any): any => {
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
        purchaseData.map(async (purchase: any) => {
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
            } catch (ratingError: any) {
              console.error('Error fetching rating for product:', purchase.productId, ratingError)
            }
          }
          
          return purchase
        })
      )
    } catch (mapError: any) {
      console.error('Error mapping purchases snapshot:', mapError)
      return NextResponse.json({ error: 'Failed to process purchases', details: String(mapError) }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      purchases
    })

  } catch (error: any) {
    console.error('Error fetching purchases:', error)
    return NextResponse.json(
      { error: 'Failed to fetch purchases' },
      { status: 500 }
    )
  }
}

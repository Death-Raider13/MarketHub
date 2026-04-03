import { NextRequest, NextResponse } from 'next/server'
import { getAdminFirestore } from '@/lib/firebase/admin-simple'
import { devOnlyGuard } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const blocked = devOnlyGuard()
  if (blocked) return blocked

  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const orderId = searchParams.get('orderId')

    if (!userId && !orderId) {
      return NextResponse.json(
        { error: 'Either userId or orderId is required' },
        { status: 400 }
      )
    }

    const adminDb = getAdminFirestore()
    if (!adminDb) {
      return NextResponse.json(
        { error: 'Database not initialized' },
        { status: 500 }
      )
    }

    const results: any = {
      timestamp: new Date().toISOString(),
      userId,
      orderId
    }

    // Check purchases
    if (userId) {
      const purchasesQuery = await adminDb
        .collection('purchasedProducts')
        .where('userId', '==', userId)
        .get()
      
      results.purchases = {
        count: purchasesQuery.size,
        items: purchasesQuery.docs.map((doc: any) => ({
          id: doc.id,
          ...doc.data()
        }))
      }
    }

    // Check order
    if (orderId) {
      const orderDoc = await adminDb
        .collection('orders')
        .doc(orderId)
        .get()
      
      if (orderDoc.exists) {
        results.order = {
          id: orderDoc.id,
          ...orderDoc.data()
        }

        // Check purchases for this order
        const orderPurchases = await adminDb
          .collection('purchasedProducts')
          .where('orderId', '==', orderId)
          .get()
        
        results.orderPurchases = {
          count: orderPurchases.size,
          items: orderPurchases.docs.map((doc: any) => ({
            id: doc.id,
            ...doc.data()
          }))
        }
      } else {
        results.order = null
      }
    }

    return NextResponse.json(results, { status: 200 })

  } catch (error: any) {
    console.error('Debug check error:', error)
    return NextResponse.json(
      { error: 'Debug check failed', details: error.message },
      { status: 500 }
    )
  }
}

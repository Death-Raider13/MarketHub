import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'

export async function POST(request: NextRequest) {
  try {
    const { action, refundIds, adminUserId, rejectionReason, resolutionNotes } = await request.json()

    if (!action || !refundIds || !Array.isArray(refundIds) || refundIds.length === 0) {
      return NextResponse.json(
        { error: 'action and refundIds array are required' },
        { status: 400 }
      )
    }

    if (refundIds.length > 50) {
      return NextResponse.json(
        { error: 'Maximum 50 refunds can be processed at once' },
        { status: 400 }
      )
    }

    const results = []
    const errors = []

    for (const refundId of refundIds) {
      try {
        const response = await fetch(`${request.nextUrl.origin}/api/refunds/${refundId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action,
            adminUserId,
            rejectionReason,
            resolutionNotes,
          }),
        })

        const data = await response.json()

        if (data.success) {
          results.push({
            refundId,
            success: true,
            refund: data.refund,
          })
        } else {
          errors.push({
            refundId,
            error: data.error || 'Unknown error',
          })
        }
      } catch (error) {
        errors.push({
          refundId,
          error: error instanceof Error ? error.message : 'Processing failed',
        })
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      failed: errors.length,
      results,
      errors,
    })
  } catch (error) {
    console.error('Error processing bulk refunds:', error)
    return NextResponse.json(
      { error: 'Failed to process bulk refunds' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const paymentMethod = searchParams.get('paymentMethod')
    const minAmount = searchParams.get('minAmount')
    const maxAmount = searchParams.get('maxAmount')
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')

    let query = adminDb.collection('refunds')

    // Apply filters
    if (status) {
      query = query.where('status', '==', status)
    }
    if (paymentMethod) {
      query = query.where('paymentMethod', '==', paymentMethod)
    }

    // Date range filter
    if (fromDate) {
      query = query.where('createdAt', '>=', new Date(fromDate))
    }
    if (toDate) {
      query = query.where('createdAt', '<=', new Date(toDate))
    }

    query = query.orderBy('createdAt', 'desc').limit(100)

    const snapshot = await query.get()
    
    let refunds = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt,
    }))

    // Apply amount filters (Firestore doesn't support range queries with other filters)
    if (minAmount) {
      const min = parseFloat(minAmount)
      refunds = refunds.filter((r: any) => (r.amount || 0) >= min)
    }
    if (maxAmount) {
      const max = parseFloat(maxAmount)
      refunds = refunds.filter((r: any) => (r.amount || 0) <= max)
    }

    // Get order data for each refund
    const refundsWithOrders = await Promise.all(
      refunds.map(async (refund: any) => {
        let orderData = null
        if (refund.orderId) {
          try {
            const orderDoc = await adminDb.collection('orders').doc(refund.orderId).get()
            if (orderDoc.exists()) {
              const order = orderDoc.data()
              orderData = {
                id: orderDoc.id,
                orderNumber: order?.orderNumber,
                customerName: order?.customerName,
                customerEmail: order?.customerEmail || order?.userEmail,
                totalAmount: order?.totalAmount || order?.total,
              }
            }
          } catch (orderError) {
            console.error(`Failed to fetch order ${refund.orderId}:`, orderError)
          }
        }

        return {
          ...refund,
          order: orderData,
        }
      })
    )

    return NextResponse.json({
      success: true,
      refunds: refundsWithOrders,
      total: refundsWithOrders.length,
      filters: {
        status,
        paymentMethod,
        minAmount,
        maxAmount,
        fromDate,
        toDate,
      },
    })
  } catch (error) {
    console.error('Error fetching bulk refunds:', error)
    return NextResponse.json(
      { error: 'Failed to fetch refunds' },
      { status: 500 }
    )
  }
}
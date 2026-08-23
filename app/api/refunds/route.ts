import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { adminDb } from '@/lib/firebase/admin'
import { verifyAuthToken } from '@/lib/api-auth'

export async function POST(request: NextRequest) {
  const auth = await verifyAuthToken(request)
  if ('error' in auth) return auth.error

  try {
    const { orderId, reason } = await request.json()
    // Always use the authenticated user as the claimant — never trust body userId.
    const userId = auth.user.uid

    if (!orderId || !reason) {
      return NextResponse.json(
        { error: 'orderId and reason are required' },
        { status: 400 }
      )
    }

    const orderRef = adminDb.collection('orders').doc(orderId)
    const orderDoc = await orderRef.get()

    if (!orderDoc.exists) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    const orderData = orderDoc.data() as any

    if (orderData.userId !== userId && orderData.customerId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized access to order' },
        { status: 403 }
      )
    }

    const createdAt = orderData.createdAt && typeof orderData.createdAt.toDate === 'function'
      ? orderData.createdAt.toDate()
      : new Date(orderData.createdAt || Date.now())

    const now = new Date()
    const daysSinceOrder = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)

    if (daysSinceOrder > 7) {
      return NextResponse.json(
        { error: 'Return window has expired for this order' },
        { status: 400 }
      )
    }

    const existingRefundsSnapshot = await adminDb
      .collection('refunds')
      .where('orderId', '==', orderId)
      .where('userId', '==', userId)
      .get()

    const hasActiveRefund = existingRefundsSnapshot.docs.some(doc => {
      const data = doc.data() as any
      return ['pending', 'approved'].includes(data.status)
    })

    if (hasActiveRefund) {
      return NextResponse.json(
        { error: 'You already have an active refund request for this order' },
        { status: 400 }
      )
    }

    const refundData = {
      userId,
      orderId,
      creatorId: orderData.creatorId || null,
      reason,
      status: 'pending',
      amount: orderData.total || 0,
      paymentMethod: orderData.paymentMethod || 'unknown',
      paymentReference: orderData.paymentReference || null,
      coinbaseChargeId: orderData.coinbaseChargeId || null,
      createdAt: now,
      updatedAt: now,
    }

    const refundRef = await adminDb.collection('refunds').add(refundData)

    try {
      await orderRef.update({
        status: 'refund_requested',
        updatedAt: now,
      })
    } catch (orderUpdateError) {
      console.error('Failed to update order status to refund_requested:', orderUpdateError)
    }

    try {
      const { sendRefundRequestedEmail } = await import('@/lib/email/service')
      await sendRefundRequestedEmail({ id: orderId, ...orderData }, { id: refundRef.id, ...refundData })
    } catch (emailError) {
      console.error('Failed to send refund requested email:', emailError)
    }

    return NextResponse.json({
      success: true,
      refundId: refundRef.id,
    })
  } catch (error) {
    console.error('Error creating refund request:', error)
    return NextResponse.json(
      { error: 'Failed to create refund request' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const userId = searchParams.get('userId')
    const creatorId = searchParams.get('creatorId')
    const orderId = searchParams.get('orderId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const page = parseInt(searchParams.get('page') || '1')

    let query: any = adminDb.collection('refunds')

    // Apply filters
    if (status) {
      query = query.where('status', '==', status)
    }
    if (userId) {
      query = query.where('userId', '==', userId)
    }
    if (creatorId) {
      query = query.where('creatorId', '==', creatorId)
    }
    if (orderId) {
      query = query.where('orderId', '==', orderId)
    }

    // Order by creation date (newest first)
    query = query.orderBy('createdAt', 'desc')

    // Apply pagination
    const offset = (page - 1) * limit
    if (offset > 0) {
      const offsetSnapshot = await query.limit(offset).get()
      if (!offsetSnapshot.empty) {
        const lastDoc = offsetSnapshot.docs[offsetSnapshot.docs.length - 1]
        query = query.startAfter(lastDoc)
      }
    }

    query = query.limit(limit)

    const snapshot = await query.get()

    const refunds = await Promise.all(
      snapshot.docs.map(async (doc: any) => {
        const refundData = doc.data()

        // Get associated order data
        let orderData = null
        if (refundData.orderId) {
          try {
            const orderDoc = await adminDb.collection('orders').doc(refundData.orderId).get()
            if (orderDoc.exists) {
              const order = orderDoc.data()
              orderData = {
                id: orderDoc.id,
                orderNumber: order?.orderNumber,
                customerName: order?.customerName,
                customerEmail: order?.customerEmail || order?.userEmail,
                totalAmount: order?.totalAmount || order?.total,
                paymentMethod: order?.paymentMethod,
                createdAt: order?.createdAt?.toDate?.() || order?.createdAt,
              }
            }
          } catch (orderError) {
            console.error(`Failed to fetch order ${refundData.orderId}:`, orderError)
          }
        }

        return {
          id: doc.id,
          ...refundData,
          createdAt: refundData.createdAt?.toDate?.() || refundData.createdAt,
          updatedAt: refundData.updatedAt?.toDate?.() || refundData.updatedAt,
          refundedAt: refundData.refundedAt?.toDate?.() || refundData.refundedAt,
          order: orderData,
        }
      })
    )

    // Get total count for pagination
    const totalQuery = adminDb.collection('refunds')
    let countQuery: any = totalQuery
    if (status) countQuery = countQuery.where('status', '==', status)
    if (userId) countQuery = countQuery.where('userId', '==', userId)
    if (creatorId) countQuery = countQuery.where('creatorId', '==', creatorId)
    if (orderId) countQuery = countQuery.where('orderId', '==', orderId)

    const totalSnapshot = await countQuery.get()
    const total = totalSnapshot.size

    return NextResponse.json({
      success: true,
      refunds,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    })
  } catch (error) {
    console.error('Error fetching refunds:', error)
    return NextResponse.json(
      { error: 'Failed to fetch refunds' },
      { status: 500 }
    )
  }
}

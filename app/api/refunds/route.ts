import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'

export async function POST(request: NextRequest) {
  try {
    const { userId, orderId, reason } = await request.json()

    if (!userId || !orderId || !reason) {
      return NextResponse.json(
        { error: 'userId, orderId and reason are required' },
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
      vendorId: orderData.vendorId || null,
      reason,
      status: 'pending',
      amount: orderData.total || 0,
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

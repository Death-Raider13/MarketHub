import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-paystack-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      )
    }

    // Verify webhook signature
    const secret = process.env.PAYSTACK_SECRET_KEY
    if (!secret) {
      console.error('Paystack secret key not configured')
      return NextResponse.json(
        { error: 'Webhook verification failed' },
        { status: 400 }
      )
    }

    const hash = crypto
      .createHmac('sha512', secret)
      .update(body)
      .digest('hex')

    if (hash !== signature) {
      console.error('Invalid webhook signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    const event = JSON.parse(body)
    console.log('Paystack refund webhook received:', event.event)

    // Handle refund events
    if (event.event === 'refund.processed') {
      await handleRefundProcessed(event.data)
    } else if (event.event === 'refund.pending') {
      await handleRefundPending(event.data)
    } else if (event.event === 'refund.failed') {
      await handleRefundFailed(event.data)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Paystack refund webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handleRefundProcessed(refundData: any) {
  try {
    console.log('Processing refund completed:', refundData)

    // Find our refund record by Paystack refund ID
    const refundsSnapshot = await adminDb
      .collection('refunds')
      .where('paystackRefundId', '==', refundData.id)
      .get()

    if (refundsSnapshot.empty) {
      console.error('No matching refund found for Paystack refund ID:', refundData.id)
      return
    }

    const refundDoc = refundsSnapshot.docs[0]
    const refundId = refundDoc.id
    const refund = refundDoc.data()

    // Update refund status
    await refundDoc.ref.update({
      status: 'refunded',
      refundedAt: new Date(),
      paystackRefundStatus: refundData.status,
      updatedAt: new Date(),
    })

    // Update order status
    if (refund.orderId) {
      await adminDb.collection('orders').doc(refund.orderId).update({
        status: 'refunded',
        paymentStatus: 'refunded',
        refundedAt: new Date(),
        updatedAt: new Date(),
      })
    }

    // Send notifications
    if (refund.userId) {
      try {
        const { NotificationTriggers } = await import('@/lib/notifications/triggers')
        const { sendRefundProcessedEmail } = await import('@/lib/email/service')

        await NotificationTriggers.onOrderRefunded(
          refund.orderId,
          refund.userId,
          refund.amount || 0
        )

        // Get order data for email
        if (refund.orderId) {
          const orderDoc = await adminDb.collection('orders').doc(refund.orderId).get()
          if (orderDoc.exists) {
            const orderData = orderDoc.data()
            await sendRefundProcessedEmail(
              { id: refund.orderId, ...orderData },
              { id: refundId, ...refund, status: 'refunded', refundedAt: new Date() }
            )
          }
        }
      } catch (notifyError) {
        console.error('Failed to send refund completion notifications:', notifyError)
      }
    }

    console.log('Refund processed successfully:', refundId)
  } catch (error) {
    console.error('Error handling refund processed:', error)
  }
}

async function handleRefundPending(refundData: any) {
  try {
    console.log('Processing refund pending:', refundData)

    // Find our refund record by Paystack refund ID
    const refundsSnapshot = await adminDb
      .collection('refunds')
      .where('paystackRefundId', '==', refundData.id)
      .get()

    if (refundsSnapshot.empty) {
      console.error('No matching refund found for Paystack refund ID:', refundData.id)
      return
    }

    const refundDoc = refundsSnapshot.docs[0]

    // Update refund status
    await refundDoc.ref.update({
      paystackRefundStatus: refundData.status,
      updatedAt: new Date(),
    })

    console.log('Refund status updated to pending:', refundDoc.id)
  } catch (error) {
    console.error('Error handling refund pending:', error)
  }
}

async function handleRefundFailed(refundData: any) {
  try {
    console.log('Processing refund failed:', refundData)

    // Find our refund record by Paystack refund ID
    const refundsSnapshot = await adminDb
      .collection('refunds')
      .where('paystackRefundId', '==', refundData.id)
      .get()

    if (refundsSnapshot.empty) {
      console.error('No matching refund found for Paystack refund ID:', refundData.id)
      return
    }

    const refundDoc = refundsSnapshot.docs[0]
    const refund = refundDoc.data()

    // Update refund status
    await refundDoc.ref.update({
      status: 'failed',
      paystackRefundStatus: refundData.status,
      failureReason: 'Paystack refund failed',
      updatedAt: new Date(),
    })

    // Send failure notification to admin
    console.log('Refund failed, admin notification needed:', refundDoc.id)
  } catch (error) {
    console.error('Error handling refund failed:', error)
  }
}
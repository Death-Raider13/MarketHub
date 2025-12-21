import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { refundId: string } }
) {
  try {
    const { refundId } = params
    const { action, adminUserId, rejectionReason, resolutionNotes } = await request.json()

    if (!refundId || !action) {
      return NextResponse.json(
        { error: 'refundId and action are required' },
        { status: 400 }
      )
    }

    const refundRef = adminDb.collection('refunds').doc(refundId)
    const refundDoc = await refundRef.get()

    if (!refundDoc.exists) {
      return NextResponse.json(
        { error: 'Refund request not found' },
        { status: 404 }
      )
    }

    const refundData = refundDoc.data() as any

    const orderRef = adminDb.collection('orders').doc(refundData.orderId)
    const orderDoc = await orderRef.get()
    const orderData = orderDoc.exists ? (orderDoc.data() as any) : null

    const now = new Date()
    const updateData: any = {
      updatedAt: now,
      processedBy: adminUserId || null,
    }

    if (action === 'reject') {
      if (!rejectionReason) {
        return NextResponse.json(
          { error: 'rejectionReason is required for reject action' },
          { status: 400 }
        )
      }
      updateData.status = 'rejected'
      updateData.reason = rejectionReason
      if (resolutionNotes) updateData.resolutionNotes = resolutionNotes
    } else if (action === 'approve') {
      updateData.status = 'approved'
      if (resolutionNotes) updateData.resolutionNotes = resolutionNotes
    } else if (action === 'mark_refunded') {
      updateData.status = 'refunded'
      updateData.refundedAt = now
      if (resolutionNotes) updateData.resolutionNotes = resolutionNotes

      try {
        await orderRef.update({
          status: 'refunded',
          paymentStatus: 'refunded',
          updatedAt: now,
        })
      } catch (orderUpdateError) {
        console.error('Failed to update order to refunded:', orderUpdateError)
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }

    await refundRef.update(updateData)

    const latestRefund = {
      id: refundId,
      ...refundData,
      ...updateData,
    }

    if (orderData && orderData.userId) {
      try {
        const {
          sendRefundRejectedEmail,
          sendRefundProcessedEmail,
        } = await import('@/lib/email/service')
        const { NotificationTriggers } = await import('@/lib/notifications/triggers')

        if (latestRefund.status === 'rejected') {
          await sendRefundRejectedEmail(
            { id: refundData.orderId, ...orderData },
            latestRefund
          )
        } else if (latestRefund.status === 'refunded') {
          const amount = latestRefund.amount || orderData.total || 0
          await NotificationTriggers.onOrderRefunded(
            refundData.orderId,
            orderData.userId,
            amount
          )
          await sendRefundProcessedEmail(
            { id: refundData.orderId, ...orderData },
            latestRefund
          )
        }
      } catch (notifyError) {
        console.error('Failed to trigger refund notifications/emails:', notifyError)
      }
    }

    return NextResponse.json({
      success: true,
      refund: latestRefund,
    })
  } catch (error) {
    console.error('Error updating refund request:', error)
    return NextResponse.json(
      { error: 'Failed to update refund request' },
      { status: 500 }
    )
  }
}

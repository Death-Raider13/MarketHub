import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { refundId: string } }
) {
  try {
    const { refundId } = params
    const { action, adminUserId, rejectionReason, resolutionNotes, transactionId } = await request.json()

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
    } else if (action === 'process_refund') {
      // Process refund through payment provider
      try {
        if (!orderData) {
          throw new Error('Order data not found')
        }

        let refundResult
        const paymentMethod = orderData.paymentMethod

        if (paymentMethod === 'paystack') {
          const { PaystackRefundService } = await import('@/lib/payment/paystack-refunds')
          refundResult = await PaystackRefundService.processOrderRefund(
            refundData.orderId,
            refundId,
            adminUserId
          )
        } else if (paymentMethod === 'coinbase') {
          const { CoinbaseRefundService } = await import('@/lib/payment/coinbase-refunds')
          refundResult = await CoinbaseRefundService.processOrderRefund(
            refundData.orderId,
            refundId,
            adminUserId
          )
        } else {
          // Manual refund for other payment methods
          updateData.status = 'refunded'
          updateData.refundedAt = now
          updateData.manualRefund = true
          if (resolutionNotes) updateData.resolutionNotes = resolutionNotes

          await orderRef.update({
            status: 'refunded',
            paymentStatus: 'refunded',
            updatedAt: now,
          })
        }

        if (refundResult && !refundResult.success) {
          throw new Error('Payment provider refund failed')
        }

        // If we get here, the refund was processed successfully
        // The payment service already updated the refund status
        const updatedRefundDoc = await refundRef.get()
        const latestRefund = {
          id: refundId,
          ...updatedRefundDoc.data(),
        }

        return NextResponse.json({
          success: true,
          refund: latestRefund,
          paymentProviderResult: refundResult,
        })

      } catch (refundError) {
        console.error('Payment provider refund failed:', refundError)
        
        // Update refund status to failed
        await refundRef.update({
          status: 'failed',
          failureReason: refundError instanceof Error ? refundError.message : 'Unknown error',
          updatedAt: now,
          processedBy: adminUserId || null,
        })

        return NextResponse.json(
          { error: `Refund processing failed: ${refundError instanceof Error ? refundError.message : 'Unknown error'}` },
          { status: 500 }
        )
      }
    } else if (action === 'mark_refunded') {
      // Manual mark as refunded (for cases where refund was processed outside the system)
      updateData.status = 'refunded'
      updateData.refundedAt = now
      updateData.manualRefund = true
      if (transactionId) updateData.externalTransactionId = transactionId
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
    } else if (action === 'mark_coinbase_completed') {
      // Special action for marking Coinbase refunds as completed after manual processing
      if (refundData.paymentMethod === 'coinbase' || orderData?.paymentMethod === 'coinbase') {
        const { CoinbaseRefundService } = await import('@/lib/payment/coinbase-refunds')
        const result = await CoinbaseRefundService.markRefundCompleted(refundId, adminUserId, transactionId)
        
        return NextResponse.json({
          success: true,
          refund: result.refund,
        })
      } else {
        return NextResponse.json(
          { error: 'This action is only for Coinbase refunds' },
          { status: 400 }
        )
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

    // Send notifications and emails
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

export async function GET(
  request: NextRequest,
  { params }: { params: { refundId: string } }
) {
  try {
    const { refundId } = params

    const refundRef = adminDb.collection('refunds').doc(refundId)
    const refundDoc = await refundRef.get()

    if (!refundDoc.exists) {
      return NextResponse.json(
        { error: 'Refund request not found' },
        { status: 404 }
      )
    }

    const refundData = refundDoc.data()

    // Get associated order data
    let orderData = null
    if (refundData?.orderId) {
      const orderDoc = await adminDb.collection('orders').doc(refundData.orderId).get()
      if (orderDoc.exists) {
        orderData = { id: orderDoc.id, ...orderDoc.data() }
      }
    }

    return NextResponse.json({
      success: true,
      refund: {
        id: refundId,
        ...refundData,
        createdAt: refundData?.createdAt?.toDate?.() || refundData?.createdAt,
        updatedAt: refundData?.updatedAt?.toDate?.() || refundData?.updatedAt,
        refundedAt: refundData?.refundedAt?.toDate?.() || refundData?.refundedAt,
      },
      order: orderData ? {
        ...orderData,
        createdAt: orderData.createdAt?.toDate?.() || orderData.createdAt,
        updatedAt: orderData.updatedAt?.toDate?.() || orderData.updatedAt,
      } : null,
    })
  } catch (error) {
    console.error('Error fetching refund request:', error)
    return NextResponse.json(
      { error: 'Failed to fetch refund request' },
      { status: 500 }
    )
  }
}

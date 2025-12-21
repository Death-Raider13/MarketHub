import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { payoutId: string } }
) {
  try {
    const { payoutId } = params
    const { action, transactionReference, rejectionReason, notes, adminUserId } = await request.json()

    if (!payoutId || !action) {
      return NextResponse.json(
        { error: 'payoutId and action are required' },
        { status: 400 }
      )
    }

    const payoutRef = adminDb.collection('payoutRequests').doc(payoutId)
    const payoutDoc = await payoutRef.get()

    if (!payoutDoc.exists) {
      return NextResponse.json(
        { error: 'Payout request not found' },
        { status: 404 }
      )
    }

    const payoutData = payoutDoc.data() as any

    const updateData: any = {
      processedAt: new Date(),
      processedBy: adminUserId || null,
    }

    if (action === 'approve') {
      updateData.status = 'approved'
      if (notes) updateData.notes = notes
    } else if (action === 'reject') {
      if (!rejectionReason) {
        return NextResponse.json(
          { error: 'Rejection reason is required' },
          { status: 400 }
        )
      }
      updateData.status = 'rejected'
      updateData.rejectionReason = rejectionReason
      if (notes) updateData.notes = notes
    } else if (action === 'complete') {
      if (!transactionReference) {
        return NextResponse.json(
          { error: 'Transaction reference is required' },
          { status: 400 }
        )
      }
      updateData.status = 'completed'
      updateData.transactionReference = transactionReference
      if (notes) updateData.notes = notes

      // Update vendor balance (mirror client-side logic)
      const balanceRef = adminDb.collection('vendorBalances').doc(payoutData.vendorId)
      const balanceDoc = await balanceRef.get()

      if (balanceDoc.exists) {
        const currentBalance = balanceDoc.data() as any
        await balanceRef.update({
          availableBalance: (currentBalance.availableBalance || 0) - payoutData.amount,
          totalWithdrawn: (currentBalance.totalWithdrawn || 0) + payoutData.amount,
          lastPayoutDate: new Date(),
          updatedAt: new Date(),
        })
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }

    await payoutRef.update(updateData)

    const latestPayout = {
      id: payoutId,
      ...payoutData,
      ...updateData,
    }

    // Trigger notifications and emails (best-effort)
    try {
      const { NotificationTriggers } = await import('@/lib/notifications/triggers')
      const {
        sendPayoutCompletedEmail,
        sendPayoutRejectedEmail,
      } = await import('@/lib/email/service')

      if (latestPayout.status === 'completed') {
        await NotificationTriggers.onPayoutProcessed(
          latestPayout.vendorId,
          latestPayout.amount,
          payoutId
        )
        await sendPayoutCompletedEmail(latestPayout)
      } else if (latestPayout.status === 'rejected') {
        await sendPayoutRejectedEmail(latestPayout)
      }
    } catch (notifyError) {
      console.error('Failed to trigger payout notifications/emails:', notifyError)
      // Do not fail the main request if side-effects fail
    }

    return NextResponse.json({
      success: true,
      payout: latestPayout,
    })
  } catch (error) {
    console.error('Error processing payout:', error)
    return NextResponse.json(
      { error: 'Failed to process payout request' },
      { status: 500 }
    )
  }
}

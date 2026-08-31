import { NextRequest, NextResponse } from 'next/server'
import { getAdminFirestore } from '@/lib/firebase/admin-simple'
import { FieldValue } from "firebase-admin/firestore"

export async function PATCH(
  request: NextRequest,
  { params }: { params: { payoutId: string } }
) {
  try {
    const adminDb = getAdminFirestore()

    if (!adminDb) {
      console.error('Firebase Admin SDK not initialized')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

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

      // Update creator balance (mirror client-side logic)
      const balanceRef = adminDb.collection('creatorBalances').doc(payoutData.creatorId)
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

    // Ensure creator email and name are populated for notifications
    if (!latestPayout.creatorEmail || !latestPayout.creatorName) {
      const creatorUserDoc = await adminDb.collection('users').doc(latestPayout.creatorId).get()
      if (creatorUserDoc.exists) {
        const uData = creatorUserDoc.data() || {}
        latestPayout.creatorEmail = latestPayout.creatorEmail || uData.email || ''
        latestPayout.creatorName = latestPayout.creatorName || uData.displayName || uData.name || 'Creator'
      }
    }

    const currentStatus = updateData.status

    // 4. Update creator balances in Firestore based on action
    try {
      const balanceRef = adminDb.collection('creatorBalances').doc(latestPayout.creatorId)
      const balanceDoc = await balanceRef.get()

      if (currentStatus === 'rejected') {
        // Restore available balance and clear pending balance in creatorBalances
        if (balanceDoc.exists) {
          const cbData = balanceDoc.data() || {}
          await balanceRef.update({
            availableBalance: (cbData.availableBalance || 0) + latestPayout.amount,
            pendingBalance: Math.max(0, (cbData.pendingBalance || 0) - latestPayout.amount),
            updatedAt: new Date(),
          })
        }

        // Also update users collection for UI consistency
        await adminDb.collection('users').doc(latestPayout.creatorId).set({
          availableBalance: FieldValue.increment(latestPayout.amount),
          pendingBalance: FieldValue.increment(-latestPayout.amount),
          updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true }).catch(() => {})
      } else if (currentStatus === 'completed') {
        if (balanceDoc.exists) {
          const cbData = balanceDoc.data() || {}
          await balanceRef.update({
            pendingBalance: Math.max(0, (cbData.pendingBalance || 0) - latestPayout.amount),
            totalWithdrawn: (cbData.totalWithdrawn || 0) + latestPayout.amount,
            lastPayoutDate: new Date(),
            updatedAt: new Date(),
          })
        }

        await adminDb.collection('users').doc(latestPayout.creatorId).set({
          pendingBalance: FieldValue.increment(-latestPayout.amount),
          updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true }).catch(() => {})
      }
    } catch (balError) {
      console.error('Error updating creator balances on payout status change:', balError)
    }

    // Trigger notifications and emails
    try {
      const { NotificationTriggers } = await import('@/lib/notifications/triggers')
      const {
        sendPayoutCompletedEmail,
        sendPayoutRejectedEmail,
      } = await import('@/lib/email/service')

      if (currentStatus === 'completed') {
        await NotificationTriggers.onPayoutProcessed(
          latestPayout.creatorId,
          latestPayout.amount,
          payoutId
        )
        await sendPayoutCompletedEmail(latestPayout)
      } else if (currentStatus === 'rejected') {
        await sendPayoutRejectedEmail(latestPayout)
      }
    } catch (notifyError) {
      console.error('Failed to trigger payout notifications/emails:', notifyError)
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

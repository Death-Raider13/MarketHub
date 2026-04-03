import { NextRequest, NextResponse } from 'next/server'
import { getAdminFirestore } from '@/lib/firebase/admin-simple'

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
    const { creatorId } = await request.json()

    if (!payoutId || !creatorId) {
      return NextResponse.json(
        { error: 'payoutId and creatorId are required' },
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

    // Verify ownership
    if (payoutData.creatorId !== creatorId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Only allow cancellation of pending requests
    if (payoutData.status !== 'pending') {
      return NextResponse.json(
        { error: 'Only pending payout requests can be cancelled' },
        { status: 400 }
      )
    }

    // Update payout status to cancelled
    await payoutRef.update({
      status: 'cancelled',
      cancelledAt: new Date(),
      updatedAt: new Date()
    })

    // Restore creator balance (move from pending back to available)
    const balanceRef = adminDb.collection('creatorBalances').doc(creatorId)
    const balanceDoc = await balanceRef.get()

    if (balanceDoc.exists) {
      const currentBalance = balanceDoc.data() as any
      await balanceRef.update({
        availableBalance: (currentBalance.availableBalance || 0) + payoutData.amount,
        pendingBalance: Math.max(0, (currentBalance.pendingBalance || 0) - payoutData.amount),
        updatedAt: new Date()
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Payout request cancelled successfully'
    })

  } catch (error) {
    console.error('Error cancelling payout request:', error)
    return NextResponse.json(
      { error: 'Failed to cancel payout request' },
      { status: 500 }
    )
  }
}
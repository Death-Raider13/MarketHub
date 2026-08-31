import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { FieldValue } from 'firebase-admin/firestore'
import { getAdminFirestore } from '@/lib/firebase/admin-simple'
import { verifyAuthToken } from '@/lib/api-auth'
import { sendPayoutCompletedEmail, sendPayoutRejectedEmail } from '@/lib/email/service'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { payoutId: string } }
) {
  const auth = await verifyAuthToken(request)
  if ('error' in auth) return auth.error

  const db = getAdminFirestore()
  if (!db) return NextResponse.json({ error: 'Database not available' }, { status: 500 })

  try {
    const adminDoc = await db.collection('users').doc(auth.user.uid).get()
    const adminRole = adminDoc.data()?.role
    if (!['admin', 'super_admin'].includes(adminRole)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const { action, transactionReference, rejectionReason, notes } = body

    if (!['complete', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Must be complete or reject.' }, { status: 400 })
    }

    const payoutRef = db.collection('affiliatePayoutRequests').doc(params.payoutId)
    const payoutDoc = await payoutRef.get()
    if (!payoutDoc.exists) {
      return NextResponse.json({ error: 'Affiliate payout request not found' }, { status: 404 })
    }

    const payout = payoutDoc.data() || {}
    if (payout.status !== 'pending' && payout.status !== 'approved' && payout.status !== 'processing') {
      return NextResponse.json({ error: `Cannot modify payout with status: ${payout.status}` }, { status: 400 })
    }

    const fee = payout.fee ?? 100
    const netAmount = payout.netAmount ?? Math.max(0, Number(payout.amount) - fee)

    if (action === 'complete') {
      const ref = transactionReference?.trim() || `MANUAL-AFF-${Date.now()}`
      await payoutRef.update({
        status: 'completed',
        transactionReference: ref,
        manualSettlement: true,
        processedBy: auth.user.uid,
        fee,
        netAmount,
        notes: notes || null,
        completedAt: new Date(),
        updatedAt: new Date()
      })

      // Update promoter balance in users doc
      await db.collection('users').doc(payout.affiliateId).set({
        affiliatePendingBalance: FieldValue.increment(-Number(payout.amount)),
        affiliateTotalWithdrawn: FieldValue.increment(Number(payout.amount)),
        updatedAt: new Date()
      }, { merge: true })

      if (payout.affiliateEmail) {
        await sendPayoutCompletedEmail({
          creatorEmail: payout.affiliateEmail,
          creatorName: payout.affiliateName || 'Promoter',
          amount: Number(payout.amount),
          fee,
          netAmount,
          transactionReference: ref,
          processedAt: new Date()
        }).catch(err => console.error('Failed sending affiliate completed email:', err))
      }

      return NextResponse.json({ success: true, status: 'completed', transactionReference: ref })
    }

    if (action === 'reject') {
      const reason = rejectionReason?.trim() || 'Rejected by admin'
      await payoutRef.update({
        status: 'rejected',
        rejectionReason: reason,
        rejectedBy: auth.user.uid,
        notes: notes || null,
        rejectedAt: new Date(),
        updatedAt: new Date()
      })

      // Restore promoter available balance in users doc
      await db.collection('users').doc(payout.affiliateId).set({
        affiliateAvailableBalance: FieldValue.increment(Number(payout.amount)),
        affiliatePendingBalance: FieldValue.increment(-Number(payout.amount)),
        updatedAt: new Date()
      }, { merge: true })

      if (payout.affiliateEmail) {
        await sendPayoutRejectedEmail({
          creatorEmail: payout.affiliateEmail,
          creatorName: payout.affiliateName || 'Promoter',
          amount: Number(payout.amount),
          rejectionReason: reason,
          rejectedAt: new Date()
        }).catch(err => console.error('Failed sending affiliate rejected email:', err))
      }

      return NextResponse.json({ success: true, status: 'rejected', rejectionReason: reason })
    }
  } catch (error) {
    console.error('Error handling affiliate payout action:', error)
    return NextResponse.json({ error: 'Failed to process affiliate payout action' }, { status: 500 })
  }
}

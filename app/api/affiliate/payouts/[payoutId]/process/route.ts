import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { FieldValue } from 'firebase-admin/firestore'
import { getAdminFirestore } from '@/lib/firebase/admin-simple'
import { verifyAuthToken } from '@/lib/api-auth'
import { paystackTransferService, PaystackTransferService } from '@/lib/payment/paystack-transfers'


export async function POST(
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

    const payoutRef = db.collection('affiliatePayoutRequests').doc(params.payoutId)
    const payoutDoc = await payoutRef.get()
    if (!payoutDoc.exists) return NextResponse.json({ error: 'Affiliate payout request not found' }, { status: 404 })

    const payout = payoutDoc.data() || {}
    if (payout.status !== 'pending' && payout.status !== 'approved') {
      return NextResponse.json({ error: `Only pending or approved payouts can be processed. Current status: ${payout.status}` }, { status: 400 })
    }
    if (!payout.affiliateId || !payout.amount || !payout.bankDetails?.bankCode) {
      return NextResponse.json({ error: 'Affiliate payout is missing bank details or bank code' }, { status: 400 })
    }
    if (!paystackTransferService.isConfigured()) {
      return NextResponse.json({ error: 'Paystack transfer service is not configured' }, { status: 500 })
    }

    await payoutRef.update({ status: 'processing', processedAt: new Date(), processedBy: auth.user.uid, updatedAt: new Date() })

    try {
      const { accountName, accountNumber, bankCode } = payout.bankDetails
      await paystackTransferService.resolveAccountNumber(accountNumber, bankCode)
      const recipient = await paystackTransferService.createTransferRecipient({
        type: 'nuban',
        name: accountName,
        account_number: accountNumber,
        bank_code: bankCode,
        currency: 'NGN',
        description: `Affiliate payout ${params.payoutId}`,
        metadata: { payoutId: params.payoutId, affiliateId: payout.affiliateId },
      })
      const transfer = await paystackTransferService.initiateTransfer({
        source: 'balance',
        amount: PaystackTransferService.nairaToKobo(Number(payout.amount)),
        recipient: recipient.recipient_code,
        reason: `Affiliate commission payout ${params.payoutId}`,
        currency: 'NGN',
        reference: `affiliate_${params.payoutId}_${Date.now()}`,
        metadata: { payoutId: params.payoutId, affiliateId: payout.affiliateId },
      })

      await payoutRef.update({
        status: 'completed',
        paystackTransferCode: transfer.transfer_code,
        paystackReference: transfer.reference,
        recipientCode: recipient.recipient_code,
        completedAt: new Date(),
        updatedAt: new Date(),
      })

      await db.collection('users').doc(payout.affiliateId).set({
        affiliatePendingBalance: FieldValue.increment(-Number(payout.amount)),
        affiliateTotalWithdrawn: FieldValue.increment(Number(payout.amount)),
        updatedAt: new Date(),
      }, { merge: true })

      return NextResponse.json({ success: true, status: 'completed', transferReference: transfer.reference })
    } catch (transferError: any) {
      await payoutRef.update({ status: 'rejected', rejectionReason: transferError?.message || 'Transfer failed', rejectedAt: new Date(), updatedAt: new Date() })
      await db.collection('users').doc(payout.affiliateId).set({
        affiliateAvailableBalance: FieldValue.increment(Number(payout.amount)),
        affiliatePendingBalance: FieldValue.increment(-Number(payout.amount)),
        updatedAt: new Date(),
      }, { merge: true })
      return NextResponse.json({ error: transferError?.message || 'Affiliate transfer failed' }, { status: 502 })
    }
  } catch (error) {
    console.error('Affiliate payout processing error:', error)
    return NextResponse.json({ error: 'Unable to process affiliate payout' }, { status: 500 })
  }
}

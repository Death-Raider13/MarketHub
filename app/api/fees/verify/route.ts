import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import axios from 'axios'
import { FieldValue } from 'firebase-admin/firestore'
import { verifyAuthToken } from '@/lib/api-auth'
import { getAdminFirestore } from '@/lib/firebase/admin-simple'
import { feeAmount, type FeeType } from '@/lib/business-fees'
import { recordRoleReferralReward } from '@/lib/role-referrals'

const FEE_TYPES: FeeType[] = [
  'affiliate_registration',
  'creator_additional_upload',
  'creator_waitlist_additional_upload',
  'creator_verification_featuring',
]

export async function POST(request: NextRequest) {
  const auth = await verifyAuthToken(request)
  if ('error' in auth) return auth.error

  try {
    const { paymentId, reference } = await request.json()
    if (typeof paymentId !== 'string' || typeof reference !== 'string') {
      return NextResponse.json({ error: 'paymentId and reference are required' }, { status: 400 })
    }

    const db = getAdminFirestore()
    if (!db) return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })
    const paymentRef = db.collection('roleFeePayments').doc(paymentId)
    const paymentDoc = await paymentRef.get()
    if (!paymentDoc.exists) return NextResponse.json({ error: 'Fee payment not found' }, { status: 404 })
    const payment = paymentDoc.data() || {}
    if (payment.userId !== auth.user.uid) return NextResponse.json({ error: 'Unauthorized payment access' }, { status: 403 })
    if (!FEE_TYPES.includes(payment.feeType as FeeType)) return NextResponse.json({ error: 'Invalid fee payment type' }, { status: 400 })
    if (payment.status === 'paid') return NextResponse.json({ success: true, status: 'paid', alreadyProcessed: true })

    const secret = process.env.PAYSTACK_SECRET_KEY
    if (!secret) return NextResponse.json({ error: 'Payment service is not configured' }, { status: 500 })
    const response = await axios.get(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${secret}` },
      timeout: 15000,
    })
    const transaction = response.data?.data
    const paidNaira = Number(transaction?.amount) / 100
    const expectedPaid = Number(payment.amount)
    if (transaction?.status !== 'success' || !Number.isFinite(paidNaira) || Math.round(paidNaira * 100) !== Math.round(expectedPaid * 100) || transaction?.currency !== 'NGN') {
      return NextResponse.json({ error: 'Payment could not be verified for the expected amount' }, { status: 400 })
    }

    const userRef = db.collection('users').doc(auth.user.uid)
    await db.runTransaction(async (transactionWriter: any) => {
      const latest = await transactionWriter.get(paymentRef)
      if (latest.data()?.status === 'paid') return
      const now = FieldValue.serverTimestamp()
      transactionWriter.update(paymentRef, { status: 'paid', providerReference: reference, paidAt: now, updatedAt: now })
      const userUpdate: Record<string, unknown> = { updatedAt: now }
      if (payment.feeType === 'affiliate_registration') userUpdate.affiliateStatus = 'course_pending'
      if (payment.feeType === 'creator_additional_upload' || payment.feeType === 'creator_waitlist_additional_upload') {
        userUpdate.creatorUploadAccess = { status: 'active', paymentId, feeType: payment.feeType, grantedAt: now }
      }
      if (payment.feeType === 'creator_verification_featuring') {
        userUpdate.verificationPaymentStatus = 'paid'
        userUpdate.verificationFeaturingEligible = true
      }
      transactionWriter.set(userRef, userUpdate, { merge: true })
    })

    const reward = await recordRoleReferralReward({
      feePaymentId: paymentId,
      feeType: payment.feeType as FeeType,
      referredUserId: auth.user.uid,
      referralCode: payment.referralCode,
    })
    return NextResponse.json({ success: true, status: 'paid', reward })
  } catch (error: any) {
    console.error('Role fee verification error:', error)
    return NextResponse.json({ error: error?.response?.data?.message || 'Unable to verify fee payment' }, { status: 500 })
  }
}

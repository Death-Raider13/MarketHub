import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { verifyAuthToken } from '@/lib/api-auth'
import { getAdminFirestore } from '@/lib/firebase/admin-simple'
import { feeAmount, type FeeType } from '@/lib/business-fees'
import { recordRoleReferralReward, normalizeReferralCode } from '@/lib/role-referrals'

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
    const body = await request.json()
    const feePaymentId = typeof body.feePaymentId === 'string' ? body.feePaymentId.trim() : ''
    const feeType = body.feeType as FeeType
    if (!feePaymentId || !FEE_TYPES.includes(feeType)) {
      return NextResponse.json({ error: 'A valid feePaymentId and feeType are required' }, { status: 400 })
    }

    const db = getAdminFirestore()
    if (!db) return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })

    const paymentDoc = await db.collection('roleFeePayments').doc(feePaymentId).get()
    if (!paymentDoc.exists) return NextResponse.json({ error: 'Fee payment not found' }, { status: 404 })
    const payment = paymentDoc.data() || {}
    if (payment.userId !== auth.user.uid || payment.status !== 'paid' || payment.feeType !== feeType) {
      return NextResponse.json({ error: 'Fee payment is not eligible for referral reward' }, { status: 403 })
    }
    if (Number(payment.originalAmount ?? payment.amount) !== feeAmount(feeType)) {
      return NextResponse.json({ error: 'Fee amount does not match policy' }, { status: 400 })
    }

    const userDoc = await db.collection('users').doc(auth.user.uid).get()
    const userData = userDoc.data() || {}
    const referralCode = normalizeReferralCode(userData.referredByCode)
    if (!referralCode) return NextResponse.json({ created: false, reason: 'No eligible referrer' })

    const result = await recordRoleReferralReward({
      feePaymentId,
      feeType,
      referredUserId: auth.user.uid,
      referralCode,
    })
    return NextResponse.json(result)
  } catch (error) {
    console.error('Role referral reward error:', error)
    return NextResponse.json({ error: 'Failed to record referral reward' }, { status: 500 })
  }
}

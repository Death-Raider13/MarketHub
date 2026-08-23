import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { verifyAuthToken } from '@/lib/api-auth'
import { getAdminFirestore } from '@/lib/firebase/admin-simple'
import { BUSINESS_FEES, feeAmount, creatorUploadFee, type FeeType } from '@/lib/business-fees'

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
    const requestedType = body.feeType as FeeType
    const db = getAdminFirestore()
    if (!db) return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })

    const userRef = db.collection('users').doc(auth.user.uid)
    const userDoc = await userRef.get()
    const user = userDoc.data() || {}
    const waitlistEligible = user.waitlistEligible === true || user.waitlistMember === true
    let feeType: FeeType = requestedType

    if (requestedType === 'affiliate_registration' && user.role !== 'promoter') {
      return NextResponse.json({ error: 'Only affiliate accounts can pay the affiliate registration fee' }, { status: 403 })
    }
    if ((requestedType === 'creator_additional_upload' || requestedType === 'creator_waitlist_additional_upload' || requestedType === 'creator_verification_featuring') && user.role !== 'creator') {
      return NextResponse.json({ error: 'Only creator accounts can pay creator fees' }, { status: 403 })
    }
    if (requestedType === 'creator_additional_upload' && waitlistEligible) feeType = creatorUploadFee(true)
    if (requestedType === 'creator_waitlist_additional_upload' && !waitlistEligible) feeType = creatorUploadFee(false)

    if (!FEE_TYPES.includes(feeType)) return NextResponse.json({ error: 'Invalid fee type' }, { status: 400 })
    const amount = feeType === 'affiliate_registration' && waitlistEligible
      ? Math.round(BUSINESS_FEES.affiliateRegistration * (1 - BUSINESS_FEES.waitlistDiscountPercent / 100))
      : feeAmount(feeType)
    const paymentRef = db.collection('roleFeePayments').doc()
    await paymentRef.set({
      userId: auth.user.uid,
      userRole: user.role,
      feeType,
      amount,
      originalAmount: feeAmount(feeType),
      waitlistEligible,
      referralCode: user.referredByCode || null,
      status: 'pending',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })

    return NextResponse.json({
      success: true,
      paymentId: paymentRef.id,
      reference: paymentRef.id,
      feeType,
      amount,
      currency: 'NGN',
      waitlistEligible,
    }, { status: 201 })
  } catch (error) {
    console.error('Role fee creation error:', error)
    return NextResponse.json({ error: 'Unable to create fee payment' }, { status: 500 })
  }
}

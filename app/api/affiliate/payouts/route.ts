import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { FieldValue } from 'firebase-admin/firestore'
import { getAdminFirestore } from '@/lib/firebase/admin-simple'
import { verifyAuthToken } from '@/lib/api-auth'
import { getAffiliateByUid } from '@/lib/affiliate'

const MINIMUM_PAYOUT = 1000

function serialize(doc: any) {
  const data = doc.data() || {}
  return {
    id: doc.id,
    ...data,
    createdAt: data.createdAt?.toDate?.()?.toISOString?.() || data.createdAt || null,
    updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || data.updatedAt || null,
  }
}

export async function GET(request: NextRequest) {
  const auth = await verifyAuthToken(request)
  if ('error' in auth) return auth.error

  const db = getAdminFirestore()
  if (!db) return NextResponse.json({ error: 'Database not available' }, { status: 500 })

  const userDoc = await db.collection('users').doc(auth.user.uid).get()
  const isAdmin = ['admin', 'super_admin'].includes(userDoc.data()?.role)
  const snapshot = isAdmin
    ? await db.collection('affiliatePayoutRequests').limit(200).get()
    : await db.collection('affiliatePayoutRequests').where('affiliateId', '==', auth.user.uid).limit(50).get()

  return NextResponse.json({
    success: true,
    payouts: snapshot.docs.map(serialize).sort((a: any, b: any) => String(b.createdAt).localeCompare(String(a.createdAt))),
  })
}

export async function POST(request: NextRequest) {
  const auth = await verifyAuthToken(request)
  if ('error' in auth) return auth.error

  try {
    const affiliate = await getAffiliateByUid(auth.user.uid)
    if (!affiliate) return NextResponse.json({ error: 'Affiliate promoter account not found' }, { status: 403 })

    const body = await request.json()
    const amount = Number(body.amount)
    if (!Number.isFinite(amount) || amount < MINIMUM_PAYOUT) {
      return NextResponse.json({ error: `Minimum payout is ₦${MINIMUM_PAYOUT.toLocaleString()}` }, { status: 400 })
    }

    const payoutMethod = body.payoutMethod === 'bank_transfer' ? 'bank_transfer' : null
    const bankDetails = body.bankDetails && typeof body.bankDetails === 'object' ? {
      accountName: String(body.bankDetails.accountName || '').trim(),
      accountNumber: String(body.bankDetails.accountNumber || '').trim(),
      bankName: String(body.bankDetails.bankName || '').trim(),
      bankCode: body.bankDetails.bankCode ? String(body.bankDetails.bankCode).trim() : '',
    } : null

    if (!payoutMethod || !bankDetails?.accountName || !bankDetails.accountNumber || !bankDetails.bankName || !bankDetails.bankCode) {
      return NextResponse.json({ error: 'Bank transfer details are required for payout requests' }, { status: 400 })
    }

    const db = getAdminFirestore()
    if (!db) return NextResponse.json({ error: 'Database not available' }, { status: 500 })

    const userRef = db.collection('users').doc(auth.user.uid)
    const payoutRef = db.collection('affiliatePayoutRequests').doc()
    let payout: any

    await db.runTransaction(async (transaction: any) => {
      const userDoc = await transaction.get(userRef)
      if (!userDoc.exists) throw new Error('Affiliate profile not found')
      const user = userDoc.data() || {}
      const affiliateAvailable = Number(user.affiliateAvailableBalance ?? user.earnings ?? 0)
      const referralAvailable = Number(user.referralRewardAvailableBalance ?? 0)
      const available = affiliateAvailable + referralAvailable
      if (amount > available) throw new Error('Requested amount exceeds your available affiliate and referral balance')
      const referralPortion = Math.min(amount, referralAvailable)
      const affiliatePortion = amount - referralPortion

      const now = FieldValue.serverTimestamp()
      const fee = 100
      const netAmount = amount - fee

      payout = {
        affiliateId: auth.user.uid,
        affiliateEmail: auth.user.email || affiliate.email || null,
        affiliateName: affiliate.displayName || null,
        amount: Math.round(amount * 100) / 100,
        fee,
        netAmount: Math.round(netAmount * 100) / 100,
        payoutMethod,
        bankDetails,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
      }
      transaction.create(payoutRef, payout)
      const balanceUpdate: Record<string, unknown> = {
        affiliatePendingBalance: FieldValue.increment(amount),
        updatedAt: now,
      }
      if (affiliatePortion > 0) balanceUpdate.affiliateAvailableBalance = FieldValue.increment(-affiliatePortion)
      if (referralPortion > 0) balanceUpdate.referralRewardAvailableBalance = FieldValue.increment(-referralPortion)
      transaction.set(userRef, balanceUpdate, { merge: true })
    })

    return NextResponse.json({ success: true, payout: { id: payoutRef.id, ...payout } }, { status: 201 })
  } catch (error: any) {
    const message = error?.message || 'Unable to create payout request'
    const status = message.includes('exceeds') ? 400 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

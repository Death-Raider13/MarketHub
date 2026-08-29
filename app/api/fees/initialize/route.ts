import { NextRequest, NextResponse } from 'next/server'
import { getAdminFirestore } from '@/lib/firebase/admin-simple'
import { verifyAuthToken } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const auth = await verifyAuthToken(request)
  if ('error' in auth) return auth.error

  try {
    const { paymentId } = await request.json()
    if (typeof paymentId !== 'string' || !paymentId) {
      return NextResponse.json({ error: 'paymentId is required' }, { status: 400 })
    }
    const db = getAdminFirestore()
    if (!db) return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })
    const paymentRef = db.collection('roleFeePayments').doc(paymentId)
    const paymentDoc = await paymentRef.get()
    if (!paymentDoc.exists) return NextResponse.json({ error: 'Fee payment not found' }, { status: 404 })
    const payment = paymentDoc.data() || {}
    if (payment.userId !== auth.user.uid) return NextResponse.json({ error: 'Unauthorized payment access' }, { status: 403 })
    if (payment.status !== 'pending') return NextResponse.json({ error: 'This payment is no longer pending' }, { status: 400 })
    const secret = process.env.PAYSTACK_SECRET_KEY
    if (!secret) return NextResponse.json({ error: 'Payment service is not configured' }, { status: 500 })
    const callbackPath = payment.feeType === 'affiliate_registration' ? '/dashboard/promoter' : '/creator/verification'
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: auth.user.email,
        amount: Math.round(Number(payment.amount) * 100),
        currency: 'NGN',
        reference: paymentId,
        callback_url: `${origin}${callbackPath}?paymentId=${encodeURIComponent(paymentId)}`,
        metadata: { paymentId, feeType: payment.feeType, userId: auth.user.uid },
      }),
    })
    const payload = await response.json()
    if (!response.ok || !payload?.status || !payload?.data?.authorization_url) {
      return NextResponse.json({ error: payload?.message || 'Unable to initialize payment' }, { status: 502 })
    }
    await paymentRef.update({ provider: 'paystack', initializedAt: new Date(), paystackAccessCode: payload.data.access_code })
    return NextResponse.json({ authorizationUrl: payload.data.authorization_url, reference: payload.data.reference })
  } catch (error) {
    console.error('Fee payment initialization error:', error)
    return NextResponse.json({ error: 'Unable to initialize payment' }, { status: 500 })
  }
}

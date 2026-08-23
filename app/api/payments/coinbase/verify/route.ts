import { NextRequest, NextResponse } from 'next/server'
import { getCoinbaseCharge, getChargeStatus } from '@/lib/payment/coinbase'
import { getAdminFirestore } from '@/lib/firebase/admin-simple'
import { recordAffiliateConversion } from '@/lib/affiliate'

export async function POST(request: NextRequest) {
  try {
    const { chargeId, orderId } = await request.json()

    if (!chargeId && !orderId) {
      return NextResponse.json(
        { error: 'Either chargeId or orderId is required' },
        { status: 400 }
      )
    }

    const adminDb = getAdminFirestore()
    if (!adminDb) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    let actualChargeId = chargeId

    // If only orderId provided, get chargeId from order
    if (!actualChargeId && orderId) {
      const orderDoc = await adminDb.collection('orders').doc(orderId).get()
      if (!orderDoc.exists) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 })
      }
      actualChargeId = orderDoc.data()?.coinbaseChargeId
      if (!actualChargeId) {
        return NextResponse.json(
          { error: 'No Coinbase charge found for this order' },
          { status: 404 }
        )
      }
    }

    // Get charge details from Coinbase
    const charge = await getCoinbaseCharge(actualChargeId)
    const { status, confirmedAt } = getChargeStatus(charge)

    // If payment is completed, update order (in case webhook was missed)
    if (status === 'completed' && orderId) {
      const orderRef = adminDb.collection('orders').doc(orderId)
      const orderDoc = await orderRef.get()
      
      if (orderDoc.exists) {
        const orderData = orderDoc.data() || {}
        if (orderData.paymentStatus !== 'completed') {
          await orderRef.update({
            status: 'paid',
            paymentStatus: 'completed',
            paymentMethod: 'coinbase',
            paymentReference: charge.code,
            paidAt: confirmedAt ? new Date(confirmedAt) : new Date(),
            updatedAt: new Date()
          })
          console.log('✅ Order updated via verification:', orderId)
        }

        try {
          await recordAffiliateConversion(orderId, orderData)
        } catch (affiliateError) {
          console.error('Failed to record affiliate conversion:', affiliateError)
        }
      }
    }

    return NextResponse.json({
      success: true,
      status,
      charge: {
        id: charge.id,
        code: charge.code,
        hosted_url: charge.hosted_url,
        expires_at: charge.expires_at,
        confirmedAt
      }
    })
  } catch (error: any) {
    console.error('Coinbase verification error:', error)
    return NextResponse.json(
      { error: error.message || 'Verification failed' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const chargeId = searchParams.get('chargeId')
  const orderId = searchParams.get('orderId')

  if (!chargeId && !orderId) {
    return NextResponse.json(
      { error: 'Either chargeId or orderId query param is required' },
      { status: 400 }
    )
  }

  // Reuse POST logic
  const fakeRequest = {
    json: async () => ({ chargeId, orderId })
  } as NextRequest

  return POST(fakeRequest)
}

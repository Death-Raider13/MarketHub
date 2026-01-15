import { NextRequest, NextResponse } from 'next/server'
import { createCoinbaseCharge } from '@/lib/payment/coinbase'
import { getAdminFirestore } from '@/lib/firebase/admin-simple'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, amount, customerEmail, customerName, metadata } = body

    // Validate required fields
    if (!orderId || !amount || !customerEmail) {
      return NextResponse.json(
        { error: 'Missing required fields: orderId, amount, customerEmail' },
        { status: 400 }
      )
    }

    // Verify order exists
    const adminDb = getAdminFirestore()
    if (!adminDb) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const orderRef = adminDb.collection('orders').doc(orderId)
    const orderDoc = await orderRef.get()

    if (!orderDoc.exists) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    const orderData = orderDoc.data()
    
    // Check if order is already paid
    if (orderData?.paymentStatus === 'completed') {
      return NextResponse.json(
        { error: 'Order is already paid' },
        { status: 400 }
      )
    }

    // Create Coinbase Commerce charge
    const charge = await createCoinbaseCharge({
      orderId,
      amount,
      customerEmail,
      customerName: customerName || 'Customer',
      description: `Payment for order #${orderId.substring(0, 8).toUpperCase()}`,
      metadata: {
        ...metadata,
        items_count: orderData?.items?.length || 0
      }
    })

    // Update order with Coinbase charge info
    await orderRef.update({
      coinbaseChargeId: charge.id,
      coinbaseChargeCode: charge.code,
      paymentMethod: 'coinbase',
      updatedAt: new Date()
    })

    console.log('✅ Coinbase charge created:', charge.id)

    return NextResponse.json({
      success: true,
      charge: {
        id: charge.id,
        code: charge.code,
        hosted_url: charge.hosted_url,
        expires_at: charge.expires_at,
        pricing: charge.pricing
      }
    })
  } catch (error: any) {
    console.error('Failed to create Coinbase charge:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create payment' },
      { status: 500 }
    )
  }
}

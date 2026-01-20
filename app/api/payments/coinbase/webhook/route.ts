import { NextRequest, NextResponse } from 'next/server'
import { verifyCoinbaseWebhook, CoinbaseWebhookEvent } from '@/lib/payment/coinbase'
import { getAdminFirestore } from '@/lib/firebase/admin-simple'

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const signature = request.headers.get('x-cc-webhook-signature') || ''
    const webhookSecret = process.env.COINBASE_COMMERCE_WEBHOOK_SECRET || ''

    // Verify webhook signature (skip if no secret configured for testing)
    if (webhookSecret && !verifyCoinbaseWebhook(rawBody, signature, webhookSecret)) {
      console.error('Invalid Coinbase webhook signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event: CoinbaseWebhookEvent = JSON.parse(rawBody)
    console.log('📥 Coinbase webhook received:', event.type)

    const adminDb = getAdminFirestore()
    if (!adminDb) {
      console.error('Firebase Admin not configured')
      return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }

    const chargeData = event.data
    const orderId = chargeData.metadata?.order_id

    if (!orderId) {
      console.error('No order_id in webhook metadata')
      return NextResponse.json({ error: 'Missing order_id' }, { status: 400 })
    }

    const orderRef = adminDb.collection('orders').doc(orderId)
    const orderDoc = await orderRef.get()

    if (!orderDoc.exists) {
      console.error('Order not found:', orderId)
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Handle different event types
    switch (event.type) {
      case 'charge:confirmed':
      case 'charge:completed':
        await handlePaymentCompleted(adminDb, orderRef, orderDoc.data(), chargeData, orderId)
        break
      case 'charge:failed':
        await orderRef.update({ paymentStatus: 'failed', updatedAt: new Date() })
        break
      case 'charge:delayed':
        await orderRef.update({ paymentStatus: 'delayed', updatedAt: new Date() })
        break
      case 'charge:pending':
        await orderRef.update({ paymentStatus: 'pending', updatedAt: new Date() })
        break
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Coinbase webhook error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}


async function handlePaymentCompleted(
  adminDb: FirebaseFirestore.Firestore,
  orderRef: FirebaseFirestore.DocumentReference,
  orderData: any,
  chargeData: any,
  orderId: string
) {
  // Get payment details from charge
  const payment = chargeData.payments?.[0]
  const cryptoAmount = payment?.value?.crypto?.amount || '0'
  const cryptoCurrency = payment?.value?.crypto?.currency || 'UNKNOWN'

  // Update order status
  await orderRef.update({
    status: 'paid',
    paymentStatus: 'completed',
    paymentMethod: 'coinbase',
    paymentReference: chargeData.code,
    paidAt: new Date(),
    paymentData: {
      chargeId: chargeData.id,
      chargeCode: chargeData.code,
      cryptoAmount,
      cryptoCurrency,
      confirmedAt: chargeData.confirmed_at || new Date().toISOString(),
      timeline: chargeData.timeline
    },
    updatedAt: new Date()
  })

  console.log('✅ Crypto payment confirmed for order:', orderId)

  // Reduce inventory for physical products
  try {
    const physicalItems = orderData?.items?.filter((item: any) => 
      item.product?.productType === 'physical' || item.product?.type === 'physical'
    ).map((item: any) => ({
      productId: item.productId,
      quantity: item.quantity,
      productName: item.productName,
      vendorId: item.vendorId
    })) || []

    if (physicalItems.length > 0) {
      const { reduceInventory } = await import('@/lib/inventory/management')
      await reduceInventory(physicalItems)
    }
  } catch (err) {
    console.error('⚠️ Inventory update failed:', err)
  }

  // Create purchase records for digital products
  try {
    const digitalItems = orderData?.items?.filter((item: any) => 
      item.product?.productType === 'digital' || item.product?.type === 'digital'
    ) || []

    for (const item of digitalItems) {
      await adminDb.collection('purchasedProducts').add({
        userId: orderData.userId,
        productId: item.productId,
        orderId: orderId,
        product: item.product,
        purchasedAt: new Date(),
        downloadCount: 0,
        accessExpiresAt: item.product.accessDuration > 0 
          ? new Date(Date.now() + (item.product.accessDuration * 24 * 60 * 60 * 1000))
          : null
      })
    }
  } catch (err) {
    console.error('⚠️ Purchase records creation failed:', err)
  }

  // Update vendor balances
  try {
    const vendorUpdates = new Map<string, number>()

    orderData?.items?.forEach((item: any) => {
      const vendorId = item.product?.vendorId || item.vendorId
      if (!vendorId) return

      const price = item.product?.price ?? item.productPrice ?? 0
      const quantity = item.quantity || 1
      const itemTotal = price * quantity
      const vendorEarning = itemTotal * 0.90 // 10% platform commission

      vendorUpdates.set(vendorId, (vendorUpdates.get(vendorId) || 0) + vendorEarning)
    })

    for (const [vendorId, earning] of vendorUpdates.entries()) {
      const balanceRef = adminDb.collection('vendorBalances').doc(vendorId)
      const balanceDoc = await balanceRef.get()

      if (balanceDoc.exists) {
        const current = balanceDoc.data()
        await balanceRef.update({
          availableBalance: (current?.availableBalance || 0) + earning,
          totalEarnings: (current?.totalEarnings || 0) + earning,
          updatedAt: new Date()
        })
      } else {
        await balanceRef.set({
          vendorId,
          availableBalance: earning,
          pendingBalance: 0,
          totalEarnings: earning,
          totalWithdrawn: 0,
          updatedAt: new Date()
        })
      }
    }
  } catch (err) {
    console.error('⚠️ Vendor balance update failed:', err)
  }

  // Generate download links for digital products and send confirmation email
  try {
    const { sendOrderConfirmationEmail } = await import('@/lib/email/service')
    let downloadLinks: any[] | undefined = undefined

    // Generate download links for digital products
    const digitalItems = orderData?.items?.filter((item: any) => 
      item.product?.productType === 'digital' || item.product?.type === 'digital'
    ) || []

    if (digitalItems.length > 0) {
      const { generateDownloadLinks } = await import('@/lib/digital-products/download-links')
      
      // Extract digital files from all digital products
      const allDigitalFiles = digitalItems.flatMap((item: any) => 
        item.product?.digitalFiles || []
      ).filter((file: any) => file && file.id && file.fileName && file.fileUrl)

      if (allDigitalFiles.length > 0) {
        // Get the first purchase record ID for this order (for tracking)
        let purchaseId = undefined
        try {
          const purchaseQuery = await adminDb
            .collection('purchasedProducts')
            .where('orderId', '==', orderId)
            .where('userId', '==', orderData.userId)
            .limit(1)
            .get()
          
          if (!purchaseQuery.empty) {
            purchaseId = purchaseQuery.docs[0].id
          }
        } catch (purchaseError) {
          console.warn('Could not get purchase ID for download links:', purchaseError)
        }

        downloadLinks = await generateDownloadLinks(allDigitalFiles, 24, purchaseId)
        console.log('✅ Generated', downloadLinks.length, 'download links for digital products')
      }
    }

    await sendOrderConfirmationEmail({ id: orderId, ...orderData }, downloadLinks)
    console.log('✅ Confirmation email sent with', downloadLinks?.length || 0, 'download links')
  } catch (err) {
    console.error('⚠️ Confirmation email failed:', err)
  }

  // Create service bookings
  try {
    const serviceItems = orderData?.items?.filter((item: any) => 
      item.product?.productType === 'service' || item.product?.type === 'service'
    ) || []

    if (serviceItems.length > 0) {
      const { createServiceBooking } = await import('@/lib/services/booking')
      for (const item of serviceItems) {
        await createServiceBooking(orderId, item, orderData.userId)
      }
    }
  } catch (err) {
    console.error('⚠️ Service booking creation failed:', err)
  }
}

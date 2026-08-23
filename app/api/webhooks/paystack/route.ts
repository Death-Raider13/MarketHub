import { NextRequest, NextResponse } from 'next/server'
import { getAdminFirestore } from '@/lib/firebase/admin-simple'
import crypto from 'crypto'
import { logger } from '@/lib/logger'
import { recordAffiliateConversion } from '@/lib/affiliate'

/**
 * Paystack Webhook Handler
 * 
 * This endpoint receives event notifications from Paystack.
 * It's the most reliable way to handle order fulfillment.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-paystack-signature')

    if (!signature) {
      logger.warn('Missing Paystack signature header')
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    // 1. Verify webhook signature
    const secret = process.env.PAYSTACK_SECRET_KEY
    if (!secret) {
      logger.error('CRITICAL: Paystack secret key not configured in environment')
      return NextResponse.json({ error: 'Configuration error' }, { status: 500 })
    }

    const hash = crypto
      .createHmac('sha512', secret)
      .update(body)
      .digest('hex')

    if (hash !== signature) {
      logger.warn('Invalid Paystack webhook signature detected')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const event = JSON.parse(body)
    logger.info(`Paystack Webhook received: ${event.event}`, { paystackEventId: event.data?.id } as any)

    // 2. Route events
    switch (event.event) {
      case 'charge.success':
        await handleChargeSuccess(event.data)
        break

      case 'transfer.success':
        // Handle payouts
        break

      case 'transfer.failed':
        // Handle failed payouts
        break

      default:
        logger.debug(`Unhandled Paystack event: ${event.event}`)
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error: any) {
    logger.error('Paystack webhook error:', undefined, error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

async function handleChargeSuccess(data: any) {
  const adminDb = getAdminFirestore()
  if (!adminDb) return

  const { reference, metadata } = data
  const orderId = metadata?.orderId || reference

  logger.info(`Processing charge.success for order: ${orderId}`)

  try {
    // 1. Find the order
    const orderRef = adminDb.collection('orders').doc(orderId)
    const orderDoc = await orderRef.get()

    if (!orderDoc.exists) {
      logger.warn(`Order not found for fulfillment: ${orderId}`)
      return
    }

    const orderData = orderDoc.data()

    // 2. Prevent duplicate fulfillment
    if (orderData?.status === 'completed' || orderData?.paymentStatus === 'paid') {
      logger.info(`Order ${orderId} already fulfilled. Ensuring affiliate conversion is recorded.`)
      try {
        await recordAffiliateConversion(orderId, orderData || {})
      } catch (affiliateError) {
        logger.error(`Failed to record affiliate conversion for ${orderId}`, undefined, affiliateError as Error)
      }
      return
    }

    // 3. Update Order Status
    await orderRef.update({
      paymentStatus: 'paid',
      status: orderData?.orderType === 'digital' ? 'completed' : 'processing',
      paystackReference: reference,
      paidAt: new Date(),
      updatedAt: new Date()
    })

    try {
      await recordAffiliateConversion(orderId, orderData || {})
    } catch (affiliateError) {
      logger.error(`Failed to record affiliate conversion for ${orderId}`, undefined, affiliateError as Error)
    }

    // 4. Update creator Balances (Safe transaction)
    try {
      const { updateCreatorBalances } = await import('@/lib/services/creator-balance')
      await updateCreatorBalances(orderData, orderId)
    } catch (balanceErr: any) {
      logger.error(`Failed to update creator balances via webhook for ${orderId}`, undefined, balanceErr)
    }

    // 5. Digital Product Fulfillment & Emails (Robust)
    try {
      const downloadLinks: any[] = []
      const items = orderData.items || []

      for (const item of items) {
        const p = item.product || {}
        const isDigital = p.productType === 'digital' || p.type === 'digital'
        
        if (isDigital) {
          // A. Create/Update Purchase Record
          const accessExpiresAt = p.accessDuration > 0 
            ? new Date(Date.now() + (p.accessDuration * 24 * 60 * 60 * 1000))
            : null

          const purchaseData = {
            userId: orderData.userId,
            productId: p.id,
            orderId: orderId,
            product: p,
            purchasedAt: new Date(),
            accessExpiresAt,
            downloadCount: 0,
            lastDownloadedAt: null,
            updatedAt: new Date()
          }

          // Use productId + orderId as a unique constraint for the purchase record
          const purchaseId = `${orderData.userId}_${p.id}_${orderId}`.replace(/[^a-zA-Z0-9]/g, '_')
          await adminDb.collection('purchasedProducts').doc(purchaseId).set(purchaseData, { merge: true })
          
          logger.info(`✅ Created purchase record for product ${p.id} in order ${orderId}`)

          // B. Generate Secure Download Token for Email
          try {
            const { createDownloadToken } = await import('@/lib/drm-utils')
            const tokenId = await createDownloadToken(orderData.userId, p.id, orderId)
            
            // Format link: /api/download/[tokenId]
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
            const downloadUrl = `${appUrl}/api/download/${tokenId}`
            
            downloadLinks.push({
              fileName: p.name || 'Digital Product',
              url: downloadUrl
            })
          } catch (tokenErr: any) {
            logger.error(`Failed to generate download token for ${p.id}`, undefined, tokenErr)
          }
        }
      }

      // C. Send Order Confirmation Email with Links
      const { sendOrderConfirmationEmail } = await import('@/lib/email/service')
      await sendOrderConfirmationEmail({ id: orderId, ...orderData }, downloadLinks)
      logger.info(`Fulfillment emails sent for order: ${orderId} with ${downloadLinks.length} download links`)

    } catch (fulfillmentErr: any) {
      logger.error(`Post-fulfillment failure (non-critical) for ${orderId}`, undefined, fulfillmentErr)
    }

  } catch (error: any) {
    logger.error(`Error fulfilling order ${orderId} via webhook`, undefined, error)
    throw error
  }
}

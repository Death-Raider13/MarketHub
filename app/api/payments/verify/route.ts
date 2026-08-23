import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { getAdminFirestore } from '@/lib/firebase/admin-simple'
import { createApiLogger, logBusinessEvent, logSecurityEvent } from '@/lib/logger'
import { verifyAuthToken } from '@/lib/api-auth'
import { recordAffiliateConversion } from '@/lib/affiliate'

// Get admin database instance
const adminDb = getAdminFirestore()

export async function POST(request: NextRequest) {
  const logger = createApiLogger(request, '/api/payments/verify')

  try {
    const auth = await verifyAuthToken(request)
    if ('error' in auth) return auth.error

    const { reference, orderId } = await request.json()
    logger.info('Payment verification requested', { reference, orderId })

    if (!reference || !orderId) {
      return NextResponse.json(
        { error: 'Payment reference and order ID are required' },
        { status: 400 }
      )
    }

    // Check if secret key exists
    const secretKey = process.env.PAYSTACK_SECRET_KEY
    if (!secretKey) {
      console.error('PAYSTACK_SECRET_KEY is not set in environment variables')
      return NextResponse.json(
        { error: 'Payment gateway configuration error' },
        { status: 500 }
      )
    }

    logger.info('Verifying payment with Paystack', { reference })

    // Verify payment with Paystack
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json'
        }
      }
    )

    const { data } = response.data

    if (data.status === 'success') {
      // Payment successful - update the explicitly identified order.
      // Never infer ownership or order identity from a caller-controlled reference.
      const adminDb = getAdminFirestore()

      if (!adminDb) {
        console.error('❌ Firebase Admin SDK not configured')
        return NextResponse.json(
          { error: 'Server configuration error - Admin SDK not available' },
          { status: 500 }
        )
      }

      try {
        const orderRef = adminDb.collection('orders').doc(orderId)

        // Check if order exists
        const orderDoc = await orderRef.get()
        if (!orderDoc.exists) {
          return NextResponse.json(
            { error: 'Order not found' },
            { status: 404 }
          )
        }

        let orderData = orderDoc.data()

        if (orderData?.userId !== auth.user.uid && orderData?.customerId !== auth.user.uid) {
          logSecurityEvent('payment_verification_order_owner_mismatch', 'high', {
            orderId,
            authenticatedUserId: auth.user.uid,
          })
          return NextResponse.json({ error: 'Unauthorized access to order' }, { status: 403 })
        }

        const expectedAmount = Number(orderData?.total ?? orderData?.totalAmount)
        const receivedAmount = Number(data.amount)
        const receivedCurrency = String(data.currency || '').toUpperCase()
        if (!Number.isFinite(expectedAmount) || expectedAmount <= 0 ||
            !Number.isFinite(receivedAmount) ||
            Math.round(expectedAmount * 100) !== Math.round(receivedAmount) ||
            receivedCurrency !== 'NGN') {
          logSecurityEvent('payment_verification_amount_mismatch', 'critical', {
            orderId,
            expectedAmount,
            receivedAmount,
            receivedCurrency,
          })
          return NextResponse.json({ error: 'Payment amount or currency does not match the order' }, { status: 400 })
        }

        const existingReference = orderData?.paymentReference || orderData?.paystackReference
        const alreadyPaid = ['paid', 'completed'].includes(String(orderData?.paymentStatus)) ||
          ['paid', 'completed'].includes(String(orderData?.status))
        if (alreadyPaid && existingReference === reference) {
          try {
            await recordAffiliateConversion(orderId, orderData || {})
          } catch (affiliateError) {
            logger.error('Affiliate conversion retry failed', undefined, affiliateError as Error)
          }
          return NextResponse.json({
            success: true,
            message: 'Payment was already verified',
            order: { id: orderId, ...orderData },
          })
        }

        if (alreadyPaid && existingReference && existingReference !== reference) {
          logSecurityEvent('payment_verification_paid_order_reference_conflict', 'critical', {
            orderId,
            authenticatedUserId: auth.user.uid,
            existingReference,
            receivedReference: reference,
          })
          return NextResponse.json({ error: 'Order has already been paid with a different reference' }, { status: 409 })
        }

        // Note: Physical inventory reduction removed as per digital-first pivot

        // Update order status
        await orderRef.update({
          status: 'paid',
          paymentStatus: 'completed',
          paymentReference: reference,
          paymentMethod: 'paystack',
          paidAt: new Date(),
          paymentData: {
            amount: data.amount / 100, // Convert from kobo to Naira
            currency: data.currency,
            channel: data.channel,
            cardType: data.authorization?.card_type || '',
            bank: data.authorization?.bank || '',
            last4: data.authorization?.last4 || ''
          },
          updatedAt: new Date()
        })

        // Get updated order details
        const updatedOrderDoc = await orderRef.get()
        orderData = updatedOrderDoc.data()

        logger.info('Payment verified successfully', { orderId })

        try {
          const affiliateResult = await recordAffiliateConversion(orderId, orderData || {})
          if (affiliateResult.created) {
            logger.info('Affiliate conversion recorded', {
              orderId,
              affiliateId: affiliateResult.affiliateId,
              commissionAmount: affiliateResult.commissionAmount,
            })
          }
        } catch (affiliateError) {
          // Payment must remain successful if affiliate bookkeeping needs retry.
          logger.error('Affiliate conversion recording failed', undefined, affiliateError as Error)
        }

        // Create purchased products records for digital products
        try {
          const digitalItems = orderData.items?.filter((item: any) =>
            item.product?.productType === 'digital' || item.product?.type === 'digital'
          ) || []

          if (digitalItems.length > 0) {
            logger.info('Creating purchase records for digital products', { count: digitalItems.length })

            for (const item of digitalItems) {
              const purchaseData = {
                userId: orderData.userId,
                productId: item.productId,
                orderId: orderId,
                product: item.product,
                purchasedAt: new Date(),
                downloadCount: 0,
                accessExpiresAt: item.product.accessDuration > 0
                  ? new Date(Date.now() + (item.product.accessDuration * 24 * 60 * 60 * 1000))
                  : null
              }

              await adminDb.collection('purchasedProducts').add(purchaseData)
            }

            logger.info('Created purchase records for digital products')
          }
        } catch (purchaseError) {
          console.error('⚠️ Failed to create purchase records:', purchaseError)
          // Don't fail the payment if purchase record creation fails
        }

        // Update creator balances safely using transactions
        try {
          const { updateCreatorBalances } = await import('@/lib/services/creator-balance')
          await updateCreatorBalances(orderData, orderId)
          logger.info('creator balances updated successfully')

          // Log checkout event for analytics
          const { logEvent } = await import('@/lib/analytics')
          for (const item of (orderData.items || [])) {
            await logEvent('checkout', {
              productId: item.productId,
              creatorId: item.product?.creatorId || item.creatorId,
              userId: orderData.userId,
              orderId,
              amount: (item.productPrice || 0) * (item.quantity || 1)
            })
          }

          // Update Creator Reputation
          const { updateCreatorReputation } = await import('@/lib/services/reputation')
          const uniquecreatorIds = new Set((orderData.items || []).map((item: any) =>
            (item.product?.creatorId || item.creatorId) as string
          ).filter(Boolean))

          for (const vId of Array.from(uniquecreatorIds)) {
            await updateCreatorReputation(vId as string)
          }
        } catch (balanceError) {
          console.error('⚠️ Failed to update creator balances:', balanceError)
          // Don't fail the payment if balance update fails
        }

        // Notify creators of new sales — both via email and in-app bell.
        try {
          const { sendCreatorSaleNotification } = await import('@/lib/email/service')
          const { notificationService } = await import('@/lib/notifications/service')

          const creatorItemsMap = new Map<string, any[]>()

          orderData.items?.forEach((item: any) => {
            const creatorId = item.product?.creatorId || item.creatorId
            if (!creatorId) return

            const existing = creatorItemsMap.get(creatorId) || []
            existing.push(item)
            creatorItemsMap.set(creatorId, existing)
          })

          for (const [creatorId, items] of creatorItemsMap.entries()) {
            const creatorDoc = await adminDb.collection('users').doc(creatorId).get()
            const creatorEmail = creatorDoc.exists ? creatorDoc.data()?.email : null

            // Sum this creator's share of the order for the in-app message.
            const creatorRevenue = items.reduce(
              (sum, it) => sum + (Number(it.productPrice) || 0) * (Number(it.quantity) || 1),
              0
            )
            const primaryProduct = items[0]?.product?.name || 'a product'

            // In-app notification (creator dashboard bell).
            try {
              await notificationService.createNotification(creatorId, 'new_order_received', {
                metadata: {
                  orderId,
                  productName: primaryProduct,
                  amount: creatorRevenue,
                  actionUrl: '/creator/orders',
                },
              })
            } catch (notifyErr) {
              console.error('⚠️ Failed to create in-app sale notification:', notifyErr)
            }

            // Email notification (best-effort, one per item).
            if (creatorEmail) {
              for (const item of items) {
                try {
                  await sendCreatorSaleNotification(creatorEmail, item, orderId)
                } catch (emailErr) {
                  console.error('⚠️ Failed to email creator sale notification:', emailErr)
                }
              }
            }
          }
        } catch (creatorEmailError) {
          console.error('⚠️ Failed to send creator sale notifications:', creatorEmailError)
          // Don't fail the payment if creator notifications fail
        }

        // Generate secure DRM download links and send confirmation email
        try {
          const { sendOrderConfirmationEmail } = await import('@/lib/email/service')
          const { createDownloadToken } = await import('@/lib/drm-utils')
          const downloadLinks: any[] = []

          const digitalItems = orderData.items?.filter((item: any) =>
            item.product?.productType === 'digital' || item.product?.type === 'digital'
          ) || []

          if (digitalItems.length > 0) {
            for (const item of digitalItems) {
              const files = item.product?.digitalFiles || []
              for (const file of files) {
                // Create a secure token for this file/purchase
                const tokenId = await createDownloadToken(
                  orderData.userId,
                  item.productId,
                  orderId,
                  { maxDownloads: item.product.downloadLimit || 3 }
                )

                const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
                downloadLinks.push({
                  fileId: file.id,
                  fileName: file.fileName,
                  url: `${baseUrl}/api/download/${tokenId}?fileId=${file.id}`,
                  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h
                })
              }
            }
          }

          await sendOrderConfirmationEmail(
            { id: orderId, ...orderData },
            downloadLinks
          )
          logger.info('Digital fulfillment completed and confirmation email sent', { downloadLinkCount: downloadLinks.length })
        } catch (fulfillmentError) {
          console.error('⚠️ Failed digital fulfillment/email:', fulfillmentError)
        }

        // Create service bookings for service products
        try {
          const serviceItems = orderData.items?.filter((item: any) =>
            item.product?.productType === 'service' || item.product?.type === 'service'
          ) || []

          if (serviceItems.length > 0) {
            const { createServiceBooking } = await import('@/lib/services/booking')

            for (const serviceItem of serviceItems) {
              await createServiceBooking(orderId, serviceItem, orderData.userId)
            }

            logger.info('Created service bookings', { count: serviceItems.length })
          }
        } catch (serviceError) {
          console.error('⚠️ Failed to create service bookings:', serviceError)
          // Don't fail the payment if service booking fails
        }

        return NextResponse.json({
          success: true,
          message: 'Payment verified successfully',
          order: {
            id: orderId,
            ...orderData
          }
        })
      } catch (firestoreError: any) {
        console.error('❌ Firestore update error:', firestoreError)
        return NextResponse.json(
          { error: firestoreError.message || 'Failed to update order' },
          { status: 500 }
        )
      }
    } else {
      return NextResponse.json(
        { error: 'Payment verification failed', status: data.status },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('Payment verification error:', error)

    // Handle specific Paystack errors
    if (error.response?.status === 404) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Payment verification failed' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { getAdminFirestore } from '@/lib/firebase/admin-simple'
import { createApiLogger, logBusinessEvent, logSecurityEvent } from '@/lib/logger'

// Get admin database instance
const adminDb = getAdminFirestore()

export async function POST(request: NextRequest) {
  const logger = createApiLogger(request, '/api/payments/verify')
  
  try {
    const { reference } = await request.json()
    logger.info('Payment verification requested', { reference })

    if (!reference) {
      return NextResponse.json(
        { error: 'Payment reference is required' },
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

    console.log('Verifying payment with reference:', reference)
    console.log('Using secret key:', secretKey.substring(0, 10) + '...')

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
      // Payment successful - update order in database using Admin SDK
      const orderId = reference
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

        // Reduce inventory for physical products
        try {
          const physicalItems = orderData?.items?.filter((item: any) => 
            item.product?.productType === 'physical'
          ).map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            productName: item.productName,
            vendorId: item.vendorId
          })) || []

          if (physicalItems.length > 0) {
            const { reduceInventory } = await import('@/lib/inventory/management')
            const inventoryResults = await reduceInventory(physicalItems)
            
            // Log inventory results
            const failedUpdates = inventoryResults.filter(r => !r.success)
            if (failedUpdates.length > 0) {
              console.warn('Some inventory updates failed:', failedUpdates)
            }
          }
        } catch (inventoryError) {
          console.error('⚠️ Failed to reduce inventory:', inventoryError)
          // Don't fail the payment if inventory update fails
        }

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

        console.log('✅ Payment verified successfully for order:', orderId)

        // Create purchased products records for digital products
        try {
          const digitalItems = orderData.items?.filter((item: any) => 
            item.product?.type === 'digital'
          ) || []

          if (digitalItems.length > 0) {
            console.log('✅ Creating purchase records for', digitalItems.length, 'digital products')
            
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
            
            console.log('✅ Created purchase records for digital products')
          }
        } catch (purchaseError) {
          console.error('⚠️ Failed to create purchase records:', purchaseError)
          // Don't fail the payment if purchase record creation fails
        }

        // Update vendor balances for this order
        try {
          const vendorUpdates = new Map<string, number>()

          orderData.items?.forEach((item: any) => {
            const vendorId = item.product?.vendorId || item.vendorId
            if (!vendorId) return

            const price =
              item.product?.price ??
              item.productPrice ??
              item.price ??
              0
            const quantity = item.quantity || 1
            const itemTotal = price * quantity
            const commission = 0.15 // 15% platform commission
            const vendorEarning = itemTotal * (1 - commission)

            vendorUpdates.set(
              vendorId,
              (vendorUpdates.get(vendorId) || 0) + vendorEarning
            )
          })

          const balancePromises = Array.from(vendorUpdates.entries()).map(
            async ([vendorId, earning]) => {
              const balanceRef = adminDb.collection('vendorBalances').doc(vendorId)
              const balanceDoc = await balanceRef.get()

              if (balanceDoc.exists) {
                const currentBalance = balanceDoc.data()
                await balanceRef.update({
                  availableBalance: (currentBalance?.availableBalance || 0) + earning,
                  totalEarnings: (currentBalance?.totalEarnings || 0) + earning,
                  updatedAt: new Date(),
                })
              } else {
                await balanceRef.set({
                  vendorId,
                  availableBalance: earning,
                  pendingBalance: 0,
                  totalEarnings: earning,
                  totalWithdrawn: 0,
                  updatedAt: new Date(),
                })
              }
            }
          )

          await Promise.all(balancePromises)
        } catch (balanceError) {
          console.error('⚠️ Failed to update vendor balances:', balanceError)
          // Don't fail the payment if balance update fails
        }

        // Send confirmation email
        try {
          const { sendOrderConfirmationEmail } = await import('@/lib/email/service')
          await sendOrderConfirmationEmail(
            { id: orderId, ...orderData }
          )
          console.log('✅ Confirmation email sent')
        } catch (emailError) {
          console.error('⚠️ Failed to send confirmation email:', emailError)
          // Don't fail the payment if email fails
        }

        // Create service bookings for service products
        try {
          const serviceItems = orderData.items?.filter((item: any) => 
            item.product?.type === 'service'
          ) || []

          if (serviceItems.length > 0) {
            const { createServiceBooking } = await import('@/lib/services/booking')
            
            for (const serviceItem of serviceItems) {
              await createServiceBooking(orderId, serviceItem, orderData.userId)
            }
            
            console.log('✅ Created', serviceItems.length, 'service bookings')
          }
        } catch (serviceError) {
          console.error('⚠️ Failed to create service bookings:', serviceError)
          // Don't fail the payment if service booking fails
        }

        // TODO: Notify vendors of new sale

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

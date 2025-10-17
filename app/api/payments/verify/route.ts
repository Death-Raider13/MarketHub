import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { getAdminFirestore } from '@/lib/firebase/admin-simple'

export async function POST(request: NextRequest) {
  try {
    const { reference } = await request.json()

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
        const orderData = updatedOrderDoc.data()

        console.log('✅ Payment verified successfully for order:', orderId)

        // Check if order contains digital products and generate download links
        let downloadLinks: any[] = []
        try {
          const hasDigitalProducts = orderData.items?.some((item: any) => 
            item.product?.productType === 'digital' || 
            item.product?.digitalFiles?.length > 0
          )

          if (hasDigitalProducts) {
            const { generateDownloadLinks } = await import('@/lib/digital-products/download-links')
            
            // Collect all digital files from all items
            const allDigitalFiles = orderData.items
              ?.filter((item: any) => item.product?.digitalFiles?.length > 0)
              .flatMap((item: any) => item.product.digitalFiles) || []

            if (allDigitalFiles.length > 0) {
              downloadLinks = await generateDownloadLinks(allDigitalFiles, 24) // 24 hours expiry
              console.log('✅ Generated', downloadLinks.length, 'download links')
            }
          }
        } catch (linkError) {
          console.error('⚠️ Failed to generate download links:', linkError)
          // Don't fail the payment if link generation fails
        }

        // Send confirmation email with download links
        try {
          const { sendOrderConfirmationEmail } = await import('@/lib/email/service')
          await sendOrderConfirmationEmail(
            { id: orderId, ...orderData },
            downloadLinks.length > 0 ? downloadLinks : undefined
          )
          console.log('✅ Confirmation email sent')
        } catch (emailError) {
          console.error('⚠️ Failed to send confirmation email:', emailError)
          // Don't fail the payment if email fails
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

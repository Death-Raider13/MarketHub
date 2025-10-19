import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'

// Email service - placeholder for now
async function sendEmail(options: { to: string; subject: string; html: string }) {
  console.log('📧 Email would be sent:', options)
  // TODO: Implement with SendGrid, Mailgun, or other email service
  return Promise.resolve({ success: true })
}

// Complete an order and create digital product access records
export async function POST(request: NextRequest) {
  try {
    const { orderId, paymentReference } = await request.json()

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    // Get the order
    const orderDoc = await adminDb.collection('orders').doc(orderId).get()
    
    if (!orderDoc.exists) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    const order = orderDoc.data()
    
    if (!order) {
      return NextResponse.json(
        { error: 'Invalid order data' },
        { status: 400 }
      )
    }

    // Update order status to completed
    await adminDb.collection('orders').doc(orderId).update({
      status: 'completed',
      paymentReference,
      completedAt: new Date(),
      updatedAt: new Date()
    })

    // Create purchase records for digital products
    const digitalProducts = order.items?.filter((item: any) => 
      item.product?.productType === 'digital'
    ) || []

    const purchasePromises = digitalProducts.map(async (item: any) => {
      const product = item.product
      
      // Calculate access expiration
      const accessExpiresAt = product.accessDuration > 0 
        ? new Date(Date.now() + (product.accessDuration * 24 * 60 * 60 * 1000))
        : null

      const purchaseData = {
        userId: order.userId,
        productId: product.id,
        orderId: orderId,
        product: product,
        purchasedAt: new Date(),
        accessExpiresAt,
        downloadCount: 0,
        lastDownloadedAt: null
      }

      return adminDb.collection('purchasedProducts').add(purchaseData)
    })

    await Promise.all(purchasePromises)

    // Update vendor balances
    const vendorUpdates = new Map<string, number>()
    
    order.items?.forEach((item: any) => {
      const vendorId = item.product?.vendorId
      if (vendorId) {
        const itemTotal = item.product.price * item.quantity
        const commission = 0.15 // 15% platform commission
        const vendorEarning = itemTotal * (1 - commission)
        
        vendorUpdates.set(
          vendorId, 
          (vendorUpdates.get(vendorId) || 0) + vendorEarning
        )
      }
    })

    // Update vendor balances
    const balancePromises = Array.from(vendorUpdates.entries()).map(async ([vendorId, earning]) => {
      const balanceRef = adminDb.collection('vendorBalances').doc(vendorId)
      const balanceDoc = await balanceRef.get()
      
      if (balanceDoc.exists) {
        const currentBalance = balanceDoc.data()
        await balanceRef.update({
          availableBalance: (currentBalance?.availableBalance || 0) + earning,
          totalEarnings: (currentBalance?.totalEarnings || 0) + earning,
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
    })

    await Promise.all(balancePromises)

    // Send confirmation email with digital product access
    if (digitalProducts.length > 0) {
      try {
        // Get user details
        const userDoc = await adminDb.collection('users').doc(order.userId).get()
        const userData = userDoc.data()

        if (userData?.email) {
          const digitalProductNames = digitalProducts.map((item: any) => item.product.name).join(', ')
          
          await sendEmail({
            to: userData.email,
            subject: 'Your Digital Products Are Ready!',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Thank you for your purchase!</h2>
                <p>Your order #${orderId} has been completed successfully.</p>
                
                <h3>Digital Products Purchased:</h3>
                <ul>
                  ${digitalProducts.map((item: any) => `
                    <li style="margin: 10px 0;">
                      <strong>${item.product.name}</strong> - ₦${item.product.price.toLocaleString()}
                    </li>
                  `).join('')}
                </ul>
                
                <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="margin-top: 0;">Access Your Digital Products</h3>
                  <p>You can download your digital products from your account:</p>
                  <a href="${process.env.NEXT_PUBLIC_APP_URL}/my-purchases" 
                     style="display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0;">
                    Access My Purchases
                  </a>
                </div>
                
                <p style="color: #666; font-size: 14px;">
                  If you have any questions, please contact our support team.
                </p>
              </div>
            `
          })
        }
      } catch (emailError) {
        console.error('Error sending confirmation email:', emailError)
        // Don't fail the order completion if email fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Order completed successfully',
      digitalProductsCount: digitalProducts.length
    })

  } catch (error) {
    console.error('Error completing order:', error)
    return NextResponse.json(
      { error: 'Failed to complete order' },
      { status: 500 }
    )
  }
}

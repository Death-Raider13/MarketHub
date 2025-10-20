import { Resend } from 'resend'
import type { Order, PurchasedProduct, SecureDownloadLink } from '@/lib/types'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = 'MarketHub <orders@markethub.com>' // Change to your verified domain
const SUPPORT_EMAIL = 'support@markethub.com'

export async function sendOrderConfirmationEmail(
  order: any,
  downloadLinks?: SecureDownloadLink[]
) {
  const hasDigitalProducts = order.items.some(
    (item: any) => item.product?.productType === 'digital'
  )

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6; 
            color: #333; 
            background-color: #f5f5f5;
            margin: 0;
            padding: 0;
          }
          .container { 
            max-width: 600px; 
            margin: 20px auto; 
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; 
            padding: 30px 20px; 
            text-align: center; 
          }
          .header h1 { margin: 0; font-size: 24px; }
          .content { padding: 30px 20px; }
          .order-details { 
            background: #f9fafb; 
            padding: 20px; 
            margin: 20px 0; 
            border-radius: 8px;
            border: 1px solid #e5e7eb;
          }
          .product-item { 
            padding: 15px 0; 
            border-bottom: 1px solid #e5e7eb; 
          }
          .product-item:last-child { border-bottom: none; }
          .download-section {
            background: #eff6ff;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #3b82f6;
          }
          .download-btn { 
            display: inline-block; 
            background: #3b82f6;
            color: white !important; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 6px;
            margin: 10px 10px 10px 0;
            font-weight: 600;
          }
          .download-btn:hover {
            background: #2563eb;
          }
          .shipping-section {
            background: #fef3c7;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #f59e0b;
          }
          .footer { 
            text-align: center; 
            padding: 20px; 
            color: #6b7280; 
            font-size: 14px;
            background: #f9fafb;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            font-size: 18px;
            font-weight: bold;
            border-top: 2px solid #e5e7eb;
            margin-top: 10px;
          }
          .badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
          }
          .badge-digital {
            background: #dbeafe;
            color: #1e40af;
          }
          .badge-physical {
            background: #fef3c7;
            color: #92400e;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Thank You for Your Purchase!</h1>
          </div>
          
          <div class="content">
            <p style="font-size: 16px;">Hi <strong>${order.shippingAddress?.fullName || 'Customer'}</strong>,</p>
            <p>Your order has been confirmed and ${hasDigitalProducts ? 'your digital products are ready for download' : 'will be shipped soon'}!</p>
            
            <div class="order-details">
              <h3 style="margin-top: 0;">Order #${order.id}</h3>
              <p style="margin: 5px 0;"><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p style="margin: 5px 0;"><strong>Payment Status:</strong> <span style="color: #10b981; font-weight: 600;">Paid</span></p>
              
              <h4 style="margin-top: 20px; margin-bottom: 10px;">Items Ordered:</h4>
              ${order.items.map((item: any) => `
                <div class="product-item">
                  <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div style="flex: 1;">
                      <strong style="font-size: 16px;">${item.productName || item.product?.name}</strong>
                      <span class="badge ${item.product?.productType === 'digital' ? 'badge-digital' : 'badge-physical'}">
                        ${item.product?.productType === 'digital' ? '📥 Digital' : '📦 Physical'}
                      </span>
                      <div style="color: #6b7280; font-size: 14px; margin-top: 5px;">
                        Quantity: ${item.quantity} × ₦${item.productPrice?.toLocaleString() || '0'}
                      </div>
                    </div>
                    <div style="font-weight: 600; font-size: 16px;">
                      ₦${((item.productPrice || 0) * item.quantity).toLocaleString()}
                    </div>
                  </div>
                </div>
              `).join('')}
              
              <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
                <div style="display: flex; justify-content: space-between; padding: 5px 0;">
                  <span>Subtotal:</span>
                  <span>₦${order.subtotal?.toLocaleString() || '0'}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 5px 0;">
                  <span>Tax:</span>
                  <span>₦${order.tax?.toLocaleString() || '0'}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 5px 0;">
                  <span>Shipping:</span>
                  <span>${order.shipping === 0 ? 'FREE' : '₦' + order.shipping?.toLocaleString()}</span>
                </div>
                <div class="total-row">
                  <span>Total:</span>
                  <span>₦${order.total?.toLocaleString() || '0'}</span>
                </div>
              </div>
            </div>
            
            ${hasDigitalProducts && downloadLinks && downloadLinks.length > 0 ? `
              <div class="download-section">
                <h3 style="margin-top: 0; color: #1e40af;">📥 Download Your Digital Products</h3>
                <p>Click the buttons below to download your products. Links expire in 24 hours.</p>
                ${downloadLinks.map(link => `
                  <a href="${link.url}" class="download-btn">
                    📄 Download ${link.fileName}
                  </a>
                `).join('')}
                <p style="font-size: 13px; color: #6b7280; margin-top: 15px; margin-bottom: 0;">
                  💡 <strong>Tip:</strong> You can also access your downloads anytime from your 
                  <a href="${process.env.NEXT_PUBLIC_APP_URL}/my-purchases" style="color: #3b82f6;">Purchase History</a>.
                </p>
              </div>
            ` : ''}
            
            ${!hasDigitalProducts ? `
              <div class="shipping-section">
                <h3 style="margin-top: 0; color: #92400e;">📦 Shipping Information</h3>
                <p style="margin: 5px 0;"><strong>Shipping Address:</strong></p>
                <p style="margin: 5px 0; line-height: 1.8;">
                  ${order.shippingAddress?.fullName}<br>
                  ${order.shippingAddress?.addressLine1}<br>
                  ${order.shippingAddress?.addressLine2 ? order.shippingAddress.addressLine2 + '<br>' : ''}
                  ${order.shippingAddress?.city}, ${order.shippingAddress?.state} ${order.shippingAddress?.zipCode}<br>
                  ${order.shippingAddress?.country}<br>
                  📞 ${order.shippingAddress?.phone}
                </p>
                <p style="margin-top: 15px; margin-bottom: 0;">
                  <strong>Estimated delivery:</strong> 5-7 business days
                </p>
              </div>
            ` : ''}
            
            <div style="margin-top: 30px; padding: 20px; background: #f9fafb; border-radius: 8px;">
              <h4 style="margin-top: 0;">Need Help?</h4>
              <p style="margin: 5px 0;">If you have any questions about your order, please contact us:</p>
              <p style="margin: 5px 0;">
                📧 Email: <a href="mailto:${SUPPORT_EMAIL}" style="color: #3b82f6;">${SUPPORT_EMAIL}</a><br>
                🌐 Visit: <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="color: #3b82f6;">MarketHub</a>
              </p>
            </div>
          </div>
          
          <div class="footer">
            <p style="margin: 5px 0;"><strong>© 2025 MarketHub. All rights reserved.</strong></p>
            <p style="margin: 5px 0;">You received this email because you made a purchase on MarketHub.</p>
            <p style="margin: 5px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/orders" style="color: #3b82f6;">View Order</a> | 
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/help" style="color: #3b82f6;">Help Center</a>
            </p>
          </div>
        </div>
      </body>
    </html>
  `

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: order.userEmail || order.shippingAddress?.email || 'customer@example.com',
      subject: `Order Confirmation - ${order.id}`,
      html: html
    })

    console.log('Order confirmation email sent:', result)
    return result
  } catch (error) {
    console.error('Failed to send order confirmation email:', error)
    throw error
  }
}

export async function sendVendorSaleNotification(
  vendorEmail: string,
  orderItem: any,
  orderId: string
) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { padding: 20px; background: #f9fafb; border-radius: 0 0 8px 8px; }
          .sale-details { background: white; padding: 15px; margin: 20px 0; border-radius: 8px; border: 1px solid #e5e7eb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 New Sale!</h1>
          </div>
          <div class="content">
            <p>Congratulations! You've made a new sale.</p>
            <div class="sale-details">
              <h3>Sale Details</h3>
              <p><strong>Product:</strong> ${orderItem.productName}</p>
              <p><strong>Quantity:</strong> ${orderItem.quantity}</p>
              <p><strong>Amount:</strong> ₦${(orderItem.productPrice * orderItem.quantity).toLocaleString()}</p>
              <p><strong>Order ID:</strong> ${orderId}</p>
            </div>
            <p>View your sales dashboard to manage this order.</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/vendor/orders" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">
              View Orders
            </a>
          </div>
        </div>
      </body>
    </html>
  `

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: vendorEmail,
      subject: `New Sale - ${orderItem.productName}`,
      html: html
    })

    console.log('Vendor notification sent:', result)
    return result
  } catch (error) {
    console.error('Failed to send vendor notification:', error)
    throw error
  }
}

export async function sendPasswordResetEmail(
  email: string,
  resetLink: string
) {
  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Reset Your Password</h2>
          <p>You requested to reset your password. Click the button below to create a new password:</p>
          <a href="${resetLink}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
            Reset Password
          </a>
          <p>If you didn't request this, please ignore this email.</p>
          <p>This link will expire in 1 hour.</p>
        </div>
      </body>
    </html>
  `

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Reset Your Password - MarketHub',
      html: html
    })

    return result
  } catch (error) {
    console.error('Failed to send password reset email:', error)
    throw error
  }
}

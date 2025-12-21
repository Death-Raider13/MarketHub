import type { Order, PurchasedProduct, SecureDownloadLink, PayoutRequest } from '@/lib/types'
import { sendEmail } from './send-email'

const FROM_EMAIL = 'FEROMARKETHUB <orders@FEROMARKETHUB.com>' // Can be overridden via SMTP/Resend config
const SUPPORT_EMAIL = 'support@FEROMARKETHUB.com'

// Base app URL used in emails. Make sure NEXT_PUBLIC_APP_URL is set in your env.
const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXTAUTH_URL ||
  'http://localhost:3000'

export async function sendOrderConfirmationEmail(
  order: any,
  downloadLinks?: SecureDownloadLink[]
) {
  const hasDigitalProducts = order.items.some(
    (item: any) => item.product?.productType === 'digital' || item.product?.type === 'digital'
  )

  const hasPhysicalProducts = order.items.some(
    (item: any) => item.product?.productType === 'physical' || item.product?.type === 'physical'
  )

   const hasServiceProducts = order.items.some(
    (item: any) => item.product?.productType === 'service' || item.product?.type === 'service'
  )

  const introMessage = hasDigitalProducts && hasPhysicalProducts
    ? 'your digital products are ready for download and your physical items will be shipped soon'
    : hasDigitalProducts && hasServiceProducts
      ? 'your digital products are ready for download and your service booking has been confirmed'
      : hasServiceProducts
        ? 'your service booking has been confirmed'
        : hasDigitalProducts
          ? 'your digital products are ready for download'
          : 'your order will be shipped soon'

  // Prefer an explicit customerName, then shipping name, then email local-part, then fallback
  const emailLocalPart = typeof order.userEmail === 'string'
    ? order.userEmail.split('@')[0]
    : ''

  const customerName =
    order.customerName ||
    order.shippingAddress?.fullName ||
    order.userName ||
    emailLocalPart ||
    'Customer'

  // Handle Firestore Timestamp, Date, string, or number for createdAt
  let createdAtDate: Date
  if (order.createdAt && typeof order.createdAt.toDate === 'function') {
    createdAtDate = order.createdAt.toDate()
  } else {
    createdAtDate = new Date(order.createdAt || Date.now())
  }

  const safeCreatedAt = isNaN(createdAtDate.getTime()) ? new Date() : createdAtDate

  const orderDateString = safeCreatedAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

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
          .badge-service {
            background: #e0f2fe;
            color: #075985;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Thank You for Your Purchase!</h1>
          </div>
          
          <div class="content">
            <p style="font-size: 16px;">Hi <strong>${customerName}</strong>,</p>
            <p>Your order has been confirmed and ${introMessage}!</p>
            
            <div class="order-details">
              <h3 style="margin-top: 0;">Order #${order.id}</h3>
              <p style="margin: 5px 0;"><strong>Order Date:</strong> ${orderDateString}</p>
              <p style="margin: 5px 0;"><strong>Payment Status:</strong> <span style="color: #10b981; font-weight: 600;">Paid</span></p>
              
              <h4 style="margin-top: 20px; margin-bottom: 10px;">Items Ordered:</h4>
              ${order.items.map((item: any) => `
                <div class="product-item">
                  <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div style="flex: 1;">
                      <strong style="font-size: 16px;">${item.productName || item.product?.name}</strong>
                      <span class="badge ${
                        item.product?.productType === 'digital' || item.product?.type === 'digital'
                          ? 'badge-digital'
                          : item.product?.productType === 'service' || item.product?.type === 'service'
                            ? 'badge-service'
                            : 'badge-physical'
                      }">
                        ${
                          item.product?.productType === 'digital' || item.product?.type === 'digital'
                            ? '📥 Digital'
                            : item.product?.productType === 'service' || item.product?.type === 'service'
                              ? '🗓 Service'
                              : '📦 Physical'
                        }
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
                  <a href="${APP_URL}/my-purchases" style="color: #3b82f6;">Purchase History</a>.
                </p>
              </div>
            ` : ''}
            
            ${hasPhysicalProducts ? `
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
                  <strong>Delivery:</strong> Delivery timelines and costs are defined by each vendor for their products. Check your order details in your account for the latest status.
                </p>
              </div>
            ` : ''}
            
            <div style="margin-top: 30px; padding: 20px; background: #f9fafb; border-radius: 8px;">
              <h4 style="margin-top: 0;">Need Help?</h4>
              <p style="margin: 5px 0;">If you have any questions about your order, please contact us:</p>
              <p style="margin: 5px 0;">
                📧 Email: <a href="mailto:${SUPPORT_EMAIL}" style="color: #3b82f6;">${SUPPORT_EMAIL}</a><br>
                🌐 Visit: <a href="${APP_URL}" style="color: #3b82f6;">FEROMARKETHUB</a>
              </p>
            </div>
          </div>
          
          <div class="footer">
            <p style="margin: 5px 0;"><strong>© 2025 FEROMARKETHUB. All rights reserved.</strong></p>
            <p style="margin: 5px 0;">You received this email because you made a purchase on FEROMARKETHUB.</p>
            <p style="margin: 5px 0;">
              <a href="${APP_URL}/dashboard/orders" style="color: #3b82f6;">View Order</a> | 
              <a href="${APP_URL}/help" style="color: #3b82f6;">Help Center</a>
            </p>
          </div>
        </div>
      </body>
    </html>
  `

  try {
    const result = await sendEmail({
      from: FROM_EMAIL,
      to: order.userEmail || order.shippingAddress?.email || 'customer@example.com',
      subject: `Order Confirmation - ${order.id}`,
      html: html,
    })

    console.log('Order confirmation email sent:', result)
    return result
  } catch (error) {
    console.error('Failed to send order confirmation email:', error)
    throw error
  }
}

async function sendOrderStatusEmail(
  order: any,
  status: 'shipped' | 'delivered' | 'cancelled'
) {
  // Prefer an explicit customerName, then shipping name, then email local-part, then fallback
  const emailLocalPart = typeof order.userEmail === 'string'
    ? order.userEmail.split('@')[0]
    : ''

  const customerName =
    order.customerName ||
    order.shippingAddress?.fullName ||
    order.userName ||
    emailLocalPart ||
    'Customer'

  let subject: string
  let bodyIntro: string

  switch (status) {
    case 'shipped':
      subject = `Your FEROMARKETHUB order #${order.id} has been shipped`
      bodyIntro = 'Good news! Your order has been shipped and is on its way.'
      break
    case 'delivered':
      subject = `Your FEROMARKETHUB order #${order.id} has been delivered`
      bodyIntro = 'Your order has been delivered. We hope you enjoy your purchase.'
      break
    case 'cancelled':
      subject = `Your FEROMARKETHUB order #${order.id} has been cancelled`
      bodyIntro = 'Your order has been cancelled. If you did not request this, please contact support immediately.'
      break
  }

  const trackingLine = order.trackingNumber
    ? `<p style="margin: 8px 0;"><strong>Tracking number:</strong> <span style="font-family: monospace;">${order.trackingNumber}</span></p>`
    : ''

  const statusHtml = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #111827; background-color: #f3f4f6; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); overflow: hidden;">
          <div style="padding: 20px 24px; border-bottom: 1px solid #e5e7eb; background: #111827; color: #f9fafb;">
            <h1 style="margin: 0; font-size: 20px;">Order Update</h1>
          </div>
          <div style="padding: 24px;">
            <p style="margin: 0 0 12px 0; font-size: 15px;">Hi <strong>${customerName}</strong>,</p>
            <p style="margin: 0 0 16px 0; font-size: 15px;">${bodyIntro}</p>
            <div style="margin: 16px 0; padding: 12px 16px; background: #f9fafb; border-radius: 6px; border: 1px solid #e5e7eb;">
              <p style="margin: 4px 0;"><strong>Order ID:</strong> ${order.id}</p>
              ${trackingLine}
              <p style="margin: 4px 0;"><strong>Status:</strong> ${status.charAt(0).toUpperCase() + status.slice(1)}</p>
            </div>
            <p style="margin: 16px 0 0 0; font-size: 14px; color: #4b5563;">
              You can view the latest details for this order any time from your
              <a href="${APP_URL}/orders" style="color: #2563eb; text-decoration: underline;">orders page</a>.
            </p>
          </div>
          <div style="padding: 16px 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #6b7280; background: #f9fafb;">
            <p style="margin: 4px 0;">If you have any questions, reply to this email or contact <a href="mailto:${SUPPORT_EMAIL}" style="color: #2563eb;">${SUPPORT_EMAIL}</a>.</p>
            <p style="margin: 4px 0;">© 2025 FEROMARKETHUB</p>
          </div>
        </div>
      </body>
    </html>
  `

  try {
    return await sendEmail({
      from: FROM_EMAIL,
      to: order.userEmail || order.shippingAddress?.email || 'customer@example.com',
      subject,
      html: statusHtml,
    })
  } catch (error) {
    console.error('Failed to send order status email:', error)
    throw error
  }
}

export async function sendOrderShippedEmail(order: any) {
  return sendOrderStatusEmail(order, 'shipped')
}

export async function sendOrderDeliveredEmail(order: any) {
  return sendOrderStatusEmail(order, 'delivered')
}

export async function sendOrderCancelledEmail(order: any) {
  return sendOrderStatusEmail(order, 'cancelled')
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
    const result = await sendEmail({
      from: FROM_EMAIL,
      to: vendorEmail,
      subject: `New Sale - ${orderItem.productName}`,
      html: html,
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
    const result = await sendEmail({
      from: FROM_EMAIL,
      to: email,
      subject: 'Reset Your Password - FEROMARKETHUB',
      html: html,
    })

    return result
  } catch (error) {
    console.error('Failed to send password reset email:', error)
    throw error
  }
}

export async function sendPasswordChangedEmail(email: string) {
  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Password Changed</h2>
          <p>This is a confirmation that the password for your FEROMARKETHUB account was just changed.</p>
          <p>If you made this change, no further action is required.</p>
          <p>If you did <strong>not</strong> make this change, please reset your password immediately and contact support at <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>.</p>
          <p>You can review your account security settings here:</p>
          <a href="${APP_URL}/account" style="display: inline-block; background: #111827; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
            Review Account Security
          </a>
        </div>
      </body>
    </html>
  `

  try {
    return await sendEmail({
      from: FROM_EMAIL,
      to: email,
      subject: 'Your FEROMARKETHUB password was changed',
      html,
    })
  } catch (error) {
    console.error('Failed to send password changed email:', error)
    throw error
  }
}

async function sendPayoutStatusEmail(
  payout: PayoutRequest | (Partial<PayoutRequest> & { id?: string }),
  status: 'completed' | 'rejected'
) {
  const vendorEmail = payout.vendorEmail
  if (!vendorEmail) {
    throw new Error('Missing vendorEmail for payout status email')
  }

  const vendorName = (payout as any).vendorName || vendorEmail.split('@')[0] || 'Vendor'
  const amount = payout.amount || 0

  let subject: string
  let bodyIntro: string

  if (status === 'completed') {
    subject = `Your payout of ₦${amount.toLocaleString()} has been completed`
    bodyIntro = `Good news! Your payout request has been processed and marked as completed.`
  } else {
    subject = `Your payout request of ₦${amount.toLocaleString()} was rejected`
    bodyIntro = `Your payout request was rejected. Please review the details below.`
  }

  const rejectionSection =
    status === 'rejected' && (payout as any).rejectionReason
      ? `<p style="margin: 8px 0;"><strong>Reason:</strong> ${(payout as any).rejectionReason}</p>`
      : ''

  const referenceLine = (payout as any).transactionReference
    ? `<p style="margin: 8px 0;"><strong>Transaction Reference:</strong> ${(payout as any).transactionReference}</p>`
    : ''

  const statusLabel = status === 'completed' ? 'Completed' : 'Rejected'

  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #111827; background-color: #f3f4f6; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); overflow: hidden;">
          <div style="padding: 20px 24px; border-bottom: 1px solid #e5e7eb; background: #111827; color: #f9fafb;">
            <h1 style="margin: 0; font-size: 20px;">Payout Update</h1>
          </div>
          <div style="padding: 24px;">
            <p style="margin: 0 0 12px 0; font-size: 15px;">Hi <strong>${vendorName}</strong>,</p>
            <p style="margin: 0 0 16px 0; font-size: 15px;">${bodyIntro}</p>
            <div style="margin: 16px 0; padding: 12px 16px; background: #f9fafb; border-radius: 6px; border: 1px solid #e5e7eb;">
              <p style="margin: 4px 0;"><strong>Amount:</strong> ₦${amount.toLocaleString()}</p>
              <p style="margin: 4px 0;"><strong>Status:</strong> ${statusLabel}</p>
              ${referenceLine}
              ${rejectionSection}
            </div>
            <p style="margin: 16px 0 0 0; font-size: 14px; color: #4b5563;">
              You can view all your payout requests any time from your
              <a href="${APP_URL}/vendor/payouts" style="color: #2563eb; text-decoration: underline;">payouts page</a>.
            </p>
          </div>
          <div style="padding: 16px 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #6b7280; background: #f9fafb;">
            <p style="margin: 4px 0;">If you have any questions, reply to this email or contact <a href="mailto:${SUPPORT_EMAIL}" style="color: #2563eb;">${SUPPORT_EMAIL}</a>.</p>
            <p style="margin: 4px 0;">© 2025 FEROMARKETHUB</p>
          </div>
        </div>
      </body>
    </html>
  `

  try {
    return await sendEmail({
      from: FROM_EMAIL,
      to: vendorEmail,
      subject,
      html,
    })
  } catch (error) {
    console.error('Failed to send payout status email:', error)
    throw error
  }
}

export async function sendPayoutCompletedEmail(payout: PayoutRequest | (Partial<PayoutRequest> & { id?: string })) {
  return sendPayoutStatusEmail(payout, 'completed')
}

export async function sendPayoutRejectedEmail(payout: PayoutRequest | (Partial<PayoutRequest> & { id?: string })) {
  return sendPayoutStatusEmail(payout, 'rejected')
}

type BasicRefund = {
  id?: string
  reason?: string
  status?: string
  amount?: number
}

function getRefundCustomerName(order: any) {
  const emailLocalPart = typeof order.userEmail === 'string'
    ? order.userEmail.split('@')[0]
    : ''

  return (
    order.customerName ||
    order.shippingAddress?.fullName ||
    order.userName ||
    emailLocalPart ||
    'Customer'
  )
}

async function sendRefundEmail(
  order: any,
  refund: BasicRefund,
  phase: 'requested' | 'rejected' | 'processed'
) {
  const customerName = getRefundCustomerName(order)
  const amount = typeof refund.amount === 'number' && refund.amount > 0
    ? refund.amount
    : order.total

  let subject: string
  let intro: string
  let highlight: string

  if (phase === 'requested') {
    subject = `We received your refund request for order #${order.id}`
    intro = 'Your refund request has been submitted and is now under review.'
    highlight = 'Refund request received'
  } else if (phase === 'rejected') {
    subject = `Your refund request for order #${order.id} was rejected`
    intro = 'We reviewed your refund request and were unable to approve it.'
    highlight = 'Refund request rejected'
  } else {
    subject = `Your refund for order #${order.id} has been processed`
    intro = 'Your refund has been processed. Depending on your bank, it may take a few days to appear.'
    highlight = 'Refund processed'
  }

  const reasonLine = refund.reason
    ? `<p style="margin: 4px 0;"><strong>Reason:</strong> ${refund.reason}</p>`
    : ''

  const statusLabel =
    phase === 'requested' ? 'Pending review' :
    phase === 'rejected' ? 'Rejected' :
    'Refunded'

  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #111827; background-color: #f3f4f6; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); overflow: hidden;">
          <div style="padding: 20px 24px; border-bottom: 1px solid #e5e7eb; background: #111827; color: #f9fafb;">
            <h1 style="margin: 0; font-size: 20px;">${highlight}</h1>
          </div>
          <div style="padding: 24px;">
            <p style="margin: 0 0 12px 0; font-size: 15px;">Hi <strong>${customerName}</strong>,</p>
            <p style="margin: 0 0 16px 0; font-size: 15px;">${intro}</p>
            <div style="margin: 16px 0; padding: 12px 16px; background: #f9fafb; border-radius: 6px; border: 1px solid #e5e7eb;">
              <p style="margin: 4px 0;"><strong>Order ID:</strong> ${order.id}</p>
              <p style="margin: 4px 0;"><strong>Amount:</strong> ₦${(amount || 0).toLocaleString()}</p>
              <p style="margin: 4px 0;"><strong>Status:</strong> ${statusLabel}</p>
              ${reasonLine}
            </div>
            <p style="margin: 16px 0 0 0; font-size: 14px; color: #4b5563;">
              You can view your order details and refund status any time from your
              <a href="${APP_URL}/orders" style="color: #2563eb; text-decoration: underline;">orders page</a>.
            </p>
          </div>
          <div style="padding: 16px 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #6b7280; background: #f9fafb;">
            <p style="margin: 4px 0;">If you have any questions, reply to this email or contact <a href="mailto:${SUPPORT_EMAIL}" style="color: #2563eb;">${SUPPORT_EMAIL}</a>.</p>
            <p style="margin: 4px 0;">© 2025 FEROMARKETHUB</p>
          </div>
        </div>
      </body>
    </html>
  `

  return sendEmail({
    from: FROM_EMAIL,
    to: order.userEmail || order.shippingAddress?.email || 'customer@example.com',
    subject,
    html,
  })
}

export async function sendRefundRequestedEmail(order: any, refund: BasicRefund) {
  try {
    return await sendRefundEmail(order, refund, 'requested')
  } catch (error) {
    console.error('Failed to send refund requested email:', error)
    throw error
  }
}

export async function sendRefundRejectedEmail(order: any, refund: BasicRefund) {
  try {
    return await sendRefundEmail(order, refund, 'rejected')
  } catch (error) {
    console.error('Failed to send refund rejected email:', error)
    throw error
  }
}

export async function sendRefundProcessedEmail(order: any, refund: BasicRefund) {
  try {
    return await sendRefundEmail(order, refund, 'processed')
  } catch (error) {
    console.error('Failed to send refund processed email:', error)
    throw error
  }
}

import type { Order, PurchasedProduct, SecureDownloadLink, PayoutRequest } from '@/lib/types'
import { sendEmail } from './send-email'

const FROM_EMAIL = 'FEROMARKETHUB <orders@FEROMARKETHUB.com>' // Can be overridden via SMTP/Resend config
const SUPPORT_EMAIL = 'support@FEROMARKETHUB.com'
const SUPPORT_PHONE = '+234-800-MARKET'

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
            <p style="margin: 5px 0;"><strong>&copy; 2025 FEROMARKETHUB. All rights reserved.</strong></p>
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
            <p style="margin: 4px 0;">&copy; 2025 FEROMARKETHUB</p>
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
            <p style="margin: 4px 0;">&copy; 2025 FEROMARKETHUB</p>
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
            <p style="margin: 4px 0;">&copy; 2025 FEROMARKETHUB</p>
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

// ============================================
// SUPPORT TICKET EMAILS
// ============================================
export async function sendSupportTicketCreatedEmail(ticket: {
  ticketNumber: string
  customerName: string
  customerEmail: string
  subject: string
  category: string
  message: string
}) {
  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #111827; background-color: #f3f4f6; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); overflow: hidden;">
          <div style="padding: 20px 24px; border-bottom: 1px solid #e5e7eb; background: #111827; color: #f9fafb;">
            <h1 style="margin: 0; font-size: 20px;">Support Ticket Created</h1>
          </div>
          <div style="padding: 24px;">
            <p style="margin: 0 0 12px 0; font-size: 15px;">Hi <strong>${ticket.customerName}</strong>,</p>
            <p style="margin: 0 0 16px 0; font-size: 15px;">
              Thank you for contacting FEROMARKETHUB support. We've received your request and created a support ticket for you.
            </p>
            <div style="margin: 16px 0; padding: 12px 16px; background: #f9fafb; border-radius: 6px; border: 1px solid #e5e7eb;">
              <p style="margin: 4px 0;"><strong>Ticket Number:</strong> ${ticket.ticketNumber}</p>
              <p style="margin: 4px 0;"><strong>Subject:</strong> ${ticket.subject}</p>
              <p style="margin: 4px 0;"><strong>Category:</strong> ${ticket.category}</p>
              <p style="margin: 4px 0;"><strong>Status:</strong> Open</p>
            </div>
            <div style="margin: 16px 0; padding: 12px 16px; background: #f0f9ff; border-radius: 6px; border: 1px solid #bae6fd;">
              <p style="margin: 4px 0; color: #0369a1;"><strong>What happens next?</strong></p>
              <ul style="margin: 8px 0; padding-left: 20px; color: #0369a1;">
                <li>Our support team will review your request</li>
                <li>You'll receive a response within 24 hours</li>
                <li>We'll keep you updated on the progress</li>
                <li>You can reply to this email to add more information</li>
              </ul>
            </div>
            <p style="margin: 16px 0 0 0; font-size: 14px; color: #4b5563;">
              You can track your ticket status by replying to this email with your ticket number: <strong>${ticket.ticketNumber}</strong>
            </p>
          </div>
          <div style="padding: 16px 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #6b7280; background: #f9fafb;">
            <p style="margin: 4px 0;">Need immediate help? Contact us at <a href="mailto:${SUPPORT_EMAIL}" style="color: #2563eb;">${SUPPORT_EMAIL}</a> or call ${SUPPORT_PHONE}.</p>
            <p style="margin: 4px 0;">&copy; 2025 FEROMARKETHUB</p>
          </div>
        </div>
      </body>
    </html>
  `

  return sendEmail({
    from: FROM_EMAIL,
    to: ticket.customerEmail,
    subject: `Support Ticket Created - ${ticket.ticketNumber}`,
    html,
  })
}

export async function sendSupportTicketNotificationEmail(ticket: {
  ticketId: string
  ticketNumber: string
  customerName: string
  customerEmail: string
  subject: string
  category: string
  message: string
  priority: string
}) {
  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #111827; background-color: #f3f4f6; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); overflow: hidden;">
          <div style="padding: 20px 24px; border-bottom: 1px solid #e5e7eb; background: #dc2626; color: #ffffff;">
            <h1 style="margin: 0; font-size: 20px;">🎫 New Support Ticket</h1>
          </div>
          <div style="padding: 24px;">
            <p style="margin: 0 0 16px 0; font-size: 15px;">
              A new support ticket has been created and requires attention.
            </p>
            <div style="margin: 16px 0; padding: 12px 16px; background: #f9fafb; border-radius: 6px; border: 1px solid #e5e7eb;">
              <p style="margin: 4px 0;"><strong>Ticket:</strong> ${ticket.ticketNumber}</p>
              <p style="margin: 4px 0;"><strong>Customer:</strong> ${ticket.customerName} (${ticket.customerEmail})</p>
              <p style="margin: 4px 0;"><strong>Subject:</strong> ${ticket.subject}</p>
              <p style="margin: 4px 0;"><strong>Category:</strong> ${ticket.category}</p>
              <p style="margin: 4px 0;"><strong>Priority:</strong> <span style="color: ${ticket.priority === 'high' ? '#dc2626' : ticket.priority === 'medium' ? '#d97706' : '#059669'};">${ticket.priority.toUpperCase()}</span></p>
            </div>
            <div style="margin: 16px 0; padding: 12px 16px; background: #f8fafc; border-radius: 6px; border-left: 4px solid #3b82f6;">
              <p style="margin: 0; font-weight: 600; color: #1e40af;">Customer Message:</p>
              <p style="margin: 8px 0 0 0; color: #374151;">${ticket.message}</p>
            </div>
            <div style="margin: 24px 0; text-align: center;">
              <a href="${APP_URL}/support/tickets/${ticket.ticketId}" 
                 style="display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">
                View Ticket
              </a>
            </div>
          </div>
          <div style="padding: 16px 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #6b7280; background: #f9fafb;">
            <p style="margin: 4px 0;">FEROMARKETHUB Support System</p>
          </div>
        </div>
      </body>
    </html>
  `

  // Send to all admin emails
  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [SUPPORT_EMAIL]
  
  for (const adminEmail of adminEmails) {
    try {
      await sendEmail({
        from: FROM_EMAIL,
        to: adminEmail.trim(),
        subject: `🎫 New Support Ticket: ${ticket.subject} [${ticket.ticketNumber}]`,
        html,
      })
    } catch (error) {
      console.error(`Failed to send notification to ${adminEmail}:`, error)
    }
  }
}

export async function sendSupportTicketResponseEmail(data: {
  ticketNumber: string
  customerName: string
  customerEmail: string
  subject: string
  response: string
  responderName: string
}) {
  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #111827; background-color: #f3f4f6; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); overflow: hidden;">
          <div style="padding: 20px 24px; border-bottom: 1px solid #e5e7eb; background: #059669; color: #ffffff;">
            <h1 style="margin: 0; font-size: 20px;">Support Team Response</h1>
          </div>
          <div style="padding: 24px;">
            <p style="margin: 0 0 12px 0; font-size: 15px;">Hi <strong>${data.customerName}</strong>,</p>
            <p style="margin: 0 0 16px 0; font-size: 15px;">
              Our support team has responded to your ticket <strong>${data.ticketNumber}</strong>.
            </p>
            <div style="margin: 16px 0; padding: 12px 16px; background: #f0f9ff; border-radius: 6px; border-left: 4px solid #2563eb;">
              <p style="margin: 0 0 8px 0; font-weight: 600; color: #1e40af;">Response from ${data.responderName}:</p>
              <p style="margin: 0; color: #374151; white-space: pre-wrap;">${data.response}</p>
            </div>
            <div style="margin: 24px 0; text-align: center;">
              <p style="margin: 0 0 16px 0; font-size: 14px; color: #4b5563;">
                Need to add more information? Simply reply to this email.
              </p>
            </div>
          </div>
          <div style="padding: 16px 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #6b7280; background: #f9fafb;">
            <p style="margin: 4px 0;">Questions? Contact us at <a href="mailto:${SUPPORT_EMAIL}" style="color: #2563eb;">${SUPPORT_EMAIL}</a></p>
            <p style="margin: 4px 0;">&copy; 2025 FEROMARKETHUB</p>
          </div>
        </div>
      </body>
    </html>
  `

  return sendEmail({
    from: FROM_EMAIL,
    to: data.customerEmail,
    subject: `Re: ${data.subject} [${data.ticketNumber}]`,
    html,
  })
}

export async function sendSupportTicketResolvedEmail(data: {
  ticketNumber: string
  customerName: string
  customerEmail: string
  subject: string
  resolutionSummary?: string
}) {
  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #111827; background-color: #f3f4f6; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); overflow: hidden;">
          <div style="padding: 20px 24px; border-bottom: 1px solid #e5e7eb; background: #059669; color: #ffffff;">
            <h1 style="margin: 0; font-size: 20px;">✅ Ticket Resolved</h1>
          </div>
          <div style="padding: 24px;">
            <p style="margin: 0 0 12px 0; font-size: 15px;">Hi <strong>${data.customerName}</strong>,</p>
            <p style="margin: 0 0 16px 0; font-size: 15px;">
              Great news! Your support ticket <strong>${data.ticketNumber}</strong> has been resolved.
            </p>
            ${data.resolutionSummary ? `
            <div style="margin: 16px 0; padding: 12px 16px; background: #f0fdf4; border-radius: 6px; border-left: 4px solid #059669;">
              <p style="margin: 0 0 8px 0; font-weight: 600; color: #047857;">Resolution Summary:</p>
              <p style="margin: 0; color: #374151;">${data.resolutionSummary}</p>
            </div>
            ` : ''}
            <div style="margin: 24px 0; text-align: center;">
              <p style="margin: 0 0 16px 0; font-size: 14px; color: #4b5563;">
                How was our support? Please rate your experience:
              </p>
              <div style="margin: 16px 0;">
                <a href="${APP_URL}/support/feedback?ticket=${data.ticketNumber}&rating=5" style="display: inline-block; margin: 0 4px; padding: 8px 12px; background: #059669; color: white; text-decoration: none; border-radius: 4px; font-size: 12px;">⭐⭐⭐⭐⭐ Excellent</a>
                <a href="${APP_URL}/support/feedback?ticket=${data.ticketNumber}&rating=4" style="display: inline-block; margin: 0 4px; padding: 8px 12px; background: #0891b2; color: white; text-decoration: none; border-radius: 4px; font-size: 12px;">⭐⭐⭐⭐ Good</a>
                <a href="${APP_URL}/support/feedback?ticket=${data.ticketNumber}&rating=3" style="display: inline-block; margin: 0 4px; padding: 8px 12px; background: #d97706; color: white; text-decoration: none; border-radius: 4px; font-size: 12px;">⭐⭐⭐ Average</a>
              </div>
            </div>
          </div>
          <div style="padding: 16px 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #6b7280; background: #f9fafb;">
            <p style="margin: 4px 0;">Still need help? Contact us at <a href="mailto:${SUPPORT_EMAIL}" style="color: #2563eb;">${SUPPORT_EMAIL}</a></p>
            <p style="margin: 4px 0;">&copy; 2025 FEROMARKETHUB</p>
          </div>
        </div>
      </body>
    </html>
  `

  return sendEmail({
    from: FROM_EMAIL,
    to: data.customerEmail,
    subject: `✅ Resolved: ${data.subject} [${data.ticketNumber}]`,
    html,
  })
}
export async function sendVendorApplicationSubmittedEmail(
  vendorEmail: string,
  payload: { vendorName?: string; storeName: string; category?: string; storeUrl?: string }
) {
  const name = payload.vendorName || (vendorEmail.split('@')[0] || 'Vendor')
  const html = `<!DOCTYPE html><html><body style="font-family: Arial, sans-serif; line-height:1.6; color:#111827;">
    <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb">
      <div style="padding:20px;background:#111827;color:#f9fafb"><h1 style="margin:0;font-size:20px;">Application Received</h1></div>
      <div style="padding:24px">
        <p>Hi <strong>${name}</strong>,</p>
        <p>Thanks for applying to become a vendor on FEROMARKETHUB. Your application is under review.</p>
        <div style="margin:16px 0;padding:12px 16px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px">
          <p style="margin:4px 0"><strong>Store:</strong> ${payload.storeName}</p>
          ${payload.category ? `<p style="margin:4px 0"><strong>Category:</strong> ${payload.category}</p>` : ''}
          ${payload.storeUrl ? `<p style=\"margin:4px 0\"><strong>URL:</strong> ${APP_URL}/${payload.storeUrl}</p>` : ''}
        </div>
        <p>We'll email you once a decision is made (usually 1–3 business days).</p>
      </div>
      <div style="padding:16px 20px;border-top:1px solid #e5e7eb;text-align:center;font-size:12px;color:#6b7280;background:#f9fafb">&copy; 2025 FEROMARKETHUB</div>
    </div></body></html>`
  return sendEmail({ from: FROM_EMAIL, to: vendorEmail, subject: 'Your vendor application was received', html })
}

export async function sendAdminNewVendorApplicationEmail(
  adminTo: string | string[],
  payload: { vendorEmail: string; vendorName?: string; storeName: string; category?: string; storeUrl?: string }
) {
  const to = Array.isArray(adminTo) ? adminTo : [adminTo]
  const name = payload.vendorName || (payload.vendorEmail.split('@')[0] || 'Vendor')
  const html = `<!DOCTYPE html><html><body style="font-family: Arial, sans-serif; line-height:1.6; color:#111827;">
    <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb">
      <div style="padding:20px;background:#0EA5E9;color:#fff"><h1 style="margin:0;font-size:20px;">New Vendor Application</h1></div>
      <div style="padding:24px">
        <p><strong>${name}</strong> (<a href="mailto:${payload.vendorEmail}">${payload.vendorEmail}</a>) just applied to become a vendor.</p>
        <div style="margin:16px 0;padding:12px 16px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px">
          <p style="margin:4px 0"><strong>Store:</strong> ${payload.storeName}</p>
          ${payload.category ? `<p style=\"margin:4px 0\"><strong>Category:</strong> ${payload.category}</p>` : ''}
          ${payload.storeUrl ? `<p style=\"margin:4px 0\"><strong>URL:</strong> ${APP_URL}/${payload.storeUrl}</p>` : ''}
        </div>
        <p>Approve or reject from the admin dashboard.</p>
      </div>
    </div></body></html>`
  for (const addr of to) {
    if (addr && addr.includes('@')) {
      try {
        await sendEmail({ from: FROM_EMAIL, to: addr, subject: 'New vendor application received', html })
      } catch {}
    }
  }
  return { success: true }
}

export async function sendVendorApplicationDecisionEmail(
  vendorEmail: string,
  decision: 'approved' | 'rejected',
  storeName?: string,
  reason?: string
) {
  const subject = decision === 'approved' ? 'Your vendor application was approved' : 'Your vendor application was rejected'
  const body = decision === 'approved'
    ? `<p>Great news! Your vendor application${storeName ? ` for <strong>${storeName}</strong>` : ''} has been approved. You can now access your vendor dashboard and start adding products.</p>
       <p><a href="${APP_URL}/vendor/dashboard" style="display:inline-block;background:#10b981;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">Open Vendor Dashboard</a></p>`
    : `<p>We’re sorry—your vendor application${storeName ? ` for <strong>${storeName}</strong>` : ''} was not approved at this time.</p>
       ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
       <p>You can reply to this email if you have questions.</p>`
  const html = `<!DOCTYPE html><html><body style="font-family: Arial, sans-serif; line-height:1.6; color:#111827;"><div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb"><div style="padding:20px;background:#111827;color:#f9fafb"><h1 style="margin:0;font-size:20px;">Vendor Application Update</h1></div><div style="padding:24px">${body}</div></div></body></html>`
  return sendEmail({ from: FROM_EMAIL, to: vendorEmail, subject, html })
}

// ============================================
// ABUSE REPORT EMAILS
// ============================================

export async function sendAbuseReportSubmittedEmail(
  reporterEmail: string,
  payload: {
    reporterName: string;
    reportType: string;
    reportedItemTitle: string;
    reportId: string;
    category: string;
    reason: string;
  }
) {
  const html = `<!DOCTYPE html><html><body style="font-family: Arial, sans-serif; line-height:1.6; color:#111827;">
    <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb">
      <div style="padding:20px;background:#dc2626;color:#fff">
        <h1 style="margin:0;font-size:20px;">🚨 Report Submitted</h1>
      </div>
      <div style="padding:24px">
        <p>Dear ${payload.reporterName},</p>
        
        <p>Thank you for reporting inappropriate content on FEROMARKETHUB. We take all reports seriously and will investigate this matter promptly.</p>
        
        <div style="background:#f3f4f6;padding:16px;border-radius:6px;margin:16px 0">
          <h3 style="margin:0 0 8px 0;color:#374151">Report Details:</h3>
          <p style="margin:4px 0"><strong>Report ID:</strong> ${payload.reportId}</p>
          <p style="margin:4px 0"><strong>Type:</strong> ${payload.reportType}</p>
          <p style="margin:4px 0"><strong>Item:</strong> ${payload.reportedItemTitle}</p>
          <p style="margin:4px 0"><strong>Category:</strong> ${payload.category}</p>
          <p style="margin:4px 0"><strong>Reason:</strong> ${payload.reason}</p>
        </div>
        
        <p><strong>What happens next?</strong></p>
        <ul>
          <li>Our moderation team will review your report within 24-48 hours</li>
          <li>We'll investigate the reported content thoroughly</li>
          <li>You'll receive an email update when we've made a decision</li>
          <li>If appropriate action is needed, we'll take it to maintain platform safety</li>
        </ul>
        
        <p>You can track the status of your report by visiting your account dashboard:</p>
        <div style="text-align:center;margin:20px 0">
          <a href="${APP_URL}/account/reports" style="background:#dc2626;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block">View My Reports</a>
        </div>
        
        <p style="color:#6b7280;font-size:14px">
          <strong>Note:</strong> False reports may result in account restrictions. We appreciate your help in keeping FEROMARKETHUB safe for everyone.
        </p>
        
        <p>Best regards,<br>FEROMARKETHUB Safety Team</p>
      </div>
    </div>
  </body></html>`

  return sendEmail({
    to: reporterEmail,
    subject: `Report Submitted - ${payload.reportType} Report #${payload.reportId}`,
    html
  })
}

export async function sendAbuseReportNotificationEmail(
  reportedUserEmail: string,
  payload: {
    reportedUserName: string;
    reportType: string;
    reportedItemTitle: string;
    reportId: string;
    category: string;
  }
) {
  const html = `<!DOCTYPE html><html><body style="font-family: Arial, sans-serif; line-line:1.6; color:#111827;">
    <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb">
      <div style="padding:20px;background:#f59e0b;color:#fff">
        <h1 style="margin:0;font-size:20px;">⚠️ Content Report Notification</h1>
      </div>
      <div style="padding:24px">
        <p>Dear ${payload.reportedUserName},</p>
        
        <p>We're writing to inform you that content associated with your account has been reported by another user on FEROMARKETHUB.</p>
        
        <div style="background:#fef3c7;padding:16px;border-radius:6px;margin:16px 0;border-left:4px solid #f59e0b">
          <h3 style="margin:0 0 8px 0;color:#92400e">Reported Content:</h3>
          <p style="margin:4px 0"><strong>Type:</strong> ${payload.reportType}</p>
          <p style="margin:4px 0"><strong>Item:</strong> ${payload.reportedItemTitle}</p>
          <p style="margin:4px 0"><strong>Category:</strong> ${payload.category}</p>
          <p style="margin:4px 0"><strong>Report ID:</strong> ${payload.reportId}</p>
        </div>
        
        <p><strong>What this means:</strong></p>
        <ul>
          <li>Our moderation team will review the reported content</li>
          <li>No immediate action has been taken against your account</li>
          <li>If the report is found to be valid, we may take appropriate action</li>
          <li>You'll be notified of any decisions that affect your account</li>
        </ul>
        
        <p><strong>Our commitment:</strong></p>
        <p>We investigate all reports fairly and thoroughly. If you believe this report was made in error, our review process will determine that. We're committed to maintaining a safe and fair marketplace for all users.</p>
        
        <p>If you have questions about our community guidelines or this notification, please don't hesitate to contact our support team.</p>
        
        <div style="text-align:center;margin:20px 0">
          <a href="${APP_URL}/contact" style="background:#f59e0b;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block">Contact Support</a>
        </div>
        
        <p>Best regards,<br>FEROMARKETHUB Safety Team</p>
      </div>
    </div>
  </body></html>`

  return sendEmail({
    to: reportedUserEmail,
    subject: `Content Report Notification - Report #${payload.reportId}`,
    html
  })
}

export async function sendAbuseReportAdminEmail(
  adminEmails: string[],
  payload: {
    reporterName: string;
    reporterEmail: string;
    reportType: string;
    reportedItemTitle: string;
    reportId: string;
    category: string;
    reason: string;
    priority: string;
    description?: string;
  }
) {
  const priorityColor = payload.priority === 'critical' ? '#dc2626' : 
                       payload.priority === 'high' ? '#ea580c' :
                       payload.priority === 'medium' ? '#d97706' : '#16a34a'

  const html = `<!DOCTYPE html><html><body style="font-family: Arial, sans-serif; line-height:1.6; color:#111827;">
    <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb">
      <div style="padding:20px;background:${priorityColor};color:#fff">
        <h1 style="margin:0;font-size:20px;">🚨 New Abuse Report - ${payload.priority.toUpperCase()} Priority</h1>
      </div>
      <div style="padding:24px">
        <p><strong>A new abuse report has been submitted and requires admin attention.</strong></p>
        
        <div style="background:#f3f4f6;padding:16px;border-radius:6px;margin:16px 0">
          <h3 style="margin:0 0 12px 0;color:#374151">Report Details:</h3>
          <div style="display:grid;gap:8px">
            <p style="margin:0"><strong>Report ID:</strong> ${payload.reportId}</p>
            <p style="margin:0"><strong>Priority:</strong> <span style="color:${priorityColor};font-weight:bold">${payload.priority.toUpperCase()}</span></p>
            <p style="margin:0"><strong>Type:</strong> ${payload.reportType}</p>
            <p style="margin:0"><strong>Reported Item:</strong> ${payload.reportedItemTitle}</p>
            <p style="margin:0"><strong>Category:</strong> ${payload.category}</p>
            <p style="margin:0"><strong>Reason:</strong> ${payload.reason}</p>
          </div>
        </div>
        
        <div style="background:#fef3c7;padding:16px;border-radius:6px;margin:16px 0">
          <h3 style="margin:0 0 8px 0;color:#92400e">Reporter Information:</h3>
          <p style="margin:4px 0"><strong>Name:</strong> ${payload.reporterName}</p>
          <p style="margin:4px 0"><strong>Email:</strong> ${payload.reporterEmail}</p>
        </div>
        
        ${payload.description ? `
        <div style="background:#eff6ff;padding:16px;border-radius:6px;margin:16px 0">
          <h3 style="margin:0 0 8px 0;color:#1e40af">Additional Details:</h3>
          <p style="margin:0">${payload.description}</p>
        </div>
        ` : ''}
        
        <p><strong>Required Action:</strong></p>
        <p>Please review this report in the admin panel and take appropriate action. ${payload.priority === 'critical' || payload.priority === 'high' ? 'This report has been marked as high priority and should be addressed promptly.' : ''}</p>
        
        <div style="text-align:center;margin:20px 0">
          <a href="${APP_URL}/admin/reports-abuse" style="background:${priorityColor};color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block">Review Report</a>
        </div>
        
        <p style="color:#6b7280;font-size:14px">
          This email was sent to all administrators and moderators. Please coordinate to avoid duplicate actions.
        </p>
      </div>
    </div>
  </body></html>`

  // Send individual emails to each admin
  const emailPromises = adminEmails.map(email => 
    sendEmail({
      to: email,
      subject: `[${payload.priority.toUpperCase()}] New Abuse Report #${payload.reportId} - ${payload.reportType}`,
      html
    })
  )

  return Promise.all(emailPromises)
}

export async function sendAbuseReportStatusUpdateEmail(
  reporterEmail: string,
  payload: {
    reporterName: string;
    reportType: string;
    reportedItemTitle: string;
    reportId: string;
    status: string;
    resolution?: string;
  }
) {
  const statusColor = payload.status === 'resolved' ? '#16a34a' : 
                     payload.status === 'dismissed' ? '#6b7280' : '#2563eb'
  
  const statusIcon = payload.status === 'resolved' ? '✅' : 
                    payload.status === 'dismissed' ? '❌' : '🔍'

  const html = `<!DOCTYPE html><html><body style="font-family: Arial, sans-serif; line-height:1.6; color:#111827;">
    <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb">
      <div style="padding:20px;background:${statusColor};color:#fff">
        <h1 style="margin:0;font-size:20px;">${statusIcon} Report ${payload.status.charAt(0).toUpperCase() + payload.status.slice(1)}</h1>
      </div>
      <div style="padding:24px">
        <p>Dear ${payload.reporterName},</p>
        
        <p>We have an update on the abuse report you submitted to FEROMARKETHUB.</p>
        
        <div style="background:#f3f4f6;padding:16px;border-radius:6px;margin:16px 0">
          <h3 style="margin:0 0 8px 0;color:#374151">Report Update:</h3>
          <p style="margin:4px 0"><strong>Report ID:</strong> ${payload.reportId}</p>
          <p style="margin:4px 0"><strong>Reported Item:</strong> ${payload.reportedItemTitle}</p>
          <p style="margin:4px 0"><strong>Status:</strong> <span style="color:${statusColor};font-weight:bold">${payload.status.toUpperCase()}</span></p>
        </div>
        
        ${payload.resolution ? `
        <div style="background:#eff6ff;padding:16px;border-radius:6px;margin:16px 0">
          <h3 style="margin:0 0 8px 0;color:#1e40af">Resolution Details:</h3>
          <p style="margin:0">${payload.resolution}</p>
        </div>
        ` : ''}
        
        ${payload.status === 'resolved' ? `
        <p><strong>Thank you for your report!</strong> Our investigation found that action was warranted, and we've taken appropriate measures to address the issue. Your vigilance helps keep FEROMARKETHUB safe for everyone.</p>
        ` : payload.status === 'dismissed' ? `
        <p><strong>Report Conclusion:</strong> After thorough investigation, we determined that no policy violation occurred. We appreciate you taking the time to report your concerns - it's better to report something that turns out to be fine than to let actual violations go unreported.</p>
        ` : `
        <p><strong>Investigation Update:</strong> Our team is actively investigating your report. We'll keep you updated as we make progress.</p>
        `}
        
        <p>You can view all your reports and their status in your account dashboard:</p>
        <div style="text-align:center;margin:20px 0">
          <a href="${APP_URL}/account/reports" style="background:${statusColor};color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block">View My Reports</a>
        </div>
        
        <p>If you have any questions about this decision or need to report additional concerns, please don't hesitate to contact our support team.</p>
        
        <p>Best regards,<br>FEROMARKETHUB Safety Team</p>
      </div>
    </div>
  </body></html>`

  return sendEmail({
    to: reporterEmail,
    subject: `Report Update - ${payload.status.charAt(0).toUpperCase() + payload.status.slice(1)} #${payload.reportId}`,
    html
  })
}

// PAYOUT REQUEST EMAILS
// ============================================

export async function sendPayoutRequestSubmittedEmail(
  vendorEmail: string,
  payload: {
    vendorName: string;
    amount: number;
    paymentMethod: string;
    payoutId: string;
    requestedAt: Date;
  }
) {
  const html = `<!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payout Request Submitted</title>
  </head>
  <body style="font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px">
    <div style="background:#f8f9fa;padding:20px;border-radius:8px;margin-bottom:20px">
      <h1 style="color:#10b981;margin:0;font-size:24px">💰 Payout Request Submitted</h1>
      <p style="margin:10px 0 0 0;color:#6b7280">Your withdrawal request is being processed</p>
    </div>
    
    <div style="background:white;padding:20px;border-radius:8px;border:1px solid #e5e7eb">
      <p>Hi <strong>${payload.vendorName}</strong>,</p>
      
      <p>We've received your payout request and it's now being reviewed by our team.</p>
      
      <div style="background:#f0f9ff;padding:15px;border-radius:6px;margin:20px 0;border-left:4px solid #0ea5e9">
        <h3 style="color:#0c4a6e;margin:0 0 10px 0">Request Details</h3>
        <div style="margin-bottom:8px"><strong>Amount:</strong> ₦${payload.amount.toLocaleString()}</div>
        <div style="margin-bottom:8px"><strong>Payment Method:</strong> ${payload.paymentMethod.replace('_', ' ').toUpperCase()}</div>
        <div style="margin-bottom:8px"><strong>Request ID:</strong> #${payload.payoutId}</div>
        <div style="margin-bottom:8px"><strong>Requested:</strong> ${payload.requestedAt.toLocaleDateString()}</div>
      </div>
      
      <div style="background:#fef3c7;padding:15px;border-radius:6px;margin:20px 0;border-left:4px solid #f59e0b">
        <h3 style="color:#92400e;margin:0 0 10px 0">What happens next?</h3>
        <ul style="margin:0;padding-left:20px;color:#92400e">
          <li>Our team will review your request (usually within 1-2 business days)</li>
          <li>You'll receive an email notification once approved</li>
          <li>Funds will be transferred to your selected payment method</li>
          <li>You'll get a confirmation email with transaction details</li>
        </ul>
      </div>
      
      <div style="text-align:center;margin:30px 0">
        <a href="${APP_URL}/vendor/payouts" 
           style="background:#10b981;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block">
          View Payout Status
        </a>
      </div>
      
      <p style="color:#6b7280;font-size:14px">
        If you have any questions about your payout request, please contact our support team at 
        <a href="mailto:${SUPPORT_EMAIL}" style="color:#10b981">${SUPPORT_EMAIL}</a>.
      </p>
    </div>
  </body></html>`

  return sendEmail({
    to: vendorEmail,
    subject: `Payout Request Submitted - ₦${payload.amount.toLocaleString()} #${payload.payoutId}`,
    html
  })
}

export async function sendPayoutRequestAdminEmail(
  adminEmails: string[],
  payload: {
    vendorName: string;
    vendorEmail: string;
    amount: number;
    paymentMethod: string;
    payoutId: string;
    requestedAt: Date;
  }
) {
  const html = `<!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Payout Request</title>
  </head>
  <body style="font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px">
    <div style="background:#f8f9fa;padding:20px;border-radius:8px;margin-bottom:20px">
      <h1 style="color:#dc2626;margin:0;font-size:24px">💰 New Payout Request</h1>
      <p style="margin:10px 0 0 0;color:#6b7280">Requires admin approval</p>
    </div>
    
    <div style="background:white;padding:20px;border-radius:8px;border:1px solid #e5e7eb">
      <h2 style="color:#374151;margin-top:0">Payout Request Details</h2>
      
      <div style="background:#f9fafb;padding:15px;border-radius:6px;margin:15px 0">
        <div style="margin-bottom:10px"><strong>Vendor:</strong> ${payload.vendorName} (${payload.vendorEmail})</div>
        <div style="margin-bottom:10px"><strong>Amount:</strong> ₦${payload.amount.toLocaleString()}</div>
        <div style="margin-bottom:10px"><strong>Payment Method:</strong> ${payload.paymentMethod.replace('_', ' ').toUpperCase()}</div>
        <div style="margin-bottom:10px"><strong>Request ID:</strong> #${payload.payoutId}</div>
        <div style="margin-bottom:10px"><strong>Requested:</strong> ${payload.requestedAt.toLocaleDateString()} at ${payload.requestedAt.toLocaleTimeString()}</div>
      </div>
      
      <div style="background:#fef3c7;padding:15px;border-radius:6px;margin:20px 0;border-left:4px solid #f59e0b">
        <h3 style="color:#92400e;margin:0 0 10px 0">Action Required</h3>
        <p style="margin:0;color:#92400e">
          Please review this payout request and approve or reject it from the admin panel.
        </p>
      </div>
      
      <div style="text-align:center;margin:30px 0">
        <a href="${APP_URL}/admin/payouts" 
           style="background:#dc2626;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block">
          Review Payout Request
        </a>
      </div>
      
      <div style="margin-top:20px;padding-top:20px;border-top:1px solid #e5e7eb">
        <p style="color:#6b7280;font-size:14px">
          This email was sent to all administrators. Please coordinate to avoid duplicate actions.
        </p>
      </div>
    </div>
  </body></html>`

  // Send individual emails to each admin
  const emailPromises = adminEmails.map(email => 
    sendEmail({
      to: email,
      subject: `New Payout Request - ₦${payload.amount.toLocaleString()} from ${payload.vendorName}`,
      html
    })
  )

  return Promise.all(emailPromises)
}
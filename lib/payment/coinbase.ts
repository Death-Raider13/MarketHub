/**
 * Coinbase Commerce Integration
 * Handles cryptocurrency payments via Coinbase Commerce API
 */

const COINBASE_API_URL = 'https://api.commerce.coinbase.com'

export interface CoinbaseChargeData {
  orderId: string
  amount: number // Amount in NGN
  customerEmail: string
  customerName: string
  description?: string
  metadata?: Record<string, any>
}

export interface CoinbaseCharge {
  id: string
  code: string
  name: string
  description: string
  hosted_url: string
  created_at: string
  expires_at: string
  pricing: {
    local: { amount: string; currency: string }
    bitcoin?: { amount: string; currency: string }
    ethereum?: { amount: string; currency: string }
    usdc?: { amount: string; currency: string }
    dai?: { amount: string; currency: string }
  }
  payments: any[]
  timeline: any[]
}

export interface CoinbaseWebhookEvent {
  id: string
  type: string
  api_version: string
  created_at: string
  data: {
    id: string
    code: string
    name: string
    description: string
    hosted_url: string
    created_at: string
    expires_at: string
    confirmed_at?: string
    pricing: any
    payments: any[]
    metadata: Record<string, any>
    timeline: Array<{
      time: string
      status: string
      context?: string
    }>
  }
}

/**
 * Create a new Coinbase Commerce charge
 */
export async function createCoinbaseCharge(data: CoinbaseChargeData): Promise<CoinbaseCharge> {
  const apiKey = process.env.COINBASE_COMMERCE_API_KEY
  
  if (!apiKey) {
    throw new Error('COINBASE_COMMERCE_API_KEY is not configured')
  }

  // Convert NGN to USD for Coinbase (approximate rate - you may want to use a live rate)
  // Coinbase Commerce works better with USD pricing
  const NGN_TO_USD_RATE = 0.00065 // Approximate rate, update as needed
  const amountUSD = (data.amount * NGN_TO_USD_RATE).toFixed(2)

  const chargeData = {
    name: `Order #${data.orderId.substring(0, 8).toUpperCase()}`,
    description: data.description || `Payment for order ${data.orderId}`,
    pricing_type: 'fixed_price',
    local_price: {
      amount: amountUSD,
      currency: 'USD'
    },
    metadata: {
      order_id: data.orderId,
      customer_email: data.customerEmail,
      customer_name: data.customerName,
      original_amount_ngn: data.amount.toString(),
      ...data.metadata
    },
    redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout?payment=success&orderId=${data.orderId}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout?payment=cancelled&orderId=${data.orderId}`
  }

  const response = await fetch(`${COINBASE_API_URL}/charges`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CC-Api-Key': apiKey,
      'X-CC-Version': '2018-03-22'
    },
    body: JSON.stringify(chargeData)
  })

  if (!response.ok) {
    const error = await response.json()
    console.error('Coinbase charge creation failed:', error)
    throw new Error(error.error?.message || 'Failed to create Coinbase charge')
  }

  const result = await response.json()
  return result.data as CoinbaseCharge
}

/**
 * Get charge details from Coinbase Commerce
 */
export async function getCoinbaseCharge(chargeId: string): Promise<CoinbaseCharge> {
  const apiKey = process.env.COINBASE_COMMERCE_API_KEY
  
  if (!apiKey) {
    throw new Error('COINBASE_COMMERCE_API_KEY is not configured')
  }

  const response = await fetch(`${COINBASE_API_URL}/charges/${chargeId}`, {
    method: 'GET',
    headers: {
      'X-CC-Api-Key': apiKey,
      'X-CC-Version': '2018-03-22'
    }
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || 'Failed to get charge details')
  }

  const result = await response.json()
  return result.data as CoinbaseCharge
}

/**
 * Verify Coinbase webhook signature
 */
export function verifyCoinbaseWebhook(
  payload: string,
  signature: string,
  webhookSecret: string
): boolean {
  if (!webhookSecret) {
    console.warn('COINBASE_COMMERCE_WEBHOOK_SECRET not set - skipping signature verification')
    return true // Allow in development without secret
  }

  const crypto = require('crypto')
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(payload)
    .digest('hex')

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}

/**
 * Get payment status from charge timeline
 */
export function getChargeStatus(charge: CoinbaseCharge): {
  status: 'pending' | 'completed' | 'expired' | 'cancelled' | 'unresolved'
  confirmedAt?: string
} {
  const timeline = charge.timeline || []
  const latestEvent = timeline[timeline.length - 1]

  if (!latestEvent) {
    return { status: 'pending' }
  }

  switch (latestEvent.status) {
    case 'COMPLETED':
      return { 
        status: 'completed',
        confirmedAt: latestEvent.time
      }
    case 'EXPIRED':
      return { status: 'expired' }
    case 'CANCELED':
      return { status: 'cancelled' }
    case 'UNRESOLVED':
      return { status: 'unresolved' }
    default:
      return { status: 'pending' }
  }
}

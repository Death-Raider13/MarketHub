import { adminDb } from '@/lib/firebase/admin'

export interface PaystackRefundResponse {
  status: boolean
  message: string
  data?: {
    transaction: {
      id: number
      domain: string
      status: string
      reference: string
      amount: number
      message: string
      gateway_response: string
      paid_at: string
      created_at: string
      channel: string
      currency: string
      ip_address: string
      metadata: any
      log: any
      fees: number
      fees_split: any
      authorization: any
      customer: any
      plan: any
      split: any
      order_id: any
      paidAt: string
      createdAt: string
      requested_amount: number
      pos_transaction_data: any
      source: any
      fees_breakdown: any
    }
    integration: number
    deducted_amount: number
    channel: string
    merchant_note: string
    customer_note: string
    status: string
    refunded_by: string
    expected_at: string
    currency: string
    domain: string
    amount: number
    fully_deducted: boolean
    id: number
    createdAt: string
    updatedAt: string
  }
}

export interface RefundRequest {
  transaction: string // Paystack transaction reference
  amount?: number // Amount in kobo (optional - full refund if not specified)
  currency?: string // Default: NGN
  customer_note?: string
  merchant_note?: string
}

export class PaystackRefundService {
  private static readonly BASE_URL = 'https://api.paystack.co'
  private static readonly SECRET_KEY = process.env.PAYSTACK_SECRET_KEY

  private static async makeRequest(endpoint: string, method: 'GET' | 'POST' = 'GET', body?: any) {
    if (!this.SECRET_KEY) {
      throw new Error('Paystack secret key not configured')
    }

    const response = await fetch(`${this.BASE_URL}${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${this.SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.message || `Paystack API error: ${response.status}`)
    }

    return data
  }

  /**
   * Create a refund for a Paystack transaction
   */
  static async createRefund(refundRequest: RefundRequest): Promise<PaystackRefundResponse> {
    try {
      const response = await this.makeRequest('/refund', 'POST', refundRequest)
      return response
    } catch (error) {
      console.error('Paystack refund creation failed:', error)
      throw error
    }
  }

  /**
   * Get refund details by ID
   */
  static async getRefund(refundId: string): Promise<PaystackRefundResponse> {
    try {
      const response = await this.makeRequest(`/refund/${refundId}`)
      return response
    } catch (error) {
      console.error('Failed to fetch Paystack refund:', error)
      throw error
    }
  }

  /**
   * List all refunds with optional filters
   */
  static async listRefunds(params?: {
    reference?: string
    currency?: string
    from?: string
    to?: string
    perPage?: number
    page?: number
  }) {
    try {
      const queryParams = new URLSearchParams()
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            queryParams.append(key, value.toString())
          }
        })
      }

      const endpoint = `/refund${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      const response = await this.makeRequest(endpoint)
      return response
    } catch (error) {
      console.error('Failed to list Paystack refunds:', error)
      throw error
    }
  }

  /**
   * Process a refund for an order in our system
   */
  static async processOrderRefund(orderId: string, refundId: string, adminUserId?: string) {
    try {
      // Get order details
      const orderRef = adminDb.collection('orders').doc(orderId)
      const orderDoc = await orderRef.get()
      
      if (!orderDoc.exists) {
        throw new Error('Order not found')
      }

      const orderData = orderDoc.data()
      
      if (!orderData?.paymentReference) {
        throw new Error('No payment reference found for this order')
      }

      if (orderData.paymentMethod !== 'paystack') {
        throw new Error('Order was not paid via Paystack')
      }

      // Get refund details from our database
      const refundRef = adminDb.collection('refunds').doc(refundId)
      const refundDoc = await refundRef.get()
      
      if (!refundDoc.exists) {
        throw new Error('Refund request not found')
      }

      const refundData = refundDoc.data()
      const refundAmount = refundData?.amount || orderData.totalAmount || 0

      // Create refund with Paystack
      const paystackRefund = await this.createRefund({
        transaction: orderData.paymentReference,
        amount: Math.round(refundAmount * 100), // Convert to kobo
        currency: 'NGN',
        customer_note: `Refund for order ${orderId}`,
        merchant_note: `Refund processed by admin: ${refundData?.reason || 'No reason provided'}`
      })

      if (!paystackRefund.status) {
        throw new Error(paystackRefund.message || 'Paystack refund failed')
      }

      // Update our refund record
      const updateData = {
        status: 'refunded',
        refundedAt: new Date(),
        paystackRefundId: paystackRefund.data?.id,
        paystackRefundReference: paystackRefund.data?.transaction?.reference,
        paystackRefundStatus: paystackRefund.data?.status,
        processedBy: adminUserId || null,
        updatedAt: new Date(),
      }

      await refundRef.update(updateData)

      // Update order status
      await orderRef.update({
        status: 'refunded',
        paymentStatus: 'refunded',
        refundedAt: new Date(),
        updatedAt: new Date(),
      })

      return {
        success: true,
        refund: {
          id: refundId,
          ...refundData,
          ...updateData,
        },
        paystackRefund: paystackRefund.data,
      }

    } catch (error) {
      console.error('Order refund processing failed:', error)
      
      // Update refund status to failed
      try {
        await adminDb.collection('refunds').doc(refundId).update({
          status: 'failed',
          failureReason: error instanceof Error ? error.message : 'Unknown error',
          updatedAt: new Date(),
        })
      } catch (updateError) {
        console.error('Failed to update refund status to failed:', updateError)
      }

      throw error
    }
  }

  /**
   * Verify refund status with Paystack
   */
  static async verifyRefundStatus(paystackRefundId: string, refundId: string) {
    try {
      const paystackRefund = await this.getRefund(paystackRefundId)
      
      if (paystackRefund.status && paystackRefund.data) {
        // Update our refund record with latest status
        await adminDb.collection('refunds').doc(refundId).update({
          paystackRefundStatus: paystackRefund.data.status,
          updatedAt: new Date(),
        })

        return paystackRefund.data
      }

      throw new Error('Invalid refund response from Paystack')
    } catch (error) {
      console.error('Refund verification failed:', error)
      throw error
    }
  }
}
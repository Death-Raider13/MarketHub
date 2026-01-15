import { adminDb } from '@/lib/firebase/admin'

export interface CoinbaseRefundResponse {
  data: {
    id: string
    resource: string
    code: string
    name: string
    description: string
    hosted_url: string
    created_at: string
    updated_at: string
    confirmed_at?: string
    checkout?: {
      id: string
    }
    timeline: Array<{
      time: string
      status: string
      context?: string
    }>
    metadata: Record<string, any>
    pricing_type: string
    pricing: {
      local: { amount: string; currency: string }
      settlement: { amount: string; currency: string }
    }
    payment_threshold: {
      overpayment_absolute_threshold: { amount: string; currency: string }
      overpayment_relative_threshold: string
      underpayment_absolute_threshold: { amount: string; currency: string }
      underpayment_relative_threshold: string
    }
    applied_threshold: {
      overpayment_absolute_threshold: { amount: string; currency: string }
      overpayment_relative_threshold: string
      underpayment_absolute_threshold: { amount: string; currency: string }
      underpayment_relative_threshold: string
    }
    applied_threshold_type: string
    fees: Array<{
      type: string
      amount: { amount: string; currency: string }
    }>
    addresses: Record<string, string>
  }
}

export interface CoinbaseRefundRequest {
  chargeId: string
  reason?: string
  amount?: {
    amount: string
    currency: string
  }
}

export class CoinbaseRefundService {
  private static readonly BASE_URL = 'https://api.commerce.coinbase.com'
  private static readonly API_KEY = process.env.COINBASE_API_KEY

  private static async makeRequest(endpoint: string, method: 'GET' | 'POST' = 'GET', body?: any) {
    if (!this.API_KEY) {
      throw new Error('Coinbase API key not configured')
    }

    const response = await fetch(`${this.BASE_URL}${endpoint}`, {
      method,
      headers: {
        'X-CC-Api-Key': this.API_KEY,
        'X-CC-Version': '2018-03-22',
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error?.message || `Coinbase API error: ${response.status}`)
    }

    return data
  }

  /**
   * Create a refund for a Coinbase charge
   * Note: Coinbase Commerce doesn't have direct refund API, 
   * but we can create a reverse charge or handle manually
   */
  static async createRefund(refundRequest: CoinbaseRefundRequest): Promise<any> {
    try {
      // Coinbase Commerce doesn't have a direct refund API
      // We need to handle this manually or create a reverse transaction
      
      // For now, we'll mark it as a manual refund that needs to be processed
      // In a real implementation, you might:
      // 1. Create a reverse charge
      // 2. Use Coinbase's manual refund process
      // 3. Integrate with Coinbase Pro API for direct transfers

      console.log('Coinbase refund requested:', refundRequest)
      
      // Return a mock response indicating manual processing needed
      return {
        status: true,
        message: 'Coinbase refund initiated - manual processing required',
        data: {
          id: `coinbase_refund_${Date.now()}`,
          status: 'pending_manual_processing',
          charge_id: refundRequest.chargeId,
          reason: refundRequest.reason,
          amount: refundRequest.amount,
          created_at: new Date().toISOString(),
        }
      }
    } catch (error) {
      console.error('Coinbase refund creation failed:', error)
      throw error
    }
  }

  /**
   * Get charge details from Coinbase
   */
  static async getCharge(chargeId: string) {
    try {
      const response = await this.makeRequest(`/charges/${chargeId}`)
      return response
    } catch (error) {
      console.error('Failed to fetch Coinbase charge:', error)
      throw error
    }
  }

  /**
   * Process a refund for an order paid via Coinbase
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
      
      if (!orderData?.coinbaseChargeId) {
        throw new Error('No Coinbase charge ID found for this order')
      }

      if (orderData.paymentMethod !== 'coinbase') {
        throw new Error('Order was not paid via Coinbase')
      }

      // Get refund details from our database
      const refundRef = adminDb.collection('refunds').doc(refundId)
      const refundDoc = await refundRef.get()
      
      if (!refundDoc.exists) {
        throw new Error('Refund request not found')
      }

      const refundData = refundDoc.data()
      const refundAmount = refundData?.amount || orderData.totalAmount || 0

      // Get charge details from Coinbase
      const chargeDetails = await this.getCharge(orderData.coinbaseChargeId)
      
      if (!chargeDetails.data) {
        throw new Error('Failed to retrieve charge details from Coinbase')
      }

      // Create refund request (manual processing for Coinbase)
      const coinbaseRefund = await this.createRefund({
        chargeId: orderData.coinbaseChargeId,
        reason: refundData?.reason || 'Customer refund request',
        amount: {
          amount: refundAmount.toString(),
          currency: 'USD' // Assuming USD, adjust based on your setup
        }
      })

      // Update our refund record
      const updateData = {
        status: 'pending_manual_processing', // Coinbase requires manual processing
        coinbaseRefundId: coinbaseRefund.data?.id,
        coinbaseChargeId: orderData.coinbaseChargeId,
        coinbaseRefundStatus: coinbaseRefund.data?.status,
        processedBy: adminUserId || null,
        updatedAt: new Date(),
        manualProcessingRequired: true,
        processingNotes: 'Coinbase refunds require manual processing. Please process this refund manually in your Coinbase Commerce dashboard.',
      }

      await refundRef.update(updateData)

      // Don't update order status to refunded yet since it requires manual processing
      await orderRef.update({
        status: 'refund_processing',
        updatedAt: new Date(),
      })

      return {
        success: true,
        requiresManualProcessing: true,
        refund: {
          id: refundId,
          ...refundData,
          ...updateData,
        },
        coinbaseRefund: coinbaseRefund.data,
        instructions: 'This refund requires manual processing in your Coinbase Commerce dashboard. Please process the refund manually and then mark it as completed in the admin panel.',
      }

    } catch (error) {
      console.error('Coinbase order refund processing failed:', error)
      
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
   * Mark a manually processed Coinbase refund as completed
   */
  static async markRefundCompleted(refundId: string, adminUserId?: string, transactionId?: string) {
    try {
      const refundRef = adminDb.collection('refunds').doc(refundId)
      const refundDoc = await refundRef.get()
      
      if (!refundDoc.exists) {
        throw new Error('Refund request not found')
      }

      const refundData = refundDoc.data()
      
      // Update refund status
      await refundRef.update({
        status: 'refunded',
        refundedAt: new Date(),
        coinbaseTransactionId: transactionId,
        manuallyCompletedBy: adminUserId,
        updatedAt: new Date(),
      })

      // Update order status
      if (refundData?.orderId) {
        await adminDb.collection('orders').doc(refundData.orderId).update({
          status: 'refunded',
          paymentStatus: 'refunded',
          refundedAt: new Date(),
          updatedAt: new Date(),
        })
      }

      return {
        success: true,
        refund: {
          id: refundId,
          ...refundData,
          status: 'refunded',
          refundedAt: new Date(),
        }
      }

    } catch (error) {
      console.error('Failed to mark Coinbase refund as completed:', error)
      throw error
    }
  }

  /**
   * List charges with optional filters
   */
  static async listCharges(params?: {
    limit?: number
    starting_after?: string
    ending_before?: string
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

      const endpoint = `/charges${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      const response = await this.makeRequest(endpoint)
      return response
    } catch (error) {
      console.error('Failed to list Coinbase charges:', error)
      throw error
    }
  }
}
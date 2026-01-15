import axios from 'axios'

export interface PaystackTransferRecipient {
  type: 'nuban' | 'mobile_money' | 'basa'
  name: string
  account_number: string
  bank_code: string
  currency: 'NGN'
  description?: string
  metadata?: Record<string, any>
}

export interface PaystackTransfer {
  source: 'balance'
  amount: number // in kobo (Naira cents)
  recipient: string // recipient code
  reason: string
  currency: 'NGN'
  reference?: string
  metadata?: Record<string, any>
}

export interface PaystackBank {
  id: number
  name: string
  slug: string
  code: string
  longcode: string
  gateway: string
  pay_with_bank: boolean
  active: boolean
  country: string
  currency: string
  type: string
}

export class PaystackTransferService {
  private secretKey: string | null = null
  private baseUrl = 'https://api.paystack.co'
  private initialized = false

  constructor() {
    this.initialize()
  }

  private initialize() {
    const key = process.env.PAYSTACK_SECRET_KEY
    
    if (!key) {
      console.warn('PAYSTACK_SECRET_KEY environment variable is not set - transfers will not work')
      return
    }
    
    if (!key.startsWith('sk_')) {
      console.warn('Invalid Paystack secret key format. Must start with sk_')
      return
    }
    
    this.secretKey = key
    this.initialized = true
    console.log('PaystackTransferService initialized with key:', key.substring(0, 10) + '...')
  }

  isConfigured(): boolean {
    return this.initialized && this.secretKey !== null
  }

  private ensureConfigured() {
    if (!this.isConfigured()) {
      throw new Error('Paystack is not configured. Please set PAYSTACK_SECRET_KEY environment variable.')
    }
  }

  private getHeaders() {
    this.ensureConfigured()
    return {
      Authorization: `Bearer ${this.secretKey}`,
      'Content-Type': 'application/json'
    }
  }

  /**
   * Test Paystack connection
   */
  async testConnection(): Promise<boolean> {
    if (!this.isConfigured()) {
      return false
    }
    
    try {
      const response = await axios.get(`${this.baseUrl}/bank`, {
        headers: this.getHeaders()
      })
      return response.status === 200
    } catch (error) {
      console.error('Paystack connection test failed:', error)
      return false
    }
  }

  /**
   * Get list of supported banks
   */
  async getBanks(): Promise<PaystackBank[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/bank`, {
        headers: this.getHeaders()
      })
      return response.data.data
    } catch (error) {
      console.error('Error fetching banks:', error)
      throw new Error('Failed to fetch bank list')
    }
  }

  /**
   * Resolve account number to get account name
   */
  async resolveAccountNumber(accountNumber: string, bankCode: string): Promise<{
    account_number: string
    account_name: string
    bank_id: number
  }> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
        {
          headers: this.getHeaders()
        }
      )
      return response.data.data
    } catch (error) {
      console.error('Error resolving account:', error)
      throw new Error('Failed to resolve account number')
    }
  }

  /**
   * Create a transfer recipient
   */
  async createTransferRecipient(recipient: PaystackTransferRecipient): Promise<{
    recipient_code: string
    type: string
    name: string
    description: string
    metadata: any
    domain: string
    details: {
      authorization_code: string | null
      account_number: string
      account_name: string | null
      bank_code: string
      bank_name: string
    }
  }> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/transferrecipient`,
        recipient,
        {
          headers: this.getHeaders()
        }
      )
      return response.data.data
    } catch (error: any) {
      console.error('Error creating transfer recipient:', error.response?.data || error)
      throw new Error(error.response?.data?.message || 'Failed to create transfer recipient')
    }
  }

  /**
   * Initiate a transfer
   */
  async initiateTransfer(transfer: PaystackTransfer): Promise<{
    reference: string
    integration: number
    domain: string
    amount: number
    currency: string
    source: string
    reason: string
    recipient: number
    status: string
    transfer_code: string
    id: number
    createdAt: string
    updatedAt: string
  }> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/transfer`,
        transfer,
        {
          headers: this.getHeaders()
        }
      )
      return response.data.data
    } catch (error: any) {
      console.error('Error initiating transfer:', error.response?.data || error)
      throw new Error(error.response?.data?.message || 'Failed to initiate transfer')
    }
  }

  /**
   * Verify a transfer
   */
  async verifyTransfer(transferCode: string): Promise<{
    reference: string
    integration: number
    domain: string
    amount: number
    currency: string
    source: string
    reason: string
    recipient: {
      domain: string
      type: string
      currency: string
      name: string
      details: {
        account_number: string
        account_name: string
        bank_code: string
        bank_name: string
      }
      description: string
      metadata: any
      recipient_code: string
      active: boolean
      id: number
      createdAt: string
      updatedAt: string
    }
    status: string
    failures: any
    transfer_code: string
    id: number
    createdAt: string
    updatedAt: string
  }> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/transfer/${transferCode}`,
        {
          headers: this.getHeaders()
        }
      )
      return response.data.data
    } catch (error: any) {
      console.error('Error verifying transfer:', error.response?.data || error)
      throw new Error(error.response?.data?.message || 'Failed to verify transfer')
    }
  }

  /**
   * Finalize a transfer (for transfers that require OTP)
   */
  async finalizeTransfer(transferCode: string, otp: string): Promise<{
    reference: string
    status: string
    transfer_code: string
    message: string
  }> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/transfer/finalize_transfer`,
        {
          transfer_code: transferCode,
          otp: otp
        },
        {
          headers: this.getHeaders()
        }
      )
      return response.data.data
    } catch (error: any) {
      console.error('Error finalizing transfer:', error.response?.data || error)
      throw new Error(error.response?.data?.message || 'Failed to finalize transfer')
    }
  }

  /**
   * Get transfer balance
   */
  async getBalance(): Promise<{
    currency: string
    balance: number
  }[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/balance`, {
        headers: this.getHeaders()
      })
      return response.data.data
    } catch (error: any) {
      console.error('Error fetching balance:', error.response?.data || error)
      throw new Error('Failed to fetch balance')
    }
  }

  /**
   * Helper method to convert Naira to Kobo
   */
  static nairaToKobo(naira: number): number {
    return Math.round(naira * 100)
  }

  /**
   * Helper method to convert Kobo to Naira
   */
  static koboToNaira(kobo: number): number {
    return kobo / 100
  }
}

// Export singleton instance
export const paystackTransferService = new PaystackTransferService()

// Bank codes for popular Nigerian banks
export const NIGERIAN_BANKS = {
  ACCESS_BANK: '044',
  CITIBANK: '023',
  DIAMOND_BANK: '063',
  ECOBANK: '050',
  FIDELITY_BANK: '070',
  FIRST_BANK: '011',
  FIRST_CITY_MONUMENT_BANK: '214',
  GUARANTY_TRUST_BANK: '058',
  HERITAGE_BANK: '030',
  KEYSTONE_BANK: '082',
  POLARIS_BANK: '076',
  PROVIDUS_BANK: '101',
  STANBIC_IBTC: '221',
  STANDARD_CHARTERED: '068',
  STERLING_BANK: '232',
  UNION_BANK: '032',
  UNITED_BANK_FOR_AFRICA: '033',
  UNITY_BANK: '215',
  WEMA_BANK: '035',
  ZENITH_BANK: '057'
} as const
export interface PaymentData {
  email: string
  amount: number // in Naira
  orderId: string
  customerName: string
  metadata?: Record<string, any>
  subaccount?: string // Paystack subaccount code
}

export function initiatePaystackPayment(
  data: PaymentData,
  onSuccess: (reference: string) => void,
  onClose: () => void
) {
  // Only import and use PaystackPop on the client side
  if (typeof window === 'undefined') {
    console.error('PaystackPop can only be used in the browser')
    return
  }

  const publicKey = (process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || 'pk_test_4f982216f23d912048d00f1a9c9f77a7b54647bc').trim()
  if (!publicKey) {
    throw new Error('Paystack is not configured. Add NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY in the deployment environment.')
  }
  if (!/^pk_(test|live)_/.test(publicKey)) {
    throw new Error('Paystack public key is invalid. It must start with pk_test_ or pk_live_.')
  }
  if (!Number.isFinite(data.amount) || data.amount <= 0) {
    throw new Error('The payment amount is invalid. Please refresh your cart and try again.')
  }

  // Dynamic import to avoid SSR issues
  const PaystackPop = require('@paystack/inline-js').default || require('@paystack/inline-js')
  const paystack = new PaystackPop()
  
  const transactionOptions: any = {
    key: publicKey,
    email: data.email,
    amount: Math.round(data.amount * 100), // Convert to kobo (Naira cents)
    currency: 'NGN',
    ref: data.orderId,
    metadata: {
      custom_fields: [
        {
          display_name: "Customer Name",
          variable_name: "customer_name",
          value: data.customerName
        },
        ...(data.metadata ? Object.entries(data.metadata).map(([key, value]) => ({
          display_name: key,
          variable_name: key,
          value: String(value)
        })) : [])
      ]
    },
    onSuccess: (transaction: { reference: string }) => {
      console.log('Payment successful:', transaction)
      onSuccess(transaction.reference)
    },
    onCancel: () => {
      console.log('Payment cancelled by user')
      onClose()
    }
  }

  if (data.subaccount && typeof data.subaccount === 'string' && data.subaccount.trim().length > 0) {
    transactionOptions.subaccount = data.subaccount.trim()
  }

  paystack.newTransaction(transactionOptions)
}

// Helper function to format currency
export function formatNaira(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN'
  }).format(amount)
}

// Test card numbers for development
export const TEST_CARDS = {
  success: '4084084084084081',
  decline: '5060666666666666666',
  cvv: '408',
  pin: '1234',
  expiryMonth: '12',
  expiryYear: '2030'
}

import PaystackPop from '@paystack/inline-js'

export interface PaymentData {
  email: string
  amount: number // in Naira
  orderId: string
  customerName: string
  metadata?: Record<string, any>
}

export function initiatePaystackPayment(
  data: PaymentData,
  onSuccess: (reference: string) => void,
  onClose: () => void
) {
  const paystack = new PaystackPop()
  
  paystack.newTransaction({
    key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
    email: data.email,
    amount: data.amount * 100, // Convert to kobo (Naira cents)
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
  })
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

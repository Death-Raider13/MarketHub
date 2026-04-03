import { orderSchema, reviewSchema, messageSchema } from './validation'

describe('Validation Schemas', () => {
  describe('orderSchema', () => {
    it('validates a correct physical product order', () => {
      const validOrder = {
        userId: 'user123',
        items: [
          {
            productId: 'prod1',
            price: 500000,
            quantity: 1
          }
        ],
        total: 542500,
        shippingAddress: {
          fullName: 'John Doe',
          phone: '08012345678',
          addressLine1: '123 Main St',
          city: 'Lagos',
          state: 'Lagos',
          zipCode: '100001',
          country: 'Nigeria'
        },
        paymentMethod: 'paystack'
      }

      const result = orderSchema.safeParse(validOrder)
      if (!result.success) {
        console.error('Validation errors:', JSON.stringify(result.error.format(), null, 2))
      }
      expect(result.success).toBe(true)
    })

    it('rejects order with empty items array', () => {
      const invalidOrder = {
        userId: 'user123',
        items: [],
        total: 0,
        shippingAddress: {
          fullName: 'John Doe',
          phone: '08012345678',
          addressLine1: '123 Main St',
          city: 'Lagos',
          state: 'Lagos',
          zipCode: '100001'
        },
        paymentMethod: 'paystack'
      }

      const result = orderSchema.safeParse(invalidOrder)
      expect(result.success).toBe(false)
    })
  })

  describe('reviewSchema', () => {
    it('validates a correct review', () => {
      const validReview = {
        productId: 'prod1',
        userId: 'user123',
        rating: 5,
        title: 'Great product',
        comment: 'This is a fantastic product, highly recommended.'
      }

      const result = reviewSchema.safeParse(validReview)
      expect(result.success).toBe(true)
    })

    it('rejects ratings outside 1-5 range', () => {
      const invalidReview = {
        productId: 'prod1',
        userId: 'user123',
        rating: 6,
        comment: 'Too good to be true!'
      }

      const result = reviewSchema.safeParse(invalidReview)
      expect(result.success).toBe(false)
    })
  })
})

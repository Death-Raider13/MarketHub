/**
 * @jest-environment node
 */
import { updateCreatorBalances } from './creator-balance'
import { getAdminFirestore } from '@/lib/firebase/admin-simple'

// Mock the dependencies
jest.mock('@/lib/firebase/admin-simple')
jest.mock('firebase-admin/firestore', () => ({
  FieldValue: {
    increment: jest.fn((val) => `increment(${val})`),
    serverTimestamp: jest.fn(() => 'mock-timestamp'),
  },
}))

describe('Creator Balance Service', () => {
  let mockDb: any
  let mockTransaction: any
  let mockDocRef: any
  let mockDocSnapshot: any

  beforeEach(() => {
    jest.clearAllMocks()

    mockDocSnapshot = {
      exists: false,
      data: jest.fn()
    }

    mockDocRef = {
      id: 'creator123'
    }

    mockTransaction = {
      get: jest.fn().mockResolvedValue(mockDocSnapshot),
      set: jest.fn(),
      update: jest.fn(),
    }

    mockDb = {
      collection: jest.fn().mockReturnThis(),
      doc: jest.fn().mockReturnValue(mockDocRef),
      runTransaction: jest.fn(async (cb) => await cb(mockTransaction)),
    }

    ;(getAdminFirestore as jest.Mock).mockReturnValue(mockDb)
  })

  it('calculates correct earnings and updates balance (new creator)', async () => {
    const orderData = {
      items: [
        {
          creatorId: 'creator1',
          price: 1000,
          quantity: 2
        }
      ]
    }
    const orderId = 'order123'

    process.env.PLATFORM_COMMISSION_RATE = '0.1' // 10%

    await updateCreatorBalances(orderData, orderId)

    // Verify transaction was called
    expect(mockDb.runTransaction).toHaveBeenCalled()
    
    // 2000 total * 0.9 = 1800 earning
    expect(mockTransaction.set).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        availableBalance: 1800,
        totalEarnings: 1800
      })
    )
  })

  it('increments balance for existing creator', async () => {
    const orderData = {
      items: [
        {
          creatorId: 'creator1',
          price: 1000,
          quantity: 1
        }
      ]
    }
    
    // Simulate existing creator
    mockDocSnapshot.exists = true
    
    await updateCreatorBalances(orderData, 'order123')

    expect(mockTransaction.update).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        availableBalance: 'increment(900)',
        totalEarnings: 'increment(900)'
      })
    )
  })

  it('handles multiple items for the same creator', async () => {
     const orderData = {
      items: [
        { creatorId: 'creator1', price: 1000, quantity: 1 },
        { creatorId: 'creator1', price: 500, quantity: 2 }
      ]
    }
    
    await updateCreatorBalances(orderData, 'order123')
    
    // (1000*1 + 500*2) = 2000 total. 2000 * 0.9 = 1800.
    expect(mockTransaction.set).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        availableBalance: 1800
      })
    )
  })
})

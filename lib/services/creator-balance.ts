import { getAdminFirestore } from '@/lib/firebase/admin-simple'
import { FieldValue } from 'firebase-admin/firestore'
import { saleSplit } from '@/lib/business-fees'

/**
 * Updates creator balances for an order using Firestore transactions
 * to prevent race conditions when multiple orders happen concurrently.
 */
export async function updateCreatorBalances(orderData: any, orderId: string): Promise<void> {
  const adminDb = getAdminFirestore()
  if (!adminDb) {
    throw new Error('Admin Firestore not initialized')
  }

  // Calculate earnings per creator
  const creatorUpdates = new Map<string, number>()

  orderData.items?.forEach((item: any) => {
    const creatorId = item.product?.creatorId || item.creatorId || item.product?.creatorId || item.creatorId
    if (!creatorId) return

    const price =
      item.product?.price ??
      item.productPrice ??
      item.price ??
      0
    const quantity = item.quantity || 1
    const itemTotal = price * quantity

    // Direct sales pay creators 90%; sales with valid affiliate attribution
    // pay creators 75%, affiliates 15%, and the platform 10%.
    const split = saleSplit(Boolean(orderData.affiliateCode))
    const creatorEarning = itemTotal * (split.creatorPercent / 100)

    creatorUpdates.set(
      creatorId,
      (creatorUpdates.get(creatorId) || 0) + creatorEarning
    )
  })

  if (creatorUpdates.size === 0) return

  // Execute a transaction for each creator's balance
  const balancePromises = Array.from(creatorUpdates.entries()).map(
    async ([creatorId, earning]) => {
      const balanceRef = adminDb.collection('creatorBalances').doc(creatorId)
      const isCrypto = orderData.paymentMethod === 'coinbase' || orderData.paymentMethod === 'crypto'

      try {
        await adminDb.runTransaction(async (transaction: FirebaseFirestore.Transaction) => {
          const balanceDoc = await transaction.get(balanceRef)

          if (!(balanceDoc as any).exists) {
            transaction.set(balanceRef, {
              creatorId,
              availableBalance: isCrypto ? 0 : earning,
              pendingBalance: 0,
              pendingCryptoBalance: isCrypto ? earning : 0,
              totalEarnings: earning,
              totalWithdrawn: 0,
              updatedAt: FieldValue.serverTimestamp(),
            })
          } else {
            const updateData: any = {
              totalEarnings: FieldValue.increment(earning),
              updatedAt: FieldValue.serverTimestamp(),
            }

            if (isCrypto) {
              updateData.pendingCryptoBalance = FieldValue.increment(earning)
            } else {
              updateData.availableBalance = FieldValue.increment(earning)
            }

            transaction.update(balanceRef, updateData)
          }
        })
      } catch (error) {
        console.error(`Failed to update balance for creator ${creatorId}:`, error)
        throw error // Re-throw to be caught by the outer catch block
      }
    }
  )

  await Promise.all(balancePromises)
}

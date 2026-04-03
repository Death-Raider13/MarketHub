import { getAdminFirestore } from './firebase/admin'
import { FieldValue } from 'firebase-admin/firestore'

/**
 * Server-side Analytics Utility
 * Logs key events to Firestore for creator insights and platform metrics
 */
export async function logEvent(
  type: 'view' | 'checkout' | 'download',
  metadata: {
    productId?: string
    creatorId?: string
    userId?: string
    orderId?: string
    [key: string]: any
  }
) {
  try {
    const db = getAdminFirestore()
    if (!db) return

    const timestamp = new Date()
    const eventData = {
      type,
      ...metadata,
      timestamp,
      createdAt: FieldValue.serverTimestamp()
    }

    // 1. Add to global events log
    await db.collection('analytics_events').add(eventData)

    // 2. Increment counters for the product if applicable
    if (metadata.productId) {
      const productRef = db.collection('products').doc(metadata.productId)

      const updateData: any = {}
      if (type === 'view') updateData.viewCount = FieldValue.increment(1)
      if (type === 'download') updateData.downloadCount = FieldValue.increment(1)
      if (type === 'checkout') updateData.salesCount = FieldValue.increment(1)

      await productRef.update(updateData).catch(() => {
        // Product might not have these fields yet, or fail silently
      })
    }

    console.log(`[Analytics] Event logged: ${type}`, metadata)

  } catch (error) {
    console.error('[Analytics] Error logging event:', error)
  }
}

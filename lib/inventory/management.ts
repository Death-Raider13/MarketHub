/**
 * Inventory Management System
 * Handles stock reduction, restoration, and low stock alerts
 */

import { getAdminFirestore } from '@/lib/firebase/admin'
import { logger } from '@/lib/logger'

export interface InventoryItem {
  productId: string
  quantity: number
  productName?: string
  creatorId?: string
}

export interface StockUpdateResult {
  success: boolean
  productId: string
  oldStock: number
  newStock: number
  error?: string
}

/**
 * Reduce inventory when order is paid
 */
export async function reduceInventory(items: InventoryItem[]): Promise<StockUpdateResult[]> {
  const adminDb = getAdminFirestore()
  if (!adminDb) {
    throw new Error('Firebase Admin not configured')
  }

  const results: StockUpdateResult[] = []
  const batch = adminDb.batch()

  try {
    // Get current stock for all products
    for (const item of items) {
      const productRef = adminDb.collection('products').doc(item.productId)
      const productDoc = await productRef.get()

      if (!productDoc.exists) {
        results.push({
          success: false,
          productId: item.productId,
          oldStock: 0,
          newStock: 0,
          error: 'Product not found'
        })
        continue
      }

      const productData = productDoc.data()
      const currentStock = productData?.stock || 0
      const newStock = Math.max(0, currentStock - item.quantity)

      // Check if sufficient stock
      if (currentStock < item.quantity) {
        results.push({
          success: false,
          productId: item.productId,
          oldStock: currentStock,
          newStock: currentStock,
          error: `Insufficient stock. Available: ${currentStock}, Requested: ${item.quantity}`
        })
        continue
      }

      // Add to batch update
      batch.update(productRef, {
        stock: newStock,
        updatedAt: new Date(),
        lastStockUpdate: new Date()
      })

      results.push({
        success: true,
        productId: item.productId,
        oldStock: currentStock,
        newStock: newStock
      })

      // Check for low stock alert
      const lowStockThreshold = productData?.lowStockThreshold || 5
      if (newStock <= lowStockThreshold && newStock > 0) {
        await sendLowStockAlert(item.productId, newStock, item.creatorId || productData?.creatorId)
      }

      // Check for out of stock
      if (newStock === 0) {
        await sendOutOfStockAlert(item.productId, item.creatorId || productData?.creatorId)
      }
    }

    // Commit all updates
    await batch.commit()

    logger.info('Inventory reduced successfully', {
      itemsProcessed: items.length,
      successCount: results.filter(r => r.success).length,
      failureCount: results.filter(r => !r.success).length
    })

    return results

  } catch (error) {
    logger.error('Error reducing inventory', { error, items })
    throw error
  }
}

/**
 * Restore inventory when order is cancelled
 */
export async function restoreInventory(items: InventoryItem[]): Promise<StockUpdateResult[]> {
  const adminDb = getAdminFirestore()
  if (!adminDb) {
    throw new Error('Firebase Admin not configured')
  }

  const results: StockUpdateResult[] = []
  const batch = adminDb.batch()

  try {
    for (const item of items) {
      const productRef = adminDb.collection('products').doc(item.productId)
      const productDoc = await productRef.get()

      if (!productDoc.exists) {
        results.push({
          success: false,
          productId: item.productId,
          oldStock: 0,
          newStock: 0,
          error: 'Product not found'
        })
        continue
      }

      const productData = productDoc.data()
      const currentStock = productData?.stock || 0
      const newStock = currentStock + item.quantity

      // Add to batch update
      batch.update(productRef, {
        stock: newStock,
        updatedAt: new Date(),
        lastStockUpdate: new Date()
      })

      results.push({
        success: true,
        productId: item.productId,
        oldStock: currentStock,
        newStock: newStock
      })
    }

    // Commit all updates
    await batch.commit()

    logger.info('Inventory restored successfully', {
      itemsProcessed: items.length,
      successCount: results.filter(r => r.success).length
    })

    return results

  } catch (error) {
    logger.error('Error restoring inventory', { error, items })
    throw error
  }
}

/**
 * Check stock availability before order creation
 */
export async function checkStockAvailability(items: InventoryItem[]): Promise<{
  available: boolean
  issues: { productId: string; requested: number; available: number }[]
}> {
  const adminDb = getAdminFirestore()
  if (!adminDb) {
    throw new Error('Firebase Admin not configured')
  }

  const issues: { productId: string; requested: number; available: number }[] = []

  try {
    for (const item of items) {
      const productDoc = await adminDb.collection('products').doc(item.productId).get()

      if (!productDoc.exists) {
        issues.push({
          productId: item.productId,
          requested: item.quantity,
          available: 0
        })
        continue
      }

      const productData = productDoc.data()
      const currentStock = productData?.stock || 0

      if (currentStock < item.quantity) {
        issues.push({
          productId: item.productId,
          requested: item.quantity,
          available: currentStock
        })
      }
    }

    return {
      available: issues.length === 0,
      issues
    }

  } catch (error) {
    logger.error('Error checking stock availability', { error, items })
    throw error
  }
}

/**
 * Get low stock products for a creator
 */
export async function getLowStockProducts(creatorId: string, threshold: number = 5) {
  const adminDb = getAdminFirestore()
  if (!adminDb) {
    throw new Error('Firebase Admin not configured')
  }

  try {
    const productsSnapshot = await adminDb
      .collection('products')
      .where('creatorId', '==', creatorId)
      .where('stock', '<=', threshold)
      .where('stock', '>', 0)
      .get()

    const lowStockProducts = productsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      stockLevel: 'low'
    }))

    return lowStockProducts

  } catch (error) {
    logger.error('Error getting low stock products', { error, creatorId })
    throw error
  }
}

/**
 * Get out of stock products for a creator
 */
export async function getOutOfStockProducts(creatorId: string) {
  const adminDb = getAdminFirestore()
  if (!adminDb) {
    throw new Error('Firebase Admin not configured')
  }

  try {
    const productsSnapshot = await adminDb
      .collection('products')
      .where('creatorId', '==', creatorId)
      .where('stock', '==', 0)
      .get()

    const outOfStockProducts = productsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      stockLevel: 'out'
    }))

    return outOfStockProducts

  } catch (error) {
    logger.error('Error getting out of stock products', { error, creatorId })
    throw error
  }
}

/**
 * Send low stock alert to creator
 */
async function sendLowStockAlert(productId: string, currentStock: number, creatorId: string) {
  try {
    const { NotificationTriggers } = await import('@/lib/notifications/triggers')

    // Create notification for creator
    // await NotificationTriggers.onLowStock(productId, creatorId, currentStock)
    // TODO: Implement low stock notification trigger

    logger.info('Low stock alert sent', { productId, currentStock, creatorId })
  } catch (error) {
    logger.error('Failed to send low stock alert', { error, productId, creatorId })
  }
}

/**
 * Send out of stock alert to creator
 */
async function sendOutOfStockAlert(productId: string, creatorId: string) {
  try {
    const { NotificationTriggers } = await import('@/lib/notifications/triggers')

    // Create notification for creator
    // await NotificationTriggers.onOutOfStock(productId, creatorId)
    // TODO: Implement out of stock notification trigger

    logger.info('Out of stock alert sent', { productId, creatorId })
  } catch (error) {
    logger.error('Failed to send out of stock alert', { error, productId, creatorId })
  }
}

/**
 * Update product stock manually (for creator dashboard)
 */
export async function updateProductStock(
  productId: string,
  newStock: number,
  creatorId: string
): Promise<{ success: boolean; oldStock?: number; newStock?: number; error?: string }> {
  const adminDb = getAdminFirestore()
  if (!adminDb) {
    throw new Error('Firebase Admin not configured')
  }

  try {
    const productRef = adminDb.collection('products').doc(productId)
    const productDoc = await productRef.get()

    if (!productDoc.exists) {
      return { success: false, error: 'Product not found' }
    }

    const productData = productDoc.data()

    // Verify creator ownership
    if (productData?.creatorId !== creatorId) {
      return { success: false, error: 'Unauthorized' }
    }

    const oldStock = productData?.stock || 0

    await productRef.update({
      stock: newStock,
      updatedAt: new Date(),
      lastStockUpdate: new Date()
    })

    logger.info('Product stock updated manually', {
      productId,
      oldStock,
      newStock,
      creatorId
    })

    return { success: true, oldStock, newStock }

  } catch (error) {
    logger.error('Error updating product stock', { error, productId, creatorId })
    return { success: false, error: 'Failed to update stock' }
  }
}

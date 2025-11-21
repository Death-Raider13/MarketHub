import { NextRequest, NextResponse } from 'next/server'
import { getAdminFirestore } from '@/lib/firebase/admin'
import { verifyAdminAuth } from '@/lib/firebase/admin-auth'
import { hasPermission } from '@/lib/admin/permissions'
import { createApiLogger, logBusinessEvent } from '@/lib/logger'

// Update order status (for vendors and admins)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  const logger = createApiLogger(request, `/api/orders/${params.orderId}/status`)
  
  try {
    const adminDb = getAdminFirestore()
    
    if (!adminDb) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      )
    }

    const { orderId } = params
    const { status, trackingNumber, notes, vendorId } = await request.json()

    // Validate required fields
    if (!status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 }
      )
    }

    // Validate status values
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      )
    }

    // Get the order
    const orderRef = adminDb.collection('orders').doc(orderId)
    const orderDoc = await orderRef.get()

    if (!orderDoc.exists) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      )
    }

    const orderData = orderDoc.data()
    if (!orderData) {
      return NextResponse.json(
        { error: "Invalid order data" },
        { status: 400 }
      )
    }

    // Check permissions
    let canUpdate = false
    let userContext = ''

    // Try admin auth first
    try {
      const authResult = await verifyAdminAuth(request)
      if (authResult.success && authResult.user && hasPermission(authResult.user.role, 'orders.edit')) {
        canUpdate = true
        userContext = `admin:${authResult.user.uid}`
      }
    } catch (adminError) {
      // Not an admin, check if it's a vendor
    }

    // If not admin, check if vendor owns products in this order
    if (!canUpdate && vendorId) {
      const hasVendorProducts = orderData.items?.some((item: any) => item.vendorId === vendorId)
      if (hasVendorProducts) {
        canUpdate = true
        userContext = `vendor:${vendorId}`
      }
    }

    if (!canUpdate) {
      return NextResponse.json(
        { error: "Unauthorized to update this order" },
        { status: 403 }
      )
    }

    // Validate status transitions
    const currentStatus = orderData.status
    const validTransitions: Record<string, string[]> = {
      'pending': ['processing', 'cancelled'],
      'paid': ['processing', 'cancelled'],
      'processing': ['shipped', 'cancelled'],
      'shipped': ['delivered'],
      'delivered': [], // Final state
      'cancelled': [] // Final state
    }

    if (currentStatus !== status && validTransitions[currentStatus] && !validTransitions[currentStatus].includes(status)) {
      return NextResponse.json(
        { error: `Cannot change status from ${currentStatus} to ${status}` },
        { status: 400 }
      )
    }

    // Prepare update data
    const updateData: any = {
      status,
      updatedAt: new Date(),
      lastUpdatedBy: userContext
    }

    // Add tracking number for shipped orders
    if (status === 'shipped' && trackingNumber) {
      updateData.trackingNumber = trackingNumber
      updateData.shippedAt = new Date()
    }

    // Add delivery confirmation
    if (status === 'delivered') {
      updateData.deliveredAt = new Date()
    }

    // Add cancellation info
    if (status === 'cancelled') {
      updateData.cancelledAt = new Date()
      updateData.cancellationReason = notes || 'Cancelled by vendor'
    }

    // Add notes if provided
    if (notes) {
      updateData.statusNotes = notes
    }

    // Update the order
    await orderRef.update(updateData)

    // Log business event
    logBusinessEvent('order_status_updated', {
      orderId,
      oldStatus: currentStatus,
      newStatus: status,
      updatedBy: userContext,
      trackingNumber
    })

    // Send notifications
    try {
      const { NotificationTriggers } = await import('@/lib/notifications/triggers')
      
      // Notify customer
      await NotificationTriggers.onOrderStatusChange(orderId, orderData.userId, status)
      
      // If shipped, notify all vendors in the order
      if (status === 'shipped') {
        const vendorIds = [...new Set<string>(orderData.items?.map((item: any) => item.vendorId) || [])]
        for (const vId of vendorIds) {
          if (vId !== vendorId) { // Don't notify the vendor who updated it
            await NotificationTriggers.onOrderStatusChange(orderId, vId, status)
          }
        }
      }
    } catch (notificationError) {
      logger.error('Failed to send status update notifications', { error: notificationError })
      // Don't fail the status update if notifications fail
    }

    // Handle inventory for cancelled orders
    if (status === 'cancelled' && currentStatus !== 'cancelled') {
      try {
        await restoreInventory(orderData.items)
      } catch (inventoryError) {
        logger.error('Failed to restore inventory for cancelled order', { error: inventoryError })
        // Don't fail the cancellation if inventory restore fails
      }
    }

    logger.info('Order status updated successfully', {
      orderId,
      oldStatus: currentStatus,
      newStatus: status,
      updatedBy: userContext
    })

    return NextResponse.json({
      success: true,
      message: 'Order status updated successfully',
      order: {
        id: orderId,
        status,
        trackingNumber: updateData.trackingNumber,
        updatedAt: updateData.updatedAt
      }
    })

  } catch (error: any) {
    logger.error('Error updating order status', { error })
    return NextResponse.json(
      { error: 'Failed to update order status' },
      { status: 500 }
    )
  }
}

// Helper function to restore inventory
async function restoreInventory(items: any[]) {
  const adminDb = getAdminFirestore()
  if (!adminDb) return

  const batch = adminDb.batch()

  for (const item of items) {
    if (item.productId && item.quantity) {
      const productRef = adminDb.collection('products').doc(item.productId)
      
      // Get current stock
      const productDoc = await productRef.get()
      if (productDoc.exists) {
        const productData = productDoc.data()
        const currentStock = productData?.stock || 0
        const newStock = currentStock + item.quantity

        batch.update(productRef, {
          stock: newStock,
          updatedAt: new Date()
        })
      }
    }
  }

  await batch.commit()
}

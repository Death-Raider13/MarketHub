import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'

export async function PUT(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const orderId = params.orderId
    const { userId } = await request.json()

    if (!orderId || !userId) {
      return NextResponse.json(
        { error: 'Order ID and User ID are required' },
        { status: 400 }
      )
    }

    // Get the order
    const orderDoc = await adminDb.collection('orders').doc(orderId).get()
    
    if (!orderDoc.exists) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    const order = orderDoc.data()
    
    // Verify the order belongs to the user
    if (order?.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized access to order' },
        { status: 403 }
      )
    }

    // Check if order can be cancelled
    if (order?.status !== 'pending' && order?.status !== 'processing') {
      return NextResponse.json(
        { error: 'Order cannot be cancelled at this stage' },
        { status: 400 }
      )
    }

    // Update order status to cancelled
    await adminDb.collection('orders').doc(orderId).update({
      status: 'cancelled',
      paymentStatus: 'refunded',
      cancelledAt: new Date(),
      updatedAt: new Date()
    })

    // TODO: Process refund if payment was made
    // TODO: Notify vendor about cancellation
    // TODO: Update inventory if items were reserved

    return NextResponse.json({
      success: true,
      message: 'Order cancelled successfully'
    })

  } catch (error) {
    console.error('Error cancelling order:', error)
    return NextResponse.json(
      { error: 'Failed to cancel order' },
      { status: 500 }
    )
  }
}

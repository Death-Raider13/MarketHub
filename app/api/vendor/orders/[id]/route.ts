import { NextRequest, NextResponse } from "next/server"
import { getAdminFirestore } from "@/lib/firebase/admin"
import { FieldValue } from "firebase-admin/firestore"
import { NotificationTriggers } from "@/lib/notifications/triggers"

// PUT - Update order status
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminDb = getAdminFirestore()
    
    if (!adminDb) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      )
    }

    const { status, trackingNumber } = await request.json()

    if (!status) {
      return NextResponse.json(
        { error: "Missing status" },
        { status: 400 }
      )
    }

    const updateData: any = {
      status,
      updatedAt: FieldValue.serverTimestamp(),
    }

    if (trackingNumber) {
      updateData.trackingNumber = trackingNumber
    }

    // Get order data before update to get customer ID
    const orderDoc = await adminDb.collection("orders").doc(params.id).get()
    const orderData = orderDoc.data()

    // Update order status
    await adminDb.collection("orders").doc(params.id).update(updateData)

    // Trigger notification to customer about status change
    if (orderData?.customerId || orderData?.userId) {
      try {
        const customerId = orderData.customerId || orderData.userId
        await NotificationTriggers.onOrderStatusChange(params.id, customerId, status)
      } catch (notificationError) {
        console.error("Failed to send order status notification:", notificationError)
        // Don't fail the order update if notification fails
      }
    }

    return NextResponse.json({
      success: true,
      message: "Order status updated successfully",
    })
  } catch (error) {
    console.error("Error updating order:", error)
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    )
  }
}

// GET - Get single order
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminDb = getAdminFirestore()
    
    if (!adminDb) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      )
    }

    const orderDoc = await adminDb.collection("orders").doc(params.id).get()

    if (!orderDoc.exists) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      )
    }

    const orderData = orderDoc.data()
    
    return NextResponse.json({
      id: orderDoc.id,
      ...orderData,
      createdAt: orderData?.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: orderData?.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error fetching order:", error)
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 }
    )
  }
}

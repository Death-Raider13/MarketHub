import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'

export async function POST(request: NextRequest) {
  try {
    const {
      vendorId,
      vendorName,
      customerId,
      customerName,
      customerEmail,
      subject,
      productId,
      productName,
      orderId
    } = await request.json()

    if (!vendorId || !vendorName || !customerId || !customerName || !customerEmail || !subject) {
      return NextResponse.json(
        { error: 'Required fields missing' },
        { status: 400 }
      )
    }

    // Check if conversation already exists for this customer-vendor-product combination
    let existingConversationQuery = adminDb
      .collection('conversations')
      .where('vendorId', '==', vendorId)
      .where('customerId', '==', customerId)
      .where('status', 'in', ['open', 'pending'])

    if (productId) {
      existingConversationQuery = existingConversationQuery.where('productId', '==', productId)
    }

    const existingConversations = await existingConversationQuery.get()

    if (!existingConversations.empty) {
      // Return existing conversation
      const existingConversation = existingConversations.docs[0]
      return NextResponse.json({
        success: true,
        conversationId: existingConversation.id,
        message: 'Using existing conversation'
      })
    }

    // Create new conversation
    const conversationData = {
      vendorId,
      vendorName,
      customerId,
      customerName,
      customerEmail,
      subject,
      status: 'open',
      priority: 'medium',
      productId: productId || null,
      productName: productName || null,
      orderId: orderId || null,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const conversationRef = await adminDb.collection('conversations').add(conversationData)

    return NextResponse.json({
      success: true,
      conversationId: conversationRef.id,
      message: 'Conversation created successfully'
    })

  } catch (error) {
    console.error('Error creating conversation:', error)
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    )
  }
}

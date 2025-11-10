import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const { conversationId } = params
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')

    if (!conversationId || !customerId) {
      return NextResponse.json(
        { error: 'Conversation ID and Customer ID are required' },
        { status: 400 }
      )
    }

    if (!adminDb) {
      console.error('Firebase Admin DB not initialized')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Verify the customer owns this conversation
    const conversationDoc = await adminDb
      .collection('conversations')
      .doc(conversationId)
      .get()

    if (!conversationDoc.exists) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    const conversationData = conversationDoc.data()
    if (conversationData?.customerId !== customerId) {
      return NextResponse.json(
        { error: 'Unauthorized access to conversation' },
        { status: 403 }
      )
    }

    // Get all messages for this conversation
    const messagesSnapshot = await adminDb
      .collection('messages')
      .where('conversationId', '==', conversationId)
      .orderBy('timestamp', 'asc')
      .get()

    const messages = messagesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate()
    }))

    // Mark vendor messages as read by customer
    const batch = adminDb.batch()
    messagesSnapshot.docs.forEach(doc => {
      const messageData = doc.data()
      if (messageData.senderRole === 'vendor' && !messageData.read) {
        batch.update(doc.ref, { read: true })
      }
    })
    await batch.commit()

    return NextResponse.json({
      success: true,
      conversation: {
        id: conversationDoc.id,
        ...conversationData,
        createdAt: conversationData?.createdAt?.toDate(),
        updatedAt: conversationData?.updatedAt?.toDate()
      },
      messages
    })

  } catch (error) {
    console.error('Error fetching conversation messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

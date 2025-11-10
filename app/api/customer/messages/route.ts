import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
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

    // Get all conversations for this customer
    const conversationsSnapshot = await adminDb
      .collection('conversations')
      .where('customerId', '==', customerId)
      .orderBy('updatedAt', 'desc')
      .get()

    const conversations = await Promise.all(
      conversationsSnapshot.docs.map(async (doc) => {
        const data = doc.data()
        
        // Get the last message for each conversation
        const lastMessageSnapshot = await adminDb
          .collection('messages')
          .where('conversationId', '==', doc.id)
          .orderBy('timestamp', 'desc')
          .limit(1)
          .get()

        const lastMessage = lastMessageSnapshot.docs[0]?.data()

        // Count unread messages from vendor that customer hasn't read
        const unreadSnapshot = await adminDb
          .collection('messages')
          .where('conversationId', '==', doc.id)
          .where('senderRole', '==', 'vendor')
          .where('read', '==', false)
          .get()

        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
          lastMessage: lastMessage ? {
            ...lastMessage,
            timestamp: lastMessage.timestamp?.toDate()
          } : null,
          unreadCount: unreadSnapshot.size
        }
      })
    )

    return NextResponse.json({
      success: true,
      conversations
    })

  } catch (error) {
    console.error('Error fetching customer conversations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    )
  }
}

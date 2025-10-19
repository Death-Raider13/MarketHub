import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vendorId = searchParams.get('vendorId')

    if (!vendorId) {
      return NextResponse.json(
        { error: 'Vendor ID is required' },
        { status: 400 }
      )
    }

    // Get all conversations for this vendor
    const conversationsSnapshot = await adminDb
      .collection('conversations')
      .where('vendorId', '==', vendorId)
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

        // Count unread messages from customer
        const unreadSnapshot = await adminDb
          .collection('messages')
          .where('conversationId', '==', doc.id)
          .where('senderRole', '==', 'customer')
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
    console.error('Error fetching conversations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    )
  }
}

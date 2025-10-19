import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'

export async function PUT(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const conversationId = params.conversationId
    const { userId } = await request.json()

    if (!conversationId || !userId) {
      return NextResponse.json(
        { error: 'Conversation ID and User ID are required' },
        { status: 400 }
      )
    }

    // Mark all messages in this conversation as read for the vendor
    const messagesSnapshot = await adminDb
      .collection('messages')
      .where('conversationId', '==', conversationId)
      .where('senderRole', '==', 'customer') // Only mark customer messages as read
      .where('read', '==', false)
      .get()

    const batch = adminDb.batch()
    
    messagesSnapshot.docs.forEach(doc => {
      batch.update(doc.ref, { read: true })
    })

    await batch.commit()

    return NextResponse.json({
      success: true,
      message: `Marked ${messagesSnapshot.size} messages as read`
    })

  } catch (error) {
    console.error('Error marking messages as read:', error)
    return NextResponse.json(
      { error: 'Failed to mark messages as read' },
      { status: 500 }
    )
  }
}

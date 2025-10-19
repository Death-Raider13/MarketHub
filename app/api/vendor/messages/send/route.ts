import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'

export async function POST(request: NextRequest) {
  try {
    const { 
      conversationId, 
      senderId, 
      senderName, 
      senderRole, 
      content 
    } = await request.json()

    if (!conversationId || !senderId || !senderName || !senderRole || !content) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    if (!['customer', 'vendor'].includes(senderRole)) {
      return NextResponse.json(
        { error: 'Invalid sender role' },
        { status: 400 }
      )
    }

    // Create the message
    const messageData = {
      conversationId,
      senderId,
      senderName,
      senderRole,
      content: content.trim(),
      timestamp: new Date(),
      read: false
    }

    const messageRef = await adminDb.collection('messages').add(messageData)

    // Update conversation's last activity
    await adminDb.collection('conversations').doc(conversationId).update({
      updatedAt: new Date(),
      status: 'open' // Reopen conversation when new message is sent
    })

    return NextResponse.json({
      success: true,
      messageId: messageRef.id,
      message: 'Message sent successfully'
    })

  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}

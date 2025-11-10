import { NextRequest, NextResponse } from 'next/server'
import { getAdminFirestore } from '@/lib/firebase/admin'
import { notificationService } from '@/lib/notifications/service'

export async function POST(request: NextRequest) {
  try {
    const { 
      conversationId, 
      senderId, 
      senderName, 
      senderRole, 
      content 
    } = await request.json()

    console.log('Sending message with data:', {
      conversationId,
      senderId,
      senderName,
      senderRole,
      content: content?.substring(0, 50) + '...'
    })

    if (!conversationId || !senderId || !senderName || !senderRole || !content) {
      console.error('Missing required fields for message:', {
        conversationId: !!conversationId,
        senderId: !!senderId,
        senderName: !!senderName,
        senderRole: !!senderRole,
        content: !!content
      })
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

    const adminDb = getAdminFirestore()
    
    if (!adminDb) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
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

    // Get conversation details to notify the recipient
    try {
      const conversationDoc = await adminDb.collection('conversations').doc(conversationId).get()
      const conversationData = conversationDoc.data()
      
      if (conversationData) {
        // Determine recipient based on sender role
        const recipientId = senderRole === 'vendor' 
          ? conversationData.customerId 
          : conversationData.vendorId
        
        if (recipientId) {
          // Create notification for message recipient
          await notificationService.createNotification(recipientId, 'new_message', {
            title: `New message from ${senderName}`,
            message: content.length > 100 ? content.substring(0, 100) + '...' : content,
            metadata: {
              conversationId: conversationId,
              senderName: senderName,
              senderRole: senderRole,
              actionUrl: senderRole === 'vendor' ? '/messages' : '/vendor/messages'
            }
          })
        }
      }
    } catch (notificationError) {
      console.error('Failed to send message notification:', notificationError)
      // Don't fail the message if notification fails
    }

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

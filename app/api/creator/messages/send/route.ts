import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { getAdminFirestore } from '@/lib/firebase/admin'
import { notificationService } from '@/lib/notifications/service'
import { verifyAuthToken } from '@/lib/api-auth'

export async function POST(request: NextRequest) {
  const auth = await verifyAuthToken(request)
  if ('error' in auth) return auth.error

  try {
    const {
      conversationId,
      senderName,
      senderRole,
      content
    } = await request.json()

    // Always derive senderId from the authenticated token.
    const senderId = auth.user.uid

    if (!conversationId || !senderName || !senderRole || !content) {
      return NextResponse.json(
        { error: 'conversationId, senderName, senderRole and content are required' },
        { status: 400 }
      )
    }

    if (!['customer', 'creator'].includes(senderRole)) {
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

    // Verify the caller is a participant in this conversation.
    const convDoc = await adminDb.collection('conversations').doc(conversationId).get()
    if (!convDoc.exists) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }
    const convData = convDoc.data() as any
    const isParticipant =
      convData?.creatorId === senderId || convData?.customerId === senderId
    const isAdmin = auth.user.role === 'admin' || auth.user.role === 'super_admin'
    if (!isParticipant && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
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
        const recipientId = senderRole === 'creator'
          ? conversationData.customerId
          : conversationData.creatorId

        if (recipientId) {
          // Create notification for message recipient
          await notificationService.createNotification(recipientId, 'new_message', {
            title: `New message from ${senderName}`,
            message: content.length > 100 ? content.substring(0, 100) + '...' : content,
            metadata: {
              conversationId: conversationId,
              senderName: senderName,
              senderRole: senderRole,
              actionUrl: senderRole === 'creator' ? '/messages' : '/creator/messages'
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

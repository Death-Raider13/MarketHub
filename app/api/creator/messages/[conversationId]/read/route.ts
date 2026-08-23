import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { adminDb } from '@/lib/firebase/admin'
import { verifyAuthToken } from '@/lib/api-auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  const auth = await verifyAuthToken(request)
  if ('error' in auth) return auth.error

  try {
    const conversationId = params.conversationId
    // Derive userId from the token — ignore any userId in the body.
    const userId = auth.user.uid

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      )
    }

    // Mark all messages in this conversation as read for the creator
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

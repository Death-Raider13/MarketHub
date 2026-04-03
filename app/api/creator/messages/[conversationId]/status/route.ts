import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'

export async function PUT(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const conversationId = params.conversationId
    const { status } = await request.json()

    if (!conversationId || !status) {
      return NextResponse.json(
        { error: 'Conversation ID and status are required' },
        { status: 400 }
      )
    }

    if (!['open', 'pending', 'closed'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be open, pending, or closed' },
        { status: 400 }
      )
    }

    // Update conversation status
    await adminDb.collection('conversations').doc(conversationId).update({
      status,
      updatedAt: new Date()
    })

    return NextResponse.json({
      success: true,
      message: `Conversation status updated to ${status}`
    })

  } catch (error) {
    console.error('Error updating conversation status:', error)
    return NextResponse.json(
      { error: 'Failed to update conversation status' },
      { status: 500 }
    )
  }
}

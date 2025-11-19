import { NextRequest, NextResponse } from 'next/server'
import { addServiceMessage } from '@/lib/services/booking'

export async function POST(
  request: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  try {
    const { bookingId } = params
    const { message, senderId, senderType } = await request.json()

    if (!message || !senderId || !senderType) {
      return NextResponse.json(
        { error: 'Message, sender ID, and sender type are required' },
        { status: 400 }
      )
    }

    if (!['customer', 'vendor'].includes(senderType)) {
      return NextResponse.json(
        { error: 'Invalid sender type' },
        { status: 400 }
      )
    }

    const result = await addServiceMessage(
      bookingId,
      senderId,
      senderType,
      message
    )

    if (result.success) {
      return NextResponse.json({
        success: true,
        messageId: result.messageId
      })
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to send message' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Error sending service message:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { addServiceMessage } from '@/lib/services/booking'
import { verifyAuthToken } from '@/lib/api-auth'
import { logger } from '@/lib/logger'

export async function POST(
  request: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  try {
    const { bookingId } = params

    // 1. Authenticate
    const authResult = await verifyAuthToken(request)
    if ('error' in authResult) {
      return authResult.error
    }

    const { user } = authResult
    const userId = user.uid

    // 2. Validate input (senderId and senderType should not come from body for security)
    const { message, senderType } = await request.json()

    if (!message || !senderType) {
      return NextResponse.json(
        { error: 'Message and sender type are required' },
        { status: 400 }
      )
    }

    if (!['customer', 'creator'].includes(senderType)) {
      return NextResponse.json(
        { error: 'Invalid sender type' },
        { status: 400 }
      )
    }

    // 3. Add message (the lib service should verify if userId is a participant)
    const result = await addServiceMessage(
      bookingId,
      userId,
      senderType,
      message
    )

    if (result.success) {
      return NextResponse.json({
        success: true,
        messageId: result.messageId
      })
    } else {
      logger.warn(`Failed service message: booking=${bookingId}, user=${userId}, error=${result.error}`)
      return NextResponse.json(
        { error: result.error || 'Failed to send message' },
        { status: 400 }
      )
    }

  } catch (error: any) {
    logger.error('Error sending service message', { bookingId: params.bookingId }, error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}


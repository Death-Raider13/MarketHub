import { NextRequest, NextResponse } from 'next/server'
import { getCreatorServiceBookings } from '@/lib/services/booking'
import { verifyAuthToken } from '@/lib/api-auth'
import { logger } from '@/lib/logger'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate
    const authResult = await verifyAuthToken(request)
    if ('error' in authResult) {
      return authResult.error
    }

    const { user } = authResult
    // SECURITY: Use the authenticated user's ID as the creatorId
    const creatorId = user.uid

    const bookings = await getCreatorServiceBookings(creatorId)

    // Format the bookings for the frontend
    const formattedBookings = bookings.map((booking: any) => ({
      ...booking,
      createdAt: booking.createdAt?.toDate?.()?.toISOString() || booking.createdAt,
      updatedAt: booking.updatedAt?.toDate?.()?.toISOString() || booking.updatedAt,
      scheduledDate: booking.scheduledDate?.toDate?.()?.toISOString() || booking.scheduledDate,
      completedAt: booking.completedAt?.toDate?.()?.toISOString() || booking.completedAt,
      // Convert message timestamps
      messages: booking.messages?.map((msg: any) => ({
        ...msg,
        timestamp: msg.timestamp?.toDate?.()?.toISOString() || msg.timestamp
      })) || []
    }))

    return NextResponse.json({
      success: true,
      bookings: formattedBookings
    })

  } catch (error: any) {
    logger.error('Error fetching creator service bookings', undefined, error)
    return NextResponse.json(
      { error: 'Failed to fetch service bookings' },
      { status: 500 }
    )
  }
}


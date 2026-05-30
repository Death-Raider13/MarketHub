import { NextRequest, NextResponse } from 'next/server'
import { scheduleServiceBooking } from '@/lib/services/booking'
import { verifyAuthToken } from '@/lib/api-auth'

export async function POST(
  request: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  const auth = await verifyAuthToken(request)
  if ('error' in auth) return auth.error

  try {
    const { bookingId } = params
    const {
      scheduledDate,
      scheduledTime,
      duration,
      location,
      address,
      creatorNotes,
    } = await request.json()

    if (!scheduledDate || !scheduledTime) {
      return NextResponse.json(
        { error: 'scheduledDate and scheduledTime are required' },
        { status: 400 }
      )
    }

    // Always use the authenticated uid as the acting creator.
    const creatorId = auth.user.uid

    const result = await scheduleServiceBooking(
      bookingId,
      {
        scheduledDate: new Date(scheduledDate),
        scheduledTime,
        duration,
        location,
        address,
        creatorNotes
      },
      creatorId
    )

    if (result.success) {
      return NextResponse.json({ success: true, message: 'Service scheduled successfully' })
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to schedule service' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error scheduling service:', error)
    return NextResponse.json({ error: 'Failed to schedule service' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { scheduleServiceBooking } from '@/lib/services/booking'

export async function POST(
  request: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  try {
    const { bookingId } = params
    const {
      scheduledDate,
      scheduledTime,
      duration,
      location,
      address,
      creatorNotes,
      creatorId
    } = await request.json()

    if (!scheduledDate || !scheduledTime || !creatorId) {
      return NextResponse.json(
        { error: 'Scheduled date, time, and creator ID are required' },
        { status: 400 }
      )
    }

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
      return NextResponse.json({
        success: true,
        message: 'Service scheduled successfully'
      })
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to schedule service' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Error scheduling service:', error)
    return NextResponse.json(
      { error: 'Failed to schedule service' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { updateServiceStatus } from '@/lib/services/booking'
import { verifyAuthToken } from '@/lib/api-auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  const auth = await verifyAuthToken(request)
  if ('error' in auth) return auth.error

  try {
    const { bookingId } = params
    const { status, notes } = await request.json()

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 })
    }

    const validStatuses = ['pending_schedule', 'scheduled', 'in_progress', 'completed', 'cancelled']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Always use the authenticated uid as the acting creator.
    const creatorId = auth.user.uid

    const result = await updateServiceStatus(bookingId, status, creatorId, 'creator', notes)

    if (result.success) {
      return NextResponse.json({ success: true, message: 'Service status updated successfully' })
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to update service status' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error updating service status:', error)
    return NextResponse.json({ error: 'Failed to update service status' }, { status: 500 })
  }
}

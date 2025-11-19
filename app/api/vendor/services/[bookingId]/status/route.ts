import { NextRequest, NextResponse } from 'next/server'
import { updateServiceStatus } from '@/lib/services/booking'

export async function PUT(
  request: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  try {
    const { bookingId } = params
    const { status, vendorId, notes } = await request.json()

    if (!status || !vendorId) {
      return NextResponse.json(
        { error: 'Status and vendor ID are required' },
        { status: 400 }
      )
    }

    const validStatuses = ['pending_schedule', 'scheduled', 'in_progress', 'completed', 'cancelled']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    const result = await updateServiceStatus(
      bookingId,
      status,
      vendorId,
      'vendor',
      notes
    )

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Service status updated successfully'
      })
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to update service status' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Error updating service status:', error)
    return NextResponse.json(
      { error: 'Failed to update service status' },
      { status: 500 }
    )
  }
}

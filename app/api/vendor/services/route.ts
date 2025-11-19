import { NextRequest, NextResponse } from 'next/server'
import { getVendorServiceBookings } from '@/lib/services/booking'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vendorId = searchParams.get('vendorId')

    if (!vendorId) {
      return NextResponse.json(
        { error: 'Vendor ID is required' },
        { status: 400 }
      )
    }

    const bookings = await getVendorServiceBookings(vendorId)

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

  } catch (error) {
    console.error('Error fetching vendor service bookings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch service bookings' },
      { status: 500 }
    )
  }
}

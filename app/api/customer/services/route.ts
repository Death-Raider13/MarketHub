import { NextRequest, NextResponse } from 'next/server'
import { getAdminFirestore } from '@/lib/firebase/admin'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const adminDb = getAdminFirestore()
    
    if (!adminDb) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      )
    }

    // Get all service bookings for this customer
    const bookingsSnapshot = await adminDb
      .collection('serviceBookings')
      .where('customerId', '==', customerId)
      .orderBy('createdAt', 'desc')
      .get()

    const bookings = bookingsSnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        scheduledDate: data.scheduledDate?.toDate?.()?.toISOString() || data.scheduledDate,
        completedAt: data.completedAt?.toDate?.()?.toISOString() || data.completedAt,
        // Convert message timestamps
        messages: data.messages?.map((msg: any) => ({
          ...msg,
          timestamp: msg.timestamp?.toDate?.()?.toISOString() || msg.timestamp
        })) || []
      }
    })

    return NextResponse.json({
      success: true,
      bookings
    })

  } catch (error) {
    console.error('Error fetching service bookings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch service bookings' },
      { status: 500 }
    )
  }
}

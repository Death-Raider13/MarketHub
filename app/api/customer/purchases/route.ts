import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Get all purchased products for this user
    const purchasesSnapshot = await adminDb
      .collection('purchasedProducts')
      .where('userId', '==', userId)
      .orderBy('purchasedAt', 'desc')
      .get()

    const purchases = purchasesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      purchasedAt: doc.data().purchasedAt?.toDate(),
      accessExpiresAt: doc.data().accessExpiresAt?.toDate(),
      lastDownloadedAt: doc.data().lastDownloadedAt?.toDate()
    }))

    return NextResponse.json({
      success: true,
      purchases
    })

  } catch (error) {
    console.error('Error fetching purchases:', error)
    return NextResponse.json(
      { error: 'Failed to fetch purchases' },
      { status: 500 }
    )
  }
}

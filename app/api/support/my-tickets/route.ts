import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { verifyAuthToken } from '@/lib/api-auth'

/**
 * GET: Fetch support tickets for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuthToken(request)
    if ('error' in auth) return auth.error

    const { uid } = auth.user
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const page = parseInt(searchParams.get('page') || '1')

    // Filter tickets by userId
    let tickets: any[] = []
    let total = 0

    try {
      let query: any = adminDb.collection('support_tickets')
        .where('userId', '==', uid)
        .orderBy('createdAt', 'desc')

      // Apply pagination
      const offset = (page - 1) * limit
      if (offset > 0) {
        const offsetSnapshot = await query.limit(offset).get()
        if (!offsetSnapshot.empty) {
          const lastDoc = offsetSnapshot.docs[offsetSnapshot.docs.length - 1]
          query = query.startAfter(lastDoc)
        }
      }

      const snapshot = await query.limit(limit).get()
      tickets = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt,
      }))

      total = (await adminDb.collection('support_tickets').where('userId', '==', uid).count().get()).data().count
    } catch (queryError: any) {
      console.error('Query error (possibly missing index):', queryError)
      // Fallback: try without orderBy if it failed due to index
      const simpleSnapshot = await adminDb.collection('support_tickets')
        .where('userId', '==', uid)
        .limit(limit)
        .get()
      
      tickets = simpleSnapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
      }))
      total = simpleSnapshot.size
    }

    return NextResponse.json({
      success: true,
      tickets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching my support tickets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch support tickets' },
      { status: 500 }
    )
  }
}

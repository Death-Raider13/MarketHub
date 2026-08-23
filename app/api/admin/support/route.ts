import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
import { adminDb } from '@/lib/firebase/admin'
import { verifyAdminAuth } from '@/lib/firebase/admin-auth'

/**
 * GET: Fetch all support tickets (Admin Only)
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdminAuth(request)
    if (!auth.success || !auth.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '50')
    const page = parseInt(searchParams.get('page') || '1')

    let query: any = adminDb.collection('support_tickets')

    if (status && status !== 'all') {
      query = query.where('status', '==', status)
    }
    if (category && category !== 'all') {
      query = query.where('category', '==', category)
    }

    query = query.orderBy('createdAt', 'desc')

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
    
    const tickets = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt,
    }))

    // Get counts for dashboard
    const allSnapshot = await adminDb.collection('support_tickets').get()
    const stats = {
      total: allSnapshot.size,
      open: allSnapshot.docs.filter(d => d.data().status === 'open').length,
      inProgress: allSnapshot.docs.filter(d => d.data().status === 'in_progress').length,
      resolved: allSnapshot.docs.filter(d => d.data().status === 'resolved').length,
    }

    return NextResponse.json({
      success: true,
      tickets,
      stats,
      pagination: {
        page,
        limit,
        total: stats.total,
        totalPages: Math.ceil(stats.total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching admin support tickets:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

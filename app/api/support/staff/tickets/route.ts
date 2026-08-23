import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { adminDb } from '@/lib/firebase/admin'
import { verifyAdminAuth } from '@/lib/firebase/admin-auth'

/**
 * GET: Fetch tickets assigned to the logged-in staff member
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdminAuth(request)
    if (!auth.success || !auth.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (auth.user.role !== 'support' && auth.user.role !== 'admin' && auth.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { uid } = auth.user
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    let query: any = adminDb.collection('support_tickets')
      .where('assignedTo', '==', uid)

    if (status && status !== 'all') {
      query = query.where('status', '==', status)
    }

    const snapshot = await query.orderBy('createdAt', 'desc').get()
    
    const tickets = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt,
    }))

    return NextResponse.json({
      success: true,
      tickets,
    })
  } catch (error: any) {
    console.error('Error fetching staff tickets:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

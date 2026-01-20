import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const status = searchParams.get('status')
    const type = searchParams.get('type')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    let query = adminDb
      .collection('abuse_reports')
      .where('reportedBy.id', '==', userId)
      .orderBy('createdAt', 'desc')

    // Apply filters
    if (status && status !== 'all') {
      query = query.where('status', '==', status)
    }
    if (type && type !== 'all') {
      query = query.where('type', '==', type)
    }

    const snapshot = await query.limit(50).get()
    
    const reports = snapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        type: data.type,
        reportedItem: data.reportedItem,
        category: data.category,
        reason: data.reason,
        description: data.description,
        status: data.status,
        priority: data.priority,
        resolution: data.resolution,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
      }
    })

    return NextResponse.json({
      success: true,
      reports
    })

  } catch (error) {
    console.error('Error fetching user reports:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    )
  }
}
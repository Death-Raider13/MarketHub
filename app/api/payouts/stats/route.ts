import { NextRequest, NextResponse } from 'next/server'
import { getAdminFirestore } from '@/lib/firebase/admin-simple'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const adminDb = getAdminFirestore()

    if (!adminDb) {
      console.error('Firebase Admin SDK not initialized')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const creatorId = searchParams.get('creatorId')
    const period = searchParams.get('period') || '30' // days

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(period))

    // Build query based on filters
    let payoutsQuery
    if (creatorId) {
      payoutsQuery = adminDb.collection('payoutRequests')
        .where('creatorId', '==', creatorId)
        .orderBy('requestedAt', 'desc')
    } else {
      payoutsQuery = adminDb.collection('payoutRequests')
        .orderBy('requestedAt', 'desc')
    }

    // Get all payouts
    const payoutsSnapshot = await payoutsQuery.get()
    const payouts = payoutsSnapshot.docs.map((doc: any) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        requestedAt: data.requestedAt?.toDate(),
        processedAt: data.processedAt?.toDate()
      }
    }) as any[]

    // Filter by date range
    const filteredPayouts = payouts.filter(payout => {
      const requestDate = payout.requestedAt
      return requestDate && requestDate >= startDate && requestDate <= endDate
    })

    // Calculate statistics
    const stats = {
      // Overall stats
      totalRequests: filteredPayouts.length,
      totalAmount: filteredPayouts.reduce((sum, p) => sum + (p.amount || 0), 0),

      // Status breakdown
      pending: {
        count: filteredPayouts.filter(p => p.status === 'pending').length,
        amount: filteredPayouts.filter(p => p.status === 'pending').reduce((sum, p) => sum + (p.amount || 0), 0)
      },
      approved: {
        count: filteredPayouts.filter(p => p.status === 'approved').length,
        amount: filteredPayouts.filter(p => p.status === 'approved').reduce((sum, p) => sum + (p.amount || 0), 0)
      },
      processing: {
        count: filteredPayouts.filter(p => p.status === 'processing').length,
        amount: filteredPayouts.filter(p => p.status === 'processing').reduce((sum, p) => sum + (p.amount || 0), 0)
      },
      completed: {
        count: filteredPayouts.filter(p => p.status === 'completed').length,
        amount: filteredPayouts.filter(p => p.status === 'completed').reduce((sum, p) => sum + (p.amount || 0), 0)
      },
      rejected: {
        count: filteredPayouts.filter(p => p.status === 'rejected').length,
        amount: filteredPayouts.filter(p => p.status === 'rejected').reduce((sum, p) => sum + (p.amount || 0), 0)
      },

      // Payment method breakdown
      paymentMethods: {
        bank_transfer: filteredPayouts.filter(p => p.paymentMethod === 'bank_transfer').length,
        mobile_money: filteredPayouts.filter(p => p.paymentMethod === 'mobile_money').length,
        paypal: filteredPayouts.filter(p => p.paymentMethod === 'paypal').length
      },

      // Time-based stats
      averageProcessingTime: calculateAverageProcessingTime(filteredPayouts),

      // Recent activity (last 7 days)
      recentActivity: getRecentActivity(payouts),

      // Top creators (if not filtering by creator)
      ...(creatorId ? {} : { topcreators: getTopcreators(filteredPayouts) })
    }

    return NextResponse.json({
      success: true,
      stats,
      period: parseInt(period),
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      }
    })

  } catch (error) {
    console.error('Error fetching payout statistics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payout statistics' },
      { status: 500 }
    )
  }
}

function calculateAverageProcessingTime(payouts: any[]): number {
  const processedPayouts = payouts.filter(p =>
    p.status === 'completed' && p.requestedAt && p.processedAt
  )

  if (processedPayouts.length === 0) return 0

  const totalTime = processedPayouts.reduce((sum, p) => {
    const requestTime = new Date(p.requestedAt).getTime()
    const processTime = new Date(p.processedAt).getTime()
    return sum + (processTime - requestTime)
  }, 0)

  // Return average time in hours
  return Math.round(totalTime / processedPayouts.length / (1000 * 60 * 60))
}

function getRecentActivity(payouts: any[]): any[] {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  return payouts
    .filter(p => {
      const date = p.processedAt || p.requestedAt
      return date && new Date(date) >= sevenDaysAgo
    })
    .sort((a, b) => {
      const dateA = new Date(a.processedAt || a.requestedAt)
      const dateB = new Date(b.processedAt || b.requestedAt)
      return dateB.getTime() - dateA.getTime()
    })
    .slice(0, 10)
    .map(p => ({
      id: p.id,
      creatorName: p.creatorName,
      amount: p.amount,
      status: p.status,
      date: p.processedAt || p.requestedAt
    }))
}

function getTopcreators(payouts: any[]): any[] {
  const creatorstats = new Map()

  payouts.forEach(p => {
    if (!creatorstats.has(p.creatorId)) {
      creatorstats.set(p.creatorId, {
        creatorId: p.creatorId,
        creatorName: p.creatorName,
        creatorEmail: p.creatorEmail,
        totalRequests: 0,
        totalAmount: 0,
        completedAmount: 0
      })
    }

    const stats = creatorstats.get(p.creatorId)
    stats.totalRequests++
    stats.totalAmount += p.amount || 0

    if (p.status === 'completed') {
      stats.completedAmount += p.amount || 0
    }
  })

  return Array.from(creatorstats.values())
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, 10)
}
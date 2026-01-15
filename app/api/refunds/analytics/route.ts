import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { startOfMonth, endOfMonth, subMonths, format, startOfDay, endOfDay } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '6months'
    const vendorId = searchParams.get('vendorId')

    // Calculate date ranges
    const now = new Date()
    const monthsBack = timeRange === '3months' ? 3 : timeRange === '6months' ? 6 : 12
    const startDate = subMonths(now, monthsBack)

    let refundsQuery = adminDb.collection('refunds')
      .where('createdAt', '>=', startDate)
      .orderBy('createdAt', 'desc')

    if (vendorId) {
      refundsQuery = refundsQuery.where('vendorId', '==', vendorId)
    }

    const refundsSnapshot = await refundsQuery.get()
    const refunds = refundsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date()
    }))

    // Calculate overall stats
    const totalRefunds = refunds.length
    const totalRefundAmount = refunds.reduce((sum: number, refund: any) => 
      sum + (refund.amount || 0), 0
    )
    const completedRefunds = refunds.filter((r: any) => r.status === 'refunded').length
    const completedRefundAmount = refunds
      .filter((r: any) => r.status === 'refunded')
      .reduce((sum: number, refund: any) => sum + (refund.amount || 0), 0)

    const pendingRefunds = refunds.filter((r: any) => r.status === 'pending').length
    const rejectedRefunds = refunds.filter((r: any) => r.status === 'rejected').length
    const failedRefunds = refunds.filter((r: any) => r.status === 'failed').length

    // Calculate refund rate (need orders data)
    let refundRate = 0
    let totalOrders = 0
    let totalOrderAmount = 0

    try {
      let ordersQuery = adminDb.collection('orders')
        .where('createdAt', '>=', startDate)
        .where('paymentStatus', 'in', ['paid', 'completed'])

      if (vendorId) {
        ordersQuery = ordersQuery.where('vendorId', '==', vendorId)
      }

      const ordersSnapshot = await ordersQuery.get()
      totalOrders = ordersSnapshot.size
      totalOrderAmount = ordersSnapshot.docs.reduce((sum: number, doc: any) => {
        const data = doc.data()
        return sum + (data.totalAmount || data.total || 0)
      }, 0)

      if (totalOrders > 0) {
        refundRate = (totalRefunds / totalOrders) * 100
      }
    } catch (error) {
      console.error('Error calculating refund rate:', error)
    }

    // Monthly breakdown
    const monthlyData: { [key: string]: {
      refunds: number
      amount: number
      completed: number
      completedAmount: number
      pending: number
      rejected: number
    } } = {}

    for (let i = 0; i < monthsBack; i++) {
      const monthStart = startOfMonth(subMonths(now, i))
      const monthKey = format(monthStart, 'MMM yyyy')
      monthlyData[monthKey] = {
        refunds: 0,
        amount: 0,
        completed: 0,
        completedAmount: 0,
        pending: 0,
        rejected: 0
      }
    }

    refunds.forEach((refund: any) => {
      const monthKey = format(refund.createdAt, 'MMM yyyy')
      if (monthlyData[monthKey]) {
        monthlyData[monthKey].refunds++
        monthlyData[monthKey].amount += refund.amount || 0

        if (refund.status === 'refunded') {
          monthlyData[monthKey].completed++
          monthlyData[monthKey].completedAmount += refund.amount || 0
        } else if (refund.status === 'pending') {
          monthlyData[monthKey].pending++
        } else if (refund.status === 'rejected') {
          monthlyData[monthKey].rejected++
        }
      }
    })

    const monthlyRefunds = Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        ...data
      }))
      .reverse()

    // Refund reasons analysis
    const reasonsMap: { [key: string]: number } = {}
    refunds.forEach((refund: any) => {
      if (refund.reason) {
        const reason = refund.reason.toLowerCase()
        // Categorize common reasons
        if (reason.includes('defective') || reason.includes('damaged') || reason.includes('broken')) {
          reasonsMap['Product Defective'] = (reasonsMap['Product Defective'] || 0) + 1
        } else if (reason.includes('wrong') || reason.includes('incorrect') || reason.includes('mistake')) {
          reasonsMap['Wrong Item'] = (reasonsMap['Wrong Item'] || 0) + 1
        } else if (reason.includes('late') || reason.includes('delay') || reason.includes('slow')) {
          reasonsMap['Late Delivery'] = (reasonsMap['Late Delivery'] || 0) + 1
        } else if (reason.includes('quality') || reason.includes('poor')) {
          reasonsMap['Poor Quality'] = (reasonsMap['Poor Quality'] || 0) + 1
        } else if (reason.includes('changed mind') || reason.includes('no longer need')) {
          reasonsMap['Changed Mind'] = (reasonsMap['Changed Mind'] || 0) + 1
        } else {
          reasonsMap['Other'] = (reasonsMap['Other'] || 0) + 1
        }
      }
    })

    const refundReasons = Object.entries(reasonsMap)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)

    // Payment method breakdown
    const paymentMethodsMap: { [key: string]: { count: number; amount: number } } = {}
    refunds.forEach((refund: any) => {
      const method = refund.paymentMethod || 'unknown'
      if (!paymentMethodsMap[method]) {
        paymentMethodsMap[method] = { count: 0, amount: 0 }
      }
      paymentMethodsMap[method].count++
      paymentMethodsMap[method].amount += refund.amount || 0
    })

    const paymentMethods = Object.entries(paymentMethodsMap)
      .map(([method, data]) => ({ method, ...data }))
      .sort((a, b) => b.count - a.count)

    // Processing time analysis
    const processingTimes: number[] = []
    refunds.forEach((refund: any) => {
      if (refund.status === 'refunded' && refund.refundedAt && refund.createdAt) {
        const refundedAt = refund.refundedAt?.toDate ? refund.refundedAt.toDate() : new Date(refund.refundedAt)
        const createdAt = refund.createdAt?.toDate ? refund.createdAt.toDate() : new Date(refund.createdAt)
        const processingTime = (refundedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24) // days
        processingTimes.push(processingTime)
      }
    })

    const avgProcessingTime = processingTimes.length > 0 
      ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length
      : 0

    // Recent refunds
    const recentRefunds = refunds
      .slice(0, 10)
      .map((refund: any) => ({
        id: refund.id,
        orderId: refund.orderId,
        amount: refund.amount,
        status: refund.status,
        reason: refund.reason,
        paymentMethod: refund.paymentMethod,
        createdAt: refund.createdAt,
      }))

    return NextResponse.json({
      success: true,
      analytics: {
        overview: {
          totalRefunds,
          totalRefundAmount,
          completedRefunds,
          completedRefundAmount,
          pendingRefunds,
          rejectedRefunds,
          failedRefunds,
          refundRate: Math.round(refundRate * 100) / 100,
          avgProcessingTime: Math.round(avgProcessingTime * 100) / 100,
          totalOrders,
          totalOrderAmount,
        },
        monthlyRefunds,
        refundReasons,
        paymentMethods,
        recentRefunds,
        timeRange,
        generatedAt: new Date().toISOString(),
      }
    })
  } catch (error) {
    console.error('Error generating refund analytics:', error)
    return NextResponse.json(
      { error: 'Failed to generate analytics' },
      { status: 500 }
    )
  }
}
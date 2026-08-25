import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { verifyAuthToken } from '@/lib/api-auth'
import { NotificationTriggers } from '@/lib/notifications/triggers'

export async function POST(request: NextRequest) {
  const auth = await verifyAuthToken(request)
  if ('error' in auth) return auth.error

  try {
    const { orderId, customerId, creatorId, amount } = await request.json()

    if (!orderId || !customerId || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'orderId, customerId, and a positive amount are required' },
        { status: 400 }
      )
    }

    await NotificationTriggers.onOrderPlaced(orderId, customerId, creatorId, amount)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to send order notifications:', error)
    return NextResponse.json({ error: 'Failed to send order notifications' }, { status: 500 })
  }
}

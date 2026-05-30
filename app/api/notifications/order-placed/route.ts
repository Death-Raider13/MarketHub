import { NextRequest, NextResponse } from 'next/server'
import { verifyAuthToken } from '@/lib/api-auth'
import { NotificationTriggers } from '@/lib/notifications/triggers'

export async function POST(request: NextRequest) {
  const auth = await verifyAuthToken(request)
  if ('error' in auth) return auth.error

  try {
    const { orderId, customerId, creatorId, amount } = await request.json()

    if (!orderId || !customerId || !creatorId || typeof amount !== 'number') {
      return NextResponse.json(
        { error: 'orderId, customerId, creatorId, and amount are required' },
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

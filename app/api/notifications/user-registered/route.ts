import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { verifyAuthToken } from '@/lib/api-auth'
import { NotificationTriggers } from '@/lib/notifications/triggers'

export async function POST(request: NextRequest) {
  const auth = await verifyAuthToken(request)
  if ('error' in auth) return auth.error

  try {
    const { userId, userName, userRole } = await request.json()

    if (!userId || !userName || !userRole) {
      return NextResponse.json({ error: 'userId, userName, and userRole are required' }, { status: 400 })
    }

    if (auth.user.uid !== userId) {
      return NextResponse.json({ error: 'Unauthorized user' }, { status: 401 })
    }

    await NotificationTriggers.onUserRegistration(userId, userName, userRole)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to trigger user registration notifications:', error)
    return NextResponse.json({ error: 'Failed to trigger notifications' }, { status: 500 })
  }
}

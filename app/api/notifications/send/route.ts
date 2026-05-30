import { NextRequest, NextResponse } from 'next/server'
import { verifyAuthToken } from '@/lib/api-auth'
import { createAdminNotification } from '@/lib/notifications/admin-service'

export async function POST(request: NextRequest) {
  const auth = await verifyAuthToken(request)
  if ('error' in auth) return auth.error

  try {
    const { recipientId, type, customData } = await request.json()

    if (!recipientId || !type) {
      return NextResponse.json({ error: 'recipientId and type are required' }, { status: 400 })
    }

    const notificationId = await createAdminNotification(recipientId, type, customData)
    return NextResponse.json({ success: true, notificationId })
  } catch (error) {
    console.error('Failed to send notification:', error)
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/firebase/admin-auth'
import { createAdminRoleNotification } from '@/lib/notifications/admin-service'

export async function POST(request: NextRequest) {
  const authResult = await verifyAdminAuth(request)
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error || 'Unauthorized' }, { status: 401 })
  }

  try {
    const { targetRoles, type, customData } = await request.json()

    if (!Array.isArray(targetRoles) || targetRoles.length === 0 || !type) {
      return NextResponse.json(
        { error: 'targetRoles and type are required' },
        { status: 400 }
      )
    }

    await createAdminRoleNotification(targetRoles, type, customData)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to send admin notification:', error)
    return NextResponse.json({ error: 'Failed to send admin notification' }, { status: 500 })
  }
}

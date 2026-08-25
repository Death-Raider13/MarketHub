import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { getAdminFirestore } from '@/lib/firebase/admin-simple'
import { requireAdmin } from '@/lib/api-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SETTINGS_FIELDS = [
  'platformName', 'platformEmail', 'platformPhone', 'platformDescription', 'platformLogo', 'platformFavicon',
  'creatorCommission', 'transactionFee', 'minimumPayout', 'payoutSchedule',
  'smtpHost', 'smtpPort', 'smtpUsername', 'smtpPassword',
  'twoFactorAuth', 'passwordMinLength', 'sessionTimeout', 'maxLoginAttempts',
  'creatorRegistration', 'customerReviews', 'guestCheckout', 'socialLogin', 'wishlist',
  'maintenanceMode', 'maintenanceMessage',
  'adminEmailNotifications', 'newcreatorAlerts', 'newOrderAlerts', 'reportedContentAlerts',
] as const

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

function cleanSettings(body: Record<string, unknown>) {
  return Object.fromEntries(SETTINGS_FIELDS
    .filter((field) => body[field] !== undefined)
    .map((field) => [field, body[field]]))
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, ['admin', 'super_admin'])
  if ('error' in auth) return auth.error
  const db = getAdminFirestore()
  if (!db) return errorResponse('Server configuration error', 500)
  try {
    const snapshot = await db.collection('platform_settings').doc('config').get()
    return NextResponse.json({ settings: snapshot.exists ? snapshot.data() : {} })
  } catch (error) {
    console.error('Failed to load admin settings:', error)
    return errorResponse('Failed to load settings', 500)
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireAdmin(request, ['admin', 'super_admin'])
  if ('error' in auth) return auth.error
  const db = getAdminFirestore()
  if (!db) return errorResponse('Server configuration error', 500)
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return errorResponse('Invalid JSON request body', 400)
  }
  const settings = cleanSettings(body)
  await db.collection('platform_settings').doc('config').set({
    ...settings,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: auth.user.uid,
  }, { merge: true })
  return NextResponse.json({ success: true })
}

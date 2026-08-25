import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { getAdminFirestore } from '@/lib/firebase/admin-simple'
import { requireAdmin } from '@/lib/api-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function serialise(value: unknown): unknown {
  if (value && typeof value === 'object' && typeof (value as { toDate?: unknown }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate().toISOString()
  }
  if (Array.isArray(value)) return value.map(serialise)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, serialise(item)]))
  }
  return value
}

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

async function requireAdvertisingAdmin(request: NextRequest) {
  const result = await requireAdmin(request, ['admin', 'super_admin', 'moderator'])
  if ('error' in result) return result
  return result
}

export async function GET(request: NextRequest) {
  const auth = await requireAdvertisingAdmin(request)
  if ('error' in auth) return auth.error
  const db = getAdminFirestore()
  if (!db) return errorResponse('Server configuration error', 500)

  try {
    const status = new URL(request.url).searchParams.get('status')
    let query = db.collection('adCampaigns').orderBy('createdAt', 'desc') as FirebaseFirestore.Query
    if (status && status !== 'all') query = query.where('status', '==', status)
    const snapshot = await query.limit(500).get()
    const advertiserIds = Array.from(new Set(snapshot.docs.map((doc) => doc.data().advertiserId).filter((id): id is string => typeof id === 'string')))
    const advertiserNames = new Map<string, string>()
    await Promise.all(advertiserIds.slice(0, 10).map(async (id) => {
      const advertiser = await db.collection('advertisers').doc(id).get()
      const data = advertiser.data()
      if (data) advertiserNames.set(id, String(data.companyName || data.businessName || data.name || id))
    }))

    const campaigns = snapshot.docs.map((doc) => {
      const data = serialise(doc.data()) as Record<string, unknown>
      return {
        id: doc.id,
        ...data,
        advertiserInfo: {
          ...((data.advertiserInfo && typeof data.advertiserInfo === 'object') ? data.advertiserInfo : {}),
          companyName: advertiserNames.get(String(data.advertiserId || '')) || 'Unknown advertiser',
        },
      }
    })
    return NextResponse.json({ campaigns })
  } catch (error) {
    console.error('Admin advertising list failed:', error)
    return errorResponse('Failed to fetch campaigns', 500)
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdvertisingAdmin(request)
  if ('error' in auth) return auth.error
  const db = getAdminFirestore()
  if (!db) return errorResponse('Server configuration error', 500)

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return errorResponse('Invalid JSON request body', 400)
  }
  const campaignId = typeof body.campaignId === 'string' ? body.campaignId : ''
  const action = typeof body.action === 'string' ? body.action : ''
  if (!campaignId || !['approve', 'reject', 'pause', 'resume'].includes(action)) {
    return errorResponse('Campaign ID and valid action are required', 400)
  }

  const ref = db.collection('adCampaigns').doc(campaignId)
  const current = await ref.get()
  if (!current.exists) return errorResponse('Campaign not found', 404)

  const updates: FirebaseFirestore.UpdateData<FirebaseFirestore.DocumentData> = {
    updatedAt: FieldValue.serverTimestamp(),
    reviewedBy: auth.user.uid,
  }
  if (action === 'approve') {
    updates.status = 'active'
    updates.reviewedAt = FieldValue.serverTimestamp()
    updates.reviewReason = typeof body.reason === 'string' ? body.reason.slice(0, 500) : ''
  } else if (action === 'reject') {
    updates.status = 'rejected'
    updates.reviewedAt = FieldValue.serverTimestamp()
    updates.reviewReason = typeof body.reason === 'string' ? body.reason.slice(0, 500) : ''
  } else {
    updates.status = action === 'pause' ? 'paused' : 'active'
  }
  await ref.update(updates)
  return NextResponse.json({ success: true, campaignId, status: updates.status })
}

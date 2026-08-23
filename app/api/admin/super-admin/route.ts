import { NextRequest, NextResponse } from 'next/server'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase/admin-simple'
import { requireAdmin } from '@/lib/api-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ADMIN_ROLES = new Set(['admin', 'moderator', 'support'])

function requestMeta(request: NextRequest) {
  return {
    ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
  }
}

async function audit(
  db: FirebaseFirestore.Firestore,
  admin: { uid: string; email?: string; role: string },
  action: string,
  targetId: string,
  details: Record<string, unknown>,
  request: NextRequest,
  success = true,
  errorMessage?: string,
) {
  const meta = requestMeta(request)
  await db.collection('audit_logs').add({
    action,
    adminId: admin.uid,
    adminEmail: admin.email || '',
    adminRole: admin.role,
    targetType: action.startsWith('system.') ? 'system' : 'admin',
    targetId,
    details,
    ...meta,
    success,
    ...(errorMessage ? { errorMessage } : {}),
    timestamp: FieldValue.serverTimestamp(),
  })
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

function serialise(value: unknown): unknown {
  if (value && typeof value === 'object' && typeof (value as { toDate?: unknown }).toDate === 'function') {
    return { __type: 'timestamp', value: (value as { toDate: () => Date }).toDate().toISOString() }
  }
  if (Array.isArray(value)) return value.map(serialise)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, serialise(item)]))
  }
  if (typeof value === 'bigint') return value.toString()
  return value
}

function deserialise(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(deserialise)
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    if (record.__type === 'timestamp' && typeof record.value === 'string') return Timestamp.fromDate(new Date(record.value))
    return Object.fromEntries(Object.entries(record).map(([key, item]) => [key, deserialise(item)]))
  }
  return value
}

async function createAdminInvite(
  db: FirebaseFirestore.Firestore,
  auth: NonNullable<ReturnType<typeof getAdminAuth>>,
  admin: { uid: string; email?: string; role: string },
  request: NextRequest,
  body: Record<string, unknown>,
) {
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const displayName = typeof body.displayName === 'string' ? body.displayName.trim() : ''
  const role = typeof body.role === 'string' ? body.role : ''

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) return jsonError('A valid email is required', 400)
  if (!displayName || displayName.length > 120) return jsonError('A valid display name is required', 400)
  if (!ADMIN_ROLES.has(role)) return jsonError('Only admin, moderator, or support roles may be invited', 400)

  let createdUid: string | undefined
  try {
    const created = await auth.createUser({ email, displayName, disabled: false, emailVerified: false })
    createdUid = created.uid
    await auth.setCustomUserClaims(created.uid, { role })
    await db.collection('users').doc(created.uid).set({
      uid: created.uid,
      email,
      displayName,
      role,
      status: 'active',
      emailVerified: false,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })

    const inviteLink = await auth.generatePasswordResetLink(email, {
      url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/login`,
      handleCodeInApp: false,
    })
    await audit(db, admin, 'admin.create', created.uid, { email, role }, request)
    return NextResponse.json({ success: true, uid: created.uid, inviteLink })
  } catch (error) {
    if (createdUid) {
      try { await auth.deleteUser(createdUid) } catch (rollbackError) {
        console.error('Failed to roll back invited admin:', rollbackError)
      }
    }
    console.error('Failed to create admin invite:', error)
    return jsonError('Failed to create admin invitation', 500)
  }
}

async function updateAdminStatus(
  db: FirebaseFirestore.Firestore,
  auth: NonNullable<ReturnType<typeof getAdminAuth>>,
  admin: { uid: string; email?: string; role: string },
  request: NextRequest,
  body: Record<string, unknown>,
) {
  const targetId = typeof body.targetId === 'string' ? body.targetId : ''
  const status = body.status === 'suspended' ? 'suspended' : body.status === 'active' ? 'active' : ''
  if (!targetId || !status) return jsonError('Target admin and valid status are required', 400)
  if (targetId === admin.uid) return jsonError('You cannot suspend or deactivate your own account', 400)

  const targetRef = db.collection('users').doc(targetId)
  const target = await targetRef.get()
  if (!target.exists || !['admin', 'super_admin', 'moderator', 'support'].includes(String(target.data()?.role))) {
    return jsonError('Target admin not found', 404)
  }
  if (target.data()?.role === 'super_admin') return jsonError('Super-admin accounts require a separate protected process', 403)

  await targetRef.update({ status, updatedAt: FieldValue.serverTimestamp() })
  await auth.updateUser(targetId, { disabled: status === 'suspended' })
  await audit(db, admin, status === 'suspended' ? 'admin.edit' : 'admin.edit', targetId, { status }, request)
  return NextResponse.json({ success: true, targetId, status })
}

async function updateCommission(
  db: FirebaseFirestore.Firestore,
  admin: { uid: string; email?: string; role: string },
  request: NextRequest,
  body: Record<string, unknown>,
) {
  const rate = Number(body.rate)
  if (!Number.isFinite(rate) || rate < 0 || rate > 100) return jsonError('Commission rate must be between 0 and 100', 400)
  await db.collection('platform_settings').doc('config').set({
    platformCommissionRate: rate,
    platformCommission: rate,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: admin.uid,
  }, { merge: true })
  await audit(db, admin, 'commission.change', 'platform_settings/config', { rate }, request)
  return NextResponse.json({ success: true, rate })
}

async function restoreBackup(
  db: FirebaseFirestore.Firestore,
  admin: { uid: string; email?: string; role: string },
  request: NextRequest,
  body: Record<string, unknown>,
) {
  const backup = body.backup
  if (!backup || typeof backup !== 'object') return jsonError('A backup payload is required', 400)
  const backupRecord = backup as Record<string, unknown>
  if (backupRecord.format !== 'markethub-firestore-logical-backup' || backupRecord.version !== 1) {
    return jsonError('Unsupported or invalid MarketHub backup format', 400)
  }
  const collections = backupRecord.collections
  if (!collections || typeof collections !== 'object' || Array.isArray(collections)) return jsonError('Backup collections are missing', 400)

  let documentCount = 0
  let batch = db.batch()
  let batchOperations = 0
  const commits: Promise<FirebaseFirestore.WriteResult[]>[] = []
  for (const [collectionId, value] of Object.entries(collections as Record<string, unknown>)) {
    if (collectionId === 'audit_logs') continue
    if (!/^[A-Za-z0-9_-]+$/.test(collectionId) || !Array.isArray(value)) return jsonError('Backup contains an invalid collection', 400)
    for (const item of value) {
      if (!item || typeof item !== 'object') return jsonError('Backup contains an invalid document', 400)
      const record = item as Record<string, unknown>
      if (typeof record.id !== 'string' || !/^[^/]{1,150}$/.test(record.id) || !record.data || typeof record.data !== 'object') {
        return jsonError('Backup contains an invalid document record', 400)
      }
      documentCount += 1
      if (documentCount > 50000) return jsonError('Backup is too large to restore through the admin console', 413)
      batch.set(db.collection(collectionId).doc(record.id), deserialise(record.data) as FirebaseFirestore.DocumentData, { merge: true })
      batchOperations += 1
      if (batchOperations === 450) {
        commits.push(batch.commit())
        batch = db.batch()
        batchOperations = 0
      }
    }
  }
  if (batchOperations > 0) commits.push(batch.commit())
  await Promise.all(commits)
  await audit(db, admin, 'system.restore', 'firestore', { documentCount, skippedCollections: ['audit_logs'] }, request)
  return NextResponse.json({ success: true, documentCount, skippedCollections: ['audit_logs'] })
}

async function updateMaintenance(
  db: FirebaseFirestore.Firestore,
  admin: { uid: string; email?: string; role: string },
  request: NextRequest,
  body: Record<string, unknown>,
) {
  if (typeof body.enabled !== 'boolean') return jsonError('Maintenance state must be boolean', 400)
  await db.collection('platform_settings').doc('config').set({
    maintenanceMode: body.enabled,
    maintenanceUpdatedAt: FieldValue.serverTimestamp(),
    maintenanceUpdatedBy: admin.uid,
  }, { merge: true })
  await audit(db, admin, 'system.maintenance', 'platform_settings/config', { enabled: body.enabled }, request)
  return NextResponse.json({ success: true, enabled: body.enabled })
}

async function invalidateCache(
  db: FirebaseFirestore.Firestore,
  admin: { uid: string; email?: string; role: string },
  request: NextRequest,
) {
  const invalidatedAt = new Date().toISOString()
  await db.collection('platform_settings').doc('config').set({
    cacheInvalidatedAt: invalidatedAt,
    cacheInvalidatedBy: admin.uid,
  }, { merge: true })
  await audit(db, admin, 'system.maintenance', 'cache', { invalidatedAt }, request)
  return NextResponse.json({ success: true, invalidatedAt })
}

async function createBackup(
  db: FirebaseFirestore.Firestore,
  admin: { uid: string; email?: string; role: string },
  request: NextRequest,
) {
  const collections = await db.listCollections()
  const backup: Record<string, unknown> = {
    format: 'markethub-firestore-logical-backup',
    version: 1,
    generatedAt: new Date().toISOString(),
    generatedBy: admin.uid,
    collections: {},
  }
  const output = backup.collections as Record<string, unknown>
  let documentCount = 0

  for (const collection of collections) {
    const snapshot = await collection.get()
    output[collection.id] = snapshot.docs.map((item) => {
      documentCount += 1
      return { id: item.id, data: serialise(item.data()) }
    })
  }

  await audit(db, admin, 'system.backup', 'firestore', { collectionCount: collections.length, documentCount }, request)
  const body = JSON.stringify(backup)
  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="markethub-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json"`,
      'Cache-Control': 'no-store',
      'X-MarketHub-Backup-Documents': String(documentCount),
    },
  })
}

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request, ['super_admin'])
  if ('error' in authResult) return authResult.error

  const db = getAdminFirestore()
  const auth = getAdminAuth()
  if (!db || !auth) return jsonError('Server administration is not configured', 500)

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return jsonError('Invalid JSON request body', 400)
  }

  const action = body.action
  if (action === 'create-admin') return createAdminInvite(db, auth, authResult.user, request, body)
  if (action === 'update-status') return updateAdminStatus(db, auth, authResult.user, request, body)
  if (action === 'update-commission') return updateCommission(db, authResult.user, request, body)
  if (action === 'backup') return createBackup(db, authResult.user, request)
  if (action === 'restore') return restoreBackup(db, authResult.user, request, body)
  if (action === 'maintenance') return updateMaintenance(db, authResult.user, request, body)
  if (action === 'clear-cache') return invalidateCache(db, authResult.user, request)
  return jsonError('Unknown super-admin action', 400)
}

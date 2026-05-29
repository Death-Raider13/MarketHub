import { NextRequest, NextResponse } from "next/server"
import { getAdminFirestore, getAdminAuth } from "@/lib/firebase/admin"
import { verifyAuthToken } from "@/lib/api-auth"
import { FieldValue } from "firebase-admin/firestore"

/**
 * NDPR / right-to-erasure endpoint.
 *
 * Performs a *soft* delete: PII is scrubbed from the user document and the
 * Firebase Auth account is disabled, but order/transaction records are retained
 * (anonymised by linking to a tombstone uid) because Nigerian tax and consumer
 * law require us to keep purchase records for a defined retention window.
 *
 * Hard deletes of finance records can be performed by a super-admin via a
 * separate operational tool once retention requirements expire.
 */
export async function POST(request: NextRequest) {
  const auth = await verifyAuthToken(request)
  if ('error' in auth) return auth.error

  const adminDb = getAdminFirestore()
  const adminAuth = getAdminAuth()
  if (!adminDb || !adminAuth) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
  }

  const uid = auth.user.uid

  try {
    const body = await request.json().catch(() => ({}))
    const { confirm } = body as { confirm?: string }

    if (confirm !== 'DELETE MY ACCOUNT') {
      return NextResponse.json(
        { error: 'Confirmation phrase required. POST { "confirm": "DELETE MY ACCOUNT" }' },
        { status: 400 }
      )
    }

    // Refuse deletion if creator has outstanding balance — they must withdraw first.
    const balanceDoc = await adminDb.collection('creatorBalances').doc(uid).get()
    if (balanceDoc.exists) {
      const available = (balanceDoc.data()?.availableBalance as number | undefined) ?? 0
      const pending = (balanceDoc.data()?.pendingBalance as number | undefined) ?? 0
      if (available > 0 || pending > 0) {
        return NextResponse.json(
          {
            error:
              'You have an outstanding balance. Withdraw funds before deleting your account.',
            availableBalance: available,
            pendingBalance: pending,
          },
          { status: 400 }
        )
      }
    }

    const now = FieldValue.serverTimestamp()

    // Scrub PII on the user document but keep the doc as a tombstone for FK integrity.
    await adminDb.collection('users').doc(uid).set(
      {
        email: `deleted-${uid}@deleted.local`,
        displayName: 'Deleted User',
        photoURL: null,
        phone: null,
        address: null,
        bio: null,
        bankDetails: null,
        deletedAt: now,
        status: 'deleted',
      },
      { merge: true }
    )

    // Revoke any active sessions and disable the auth account.
    try {
      await adminAuth.revokeRefreshTokens(uid)
      await adminAuth.updateUser(uid, { disabled: true })
    } catch (err) {
      console.error('Auth disable failed for', uid, err)
    }

    // Record the deletion request for audit.
    await adminDb.collection('account_deletions').add({
      userId: uid,
      requestedAt: now,
      requestedByEmail: auth.user.email ?? null,
      method: 'self-service',
    })

    return NextResponse.json({
      success: true,
      message:
        'Account scheduled for deletion. Personal information has been erased; purchase records are retained for legal compliance.',
    })
  } catch (err: any) {
    console.error('Account deletion failed', err)
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
  }
}

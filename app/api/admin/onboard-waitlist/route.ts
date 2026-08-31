import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { FieldValue } from 'firebase-admin/firestore'
import { getAdminFirestore, getAdminAuth } from '@/lib/firebase/admin-simple'
import { verifyAuthToken } from '@/lib/api-auth'
import { sendWaitlistOnboardingEmail } from '@/lib/email/service'

export async function POST(request: NextRequest) {
  const authUser = await verifyAuthToken(request)
  if ('error' in authUser) return authUser.error

  const db = getAdminFirestore()
  const auth = getAdminAuth()
  if (!db || !auth) return NextResponse.json({ error: 'Database or Auth service unavailable' }, { status: 500 })

  try {
    const adminDoc = await db.collection('users').doc(authUser.user.uid).get()
    const adminRole = adminDoc.data()?.role
    if (!['admin', 'super_admin'].includes(adminRole)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const snapshot = await db.collection('waitlist').get()
    if (snapshot.empty) {
      return NextResponse.json({ message: 'No waitlist members found.' }, { status: 200 })
    }

    const memberMap = new Map<string, { email: string; role: string; createdAt: any }>()
    snapshot.forEach((doc: any) => {
      const data = doc.data() || {}
      const email = data.email?.toLowerCase().trim()
      if (!email) return

      if (!memberMap.has(email)) {
        memberMap.set(email, {
          email,
          role: data.role || 'customer',
          createdAt: data.createdAt || new Date()
        })
      } else {
        const existing = memberMap.get(email)!
        if (data.role === 'creator') existing.role = 'creator'
        else if ((data.role === 'affiliate' || data.role === 'promoter') && existing.role !== 'creator') existing.role = 'promoter'
      }
    })

    const uniqueMembers = Array.from(memberMap.values())
    const results: { email: string; status: 'created' | 'updated' | 'error'; error?: string }[] = []

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.fero-elibrary.shop'
    const actionCodeSettings = { url: `${appUrl}/auth/login` }

    for (const member of uniqueMembers) {
      try {
        let userRecord
        let isNew = false
        try {
          userRecord = await auth.getUserByEmail(member.email)
        } catch (err: any) {
          if (err.code === 'auth/user-not-found') {
            const displayName = member.email.split('@')[0]
            userRecord = await auth.createUser({
              email: member.email,
              displayName,
              emailVerified: true
            })
            isNew = true
          } else {
            throw err
          }
        }

        const systemRole = member.role === 'affiliate' ? 'promoter' : member.role
        const userRef = db.collection('users').doc(userRecord.uid)
        const userDoc = await userRef.get()

        const userData: any = {
          uid: userRecord.uid,
          email: member.email,
          displayName: userRecord.displayName || member.email.split('@')[0],
          role: userDoc.exists ? (userDoc.data()?.role || systemRole) : systemRole,
          waitlistMember: true,
          waitlistEligible: true,
          waitlistJoinedAt: member.createdAt,
          updatedAt: FieldValue.serverTimestamp()
        }

        if (!userDoc.exists) {
          userData.createdAt = FieldValue.serverTimestamp()
          if (systemRole === 'promoter') {
            userData.affiliateStatus = 'pending_payment'
            userData.affiliateAvailableBalance = 0;
            userData.affiliatePendingBalance = 0;
            userData.affiliateTotalWithdrawn = 0;
          } else if (systemRole === 'creator') {
            userData.creatorStatus = 'approved'
          }
        }

        await userRef.set(userData, { merge: true })

        const passwordResetLink = await auth.generatePasswordResetLink(member.email)

        await sendWaitlistOnboardingEmail({
          email: member.email,
          role: systemRole,
          passwordResetLink
        }).catch(err => console.error(`Failed sending waitlist email to ${member.email}:`, err))

        results.push({ email: member.email, status: isNew ? 'created' : 'updated' })
      } catch (err: any) {
        results.push({ email: member.email, status: 'error', error: err.message })
      }
    }

    return NextResponse.json({
      success: true,
      totalCount: uniqueMembers.length,
      processed: results.length,
      results
    })
  } catch (error: any) {
    console.error('Waitlist onboarding error:', error)
    return NextResponse.json({ error: error.message || 'Unable to onboard waitlist members' }, { status: 500 })
  }
}

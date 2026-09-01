import { NextRequest, NextResponse } from 'next/server'
import { getAdminFirestore, getAdminAuth } from '@/lib/firebase/admin'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    const adminAuth = getAdminAuth()
    if (!adminAuth) {
      return NextResponse.json({ error: 'Admin Auth unavailable' }, { status: 500 })
    }
    const decodedToken = await adminAuth.verifyIdToken(token)
    const uid = decodedToken.uid

    const body = await request.json()
    const { role, displayName, referredByCode } = body

    if (!role || !['customer', 'creator', 'promoter'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role specified' }, { status: 400 })
    }

    const adminDb = getAdminFirestore()
    if (!adminDb) {
      return NextResponse.json({ error: 'Admin Database unavailable' }, { status: 500 })
    }
    const userRef = adminDb.collection('users').doc(uid)

    const updatePayload: Record<string, any> = {
      role,
      activeRole: role,
      displayName: displayName ? String(displayName).trim() : '',
      updatedAt: new Date(),
    }

    if (role === 'creator') {
      updatePayload.verified = false
      updatePayload.commission = 10
    } else if (role === 'promoter') {
      updatePayload.affiliateStatus = 'approved'
      updatePayload.referralCode = `FERO${uid.slice(0, 6).toUpperCase()}`
    }

    if (referredByCode) {
      updatePayload.referredByCode = String(referredByCode).trim().toUpperCase()
    }

    await userRef.set(updatePayload, { merge: true })

    return NextResponse.json({ success: true, message: 'Profile onboarded successfully' })
  } catch (error: any) {
    console.error('Error completing onboarding via API:', error)
    return NextResponse.json({ error: error.message || 'Failed to onboard profile' }, { status: 500 })
  }
}

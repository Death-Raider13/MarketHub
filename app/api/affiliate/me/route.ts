import { NextRequest, NextResponse } from 'next/server'
import { getAdminFirestore } from '@/lib/firebase/admin-simple'
import { verifyAuthToken } from '@/lib/api-auth'
import { getAffiliateByUid } from '@/lib/affiliate'

export const runtime = 'nodejs'

type AffiliateRecord = {
  id: string
  [key: string]: any
}

function serializeDoc(doc: any): AffiliateRecord {
  const data = doc.data() || {}
  return {
    id: doc.id,
    ...data,
    createdAt: data.createdAt?.toDate?.()?.toISOString?.() || data.createdAt || null,
    updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || data.updatedAt || null,
  }
}

export async function GET(request: NextRequest) {
  const auth = await verifyAuthToken(request)
  if ('error' in auth) return auth.error

  try {
    const affiliate = await getAffiliateByUid(auth.user.uid)
    if (!affiliate) {
      return NextResponse.json({ error: 'Affiliate promoter account not found' }, { status: 403 })
    }

    const db = getAdminFirestore()
    if (!db) return NextResponse.json({ error: 'Database not available' }, { status: 500 })

    const [userDoc, clicksSnapshot, conversionsSnapshot, payoutsSnapshot] = await Promise.all([
      db.collection('users').doc(auth.user.uid).get(),
      db.collection('affiliateClicks').where('affiliateId', '==', auth.user.uid).limit(100).get(),
      db.collection('affiliateConversions').where('affiliateId', '==', auth.user.uid).limit(100).get(),
      db.collection('affiliatePayoutRequests').where('affiliateId', '==', auth.user.uid).limit(50).get(),
    ])

    const user = userDoc.data() || {}
    const clicks = clicksSnapshot.docs.map(serializeDoc).sort((a: AffiliateRecord, b: AffiliateRecord) => String(b.createdAt).localeCompare(String(a.createdAt)))
    const conversions = conversionsSnapshot.docs.map(serializeDoc).sort((a: AffiliateRecord, b: AffiliateRecord) => String(b.createdAt).localeCompare(String(a.createdAt)))
    const payouts = payoutsSnapshot.docs.map(serializeDoc).sort((a: AffiliateRecord, b: AffiliateRecord) => String(b.createdAt).localeCompare(String(a.createdAt)))

    return NextResponse.json({
      success: true,
      affiliate: {
        id: affiliate.id,
        referralCode: affiliate.referralCode,
        commissionRate: affiliate.commissionRate,
        displayName: affiliate.displayName,
        email: affiliate.email,
        totalEarnings: Number(user.affiliateTotalEarnings ?? user.earnings ?? 0),
        availableBalance: Number(user.affiliateAvailableBalance ?? user.earnings ?? 0),
        pendingBalance: Number(user.affiliatePendingBalance ?? 0),
        conversionCount: Number(user.affiliateConversionCount ?? conversions.length),
        clickCount: clicks.length,
      },
      clicks,
      conversions,
      payouts,
    })
  } catch (error) {
    console.error('Affiliate summary error:', error)
    return NextResponse.json({ error: 'Unable to load affiliate dashboard' }, { status: 500 })
  }
}

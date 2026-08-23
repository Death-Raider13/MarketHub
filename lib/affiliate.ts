import { FieldValue } from 'firebase-admin/firestore'
import { randomUUID } from 'node:crypto'
import { getAdminFirestore } from '@/lib/firebase/admin-simple'

export const DEFAULT_AFFILIATE_RATE = 20
export const AFFILIATE_ATTRIBUTION_DAYS = 30

export interface AffiliateProfile {
  id: string
  referralCode: string
  commissionRate: number
  displayName?: string
  email?: string
}

export interface AffiliateConversionResult {
  created: boolean
  affiliateId?: string
  commissionAmount?: number
  commissionRate?: number
}

export function normalizeAffiliateCode(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const code = value.trim().toUpperCase()
  return /^[A-Z0-9_-]{3,50}$/.test(code) ? code : null
}

function commissionRate(value: unknown): number {
  const rate = Number(value)
  if (!Number.isFinite(rate)) return DEFAULT_AFFILIATE_RATE
  return Math.min(100, Math.max(0, rate))
}

export async function getAffiliateByCode(codeValue: unknown): Promise<AffiliateProfile | null> {
  const code = normalizeAffiliateCode(codeValue)
  if (!code) return null

  const db = getAdminFirestore()
  if (!db) return null

  const snapshot = await db
    .collection('users')
    .where('referralCode', '==', code)
    .limit(10)
    .get()

  if (snapshot.empty) return null
  const doc = snapshot.docs.find((candidate: any) => candidate.data()?.role === 'promoter')
  if (!doc) return null
  const data = doc.data()
  return {
    id: doc.id,
    referralCode: code,
    commissionRate: commissionRate(data.commission),
    displayName: data.displayName,
    email: data.email,
  }
}

export async function getAffiliateByUid(uid: string): Promise<AffiliateProfile | null> {
  const db = getAdminFirestore()
  if (!db || !uid) return null

  const doc = await db.collection('users').doc(uid).get()
  if (!doc.exists) return null
  const data = doc.data() || {}
  if (data.role !== 'promoter' || !normalizeAffiliateCode(data.referralCode)) return null

  return {
    id: uid,
    referralCode: normalizeAffiliateCode(data.referralCode) as string,
    commissionRate: commissionRate(data.commission),
    displayName: data.displayName,
    email: data.email,
  }
}

export async function recordAffiliateClick(input: {
  code: unknown
  productId: string
  clickId?: string | null
  userAgent?: string | null
  landingPath?: string | null
}): Promise<{ recorded: boolean; affiliateId?: string; productName?: string }> {
  const db = getAdminFirestore()
  if (!db || !input.productId) return { recorded: false }

  const affiliate = await getAffiliateByCode(input.code)
  if (!affiliate) return { recorded: false }

  const productDoc = await db.collection('products').doc(input.productId).get()
  if (!productDoc.exists) return { recorded: false }
  const product = productDoc.data() || {}
  if (!['active', 'approved'].includes(String(product.status))) return { recorded: false }

  const safeClickId = (input.clickId || randomUUID()).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80)
  const clickRef = db.collection('affiliateClicks').doc(`${affiliate.id}_${input.productId}_${safeClickId}`)

  try {
    await clickRef.create({
      affiliateId: affiliate.id,
      referralCode: affiliate.referralCode,
      productId: input.productId,
      productName: product.name || 'Product',
      landingPath: input.landingPath || `/products/${input.productId}`,
      userAgent: input.userAgent || null,
      createdAt: FieldValue.serverTimestamp(),
    })
    return { recorded: true, affiliateId: affiliate.id, productName: product.name }
  } catch (error: any) {
    // A repeated click ID is intentionally idempotent.
    if (error?.code === 6 || error?.code === 'already-exists') {
      return { recorded: false, affiliateId: affiliate.id, productName: product.name }
    }
    throw error
  }
}

export async function recordAffiliateConversion(
  orderId: string,
  orderData: Record<string, any>
): Promise<AffiliateConversionResult> {
  const db = getAdminFirestore()
  if (!db || !orderId) return { created: false }

  const affiliate = await getAffiliateByCode(orderData.affiliateCode)
  if (!affiliate) return { created: false }

  const buyerId = orderData.userId || orderData.customerId
  if (buyerId && buyerId === affiliate.id) return { created: false, affiliateId: affiliate.id }

  const subtotal = Number(orderData.subtotal ?? orderData.total ?? orderData.totalAmount)
  const amount = Math.round(subtotal * affiliate.commissionRate) / 100
  if (!Number.isFinite(amount) || amount <= 0) return { created: false, affiliateId: affiliate.id }

  const conversionId = `${orderId}_${affiliate.id}`.replace(/[^a-zA-Z0-9_-]/g, '_')
  const conversionRef = db.collection('affiliateConversions').doc(conversionId)
  const affiliateRef = db.collection('users').doc(affiliate.id)
  const now = FieldValue.serverTimestamp()

  let created = false
  await db.runTransaction(async (transaction: any) => {
    const existing = await transaction.get(conversionRef)
    if (existing.exists) return

    transaction.create(conversionRef, {
      orderId,
      affiliateId: affiliate.id,
      referralCode: affiliate.referralCode,
      productId: orderData.affiliateProductId || null,
      orderUserId: buyerId || null,
      orderSubtotal: subtotal,
      commissionRate: affiliate.commissionRate,
      commissionAmount: amount,
      status: 'approved',
      createdAt: now,
      updatedAt: now,
    })

    transaction.set(affiliateRef, {
      earnings: FieldValue.increment(amount),
      affiliateTotalEarnings: FieldValue.increment(amount),
      affiliateAvailableBalance: FieldValue.increment(amount),
      affiliateConversionCount: FieldValue.increment(1),
      updatedAt: now,
    }, { merge: true })
    created = true
  })

  return {
    created,
    affiliateId: affiliate.id,
    commissionAmount: created ? amount : undefined,
    commissionRate: affiliate.commissionRate,
  }
}

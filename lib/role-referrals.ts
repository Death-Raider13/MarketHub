import { FieldValue } from 'firebase-admin/firestore'
import { getAdminFirestore } from '@/lib/firebase/admin-simple'
import { feeAmount, referralRewardForFee, type FeeType } from '@/lib/business-fees'

export function normalizeReferralCode(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const normalized = value.trim().toUpperCase()
  return /^[A-Z0-9_-]{3,50}$/.test(normalized) ? normalized : null
}

export async function findEligibleRoleReferrer(codeValue: unknown): Promise<{ id: string; role: 'creator' | 'promoter'; referralCode: string } | null> {
  const code = normalizeReferralCode(codeValue)
  const db = getAdminFirestore()
  if (!code || !db) return null

  const snapshot = await db.collection('users').where('referralCode', '==', code).limit(10).get()
  const match = snapshot.docs.find((candidate: any) => {
    const data = candidate.data() || {}
    return data.role === 'creator' || data.role === 'promoter'
  })
  if (!match) return null

  const data = match.data() || {}
  const role = data.role as 'creator' | 'promoter'
  if (role === 'promoter' && data.affiliateStatus && data.affiliateStatus !== 'approved') return null
  if (role === 'creator' && data.creatorStatus && !['active', 'approved'].includes(data.creatorStatus)) return null

  return { id: match.id, role, referralCode: code }
}

export async function recordRoleReferralReward(input: {
  feePaymentId: string
  feeType: FeeType
  referredUserId: string
  referralCode: unknown
}): Promise<{ created: boolean; referrerId?: string; rewardAmount?: number }> {
  const db = getAdminFirestore()
  if (!db || !input.feePaymentId || !input.referredUserId) return { created: false }
  if (!['affiliate_registration', 'creator_additional_upload', 'creator_waitlist_additional_upload'].includes(input.feeType)) return { created: false }

  const referrer = await findEligibleRoleReferrer(input.referralCode)
  if (!referrer || referrer.id === input.referredUserId) return { created: false }

  const expectedFee = feeAmount(input.feeType)
  const rewardAmount = referralRewardForFee(input.feeType)
  const rewardRef = db.collection('roleReferralRewards').doc(`${input.feePaymentId}_${referrer.id}`.replace(/[^a-zA-Z0-9_-]/g, '_'))
  const referrerRef = db.collection('users').doc(referrer.id)
  const now = FieldValue.serverTimestamp()
  let created = false

  await db.runTransaction(async (transaction: any) => {
    const existing = await transaction.get(rewardRef)
    if (existing.exists) return

    transaction.create(rewardRef, {
      feePaymentId: input.feePaymentId,
      feeType: input.feeType,
      feeAmount: expectedFee,
      rewardPercent: 50,
      rewardAmount,
      referrerId: referrer.id,
      referrerRole: referrer.role,
      referredUserId: input.referredUserId,
      referralCode: referrer.referralCode,
      status: 'approved',
      createdAt: now,
      updatedAt: now,
    })
    transaction.set(referrerRef, {
      referralRewardEarnings: FieldValue.increment(rewardAmount),
      referralRewardAvailableBalance: FieldValue.increment(rewardAmount),
      referralRewardCount: FieldValue.increment(1),
      updatedAt: now,
    }, { merge: true })
    if (referrer.role === 'creator') {
      const creatorBalanceRef = db.collection('creatorBalances').doc(referrer.id)
      transaction.set(creatorBalanceRef, {
        creatorId: referrer.id,
        referralRewardEarnings: FieldValue.increment(rewardAmount),
        referralRewardAvailableBalance: FieldValue.increment(rewardAmount),
        updatedAt: now,
      }, { merge: true })
    }
    created = true
  })

  return { created, referrerId: referrer.id, rewardAmount: created ? rewardAmount : undefined }
}

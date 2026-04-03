import { adminDb } from '../firebase/admin'
import { FieldValue } from 'firebase-admin/firestore'
import { CreatorReputation } from '../types'

/**
 * Reputation Engine
 * Calculates and updates creator (creator) reputation scores 
 * based on sales, reviews, and quality signals.
 */
export async function updateCreatorReputation(creatorId: string) {
  try {
    if (!adminDb) return

    // 1. Fetch all active products for the creator
    const productsSnapshot = await adminDb
      .collection('products')
      .where('creatorId', '==', creatorId)
      .where('status', '==', 'active')
      .get()

    const products = productsSnapshot.docs.map(doc => doc.data())

    // 2. Aggregate sales and review stats
    let totalSales = 0
    let totalReviewCount = 0
    let totalRatingSum = 0
    let totalAccuracySum = 0
    let totalDeliverySum = 0
    let ratedProductsCount = 0

    products.forEach(p => {
      totalSales += (p.salesCount || 0)
      if (p.reviewCount > 0) {
        totalReviewCount += p.reviewCount
        totalRatingSum += (p.rating || 0) * p.reviewCount
        ratedProductsCount++
      }
    })

    // 3. Fetch all reviews to get accurate accuracy/delivery averages
    const reviewsSnapshot = await adminDb
      .collection('reviews')
      .where('creatorId', '==', creatorId) // Reviews also need creatorId
      .where('status', '==', 'approved')
      .get()

    reviewsSnapshot.docs.forEach(doc => {
      const r = doc.data()
      totalAccuracySum += (r.accuracyRating || 5)
      totalDeliverySum += (r.deliveryRating || 5)
    })

    const avgRating = totalReviewCount > 0 ? totalRatingSum / totalReviewCount : 0
    const avgAccuracy = reviewsSnapshot.size > 0 ? totalAccuracySum / reviewsSnapshot.size : 5
    const avgDelivery = reviewsSnapshot.size > 0 ? totalDeliverySum / reviewsSnapshot.size : 5

    // 4. Calculate Reputation Score (0-100)
    const score = Math.round(
      (avgRating * 10) +
      (avgAccuracy * 4) +
      (avgDelivery * 4) +
      Math.min(totalSales / 5, 10)
    )

    // 5. Determine Level and Badges
    let level: CreatorReputation['level'] = 'new'
    const badges: string[] = []

    if (score >= 85 && totalSales >= 20) {
      level = 'elite'
      badges.push('Elite Creator')
    } else if (score >= 70 && totalSales >= 5) {
      level = 'pro'
      badges.push('Professional')
    } else if (score >= 40) {
      level = 'rising'
      badges.push('Rising Star')
    }

    if (avgRating >= 4.8 && totalReviewCount >= 5) badges.push('Top Rated')
    if (avgAccuracy >= 4.9) badges.push('Highly Accurate')

    // 6. Update Reputation Document
    const reputationRef = adminDb.collection('creator_reputation').doc(creatorId)
    const reputationData: CreatorReputation = {
      creatorId,
      score: Math.min(score, 100),
      level,
      badges,
      totalSales,
      averageRating: Math.round(avgRating * 10) / 10,
      reviewCount: totalReviewCount,
      accuracyScore: Math.round(avgAccuracy * 10) / 10,
      deliveryScore: Math.round(avgDelivery).toFixed(1) as any, // Consistent with deliveryScore being a number but often displayed as float
      updatedAt: new Date()
    }

    // Explicitly set deliveryScore as number
    reputationData.deliveryScore = Math.round(avgDelivery * 10) / 10;

    await reputationRef.set(reputationData, { merge: true })

    // 7. Update User/Creator document with reputation flags
    await adminDb.collection('users').doc(creatorId).update({
      reputationLevel: level,
      badges: badges,
      reputationScore: reputationData.score
    }).catch(() => { })

    console.log(`[Reputation] Updated ${creatorId}: Score ${score}, Level ${level}`)
    return reputationData

  } catch (error) {
    console.error('[Reputation] Error updating:', error)
  }
}

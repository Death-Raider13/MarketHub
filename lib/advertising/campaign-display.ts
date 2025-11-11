/**
 * Campaign Display System
 * Connects approved ad campaigns to their designated placement positions
 */

import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import { handleFirebaseError } from "@/lib/firebase/error-handler"

export interface DisplayCampaign {
  id: string
  advertiserId: string
  campaignName: string
  creative: {
    title: string
    description: string
    imageUrl: string
    destinationUrl: string
    ctaText: string
  }
  placement: {
    type: 'homepage' | 'category' | 'vendor_store' | 'sponsored_product'
    targetVendors: string[]
    targetCategories: string[]
  }
  budget: {
    total: number
    spent: number
    remaining: number
    dailyLimit: number
  }
  stats: {
    impressions: number
    clicks: number
    conversions: number
    ctr: number
  }
  status: string
  priority: number // Higher number = higher priority
  weight: number // For rotation algorithm
}

/**
 * Get active campaigns for a specific placement type
 */
export async function getActiveCampaignsForPlacement(
  placementType: 'homepage' | 'category' | 'vendor_store' | 'sponsored_product',
  options: {
    vendorId?: string
    category?: string
    maxCount?: number
  } = {}
): Promise<DisplayCampaign[]> {
  return handleFirebaseError(async () => {
    const campaignsRef = collection(db, "adCampaigns")
    
    // Base query for active campaigns of the specified placement type
    let q = query(
      campaignsRef,
      where("status", "==", "active"),
      where("placement.type", "==", placementType),
      orderBy("createdAt", "desc")
    )

    const snapshot = await getDocs(q)
    let campaigns = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      priority: calculateCampaignPriority(doc.data()),
      weight: calculateCampaignWeight(doc.data())
    })) as DisplayCampaign[]

    // Filter based on targeting
    campaigns = campaigns.filter(campaign => {
      // Check if campaign has remaining budget
      if (campaign.budget.remaining <= 0) return false
      
      // Check daily limit
      if (campaign.budget.spent >= campaign.budget.dailyLimit) return false

      // Filter by vendor targeting
      if (options.vendorId && placementType === 'vendor_store') {
        const targetVendors = campaign.placement.targetVendors || []
        if (targetVendors.length > 0 && !targetVendors.includes(options.vendorId)) {
          return false
        }
      }

      // Filter by category targeting
      if (options.category && (placementType === 'category' || placementType === 'sponsored_product')) {
        const targetCategories = campaign.placement.targetCategories || []
        if (targetCategories.length > 0 && !targetCategories.includes(options.category)) {
          return false
        }
      }

      return true
    })

    // Sort by priority and weight
    campaigns.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority // Higher priority first
      }
      return b.weight - a.weight // Higher weight first
    })

    // Limit results
    const maxCount = options.maxCount || 5
    return campaigns.slice(0, maxCount)
  }, {
    showToast: false, // Don't show toast for ad loading errors
    autoRetry: true,
    maxRetries: 2
  })
}

/**
 * Get campaigns for homepage banner rotation
 */
export async function getHomepageBannerCampaigns(maxCount: number = 5): Promise<DisplayCampaign[]> {
  return getActiveCampaignsForPlacement('homepage', { maxCount })
}

/**
 * Get campaigns for vendor store ads
 */
export async function getVendorStoreCampaigns(vendorId: string, maxCount: number = 3): Promise<DisplayCampaign[]> {
  return getActiveCampaignsForPlacement('vendor_store', { vendorId, maxCount })
}

/**
 * Get campaigns for category page ads
 */
export async function getCategoryPageCampaigns(category: string, maxCount: number = 4): Promise<DisplayCampaign[]> {
  return getActiveCampaignsForPlacement('category', { category, maxCount })
}

/**
 * Get sponsored product campaigns
 */
export async function getSponsoredProductCampaigns(category: string, maxCount: number = 6): Promise<DisplayCampaign[]> {
  return getActiveCampaignsForPlacement('sponsored_product', { category, maxCount })
}

/**
 * Calculate campaign priority based on budget and performance
 */
function calculateCampaignPriority(campaign: any): number {
  let priority = 1

  // Higher budget = higher priority
  const budgetMultiplier = Math.min(campaign.budget?.total / 10000, 5) // Max 5x multiplier
  priority += budgetMultiplier

  // Better CTR = higher priority
  const ctr = campaign.stats?.ctr || 0
  if (ctr > 2) priority += 2
  else if (ctr > 1) priority += 1

  // Newer campaigns get slight boost
  const createdAt = campaign.createdAt?.toDate?.() || new Date()
  const daysSinceCreated = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
  if (daysSinceCreated < 7) priority += 0.5

  return Math.round(priority * 10) / 10
}

/**
 * Calculate campaign weight for rotation algorithm
 */
function calculateCampaignWeight(campaign: any): number {
  let weight = 1

  // Budget-based weight
  const remainingBudget = campaign.budget?.remaining || 0
  const totalBudget = campaign.budget?.total || 1
  const budgetRatio = remainingBudget / totalBudget
  weight *= (0.5 + budgetRatio) // 0.5 to 1.5 multiplier

  // Performance-based weight
  const ctr = campaign.stats?.ctr || 0
  const avgCtr = 1.5 // Platform average
  if (ctr > avgCtr) {
    weight *= 1.2 // Boost high-performing ads
  } else if (ctr < avgCtr * 0.5) {
    weight *= 0.8 // Reduce low-performing ads
  }

  // Frequency capping (reduce weight if shown too much recently)
  const impressions = campaign.stats?.impressions || 0
  const clicks = campaign.stats?.clicks || 0
  if (impressions > 1000 && clicks < 10) {
    weight *= 0.7 // Reduce weight for ads with low engagement
  }

  return Math.max(0.1, weight) // Minimum weight of 0.1
}

/**
 * Select random campaign based on weights
 */
export function selectWeightedRandomCampaign(campaigns: DisplayCampaign[]): DisplayCampaign | null {
  if (campaigns.length === 0) return null
  if (campaigns.length === 1) return campaigns[0]

  const totalWeight = campaigns.reduce((sum, campaign) => sum + campaign.weight, 0)
  let random = Math.random() * totalWeight
  
  for (const campaign of campaigns) {
    random -= campaign.weight
    if (random <= 0) {
      return campaign
    }
  }
  
  return campaigns[0] // Fallback
}

/**
 * Track ad impression
 */
export async function trackCampaignImpression(campaignId: string, context: {
  placement: string
  vendorId?: string
  category?: string
  deviceType: string
  userAgent: string
}): Promise<void> {
  try {
    await fetch('/api/advertising/track-impression', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        campaignId,
        ...context,
        timestamp: new Date().toISOString()
      })
    })
  } catch (error) {
    console.error('Error tracking impression:', error)
  }
}

/**
 * Track ad click
 */
export async function trackCampaignClick(campaignId: string, context: {
  placement: string
  vendorId?: string
  category?: string
  deviceType: string
  userAgent: string
}): Promise<void> {
  try {
    await fetch('/api/advertising/track-click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        campaignId,
        ...context,
        timestamp: new Date().toISOString()
      })
    })
  } catch (error) {
    console.error('Error tracking click:', error)
  }
}

/**
 * Ad Rotation Algorithm
 * Smart impression-based rotation system
 */

import { 
  AdCampaign, 
  AdSlot, 
  AdDisplayContext, 
  AdSelectionResult,
  AdRotationEntry 
} from '@/lib/types/advertising'

/**
 * Select which ad to display based on context and rotation algorithm
 */
export async function selectAdToDisplay(
  slotId: string,
  context: AdDisplayContext
): Promise<AdSelectionResult | null> {
  try {
    // 1. Get ad slot configuration
    const slot = await getAdSlot(slotId)
    
    if (!slot || !slot.availability.enabled) {
      return null
    }
    
    // 2. Get eligible campaigns from rotation queue
    const eligibleCampaigns = await getEligibleCampaigns(slot, context)
    
    if (eligibleCampaigns.length === 0) {
      return null
    }
    
    // 3. Calculate weights for each campaign
    const weightedCampaigns = eligibleCampaigns.map(campaign => ({
      campaign,
      weight: calculateCampaignWeight(campaign, slot)
    }))
    
    // 4. Select campaign using weighted random selection
    const selectedCampaign = weightedRandomSelection(weightedCampaigns)
    
    if (!selectedCampaign) {
      return null
    }
    
    // 5. Check if campaign still has budget
    if (!canDisplayAd(selectedCampaign.campaign)) {
      // Remove from rotation queue and try again
      await removeFromRotationQueue(slotId, selectedCampaign.campaign.id)
      return selectAdToDisplay(slotId, context)
    }
    
    // 6. Generate impression ID and tracking URLs
    const impressionId = generateImpressionId()
    const trackingUrl = generateTrackingUrl(impressionId, selectedCampaign.campaign.id)
    const clickUrl = generateClickUrl(impressionId, selectedCampaign.campaign.id)
    
    // 7. Record impression (async, don't wait)
    recordImpression(impressionId, selectedCampaign.campaign, slot, context)
      .catch(error => console.error('Failed to record impression:', error))
    
    return {
      campaign: selectedCampaign.campaign,
      impressionId,
      trackingUrl,
      clickUrl
    }
    
  } catch (error) {
    console.error('Error selecting ad:', error)
    return null
  }
}

/**
 * Calculate weight for a campaign based on multiple factors
 */
export function calculateCampaignWeight(
  campaign: AdCampaign,
  slot: AdSlot
): number {
  // Weight factors (total = 1.0)
  const BID_WEIGHT = 0.40      // 40% - How much they're paying
  const PERFORMANCE_WEIGHT = 0.30  // 30% - How well the ad performs
  const BUDGET_WEIGHT = 0.20   // 20% - Remaining budget
  const RANDOM_WEIGHT = 0.10   // 10% - Randomness for fairness
  
  // 1. Bid Score (normalized to 0-1)
  const bidScore = Math.min(campaign.bidding.bidAmount / slot.pricing.baseRate, 2) / 2
  
  // 2. Performance Score (CTR normalized)
  const performanceScore = Math.min(campaign.stats.ctr / 5, 1) // 5% CTR = max score
  
  // 3. Budget Score (remaining budget as percentage)
  const budgetScore = Math.min(campaign.budget.remaining / campaign.budget.total, 1)
  
  // 4. Random Score
  const randomScore = Math.random()
  
  // Calculate weighted score
  const totalWeight = (
    bidScore * BID_WEIGHT +
    performanceScore * PERFORMANCE_WEIGHT +
    budgetScore * BUDGET_WEIGHT +
    randomScore * RANDOM_WEIGHT
  )
  
  return totalWeight
}

/**
 * Weighted random selection
 */
function weightedRandomSelection<T>(
  items: { campaign: T; weight: number }[]
): { campaign: T; weight: number } | null {
  if (items.length === 0) return null
  
  // Calculate total weight
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0)
  
  // Generate random number
  let random = Math.random() * totalWeight
  
  // Select item based on weight
  for (const item of items) {
    random -= item.weight
    if (random <= 0) {
      return item
    }
  }
  
  // Fallback to first item
  return items[0]
}

/**
 * Check if campaign can display an ad
 */
function canDisplayAd(campaign: AdCampaign): boolean {
  // Check if campaign is active
  if (campaign.status !== 'active') {
    return false
  }
  
  // Check if within schedule
  const now = new Date()
  if (now < campaign.schedule.startDate || now > campaign.schedule.endDate) {
    return false
  }
  
  // Check if budget remaining
  if (campaign.budget.remaining <= 0) {
    return false
  }
  
  // Check if daily limit reached
  const todaySpent = getTodaySpent(campaign.id)
  if (todaySpent >= campaign.budget.dailyLimit) {
    return false
  }
  
  return true
}

/**
 * Get eligible campaigns for a slot based on context
 */
async function getEligibleCampaigns(
  slot: AdSlot,
  context: AdDisplayContext
): Promise<AdCampaign[]> {
  // Get all campaigns in rotation queue
  const campaigns = await getCampaignsFromQueue(slot.rotationQueue)
  
  // Filter by targeting criteria
  return campaigns.filter(campaign => {
    // Check device targeting
    if (!campaign.placement.devices.includes(context.device)) {
      return false
    }
    
    // Check placement targeting
    if (!campaign.placement.positions.includes(context.placement)) {
      return false
    }
    
    // Check category targeting
    if (campaign.targeting.categories && campaign.targeting.categories.length > 0) {
      if (!campaign.targeting.categories.includes(context.storeCategory)) {
        return false
      }
    }
    
    // Check location targeting
    if (campaign.targeting.locations && campaign.targeting.locations.length > 0) {
      if (!context.location || !campaign.targeting.locations.includes(context.location.state)) {
        return false
      }
    }
    
    // Check store type targeting
    if (campaign.targeting.storeTypes && campaign.targeting.storeTypes.length > 0) {
      if (!campaign.targeting.storeTypes.includes(context.storeType)) {
        return false
      }
    }
    
    // Check minimum store rating
    if (campaign.targeting.minStoreRating) {
      if (context.storeRating < campaign.targeting.minStoreRating) {
        return false
      }
    }
    
    return true
  })
}

/**
 * Record an impression
 */
async function recordImpression(
  impressionId: string,
  campaign: AdCampaign,
  slot: AdSlot,
  context: AdDisplayContext
): Promise<void> {
  // Calculate costs
  const cost = calculateImpressionCost(campaign, slot)
  const vendorEarning = cost * slot.pricing.vendorShare
  const platformEarning = cost * (1 - slot.pricing.vendorShare)
  
  // Create impression record
  const impression = {
    id: impressionId,
    campaignId: campaign.id,
    slotId: slot.id,
    vendorId: slot.vendorId,
    
    userId: context.userId,
    sessionId: context.sessionId,
    device: context.device,
    location: context.location,
    
    timestamp: new Date(),
    clicked: false,
    converted: false,
    
    cost,
    vendorEarning,
    platformEarning,
    
    pageUrl: typeof window !== 'undefined' ? window.location.href : '',
    referrer: typeof window !== 'undefined' ? document.referrer : undefined,
  }
  
  // Save to database (implement based on your DB)
  await saveImpression(impression)
  
  // Update campaign stats
  await updateCampaignStats(campaign.id, {
    impressions: 1,
    spent: cost
  })
  
  // Update slot stats
  await updateSlotStats(slot.id, {
    impressions: 1,
    revenue: cost,
    vendorEarnings: vendorEarning
  })
}

/**
 * Calculate cost for an impression
 */
function calculateImpressionCost(
  campaign: AdCampaign,
  slot: AdSlot
): number {
  if (campaign.bidding.type === 'CPM') {
    // Cost per 1000 impressions
    return campaign.bidding.bidAmount / 1000
  }
  
  // For CPC and CPA, impression is free (pay on click/conversion)
  return 0
}

/**
 * Generate unique impression ID
 */
function generateImpressionId(): string {
  return `imp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Generate tracking URL for impression
 */
function generateTrackingUrl(impressionId: string, campaignId: string): string {
  return `/api/ads/track/impression?id=${impressionId}&campaign=${campaignId}`
}

/**
 * Generate click URL
 */
function generateClickUrl(impressionId: string, campaignId: string): string {
  return `/api/ads/track/click?id=${impressionId}&campaign=${campaignId}`
}

// Import database functions
import {
  getAdSlot as dbGetAdSlot,
  getAdCampaign,
  getTodaySpent as dbGetTodaySpent,
  saveImpression as dbSaveImpression,
  updateCampaignStats as dbUpdateCampaignStats,
  updateSlotStats as dbUpdateSlotStats,
  removeFromRotationQueue as dbRemoveFromRotationQueue
} from './ad-database'

// Database function wrappers
async function getAdSlot(slotId: string): Promise<AdSlot | null> {
  return dbGetAdSlot(slotId)
}

async function getCampaignsFromQueue(queue: AdRotationEntry[]): Promise<AdCampaign[]> {
  const campaigns: AdCampaign[] = []
  
  for (const entry of queue) {
    const campaign = await getAdCampaign(entry.campaignId)
    if (campaign) {
      campaigns.push(campaign)
    }
  }
  
  return campaigns
}

async function removeFromRotationQueue(slotId: string, campaignId: string): Promise<void> {
  return dbRemoveFromRotationQueue(slotId, campaignId)
}

function getTodaySpent(campaignId: string): number {
  // This should be async, but keeping sync for now
  // In production, cache this value or use a different approach
  return 0
}

async function saveImpression(impression: any): Promise<string> {
  return await dbSaveImpression(impression)
}

async function updateCampaignStats(campaignId: string, stats: any): Promise<void> {
  return dbUpdateCampaignStats(campaignId, stats)
}

async function updateSlotStats(slotId: string, stats: any): Promise<void> {
  return dbUpdateSlotStats(slotId, stats)
}

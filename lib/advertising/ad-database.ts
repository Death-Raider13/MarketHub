/**
 * Advertising Database Functions
 * Firestore integration for ad system
 */

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  increment,
  Timestamp,
  writeBatch,
  runTransaction
} from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { 
  AdCampaign, 
  AdSlot, 
  AdImpression, 
  AdClick,
  AdRotationEntry,
  VendorAdEarnings 
} from '@/lib/types/advertising'

// Collection names
const COLLECTIONS = {
  AD_CAMPAIGNS: 'adCampaigns',
  AD_SLOTS: 'adSlots',
  AD_IMPRESSIONS: 'adImpressions',
  AD_CLICKS: 'adClicks',
  VENDOR_EARNINGS: 'vendorAdEarnings',
}

// ==================== AD CAMPAIGNS ====================

/**
 * Get active campaigns for a specific slot
 */
export async function getActiveCampaignsForSlot(
  slotId: string
): Promise<AdCampaign[]> {
  try {
    const slot = await getAdSlot(slotId)
    if (!slot || !slot.rotationQueue.length) {
      return []
    }

    // Get campaign IDs from rotation queue
    const campaignIds = slot.rotationQueue.map(entry => entry.campaignId)

    // Fetch campaigns
    const campaigns: AdCampaign[] = []
    for (const campaignId of campaignIds) {
      const campaign = await getAdCampaign(campaignId)
      if (campaign && campaign.status === 'active') {
        campaigns.push(campaign)
      }
    }

    return campaigns
  } catch (error) {
    console.error('Error getting active campaigns:', error)
    return []
  }
}

/**
 * Get a single campaign by ID
 */
export async function getAdCampaign(campaignId: string): Promise<AdCampaign | null> {
  try {
    const campaignRef = doc(db, COLLECTIONS.AD_CAMPAIGNS, campaignId)
    const campaignSnap = await getDoc(campaignRef)

    if (!campaignSnap.exists()) {
      return null
    }

    return {
      id: campaignSnap.id,
      ...campaignSnap.data()
    } as AdCampaign
  } catch (error) {
    console.error('Error getting campaign:', error)
    return null
  }
}

/**
 * Create a new ad campaign
 */
export async function createAdCampaign(
  campaign: Omit<AdCampaign, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    const campaignRef = doc(collection(db, COLLECTIONS.AD_CAMPAIGNS))
    
    const campaignData = {
      ...campaign,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }

    await setDoc(campaignRef, campaignData)
    
    return campaignRef.id
  } catch (error) {
    console.error('Error creating campaign:', error)
    throw error
  }
}

/**
 * Update campaign stats (impressions, clicks, etc.)
 */
export async function updateCampaignStats(
  campaignId: string,
  stats: {
    impressions?: number
    clicks?: number
    conversions?: number
    spent?: number
  }
): Promise<void> {
  try {
    const campaignRef = doc(db, COLLECTIONS.AD_CAMPAIGNS, campaignId)

    const updates: any = {
      updatedAt: Timestamp.now()
    }

    if (stats.impressions) {
      updates['stats.impressions'] = increment(stats.impressions)
    }
    if (stats.clicks) {
      updates['stats.clicks'] = increment(stats.clicks)
    }
    if (stats.conversions) {
      updates['stats.conversions'] = increment(stats.conversions)
    }
    if (stats.spent) {
      updates['budget.spent'] = increment(stats.spent)
      updates['budget.remaining'] = increment(-stats.spent)
    }

    await updateDoc(campaignRef, updates)
  } catch (error) {
    console.error('Error updating campaign stats:', error)
    throw error
  }
}

/**
 * Get today's spend for a campaign
 */
export async function getTodaySpent(campaignId: string): Promise<number> {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const impressionsRef = collection(db, COLLECTIONS.AD_IMPRESSIONS)
    const q = query(
      impressionsRef,
      where('campaignId', '==', campaignId),
      where('timestamp', '>=', Timestamp.fromDate(today))
    )

    const snapshot = await getDocs(q)
    
    let totalSpent = 0
    snapshot.forEach(doc => {
      totalSpent += doc.data().cost || 0
    })

    return totalSpent
  } catch (error) {
    console.error('Error getting today spent:', error)
    return 0
  }
}

// ==================== AD SLOTS ====================

/**
 * Get ad slot by ID
 */
export async function getAdSlot(slotId: string): Promise<AdSlot | null> {
  try {
    const slotRef = doc(db, COLLECTIONS.AD_SLOTS, slotId)
    const slotSnap = await getDoc(slotRef)

    if (!slotSnap.exists()) {
      return null
    }

    return {
      id: slotSnap.id,
      ...slotSnap.data()
    } as AdSlot
  } catch (error) {
    console.error('Error getting ad slot:', error)
    return null
  }
}

/**
 * Get ad slots for a vendor
 */
export async function getVendorAdSlots(vendorId: string): Promise<AdSlot[]> {
  try {
    const slotsRef = collection(db, COLLECTIONS.AD_SLOTS)
    const q = query(
      slotsRef,
      where('vendorId', '==', vendorId),
      where('isActive', '==', true)
    )

    const snapshot = await getDocs(q)
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as AdSlot[]
  } catch (error) {
    console.error('Error getting vendor ad slots:', error)
    return []
  }
}

/**
 * Create or update ad slot for vendor
 */
export async function upsertAdSlot(
  vendorId: string,
  slotData: Partial<AdSlot>
): Promise<string> {
  try {
    // Check if slot exists
    const existingSlots = await getVendorAdSlots(vendorId)
    
    if (existingSlots.length > 0) {
      // Update existing slot
      const slotRef = doc(db, COLLECTIONS.AD_SLOTS, existingSlots[0].id)
      await updateDoc(slotRef, {
        ...slotData,
        updatedAt: Timestamp.now()
      })
      return existingSlots[0].id
    } else {
      // Create new slot
      const slotRef = doc(collection(db, COLLECTIONS.AD_SLOTS))
      const newSlot = {
        vendorId,
        ...slotData,
        rotationQueue: [],
        stats: {
          totalImpressions: 0,
          totalClicks: 0,
          totalRevenue: 0,
          vendorEarnings: 0,
          averageCTR: 0
        },
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        isActive: true
      }
      
      await setDoc(slotRef, newSlot)
      return slotRef.id
    }
  } catch (error) {
    console.error('Error upserting ad slot:', error)
    throw error
  }
}

/**
 * Update ad slot stats
 */
export async function updateSlotStats(
  slotId: string,
  stats: {
    impressions?: number
    clicks?: number
    revenue?: number
    vendorEarnings?: number
  }
): Promise<void> {
  try {
    const slotRef = doc(db, COLLECTIONS.AD_SLOTS, slotId)

    const updates: any = {
      updatedAt: Timestamp.now()
    }

    if (stats.impressions) {
      updates['stats.totalImpressions'] = increment(stats.impressions)
    }
    if (stats.clicks) {
      updates['stats.totalClicks'] = increment(stats.clicks)
    }
    if (stats.revenue) {
      updates['stats.totalRevenue'] = increment(stats.revenue)
    }
    if (stats.vendorEarnings) {
      updates['stats.vendorEarnings'] = increment(stats.vendorEarnings)
    }

    await updateDoc(slotRef, updates)
  } catch (error) {
    console.error('Error updating slot stats:', error)
    throw error
  }
}

/**
 * Add campaign to rotation queue
 */
export async function addToRotationQueue(
  slotId: string,
  campaignId: string,
  priority: number
): Promise<void> {
  try {
    await runTransaction(db, async (transaction) => {
      const slotRef = doc(db, COLLECTIONS.AD_SLOTS, slotId)
      const slotDoc = await transaction.get(slotRef)

      if (!slotDoc.exists()) {
        throw new Error('Slot not found')
      }

      const slot = slotDoc.data() as AdSlot
      const queue = slot.rotationQueue || []

      // Check if campaign already in queue
      const existingIndex = queue.findIndex(entry => entry.campaignId === campaignId)
      
      if (existingIndex >= 0) {
        // Update existing entry
        queue[existingIndex].priority = priority
        queue[existingIndex].lastShown = new Date()
      } else {
        // Add new entry
        const newEntry: AdRotationEntry = {
          campaignId,
          priority,
          remainingImpressions: 10000, // Default
          weight: 0,
          lastShown: new Date(),
          performanceScore: 0
        }
        queue.push(newEntry)
      }

      transaction.update(slotRef, {
        rotationQueue: queue,
        updatedAt: Timestamp.now()
      })
    })
  } catch (error) {
    console.error('Error adding to rotation queue:', error)
    throw error
  }
}

/**
 * Remove campaign from rotation queue
 */
export async function removeFromRotationQueue(
  slotId: string,
  campaignId: string
): Promise<void> {
  try {
    const slotRef = doc(db, COLLECTIONS.AD_SLOTS, slotId)
    const slotDoc = await getDoc(slotRef)

    if (!slotDoc.exists()) {
      return
    }

    const slot = slotDoc.data() as AdSlot
    const queue = slot.rotationQueue || []

    const updatedQueue = queue.filter(entry => entry.campaignId !== campaignId)

    await updateDoc(slotRef, {
      rotationQueue: updatedQueue,
      updatedAt: Timestamp.now()
    })
  } catch (error) {
    console.error('Error removing from rotation queue:', error)
    throw error
  }
}

// ==================== IMPRESSIONS & CLICKS ====================

/**
 * Save ad impression
 */
export async function saveImpression(impression: Omit<AdImpression, 'id'>): Promise<string> {
  try {
    const impressionRef = doc(collection(db, COLLECTIONS.AD_IMPRESSIONS))
    
    await setDoc(impressionRef, {
      ...impression,
      timestamp: Timestamp.now()
    })

    return impressionRef.id
  } catch (error) {
    console.error('Error saving impression:', error)
    throw error
  }
}

/**
 * Record ad click
 */
export async function recordClick(
  impressionId: string,
  clickData: Omit<AdClick, 'id' | 'impressionId'>
): Promise<void> {
  try {
    await runTransaction(db, async (transaction) => {
      // Update impression
      const impressionRef = doc(db, COLLECTIONS.AD_IMPRESSIONS, impressionId)
      transaction.update(impressionRef, {
        clicked: true,
        clickedAt: Timestamp.now()
      })

      // Save click record
      const clickRef = doc(collection(db, COLLECTIONS.AD_CLICKS))
      transaction.set(clickRef, {
        ...clickData,
        impressionId,
        timestamp: Timestamp.now()
      })

      // Update campaign stats
      const campaignRef = doc(db, COLLECTIONS.AD_CAMPAIGNS, clickData.campaignId)
      transaction.update(campaignRef, {
        'stats.clicks': increment(1)
      })

      // Update slot stats
      const slotRef = doc(db, COLLECTIONS.AD_SLOTS, clickData.slotId)
      transaction.update(slotRef, {
        'stats.totalClicks': increment(1)
      })
    })
  } catch (error) {
    console.error('Error recording click:', error)
    throw error
  }
}

/**
 * Record conversion
 */
export async function recordConversion(
  impressionId: string,
  conversionValue: number
): Promise<void> {
  try {
    const impressionRef = doc(db, COLLECTIONS.AD_IMPRESSIONS, impressionId)
    const impressionDoc = await getDoc(impressionRef)

    if (!impressionDoc.exists()) {
      return
    }

    const impression = impressionDoc.data() as AdImpression

    await updateDoc(impressionRef, {
      converted: true,
      convertedAt: Timestamp.now(),
      conversionValue
    })

    // Update campaign stats
    const campaignRef = doc(db, COLLECTIONS.AD_CAMPAIGNS, impression.campaignId)
    await updateDoc(campaignRef, {
      'stats.conversions': increment(1)
    })
  } catch (error) {
    console.error('Error recording conversion:', error)
    throw error
  }
}

// ==================== VENDOR EARNINGS ====================

/**
 * Get vendor ad earnings for a period
 */
export async function getVendorEarnings(
  vendorId: string,
  startDate: Date,
  endDate: Date
): Promise<VendorAdEarnings> {
  try {
    const impressionsRef = collection(db, COLLECTIONS.AD_IMPRESSIONS)
    const q = query(
      impressionsRef,
      where('vendorId', '==', vendorId),
      where('timestamp', '>=', Timestamp.fromDate(startDate)),
      where('timestamp', '<=', Timestamp.fromDate(endDate))
    )

    const snapshot = await getDocs(q)
    
    let totalRevenue = 0
    let totalImpressions = 0
    let totalClicks = 0
    const byCampaign: { [key: string]: any } = {}

    snapshot.forEach(doc => {
      const data = doc.data()
      totalRevenue += data.vendorEarning || 0
      totalImpressions++
      if (data.clicked) totalClicks++

      // Group by campaign
      if (!byCampaign[data.campaignId]) {
        byCampaign[data.campaignId] = {
          campaignId: data.campaignId,
          campaignName: '', // TODO: Fetch campaign name
          impressions: 0,
          clicks: 0,
          earnings: 0
        }
      }
      byCampaign[data.campaignId].impressions++
      if (data.clicked) byCampaign[data.campaignId].clicks++
      byCampaign[data.campaignId].earnings += data.vendorEarning || 0
    })

    return {
      vendorId,
      period: { start: startDate, end: endDate },
      earnings: {
        totalRevenue,
        totalImpressions,
        totalClicks,
        averageCPM: totalImpressions > 0 ? (totalRevenue / totalImpressions) * 1000 : 0,
        averageCPC: totalClicks > 0 ? totalRevenue / totalClicks : 0
      },
      byCampaign: Object.values(byCampaign),
      byPlacement: [], // TODO: Implement
      payout: {
        status: 'pending',
        amount: totalRevenue
      }
    }
  } catch (error) {
    console.error('Error getting vendor earnings:', error)
    throw error
  }
}

/**
 * Request payout
 */
export async function requestPayout(
  vendorId: string,
  amount: number
): Promise<void> {
  try {
    const payoutRef = doc(collection(db, COLLECTIONS.VENDOR_EARNINGS))
    
    await setDoc(payoutRef, {
      vendorId,
      amount,
      status: 'pending',
      requestedAt: Timestamp.now()
    })
  } catch (error) {
    console.error('Error requesting payout:', error)
    throw error
  }
}

// ==================== ANALYTICS ====================

/**
 * Get campaign performance
 */
export async function getCampaignPerformance(
  campaignId: string,
  startDate: Date,
  endDate: Date
): Promise<any> {
  try {
    const impressionsRef = collection(db, COLLECTIONS.AD_IMPRESSIONS)
    const q = query(
      impressionsRef,
      where('campaignId', '==', campaignId),
      where('timestamp', '>=', Timestamp.fromDate(startDate)),
      where('timestamp', '<=', Timestamp.fromDate(endDate))
    )

    const snapshot = await getDocs(q)
    
    let impressions = 0
    let clicks = 0
    let conversions = 0
    let spent = 0

    snapshot.forEach(doc => {
      const data = doc.data()
      impressions++
      if (data.clicked) clicks++
      if (data.converted) conversions++
      spent += data.cost || 0
    })

    return {
      impressions,
      clicks,
      conversions,
      ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
      conversionRate: clicks > 0 ? (conversions / clicks) * 100 : 0,
      spent,
      costPerClick: clicks > 0 ? spent / clicks : 0,
      costPerConversion: conversions > 0 ? spent / conversions : 0
    }
  } catch (error) {
    console.error('Error getting campaign performance:', error)
    throw error
  }
}

export {
  COLLECTIONS
}

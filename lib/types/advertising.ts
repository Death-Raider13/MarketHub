/**
 * Advertising System Types
 * Impression-Based Rotation System
 */

// Ad Campaign
export interface AdCampaign {
  id: string
  advertiserId: string
  advertiserName: string
  campaignName: string
  status: 'draft' | 'pending_review' | 'active' | 'paused' | 'completed' | 'rejected'
  
  // Budget & Bidding
  budget: {
    total: number // Total budget in Naira
    spent: number // Amount spent so far
    dailyLimit: number // Max spend per day
    remaining: number // Calculated: total - spent
  }
  
  bidding: {
    type: 'CPM' | 'CPC' | 'CPA' // Cost per mille/click/action
    bidAmount: number // Amount per impression/click/action
    maxBid: number // Maximum bid amount
  }
  
  // Targeting
  targeting: {
    categories?: string[] // Product categories
    locations?: string[] // Nigerian states
    storeTypes?: ('all' | 'premium' | 'verified')[]
    minStoreRating?: number // Minimum store rating (1-5)
  }
  
  // Placement
  placement: {
    positions: ('sidebar' | 'banner' | 'inline' | 'footer')[]
    devices: ('desktop' | 'mobile' | 'tablet')[]
  }
  
  // Schedule
  schedule: {
    startDate: Date
    endDate: Date
    timezone: string
    active: boolean
  }
  
  // Creative
  creative: {
    imageUrl: string
    title: string
    description: string
    ctaText: string
    destinationUrl: string
    imageSize: {
      width: number
      height: number
    }
  }
  
  // Performance Stats
  stats: {
    impressions: number
    clicks: number
    conversions: number
    ctr: number // Click-through rate (%)
    conversionRate: number // Conversion rate (%)
    avgCost: number // Average cost per action
  }
  
  // Metadata
  createdAt: Date
  updatedAt: Date
  createdBy: string
  lastModifiedBy: string
}

// Ad Slot (Vendor's ad space)
export interface AdSlot {
  id: string
  vendorId: string
  vendorName: string
  storeName: string
  
  // Slot Configuration
  placement: {
    type: 'sidebar' | 'banner' | 'inline' | 'footer'
    position: string // e.g., "right", "top", "between-products"
    size: string // e.g., "300x250", "728x90"
  }
  
  // Availability
  availability: {
    enabled: boolean
    maxAdsPerPage: number
    allowedTypes: ('banner' | 'video' | 'sponsored')[]
  }
  
  // Pricing
  pricing: {
    baseRate: number // Base CPM rate
    premiumMultiplier: number // For premium placements
    vendorShare: number // Percentage (e.g., 0.70 for 70%)
  }
  
  // Rotation Queue (Active campaigns)
  rotationQueue: AdRotationEntry[]
  
  // Performance
  stats: {
    totalImpressions: number
    totalClicks: number
    totalRevenue: number
    vendorEarnings: number
    averageCTR: number
  }
  
  // Metadata
  createdAt: Date
  updatedAt: Date
  isActive: boolean
}

// Entry in rotation queue
export interface AdRotationEntry {
  campaignId: string
  priority: number // Calculated based on bid and performance
  remainingImpressions: number
  weight: number // Percentage of impressions (0-1)
  lastShown: Date
  performanceScore: number // Based on CTR and conversions
}

// Ad Impression (Tracking)
export interface AdImpression {
  id: string
  campaignId: string
  slotId: string
  vendorId: string
  
  // User Context
  userId?: string // If logged in
  sessionId: string
  ipAddress: string
  userAgent: string
  device: 'desktop' | 'mobile' | 'tablet'
  
  // Location
  location?: {
    country: string
    state: string
    city: string
  }
  
  // Timing
  timestamp: Date
  viewDuration?: number // Seconds ad was visible
  
  // Interaction
  clicked: boolean
  clickedAt?: Date
  converted: boolean
  convertedAt?: Date
  conversionValue?: number
  
  // Revenue
  cost: number // Cost to advertiser
  vendorEarning: number // Vendor's share
  platformEarning: number // Platform's share
  
  // Metadata
  pageUrl: string
  referrer?: string
}

// Ad Click (Detailed click tracking)
export interface AdClick {
  id: string
  impressionId: string
  campaignId: string
  slotId: string
  vendorId: string
  
  // Click Details
  timestamp: Date
  clickPosition: {
    x: number
    y: number
  }
  
  // User Context
  userId?: string
  sessionId: string
  device: 'desktop' | 'mobile' | 'tablet'
  
  // Navigation
  destinationUrl: string
  openedInNewTab: boolean
  
  // Revenue
  cost: number
  vendorEarning: number
  platformEarning: number
}

// Vendor Ad Earnings
export interface VendorAdEarnings {
  vendorId: string
  period: {
    start: Date
    end: Date
  }
  
  // Earnings Breakdown
  earnings: {
    totalRevenue: number
    totalImpressions: number
    totalClicks: number
    averageCPM: number
    averageCPC: number
  }
  
  // By Campaign
  byCampaign: {
    campaignId: string
    campaignName: string
    impressions: number
    clicks: number
    earnings: number
  }[]
  
  // By Placement
  byPlacement: {
    placement: string
    impressions: number
    clicks: number
    earnings: number
  }[]
  
  // Payout Status
  payout: {
    status: 'pending' | 'processing' | 'paid'
    amount: number
    requestedAt?: Date
    paidAt?: Date
    paymentMethod?: string
  }
}

// Ad Display Context (for targeting)
export interface AdDisplayContext {
  vendorId: string
  storeCategory: string
  storeRating: number
  storeType: 'all' | 'premium' | 'verified'
  
  // User Context
  userId?: string
  sessionId: string
  device: 'desktop' | 'mobile' | 'tablet'
  location?: {
    state: string
    city: string
  }
  
  // Page Context
  pageType: 'home' | 'product' | 'category' | 'search'
  productCategory?: string
  
  // Placement
  placement: 'sidebar' | 'banner' | 'inline' | 'footer'
}

// Ad Selection Result
export interface AdSelectionResult {
  campaign: AdCampaign
  impressionId: string
  trackingUrl: string
  clickUrl: string
}

// Campaign Performance Report
export interface CampaignPerformance {
  campaignId: string
  campaignName: string
  period: {
    start: Date
    end: Date
  }
  
  metrics: {
    impressions: number
    clicks: number
    conversions: number
    ctr: number
    conversionRate: number
    spent: number
    costPerClick: number
    costPerConversion: number
    roi: number
  }
  
  // By Vendor
  byVendor: {
    vendorId: string
    vendorName: string
    impressions: number
    clicks: number
    conversions: number
    spent: number
  }[]
  
  // By Placement
  byPlacement: {
    placement: string
    impressions: number
    clicks: number
    ctr: number
  }[]
  
  // By Device
  byDevice: {
    device: string
    impressions: number
    clicks: number
    ctr: number
  }[]
}

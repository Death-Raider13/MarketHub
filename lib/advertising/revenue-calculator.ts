/**
 * Advertising Revenue Calculator
 * Calculates platform revenue from advertising campaigns
 */

export interface AdRevenueConfig {
  // Platform commission rates
  platformCommissionRate: number // Percentage of ad spend that goes to platform
  vendorCommissionRate: number   // Percentage that goes to vendor hosting the ad
  
  // Minimum rates
  minimumCPM: number // Minimum cost per 1000 impressions
  minimumCPC: number // Minimum cost per click
  
  // Revenue sharing for different placements
  placementRates: {
    homepage: {
      platformShare: number // Platform's share (%)
      vendorShare: number   // Vendor's share (%)
    }
    vendor_store: {
      platformShare: number
      vendorShare: number
    }
    category: {
      platformShare: number
      vendorShare: number
    }
    sponsored_product: {
      platformShare: number
      vendorShare: number
    }
  }
}

// Default revenue configuration
export const DEFAULT_AD_REVENUE_CONFIG: AdRevenueConfig = {
  platformCommissionRate: 30, // Platform takes 30% of ad spend
  vendorCommissionRate: 20,   // Vendor gets 20% for hosting ads
  
  minimumCPM: 50,  // ₦50 per 1000 impressions
  minimumCPC: 5,   // ₦5 per click
  
  placementRates: {
    homepage: {
      platformShare: 100, // Platform gets 100%
      vendorShare: 0      // No vendor for homepage
    },
    vendor_store: {
      platformShare: 60, // Platform gets 60%
      vendorShare: 40    // Vendor gets 40% (they host the ad on their store)
    },
    category: {
      platformShare: 100, // Platform gets 100% (platform-owned category pages)
      vendorShare: 0      // No vendor commission for category ads
    },
    sponsored_product: {
      platformShare: 100, // Platform gets 100% (platform-managed sponsored products)
      vendorShare: 0      // No vendor commission for sponsored product ads
    }
  }
}

export interface AdRevenueCalculation {
  totalAdSpend: number
  platformRevenue: number
  vendorRevenue: number
  advertiserCost: number
  breakdown: {
    impressionRevenue: number
    clickRevenue: number
    conversionRevenue: number
  }
  metrics: {
    effectiveCPM: number
    effectiveCPC: number
    conversionRate: number
    revenuePerConversion: number
  }
}

/**
 * Calculate revenue from ad impressions
 */
export function calculateImpressionRevenue(
  impressions: number,
  cpmRate: number,
  placementType: keyof AdRevenueConfig['placementRates'],
  config: AdRevenueConfig = DEFAULT_AD_REVENUE_CONFIG
): AdRevenueCalculation {
  
  // Calculate total cost to advertiser
  const totalCost = (impressions / 1000) * Math.max(cpmRate, config.minimumCPM)
  
  // Get placement rates
  const placementConfig = config.placementRates[placementType]
  
  // Calculate revenue split
  const platformRevenue = totalCost * (placementConfig.platformShare / 100)
  const vendorRevenue = totalCost * (placementConfig.vendorShare / 100)
  
  return {
    totalAdSpend: totalCost,
    platformRevenue,
    vendorRevenue,
    advertiserCost: totalCost,
    breakdown: {
      impressionRevenue: totalCost,
      clickRevenue: 0,
      conversionRevenue: 0
    },
    metrics: {
      effectiveCPM: cpmRate,
      effectiveCPC: 0,
      conversionRate: 0,
      revenuePerConversion: 0
    }
  }
}

/**
 * Calculate revenue from ad clicks
 */
export function calculateClickRevenue(
  clicks: number,
  cpcRate: number,
  placementType: keyof AdRevenueConfig['placementRates'],
  config: AdRevenueConfig = DEFAULT_AD_REVENUE_CONFIG
): AdRevenueCalculation {
  
  // Calculate total cost to advertiser
  const totalCost = clicks * Math.max(cpcRate, config.minimumCPC)
  
  // Get placement rates
  const placementConfig = config.placementRates[placementType]
  
  // Calculate revenue split
  const platformRevenue = totalCost * (placementConfig.platformShare / 100)
  const vendorRevenue = totalCost * (placementConfig.vendorShare / 100)
  
  return {
    totalAdSpend: totalCost,
    platformRevenue,
    vendorRevenue,
    advertiserCost: totalCost,
    breakdown: {
      impressionRevenue: 0,
      clickRevenue: totalCost,
      conversionRevenue: 0
    },
    metrics: {
      effectiveCPM: 0,
      effectiveCPC: cpcRate,
      conversionRate: 0,
      revenuePerConversion: 0
    }
  }
}

/**
 * Calculate comprehensive campaign revenue
 */
export function calculateCampaignRevenue(
  campaignStats: {
    impressions: number
    clicks: number
    conversions: number
    totalSpend: number
    placementType: keyof AdRevenueConfig['placementRates']
  },
  config: AdRevenueConfig = DEFAULT_AD_REVENUE_CONFIG
): AdRevenueCalculation {
  
  const { impressions, clicks, conversions, totalSpend, placementType } = campaignStats
  
  // Get placement configuration
  const placementConfig = config.placementRates[placementType]
  
  // Calculate revenue split
  const platformRevenue = totalSpend * (placementConfig.platformShare / 100)
  const vendorRevenue = totalSpend * (placementConfig.vendorShare / 100)
  
  // Calculate metrics
  const effectiveCPM = impressions > 0 ? (totalSpend / impressions) * 1000 : 0
  const effectiveCPC = clicks > 0 ? totalSpend / clicks : 0
  const conversionRate = impressions > 0 ? (conversions / impressions) * 100 : 0
  const revenuePerConversion = conversions > 0 ? totalSpend / conversions : 0
  
  return {
    totalAdSpend: totalSpend,
    platformRevenue,
    vendorRevenue,
    advertiserCost: totalSpend,
    breakdown: {
      impressionRevenue: totalSpend * 0.6, // Assume 60% from impressions
      clickRevenue: totalSpend * 0.35,     // 35% from clicks
      conversionRevenue: totalSpend * 0.05  // 5% from conversions
    },
    metrics: {
      effectiveCPM,
      effectiveCPC,
      conversionRate,
      revenuePerConversion
    }
  }
}

/**
 * Calculate total platform advertising revenue for a period
 */
export interface PlatformAdRevenue {
  totalRevenue: number
  revenueByPlacement: {
    homepage: number
    vendor_store: number
    category: number
    sponsored_product: number
  }
  revenueByModel: {
    cpm: number // Cost per mille (impressions)
    cpc: number // Cost per click
    cpa: number // Cost per acquisition/conversion
  }
  metrics: {
    totalImpressions: number
    totalClicks: number
    totalConversions: number
    averageCPM: number
    averageCPC: number
    averageCPA: number
    overallCTR: number
    overallConversionRate: number
  }
  growth: {
    revenueGrowth: number
    impressionGrowth: number
    clickGrowth: number
  }
}

/**
 * Calculate platform advertising revenue summary
 */
export function calculatePlatformAdRevenue(
  campaigns: Array<{
    id: string
    impressions: number
    clicks: number
    conversions: number
    totalSpend: number
    placementType: keyof AdRevenueConfig['placementRates']
    createdAt: Date
  }>,
  previousPeriodCampaigns: Array<{
    impressions: number
    clicks: number
    conversions: number
    totalSpend: number
  }> = [],
  config: AdRevenueConfig = DEFAULT_AD_REVENUE_CONFIG
): PlatformAdRevenue {
  
  let totalRevenue = 0
  const revenueByPlacement = {
    homepage: 0,
    vendor_store: 0,
    category: 0,
    sponsored_product: 0
  }
  const revenueByModel = {
    cpm: 0,
    cpc: 0,
    cpa: 0
  }
  
  let totalImpressions = 0
  let totalClicks = 0
  let totalConversions = 0
  let totalSpend = 0
  
  // Calculate current period revenue
  campaigns.forEach(campaign => {
    const revenue = calculateCampaignRevenue(campaign, config)
    
    totalRevenue += revenue.platformRevenue
    revenueByPlacement[campaign.placementType] += revenue.platformRevenue
    
    // Distribute revenue by model (estimated)
    revenueByModel.cpm += revenue.breakdown.impressionRevenue * (config.placementRates[campaign.placementType].platformShare / 100)
    revenueByModel.cpc += revenue.breakdown.clickRevenue * (config.placementRates[campaign.placementType].platformShare / 100)
    revenueByModel.cpa += revenue.breakdown.conversionRevenue * (config.placementRates[campaign.placementType].platformShare / 100)
    
    totalImpressions += campaign.impressions
    totalClicks += campaign.clicks
    totalConversions += campaign.conversions
    totalSpend += campaign.totalSpend
  })
  
  // Calculate previous period totals for growth
  const previousTotalRevenue = previousPeriodCampaigns.reduce((sum, campaign) => sum + campaign.totalSpend, 0) * (config.platformCommissionRate / 100)
  const previousTotalImpressions = previousPeriodCampaigns.reduce((sum, campaign) => sum + campaign.impressions, 0)
  const previousTotalClicks = previousPeriodCampaigns.reduce((sum, campaign) => sum + campaign.clicks, 0)
  
  // Calculate growth rates
  const revenueGrowth = previousTotalRevenue > 0 ? ((totalRevenue - previousTotalRevenue) / previousTotalRevenue) * 100 : 0
  const impressionGrowth = previousTotalImpressions > 0 ? ((totalImpressions - previousTotalImpressions) / previousTotalImpressions) * 100 : 0
  const clickGrowth = previousTotalClicks > 0 ? ((totalClicks - previousTotalClicks) / previousTotalClicks) * 100 : 0
  
  // Calculate metrics
  const averageCPM = totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0
  const averageCPC = totalClicks > 0 ? totalSpend / totalClicks : 0
  const averageCPA = totalConversions > 0 ? totalSpend / totalConversions : 0
  const overallCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0
  const overallConversionRate = totalImpressions > 0 ? (totalConversions / totalImpressions) * 100 : 0
  
  return {
    totalRevenue,
    revenueByPlacement,
    revenueByModel,
    metrics: {
      totalImpressions,
      totalClicks,
      totalConversions,
      averageCPM,
      averageCPC,
      averageCPA,
      overallCTR,
      overallConversionRate
    },
    growth: {
      revenueGrowth,
      impressionGrowth,
      clickGrowth
    }
  }
}

/**
 * Get revenue configuration
 */
export function getRevenueConfig(): AdRevenueConfig {
  // In a real app, this would come from database/settings
  return DEFAULT_AD_REVENUE_CONFIG
}

/**
 * Update revenue configuration
 */
export function updateRevenueConfig(newConfig: Partial<AdRevenueConfig>): AdRevenueConfig {
  // In a real app, this would update the database
  return { ...DEFAULT_AD_REVENUE_CONFIG, ...newConfig }
}

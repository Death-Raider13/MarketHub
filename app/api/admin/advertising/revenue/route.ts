import { NextRequest, NextResponse } from "next/server"
import { getAdminFirestore } from "@/lib/firebase/admin"
import { calculatePlatformAdRevenue, calculateCampaignRevenue, DEFAULT_AD_REVENUE_CONFIG } from "@/lib/advertising/revenue-calculator"

export const dynamic = "force-dynamic"

type PlacementType = keyof typeof DEFAULT_AD_REVENUE_CONFIG.placementRates

export async function GET(request: NextRequest) {
  try {
    const adminDb = getAdminFirestore()
    
    if (!adminDb) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "month" // month, week, year
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    // Calculate date range
    const now = new Date()
    let start: Date
    let end: Date = now

    if (startDate && endDate) {
      start = new Date(startDate)
      end = new Date(endDate)
    } else {
      switch (period) {
        case "week":
          start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case "year":
          start = new Date(now.getFullYear(), 0, 1)
          break
        case "month":
        default:
          start = new Date(now.getFullYear(), now.getMonth(), 1)
          break
      }
    }

    console.log(`Fetching advertising revenue from ${start.toISOString()} to ${end.toISOString()}`)

    // Fetch campaigns for the period
    const campaignsQuery = adminDb.collection("adCampaigns")
      .where("createdAt", ">=", start)
      .where("createdAt", "<=", end)
      .where("status", "==", "active")

    const campaignsSnapshot = await campaignsQuery.get()

    // Fetch impressions and clicks data
    const impressionsQuery = adminDb.collection("adImpressions")
      .where("timestamp", ">=", start)
      .where("timestamp", "<=", end)

    const impressionsSnapshot = await impressionsQuery.get()

    const clicksQuery = adminDb.collection("adClicks")
      .where("timestamp", ">=", start)
      .where("timestamp", "<=", end)

    const clicksSnapshot = await clicksQuery.get()

    // Process campaign data
    const campaignStats = new Map()
    
    // Initialize campaign stats
    campaignsSnapshot.docs.forEach((doc: any) => {
      const campaign = doc.data()
      campaignStats.set(doc.id, {
        id: doc.id,
        campaignName: campaign.campaignName,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        totalSpend: 0,
        placementType: campaign.placement?.type || 'homepage',
        createdAt: campaign.createdAt?.toDate() || new Date()
      })
    })

    // Aggregate impressions
    impressionsSnapshot.docs.forEach((doc: any) => {
      const impression = doc.data()
      const campaignId = impression.campaignId
      
      if (campaignStats.has(campaignId)) {
        const stats = campaignStats.get(campaignId)
        stats.impressions += 1
        stats.totalSpend += impression.cost || 0
        
        if (impression.clicked) {
          stats.clicks += 1
        }
        if (impression.converted) {
          stats.conversions += 1
        }
      }
    })

    // Aggregate clicks
    clicksSnapshot.docs.forEach((doc: any) => {
      const click = doc.data()
      const campaignId = click.campaignId
      
      if (campaignStats.has(campaignId)) {
        const stats = campaignStats.get(campaignId)
        stats.totalSpend += click.cost || 0
      }
    })

    const campaigns = Array.from(campaignStats.values())

    // Calculate previous period for growth comparison
    const previousStart = new Date(start.getTime() - (end.getTime() - start.getTime()))
    const previousEnd = start

    const previousImpressions = await adminDb.collection("adImpressions")
      .where("timestamp", ">=", previousStart)
      .where("timestamp", "<", previousEnd)
      .get()

    const previousCampaigns = []
    const previousStats = new Map()

    previousImpressions.docs.forEach((doc: any) => {
      const impression = doc.data()
      const campaignId = impression.campaignId
      
      if (!previousStats.has(campaignId)) {
        previousStats.set(campaignId, {
          impressions: 0,
          clicks: 0,
          conversions: 0,
          totalSpend: 0
        })
      }
      
      const stats = previousStats.get(campaignId)
      stats.impressions += 1
      stats.totalSpend += impression.cost || 0
      
      if (impression.clicked) stats.clicks += 1
      if (impression.converted) stats.conversions += 1
    })

    previousCampaigns.push(...Array.from(previousStats.values()))

    // Calculate platform revenue
    const platformRevenue = calculatePlatformAdRevenue(campaigns, previousCampaigns)

    // Calculate individual campaign revenues
    const campaignRevenues = campaigns.map(campaign => ({
      ...campaign,
      revenue: calculateCampaignRevenue(campaign)
    }))

    // Calculate top performing campaigns
    const topCampaigns = campaignRevenues
      .sort((a, b) => b.revenue.platformRevenue - a.revenue.platformRevenue)
      .slice(0, 10)

    // Calculate revenue by time period (daily breakdown)
    const dailyRevenue = []
    const currentDate = new Date(start)
    
    while (currentDate <= end) {
      const dayStart = new Date(currentDate)
      const dayEnd = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000)
      
      const dayImpressions = impressionsSnapshot.docs.filter((doc: any) => {
        const timestamp = doc.data().timestamp?.toDate() || new Date()
        return timestamp >= dayStart && timestamp < dayEnd
      })
      
      const dayRevenue = dayImpressions.reduce((sum: number, doc: any) => {
        const impression = doc.data()
        const cost = impression.cost || 0
        const campaignId = impression.campaignId
        const campaign = campaignsSnapshot.docs.find((c: { id: string }) => c.id === campaignId)
        
        if (campaign) {
          const placementType = (campaign.data().placement?.type || 'homepage') as PlacementType
          const platformShare = DEFAULT_AD_REVENUE_CONFIG.placementRates[placementType]?.platformShare || 80
          return sum + (cost * (platformShare / 100))
        }
        
        return sum
      }, 0)
      
      dailyRevenue.push({
        date: dayStart.toISOString().split('T')[0],
        revenue: dayRevenue,
        impressions: dayImpressions.length,
        clicks: dayImpressions.filter((doc: any) => doc.data().clicked).length
      })
      
      currentDate.setDate(currentDate.getDate() + 1)
    }

    const response = {
      success: true,
      period: {
        start: start.toISOString(),
        end: end.toISOString(),
        type: period
      },
      summary: platformRevenue,
      campaigns: {
        total: campaigns.length,
        active: campaigns.filter(c => c.impressions > 0).length,
        topPerforming: topCampaigns
      },
      dailyBreakdown: dailyRevenue,
      config: DEFAULT_AD_REVENUE_CONFIG
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error("Error fetching advertising revenue:", error)
    return NextResponse.json(
      { error: "Failed to fetch advertising revenue", details: error.message },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from "next/server"
import { getAdminFirestore } from "@/lib/firebase/admin"
import { calculateImpressionRevenue, DEFAULT_AD_REVENUE_CONFIG } from "@/lib/advertising/revenue-calculator"
import { FieldValue } from "firebase-admin/firestore"

export async function POST(request: NextRequest) {
  try {
    const adminDb = getAdminFirestore()
    
    if (!adminDb) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      )
    }

    const { campaignId, placement, vendorId, category, deviceType, userAgent, timestamp } = await request.json()

    if (!campaignId || !placement) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Get campaign to check if it's still active and has budget
    const campaignRef = adminDb.collection("adCampaigns").doc(campaignId)
    const campaignDoc = await campaignRef.get()

    if (!campaignDoc.exists) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      )
    }

    const campaignData = campaignDoc.data()
    if (!campaignData || campaignData.status !== 'active') {
      return NextResponse.json(
        { error: "Campaign not active" },
        { status: 400 }
      )
    }

    // Check if campaign has remaining budget
    if (campaignData.budget?.remaining <= 0) {
      return NextResponse.json(
        { error: "Campaign budget exhausted" },
        { status: 400 }
      )
    }

    // Create impression record
    const impressionRef = adminDb.collection("adImpressions").doc()
    await impressionRef.set({
      campaignId,
      advertiserId: campaignData.advertiserId,
      placement,
      vendorId: vendorId || null,
      category: category || null,
      deviceType,
      userAgent,
      timestamp: new Date(timestamp),
      createdAt: FieldValue.serverTimestamp()
    })

    // Update campaign stats
    await campaignRef.update({
      "stats.impressions": FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp()
    })

    // Calculate cost per impression (CPM model)
    const cpmCost = (campaignData.bidding?.bidAmount || 1) / 1000 // Cost per 1000 impressions
    
    // Calculate revenue split
    const placementType = campaignData.placement?.type || 'homepage'
    const revenueCalculation = calculateImpressionRevenue(1, cpmCost * 1000, placementType, DEFAULT_AD_REVENUE_CONFIG)
    
    // Update impression record with revenue data
    await impressionRef.update({
      cost: cpmCost,
      platformEarning: revenueCalculation.platformRevenue,
      vendorEarning: revenueCalculation.vendorRevenue,
      clicked: false,
      converted: false
    })
    
    // Update budget
    await campaignRef.update({
      "budget.spent": FieldValue.increment(cpmCost),
      "budget.remaining": FieldValue.increment(-cpmCost),
      updatedAt: FieldValue.serverTimestamp()
    })

    // Check if budget is exhausted and pause campaign
    const updatedCampaign = await campaignRef.get()
    const updatedData = updatedCampaign.data()
    if (updatedData && updatedData.budget?.remaining <= 0) {
      await campaignRef.update({
        status: 'completed',
        completedAt: FieldValue.serverTimestamp(),
        completionReason: 'budget_exhausted'
      })

      // Send notification to advertiser
      try {
        const notificationRef = adminDb.collection("notifications").doc()
        await notificationRef.set({
          userId: campaignData.advertiserId,
          type: 'campaign_completed',
          title: 'Campaign Completed',
          message: `Your campaign "${campaignData.campaignName}" has completed due to budget exhaustion.`,
          metadata: {
            campaignId: campaignId,
            reason: 'budget_exhausted'
          },
          read: false,
          createdAt: FieldValue.serverTimestamp()
        })
      } catch (notificationError) {
        console.error("Error sending completion notification:", notificationError)
      }
    }

    return NextResponse.json({
      success: true,
      impressionId: impressionRef.id,
      campaignStatus: updatedData?.status || campaignData.status
    })
  } catch (error) {
    console.error("Error tracking impression:", error)
    return NextResponse.json(
      { error: "Failed to track impression" },
      { status: 500 }
    )
  }
}

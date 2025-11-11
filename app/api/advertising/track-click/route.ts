import { NextRequest, NextResponse } from "next/server"
import { getAdminFirestore } from "@/lib/firebase/admin"
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

    // Get campaign to check if it's still active
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

    // Create click record
    const clickRef = adminDb.collection("adClicks").doc()
    await clickRef.set({
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
    const currentStats = campaignData.stats || { impressions: 0, clicks: 0 }
    const newClicks = (currentStats.clicks || 0) + 1
    const impressions = currentStats.impressions || 1
    const newCtr = (newClicks / impressions) * 100

    await campaignRef.update({
      "stats.clicks": FieldValue.increment(1),
      "stats.ctr": newCtr,
      updatedAt: FieldValue.serverTimestamp()
    })

    // Calculate cost per click if using CPC model
    if (campaignData.bidding?.type === 'CPC') {
      const cpcCost = campaignData.bidding?.bidAmount || 1
      
      // Update budget
      await campaignRef.update({
        "budget.spent": FieldValue.increment(cpcCost),
        "budget.remaining": FieldValue.increment(-cpcCost),
        updatedAt: FieldValue.serverTimestamp()
      })

      // Check if budget is exhausted
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
    }

    return NextResponse.json({
      success: true,
      clickId: clickRef.id,
      destinationUrl: campaignData.creative?.destinationUrl
    })
  } catch (error) {
    console.error("Error tracking click:", error)
    return NextResponse.json(
      { error: "Failed to track click" },
      { status: 500 }
    )
  }
}

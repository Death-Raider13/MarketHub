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
    
    const campaignData = await request.json()

    const {
      advertiserId,
      campaignName,
      budget,
      dailyLimit,
      bidAmount,
      bidType,
      imageUrl,
      title,
      description,
      ctaText,
      destinationUrl,
      targeting,
      placementType,
      targetVendors,
      targetCategories,
    } = campaignData

    if (!advertiserId || !campaignName || !budget || !imageUrl || !placementType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Validate minimum budget based on placement type
    const totalBudget = parseFloat(budget)
    let minBudget = 0
    
    switch (placementType) {
      case 'homepage':
        minBudget = 50000
        break
      case 'category':
        minBudget = 20000
        break
      case 'sponsored_product':
        minBudget = 5000
        break
      case 'vendor_store':
        minBudget = 1000
        break
    }

    if (totalBudget < minBudget) {
      return NextResponse.json(
        { error: `Minimum budget for ${placementType} is ₦${minBudget.toLocaleString()}` },
        { status: 400 }
      )
    }

    // Check advertiser balance
    const advertiserDoc = await adminDb.collection("advertisers").doc(advertiserId).get()
    if (!advertiserDoc.exists) {
      return NextResponse.json(
        { error: "Advertiser profile not found" },
        { status: 404 }
      )
    }

    const advertiserData = advertiserDoc.data()
    if (advertiserData && advertiserData.accountBalance < minBudget) {
      return NextResponse.json(
        { error: `Insufficient balance. You need at least ₦${minBudget.toLocaleString()} but only have ₦${advertiserData.accountBalance.toLocaleString()}` },
        { status: 400 }
      )
    }

    // Create campaign using Admin SDK
    const campaignRef = await adminDb.collection("adCampaigns").add({
      advertiserId,
      campaignName,
      budget: {
        total: parseFloat(budget),
        dailyLimit: parseFloat(dailyLimit),
        spent: 0,
        remaining: parseFloat(budget),
      },
      bidding: {
        type: bidType,
        bidAmount: parseFloat(bidAmount),
      },
      creative: {
        imageUrl,
        title,
        description,
        ctaText,
        destinationUrl,
      },
      targeting: targeting || {
        locations: [],
        categories: [],
        devices: ["desktop", "mobile"],
        storeTypes: ["all"],
      },
      placement: {
        type: placementType, // vendor_store, homepage, category, sponsored_product
        targetVendors: targetVendors || [],
        targetCategories: targetCategories || [],
        minBudget: minBudget,
      },
      stats: {
        impressions: 0,
        clicks: 0,
        conversions: 0,
        ctr: 0,
        conversionRate: 0,
      },
      status: "pending_review",
      fundsReserved: false, // Will be set to true when approved and funds deducted
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })

    return NextResponse.json({
      success: true,
      campaignId: campaignRef.id,
      message: "Campaign created successfully",
    })
  } catch (error) {
    console.error("Error creating campaign:", error)
    return NextResponse.json(
      { error: "Failed to create campaign" },
      { status: 500 }
    )
  }
}

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
    const advertiserId = searchParams.get("advertiserId")

    if (!advertiserId) {
      return NextResponse.json(
        { error: "Missing advertiserId" },
        { status: 400 }
      )
    }

    const campaignsSnapshot = await adminDb
      .collection("adCampaigns")
      .where("advertiserId", "==", advertiserId)
      .orderBy("createdAt", "desc")
      .get()

    const campaigns = campaignsSnapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }))

    return NextResponse.json({ campaigns })
  } catch (error) {
    console.error("Error fetching campaigns:", error)
    return NextResponse.json(
      { error: "Failed to fetch campaigns" },
      { status: 500 }
    )
  }
}

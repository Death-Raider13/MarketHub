import { NextRequest, NextResponse } from "next/server"
import { getAdminFirestore } from "@/lib/firebase/admin"
import { FieldValue } from "firebase-admin/firestore"
import { verifyAdminAuth } from "@/lib/firebase/admin-auth"
import { hasPermission } from "@/lib/admin/permissions"

export async function GET(request: NextRequest) {
  try {
    const adminDb = getAdminFirestore()
    
    if (!adminDb) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      )
    }

    // TEMPORARY: Skip admin auth for testing
    // TODO: Re-enable admin authentication after Firebase login is fixed
    // const authResult = await verifyAdminAuth(request)
    // if (!authResult.success || !authResult.user) {
    //   return NextResponse.json(
    //     { error: "Unauthorized" },
    //     { status: 401 }
    //   )
    // }

    // if (!hasPermission(authResult.user.role, 'ads.view')) {
    //   return NextResponse.json(
    //     { error: "Insufficient permissions" },
    //     { status: 403 }
    //   )
    // }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    // Build query
    let query = adminDb.collection("adCampaigns").orderBy("createdAt", "desc")
    
    if (status && status !== "all") {
      query = query.where("status", "==", status)
    }

    const snapshot = await query.limit(limit).offset(offset).get()

    // Get advertiser details for each campaign
    const campaigns = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const campaignData = doc.data()
        
        // Get advertiser info
        let advertiserInfo = null
        if (campaignData.advertiserId) {
          try {
            const advertiserDoc = await adminDb
              .collection("advertisers")
              .doc(campaignData.advertiserId)
              .get()
            
            if (advertiserDoc.exists) {
              const advertiserData = advertiserDoc.data()
              advertiserInfo = {
                companyName: advertiserData?.companyName || "Unknown Company",
                contactEmail: advertiserData?.contactEmail || "No email",
                phone: advertiserData?.phone || "No phone",
                accountBalance: advertiserData?.accountBalance || 0
              }
            }
          } catch (error) {
            console.error("Error fetching advertiser:", error)
          }
        }

        return {
          id: doc.id,
          ...campaignData,
          advertiserInfo,
          createdAt: campaignData.createdAt?.toDate?.() || new Date(),
          updatedAt: campaignData.updatedAt?.toDate?.() || new Date()
        }
      })
    )

    // Get total count for pagination
    const totalSnapshot = await adminDb.collection("adCampaigns").get()
    const total = totalSnapshot.size

    return NextResponse.json({
      campaigns,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    })
  } catch (error) {
    console.error("Error fetching campaigns:", error)
    return NextResponse.json(
      { error: "Failed to fetch campaigns" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const adminDb = getAdminFirestore()
    
    if (!adminDb) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      )
    }

    // TEMPORARY: Skip admin auth for testing
    // TODO: Re-enable admin authentication after Firebase login is fixed
    // const authResult = await verifyAdminAuth(request)
    // if (!authResult.success || !authResult.user) {
    //   return NextResponse.json(
    //     { error: "Unauthorized" },
    //     { status: 401 }
    //   )
    // }

    const { campaignId, action, reason } = await request.json()

    if (!campaignId || !action) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Check permissions based on action
    let requiredPermission: string
    switch (action) {
      case 'approve':
        requiredPermission = 'ads.approve'
        break
      case 'reject':
        requiredPermission = 'ads.reject'
        break
      case 'pause':
        requiredPermission = 'ads.pause'
        break
      case 'resume':
        requiredPermission = 'ads.pause'
        break
      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        )
    }

    // TEMPORARY: Skip permission check for testing
    // if (!hasPermission(authResult.user.role, requiredPermission as any)) {
    //   return NextResponse.json(
    //     { error: "Insufficient permissions" },
    //     { status: 403 }
    //   )
    // }

    // Get campaign
    const campaignRef = adminDb.collection("adCampaigns").doc(campaignId)
    const campaignDoc = await campaignRef.get()

    if (!campaignDoc.exists) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      )
    }

    const campaignData = campaignDoc.data()
    if (!campaignData) {
      return NextResponse.json(
        { error: "Invalid campaign data" },
        { status: 400 }
      )
    }

    let updateData: any = {
      updatedAt: FieldValue.serverTimestamp(),
      reviewedBy: 'temp-admin', // authResult.user.uid,
      reviewedAt: FieldValue.serverTimestamp()
    }

    if (reason) {
      updateData.reviewReason = reason
    }

    // Handle different actions
    switch (action) {
      case 'approve':
        if (campaignData.status !== 'pending_review') {
          return NextResponse.json(
            { error: "Campaign is not pending review" },
            { status: 400 }
          )
        }

        // Reserve funds from advertiser account
        const advertiserRef = adminDb.collection("advertisers").doc(campaignData.advertiserId)
        const advertiserDoc = await advertiserRef.get()
        
        if (!advertiserDoc.exists) {
          return NextResponse.json(
            { error: "Advertiser not found" },
            { status: 404 }
          )
        }

        const advertiserData = advertiserDoc.data()
        const requiredBudget = campaignData.budget?.total || 0

        if (advertiserData && advertiserData.accountBalance < requiredBudget) {
          return NextResponse.json(
            { error: "Insufficient advertiser balance" },
            { status: 400 }
          )
        }

        // Use transaction to ensure atomicity
        await adminDb.runTransaction(async (transaction) => {
          // Deduct funds from advertiser
          transaction.update(advertiserRef, {
            accountBalance: FieldValue.increment(-requiredBudget),
            totalSpent: FieldValue.increment(requiredBudget),
            updatedAt: FieldValue.serverTimestamp()
          })

          // Update campaign status
          transaction.update(campaignRef, {
            ...updateData,
            status: 'active',
            fundsReserved: true,
            approvedAt: FieldValue.serverTimestamp()
          })

          // Create transaction record
          const transactionRef = adminDb.collection("transactions").doc()
          transaction.set(transactionRef, {
            userId: campaignData.advertiserId,
            type: 'debit',
            amount: requiredBudget,
            description: `Campaign approved: ${campaignData.campaignName}`,
            campaignId: campaignId,
            status: 'completed',
            createdAt: FieldValue.serverTimestamp()
          })
        })

        updateData.status = 'active'
        break

      case 'reject':
        if (campaignData.status !== 'pending_review') {
          return NextResponse.json(
            { error: "Campaign is not pending review" },
            { status: 400 }
          )
        }
        updateData.status = 'rejected'
        updateData.rejectedAt = FieldValue.serverTimestamp()
        break

      case 'pause':
        if (campaignData.status !== 'active') {
          return NextResponse.json(
            { error: "Campaign is not active" },
            { status: 400 }
          )
        }
        updateData.status = 'paused'
        updateData.pausedAt = FieldValue.serverTimestamp()
        break

      case 'resume':
        if (campaignData.status !== 'paused') {
          return NextResponse.json(
            { error: "Campaign is not paused" },
            { status: 400 }
          )
        }
        updateData.status = 'active'
        updateData.resumedAt = FieldValue.serverTimestamp()
        break
    }

    // Update campaign if not already done in transaction
    if (action !== 'approve') {
      await campaignRef.update(updateData)
    }

    // Send notification to advertiser
    try {
      const notificationRef = adminDb.collection("notifications").doc()
      await notificationRef.set({
        userId: campaignData.advertiserId,
        type: 'campaign_status_update',
        title: `Campaign ${action === 'approve' ? 'Approved' : action === 'reject' ? 'Rejected' : action === 'pause' ? 'Paused' : 'Resumed'}`,
        message: `Your campaign "${campaignData.campaignName}" has been ${action === 'approve' ? 'approved and is now active' : action === 'reject' ? 'rejected' : action === 'pause' ? 'paused by admin' : 'resumed'}${reason ? `. Reason: ${reason}` : ''}`,
        metadata: {
          campaignId: campaignId,
          action: action,
          reason: reason || null
        },
        read: false,
        createdAt: FieldValue.serverTimestamp()
      })
    } catch (notificationError) {
      console.error("Error sending notification:", notificationError)
      // Don't fail the main operation if notification fails
    }

    return NextResponse.json({
      success: true,
      message: `Campaign ${action}d successfully`,
      campaignId: campaignId
    })
  } catch (error) {
    console.error("Error updating campaign:", error)
    return NextResponse.json(
      { error: "Failed to update campaign" },
      { status: 500 }
    )
  }
}

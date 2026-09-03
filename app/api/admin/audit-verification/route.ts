import { NextRequest, NextResponse } from "next/server"
import { getAdminFirestore } from "@/lib/firebase/admin"
import { requireAdmin } from "@/lib/api-auth"

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/audit-verification
 * Scans all user profiles and products. If a user or product has `verified: true` or `featured: true`
 * without having a paid verification payment (verificationPaymentStatus === 'paid') or being an admin,
 * it resets their `verified` and `featured` status to false.
 */
export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request, ['super_admin', 'admin'])
  if ('error' in authResult) return authResult.error

  try {
    const adminDb = getAdminFirestore()
    if (!adminDb) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 500 })
    }

    let cleanedUsers = 0
    let cleanedProducts = 0

    // 1. Audit Users
    const usersSnapshot = await adminDb.collection("users").get()
    const userBatch = adminDb.batch()

    for (const userDoc of usersSnapshot.docs) {
      const data = userDoc.data()
      const isPaid = data.verificationPaymentStatus === 'paid' || data.verifiedByAdmin === true
      const isAdmin = data.role === 'admin' || data.role === 'super_admin'

      if (!isPaid && !isAdmin) {
        if (data.verified === true || data.featured === true || data.verificationStatus === 'verified') {
          userBatch.update(userDoc.ref, {
            verified: false,
            featured: false,
            verificationStatus: 'none',
            updatedAt: new Date()
          })
          cleanedUsers++
        }
      }
    }

    if (cleanedUsers > 0) {
      await userBatch.commit()
    }

    // 2. Audit Products
    const productsSnapshot = await adminDb.collection("products").get()
    const productBatch = adminDb.batch()

    for (const productDoc of productsSnapshot.docs) {
      const data = productDoc.data()
      const creatorId = data.creatorId

      if (creatorId) {
        const creatorDoc = await adminDb.collection("users").doc(creatorId).get()
        const creatorData = creatorDoc.exists ? creatorDoc.data() : null
        const isPaid = creatorData?.verificationPaymentStatus === 'paid' || creatorData?.verifiedByAdmin === true || data.featuredByAdmin === true

        if (!isPaid && data.featured === true) {
          productBatch.update(productDoc.ref, {
            featured: false,
            updatedAt: new Date()
          })
          cleanedProducts++
        }
      }
    }

    if (cleanedProducts > 0) {
      await productBatch.commit()
    }

    return NextResponse.json({
      success: true,
      message: `Audit completed cleanly. Cleaned ${cleanedUsers} user badges and ${cleanedProducts} product featuring flags.`,
      cleanedUsers,
      cleanedProducts
    })
  } catch (error: any) {
    console.error("Audit verification error:", error)
    return NextResponse.json({ error: error.message || "Failed to audit verification status" }, { status: 500 })
  }
}

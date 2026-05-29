import { NextRequest, NextResponse } from "next/server"
import { getAdminFirestore } from "@/lib/firebase/admin"
import { requireAdmin } from "@/lib/api-auth"

// POST - Fix creator names for existing products (super-admin only migration)
export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request, ['super_admin'])
  if ('error' in authResult) return authResult.error

  try {
    const adminDb = getAdminFirestore()

    if (!adminDb) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      )
    }

    // Get all products with missing or default creator names
    const productsSnapshot = await adminDb
      .collection("products")
      .where("creatorName", "in", ["creator", "", null])
      .get()

    let updatedCount = 0
    let errorCount = 0
    const batch = adminDb.batch()

    for (const productDoc of productsSnapshot.docs) {
      try {
        const productData = productDoc.data()
        const creatorId = productData.creatorId

        if (!creatorId) {
          console.warn(`Product ${productDoc.id} has no creatorId`)
          errorCount++
          continue
        }

        // Get creator information
        const creatorDoc = await adminDb.collection("users").doc(creatorId).get()

        if (creatorDoc.exists) {
          const creatorData = creatorDoc.data()
          const creatorName = creatorData?.storeName ||
            creatorData?.businessName ||
            creatorData?.displayName ||
            creatorData?.email?.split('@')[0] ||
            "creator Store"

          // Update product with proper creator name
          batch.update(productDoc.ref, {
            creatorName: creatorName,
            updatedAt: new Date()
          })
          updatedCount++
        } else {
          console.warn(`creator ${creatorId} not found for product ${productDoc.id}`)
          // Set a default name for products with missing creators
          batch.update(productDoc.ref, {
            creatorName: "creator Store",
            updatedAt: new Date()
          })
          updatedCount++
        }
      } catch (error) {
        console.error(`Error processing product ${productDoc.id}:`, error)
        errorCount++
      }
    }

    // Commit the batch update
    if (updatedCount > 0) {
      await batch.commit()
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${updatedCount} products. ${errorCount} errors.`,
      updatedCount,
      errorCount,
      totalProcessed: productsSnapshot.size
    })

  } catch (error) {
    console.error("Error fixing creator names:", error)
    return NextResponse.json(
      { error: "Failed to fix creator names" },
      { status: 500 }
    )
  }
}

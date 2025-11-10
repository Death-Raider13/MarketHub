import { NextRequest, NextResponse } from "next/server"
import { getAdminFirestore } from "@/lib/firebase/admin"

// POST - Fix vendor names for existing products
export async function POST(request: NextRequest) {
  try {
    const adminDb = getAdminFirestore()
    
    if (!adminDb) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      )
    }

    // Get all products with missing or default vendor names
    const productsSnapshot = await adminDb
      .collection("products")
      .where("vendorName", "in", ["Vendor", "", null])
      .get()

    let updatedCount = 0
    let errorCount = 0
    const batch = adminDb.batch()

    for (const productDoc of productsSnapshot.docs) {
      try {
        const productData = productDoc.data()
        const vendorId = productData.vendorId

        if (!vendorId) {
          console.warn(`Product ${productDoc.id} has no vendorId`)
          errorCount++
          continue
        }

        // Get vendor information
        const vendorDoc = await adminDb.collection("users").doc(vendorId).get()
        
        if (vendorDoc.exists) {
          const vendorData = vendorDoc.data()
          const vendorName = vendorData?.storeName || 
                           vendorData?.businessName || 
                           vendorData?.displayName || 
                           vendorData?.email?.split('@')[0] || 
                           "Vendor Store"

          // Update product with proper vendor name
          batch.update(productDoc.ref, { 
            vendorName: vendorName,
            updatedAt: new Date()
          })
          updatedCount++
        } else {
          console.warn(`Vendor ${vendorId} not found for product ${productDoc.id}`)
          // Set a default name for products with missing vendors
          batch.update(productDoc.ref, { 
            vendorName: "Vendor Store",
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
    console.error("Error fixing vendor names:", error)
    return NextResponse.json(
      { error: "Failed to fix vendor names" },
      { status: 500 }
    )
  }
}

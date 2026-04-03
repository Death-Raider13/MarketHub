import { NextRequest, NextResponse } from "next/server"
import { getAdminFirestore } from "@/lib/firebase/admin"
import { FieldValue } from "firebase-admin/firestore"

// GET - Get single product
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminDb = getAdminFirestore()

    if (!adminDb) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      )
    }

    const productDoc = await adminDb.collection("products").doc(params.id).get()

    if (!productDoc.exists) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: productDoc.id,
      ...productDoc.data(),
    })
  } catch (error) {
    console.error("Error fetching product:", error)
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    )
  }
}

// PUT - Update product
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminDb = getAdminFirestore()

    if (!adminDb) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      )
    }

    const updates = await request.json()

    // Handle SEO fields remapping
    if (updates.seoTitle !== undefined || updates.seoDescription !== undefined) {
      const productDoc = await adminDb.collection("products").doc(params.id).get()
      const currentData = productDoc.data() || {}
      
      updates.seo = {
        title: updates.seoTitle !== undefined ? updates.seoTitle : (currentData.seo?.title || currentData.name || ""),
        description: updates.seoDescription !== undefined ? updates.seoDescription : (currentData.seo?.description || currentData.description || ""),
      }
      
      delete updates.seoTitle
      delete updates.seoDescription
    }

    // Sanitize stock and shipping for digital products
    if (updates.stock !== undefined) {
      updates.stock = updates.stock ? parseInt(updates.stock as string) : null
    }

    if (updates.type === "digital" || updates.type === "service") {
      updates.shippingInfo = null
    }

    // Update product
    await adminDb.collection("products").doc(params.id).update({
      ...updates,
      updatedAt: FieldValue.serverTimestamp(),
    })

    return NextResponse.json({
      success: true,
      message: "Product updated successfully",
    })
  } catch (error) {
    console.error("Error updating product:", error)
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    )
  }
}

// DELETE - Delete product
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminDb = getAdminFirestore()

    if (!adminDb) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      )
    }

    // Soft delete - just archive it
    await adminDb.collection("products").doc(params.id).update({
      status: "archived",
      updatedAt: FieldValue.serverTimestamp(),
    })

    return NextResponse.json({
      success: true,
      message: "Product archived successfully",
    })
  } catch (error) {
    console.error("Error deleting product:", error)
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    )
  }
}

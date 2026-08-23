import { NextRequest, NextResponse } from "next/server"
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { getAdminFirestore } from "@/lib/firebase/admin"
import { FieldValue } from "firebase-admin/firestore"
import { verifyAuthToken } from "@/lib/api-auth"

/**
 * Asserts the authenticated caller owns the product OR is an admin.
 * Returns null when authorized, or a NextResponse error when not.
 */
async function assertProductOwner(
  request: NextRequest,
  productId: string
): Promise<{ uid: string } | NextResponse> {
  const auth = await verifyAuthToken(request)
  if ('error' in auth) return auth.error

  const adminDb = getAdminFirestore()
  if (!adminDb) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
  }

  const productDoc = await adminDb.collection("products").doc(productId).get()
  if (!productDoc.exists) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 })
  }

  const ownerId = productDoc.data()?.creatorId
  const isAdmin = auth.user.role === 'admin' || auth.user.role === 'super_admin'
  if (ownerId !== auth.user.uid && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  return { uid: auth.user.uid }
}

// GET - Get single product (public)
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

// PUT - Update product (owner or admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const ownership = await assertProductOwner(request, params.id)
  if (ownership instanceof NextResponse) return ownership

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

// DELETE - Archive product (owner or admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const ownership = await assertProductOwner(request, params.id)
  if (ownership instanceof NextResponse) return ownership

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

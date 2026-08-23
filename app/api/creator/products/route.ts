import { NextRequest, NextResponse } from "next/server"
import { getAdminFirestore } from "@/lib/firebase/admin"
import { FieldValue } from "firebase-admin/firestore"
import { verifyAuthToken } from "@/lib/api-auth"

// GET - List all products for a creator (public — storefronts are browsable)
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
    const creatorId = searchParams.get("creatorId")

    if (!creatorId) {
      return NextResponse.json(
        { error: "Missing creatorId" },
        { status: 400 }
      )
    }

    const productsSnapshot = await adminDb
      .collection("products")
      .where("creatorId", "==", creatorId)
      .orderBy("createdAt", "desc")
      .get()

    const products = productsSnapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }))

    return NextResponse.json({ products })
  } catch (error) {
    console.error("Error fetching products:", error)
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    )
  }
}

// POST - Create a new product (auth required, creator can only create for self)
export async function POST(request: NextRequest) {
  const auth = await verifyAuthToken(request)
  if ('error' in auth) return auth.error

  try {
    const productData = await request.json()

    const adminDb = getAdminFirestore()

    if (!adminDb) {
      console.error("❌ Firebase Admin SDK not initialized. Check environment variables.")
      return NextResponse.json(
        {
          error: "Server configuration error. Please ensure Firebase Admin credentials are set.",
          details: "FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY must be configured."
        },
        { status: 500 }
      )
    }

    // Always use the authenticated user as creatorId — body value is ignored.
    const creatorId = auth.user.uid
    const userDoc = await adminDb.collection('users').doc(creatorId).get()
    const userData = userDoc.data() || {}
    if (userData.role !== 'creator') {
      return NextResponse.json({ error: 'Only creator accounts can upload products' }, { status: 403 })
    }

    // The first three book uploads are free. Additional uploads require a
    // server-managed paid entitlement; clients cannot unlock this themselves.
    const existingProducts = await adminDb.collection('products').where('creatorId', '==', creatorId).get()
    const uploadCount = existingProducts.size
    const freeBookLimit = 3
    const access = userData.creatorUploadAccess || {}
    const accessExpiry = access.expiresAt?.toDate?.() || (access.expiresAt ? new Date(access.expiresAt) : null)
    const paidUploadAccess = access.status === 'active' && (!accessExpiry || accessExpiry > new Date())
    if (uploadCount >= freeBookLimit && !paidUploadAccess) {
      const waitlistEligible = userData.waitlistEligible === true || userData.waitlistMember === true
      return NextResponse.json({
        error: 'Your three free book uploads have been used. Purchase creator upload access to add more books.',
        code: 'CREATOR_UPLOAD_ACCESS_REQUIRED',
        uploadCount,
        freeBookLimit,
        feeAmount: waitlistEligible ? 3000 : 4000,
        feeType: waitlistEligible ? 'creator_waitlist_additional_upload' : 'creator_additional_upload',
        waitlistEligible,
      }, { status: 402 })
    }

    const {
      creatorId: _bodyCreatorId,
      creatorName,
      name,
      description,
      price,
      compareAtPrice,
      category,
      subcategory,
      images,
      stock,
      sku,
      type,
      digitalFiles,
      variants,
      tags,
      status,
      shippingInfo,
      seoTitle,
      seoDescription,
      accessDuration,
      downloadLimit,
    } = productData

    if (!name || !price || !category || !type) {
      const missingFields = [];
      if (!name) missingFields.push('name');
      if (!price) missingFields.push('price');
      if (!category) missingFields.push('category');
      if (!type) missingFields.push('type');

      console.error("Missing required fields:", missingFields);
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }

    // Get creator information to ensure proper creator name
    let finalcreatorName = creatorName || userData.storeName || userData.businessName || userData.displayName || "creator"

    // If no creator name provided, try to fetch from user profile
    if (!creatorName || creatorName === "creator") {
      try {
        const creatorDoc = await adminDb.collection("users").doc(creatorId).get()
        if (creatorDoc.exists) {
          const creatorData = creatorDoc.data()
          finalcreatorName = creatorData?.storeName ||
            creatorData?.businessName ||
            creatorData?.displayName ||
            creatorData?.email?.split('@')[0] ||
            "creator"
        }
      } catch (error) {
        console.warn("Could not fetch creator name from user profile:", error)
      }
    }

    // Create product
    const productRef = await adminDb.collection("products").add({
      creatorId,
      creatorName: finalcreatorName,
      name,
      description: description || "",
      price: parseFloat(price),
      compareAtPrice: compareAtPrice ? parseFloat(compareAtPrice) : null,
      category,
      subcategory: subcategory || "",
      images: images || [],
      stock: stock ? parseInt(stock) : null,
      sku: sku || "",
      type, // physical, digital, service
      digitalFiles: digitalFiles || [],
      accessDuration: accessDuration || 0, // 0 = lifetime
      downloadLimit: downloadLimit || 0, // 0 = unlimited
      variants: variants || [],
      tags: tags || [],
      status: status || "pending", // active, draft, archived, pending
      shippingInfo: type === "physical" ? (shippingInfo || {}) : null,
      seo: {
        title: seoTitle || name,
        description: seoDescription || description || "",
      },
      stats: {
        views: 0,
        sales: 0,
        revenue: 0,
        rating: 0,
        reviewCount: 0,
      },
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })

    return NextResponse.json({
      success: true,
      productId: productRef.id,
      message: "Product created successfully",
    })
  } catch (error) {
    console.error("Error creating product:", error)
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    )
  }
}

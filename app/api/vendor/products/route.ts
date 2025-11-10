import { NextRequest, NextResponse } from "next/server"
import { getAdminFirestore } from "@/lib/firebase/admin"
import { FieldValue } from "firebase-admin/firestore"

// GET - List all products for a vendor
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
    const vendorId = searchParams.get("vendorId")

    if (!vendorId) {
      return NextResponse.json(
        { error: "Missing vendorId" },
        { status: 400 }
      )
    }

    const productsSnapshot = await adminDb
      .collection("products")
      .where("vendorId", "==", vendorId)
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

// POST - Create a new product
export async function POST(request: NextRequest) {
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

    const {
      vendorId,
      vendorName,
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

    if (!vendorId || !name || !price || !category || !type) {
      const missingFields = [];
      if (!vendorId) missingFields.push('vendorId');
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

    // Get vendor information to ensure proper vendor name
    let finalVendorName = vendorName || "Vendor"
    
    // If no vendor name provided, try to fetch from user profile
    if (!vendorName || vendorName === "Vendor") {
      try {
        const vendorDoc = await adminDb.collection("users").doc(vendorId).get()
        if (vendorDoc.exists) {
          const vendorData = vendorDoc.data()
          finalVendorName = vendorData?.storeName || 
                           vendorData?.businessName || 
                           vendorData?.displayName || 
                           vendorData?.email?.split('@')[0] || 
                           "Vendor"
        }
      } catch (error) {
        console.warn("Could not fetch vendor name from user profile:", error)
      }
    }

    // Create product
    const productRef = await adminDb.collection("products").add({
      vendorId,
      vendorName: finalVendorName,
      name,
      description: description || "",
      price: parseFloat(price),
      compareAtPrice: compareAtPrice ? parseFloat(compareAtPrice) : null,
      category,
      subcategory: subcategory || "",
      images: images || [],
      stock: type === "physical" ? parseInt(stock || 0) : null,
      sku: sku || "",
      type, // physical, digital, service
      digitalFiles: digitalFiles || [],
      accessDuration: accessDuration || 0, // 0 = lifetime
      downloadLimit: downloadLimit || 0, // 0 = unlimited
      variants: variants || [],
      tags: tags || [],
      status: status || "active", // active, draft, archived
      shippingInfo: shippingInfo || {},
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

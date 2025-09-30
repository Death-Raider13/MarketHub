import { NextRequest, NextResponse } from 'next/server';
import { rateLimitMiddleware, getRateLimitIdentifier, getClientIP } from '@/lib/rate-limit';
import { collection, addDoc, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

// GET - Fetch products
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const limitParam = searchParams.get('limit') || '20';
    
    // Build query
    let q = query(
      collection(db, 'products'),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc'),
      limit(parseInt(limitParam))
    );
    
    if (category) {
      q = query(
        collection(db, 'products'),
        where('status', '==', 'active'),
        where('category', '==', category),
        orderBy('createdAt', 'desc'),
        limit(parseInt(limitParam))
      );
    }
    
    const snapshot = await getDocs(q);
    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    
    // Filter by search term if provided (client-side filtering)
    let filteredProducts = products;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredProducts = products.filter((product: any) =>
        product.name?.toLowerCase().includes(searchLower) ||
        product.description?.toLowerCase().includes(searchLower)
      );
    }
    
    return NextResponse.json({ products: filteredProducts });
    
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// POST - Create product (vendors only)
export async function POST(request: NextRequest) {
  try {
    // Get client IP
    const ip = getClientIP(request);
    
    // Parse request body
    const body = await request.json();
    const { userId, vendorId } = body;
    
    // Create rate limit identifier
    const identifier = getRateLimitIdentifier(ip, userId);
    
    // Check rate limit
    const rateLimitResult = await rateLimitMiddleware(identifier, 'PRODUCT_CREATE');
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: rateLimitResult.error,
          retryAfter: rateLimitResult.retryAfter,
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(rateLimitResult.retryAfter),
          },
        }
      );
    }
    
    // Validate and sanitize input using Zod schema
    const { productSchema } = await import('@/lib/validation');
    
    try {
      const validatedData = productSchema.parse(body);
      
      // Create product in Firestore with sanitized data
      const productData = {
        ...validatedData,
        status: 'pending', // Requires admin approval
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const docRef = await addDoc(collection(db, 'products'), productData);
      
      return NextResponse.json(
        { 
          success: true,
          productId: docRef.id,
          message: 'Product created successfully. Awaiting admin approval.',
        },
        { status: 201 }
      );
    } catch (validationError: any) {
      // Return validation errors
      if (validationError.errors) {
        return NextResponse.json(
          { 
            error: 'Validation failed',
            details: validationError.errors.map((err: any) => ({
              field: err.path.join('.'),
              message: err.message,
            })),
          },
          { status: 400 }
        );
      }
      throw validationError;
    }
    
  } catch (error: any) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}

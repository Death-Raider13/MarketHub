import { NextRequest, NextResponse } from 'next/server';
import { rateLimitMiddleware, getRateLimitIdentifier, getClientIP } from '@/lib/rate-limit';
import { getAdminFirestore } from '@/lib/firebase/admin-simple';
import { verifyAuthToken } from '@/lib/api-auth';
import { logger } from '@/lib/logger';

// GET - Fetch products
export async function GET(request: NextRequest) {
  try {
    const adminDb = getAdminFirestore();
    if (!adminDb) return NextResponse.json({ error: 'Database error' }, { status: 500 });

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const institutionType = searchParams.get('institutionType');
    const institution = searchParams.get('institution');
    const level = searchParams.get('level');
    const department = searchParams.get('department');
    const courseCode = searchParams.get('courseCode');
    const limitParam = parseInt(searchParams.get('limit') || '20');

    // Build query with Admin SDK
    let query: FirebaseFirestore.Query = adminDb.collection('products')
      .where('status', '==', 'active')
      .orderBy('createdAt', 'desc')
      .limit(limitParam);

    if (category) {
      query = query.where('category', '==', category);
    }
    if (institutionType) {
      query = query.where('institutionType', '==', institutionType);
    }
    if (institution) {
      query = query.where('institution', '==', institution);
    }
    if (level) {
      query = query.where('level', '==', level);
    }
    if (department) {
      query = query.where('department', '==', department);
    }
    if (courseCode) {
      query = query.where('courseCode', '==', courseCode.toUpperCase().replace(/\s+/g, ''));
    }

    const snapshot = await query.get();
    let products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Filter by search term if provided (client-side filtering)
    if (search) {
      const searchLower = search.toLowerCase();
      products = products.filter((product: any) =>
        product.name?.toLowerCase().includes(searchLower) ||
        product.description?.toLowerCase().includes(searchLower)
      );
    }

    return NextResponse.json({ products });

  } catch (error: any) {
    logger.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// POST - Create product (creators only)
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const authResult = await verifyAuthToken(request);
    if ('error' in authResult) {
      return authResult.error;
    }

    const { user } = authResult;
    const adminDb = getAdminFirestore();
    if (!adminDb) return NextResponse.json({ error: 'Database error' }, { status: 500 });

    const ip = getClientIP(request);
    const userId = user.uid;

    // 2. Rate limiting
    const identifier = getRateLimitIdentifier(ip, userId);
    const rateLimitResult = await rateLimitMiddleware(identifier, 'PRODUCT_CREATE');

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: rateLimitResult.error },
        { status: 429 }
      );
    }

    // 3. Validate input
    const body = await request.json();
    const { productSchema } = await import('@/lib/validation');

    try {
      const validatedData = productSchema.parse(body);

      // SECURITY: Enforce that creatorId matches the authenticated user
      // or the user is an admin bypassing the check (if we had admin roles checked here)
      if (validatedData.creatorId !== userId) {
        logger.warn(`Security Alert: Mismatched creatorId during product creation. token_uid=${userId}, body_creatorId=${validatedData.creatorId}`);
        return NextResponse.json({ error: 'Mismatched creator affiliation' }, { status: 403 });
      }

      // 4. Create product with sanitized data
      const productData = {
        ...validatedData,
        status: 'pending', // Requires admin approval
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docRef = await adminDb.collection('products').add(productData);
      logger.info(`Product created: ${docRef.id} by creator: ${userId}`);

      return NextResponse.json(
        {
          success: true,
          productId: docRef.id,
          message: 'Product created successfully. Awaiting admin approval.',
        },
        { status: 201 }
      );
    } catch (validationError: any) {
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
    logger.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}


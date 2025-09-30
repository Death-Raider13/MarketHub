import { NextRequest, NextResponse } from 'next/server';
import { rateLimitMiddleware, getRateLimitIdentifier, getClientIP } from '@/lib/rate-limit';
import { reviewSchema } from '@/lib/validation';
import { collection, addDoc, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

// GET - Fetch product reviews
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    
    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }
    
    // Build query
    const q = query(
      collection(db, 'reviews'),
      where('productId', '==', productId),
      where('approved', '==', true),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    const reviews = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    
    return NextResponse.json({ reviews });
    
  } catch (error: any) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

// POST - Create review
export async function POST(request: NextRequest) {
  try {
    // Get client IP
    const ip = getClientIP(request);
    
    // Parse request body
    const body = await request.json();
    const { userId } = body;
    
    // Create rate limit identifier
    const identifier = getRateLimitIdentifier(ip, userId);
    
    // Check rate limit
    const rateLimitResult = await rateLimitMiddleware(identifier, 'REVIEW_CREATE');
    
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
    
    // Validate and sanitize input
    try {
      const validatedData = reviewSchema.parse(body);
      
      // Create review in Firestore
      const reviewData = {
        ...validatedData,
        approved: false, // Requires admin approval
        helpful: 0,
        createdAt: new Date(),
      };
      
      const docRef = await addDoc(collection(db, 'reviews'), reviewData);
      
      return NextResponse.json(
        { 
          success: true,
          reviewId: docRef.id,
          message: 'Review submitted successfully. Awaiting approval.',
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
    console.error('Error creating review:', error);
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    );
  }
}

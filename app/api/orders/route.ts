import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { rateLimitMiddleware, getRateLimitIdentifier, getClientIP } from '@/lib/rate-limit';
import { orderSchema } from '@/lib/validation';
import { verifyAuthToken } from '@/lib/api-auth';
import { getAdminFirestore } from '@/lib/firebase/admin-simple';

// GET - Fetch user orders (authenticated)
export async function GET(request: NextRequest) {
  // Verify authentication
  const authResult = await verifyAuthToken(request);
  if ('error' in authResult) return authResult.error;

  const { uid } = authResult.user;

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    // Users can only fetch their own orders (admins handled separately)
    if (userId && userId !== uid) {
      return NextResponse.json(
        { error: 'Unauthorized: cannot access other users\' orders' },
        { status: 403 }
      );
    }

    const adminDb = getAdminFirestore();
    if (!adminDb) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const snapshot = await adminDb
      .collection('orders')
      .where('userId', '==', uid)
      .orderBy('createdAt', 'desc')
      .get();

    const orders = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));
    
    return NextResponse.json({ orders });
    
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

// POST - Create order (authenticated)
export async function POST(request: NextRequest) {
  // Verify authentication
  const authResult = await verifyAuthToken(request);
  if ('error' in authResult) return authResult.error;

  const { uid } = authResult.user;

  try {
    // Get client IP
    const ip = getClientIP(request);
    
    // Parse request body
    const body = await request.json();
    
    // Ensure the order is created for the authenticated user
    body.userId = uid;
    
    // Create rate limit identifier
    const identifier = getRateLimitIdentifier(ip, uid);
    
    // Check rate limit
    const rateLimitResult = await rateLimitMiddleware(identifier, 'ORDER_CREATE');
    
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
      const validatedData = orderSchema.parse(body);
      
      // Calculate totals
      const subtotal = validatedData.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      
      // Verify total matches
      if (Math.abs(validatedData.total - subtotal) > 0.01) {
        return NextResponse.json(
          { error: 'Order total mismatch' },
          { status: 400 }
        );
      }

      const adminDb = getAdminFirestore();
      if (!adminDb) {
        return NextResponse.json(
          { error: 'Server configuration error' },
          { status: 500 }
        );
      }
      
      // 3. Create order in Firestore using Admin SDK
      const orderData = {
        ...validatedData,
        status: 'pending',
        fulfillmentStatus: 'not_applicable', // Digital/Service don't use physical fulfillment
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const docRef = await adminDb.collection('orders').add(orderData);
      
      return NextResponse.json(
        { 
          success: true,
          orderId: docRef.id,
          message: 'Order created successfully',
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
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}

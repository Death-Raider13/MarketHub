import { NextRequest, NextResponse } from 'next/server';
import { rateLimitMiddleware, getRateLimitIdentifier, getClientIP } from '@/lib/rate-limit';
import { orderSchema } from '@/lib/validation';
import { collection, addDoc, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

// GET - Fetch user orders
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // Build query
    const q = query(
      collection(db, 'orders'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    const orders = snapshot.docs.map(doc => ({
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

// POST - Create order
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
      
      // Create order in Firestore
      const orderData = {
        ...validatedData,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const docRef = await addDoc(collection(db, 'orders'), orderData);
      
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

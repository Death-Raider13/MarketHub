import { NextRequest, NextResponse } from 'next/server';
import { rateLimitMiddleware, getRateLimitIdentifier, getClientIP } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // Get client IP
    const ip = getClientIP(request);
    
    // Parse request body
    const body = await request.json();
    const { email } = body;
    
    // Create rate limit identifier (use email if provided, otherwise IP)
    const identifier = getRateLimitIdentifier(ip, email);
    
    // Check rate limit
    const rateLimitResult = await rateLimitMiddleware(identifier, 'LOGIN');
    
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
    
    // Your login logic here
    // This is handled by Firebase Auth on the client side
    // This endpoint is just an example of how to add rate limiting
    
    return NextResponse.json({ success: true });
    
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Global Middleware for Rate Limiting
 * Runs on every request to protect the application
 */

// Simple in-memory rate limit store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limit configuration
const RATE_LIMIT_CONFIG = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100, // 100 requests per minute per IP
};

// Stricter limits for specific paths
const PATH_LIMITS: Record<string, { windowMs: number; maxRequests: number }> = {
  '/api/auth/login': { windowMs: 60 * 1000, maxRequests: 5 },
  '/api/auth/signup': { windowMs: 60 * 1000, maxRequests: 3 },
  '/api/auth/reset-password': { windowMs: 60 * 1000, maxRequests: 3 },
  '/api/orders': { windowMs: 60 * 1000, maxRequests: 5 },
  '/api/products': { windowMs: 60 * 1000, maxRequests: 10 },
  '/api/reviews': { windowMs: 60 * 1000, maxRequests: 5 },
  '/api/messages': { windowMs: 60 * 1000, maxRequests: 20 },
  '/api/upload': { windowMs: 60 * 1000, maxRequests: 10 },
  '/api/payment': { windowMs: 60 * 1000, maxRequests: 3 },
};

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  
  return (
    cfConnectingIp ||
    realIp ||
    forwarded?.split(',')[0] ||
    'unknown'
  );
}

function getRateLimitConfig(pathname: string) {
  // Check for exact path match
  if (PATH_LIMITS[pathname]) {
    return PATH_LIMITS[pathname];
  }
  
  // Check for path prefix match
  for (const [path, config] of Object.entries(PATH_LIMITS)) {
    if (pathname.startsWith(path)) {
      return config;
    }
  }
  
  return RATE_LIMIT_CONFIG;
}

function checkRateLimit(
  identifier: string,
  config: { windowMs: number; maxRequests: number }
): { allowed: boolean; remaining: number; retryAfter?: number } {
  const now = Date.now();
  let store = rateLimitStore.get(identifier);
  
  // Initialize or reset if window has passed
  if (!store || now > store.resetTime) {
    store = {
      count: 0,
      resetTime: now + config.windowMs,
    };
    rateLimitStore.set(identifier, store);
  }
  
  // Increment request count
  store.count++;
  
  const allowed = store.count <= config.maxRequests;
  const remaining = Math.max(0, config.maxRequests - store.count);
  const retryAfter = allowed ? undefined : Math.ceil((store.resetTime - now) / 1000);
  
  return { allowed, remaining, retryAfter };
}

// Blocked IPs (for severe abuse)
const blockedIPs = new Set<string>([
  // Add IPs to block here
]);

// Whitelist IPs (trusted sources)
const whitelistedIPs = new Set<string>([
  '127.0.0.1',
  'localhost',
  // Add trusted IPs here
]);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip rate limiting for static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|css|js|woff|woff2|ttf|eot)$/)
  ) {
    return NextResponse.next();
  }
  
  const ip = getClientIP(request);
  
  // Check if IP is blocked
  if (blockedIPs.has(ip)) {
    return new NextResponse(
      JSON.stringify({
        error: 'Access denied',
        message: 'Your IP has been blocked due to suspicious activity',
      }),
      {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
  
  // Skip rate limiting for whitelisted IPs
  if (whitelistedIPs.has(ip)) {
    return NextResponse.next();
  }
  
  // Get rate limit config for this path
  const config = getRateLimitConfig(pathname);
  
  // Create identifier (IP + path for more granular control)
  const identifier = `${ip}:${pathname}`;
  
  // Check rate limit
  const result = checkRateLimit(identifier, config);
  
  // Create response
  const response = result.allowed
    ? NextResponse.next()
    : new NextResponse(
        JSON.stringify({
          error: 'Too Many Requests',
          message: `Rate limit exceeded. Please try again in ${result.retryAfter} seconds.`,
          retryAfter: result.retryAfter,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(result.retryAfter),
          },
        }
      );
  
  // Add rate limit headers
  response.headers.set('X-RateLimit-Limit', String(config.maxRequests));
  response.headers.set('X-RateLimit-Remaining', String(result.remaining));
  response.headers.set('X-RateLimit-Reset', String(Math.ceil(Date.now() / 1000) + (config.windowMs / 1000)));
  
  return response;
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

// Cleanup old entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, store] of rateLimitStore.entries()) {
      if (now > store.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

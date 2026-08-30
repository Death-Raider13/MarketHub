import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { checkRateLimit, sweepMemoryStore } from '@/lib/rate-limit-store';

/**
 * Global middleware: rate limiting + security headers.
 *
 * Rate limit counters live in Upstash Redis (REDIS_URL + REDIS_TOKEN) when
 * configured, so they survive across serverless instances. Falls back to a
 * per-instance in-memory map for local development.
 */

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
  '/api/download': { windowMs: 5 * 60 * 1000, maxRequests: 5 }, // 5 downloads per 5 minutes
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

// Blocked IPs (for severe abuse)
const blockedIPs = new Set<string>([
  // Add IPs to block here
]);

// Whitelist IPs (trusted sources)
const whitelistedIPs = new Set<string>([
  '127.0.0.1',
  'localhost',
  '::1',
  // Add trusted IPs here
]);

function buildSecurityHeaders(response: NextResponse, pathname: string, method: string) {
  // CORS for API routes. Tighten via ALLOWED_ORIGINS in production.
  if (pathname.startsWith('/api')) {
    const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
    response.headers.set('Access-Control-Allow-Origin', allowedOrigin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    response.headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Requested-With'
    );
  }

  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(self "https://js.paystack.co")'
  );
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');

  // CSP — locked to known asset & payment origins. Adjust if you add new CDNs.
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.paystack.co https://checkout.paystack.com https://*.paystack.co https://*.paystack.com https://commerce.coinbase.com https://www.googletagmanager.com https://www.google-analytics.com https://*.firebaseapp.com https://apis.google.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https: ",
    "font-src 'self' https://fonts.gstatic.com data:",
    "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://api.paystack.co https://*.paystack.co https://*.paystack.com https://api.commerce.coinbase.com https://ik.imagekit.io https://upload.imagekit.io https://*.imagekit.io https://res.cloudinary.com https://api.cloudinary.com https://*.cloudinary.com https://*.r2.cloudflarestorage.com https://*.r2.dev https://www.google-analytics.com https://*.sentry.io",
    "frame-src 'self' https://js.paystack.co https://checkout.paystack.com https://*.paystack.co https://*.paystack.com https://commerce.coinbase.com https://*.firebaseapp.com",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join('; ');
  response.headers.set('Content-Security-Policy', csp);

  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Firebase may still have the legacy Vercel URL saved as the project's
  // custom email action handler. Redirect that host to the canonical site
  // before the client handler runs, preserving every Firebase query parameter.
  const host = request.headers.get('host')?.split(':')[0].toLowerCase();
  if (
    host === 'marketplace-ecommerce-one.vercel.app' &&
    pathname === '/auth/action'
  ) {
    const canonicalUrl = new URL('https://www.fero-elibrary.shop/auth/action');
    request.nextUrl.searchParams.forEach((value, key) => canonicalUrl.searchParams.set(key, value));
    return NextResponse.redirect(canonicalUrl, 308);
  }

  // Static assets & internals bypass everything
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|css|js|woff|woff2|ttf|eot|map)$/)
  ) {
    return NextResponse.next();
  }

  // Always handle CORS preflight first
  if (request.method === 'OPTIONS' && pathname.startsWith('/api')) {
    const preflight = new NextResponse(null, { status: 204 });
    return buildSecurityHeaders(preflight, pathname, 'OPTIONS');
  }

  // Skip rate limiting in development, but still apply security headers
  if (process.env.NODE_ENV === 'development') {
    return buildSecurityHeaders(NextResponse.next(), pathname, request.method);
  }

  const ip = getClientIP(request);

  if (blockedIPs.has(ip)) {
    const blocked = new NextResponse(
      JSON.stringify({
        error: 'Access denied',
        message: 'Your IP has been blocked due to suspicious activity',
      }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
    return buildSecurityHeaders(blocked, pathname, request.method);
  }

  if (whitelistedIPs.has(ip)) {
    return buildSecurityHeaders(NextResponse.next(), pathname, request.method);
  }

  const config = getRateLimitConfig(pathname);
  const identifier = `${ip}:${pathname}`;

  const result = await checkRateLimit(identifier, config);
  sweepMemoryStore();

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
            'Retry-After': String(result.retryAfter ?? 60),
          },
        }
      );

  response.headers.set('X-RateLimit-Limit', String(result.limit));
  response.headers.set('X-RateLimit-Remaining', String(result.remaining));
  response.headers.set('X-RateLimit-Reset', String(result.resetAt));

  return buildSecurityHeaders(response, pathname, request.method);
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


/**
 * Rate Limiting Implementation for Nigerian E-commerce Platform
 * Protects against brute force attacks, spam, and abuse
 */

interface RateLimitConfig {
  interval: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests allowed in the interval
}

interface RateLimitStore {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting (use Redis in production)
const rateLimitStore = new Map<string, RateLimitStore>();

/**
 * Rate limit configurations for different endpoints
 */
export const RATE_LIMITS = {
  // Authentication endpoints
  LOGIN: { interval: 60 * 1000, maxRequests: 5 }, // 5 attempts per minute
  SIGNUP: { interval: 60 * 1000, maxRequests: 3 }, // 3 signups per minute
  PASSWORD_RESET: { interval: 60 * 1000, maxRequests: 3 }, // 3 resets per minute
  
  // API endpoints
  API_GENERAL: { interval: 60 * 1000, maxRequests: 100 }, // 100 requests per minute
  API_SEARCH: { interval: 60 * 1000, maxRequests: 30 }, // 30 searches per minute
  
  // Product operations
  PRODUCT_CREATE: { interval: 60 * 1000, maxRequests: 10 }, // 10 products per minute
  PRODUCT_UPDATE: { interval: 60 * 1000, maxRequests: 20 }, // 20 updates per minute
  
  // Order operations
  ORDER_CREATE: { interval: 60 * 1000, maxRequests: 5 }, // 5 orders per minute
  
  // Review operations
  REVIEW_CREATE: { interval: 60 * 1000, maxRequests: 5 }, // 5 reviews per minute
  
  // Message operations
  MESSAGE_SEND: { interval: 60 * 1000, maxRequests: 20 }, // 20 messages per minute
  
  // Image upload
  IMAGE_UPLOAD: { interval: 60 * 1000, maxRequests: 10 }, // 10 images per minute
  
  // Payment operations
  PAYMENT_INITIATE: { interval: 60 * 1000, maxRequests: 3 }, // 3 payment attempts per minute
} as const;

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (email, IP, userId)
 * @param config - Rate limit configuration
 * @returns Object with allowed status and retry info
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
} {
  const now = Date.now();
  const key = identifier;
  
  let store = rateLimitStore.get(key);
  
  // Initialize or reset if interval has passed
  if (!store || now > store.resetTime) {
    store = {
      count: 0,
      resetTime: now + config.interval,
    };
    rateLimitStore.set(key, store);
  }
  
  // Increment request count
  store.count++;
  
  const allowed = store.count <= config.maxRequests;
  const remaining = Math.max(0, config.maxRequests - store.count);
  const retryAfter = allowed ? undefined : Math.ceil((store.resetTime - now) / 1000);
  
  return {
    allowed,
    remaining,
    resetTime: store.resetTime,
    retryAfter,
  };
}

/**
 * Middleware function for rate limiting
 * Use this in your API routes
 */
export async function rateLimitMiddleware(
  identifier: string,
  limitType: keyof typeof RATE_LIMITS
): Promise<{ success: boolean; error?: string; retryAfter?: number }> {
  const config = RATE_LIMITS[limitType];
  const result = checkRateLimit(identifier, config);
  
  if (!result.allowed) {
    return {
      success: false,
      error: `Too many requests. Please try again in ${result.retryAfter} seconds.`,
      retryAfter: result.retryAfter,
    };
  }
  
  return { success: true };
}

/**
 * Get rate limit identifier from request
 * Combines IP address and user ID for better tracking
 */
export function getRateLimitIdentifier(
  ip: string | null,
  userId?: string
): string {
  if (userId) {
    return `user:${userId}`;
  }
  
  if (ip) {
    return `ip:${ip}`;
  }
  
  return 'anonymous';
}

/**
 * Clean up old rate limit entries (run periodically)
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  
  for (const [key, store] of rateLimitStore.entries()) {
    if (now > store.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Clean up every 5 minutes
if (typeof window === 'undefined') {
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
}

/**
 * Rate limit decorator for functions
 */
export function withRateLimit<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  limitType: keyof typeof RATE_LIMITS,
  getIdentifier: (...args: Parameters<T>) => string
): T {
  return (async (...args: Parameters<T>) => {
    const identifier = getIdentifier(...args);
    const result = await rateLimitMiddleware(identifier, limitType);
    
    if (!result.success) {
      throw new Error(result.error);
    }
    
    return fn(...args);
  }) as T;
}

/**
 * Check if IP is from Nigeria (optional - for geo-based rate limiting)
 */
export async function isNigerianIP(ip: string): Promise<boolean> {
  try {
    const response = await fetch(`http://ip-api.com/json/${ip}`);
    const data = await response.json();
    return data.countryCode === 'NG';
  } catch (error) {
    console.error('Error checking IP location:', error);
    return false;
  }
}

/**
 * Adaptive rate limiting based on user behavior
 * Trusted users get higher limits
 */
export function getAdaptiveRateLimit(
  baseConfig: RateLimitConfig,
  userTrustScore: number // 0-100
): RateLimitConfig {
  const multiplier = 1 + (userTrustScore / 100);
  
  return {
    interval: baseConfig.interval,
    maxRequests: Math.floor(baseConfig.maxRequests * multiplier),
  };
}

/**
 * Block suspicious IPs temporarily
 */
const blockedIPs = new Map<string, number>(); // IP -> unblock time

export function blockIP(ip: string, durationMs: number = 60 * 60 * 1000): void {
  blockedIPs.set(ip, Date.now() + durationMs);
}

export function isIPBlocked(ip: string): boolean {
  const unblockTime = blockedIPs.get(ip);
  
  if (!unblockTime) return false;
  
  if (Date.now() > unblockTime) {
    blockedIPs.delete(ip);
    return false;
  }
  
  return true;
}

export function unblockIP(ip: string): void {
  blockedIPs.delete(ip);
}

/**
 * Get client IP from request headers
 */
export function getClientIP(request: Request): string | null {
  // Check various headers for IP address
  const headers = request.headers;
  
  return (
    headers.get('x-real-ip') ||
    headers.get('x-forwarded-for')?.split(',')[0] ||
    headers.get('cf-connecting-ip') || // Cloudflare
    headers.get('x-client-ip') ||
    null
  );
}

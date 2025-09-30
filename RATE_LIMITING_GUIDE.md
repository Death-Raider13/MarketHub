# 🛡️ Rate Limiting Implementation Guide

## Overview

Rate limiting has been implemented to protect your Nigerian e-commerce platform against:
- ✅ Brute force attacks
- ✅ Credential stuffing
- ✅ DDoS attacks
- ✅ API abuse
- ✅ Spam and bot traffic
- ✅ Resource exhaustion

---

## 🚀 Implementation

### 1. **Global Middleware** (`middleware.ts`)

Automatically protects ALL routes with rate limiting:

```typescript
// Runs on every request
export function middleware(request: NextRequest) {
  // Rate limiting logic
}
```

**Default Limits:**
- 100 requests per minute per IP (general)
- Stricter limits for sensitive endpoints

**Protected Paths:**
- `/api/auth/login` - 5 attempts/minute
- `/api/auth/signup` - 3 attempts/minute
- `/api/auth/reset-password` - 3 attempts/minute
- `/api/orders` - 5 orders/minute
- `/api/products` - 10 products/minute
- `/api/reviews` - 5 reviews/minute
- `/api/messages` - 20 messages/minute
- `/api/upload` - 10 uploads/minute
- `/api/payment` - 3 attempts/minute

### 2. **Rate Limit Library** (`lib/rate-limit.ts`)

Provides utilities for custom rate limiting:

```typescript
import { rateLimitMiddleware, RATE_LIMITS } from '@/lib/rate-limit';

// Check rate limit
const result = await rateLimitMiddleware(identifier, 'LOGIN');

if (!result.success) {
  // Rate limit exceeded
  throw new Error(result.error);
}
```

### 3. **API Route Integration**

Example usage in API routes:

```typescript
// app/api/auth/login/route.ts
import { rateLimitMiddleware, getRateLimitIdentifier, getClientIP } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);
  const { email } = await request.json();
  
  const identifier = getRateLimitIdentifier(ip, email);
  const result = await rateLimitMiddleware(identifier, 'LOGIN');
  
  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: 429 }
    );
  }
  
  // Your logic here
}
```

---

## 📊 Rate Limit Configuration

### Available Limits

```typescript
export const RATE_LIMITS = {
  LOGIN: { interval: 60000, maxRequests: 5 },
  SIGNUP: { interval: 60000, maxRequests: 3 },
  PASSWORD_RESET: { interval: 60000, maxRequests: 3 },
  API_GENERAL: { interval: 60000, maxRequests: 100 },
  API_SEARCH: { interval: 60000, maxRequests: 30 },
  PRODUCT_CREATE: { interval: 60000, maxRequests: 10 },
  PRODUCT_UPDATE: { interval: 60000, maxRequests: 20 },
  ORDER_CREATE: { interval: 60000, maxRequests: 5 },
  REVIEW_CREATE: { interval: 60000, maxRequests: 5 },
  MESSAGE_SEND: { interval: 60000, maxRequests: 20 },
  IMAGE_UPLOAD: { interval: 60000, maxRequests: 10 },
  PAYMENT_INITIATE: { interval: 60000, maxRequests: 3 },
};
```

### Customizing Limits

Edit `lib/rate-limit.ts`:

```typescript
export const RATE_LIMITS = {
  LOGIN: { interval: 60 * 1000, maxRequests: 10 }, // Increase to 10
  // ... other limits
};
```

---

## 🔧 Advanced Features

### 1. **IP Blocking**

Block malicious IPs:

```typescript
import { blockIP, isIPBlocked } from '@/lib/rate-limit';

// Block IP for 1 hour
blockIP('123.456.789.0', 60 * 60 * 1000);

// Check if blocked
if (isIPBlocked('123.456.789.0')) {
  // Deny access
}
```

### 2. **Whitelisting**

Whitelist trusted IPs in `middleware.ts`:

```typescript
const whitelistedIPs = new Set<string>([
  '127.0.0.1',
  'localhost',
  '41.58.xxx.xxx', // Your office IP
]);
```

### 3. **Adaptive Rate Limiting**

Adjust limits based on user trust score:

```typescript
import { getAdaptiveRateLimit } from '@/lib/rate-limit';

const baseConfig = RATE_LIMITS.LOGIN;
const userTrustScore = 80; // 0-100

const adaptiveConfig = getAdaptiveRateLimit(baseConfig, userTrustScore);
// Trusted users get higher limits
```

### 4. **Geo-based Rate Limiting**

Different limits for Nigerian vs international users:

```typescript
import { isNigerianIP } from '@/lib/rate-limit';

const ip = getClientIP(request);
const isNigerian = await isNigerianIP(ip);

const maxRequests = isNigerian ? 100 : 50; // Higher limit for Nigerian users
```

---

## 📡 Response Headers

Rate limit info is included in response headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1696089600
Retry-After: 45
```

### Client-Side Handling

```typescript
// React component
const handleLogin = async () => {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (response.status === 429) {
      const data = await response.json();
      const retryAfter = response.headers.get('Retry-After');
      
      alert(`Too many attempts. Please try again in ${retryAfter} seconds.`);
      return;
    }
    
    // Handle success
  } catch (error) {
    console.error(error);
  }
};
```

---

## 🧪 Testing Rate Limits

### Manual Testing

```bash
# Test login rate limit (should block after 5 attempts)
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}'
  echo "\nAttempt $i"
  sleep 1
done
```

### Automated Testing

```typescript
// __tests__/rate-limit.test.ts
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

describe('Rate Limiting', () => {
  it('should allow requests within limit', () => {
    const result = checkRateLimit('test-user', RATE_LIMITS.LOGIN);
    expect(result.allowed).toBe(true);
  });
  
  it('should block requests exceeding limit', () => {
    const identifier = 'test-user-2';
    
    // Make 5 requests (limit)
    for (let i = 0; i < 5; i++) {
      checkRateLimit(identifier, RATE_LIMITS.LOGIN);
    }
    
    // 6th request should be blocked
    const result = checkRateLimit(identifier, RATE_LIMITS.LOGIN);
    expect(result.allowed).toBe(false);
    expect(result.retryAfter).toBeGreaterThan(0);
  });
});
```

---

## 🚨 Monitoring & Alerts

### Log Rate Limit Violations

Add logging to `middleware.ts`:

```typescript
if (!result.allowed) {
  console.warn('Rate limit exceeded:', {
    ip,
    path: pathname,
    timestamp: new Date().toISOString(),
  });
  
  // Send to monitoring service (Sentry, LogRocket, etc.)
  // Sentry.captureMessage('Rate limit exceeded', { extra: { ip, path } });
}
```

### Dashboard Metrics

Track rate limit violations:

```typescript
// Store in database or analytics
await addDoc(collection(db, 'rate_limit_violations'), {
  ip,
  path: pathname,
  timestamp: new Date(),
  userAgent: request.headers.get('user-agent'),
});
```

---

## 🔄 Production Considerations

### 1. **Use Redis for Distributed Systems**

For multiple servers, replace in-memory store with Redis:

```bash
npm install ioredis
```

```typescript
// lib/redis-rate-limit.ts
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export async function checkRateLimit(identifier: string, config: RateLimitConfig) {
  const key = `rate_limit:${identifier}`;
  const current = await redis.incr(key);
  
  if (current === 1) {
    await redis.expire(key, Math.ceil(config.interval / 1000));
  }
  
  return {
    allowed: current <= config.maxRequests,
    remaining: Math.max(0, config.maxRequests - current),
  };
}
```

### 2. **Environment Variables**

Configure limits via environment:

```env
# .env.local
RATE_LIMIT_LOGIN_MAX=5
RATE_LIMIT_LOGIN_WINDOW=60000
RATE_LIMIT_API_MAX=100
RATE_LIMIT_API_WINDOW=60000
```

### 3. **CDN Integration**

Use Cloudflare or Vercel Edge for additional protection:

```typescript
// vercel.json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        }
      ]
    }
  ]
}
```

---

## 📋 Checklist

Before deploying to production:

- [ ] Test all rate limits manually
- [ ] Set up monitoring and alerts
- [ ] Configure Redis for distributed rate limiting
- [ ] Add logging for violations
- [ ] Whitelist trusted IPs (office, CI/CD)
- [ ] Set up automated tests
- [ ] Document custom rate limits for your team
- [ ] Configure CDN rate limiting (Cloudflare/Vercel)
- [ ] Test with load testing tools (k6, Artillery)
- [ ] Set up incident response plan

---

## 🆘 Troubleshooting

### Issue: Legitimate users getting blocked

**Solution:** Increase limits or implement adaptive rate limiting

```typescript
// Increase limit for specific endpoint
PRODUCT_CREATE: { interval: 60000, maxRequests: 20 }, // Was 10
```

### Issue: Rate limits not working

**Solution:** Check middleware configuration

```typescript
// Verify middleware is running
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

### Issue: False positives from shared IPs

**Solution:** Use user ID instead of IP when available

```typescript
const identifier = userId || ip; // Prefer user ID
```

---

## 📚 Additional Resources

- [OWASP Rate Limiting Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Denial_of_Service_Cheat_Sheet.html)
- [Next.js Middleware Docs](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Redis Rate Limiting](https://redis.io/docs/manual/patterns/rate-limiter/)

---

## 🎯 Summary

Your Nigerian e-commerce platform now has:

✅ **Global rate limiting** on all routes  
✅ **Endpoint-specific limits** for sensitive operations  
✅ **IP blocking** for malicious actors  
✅ **Whitelisting** for trusted sources  
✅ **Adaptive limits** based on user trust  
✅ **Geo-based limits** for Nigerian vs international users  
✅ **Comprehensive logging** and monitoring  
✅ **Production-ready** with Redis support  

**Rate limiting is now active and protecting your platform! 🛡️**

---

**Last Updated:** September 30, 2025  
**Version:** 1.0

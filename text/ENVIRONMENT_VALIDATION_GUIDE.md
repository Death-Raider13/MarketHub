# 🔧 Environment Variable Validation Guide

## Overview

Comprehensive environment variable validation has been implemented to protect your Nigerian e-commerce platform against:
- ✅ Missing configuration errors
- ✅ Invalid API key formats
- ✅ Accidental secret exposure
- ✅ Runtime configuration errors
- ✅ Type safety issues

---

## 🚀 Implementation

### 1. **Environment Validation Library** (`lib/env.ts`)

Provides type-safe, validated environment variables using Zod schemas:
- Client-side variables (NEXT_PUBLIC_*)
- Server-side variables (secrets)
- Automatic format validation
- Startup validation

### 2. **Validation on Startup**

Environment variables are validated when the application starts:
- **Development**: Warnings logged to console
- **Production**: Application fails fast if invalid

---

## 📋 Required Variables

### Firebase Configuration (Required)

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
```

**Get these from:**
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Project Settings > General
4. Scroll to "Your apps" section
5. Copy the configuration values

---

## 💳 Payment Gateways

### Paystack (Nigerian Payment Gateway)

```env
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
PAYSTACK_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Get these from:**
1. Sign up at [Paystack](https://paystack.com)
2. Dashboard > Settings > API Keys & Webhooks
3. Copy Test or Live keys

### Flutterwave (Alternative)

```env
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-X
FLUTTERWAVE_SECRET_KEY=FLWSECK-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-X
FLUTTERWAVE_WEBHOOK_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 📧 Email & SMS Services

### Email (Resend - Recommended)

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Get this from:**
1. Sign up at [Resend](https://resend.com)
2. API Keys > Create API Key

### SMS (Termii - Nigerian Provider)

```env
TERMII_API_KEY=TLxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TERMII_SENDER_ID=YourBrand
```

**Get this from:**
1. Sign up at [Termii](https://termii.com)
2. Dashboard > API Settings

---

## 🎯 Usage

### Type-Safe Access

```typescript
import { clientEnv, serverEnv } from '@/lib/env';

// Client-side (safe to use anywhere)
const apiKey = clientEnv.NEXT_PUBLIC_FIREBASE_API_KEY;
const appUrl = clientEnv.NEXT_PUBLIC_APP_URL;

// Server-side only (API routes, server components)
if (serverEnv) {
  const secretKey = serverEnv.PAYSTACK_SECRET_KEY;
  const emailKey = serverEnv.RESEND_API_KEY;
}
```

### Check Required Variables

```typescript
import { checkRequiredEnv } from '@/lib/env';

const { isValid, missing, invalid } = checkRequiredEnv();

if (!isValid) {
  console.error('Missing variables:', missing);
  console.error('Invalid variables:', invalid);
}
```

### Environment-Specific Config

```typescript
import { getEnvConfig } from '@/lib/env';

const config = getEnvConfig();

if (config.isDevelopment) {
  // Development-only code
}

if (config.isProduction) {
  // Production-only code
}
```

---

## 🔒 Security Features

### 1. **Format Validation**

All API keys are validated for correct format:

```typescript
// Paystack keys must start with pk_ or sk_
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: z.string().startsWith('pk_')
PAYSTACK_SECRET_KEY: z.string().startsWith('sk_')

// Firebase API keys must start with AIza
NEXT_PUBLIC_FIREBASE_API_KEY: z.string().startsWith('AIza')
```

### 2. **Sensitive Data Masking**

Sensitive values are masked in logs:

```typescript
import { maskSensitiveEnv } from '@/lib/env';

const masked = maskSensitiveEnv('API_KEY', 'sk_test_1234567890abcdef');
// Output: "sk_t************cdef"
```

### 3. **Client/Server Separation**

Client variables (NEXT_PUBLIC_*) are separate from server secrets:

```typescript
// ✅ Safe - client variable
const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;

// ❌ Unsafe - server secret in client code
const secretKey = process.env.PAYSTACK_SECRET_KEY; // Will be undefined
```

### 4. **Startup Validation**

Application validates environment on startup:

```bash
# Development - shows warnings
npm run dev
🔧 Environment Configuration:
  Environment: development
  App URL: http://localhost:3000
  Firebase Project: your-project-id
  Paystack: ✅ Configured
  Email Service: ✅ Configured

# Production - fails fast if invalid
npm run build
❌ Invalid environment variables:
  - NEXT_PUBLIC_FIREBASE_API_KEY: Firebase API key is required
  - PAYSTACK_SECRET_KEY: Invalid Paystack secret key format
```

---

## 📊 Validation Rules

### Firebase

| Variable | Format | Example |
|----------|--------|---------|
| API_KEY | Starts with `AIza` | `AIzaSyXXXXXXXXXXXXXXXXXX` |
| AUTH_DOMAIN | Ends with `.firebaseapp.com` | `project.firebaseapp.com` |
| PROJECT_ID | Lowercase, numbers, hyphens | `my-project-123` |
| STORAGE_BUCKET | Ends with `.appspot.com` | `project.appspot.com` |
| SENDER_ID | Numeric only | `123456789012` |
| APP_ID | Starts with `1:` | `1:123456789012:web:abc` |

### Paystack

| Variable | Format | Example |
|----------|--------|---------|
| PUBLIC_KEY | Starts with `pk_test_` or `pk_live_` | `pk_test_xxxxx` |
| SECRET_KEY | Starts with `sk_test_` or `sk_live_` | `sk_test_xxxxx` |
| WEBHOOK_SECRET | Starts with `whsec_` | `whsec_xxxxx` |

### Flutterwave

| Variable | Format | Example |
|----------|--------|---------|
| PUBLIC_KEY | Starts with `FLWPUBK-` | `FLWPUBK-xxxxx-X` |
| SECRET_KEY | Starts with `FLWSECK-` | `FLWSECK-xxxxx-X` |

---

## 🧪 Testing

### Manual Testing

```bash
# Test with missing variables
npm run dev
# Should show: ❌ Invalid environment variables

# Test with invalid format
NEXT_PUBLIC_FIREBASE_API_KEY=invalid npm run dev
# Should show: Invalid Firebase API key format

# Test with valid variables
npm run dev
# Should show: ✅ All environment variables valid
```

### Automated Testing

```typescript
import { validateClientEnv, validateServerEnv } from '@/lib/env';

describe('Environment Validation', () => {
  it('should validate client environment', () => {
    expect(() => validateClientEnv()).not.toThrow();
  });

  it('should validate server environment', () => {
    expect(() => validateServerEnv()).not.toThrow();
  });

  it('should reject invalid API key format', () => {
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'invalid';
    expect(() => validateClientEnv()).toThrow();
  });
});
```

---

## 🔄 Environment Files

### Development

`.env.local` (gitignored):
```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXX
PAYSTACK_SECRET_KEY=sk_test_xxxxx
```

### Production (Vercel)

1. Go to Vercel Dashboard
2. Project Settings > Environment Variables
3. Add all required variables
4. Set environment: Production, Preview, or Development

### Production (Other Platforms)

Set environment variables in your hosting platform:
- Netlify: Site Settings > Build & Deploy > Environment
- Railway: Project > Variables
- Render: Dashboard > Environment

---

## 🆘 Troubleshooting

### Issue: "Firebase API key is required"

**Solution:** Add to `.env.local`:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXX
```

### Issue: "Invalid Paystack secret key format"

**Solution:** Ensure key starts with `sk_test_` or `sk_live_`:
```env
PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Issue: Variables not loading

**Solution:** Restart dev server after changing `.env.local`:
```bash
# Stop server (Ctrl+C)
npm run dev
```

### Issue: Variables undefined in client

**Solution:** Client variables must start with `NEXT_PUBLIC_`:
```env
# ❌ Wrong
FIREBASE_API_KEY=xxx

# ✅ Correct
NEXT_PUBLIC_FIREBASE_API_KEY=xxx
```

---

## 📋 Setup Checklist

Before deploying to production:

- [ ] All Firebase variables configured
- [ ] Paystack keys (test and live) configured
- [ ] Email service API key configured
- [ ] SMS service API key configured (if using)
- [ ] Webhook secrets configured
- [ ] `.env.local` in `.gitignore`
- [ ] Production variables set in hosting platform
- [ ] No secrets committed to git
- [ ] Environment validation passing
- [ ] Tested with invalid variables
- [ ] Tested with missing variables
- [ ] Startup validation working

---

## 🎯 Summary

Your Nigerian e-commerce platform now has:

✅ **Type-safe environment variables** with Zod validation  
✅ **Automatic format validation** for all API keys  
✅ **Startup validation** (fail fast in production)  
✅ **Client/server separation** (no secrets in client)  
✅ **Sensitive data masking** in logs  
✅ **Clear error messages** for missing/invalid variables  
✅ **Nigerian payment gateways** (Paystack, Flutterwave)  
✅ **Nigerian SMS provider** (Termii)  
✅ **Production-ready** configuration  

**All environment variables are now validated and secure! 🔧**

---

**Last Updated:** September 30, 2025  
**Version:** 1.0

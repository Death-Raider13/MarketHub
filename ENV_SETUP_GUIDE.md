# 🔧 Environment Variable Setup Guide

## Quick Start

Copy this to `.env.local`:

```env
# Firebase (Required)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef

# Paystack (Nigerian Payment)
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxxxx
PAYSTACK_SECRET_KEY=sk_test_xxxxx

# Email Service (Optional)
RESEND_API_KEY=re_xxxxx

# SMS Service (Optional)
TERMII_API_KEY=TLxxxxx
```

## Validation

Environment variables are automatically validated on startup using `lib/env.ts`.

Invalid or missing variables will show clear error messages.

## Usage

```typescript
import { clientEnv } from '@/lib/env';

// Type-safe access
const apiKey = clientEnv.NEXT_PUBLIC_FIREBASE_API_KEY;
```

## Production Checklist

- [ ] All Firebase variables set
- [ ] Paystack keys configured
- [ ] Email service configured
- [ ] No secrets in client code
- [ ] .env.local in .gitignore

---

**Environment validation is now active! ✅**

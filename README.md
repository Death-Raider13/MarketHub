# FEROMARKETHUB

> **Digital Infrastructure for the Nigerian Creator Economy.** Premium multi-creator platform for digital products, educational content, and professional services.

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![Firebase](https://img.shields.io/badge/Firebase-Firestore-orange?logo=firebase)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Paystack](https://img.shields.io/badge/Paystack-Integrated-green)

---

## Overview

FEROMARKETHUB is a specialized high-margin, zero-logistics infrastructure for Nigerian creators, educators, and service professionals. By removing the complexities of physical fulfillment, we empower creators to scale through **digital assets** and **premium services** — all secured by a robust DRM layer and seamless Paystack integration.

### Core Value Proposition

| Feature | Strategic Alignment |
|---|---|
| **Zero Logistics** | 100% digital focus. No shipping, no inventory risk, instant fulfillment. |
| **Creator First** | Specialized storefronts for digital products (E-books, Courses, Assets) and Services. |
| **90/10 Revenue Split** | Transparent, high-margin model: 90% to creator, 10% platform commission. |
| **Secure DRM** | Single-use, expiring download tokens bound to purchase metadata. |
| **Instant Payouts** | Automated earnings tracking with rapid withdrawal via Paystack. |
| **Scalable Infrastructure** | 90+ API endpoints, role-based access, and real-time notifications. |
| **Digital Trust Layer** | Verified Purchase reviews and verified service scheduling. |
| **Creator Ads** | Internal advertising system to boost discoverability within the niche. |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript 5 |
| **Database** | Firebase Firestore |
| **Auth** | Firebase Authentication (Email + Google OAuth) |
| **Payments** | Paystack (primary), Coinbase Commerce (crypto) |
| **Media Storage** | Cloudflare R2 (Digital Files & Videos) & Cloudinary (Images) |
| **Email** | Resend / Nodemailer |
| **UI Components** | Radix UI + shadcn/ui |
| **Styling** | Tailwind CSS |
| **Charts** | Recharts |
| **Validation** | Zod + DOMPurify |
| **Deployment** | Vercel |

---

## Project Structure

```
├── app/                    # Next.js App Router pages & API routes
│   ├── api/                # 90+ API endpoints
│   │   ├── auth/           # Authentication endpoints
│   │   ├── orders/         # Order management
│   │   ├── payments/       # Paystack payment verification
│   │   ├── products/       # Product CRUD
│   │   ├── payouts/        # creator payout processing
│   │   └── webhooks/       # Payment webhooks
│   ├── admin/              # Admin dashboard (21 sections)
│   ├── creator/             # creator dashboard (12 sections)
│   ├── products/           # Product browsing & details
│   ├── cart/               # Shopping cart
│   ├── checkout/           # Checkout flow
│   └── store/              # Public creator storefronts
├── components/             # Reusable UI components
│   ├── ui/                 # shadcn/ui primitives
│   ├── admin/              # Admin-specific components
│   ├── creator/             # creator-specific components
│   └── layout/             # Header, Footer, Navigation
├── lib/                    # Core business logic
│   ├── firebase/           # Firebase config, admin SDK, auth context
│   ├── payment/            # Paystack & Coinbase integrations
│   ├── validation.ts       # Zod schemas with input sanitization
│   ├── session-management.ts # Session security & management
│   ├── api-auth.ts         # API route authentication middleware
│   └── rate-limit.ts       # Rate limiting
├── hooks/                  # Custom React hooks
├── contexts/               # React contexts (notifications)
├── firestore.rules         # Firestore security rules (1300+ lines)
└── middleware.ts            # Global rate limiting middleware
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Firebase project with Firestore enabled
- Paystack account (for payments)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/feromarkethub.git
cd feromarkethub

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
```

### Environment Variables

Create a `.env.local` file with the following required variables:

```env
# Firebase (Required)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin SDK (Required for API routes)
FIREBASE_SERVICE_ACCOUNT_JSON=

# Paystack (Required for payments)
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=
PAYSTACK_SECRET_KEY=

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=FEROMARKETHUB

# Protected digital delivery (Required in production)
# Use a long random secret and keep it private; never commit the value.
MARKETHUB_WATERMARK_SECRET=

# Optional: Platform commission rate (default: 0.10 = 10%)
PLATFORM_COMMISSION_RATE=0.10
```

### Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

---

## Architecture

### Security

- **Firestore Rules**: 1,300+ lines of granular security rules covering 20+ collections
- **Input Validation**: Zod schemas with DOMPurify sanitization on all user inputs
- **Rate Limiting**: Per-route rate limiting with configurable thresholds
- **Session Management**: Idle timeout, concurrent session limits, suspicious activity detection
- **API Authentication**: Firebase token verification middleware on all protected endpoints
- **Protected Downloads**: Purchaser-specific watermarking for PDF, ZIP/EPUB/Office Open XML, MP3, MP4, TXT, and legacy DOC/XLS/PPT/MOBI delivery formats
- **Environment Validation**: Zod-based validation of all environment variables at startup

### Digital Fulfillment Flow

1. Customer places order → Order created with `pending` status
2. Paystack payment initiated on client side
3. Payment verified server-side via Paystack API
4. Order status updated to `paid`
5. DRM download tokens generated (expiring, single-use, purchase-bound)
6. Service bookings created for service products (if applicable)
7. creator balances updated (90/10 revenue split)
8. Multi-layered confirmation (In-app Success Screen + Email with secure links)
9. Sale notification sent to creator
10. Download/Usage audit logging (IP, UA, Timestamp)

---

## Deployment

The application is configured for deployment on **Vercel**:

```bash
# Deploy to Vercel
vercel --prod
```

Ensure all environment variables are configured in the Vercel dashboard.

### Branded authentication emails

Verification and password-reset messages are now sent through the backend instead of Firebase Client SDK email templates. The server generates short-lived Firebase Admin action links and Resend delivers responsive Fero E-Library branded HTML with a plain-text fallback. Both link types return to `/auth/action` on the configured production domain; that handler verifies email actions and forwards password resets to the existing reset form.

Configure these values in Vercel for **Production, Preview, and Development** as appropriate:

| Variable | Required | Purpose |
|---|---:|---|
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Yes | Firebase Admin service-account JSON used to generate secure action links. Keep server-only and never expose it as `NEXT_PUBLIC_*`. |
| `RESEND_API_KEY` | Yes for Resend | Resend API key with permission to send from the verified domain. |
| `EMAIL_FROM` | Yes for Resend | Sender such as `Fero E-Library <no-reply@your-verified-domain>`. The domain must be verified in Resend. |
| `NEXT_PUBLIC_APP_URL` | Yes | Canonical site URL, for example `https://www.fero-elibrary.shop`, without a trailing slash. |
| `EMAIL_LOGO_URL` | Recommended | Public HTTPS URL for the brand logo. If omitted, the app uses `${NEXT_PUBLIC_APP_URL}/logo.png`. |
| `SUPPORT_EMAIL` | Recommended | Support address shown in the branded email footer. |

After deployment, add the production hostname to **Firebase Authentication → Settings → Authorized domains** and verify the sender domain in Resend. Do not use a personal Gmail address as `EMAIL_FROM`; use an address on a domain verified by Resend. Existing SMTP variables remain supported as a fallback when Resend is not configured.

The public password-reset endpoint deliberately returns the same success message whether or not the account exists, reducing account-enumeration risk. Verification resend remains authenticated with the Firebase ID token.

---

## License

Proprietary — All rights reserved.

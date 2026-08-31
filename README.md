# FERO E-LIBRARY (MarketHub)

> **Digital Infrastructure for the Nigerian & Global Creator Economy.** Premium multi-creator marketplace for digital products, educational video series, downloadable assets, and professional services.

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![Firebase](https://img.shields.io/badge/Firebase-Firestore-orange?logo=firebase)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Cloudflare R2](https://img.shields.io/badge/Cloudflare_R2-Storage-F38020?logo=cloudflare)
![Cloudinary](https://img.shields.io/badge/Cloudinary-Media-3448C5?logo=cloudinary)
![Paystack](https://img.shields.io/badge/Paystack-Integrated-green)

---

## Overview

**FERO E-LIBRARY** is a high-margin, zero-logistics marketplace infrastructure built for creators, educators, affiliates, and service professionals. By removing physical fulfillment barriers, creators can publish and monetize **digital products** (E-books, MP4 Video Courses, Audiobooks, Templates) and **services** — secured by dynamic purchaser watermarking and Cloudflare R2 storage.

### Key Highlights & Features

| Feature | Description |
|---|---|
| **Zero Logistics** | 100% digital fulfillment. Instant download delivery upon payment. |
| **Creator Monetization** | 90/10 revenue split (90% to creator, 10% platform commission). |
| **Cloudflare R2 Storage** | Direct browser-to-R2 presigned upload architecture for zero-egress cost, unlimited file & video uploads. |
| **Cloudinary Media** | Automated image optimization for store banners, thumbnails, and profile avatars. |
| **Promoter / Affiliate Engine** | Dedicated promoter dashboard with custom referral links, trackable clicks/sales, ₦8,000 signup fee (₦6,000 waitlist), and 50% referrer reward. |
| **Single-Role Security** | Clean, strict single-role per account (`student`, `creator`, `promoter`, `moderator`, `super_admin`). |
| **Dynamic Watermarking** | Purchaser metadata (Name, Email, Order ID, Timestamp) stamped on PDF, EPUB, and media downloads to prevent piracy. |
| **Automated Payouts & Webhooks** | Paystack payment verification and automated creator/promoter payout tracking. |
| **Branded Email Service** | Transactional emails delivered via Resend with responsive HTML branding. |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 14 (App Router, React 18) |
| **Language** | TypeScript 5 |
| **Database** | Firebase Firestore (1,300+ lines of security rules) |
| **Auth** | Firebase Authentication (Email/Password + Google OAuth) |
| **Payments** | Paystack (Primary Naira Gateway), Coinbase Commerce (Crypto) |
| **Digital Asset Storage** | Cloudflare R2 (Digital Products, PDF, ZIP, MP4 Videos, Audio) |
| **Image CDN** | Cloudinary (Product Cover Images, Thumbnails, Avatars) |
| **Email Delivery** | Resend (Transactional emails with custom domain branding) |
| **UI Components** | Radix UI + shadcn/ui primitives |
| **Styling** | Tailwind CSS + Lucide Icons |
| **Analytics & Charts** | Recharts |
| **Validation & Security** | Zod schemas + DOMPurify sanitization |
| **Deployment** | Vercel |

---

## Project Structure

```
├── app/                    # Next.js App Router pages & API routes
│   ├── api/                # 90+ Serverless API endpoints
│   │   ├── admin/          # Storage migration, payout approvals, analytics
│   │   ├── auth/           # Account registration & password reset
│   │   ├── orders/         # Order creation & history
│   │   ├── payments/       # Paystack payment initialization & verification
│   │   ├── products/       # Product CRUD & search endpoints
│   │   ├── r2/             # Cloudflare R2 presigned upload URL generator
│   │   ├── payouts/        # Creator & Promoter withdrawal processing
│   │   └── webhooks/       # Paystack & Coinbase payment webhooks
│   ├── admin/              # Super Admin control panel
│   ├── creator/            # Creator portal (Dashboard, Products, Orders, Analytics, Hub)
│   ├── dashboard/          # Student & Promoter portals
│   ├── products/           # Public product browsing & details
│   ├── cart/               # Shopping cart
│   ├── checkout/           # Checkout flow (0% tax fee)
│   └── hub/                # Public creator storefronts
├── components/             # Reusable UI components
│   ├── ui/                 # shadcn/ui primitives
│   ├── admin/              # Admin components
│   ├── creator/            # Creator components (R2 digital file uploader)
│   ├── layout/             # Header, Footer, Navigation
│   └── customer/           # Reviews, QA, Product cards
├── lib/                    # Core business logic
│   ├── firebase/           # Firebase client & admin SDK config
│   ├── r2.ts               # Cloudflare R2 S3Client & presigned URL helper
│   ├── cloudinary.ts       # Cloudinary image upload helper
│   ├── payment/            # Paystack integration helpers
│   ├── drm-utils.ts        # Purchaser watermarking & DRM token generator
│   └── api-auth.ts         # API route authentication middleware
├── middleware.ts            # Content Security Policy (CSP) & rate limiting
└── firestore.rules         # Granular Firestore security rules
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Firebase project with Firestore enabled
- Cloudflare account with R2 bucket created
- Cloudinary account for images
- Paystack account (for payment processing)

### Installation

```bash
# Clone the repository
git clone https://github.com/Death-Raider13/MarketHub.git
cd MarketHub

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
```

### Environment Variables

Create a `.env.local` file with the following configuration:

```env
# Firebase Client SDK
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin SDK (Server-Side)
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}

# Cloudflare R2 (Digital Asset & Video Storage)
CLOUDFLARE_R2_BUCKET_NAME=fero-elibrary
CLOUDFLARE_R2_ACCOUNT_ID=your_32_char_cloudflare_account_id
CLOUDFLARE_R2_ACCESS_KEY_ID=your_r2_access_key_id
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL=https://pub-8df3facea5b446d2aed1eafbfca818b1.r2.dev

# Cloudinary (Image Delivery)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Paystack Payment Gateway
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_xxxxxx
PAYSTACK_SECRET_KEY=sk_live_xxxxxx

# Transactional Email (Resend)
RESEND_API_KEY=re_xxxxxx
EMAIL_FROM=Fero E-Library <no-reply@fero-elibrary.shop>

# App Configuration
NEXT_PUBLIC_APP_URL=https://www.fero-elibrary.shop
MARKETHUB_WATERMARK_SECRET=your_long_random_watermark_secret
PLATFORM_COMMISSION_RATE=0.10
```

### Development & Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting check
npm run lint
```

---

## Architecture & Security

- **Cloudflare R2 Direct Uploads**: Presigned S3 URLs allow creators to upload multi-gigabyte video files directly from browser to R2 without hitting Vercel's 4.5MB payload limit.
- **Dynamic Purchaser Watermarking**: PDFs and digital files are stamped on-the-fly with the purchaser's Name, Email, and Order ID before streaming to prevent unauthorized sharing.
- **Granular Firestore Security**: 1,300+ lines of security rules enforce strict single-role permissions and field-level access control across 20+ collections.
- **Branded Email Verification**: Account verification and password reset flows bypass default Firebase templates, delivering custom responsive HTML emails via Resend.
- **Paystack Webhook Verification**: HMAC SHA-512 signature verification ensures order fulfillment triggers only upon genuine Paystack payment events.

---

## License

Proprietary — All rights reserved © FERO E-LIBRARY.

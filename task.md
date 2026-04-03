## Phase 1: Trust Signals (Quick Wins)
- [x] Fix package.json name from "my-v0-project" to "feromarkethub"
- [x] Remove secret key logging from payments/verify/route.ts
- [x] Remove/gate debug and test routes behind NODE_ENV check
- [x] Add comprehensive README.md
- [x] Add auth verification middleware for API routes

## Phase 2: Security Hardening
- [x] Fix unauthenticated API endpoints (orders GET, etc.)
- [x] Replace Math.random() session IDs with crypto.randomUUID()
- [/] Fix client Firebase SDK usage in server-side API routes (switch to Admin SDK)
- [x] Fix Firestore rules: purchasedProducts open create
- [ ] Add webhook signature verification for Paystack
- [ ] Add CORS configuration to API routes

## Phase 3: Architecture & Performance
- [x] Convert homepage to Server Components with real data
- [x] Remove hardcoded stats/counts from homepage
- [x] Extract service layer from monolithic payment handler
- [x] Add Firestore transactions for creator balance updates
- [x] Replace in-memory rate limiter note (documented Redis migration path)
- [x] Remove duplicate ad collections reference
- [x] Replace raw img tags with next/image
- [x] Remove external IP lookup from login flow

## Phase 4: Code Quality & Consistency
- [x] Address `any` types in `auth-context.tsx` and `validation.ts`
- [x] Unify creator-facing API security (verifyAuthToken)
- [x] Add CORS/Security headers in `next.config.mjs`

## Phase 5: Testing Foundation & CI/CD
- [x] Set up Jest and React Testing Library
- [x] Write validation schema unit tests
- [x] Write creator balance transaction unit tests
- [x] Add GitHub Actions CI configuration ([.github/workflows/ci.yml](file:///c:/Users/DELL/CascadeProjects/MarketHub/.github/workflows/ci.yml))

## Phase 6: Strategic Roadmap Refinement
- [x] Integrate 14 investor-readiness points into `strategic_roadmap.md`
- [x] Define narrow entry niche (Designers/Educators)

- [x] Phase 7: Digital-Only Pivot (Engineering)
    - [x] Audit and remove 'physical' product logic (Schema, API, UI)
    - [x] Enforce database-level restraints (Enum types)
    - [x] Remove physical-related columns/fields entirely

## Phase 8: Content Protection & DRM (Signed Delivery)
- [ ] Implement expiring/limited download links bound to purchase
- [ ] Integrate Cloudinary/ImageKit signed URL utility (30-120s expiry)
- [ ] Add rate limiting and IP anomaly logging to download endpoints
- [ ] Build `/api/download/[tokenId]` validation & streaming route

## Phase 9: Automated Fulfillment & Revenue
- [ ] Automate fulfillment triggers on payment webhook
- [ ] Implement email delivery backup for download links
- [ ] Implement creator revenue split module (90/10)
- [ ] Add automated payout/ledger tracking logic

## Phase 10: UX & Branding Refinement
- [ ] Add post-payment "Instant Access" CTA screen
- [ ] Align README and Landing Page copy with "Creator Infrastructure" pitch
- [ ] Add basic analytics event tracking (views, checkout, downloads)

## Phase 11: Digital Trust Layer (Review System)
- [ ] Enforce Verified Purchase requirement for all new reviews
- [ ] Link reviews to `orderId` and add "Verified Buyer" tag
- [ ] Add digital-specific rating signals (accuracy, delivery quality)
- [ ] Build Creator Reputation/Badge logic based on sales and reviews

## Phase 12: Creator Architectural Pivot ("creator" to "Creator")
- [x] Update `UserRole` and `Session` types to support `"creator"`
- [x] Rebrand Onboarding flow (UI & Logic) to `"creator"`
- [x] Systemically replace `"creator"` with `"creator"` in `firestore.rules`
- [x] Fix broken email signup path in `creator-register-new` (Verified)
- [x] Rename/Migrate legacy Firestore collections (`creators` -> `creators`)
- [x] Update `app/hub/[creatorId]` from `app/hub/[creatorId]`
- [x] Add rules for `creator_reputation` and `downloadTokens`
- [x] Refactor specialized services (Reputation, Booking, Email) to use `"creator"`
- [x] Rebrand Creator Dashboard and Advertising pages
- [x] Systemic Header & Footer UI terminology sweep
- [x] Rebrand remaining UI components (CreatorName, ContactCreator, ProductCard)
- [x] Rename 'store-customize' to 'hub-customize' dashboard
- [ ] Final sweep of Help Articles terminology

## Phase 13: Finalizing Permission Fixes
- [x] Relax security rules for initial creator hub creation
- [ ] Add composite indices for products and reviews
- [x] Verify "Missing or insufficient permissions" is resolved for new signups
- [x] Deprecate/Remove legacy `/auth/creator-*` routes

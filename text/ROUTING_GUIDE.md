# 🗺️ FEROMARKETHUB - Complete Routing Guide

## Overview
This document explains all routes, role-based access, and navigation flow in the FEROMARKETHUB platform.

---

## 🔐 Authentication Flow

### Login Process
**Route:** `/auth/login`

**After Successful Login:**
- **Admin** → `/admin/dashboard`
- **creator (Verified)** → `/creator/dashboard`
- **creator (Unverified)** → `/creator/pending-approval`
- **Customer** → `/` (Homepage)

### Signup Process
**Route:** `/auth/signup`

**Flow:**
1. User selects role (Customer or creator)
2. **If Customer:** Complete simple signup → Redirect to `/`
3. **If creator:** Redirect to `/auth/creator-register` (comprehensive form)

### creator Registration
**Route:** `/auth/creator-register`

**5-Step Process:**
1. Personal Information
2. Business Information
3. Store Details
4. Business Address & Banking
5. Review & Submit

**After Submission:** → `/creator/pending-approval`

---

## 📍 Public Routes (No Authentication Required)

| Route | Description | Components |
|-------|-------------|------------|
| `/` | Homepage | Hero, Categories, Featured Products, Newsletter |
| `/products` | All Products | Product Grid, Filters, Sorting |
| `/products/[id]` | Product Detail | Images, Reviews, Q&A, Related Products |
| `/search` | Search Results | Advanced Filters, Sort Options |
| `/creators/[id]` | creator Store | creator Profile, Products, Reviews |
| `/categories` | All Categories | Category Grid |
| `/help` | Help Center | FAQs, Support Categories |
| `/contact` | Contact Us | Contact Form, Support Info |
| `/auth/login` | Login Page | Email/Password Login |
| `/auth/signup` | Signup Page | Role Selection, Basic Info |
| `/auth/creator-register` | creator Registration | 5-Step Form |
| `/auth/reset-password` | Password Reset | Email Input |

---

## 🛒 Customer Routes (Requires Authentication)

| Route | Description | Access |
|-------|-------------|--------|
| `/cart` | Shopping Cart | All Users |
| `/checkout` | Checkout Process | Authenticated Users |
| `/dashboard` | Customer Dashboard | Customers Only |
| `/dashboard/settings` | Account Settings | Customers Only |
| `/dashboard/wishlist` | Wishlist | Customers Only |

### Customer Dashboard Features:
- Order history
- Order tracking
- Wishlist management
- Profile settings
- Saved addresses
- Payment methods

---

## 🏪 creator Routes (Requires creator Role)

### Main creator Routes

| Route | Description | Access |
|-------|-------------|--------|
| `/creator/dashboard` | creator Dashboard | Verified creators |
| `/creator/products` | Product Management | Verified creators |
| `/creator/products/new` | Add New Product | Verified creators |
| `/creator/orders` | Order Management | Verified creators |
| `/creator/analytics` | Sales Analytics | Verified creators |
| `/creator/advertising` | Ad Campaigns | Verified creators |
| `/creator/advertising/new` | Create Ad Campaign | Verified creators |
| `/creator/pending-approval` | Pending Status | Unverified creators |

### creator Dashboard Features:
- Sales overview
- Revenue charts
- Top products
- Recent orders
- Customer reviews
- Store analytics
- Payout information

### Product Management:
- Add/Edit/Delete products
- Manage inventory
- Set pricing
- Upload images
- Product categories
- Product variants

### Order Management:
- View orders
- Update order status
- Print invoices
- Manage shipping
- Handle returns

---

## 👑 Admin Routes (Requires Admin Role)

### Main Admin Routes

| Route | Description | Access |
|-------|-------------|--------|
| `/admin/dashboard` | Admin Dashboard | Admins Only |
| `/admin/creators` | creator Management | Admins Only |
| `/admin/products` | Product Moderation | Admins Only |
| `/admin/users` | User Management | Admins Only |
| `/admin/advertising` | Ad Moderation | Admins Only |
| `/admin/orders` | Order Overview | Admins Only |
| `/admin/settings` | Platform Settings | Admins Only |

### Admin Dashboard Features:
- Platform statistics
- Revenue overview
- Active creators
- Total products
- User growth
- Pending approvals
- Recent activity

### creator Management:
- Approve/reject creator applications
- View creator details
- Verify creators
- Set commission rates
- Suspend/ban creators
- View creator performance

### Product Moderation:
- Approve/reject products
- Feature products
- Remove inappropriate content
- Manage categories
- Bulk actions

### User Management:
- View all users
- Change user roles
- Ban/suspend users
- View user activity
- Export user data

---

## 🔒 Route Protection

### Implementation

All protected routes use the `ProtectedRoute` component:

```tsx
import { ProtectedRoute } from "@/lib/firebase/protected-route"

export default function creatorDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={["creator"]}>
      <creatorDashboardContent />
    </ProtectedRoute>
  )
}
```

### Role-Based Access Control

```typescript
// Customer-only routes
<ProtectedRoute allowedRoles={["customer"]}>

// creator-only routes
<ProtectedRoute allowedRoles={["creator"]}>

// Admin-only routes
<ProtectedRoute allowedRoles={["admin"]}>

// Multiple roles
<ProtectedRoute allowedRoles={["creator", "admin"]}>

// Any authenticated user
<ProtectedRoute>
```

---

## 🚦 Navigation Flow Diagrams

### Customer Journey
```
Homepage → Browse Products → Product Detail → Add to Cart → 
Checkout → Order Confirmation → Track Order
```

### creator Journey
```
creator Registration → Pending Approval → Email Notification → 
creator Dashboard → Add Products → Manage Orders → View Analytics
```

### Admin Journey
```
Admin Login → Admin Dashboard → Review creators → Approve Products → 
Monitor Platform → Manage Users
```

---

## 🔄 Redirect Rules

### After Login:
```typescript
if (role === "admin") {
  redirect("/admin/dashboard")
} else if (role === "creator") {
  if (verified) {
    redirect("/creator/dashboard")
  } else {
    redirect("/creator/pending-approval")
  }
} else {
  redirect("/")
}
```

### Unauthorized Access:
- Not logged in → Redirect to `/auth/login`
- Wrong role → Redirect to `/` (Homepage)

### After Signup:
- Customer → Redirect to `/`
- creator → Redirect to `/auth/creator-register`

---

## 📱 Mobile Navigation

### Header Menu (Mobile):
- All Products
- Categories
- My Account (if logged in)
- Wishlist (if logged in)
- Help Center
- Login/Signup (if not logged in)

### Bottom Navigation (Optional):
- Home
- Search
- Cart
- Account

---

## 🔍 Search & Filtering

### Search Route: `/search?q={query}`

**Query Parameters:**
- `q` - Search query
- `category` - Filter by category
- `minPrice` - Minimum price
- `maxPrice` - Maximum price
- `rating` - Minimum rating
- `sort` - Sort option (price-low, price-high, rating, newest)

**Example:**
```
/search?q=headphones&category=electronics&minPrice=50&maxPrice=200&sort=price-low
```

---

## 🛠️ API Routes (Future Implementation)

### Product APIs
- `GET /api/products` - Get all products
- `GET /api/products/[id]` - Get product details
- `POST /api/products` - Create product (creator)
- `PUT /api/products/[id]` - Update product (creator)
- `DELETE /api/products/[id]` - Delete product (creator/admin)

### Order APIs
- `GET /api/orders` - Get user orders
- `POST /api/orders` - Create order
- `PUT /api/orders/[id]` - Update order status
- `GET /api/orders/[id]/track` - Track order

### User APIs
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `POST /api/users/avatar` - Upload avatar

### Payment APIs
- `POST /api/create-payment-intent` - Initialize payment
- `POST /api/webhooks/stripe` - Handle Stripe webhooks

---

## 🐛 Common Routing Issues & Solutions

### Issue 1: Admin not redirected to dashboard after login
**Solution:** ✅ Fixed! Login page now checks user role and redirects accordingly.

### Issue 2: creator sees customer dashboard
**Solution:** Use `ProtectedRoute` with `allowedRoles={["creator"]}`

### Issue 3: 404 on dynamic routes
**Solution:** Ensure folder structure uses `[id]` format, not `{id}`

### Issue 4: Infinite redirect loop
**Solution:** Check `useEffect` dependencies in auth context

### Issue 5: Protected route shows content before redirect
**Solution:** `ProtectedRoute` returns `null` while checking auth

---

## 📊 Route Analytics (Recommended)

Track these metrics:
- Most visited pages
- Conversion funnel (Homepage → Product → Cart → Checkout)
- Bounce rate per route
- Average time on page
- Exit pages

---

## 🔐 Security Best Practices

1. **Never expose sensitive data in URLs**
   - ❌ `/admin/users?password=123`
   - ✅ `/admin/users` (fetch data server-side)

2. **Always validate user role server-side**
   - Client-side protection is for UX only
   - Use Firestore security rules

3. **Use HTTPS in production**
   - Enforce SSL/TLS
   - Set secure cookies

4. **Implement rate limiting**
   - Prevent brute force attacks
   - Limit API calls per user

---

## 🚀 Future Routes (Roadmap)

### Phase 1:
- `/orders/[id]/track` - Order tracking page
- `/products/compare` - Product comparison
- `/deals` - Daily deals page
- `/flash-sales` - Flash sales

### Phase 2:
- `/messages` - Customer-creator messaging
- `/creator/payouts` - Payout management
- `/admin/reports` - Advanced reports
- `/admin/analytics` - Platform analytics

### Phase 3:
- `/api/graphql` - GraphQL API
- `/api/webhooks` - Webhook management
- `/admin/integrations` - Third-party integrations

---

## 📝 Route Naming Conventions

### URL Structure:
- Use kebab-case: `/product-details` not `/productDetails`
- Use plural for collections: `/products` not `/product`
- Use singular for single items: `/product/[id]` not `/products/[id]`
- Keep URLs short and descriptive

### File Structure:
- Use Next.js 14 App Router conventions
- Dynamic routes: `[id]` folder
- Route groups: `(group)` folder
- Parallel routes: `@slot` folder

---

## ✅ Testing Checklist

Test each route:
- [ ] Loads without errors
- [ ] Redirects work correctly
- [ ] Protected routes require auth
- [ ] Role-based access works
- [ ] Mobile responsive
- [ ] SEO meta tags present
- [ ] Loading states work
- [ ] Error handling works

---

## 📞 Support

If you encounter routing issues:
1. Check browser console for errors
2. Verify user role in Firebase
3. Clear browser cache
4. Check Firestore security rules
5. Review this guide

---

**Last Updated:** 2025-09-30
**Version:** 1.0

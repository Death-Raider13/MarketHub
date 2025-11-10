# 🚀 Quick Start Guide - MarketHub Implementation

This guide will help you quickly implement the most critical improvements to make your marketplace production-ready.

---

## ⚡ Phase 1: Critical Features (Week 1-2)

### 1. Firebase Database Setup

#### Step 1: Create Firestore Collections

Go to Firebase Console → Firestore Database → Create the following collections:

```javascript
// Collection: products
{
  id: "auto-generated",
  vendorId: "string",
  vendorName: "string",
  name: "string",
  description: "string",
  price: number,
  comparePrice: number (optional),
  category: "string",
  subcategory: "string" (optional),
  images: ["url1", "url2"],
  stock: number,
  sku: "string",
  rating: number,
  reviewCount: number,
  featured: boolean,
  sponsored: boolean,
  status: "active" | "inactive" | "pending",
  createdAt: timestamp,
  updatedAt: timestamp
}

// Collection: orders
{
  id: "auto-generated",
  userId: "string",
  items: [
    {
      productId: "string",
      productName: "string",
      quantity: number,
      price: number
    }
  ],
  subtotal: number,
  tax: number,
  shipping: number,
  total: number,
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled",
  shippingAddress: {
    fullName: "string",
    addressLine1: "string",
    city: "string",
    state: "string",
    zipCode: "string",
    country: "string",
    phone: "string"
  },
  paymentMethod: "string",
  trackingNumber: "string" (optional),
  createdAt: timestamp,
  updatedAt: timestamp
}

// Collection: users
{
  uid: "string",
  email: "string",
  role: "customer" | "vendor" | "admin",
  displayName: "string",
  photoURL: "string" (optional),
  createdAt: timestamp,
  // Vendor-specific fields
  storeName: "string" (optional),
  storeDescription: "string" (optional),
  verified: boolean (optional),
  commission: number (optional)
}

// Collection: reviews
{
  id: "auto-generated",
  productId: "string",
  userId: "string",
  userName: "string",
  rating: 1-5,
  comment: "string",
  images: ["url1", "url2"] (optional),
  helpful: number,
  createdAt: timestamp
}

// Collection: categories
{
  id: "auto-generated",
  name: "string",
  slug: "string",
  icon: "string",
  productCount: number
}

// Collection: vendors
{
  id: "auto-generated",
  userId: "string",
  name: "string",
  description: "string",
  logo: "string",
  banner: "string",
  rating: number,
  reviewCount: number,
  totalProducts: number,
  totalSales: number,
  joinedDate: timestamp,
  location: "string",
  responseTime: "string",
  verified: boolean,
  followers: number
}
```

#### Step 2: Create Firestore Indexes

In Firebase Console → Firestore → Indexes, create these composite indexes:

```
Collection: products
- category (Ascending) + status (Ascending) + createdAt (Descending)
- vendorId (Ascending) + status (Ascending)
- featured (Ascending) + status (Ascending)
- price (Ascending) + status (Ascending)
- rating (Descending) + status (Ascending)

Collection: orders
- userId (Ascending) + createdAt (Descending)
- status (Ascending) + createdAt (Descending)

Collection: reviews
- productId (Ascending) + createdAt (Descending)
```

### 2. Replace Mock Data with Real Firebase Queries

Update your pages to use the Firestore helper functions:

```typescript
// app/products/page.tsx
import { getProducts } from "@/lib/firebase/firestore"

export default async function ProductsPage() {
  const products = await getProducts()
  // ... rest of component
}

// app/products/[id]/page.tsx
import { getProduct, getProductReviews } from "@/lib/firebase/firestore"

export default async function ProductDetailPage({ params }) {
  const product = await getProduct(params.id)
  const reviews = await getProductReviews(params.id)
  // ... rest of component
}
```

### 3. Set Up Stripe Payment (CRITICAL)

#### Step 1: Install Stripe

```bash
npm install @stripe/stripe-js stripe
```

#### Step 2: Get Stripe Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Get your API keys from Developers → API keys
3. Add to `.env.local`:

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

#### Step 3: Create Payment API Route

Create `app/api/create-payment-intent/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
})

export async function POST(request: NextRequest) {
  try {
    const { amount, currency = "usd" } = await request.json()

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      automatic_payment_methods: {
        enabled: true,
      },
    })

    return NextResponse.json({ clientSecret: paymentIntent.client_secret })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
```

#### Step 4: Update Checkout Page

```typescript
// app/checkout/page.tsx
import { loadStripe } from "@stripe/stripe-js"
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

function CheckoutForm({ clientSecret }: { clientSecret: string }) {
  const stripe = useStripe()
  const elements = useElements()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/order-confirmation`,
      },
    })

    if (error) {
      console.error(error)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <button type="submit" disabled={!stripe}>Pay Now</button>
    </form>
  )
}

export default function CheckoutPage() {
  const [clientSecret, setClientSecret] = useState("")

  useEffect(() => {
    // Fetch client secret from your API
    fetch("/api/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: totalAmount }),
    })
      .then((res) => res.json())
      .then((data) => setClientSecret(data.clientSecret))
  }, [])

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <CheckoutForm clientSecret={clientSecret} />
    </Elements>
  )
}
```

---

## ⚡ Phase 2: Essential Features (Week 3-4)

### 4. Email Notifications with Resend

#### Step 1: Install Resend

```bash
npm install resend
```

#### Step 2: Get API Key

1. Sign up at [Resend](https://resend.com/)
2. Get your API key
3. Add to `.env.local`:

```env
RESEND_API_KEY=re_...
```

#### Step 3: Create Email API Route

Create `app/api/send-email/route.ts`:

```typescript
import { Resend } from "resend"
import { NextRequest, NextResponse } from "next/server"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { to, subject, html } = await request.json()

    const data = await resend.emails.send({
      from: "MarketHub <noreply@markethub.com>",
      to,
      subject,
      html,
    })

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
```

#### Step 4: Create Email Templates

Create `lib/email-templates.ts`:

```typescript
export function orderConfirmationEmail(order: any) {
  return `
    <h1>Order Confirmation</h1>
    <p>Thank you for your order!</p>
    <p>Order ID: ${order.id}</p>
    <p>Total: $${order.total.toFixed(2)}</p>
    <h2>Items:</h2>
    <ul>
      ${order.items.map((item: any) => `
        <li>${item.productName} x ${item.quantity} - $${item.price.toFixed(2)}</li>
      `).join("")}
    </ul>
  `
}

export function orderShippedEmail(order: any) {
  return `
    <h1>Your Order Has Shipped!</h1>
    <p>Order ID: ${order.id}</p>
    <p>Tracking Number: ${order.trackingNumber}</p>
    <a href="https://tracking.example.com/${order.trackingNumber}">Track Your Order</a>
  `
}
```

### 5. Image Upload with Firebase Storage

#### Step 1: Create Upload Component

Create `components/image-upload.tsx`:

```typescript
"use client"

import { useState } from "react"
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { Button } from "@/components/ui/button"
import { Upload } from "lucide-react"

export function ImageUpload({ onUpload }: { onUpload: (url: string) => void }) {
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const storage = getStorage()
      const storageRef = ref(storage, `products/${Date.now()}_${file.name}`)
      await uploadBytes(storageRef, file)
      const url = await getDownloadURL(storageRef)
      onUpload(url)
    } catch (error) {
      console.error("Upload failed:", error)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={handleUpload}
        disabled={uploading}
        className="hidden"
        id="image-upload"
      />
      <label htmlFor="image-upload">
        <Button type="button" disabled={uploading} asChild>
          <span>
            <Upload className="mr-2 h-4 w-4" />
            {uploading ? "Uploading..." : "Upload Image"}
          </span>
        </Button>
      </label>
    </div>
  )
}
```

### 6. Real-time Notifications

#### Step 1: Create Notification Context

Create `lib/notification-context.tsx`:

```typescript
"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { collection, query, where, onSnapshot } from "firebase/firestore"
import { db } from "./firebase/config"
import { useAuth } from "./firebase/auth-context"
import { toast } from "sonner"

interface Notification {
  id: string
  type: "order" | "message" | "review"
  title: string
  message: string
  read: boolean
  createdAt: Date
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  markAsRead: (id: string) => void
  markAllAsRead: () => void
}

const NotificationContext = createContext<NotificationContextType>({} as NotificationContextType)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    if (!user) return

    const q = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      where("read", "==", false)
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newNotifications = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Notification[]

      setNotifications(newNotifications)

      // Show toast for new notifications
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const notif = change.doc.data() as Notification
          toast(notif.title, { description: notif.message })
        }
      })
    })

    return () => unsubscribe()
  }, [user])

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead: () => {},
        markAllAsRead: () => {},
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => useContext(NotificationContext)
```

---

## 📋 Testing Checklist

Before going live, test these critical features:

### Authentication
- [ ] User can sign up
- [ ] User can log in
- [ ] User can reset password
- [ ] User profile is created in Firestore
- [ ] Role-based access works

### Products
- [ ] Products display correctly
- [ ] Search works
- [ ] Filters work
- [ ] Product detail page loads
- [ ] Images display properly

### Cart & Checkout
- [ ] Add to cart works
- [ ] Cart persists on refresh
- [ ] Quantity updates work
- [ ] Checkout form validates
- [ ] Stripe payment processes
- [ ] Order is created in database

### Orders
- [ ] Order confirmation email sent
- [ ] Order appears in user dashboard
- [ ] Order status updates work
- [ ] Tracking number displays

### Vendor Features
- [ ] Vendor can add products
- [ ] Vendor can view orders
- [ ] Vendor dashboard displays analytics

### Admin Features
- [ ] Admin can view all orders
- [ ] Admin can manage users
- [ ] Admin can moderate products

---

## 🚀 Deployment Checklist

### Before Deploying:

1. **Environment Variables**
   - [ ] All Firebase keys added
   - [ ] Stripe keys added (use production keys)
   - [ ] Email service keys added
   - [ ] All secrets are secure

2. **Firebase Configuration**
   - [ ] Production Firebase project created
   - [ ] Firestore security rules configured
   - [ ] Storage rules configured
   - [ ] Authentication methods enabled

3. **Testing**
   - [ ] All critical features tested
   - [ ] Mobile responsiveness checked
   - [ ] Accessibility tested
   - [ ] Payment flow tested (use Stripe test mode first)

4. **Performance**
   - [ ] Images optimized
   - [ ] Code split properly
   - [ ] Lighthouse score > 90

5. **SEO**
   - [ ] Meta tags added
   - [ ] Sitemap generated
   - [ ] robots.txt configured
   - [ ] Open Graph tags added

### Deploy to Vercel:

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### Post-Deployment:

1. **Monitor**
   - Set up error tracking (Sentry)
   - Monitor performance (Vercel Analytics)
   - Check Firebase usage

2. **Test Production**
   - Test all features in production
   - Test payment with real card (small amount)
   - Verify emails are sent

3. **Launch**
   - Announce to users
   - Monitor for issues
   - Collect feedback

---

## 🆘 Common Issues & Solutions

### Issue: Firebase "Permission Denied"
**Solution**: Check Firestore security rules. Make sure authenticated users have proper access.

### Issue: Stripe Payment Fails
**Solution**: 
- Verify API keys are correct
- Check if webhook is configured
- Test with Stripe test cards

### Issue: Images Not Loading
**Solution**:
- Check Firebase Storage rules
- Verify image URLs are correct
- Check CORS settings

### Issue: Emails Not Sending
**Solution**:
- Verify email service API key
- Check email templates
- Look at email service logs

---

## 📞 Need Help?

- Review `IMPROVEMENTS.md` for detailed feature documentation
- Check Firebase documentation
- Review Stripe documentation
- Test in development before production

---

**Good luck with your marketplace! 🚀**

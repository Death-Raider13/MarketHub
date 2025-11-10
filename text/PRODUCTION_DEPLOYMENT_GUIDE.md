# 🚀 Production Deployment Guide

## ✅ Email Verification - Development vs Production

### **How It Works Now (Smart Auto-Detection):**

The code automatically detects whether you're in development or production:

```typescript
// In lib/firebase/auth-context.tsx
const actionCodeSettings = {
  url: typeof window !== 'undefined' 
    ? `${window.location.origin}/auth/action`  // Uses current domain
    : `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/action`,
  handleCodeInApp: false
}
```

### **What This Means:**

**Development (localhost):**
- Uses: `http://localhost:3000/auth/action`
- No configuration needed
- Works automatically

**Production (your-domain.com):**
- Uses: `https://your-domain.com/auth/action`
- Automatically detects from browser
- No code changes needed!

---

## 🔧 Production Setup Checklist

### **Step 1: Environment Variables**

Create `.env.production` or set in Vercel/hosting:

```bash
# ==================== PRODUCTION URLS ====================
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_APP_NAME=MarketHub
NEXT_PUBLIC_ENV=production

# ==================== FIREBASE (Production) ====================
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

# ==================== PAYMENT (Live Keys) ====================
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_your_live_key
PAYSTACK_SECRET_KEY=sk_live_your_live_secret

# ==================== EMAIL (Production) ====================
RESEND_API_KEY=re_your_production_key

# ==================== FIREBASE ADMIN SDK ====================
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
```

---

### **Step 2: Firebase Console Configuration**

#### **For Development:**
1. Go to: https://console.firebase.google.com
2. Select your project
3. Authentication → Templates
4. Edit "Email address verification"
5. Set Action URL to:
   ```
   http://localhost:3000/auth/action
   ```

#### **For Production:**
1. **IMPORTANT:** Firebase only allows ONE action URL
2. You have two options:

**Option A: Use Production URL (Recommended)**
```
https://your-domain.com/auth/action
```
- ✅ Works in production
- ❌ Won't work in local development
- **Solution:** Test locally using `vercel dev` or deploy to preview

**Option B: Use Multiple Firebase Projects**
```
Development Project → http://localhost:3000/auth/action
Production Project → https://your-domain.com/auth/action
```
- ✅ Both work independently
- ✅ Better separation
- ✅ Recommended for serious projects

---

### **Step 3: Vercel Deployment**

#### **A. Install Vercel CLI:**
```bash
npm i -g vercel
```

#### **B. Login to Vercel:**
```bash
vercel login
```

#### **C. Deploy:**
```bash
# First deployment
vercel

# Production deployment
vercel --prod
```

#### **D. Set Environment Variables in Vercel:**

**Via Vercel Dashboard:**
1. Go to: https://vercel.com/dashboard
2. Select your project
3. Settings → Environment Variables
4. Add all variables from `.env.production`

**Via CLI:**
```bash
vercel env add NEXT_PUBLIC_APP_URL production
# Enter: https://your-domain.com

vercel env add PAYSTACK_SECRET_KEY production
# Enter: sk_live_...

# Repeat for all variables
```

---

### **Step 4: Custom Domain Setup**

#### **A. Add Domain in Vercel:**
1. Project Settings → Domains
2. Add your domain: `your-domain.com`
3. Follow DNS configuration instructions

#### **B. Update Environment Variable:**
```bash
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

#### **C. Update Firebase Console:**
1. Authentication → Templates
2. Change Action URL to:
   ```
   https://your-domain.com/auth/action
   ```

---

### **Step 5: Firebase Security Rules (Production)**

Update `firestore.rules` for production:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }
    
    function hasRole(role) {
      return isSignedIn() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == role;
    }
    
    function isEmailVerified() {
      return isSignedIn() && request.auth.token.email_verified == true;
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isSignedIn();
      allow create: if isOwner(userId);
      allow update: if isOwner(userId);
      allow delete: if hasRole('admin') || hasRole('super_admin');
    }
    
    // Orders collection
    match /orders/{orderId} {
      allow read: if isOwner(resource.data.userId) || hasRole('admin') || hasRole('vendor');
      allow create: if isSignedIn() && isEmailVerified(); // Must be verified to create orders
      allow update: if hasRole('admin') || hasRole('vendor');
      allow delete: if hasRole('admin');
    }
    
    // Products collection
    match /products/{productId} {
      allow read: if true; // Anyone can read
      allow create: if hasRole('vendor') && isEmailVerified();
      allow update: if hasRole('vendor') && resource.data.vendorId == request.auth.uid;
      allow delete: if hasRole('vendor') && resource.data.vendorId == request.auth.uid;
    }
    
    // Sessions collection
    match /sessions/{sessionId} {
      allow read: if isOwner(resource.data.userId);
      allow write: if isOwner(resource.data.userId);
    }
  }
}
```

Deploy rules:
```bash
firebase deploy --only firestore:rules
```

---

### **Step 6: Switch to Live Payment Keys**

#### **Paystack:**
1. Go to: https://dashboard.paystack.com
2. Settings → API Keys & Webhooks
3. Copy **Live** keys (not test)
4. Update in Vercel:
   ```bash
   NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_...
   PAYSTACK_SECRET_KEY=sk_live_...
   ```

#### **Test Live Payment:**
1. Use real card (not test card)
2. Small amount (₦100)
3. Verify order created
4. Check email received

---

### **Step 7: Email Service (Resend) Production**

#### **A. Verify Domain:**
1. Go to: https://resend.com/domains
2. Add your domain
3. Add DNS records (SPF, DKIM, DMARC)
4. Verify domain

#### **B. Update Email Templates:**
In `lib/email/service.ts`, change:
```typescript
from: 'MarketHub <noreply@your-domain.com>'  // Use your domain
```

#### **C. Test Emails:**
```bash
# Send test email
curl -X POST https://your-domain.com/api/test-email
```

---

## 🧪 Pre-Launch Testing Checklist

### **1. Email Verification Flow:**
- [ ] Sign up with real email
- [ ] Receive verification email
- [ ] Click link → See custom branded page
- [ ] Verify redirects to login
- [ ] Login works
- [ ] Firestore `emailVerified: true`

### **2. Payment Flow:**
- [ ] Add product to cart
- [ ] Checkout (must be verified)
- [ ] Pay with real card (small amount)
- [ ] Order created in Firestore
- [ ] Confirmation email received
- [ ] Digital product download works (if applicable)

### **3. User Experience:**
- [ ] All pages load fast
- [ ] Mobile responsive
- [ ] No console errors
- [ ] Images load correctly
- [ ] Forms work properly

### **4. Security:**
- [ ] Firestore rules deployed
- [ ] API routes protected
- [ ] Environment variables secure
- [ ] HTTPS enabled
- [ ] Email verification required for checkout

---

## 📊 Environment Comparison

| Feature | Development | Production |
|---------|-------------|------------|
| **URL** | `localhost:3000` | `your-domain.com` |
| **Firebase** | Test project | Production project |
| **Paystack** | Test keys | Live keys |
| **Emails** | Test mode | Live domain |
| **Action URL** | `localhost:3000/auth/action` | `your-domain.com/auth/action` |
| **Auto-Detection** | ✅ Yes | ✅ Yes |

---

## 🔄 Deployment Workflow

### **Recommended Workflow:**

```
1. Develop locally (localhost)
   ↓
2. Test with test keys
   ↓
3. Commit to Git
   ↓
4. Push to GitHub
   ↓
5. Vercel auto-deploys to preview
   ↓
6. Test preview deployment
   ↓
7. Merge to main branch
   ↓
8. Vercel auto-deploys to production
   ↓
9. Update Firebase action URL
   ↓
10. Test production
```

---

## 🚨 Common Production Issues & Solutions

### **Issue 1: Verification Email Not Working**
**Cause:** Firebase action URL not updated
**Solution:** 
1. Go to Firebase Console
2. Update action URL to production domain
3. Test again

### **Issue 2: Payment Failing**
**Cause:** Using test keys in production
**Solution:**
1. Switch to live Paystack keys
2. Redeploy
3. Test with real card

### **Issue 3: Emails Not Sending**
**Cause:** Domain not verified in Resend
**Solution:**
1. Verify domain in Resend
2. Add DNS records
3. Wait for propagation (up to 24 hours)

### **Issue 4: Firestore Permission Denied**
**Cause:** Security rules too strict
**Solution:**
1. Check Firestore rules
2. Ensure `emailVerified` check is correct
3. Deploy updated rules

---

## 📱 Mobile App Considerations (Future)

If you build a mobile app later:

### **Deep Links:**
```typescript
// Update action URL to support deep links
const actionCodeSettings = {
  url: `https://your-domain.com/auth/action`,
  iOS: {
    bundleId: 'com.yourapp.ios'
  },
  android: {
    packageName: 'com.yourapp.android',
    installApp: true,
    minimumVersion: '12'
  },
  handleCodeInApp: true  // Handle in app
}
```

---

## 🎯 Production Best Practices

### **1. Monitoring:**
- [ ] Set up error tracking (Sentry)
- [ ] Monitor Firebase usage
- [ ] Track payment success rate
- [ ] Monitor email delivery

### **2. Backups:**
- [ ] Regular Firestore backups
- [ ] Database export schedule
- [ ] User data backup

### **3. Performance:**
- [ ] Enable caching
- [ ] Optimize images
- [ ] Use CDN (Cloudinary)
- [ ] Monitor Core Web Vitals

### **4. Security:**
- [ ] Regular security audits
- [ ] Update dependencies
- [ ] Monitor suspicious activity
- [ ] Rate limiting enabled

---

## 🎉 Launch Checklist

### **Pre-Launch:**
- [ ] All environment variables set
- [ ] Firebase action URL updated
- [ ] Live payment keys configured
- [ ] Domain verified for emails
- [ ] Firestore rules deployed
- [ ] SSL certificate active
- [ ] All features tested
- [ ] Mobile responsive checked
- [ ] Error tracking set up

### **Launch Day:**
- [ ] Deploy to production
- [ ] Test complete user flow
- [ ] Monitor error logs
- [ ] Check email delivery
- [ ] Test payment processing
- [ ] Verify all links work

### **Post-Launch:**
- [ ] Monitor user signups
- [ ] Track payment success rate
- [ ] Check email delivery rate
- [ ] Monitor performance
- [ ] Collect user feedback

---

## 📞 Support Resources

### **Firebase:**
- Console: https://console.firebase.google.com
- Docs: https://firebase.google.com/docs

### **Vercel:**
- Dashboard: https://vercel.com/dashboard
- Docs: https://vercel.com/docs

### **Paystack:**
- Dashboard: https://dashboard.paystack.com
- Docs: https://paystack.com/docs

### **Resend:**
- Dashboard: https://resend.com/emails
- Docs: https://resend.com/docs

---

## 🚀 Quick Deploy Commands

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Test production build locally
npm start

# Deploy to Vercel
vercel --prod

# Check deployment status
vercel ls

# View logs
vercel logs
```

---

*Production Deployment Guide*
*Last Updated: 2025-10-15*
*Status: Ready for Production* 🚀

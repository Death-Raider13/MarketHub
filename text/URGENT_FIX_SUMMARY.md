# URGENT: Digital Purchase Issues - Complete Fix Guide

## 🚨 Issues Reported
1. ❌ Digital products not showing on /my-purchases page
2. ❌ No confirmation email received after purchase
3. ✅ Payment successful (Paystack working)

## 🔍 Root Causes Found

### Issue 1: Missing Firestore Index (CRITICAL)
**Problem**: The query `purchasedProducts.where('userId', '==', userId).orderBy('purchasedAt', 'desc')` requires a composite index that doesn't exist.

**Symptom**: API returns 500 error with message about missing index

**Fix**: Deploy Firestore indexes (see below)

### Issue 2: Unsafe Admin Import
**Problem**: Using `adminDb` from `@/lib/firebase/admin` which could be null

**Fix**: Changed to use `getAdminFirestore()` with null check

### Issue 3: Email Configuration
**Status**: ✅ Email is properly configured in `.env.local`
- SMTP (Gmail) configured
- Resend API key configured
- Should be working

## ✅ Fixes Applied

### 1. Fixed Purchase API
**File**: `app/api/customer/purchases/route.ts`

Changed from:
```typescript
import { adminDb } from '@/lib/firebase/admin'
```

To:
```typescript
import { getAdminFirestore } from '@/lib/firebase/admin-simple'

const adminDb = getAdminFirestore()
if (!adminDb) {
  return NextResponse.json({ error: 'Database not available' }, { status: 500 })
}
```

### 2. Added Missing Firestore Indexes
**File**: `firestore.indexes.json`

Added indexes for `purchasedProducts` collection:
- `userId` + `purchasedAt` (descending)
- `orderId` + `userId`

### 3. Created Debug Endpoint
**File**: `app/api/debug/check-purchase/route.ts`

Use to diagnose issues:
```
/api/debug/check-purchase?userId=YOUR_USER_ID&orderId=YOUR_ORDER_ID
```

### 4. Added Digital Download Route Config
**File**: `app/api/digital-products/download/route.ts`

Added:
```typescript
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
```

## 🚀 Deployment Steps (DO THIS NOW)

### Step 1: Deploy Firestore Indexes (CRITICAL)

**Option A: Using Firebase CLI** (Recommended)
```bash
# Install Firebase CLI if needed
npm install -g firebase-tools

# Login
firebase login

# Deploy indexes
firebase deploy --only firestore:indexes
```

**Option B: Manual Creation**
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select project: `marketplace-97508`
3. Go to Firestore Database → Indexes
4. Create index:
   - Collection: `purchasedProducts`
   - Fields: `userId` (Ascending), `purchasedAt` (Descending)

### Step 2: Deploy Code Changes
```bash
# Commit changes
git add .
git commit -m "Fix: Digital purchase display and email issues"

# Push to deploy
git push
```

### Step 3: Wait for Index to Build
- Check Firebase Console → Firestore → Indexes
- Wait until status shows "Enabled" (not "Building")
- Usually takes 1-5 minutes for small collections

### Step 4: Test
1. Visit `/my-purchases` page
2. Should now show digital products
3. Try downloading files

## 🧪 Testing & Verification

### Test 1: Check if Purchase Records Exist
```
https://your-domain.com/api/debug/check-purchase?userId=USER_ID&orderId=ORDER_ID
```

Expected: Should show purchase records

### Test 2: Check Purchase API
```
https://your-domain.com/api/customer/purchases?userId=USER_ID
```

Expected: Should return list of purchases

### Test 3: Check My Purchases Page
Visit: `/my-purchases`

Expected: Should show digital products with download buttons

### Test 4: Test Email
Visit: `/test-email`

Send test email to verify SMTP is working

## 📧 Email Troubleshooting

If emails still aren't sending:

### Check 1: Verify Email Logs
Look in Vercel logs for:
```
✅ Confirmation email sent with X download links
```

Or errors:
```
⚠️ Failed to send confirmation email: [error]
```

### Check 2: Test SMTP Credentials
Your current config:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=feromarkethub@gmail.com
SMTP_PASS=rmbyfktqutatmxci
```

If not working:
1. Generate new Gmail App Password: https://myaccount.google.com/apppasswords
2. Update `SMTP_PASS` in Vercel environment variables
3. Redeploy

### Check 3: Try Resend Instead
You have Resend configured. To use it:
1. Temporarily remove SMTP env vars from Vercel
2. Keep only `RESEND_API_KEY`
3. Redeploy

Resend is more reliable than SMTP.

## 🔧 For Existing Purchases

If a customer already made a purchase before the fix:

### Option 1: Check if Records Exist
Use debug endpoint to see if purchase records were created

### Option 2: Manual Fix (if records don't exist)
1. Go to Firebase Console → Firestore
2. Find the order in `orders` collection
3. Manually create records in `purchasedProducts`:

```javascript
{
  userId: "user-id-from-order",
  productId: "product-id",
  orderId: "order-id",
  product: {
    id: "product-id",
    name: "Product Name",
    type: "digital",
    price: 5000,
    digitalFiles: [
      {
        id: "file-id",
        fileName: "file.pdf",
        fileUrl: "cloudinary-url",
        fileSize: 1024000,
        fileType: "pdf"
      }
    ]
  },
  purchasedAt: new Date(),
  downloadCount: 0,
  accessExpiresAt: null
}
```

### Option 3: Resend Email Manually
If purchase records exist but email wasn't sent:
1. Use `/test-email` endpoint
2. Or create a manual email resend endpoint

## 📊 Monitoring

### Check Vercel Logs
```bash
vercel logs --follow
```

Look for:
- `✅ Creating purchase records for X digital products`
- `✅ Generated X download links`
- `✅ Confirmation email sent`

### Check Firebase Console
- Verify purchase records are being created
- Check index build status
- Monitor query performance

## ⚠️ Common Issues

### Issue: "Missing index" error
**Solution**: Deploy Firestore indexes (Step 1 above)

### Issue: "Database not available" error
**Solution**: Check Firebase Admin SDK initialization in logs

### Issue: Purchases show but can't download
**Solution**: Check if digitalFiles array exists in product data

### Issue: Email not received
**Solutions**:
1. Check spam folder
2. Verify SMTP credentials
3. Try Resend instead
4. Check Vercel logs for email errors

## 📝 Checklist

- [ ] Deploy Firestore indexes
- [ ] Wait for indexes to build (check Firebase Console)
- [ ] Deploy code changes to Vercel
- [ ] Test with debug endpoint
- [ ] Test /my-purchases page
- [ ] Test email sending
- [ ] Make a test purchase to verify end-to-end
- [ ] Check existing customer's purchase (if applicable)

## 🆘 If Still Not Working

1. **Check Vercel Logs**:
   ```bash
   vercel logs --follow
   ```

2. **Check Firebase Console**:
   - Firestore → Data → purchasedProducts
   - Firestore → Indexes (verify "Enabled" status)

3. **Use Debug Endpoint**:
   ```
   /api/debug/check-purchase?userId=XXX&orderId=YYY
   ```

4. **Check Browser Console**:
   - Open DevTools → Console
   - Look for API errors

5. **Contact Support**:
   - Provide order ID
   - Provide user ID
   - Share debug endpoint output
   - Share Vercel logs

## 📞 Quick Reference

- Firebase Console: https://console.firebase.google.com
- Vercel Dashboard: https://vercel.com/dashboard
- Paystack Dashboard: https://dashboard.paystack.com
- Gmail App Passwords: https://myaccount.google.com/apppasswords

---

**Status**: ✅ Code fixes applied, ⚠️ Indexes need deployment
**Priority**: 🚨 HIGH - Deploy indexes immediately
**ETA**: 5-10 minutes after index deployment
**Next Action**: Run `firebase deploy --only firestore:indexes`

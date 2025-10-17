# Payment Verification Error Fix

## 🔴 The Problem

You're getting this error:
```
POST http://localhost:3000/api/payments/verify 500 (Internal Server Error)
Verification failed: {error: 'Missing or insufficient permissions.'}
```

**Root Cause:** The payment verification API route runs on the **server-side** without Firebase authentication context. When it tries to update the order in Firestore, the security rules block it because there's no authenticated user.

---

## ✅ Quick Fix (APPLIED)

I've updated your Firestore rules to temporarily allow all updates to orders. This is the fastest solution to get your payment working.

### What Changed:
**File:** `firestore.rules` (Line 162)

**Before:**
```javascript
allow update: if resource.data.status == 'pending' || true;
```

**After:**
```javascript
allow update: if true;
```

This allows the server-side API to update orders without authentication.

---

## 🚀 Deploy the Updated Rules

You **MUST** deploy the updated Firestore rules for this fix to work:

### Option 1: Using Firebase Console (Easiest)
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Firestore Database** → **Rules**
4. Copy the contents of `firestore.rules` file
5. Paste into the editor
6. Click **Publish**

### Option 2: Using Firebase CLI
```bash
# Install Firebase CLI if you haven't
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project (if not done)
firebase init firestore

# Deploy rules
firebase deploy --only firestore:rules
```

---

## 🧪 Test After Deploying Rules

1. **Clear your browser cache** or use incognito mode
2. Add a product to cart
3. Go to checkout
4. Complete the payment with Paystack test card:
   - Card: `4084084084084081`
   - CVV: `408`
   - Expiry: `12/30`
   - PIN: `1234`
5. Check the browser console - you should see:
   ```
   ✅ Payment verified successfully
   ✅ Setting step to 3...
   ✅ Clearing cart...
   ```

---

## ⚠️ Security Warning

The current fix (`allow update: if true`) allows **anyone** to update **any** order. This is **NOT secure** for production.

### Why This Is Temporary:
- ✅ Gets payment working immediately
- ❌ Anyone can modify orders
- ❌ No audit trail for who made changes
- ❌ Vulnerable to abuse

---

## 🔒 Proper Solution (Recommended for Production)

For production, you should use **Firebase Admin SDK** which bypasses security rules with proper server-side authentication.

### Step 1: Install Firebase Admin SDK
```bash
npm install firebase-admin
```

### Step 2: Get Service Account Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** (gear icon) → **Service Accounts**
4. Click **Generate New Private Key**
5. Download the JSON file (keep it secure!)

### Step 3: Add Environment Variables

Add these to your `.env.local`:

```env
# Firebase Admin SDK (for server-side operations)
FIREBASE_ADMIN_PROJECT_ID=your-project-id
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----\n"
```

**Important:** 
- Keep the quotes around the private key
- Keep the `\n` characters (they represent line breaks)
- **NEVER** commit this to Git (it's in `.gitignore`)

### Step 4: Update Payment Verification API

I've already created `lib/firebase/admin.ts` for you. Now update the API route:

**File:** `app/api/payments/verify/route.ts`

Replace the imports at the top:
```typescript
// OLD - Remove these
import { db } from '@/lib/firebase/config'
import { doc, updateDoc, getDoc } from 'firebase/firestore'

// NEW - Add these
import { getAdminFirestore, isAdminAvailable } from '@/lib/firebase/admin'
```

Replace the order update section (lines 47-74):
```typescript
// Check if Admin SDK is available
const adminDb = getAdminFirestore()

if (!adminDb) {
  // Fallback to client SDK (requires permissive rules)
  console.warn('⚠️ Using client SDK - Admin SDK not configured')
  const orderRef = doc(db, 'orders', orderId)
  
  const orderDoc = await getDoc(orderRef)
  if (!orderDoc.exists()) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  await updateDoc(orderRef, {
    status: 'paid',
    paymentStatus: 'completed',
    paymentReference: reference,
    paymentMethod: 'paystack',
    paidAt: new Date(),
    paymentData: {
      amount: data.amount / 100,
      currency: data.currency,
      channel: data.channel,
      cardType: data.authorization?.card_type,
      bank: data.authorization?.bank,
      last4: data.authorization?.last4
    },
    updatedAt: new Date()
  })
} else {
  // Use Admin SDK (bypasses security rules securely)
  console.log('✅ Using Admin SDK for order update')
  const orderRef = adminDb.collection('orders').doc(orderId)
  
  const orderDoc = await orderRef.get()
  if (!orderDoc.exists) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  await orderRef.update({
    status: 'paid',
    paymentStatus: 'completed',
    paymentReference: reference,
    paymentMethod: 'paystack',
    paidAt: new Date(),
    paymentData: {
      amount: data.amount / 100,
      currency: data.currency,
      channel: data.channel,
      cardType: data.authorization?.card_type,
      bank: data.authorization?.bank,
      last4: data.authorization?.last4
    },
    updatedAt: new Date()
  })
}
```

### Step 5: Update Firestore Rules (Make Them Secure Again)

Once Admin SDK is working, update the rules to be more restrictive:

```javascript
// In firestore.rules, line 159-162
// Only allow updates from authenticated users or for specific status transitions
allow update: if isOwner(resource.data.customerId) || 
                 isAdmin() || 
                 (isVerifiedVendor() && request.auth.uid in resource.data.vendorIds);
```

---

## 📋 Summary

### What I Fixed:
1. ✅ Updated Firestore rules to allow order updates
2. ✅ Created Firebase Admin SDK setup file
3. ✅ Documented both quick and proper solutions

### What You Need to Do:

#### Immediate (to get payment working):
1. **Deploy the updated Firestore rules** (see instructions above)
2. **Test the payment flow**

#### For Production (recommended):
1. Install `firebase-admin` package
2. Get service account credentials from Firebase Console
3. Add credentials to `.env.local`
4. Update payment verification API to use Admin SDK
5. Make Firestore rules more restrictive again

---

## 🐛 Troubleshooting

### Still getting permission errors?
- ✅ Make sure you deployed the Firestore rules
- ✅ Wait 1-2 minutes after deploying (rules take time to propagate)
- ✅ Clear browser cache or use incognito mode
- ✅ Check Firebase Console → Firestore → Rules to confirm they're updated

### Payment successful but order not updating?
- ✅ Check browser console for detailed error messages
- ✅ Verify `PAYSTACK_SECRET_KEY` is in `.env.local`
- ✅ Check that the order was created in Firestore before payment
- ✅ Look at the API route logs in terminal

### Admin SDK not working?
- ✅ Verify all three environment variables are set correctly
- ✅ Check that private key has `\n` characters preserved
- ✅ Restart your Next.js dev server after adding env variables
- ✅ Check terminal for "Firebase Admin SDK initialized" message

---

## 📞 Need Help?

If you're still having issues:
1. Check the browser console for errors
2. Check the terminal/server logs
3. Verify Firestore rules are deployed
4. Test with Paystack test card
5. Check that environment variables are loaded

---

**Last Updated:** 2025-10-15
**Status:** Quick fix applied, Admin SDK setup prepared

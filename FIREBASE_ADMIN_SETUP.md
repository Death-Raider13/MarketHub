# 🔧 Firebase Admin SDK Setup - REQUIRED

## ⚠️ **Issue: Balance Not Updating**

The balance is not updating because Firebase Admin SDK is not properly configured.

---

## 🔑 **Setup Firebase Admin Credentials:**

### **Step 1: Get Service Account Key**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **marketplace-97508**
3. Click the ⚙️ gear icon → **Project settings**
4. Go to **Service accounts** tab
5. Click **Generate new private key**
6. Download the JSON file

### **Step 2: Add to .env.local**

Open your `.env.local` file and add these variables:

```env
# Firebase Admin SDK (for server-side operations)
FIREBASE_ADMIN_PROJECT_ID=marketplace-97508
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@marketplace-97508.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

**Important:** 
- Copy the values from the downloaded JSON file
- The private key must be wrapped in quotes
- Keep the `\n` characters in the private key

### **Step 3: Restart Dev Server**

```bash
# Stop the current server (Ctrl+C)
npm run dev
```

---

## 📋 **Alternative: Use Client SDK (Temporary)**

If you don't want to set up Admin SDK right now, you can use the client SDK instead:

### **Update add-funds route:**

```typescript
// app/api/advertiser/add-funds/route.ts
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { userId, amount, reference } = await request.json()

    if (!userId || !amount || !reference) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Import client Firestore
    const { doc, updateDoc, increment, serverTimestamp, addDoc, collection } = await import("firebase/firestore")
    const { db } = await import("@/lib/firebase/config")

    // Update advertiser balance
    const advertiserRef = doc(db, "advertisers", userId)
    
    await updateDoc(advertiserRef, {
      accountBalance: increment(amount),
      updatedAt: serverTimestamp(),
    })

    // Create transaction record
    await addDoc(collection(db, "transactions"), {
      userId,
      type: "credit",
      amount,
      reference,
      description: "Account top-up",
      status: "completed",
      createdAt: serverTimestamp(),
    })

    return NextResponse.json({
      success: true,
      message: "Funds added successfully",
    })
  } catch (error) {
    console.error("Error adding funds:", error)
    return NextResponse.json(
      { error: "Failed to add funds" },
      { status: 500 }
    )
  }
}
```

---

## 🎯 **Which Option to Choose?**

### **Option 1: Firebase Admin SDK (Recommended)**
✅ **Pros:**
- Bypasses Firestore security rules
- More secure for server operations
- Better for production

❌ **Cons:**
- Requires service account setup
- More configuration

### **Option 2: Client SDK (Quick Fix)**
✅ **Pros:**
- No additional setup
- Works immediately
- Good for development

❌ **Cons:**
- Must follow Firestore security rules
- Less secure for production
- May have permission issues

---

## 🚀 **Quick Fix (Use Client SDK):**

I'll create the updated route file for you that uses the client SDK instead of Admin SDK. This will work immediately without any additional setup!

---

*Firebase Admin Setup Guide*
*Date: January 16, 2025*

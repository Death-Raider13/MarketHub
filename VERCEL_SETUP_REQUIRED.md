# 🔥 CRITICAL: Firebase Admin Setup Required

## 🚨 **Why Your API is Failing**

The 500 errors are happening because **Firebase Admin SDK is not configured in Vercel**. The API routes need admin credentials to query Firestore without security rules.

---

## ✅ **Solution: Add Firebase Service Account to Vercel**

### **Step 1: Get Firebase Service Account**

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Click **⚙️ Settings** (gear icon) → **Project settings**
4. Go to **Service accounts** tab
5. Click **Generate new private key**
6. Download the JSON file (keep it secret!)

---

### **Step 2: Add to Vercel Environment Variables**

#### **Option A: As JSON String (Recommended)**

1. Open the downloaded JSON file
2. Copy the entire JSON content
3. Go to [Vercel Dashboard](https://vercel.com/dashboard)
4. Select your project → **Settings** → **Environment Variables**
5. Add new variable:
   - **Name:** `FIREBASE_SERVICE_ACCOUNT_JSON`
   - **Value:** Paste the entire JSON (should start with `{` and end with `}`)
   - **Environment:** Production, Preview, Development (check all)
6. Click **Save**

#### **Option B: As Individual Variables**

Or add these 3 variables separately:

1. **FIREBASE_ADMIN_PROJECT_ID**
   - Value: `your-project-id` (from JSON: `project_id`)

2. **FIREBASE_ADMIN_CLIENT_EMAIL**
   - Value: `firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com` (from JSON: `client_email`)

3. **FIREBASE_ADMIN_PRIVATE_KEY**
   - Value: `-----BEGIN PRIVATE KEY-----\nMIIE...` (from JSON: `private_key`)
   - **Important:** Keep the `\n` characters as-is

---

### **Step 3: Redeploy**

After adding environment variables:

```bash
# Trigger a new deployment
git commit --allow-empty -m "Trigger redeploy with Firebase Admin"
git push origin main
```

Or in Vercel dashboard:
- Go to **Deployments**
- Click **⋯** on latest deployment
- Click **Redeploy**

---

## 🧪 **Test the Fix**

After redeployment:

1. Go to your site: `https://marketplace-ecommerce-one.vercel.app`
2. Login as vendor
3. Go to `/vendor/dashboard`
4. **Should see:** Stats loading successfully
5. **Should NOT see:** 500 errors

### **Debug Endpoint**

Test if admin is working:
```
https://marketplace-ecommerce-one.vercel.app/api/vendor/stats/debug?vendorId=YOUR_VENDOR_ID
```

Should return:
```json
{
  "success": true,
  "message": "Admin DB working",
  "productsCount": 0,
  "vendorId": "..."
}
```

---

## 📋 **Complete Environment Variables Checklist**

Make sure ALL these are set in Vercel:

### **Firebase Client (Frontend)**
- ✅ `NEXT_PUBLIC_FIREBASE_API_KEY`
- ✅ `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- ✅ `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- ✅ `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- ✅ `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- ✅ `NEXT_PUBLIC_FIREBASE_APP_ID`

### **Firebase Admin (Backend)** ⚠️ **MISSING - ADD THESE**
- ❌ `FIREBASE_SERVICE_ACCOUNT_JSON` (entire JSON)
  
  **OR**
  
- ❌ `FIREBASE_ADMIN_PROJECT_ID`
- ❌ `FIREBASE_ADMIN_CLIENT_EMAIL`
- ❌ `FIREBASE_ADMIN_PRIVATE_KEY`

### **Cloudinary**
- ✅ `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
- ✅ `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`

### **Paystack**
- ✅ `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`
- ✅ `PAYSTACK_SECRET_KEY`

---

## 🔍 **How to Check Current Variables**

1. Go to Vercel Dashboard
2. Select project
3. Go to **Settings** → **Environment Variables**
4. Check if Firebase Admin variables exist
5. If missing → Add them!

---

## ⚠️ **Security Notes**

### **DO:**
- ✅ Keep service account JSON secret
- ✅ Never commit to Git
- ✅ Only add to Vercel environment variables
- ✅ Use `.gitignore` for local JSON files

### **DON'T:**
- ❌ Share service account publicly
- ❌ Commit to GitHub
- ❌ Expose in client-side code
- ❌ Use in frontend components

---

## 🐛 **Troubleshooting**

### **Error: "Admin DB is null"**
**Solution:** Firebase Admin credentials not set in Vercel

### **Error: "Failed to parse JSON"**
**Solution:** Check JSON format, must be valid JSON

### **Error: "Invalid private key"**
**Solution:** Make sure `\n` characters are preserved

### **Still Getting 500 Errors?**
1. Check Vercel function logs
2. Verify all environment variables are set
3. Make sure you redeployed after adding variables
4. Test the debug endpoint

---

## 📝 **Quick Setup Script**

```bash
# 1. Download service account from Firebase
# 2. Copy the JSON content
# 3. Add to Vercel as FIREBASE_SERVICE_ACCOUNT_JSON
# 4. Redeploy

git commit --allow-empty -m "Add Firebase Admin credentials"
git push origin main
```

---

## ✅ **Success Checklist**

After setup:
- [ ] Service account JSON downloaded
- [ ] Environment variable added to Vercel
- [ ] Redeployment triggered
- [ ] Dashboard loads without errors
- [ ] Stats display correctly
- [ ] No 500 errors in console

---

## 🎯 **Expected Result**

Once Firebase Admin is configured:
- ✅ `/api/vendor/stats` returns 200
- ✅ `/api/vendor/orders` returns 200
- ✅ Dashboard displays stats
- ✅ No "Admin DB is null" errors
- ✅ All vendor features work

---

## 📞 **Still Need Help?**

If errors persist after adding credentials:

1. **Check Vercel Logs:**
   - Go to Vercel Dashboard → Deployments
   - Click on latest deployment
   - Check **Functions** tab for errors

2. **Test Debug Endpoint:**
   - Visit `/api/vendor/stats/debug?vendorId=YOUR_ID`
   - Check the error message

3. **Verify JSON Format:**
   - Make sure it's valid JSON
   - No extra quotes or escaping

---

**The fix is simple: Add Firebase Admin credentials to Vercel, then redeploy!** 🚀

*This is the #1 reason for 500 errors in production.*

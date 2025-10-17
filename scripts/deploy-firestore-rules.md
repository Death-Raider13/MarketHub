# Deploy Firestore Rules - Quick Guide

## 🚀 Method 1: Firebase Console (Easiest - No CLI needed)

### Steps:
1. Open [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click **Firestore Database** in the left sidebar
4. Click the **Rules** tab at the top
5. You'll see the rules editor
6. Open your local `firestore.rules` file
7. **Copy ALL the contents** from your local file
8. **Paste** into the Firebase Console editor (replace everything)
9. Click **Publish** button
10. Wait for confirmation message

### ✅ Verification:
- You should see "Rules published successfully"
- The timestamp should update to current time

---

## 🚀 Method 2: Firebase CLI (For Developers)

### Prerequisites:
```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Or using npm in your project
npm install -D firebase-tools
```

### Steps:

#### 1. Login to Firebase
```bash
firebase login
```
This will open a browser for authentication.

#### 2. Initialize Firebase (if not done)
```bash
firebase init firestore
```
- Select your project
- Accept default `firestore.rules` file
- Accept default `firestore.indexes.json` file

#### 3. Deploy Rules
```bash
firebase deploy --only firestore:rules
```

### ✅ Verification:
You should see:
```
✔  Deploy complete!
✔  firestore: released rules firestore.rules to cloud.firestore
```

---

## 🧪 Test After Deployment

### 1. Wait 1-2 minutes
Rules take a moment to propagate across Firebase servers.

### 2. Clear Browser Cache
- Press `Ctrl + Shift + Delete` (Windows)
- Or use Incognito/Private mode

### 3. Test Payment Flow
1. Add product to cart
2. Go to checkout
3. Complete payment with test card:
   - Card: `4084084084084081`
   - CVV: `408`
   - Expiry: `12/30`
   - PIN: `1234`

### 4. Check Console
You should see:
```
Payment successful: {reference: '...', status: 'success'}
✅ Payment verified successfully
✅ Setting step to 3...
✅ Clearing cart...
```

**No more "Missing or insufficient permissions" error!**

---

## ❌ Common Issues

### Issue: "firebase: command not found"
**Solution:** Install Firebase CLI globally
```bash
npm install -g firebase-tools
```

### Issue: "Permission denied"
**Solution:** Login again
```bash
firebase logout
firebase login
```

### Issue: "No project active"
**Solution:** Select your project
```bash
firebase use --add
```
Then select your project from the list.

### Issue: Rules not updating
**Solution:** 
1. Check you're in the correct Firebase project
2. Wait 2-3 minutes after deployment
3. Clear browser cache completely
4. Check Firebase Console to verify rules are updated

---

## 📝 What Changed in the Rules?

**Location:** Line 162 in `firestore.rules`

**Before:**
```javascript
allow update: if resource.data.status == 'pending' || true;
```

**After:**
```javascript
allow update: if true;
```

**Why:** This allows the server-side payment verification API to update orders without authentication. This is temporary until you set up Firebase Admin SDK.

---

## 🔒 Security Note

The current rule (`allow update: if true`) is **permissive** and should be replaced with Firebase Admin SDK for production.

See `PAYMENT_VERIFICATION_FIX.md` for the proper production solution.

---

## ✅ Success Checklist

- [ ] Firestore rules deployed successfully
- [ ] Waited 1-2 minutes for propagation
- [ ] Cleared browser cache
- [ ] Tested payment with test card
- [ ] Payment verification successful
- [ ] Order status updated to "paid"
- [ ] No permission errors in console

---

**Need help?** Check `PAYMENT_VERIFICATION_FIX.md` for detailed troubleshooting.

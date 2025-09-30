# 🔐 Create Super Admin - Step by Step Guide

## Method 1: Firebase Console (Easiest - Recommended)

### Step 1: Create User Account
1. Go to your app: `http://localhost:3000/auth/signup`
2. Sign up with your email and password
3. Choose role: **Customer** (we'll change this)
4. Complete signup

### Step 2: Set Super Admin Role in Firestore
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Click **Firestore Database** in left menu
4. Find the `users` collection
5. Click on your user document (find by email)
6. Click the **pencil icon** to edit
7. Find the `role` field
8. Change value from `customer` to `super_admin`
9. Click **Update**

### Step 3: Verify
1. Logout from your app
2. Login again
3. Go to: `http://localhost:3000/admin/super-admin`
4. You should see the Super Admin Dashboard! 🎉

---

## Method 2: Firebase Admin SDK (For Developers)

### Step 1: Install Firebase Admin SDK

```bash
npm install firebase-admin
```

### Step 2: Create Script

Create file: `scripts/create-super-admin.js`

```javascript
const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('../path/to/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function createSuperAdmin(email) {
  try {
    // Find user by email
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', email).get();
    
    if (snapshot.empty) {
      console.log('User not found. Please sign up first.');
      return;
    }
    
    // Update user role
    const userDoc = snapshot.docs[0];
    await userDoc.ref.update({
      role: 'super_admin'
    });
    
    console.log(`✅ Successfully made ${email} a Super Admin!`);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Replace with your email
createSuperAdmin('your-email@example.com');
```

### Step 3: Run Script

```bash
node scripts/create-super-admin.js
```

---

## Method 3: Firestore REST API (Advanced)

### Using cURL:

```bash
curl -X PATCH \
  'https://firestore.googleapis.com/v1/projects/YOUR_PROJECT_ID/databases/(default)/documents/users/USER_ID?updateMask.fieldPaths=role' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "fields": {
      "role": {
        "stringValue": "super_admin"
      }
    }
  }'
```

---

## ✅ Verification Checklist

After creating Super Admin, verify:

- [ ] Can login successfully
- [ ] Can access `/admin/dashboard`
- [ ] Can access `/admin/super-admin`
- [ ] See "Super Admin" badge in header
- [ ] Can create new admins
- [ ] Can view all admin activity
- [ ] Can access system settings

---

## 🚨 Security Reminders

1. **Only create 1-2 Super Admins** (platform owner + backup)
2. **Use strong password** (20+ characters)
3. **Enable 2FA** immediately
4. **Never share credentials**
5. **Use work email** (not personal)
6. **Document who has Super Admin access**
7. **Review access quarterly**

---

## 🆘 Troubleshooting

### Issue: Can't access Super Admin page

**Check:**
1. Role is exactly `super_admin` (lowercase, underscore)
2. Logged out and back in after role change
3. No typos in Firestore

**Solution:**
```javascript
// In Firebase Console, verify exact value:
role: "super_admin"  // ✅ Correct
role: "Super Admin"  // ❌ Wrong
role: "superadmin"   // ❌ Wrong
role: "super-admin"  // ❌ Wrong
```

### Issue: "Insufficient permissions" error

**Solution:**
1. Check Firestore rules allow admin access
2. Verify user document exists in `users` collection
3. Clear browser cache and cookies
4. Try incognito/private window

### Issue: Can't find user in Firestore

**Solution:**
1. Make sure you completed signup
2. Check Firebase Authentication for user
3. User document should auto-create on signup
4. If missing, create manually with required fields:
   ```json
   {
     "uid": "user-id-from-auth",
     "email": "your-email@example.com",
     "role": "super_admin",
     "displayName": "Your Name",
     "createdAt": "2025-09-30T10:00:00Z"
   }
   ```

---

## 📞 Need Help?

If you're stuck:
1. Check browser console for errors
2. Check Firebase Console for authentication
3. Verify Firestore rules are deployed
4. Check environment variables are set

---

## 🎯 Quick Reference

**Super Admin Role Value:** `super_admin`

**Super Admin Dashboard URL:** `/admin/super-admin`

**Required Firestore Fields:**
- `uid` - User ID from Firebase Auth
- `email` - User email
- `role` - Must be `super_admin`
- `displayName` - User's name
- `createdAt` - Timestamp

**Firestore Path:**
```
users/{userId}/role = "super_admin"
```

---

**You're all set! Welcome to Super Admin! 👑**

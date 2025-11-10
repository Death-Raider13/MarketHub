# 🧪 Testing Admin Login & Routing

## Quick Test Guide

### Step 1: Create an Admin User in Firebase

Since you're using Firebase, you need to manually create an admin user in Firestore:

1. **Go to Firebase Console** → Your Project → Firestore Database

2. **Create a test admin user:**
   - Collection: `users`
   - Document ID: (use the Firebase Auth UID of your test user)
   - Fields:
     ```json
     {
       "uid": "your-firebase-auth-uid",
       "email": "admin@test.com",
       "role": "admin",
       "displayName": "Admin User",
       "createdAt": "2025-09-30T00:00:00.000Z"
     }
     ```

### Step 2: Create the User in Firebase Authentication

1. **Go to Firebase Console** → Authentication → Users
2. **Add User:**
   - Email: `admin@test.com`
   - Password: `admin123` (or your choice)
3. **Copy the UID** from the newly created user

### Step 3: Update Firestore Document

1. Go back to Firestore
2. Update the `users` collection document ID to match the UID from step 2
3. Ensure the `uid` field in the document also matches

### Step 4: Test the Login

1. **Clear browser cache and cookies**
2. **Go to:** `http://localhost:3000/auth/login`
3. **Login with:**
   - Email: `admin@test.com`
   - Password: `admin123`
4. **Expected Result:** You should be redirected to `/admin/dashboard`

---

## 🔍 Troubleshooting

### Issue: Still redirected to homepage

**Check 1: Verify User Profile in Firestore**
```javascript
// Open browser console and run:
console.log(localStorage.getItem('firebase:authUser'))
```

**Check 2: Verify Auth Context is Loading Profile**
- Open DevTools → Network tab
- Look for Firestore requests to `/users/{uid}`
- Check if the response contains `role: "admin"`

**Check 3: Check Console for Errors**
- Open browser console (F12)
- Look for any errors related to auth or routing

### Issue: "Permission Denied" Error

**Solution:** Update Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read their own profile
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Issue: Login page keeps reloading

**Solution:** Check for infinite redirect loop
- This happens if the `useEffect` in login page has wrong dependencies
- The fix I applied should resolve this

---

## 🧪 Complete Test Scenarios

### Test 1: Admin Login
```
1. Login as admin@test.com
2. Should redirect to /admin/dashboard
3. Should see admin sidebar with:
   - Dashboard
   - Vendors
   - Products
   - Orders
   - Users
   - Advertising
   - Settings
```

### Test 2: Vendor Login (Verified)
```
1. Create vendor user with verified: true
2. Login as vendor
3. Should redirect to /vendor/dashboard
4. Should see vendor sidebar with:
   - Dashboard
   - Products
   - Orders
   - Analytics
   - Advertising
   - Store Settings
```

### Test 3: Vendor Login (Unverified)
```
1. Create vendor user with verified: false
2. Login as vendor
3. Should redirect to /vendor/pending-approval
4. Should see pending approval message
```

### Test 4: Customer Login
```
1. Create customer user
2. Login as customer
3. Should redirect to / (homepage)
4. Header should show "My Orders", "Wishlist", "Settings"
```

### Test 5: Unauthorized Access
```
1. Login as customer
2. Try to access /admin/dashboard
3. Should redirect to / (homepage)
4. Should NOT see admin content
```

---

## 📝 Quick Firebase Setup Script

If you have Firebase Admin SDK access, you can run this script to create test users:

```javascript
// createTestUsers.js
const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.cert('./serviceAccountKey.json')
});

const db = admin.firestore();
const auth = admin.auth();

async function createTestUsers() {
  // Create Admin User
  const adminUser = await auth.createUser({
    email: 'admin@test.com',
    password: 'admin123',
    displayName: 'Admin User'
  });

  await db.collection('users').doc(adminUser.uid).set({
    uid: adminUser.uid,
    email: 'admin@test.com',
    role: 'admin',
    displayName: 'Admin User',
    createdAt: new Date()
  });

  console.log('Admin user created:', adminUser.uid);

  // Create Vendor User (Verified)
  const vendorUser = await auth.createUser({
    email: 'vendor@test.com',
    password: 'vendor123',
    displayName: 'Test Vendor'
  });

  await db.collection('users').doc(vendorUser.uid).set({
    uid: vendorUser.uid,
    email: 'vendor@test.com',
    role: 'vendor',
    displayName: 'Test Vendor',
    verified: true,
    storeName: 'Test Store',
    commission: 15,
    createdAt: new Date()
  });

  console.log('Vendor user created:', vendorUser.uid);

  // Create Customer User
  const customerUser = await auth.createUser({
    email: 'customer@test.com',
    password: 'customer123',
    displayName: 'Test Customer'
  });

  await db.collection('users').doc(customerUser.uid).set({
    uid: customerUser.uid,
    email: 'customer@test.com',
    role: 'customer',
    displayName: 'Test Customer',
    createdAt: new Date()
  });

  console.log('Customer user created:', customerUser.uid);
}

createTestUsers().then(() => {
  console.log('All test users created successfully!');
  process.exit(0);
}).catch(console.error);
```

---

## ✅ Verification Checklist

After logging in as admin, verify:

- [ ] URL is `/admin/dashboard`
- [ ] Page shows "Admin Dashboard" title
- [ ] Sidebar shows admin menu items
- [ ] Stats cards display (Total Revenue, Active Vendors, etc.)
- [ ] Revenue chart is visible
- [ ] Pending Approvals section shows
- [ ] Recent Activity section shows
- [ ] Header shows admin dropdown menu
- [ ] Can navigate to other admin pages
- [ ] Cannot access vendor-only pages

---

## 🎯 What I Fixed

### Before:
```typescript
// Login always redirected to homepage
router.push("/")
```

### After:
```typescript
// Login now checks role and redirects accordingly
useEffect(() => {
  if (user && userProfile && !loading) {
    switch (userProfile.role) {
      case "admin":
        router.push("/admin/dashboard")
        break
      case "vendor":
        if (userProfile.verified) {
          router.push("/vendor/dashboard")
        } else {
          router.push("/vendor/pending-approval")
        }
        break
      case "customer":
      default:
        router.push("/")
        break
    }
  }
}, [user, userProfile, loading, router])
```

---

## 🚀 Next Steps

1. **Create test users in Firebase** (see Step 1-3 above)
2. **Test admin login** with the credentials
3. **Verify routing** works correctly
4. **Test all role-based access**
5. **Deploy to production** once verified

---

## 📞 Still Having Issues?

If admin login still doesn't work:

1. **Check Firebase Config:**
   - Verify `.env.local` has correct Firebase credentials
   - Ensure Firebase project is initialized

2. **Check Browser Console:**
   - Look for JavaScript errors
   - Check Network tab for failed requests

3. **Verify Firestore Rules:**
   - Ensure users can read their own profile
   - Check if rules are too restrictive

4. **Clear Everything:**
   - Clear browser cache
   - Clear localStorage
   - Hard refresh (Ctrl+Shift+R)
   - Try incognito mode

5. **Check Auth Context:**
   - Add console.logs in `auth-context.tsx`
   - Verify `userProfile` is being set correctly
   - Check if `role` field exists in Firestore

---

**The routing is now fixed! Follow the steps above to test it.** 🎉

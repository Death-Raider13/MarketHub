# 🔧 Troubleshooting Super Admin Access

## Issue: Redirected to Home Page When Accessing Super Admin Dashboard

### Quick Diagnostic

1. **Go to:** `http://localhost:3000/admin/check-role`
2. This page will show you:
   - ✅ If you're logged in
   - ✅ Your current role
   - ✅ What you can access
   - ✅ Step-by-step instructions

---

## Common Issues & Solutions

### Issue 1: Role Not Set to `super_admin`

**Symptoms:**
- Redirected to home page when accessing `/admin/super-admin`
- Console shows: "Access denied. User role: customer"

**Solution:**

1. **Open Firebase Console:**
   - Go to https://console.firebase.google.com
   - Select your project

2. **Navigate to Firestore:**
   - Click "Firestore Database" in left menu
   - Click "users" collection

3. **Find Your User:**
   - Look for document with your email
   - Click on the document

4. **Update Role:**
   - Find the `role` field
   - Click the pencil icon to edit
   - Change value to: `super_admin` (exactly, lowercase, underscore)
   - Click "Update"

5. **Logout and Login:**
   ```bash
   # In your app
   1. Click logout
   2. Login again with same credentials
   3. Try accessing /admin/super-admin
   ```

---

### Issue 2: Wrong Role Format

**Common Mistakes:**

❌ `Super Admin` (wrong - has space and capitals)  
❌ `superadmin` (wrong - no underscore)  
❌ `super-admin` (wrong - has hyphen)  
❌ `SUPER_ADMIN` (wrong - all caps)  
✅ `super_admin` (correct!)

**How to Fix:**
- Go to Firestore
- Edit the role field
- Type exactly: `super_admin`

---

### Issue 3: Profile Not Loading

**Symptoms:**
- Stuck on loading spinner
- Console shows: "Profile not loaded yet"

**Solution:**

1. **Check Firestore Rules:**
```javascript
// firestore.rules
match /users/{userId} {
  allow read: if request.auth != null && request.auth.uid == userId;
  allow write: if request.auth != null && request.auth.uid == userId;
}
```

2. **Check User Document Exists:**
   - Go to Firestore Console
   - Check if document exists in `users` collection
   - Document ID should match your Firebase Auth UID

3. **Create Missing Profile:**
```javascript
// If document doesn't exist, create it:
{
  "uid": "your-firebase-auth-uid",
  "email": "your-email@example.com",
  "role": "super_admin",
  "displayName": "Your Name",
  "createdAt": "2025-09-30T10:00:00Z"
}
```

---

### Issue 4: Browser Cache

**Symptoms:**
- Role updated in Firestore but still can't access
- Old role still showing

**Solution:**

1. **Clear Browser Cache:**
   - Press `Ctrl + Shift + Delete` (Windows)
   - Press `Cmd + Shift + Delete` (Mac)
   - Select "Cached images and files"
   - Click "Clear data"

2. **Try Incognito/Private Window:**
   - Open incognito/private window
   - Login again
   - Try accessing super admin

3. **Hard Refresh:**
   - Press `Ctrl + F5` (Windows)
   - Press `Cmd + Shift + R` (Mac)

---

### Issue 5: Session Not Updated

**Symptoms:**
- Updated role in Firestore
- Still shows old role

**Solution:**

1. **Logout Completely:**
```typescript
// Click logout in your app
// This clears all session data
```

2. **Login Again:**
```typescript
// Login with your credentials
// New session will load updated role
```

3. **Check Console Logs:**
```javascript
// Open browser console (F12)
// Look for:
"ProtectedRoute: Access granted. User role: super_admin"
```

---

## Step-by-Step: Make Yourself Super Admin

### Method 1: Firebase Console (Easiest)

```bash
1. Sign up in your app (if not already)
   → http://localhost:3000/auth/signup
   → Use any role (customer or creator)

2. Go to Firebase Console
   → https://console.firebase.google.com
   → Select your project

3. Open Firestore Database
   → Click "Firestore Database" in sidebar

4. Find users collection
   → Click "users"
   → Find document with your email

5. Edit role field
   → Click document
   → Click pencil icon on "role" field
   → Change to: super_admin
   → Click "Update"

6. Logout from your app
   → Click logout button

7. Login again
   → Use same email/password

8. Access Super Admin
   → Go to: http://localhost:3000/admin/super-admin
   → Should work now! ✅
```

---

## Verification Steps

### 1. Check Role Diagnostic Page

```bash
Go to: http://localhost:3000/admin/check-role
```

This page shows:
- ✅ Authentication status
- ✅ Current role
- ✅ Access permissions
- ✅ Step-by-step instructions

### 2. Check Browser Console

```javascript
// Open console (F12)
// Look for these messages:

"ProtectedRoute: Access granted. User role: super_admin"
// ✅ Good - Access granted

"ProtectedRoute: Access denied. User role: customer"
// ❌ Bad - Role not updated

"ProtectedRoute: User exists but profile not loaded yet"
// ⚠️ Loading - Wait or check Firestore
```

### 3. Check Firestore Directly

```bash
1. Firebase Console → Firestore Database
2. users collection → Your document
3. Verify:
   - role: "super_admin" ✅
   - email: matches your login ✅
   - uid: matches Firebase Auth ✅
```

---

## Still Not Working?

### Debug Checklist

- [ ] Role is exactly `super_admin` (lowercase, underscore)
- [ ] Logged out and back in after changing role
- [ ] Browser cache cleared
- [ ] User document exists in Firestore
- [ ] Firestore rules allow reading user document
- [ ] No console errors (check F12)
- [ ] Using correct email/password to login

### Get More Info

1. **Check Role Diagnostic:**
   ```
   http://localhost:3000/admin/check-role
   ```

2. **Check Console Logs:**
   ```javascript
   // Press F12
   // Look for "ProtectedRoute" messages
   ```

3. **Check Network Tab:**
   ```javascript
   // Press F12 → Network tab
   // Look for Firestore requests
   // Check if user document is being fetched
   ```

---

## Quick Test

```bash
# Test 1: Can you access admin dashboard?
http://localhost:3000/admin/dashboard

# If YES → Role is at least 'admin'
# If NO → Check if logged in

# Test 2: Can you access super admin?
http://localhost:3000/admin/super-admin

# If YES → Role is 'super_admin' ✅
# If NO → Role needs to be updated

# Test 3: Check your role
http://localhost:3000/admin/check-role

# Shows your current role and permissions
```

---

## Contact Support

If still having issues:

1. Check the role diagnostic page
2. Take screenshot of console logs (F12)
3. Take screenshot of Firestore user document
4. Note exact error message

---

## Summary

**Most Common Fix:**

1. ✅ Go to Firebase Console → Firestore
2. ✅ Find users → Your document
3. ✅ Change role to: `super_admin`
4. ✅ Logout and login again
5. ✅ Access: `/admin/super-admin`

**That's it! 🎉**

---

**Last Updated:** September 30, 2025

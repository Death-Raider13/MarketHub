# 🔧 Logout Button Troubleshooting Guide

## Issue: Account Button Not Opening / Logout Not Working

### Quick Fixes to Try (In Order):

---

## ✅ Fix 1: Hard Refresh the Page

**Problem:** Browser cache might have old JavaScript
**Solution:**
1. Press `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
2. Or clear browser cache completely
3. Try again

---

## ✅ Fix 2: Check Browser Console

**Steps:**
1. Press `F12` to open Developer Tools
2. Click on "Console" tab
3. Click the account button
4. Look for any errors (red text)

**Common Errors:**
- `Cannot read property 'role' of null` → User profile not loaded
- `logout is not a function` → Auth context issue
- `DropdownMenu is not defined` → Component import issue

---

## ✅ Fix 3: Verify User is Logged In

**Check in Console:**
```javascript
// Paste this in browser console
console.log("User:", localStorage.getItem('firebase:authUser'))
```

**Expected:** Should show user data
**If null:** You're not actually logged in

---

## ✅ Fix 4: Test Dropdown Manually

**Add this temporary test button:**

Open `/app/admin/dashboard/page.tsx` and add this at the top of the page:

```tsx
<div className="fixed top-20 right-4 z-50">
  <Button 
    onClick={async () => {
      const { logout } = await import("@/lib/firebase/auth-context")
      // This won't work directly, but will show if imports work
      console.log("Logout function:", logout)
    }}
  >
    Test Logout
  </Button>
</div>
```

---

## ✅ Fix 5: Check if Dropdown is Hidden Behind Something

**Problem:** Dropdown might be rendering but hidden behind other elements

**Solution - Add to your `globals.css`:**
```css
[data-radix-popper-content-wrapper] {
  z-index: 9999 !important;
}

.dropdown-menu-content {
  z-index: 9999 !important;
}
```

---

## ✅ Fix 6: Alternative Logout Button (Temporary)

Add a visible logout button to test if the function works:

**In `/app/admin/dashboard/page.tsx`**, add this inside the main content:

```tsx
"use client"

import { useAuth } from "@/lib/firebase/auth-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

// Inside your component:
const { logout } = useAuth()
const router = useRouter()

// Add this button somewhere visible:
<Button 
  onClick={async () => {
    try {
      console.log("Logging out...")
      await logout()
      console.log("Logout successful")
      router.push("/auth/login")
    } catch (error) {
      console.error("Logout error:", error)
      alert("Logout failed: " + error.message)
    }
  }}
  variant="destructive"
>
  Emergency Logout
</Button>
```

---

## ✅ Fix 7: Check Radix UI Dropdown Installation

**Verify the dropdown component exists:**

```bash
# Check if file exists
ls node_modules/@radix-ui/react-dropdown-menu
```

**If missing, reinstall:**
```bash
pnpm install @radix-ui/react-dropdown-menu
# or
npm install @radix-ui/react-dropdown-menu
```

---

## ✅ Fix 8: Force Logout via Console

**If nothing else works, manually logout:**

```javascript
// Paste in browser console
import('firebase/auth').then(({ getAuth, signOut }) => {
  const auth = getAuth()
  signOut(auth).then(() => {
    console.log('Logged out successfully')
    window.location.href = '/auth/login'
  })
})
```

**Or simpler:**
```javascript
localStorage.clear()
sessionStorage.clear()
window.location.href = '/auth/login'
```

---

## 🔍 Diagnostic Checklist

Run through this checklist:

### 1. Is the button visible?
- [ ] Yes, I can see the user icon button
- [ ] No, I don't see any user button

### 2. Does clicking do anything?
- [ ] Nothing happens at all
- [ ] Dropdown flashes briefly
- [ ] Dropdown opens but is empty
- [ ] Dropdown opens but logout doesn't work

### 3. Check browser console:
- [ ] No errors
- [ ] Has errors (copy them)

### 4. Check network tab:
- [ ] No requests when clicking
- [ ] Shows requests but they fail

### 5. Try on different browser:
- [ ] Same issue on Chrome
- [ ] Same issue on Firefox
- [ ] Works on different browser

---

## 🎯 Most Likely Causes & Solutions

### Cause 1: JavaScript Not Loading
**Symptoms:** Button does nothing, no console errors
**Solution:** Hard refresh (Ctrl+Shift+R)

### Cause 2: User Profile Not Loaded
**Symptoms:** Dropdown shows "User" with no role badge
**Solution:** Check Firestore - ensure user document exists

### Cause 3: Z-Index Issue
**Symptoms:** Clicking works but nothing appears
**Solution:** Add z-index fix from Fix #5 above

### Cause 4: Event Handler Not Attached
**Symptoms:** Button clickable but dropdown doesn't open
**Solution:** Check if Radix UI is properly installed

### Cause 5: Logout Function Fails
**Symptoms:** Dropdown opens, clicking logout does nothing
**Solution:** Check Firebase auth is initialized

---

## 🚀 What I Fixed in the Code

### Before:
```tsx
<DropdownMenuItem onClick={() => logout()} className="text-destructive">
  Logout
</DropdownMenuItem>
```

### After:
```tsx
<DropdownMenuItem 
  onClick={async () => {
    try {
      await logout()
      router.push("/auth/login")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }} 
  className="text-destructive cursor-pointer"
>
  Logout
</DropdownMenuItem>
```

**Changes:**
1. ✅ Made onClick async to properly handle logout
2. ✅ Added try-catch for error handling
3. ✅ Added redirect after logout
4. ✅ Added `cursor-pointer` class for visual feedback
5. ✅ Added console.error for debugging
6. ✅ Added z-50 to dropdown content

---

## 🧪 Step-by-Step Testing

### Test 1: Check if Dropdown Opens
1. Login to admin dashboard
2. Look for user icon (person icon) in top right
3. Click it
4. **Expected:** Dropdown menu should appear
5. **If not:** See Fix #5 (z-index issue)

### Test 2: Check Dropdown Content
1. Open dropdown
2. **Expected:** Should see:
   - Your name
   - Your email
   - Role badge (admin/vendor/customer)
   - Menu items for your role
   - Logout button at bottom
3. **If missing:** User profile not loaded from Firestore

### Test 3: Check Logout Function
1. Open dropdown
2. Click "Logout"
3. **Expected:** 
   - Should redirect to `/auth/login`
   - Should clear user session
4. **If not:** Check browser console for errors

---

## 📞 Still Not Working?

### Option 1: Use Keyboard Navigation
1. Click the user icon button
2. Press `Tab` key
3. Press `Enter` on Logout option

### Option 2: Add Temporary Logout Button
Add this to your admin dashboard:

```tsx
<div className="fixed bottom-4 right-4 z-50">
  <Button 
    onClick={async () => {
      await logout()
      window.location.href = "/auth/login"
    }}
    variant="destructive"
    size="lg"
  >
    LOGOUT
  </Button>
</div>
```

### Option 3: Manual Logout
1. Open browser DevTools (F12)
2. Go to Application tab
3. Clear all storage
4. Refresh page

---

## ✅ Verification After Fix

After applying fixes, verify:
- [ ] User icon button is visible
- [ ] Clicking opens dropdown menu
- [ ] Dropdown shows user info correctly
- [ ] Role-specific menu items appear
- [ ] Logout button is visible
- [ ] Clicking logout redirects to login page
- [ ] User is actually logged out (can't access admin pages)

---

## 🎓 Understanding the Issue

The dropdown menu uses Radix UI's `DropdownMenu` component which:
1. Renders content in a portal (outside normal DOM flow)
2. Requires proper z-index to appear above other elements
3. Needs event handlers to be properly attached
4. Must wait for user profile to load before showing role-specific items

Common issues:
- **Z-index conflicts** → Dropdown renders but is hidden
- **Event handler issues** → Button doesn't respond
- **Profile loading** → Dropdown shows but is empty
- **Firebase errors** → Logout fails silently

---

**Try the fixes in order. Most issues are resolved by Fix #1 (hard refresh) or Fix #5 (z-index).** 🎯

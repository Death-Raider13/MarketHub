# 🎯 Advertiser Profile System - CORRECT IMPLEMENTATION

## ✅ **How It Works Now:**

### **Separate Advertiser Account**
- Users must create a **separate advertiser profile** to access the advertising system
- This is **independent** of their customer or vendor account
- They can use the **same email** for convenience
- **No access to dashboard** without completing advertiser signup

---

## 🔄 **Complete Flow:**

### **Scenario 1: New User (No Account)**
```
1. Visits /advertise
2. Clicks "Get Started"
3. Redirected to /advertiser/signup
4. Sees "You need to be logged in"
5. Clicks "Login" or "Sign Up"
6. Creates account (email + password)
7. Returns to /advertiser/signup
8. Fills advertiser profile form:
   • Business Name
   • Business Email (can use same email)
   • Phone
   • Business Type
   • Website (optional)
9. Agrees to terms
10. Clicks "Create Advertiser Account"
11. Advertiser profile created in Firestore
12. Redirected to /advertiser/dashboard
13. Can now create campaigns!
```

### **Scenario 2: Existing Customer (Has Account)**
```
1. Already logged in as customer
2. Clicks "Advertise" in header
3. Redirected to /advertiser/signup
4. Sees "Logged in as: customer@email.com"
5. Fills advertiser profile form
6. Can use same email or different business email
7. Creates advertiser profile
8. Now has BOTH customer AND advertiser profiles
9. Can switch between shopping and advertising
```

### **Scenario 3: Existing Vendor (Has Account)**
```
1. Already logged in as vendor
2. Wants to advertise products on other stores
3. Clicks "Advertise" in header
4. Redirected to /advertiser/signup
5. Sees "Logged in as: vendor@email.com"
6. Fills advertiser profile form
7. Can use same email
8. Creates advertiser profile
9. Now has BOTH vendor AND advertiser profiles
10. Can sell products AND advertise them
```

### **Scenario 4: Returning Advertiser**
```
1. Already has advertiser profile
2. Clicks "Advertise" button
3. System checks: User logged in? ✅
4. System checks: Has advertiser profile? ✅
5. Directly taken to /advertiser/dashboard
6. Sees their existing campaigns
7. No signup needed!
```

### **Scenario 5: User Without Advertiser Profile Tries Direct Access**
```
1. User logged in (customer or vendor)
2. Tries to access /advertiser/dashboard directly
3. System checks: User logged in? ✅
4. System checks: Has advertiser profile? ❌
5. Redirected to /advertiser/signup
6. Must complete advertiser signup first
7. Then can access dashboard
```

---

## 🗄️ **Database Structure:**

### **Firestore Collections:**

```
users/
├── {userId}
    ├── email: "user@email.com"
    ├── role: "customer" | "vendor"
    └── ... (regular user data)

advertisers/  ← NEW COLLECTION
├── {userId}  ← Same userId as users collection
    ├── uid: "userId"
    ├── email: "user@email.com"
    ├── businessName: "My Business"
    ├── businessEmail: "business@email.com"  ← Can be same or different
    ├── phone: "+234..."
    ├── website: "https://..."
    ├── businessType: "E-commerce"
    ├── accountStatus: "active"
    ├── accountBalance: 0
    ├── totalSpent: 0
    ├── campaigns: []
    ├── createdAt: timestamp
    └── updatedAt: timestamp
```

**Key Points:**
- ✅ Separate `advertisers` collection
- ✅ Uses same `userId` as key
- ✅ Can have same or different email
- ✅ Independent of user role (customer/vendor)

---

## 🎨 **Advertiser Signup Page:**

### **Features:**
```
✅ Checks if user is logged in
✅ Shows current user email
✅ Allows same or different business email
✅ Collects business information
✅ Checks for existing advertiser profile
✅ Creates profile in Firestore
✅ Redirects to dashboard after creation
```

### **Form Fields:**
```
Required:
- Business Name
- Business Email (pre-filled with user email, can change)
- Phone Number
- Business Type

Optional:
- Website

Checkbox:
- Agree to Terms & Conditions
```

---

## 🛡️ **Dashboard Protection:**

### **Multi-Level Check:**
```typescript
// app/advertiser/dashboard/page.tsx

useEffect(() => {
  if (!loading) {
    if (!user) {
      // Not logged in → redirect to login
      router.push("/auth/login?returnUrl=/advertiser/dashboard")
    } else {
      // Logged in → check advertiser profile
      checkAdvertiserProfile()
    }
  }
}, [user, loading, router])

async function checkAdvertiserProfile() {
  const advertiserRef = doc(db, "advertisers", user.uid)
  const advertiserSnap = await getDoc(advertiserRef)

  if (advertiserSnap.exists()) {
    // Has profile → show dashboard
    setHasAdvertiserProfile(true)
  } else {
    // No profile → redirect to signup
    router.push("/advertiser/signup")
  }
}
```

**Protection Levels:**
1. ✅ Check if user is logged in
2. ✅ Check if user has advertiser profile
3. ✅ Only show dashboard if both checks pass

---

## 📊 **User States:**

### **State 1: Not Logged In**
```
Status: No authentication
Dashboard Access: ❌ Denied
Action: Redirect to /auth/login
Then: Return to /advertiser/signup
```

### **State 2: Logged In, No Advertiser Profile**
```
Status: Authenticated, but no advertiser account
Dashboard Access: ❌ Denied
Action: Redirect to /advertiser/signup
Then: Create advertiser profile
```

### **State 3: Logged In, Has Advertiser Profile**
```
Status: Authenticated + Advertiser account exists
Dashboard Access: ✅ Granted
Action: Show dashboard
Data: User's real campaigns
```

---

## 🎯 **Key Benefits:**

### **1. Separate Profiles**
- ✅ Customer can become advertiser
- ✅ Vendor can become advertiser
- ✅ Each profile is independent
- ✅ Different permissions and features

### **2. Same Email Convenience**
- ✅ Can use existing email
- ✅ No need for new account
- ✅ Single login for all profiles
- ✅ Easy to manage

### **3. Proper Separation**
- ✅ Advertiser data separate from user data
- ✅ Clear business information
- ✅ Dedicated billing
- ✅ Campaign management

### **4. Security**
- ✅ Must be logged in
- ✅ Must complete advertiser signup
- ✅ No mock data without profile
- ✅ Protected routes

---

## 📁 **Files Created:**

```
✅ app/advertiser/signup/page.tsx
   - Advertiser profile creation form
   - Checks authentication
   - Creates advertiser document in Firestore
   - Handles existing profiles

✅ app/advertiser/dashboard/page.tsx (Updated)
   - Checks for advertiser profile
   - Redirects if no profile
   - Only shows dashboard with profile

✅ app/advertise/page.tsx (Updated)
   - Redirects to /advertiser/signup
   - Simplified flow
```

---

## 🔄 **Complete User Journey Map:**

```
┌─────────────────────────────────────────────────────┐
│              ADVERTISER ACCOUNT CREATION             │
└─────────────────────────────────────────────────────┘

New User:
/advertise → /advertiser/signup → "Login Required"
  → /auth/signup → Create Account → /advertiser/signup
  → Fill Form → Create Advertiser Profile → Dashboard

Existing Customer:
/advertise → /advertiser/signup → Already Logged In
  → Fill Form → Create Advertiser Profile → Dashboard
  → Now has: Customer Profile + Advertiser Profile

Existing Vendor:
/advertise → /advertiser/signup → Already Logged In
  → Fill Form → Create Advertiser Profile → Dashboard
  → Now has: Vendor Profile + Advertiser Profile

Returning Advertiser:
/advertise → Dashboard Check → Has Profile? Yes
  → Direct to Dashboard → Manage Campaigns

User Tries Direct Access:
/advertiser/dashboard → Check Profile → No Profile
  → /advertiser/signup → Create Profile → Dashboard
```

---

## ✅ **Validation:**

### **Before Dashboard Access:**
```
1. ✅ User must be logged in
2. ✅ User must have advertiser profile
3. ✅ Profile must be in Firestore
4. ✅ Profile must be active
```

### **Advertiser Signup:**
```
1. ✅ User must be logged in (or redirected to login)
2. ✅ Business name required
3. ✅ Business email required (can be same as user email)
4. ✅ Phone required
5. ✅ Business type required
6. ✅ Must agree to terms
7. ✅ Check for existing profile (no duplicates)
```

---

## 🎉 **Summary:**

### **What This Achieves:**

1. **Separate Advertiser Identity**
   - Independent from customer/vendor accounts
   - Dedicated business information
   - Professional advertising profile

2. **Flexible Email Usage**
   - Can use same email as main account
   - Or use different business email
   - Easy for vendors and customers

3. **Proper Access Control**
   - Must complete advertiser signup
   - No dashboard access without profile
   - No mock data shown

4. **Multiple Roles Support**
   - User can be: Customer + Advertiser
   - User can be: Vendor + Advertiser
   - User can be: Customer + Vendor + Advertiser
   - All with same login!

5. **Professional System**
   - Dedicated signup flow
   - Business information collection
   - Terms agreement
   - Proper onboarding

---

## 🚀 **Now It Works Exactly As You Wanted!**

```
✅ Separate advertiser account required
✅ Can use same email for convenience
✅ Must complete signup before dashboard access
✅ Works for customers, vendors, and new users
✅ No mock data without proper signup
✅ Professional onboarding experience
```

---

*Advertiser Profile System*
*Date: January 15, 2025*
*Status: Complete* ✅

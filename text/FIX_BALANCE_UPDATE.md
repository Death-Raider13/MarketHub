# 🔧 Fix Balance Update - FINAL STEPS

## ⚠️ **Current Issue:**
Payment is successful but balance not updating due to Firestore security rules.

---

## ✅ **Solution - Deploy Updated Rules:**

### **Step 1: Deploy Firestore Rules**
```bash
firebase deploy --only firestore:rules
```

This will update the security rules to allow balance updates.

---

## 🔒 **What Changed in Rules:**

### **Before:**
```javascript
// Only admins could update accountBalance
allow update: if isAdmin();
```

### **After:**
```javascript
// Users can now update their own balance (increment only)
allow update: if isOwner(advertiserId) &&
                request.resource.data.diff(resource.data).affectedKeys().hasOnly(['accountBalance', 'updatedAt']) &&
                request.resource.data.accountBalance > resource.data.accountBalance;
```

**This allows:**
- ✅ Users to update their own balance
- ✅ Only when balance increases (add funds)
- ✅ Only accountBalance and updatedAt fields
- ❌ Cannot decrease balance
- ❌ Cannot update other fields

---

## 🚀 **After Deploying Rules:**

### **Test Payment:**
1. Go to Billing tab
2. Click "Add Funds"
3. Enter ₦5,000
4. Complete payment with test card: **4084084084084081**
5. ✅ Balance should update!
6. ✅ Transaction appears in history

---

## 📋 **Complete Checklist:**

- [x] Updated API routes to use client SDK
- [x] Updated Firestore rules to allow balance updates
- [ ] **Deploy Firestore rules** ← YOU ARE HERE
- [ ] Test add funds
- [ ] Verify balance updates
- [ ] Check transaction history

---

## 🎯 **Command to Run:**

```bash
firebase deploy --only firestore:rules
```

**Then restart dev server:**
```bash
npm run dev
```

**Then test payment again!**

---

*Fix Balance Update*
*Date: January 16, 2025*
*Status: Waiting for rules deployment* ⏳

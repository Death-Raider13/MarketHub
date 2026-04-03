# 🔄 creator Data Consistency Plan

## 🎯 **Problem:**
creator information is duplicated across multiple places:
- User Profile (`users` collection)
- Store Customization (`storeCustomization` collection)
- Store Settings (`storeSettings` collection)

This causes:
- ❌ Data inconsistency
- ❌ Confusion for creators
- ❌ Duplicate data entry
- ❌ Sync issues

---

## ✅ **Solution - Single Source of Truth:**

### **Data Hierarchy:**

```
users/{creatorId}
├── storeName          ← PRIMARY SOURCE (set during signup)
├── email              ← PRIMARY SOURCE
├── phone              ← PRIMARY SOURCE
└── ...

storeCustomization/{creatorId}
├── theme              ← Visual design only
├── branding
│   ├── logo           ← Visual assets
│   ├── banner         ← Visual assets
│   └── tagline        ← Marketing copy
├── layout             ← Visual layout
└── ...
(NO duplicate contact info)

storeSettings/{creatorId}
├── businessInfo       ← Business registration
├── paymentSettings    ← Bank details
├── shippingSettings   ← Shipping config
└── policies           ← Legal policies
(NO duplicate contact info)
```

---

## 🔧 **Implementation Plan:**

### **Phase 1: Remove Duplicates**
1. ✅ Remove `storeName` from Store Customization form
2. ✅ Remove `email`, `phone` from Store Customization
3. ✅ Remove `storeName`, `email`, `phone` from Store Settings
4. ✅ Show these as read-only from user profile

### **Phase 2: Unified Display**
1. ✅ Load user profile data in all pages
2. ✅ Display storeName from user profile
3. ✅ Display email/phone from user profile
4. ✅ Add "Edit Profile" link to change these

### **Phase 3: Update Logic**
1. ✅ Create `/api/creator/profile` to update user profile
2. ✅ When storeName changes → update in `users` collection
3. ✅ All pages read from `users` collection
4. ✅ Automatic consistency

---

## 📝 **What Each Page Should Have:**

### **User Profile (Primary):**
- ✅ Store Name
- ✅ Email
- ✅ Phone
- ✅ Address

### **Store Customization (Visual):**
- ✅ Theme colors
- ✅ Logo (image)
- ✅ Banner (image)
- ✅ Tagline (marketing)
- ✅ Layout preferences
- ❌ NO contact info (read from profile)

### **Store Settings (Business):**
- ✅ Business registration (CAC, TIN)
- ✅ Bank account details
- ✅ Shipping rates
- ✅ Policies (return, shipping, privacy)
- ❌ NO contact info (read from profile)

---

## 🎨 **UI Changes:**

### **Store Customization Page:**
```
┌─────────────────────────────────────┐
│ Store Information (Read-Only)      │
│ ─────────────────────────────────  │
│ Store Name: TechStore Pro          │
│ Email: creator@example.com          │
│ Phone: +234 803 123 4567           │
│ [Edit Profile] ← Link to profile   │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Visual Branding (Editable)         │
│ ─────────────────────────────────  │
│ Logo: [Upload]                     │
│ Banner: [Upload]                   │
│ Tagline: Your one-stop shop...     │
│ Theme Colors: [Color Picker]       │
└─────────────────────────────────────┘
```

### **Store Settings Page:**
```
┌─────────────────────────────────────┐
│ Contact Information (Read-Only)    │
│ ─────────────────────────────────  │
│ Store Name: TechStore Pro          │
│ Email: creator@example.com          │
│ Phone: +234 803 123 4567           │
│ [Edit Profile] ← Link to profile   │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Business Information (Editable)    │
│ ─────────────────────────────────  │
│ Business Name: TechStore Ltd       │
│ CAC Number: RC-1234567             │
│ TIN: 12345678-0001                 │
└─────────────────────────────────────┘
```

---

## 🚀 **Action Items:**

1. ✅ Create creator profile edit page
2. ✅ Update Store Customization to remove duplicates
3. ✅ Update Store Settings to remove duplicates
4. ✅ Add read-only display of profile data
5. ✅ Test data consistency

---

**This ensures ONE place to edit core info, and it syncs everywhere automatically!** 🎯

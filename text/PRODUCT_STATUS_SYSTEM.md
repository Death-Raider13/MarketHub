# 📊 Product Status System - Complete Guide

## Overview
This document explains the complete product status workflow, from creation to approval to vendor management.

---

## 🔄 **Product Status Flow**

### **Status Types:**

1. **🟠 Pending** - Awaiting admin approval
2. **🟢 Active** - Approved and visible to customers
3. **⚪ Inactive** - Vendor deactivated (hidden from customers)
4. **🔴 Rejected** - Admin rejected (needs revision)

---

## 📋 **Complete Workflow**

### **Step 1: Vendor Creates Product**
```
Vendor adds new product
↓
Status: PENDING 🟠
↓
Sent to admin for review
```

**What vendor sees:**
- Badge: "Pending" (orange)
- Text: "Awaiting approval"
- Cannot toggle status
- Can edit details
- Can delete

---

### **Step 2: Admin Reviews Product**

**Admin has 3 options:**

#### **Option A: Approve ✅**
```
Admin approves product
↓
Status: ACTIVE 🟢
↓
Product visible to customers
↓
Vendor can now toggle active/inactive
```

#### **Option B: Reject ❌**
```
Admin rejects product
↓
Status: REJECTED 🔴
↓
Product hidden from customers
↓
Vendor sees rejection message
```

**What vendor sees:**
- Badge: "Rejected" (red)
- Text: "Admin rejected"
- Cannot toggle status
- Can edit and resubmit
- Can delete

#### **Option C: Request Changes 🔄**
```
Admin requests changes
↓
Status: PENDING 🟠
↓
Vendor edits product
↓
Resubmits for review
```

---

### **Step 3: Vendor Management**

#### **Active Products (🟢):**
Vendor can:
- ✅ Toggle to Inactive
- ✅ Edit details
- ✅ Update stock
- ✅ View analytics
- ✅ Duplicate
- ✅ Delete

#### **Inactive Products (⚪):**
Vendor can:
- ✅ Toggle to Active
- ✅ Edit details
- ✅ Update stock
- ✅ View analytics
- ✅ Duplicate
- ✅ Delete

#### **Pending Products (🟠):**
Vendor can:
- ❌ Cannot toggle status
- ✅ Edit details (resubmits for review)
- ✅ Update stock
- ✅ Delete

#### **Rejected Products (🔴):**
Vendor can:
- ❌ Cannot toggle status
- ✅ Edit details (resubmits for review)
- ✅ Delete

---

## 🎨 **Status Visual Guide**

### **Status Badges:**

```
🟢 Active
   [✓ active]
   Green badge
   Clickable (toggle to inactive)
   Product visible to customers

🟠 Pending
   [⏰ pending]
   Orange badge
   Not clickable
   "Awaiting approval" text below
   Product hidden from customers

⚪ Inactive
   [✗ inactive]
   Gray badge
   Clickable (toggle to active)
   Product hidden from customers

🔴 Rejected
   [✗ rejected]
   Red badge
   Not clickable
   "Admin rejected" text below
   Product hidden from customers
```

---

## 🔧 **Action Buttons Functionality**

### **All Actions Working:**

1. **👁️ View Product**
   - Links to: `/products/${product.id}`
   - Shows public product page
   - Works for all statuses

2. **✏️ Edit Details**
   - Links to: `/vendor/products/${product.id}/edit`
   - Edit product information
   - If pending/rejected, resubmits for approval
   - Works for all statuses

3. **📦 Update Stock**
   - Opens inline stock editor
   - Quick stock quantity update
   - Works for all statuses

4. **📊 View Analytics**
   - Links to: `/vendor/analytics?product=${product.id}`
   - Shows product performance
   - Sales, views, conversion rate
   - Works for all statuses

5. **📁 Activate/Deactivate**
   - Toggles between active ↔ inactive
   - Only visible for active/inactive products
   - Hidden for pending/rejected

6. **📋 Duplicate Product**
   - Creates copy of product
   - New product status: PENDING
   - Name: "Product Name (Copy)"
   - Needs admin approval
   - Works for all statuses

7. **🗑️ Delete Product**
   - Two-step confirmation
   - First click: "Confirm Delete?"
   - Second click: Deletes permanently
   - Cancel option available
   - Works for all statuses

---

## 💡 **Use Cases**

### **Scenario 1: New Product**
```
1. Vendor creates "Wireless Mouse"
2. Status: PENDING 🟠
3. Admin reviews and approves
4. Status: ACTIVE 🟢
5. Product appears in store
6. Customers can purchase
```

### **Scenario 2: Out of Stock**
```
1. Product sells out
2. Vendor clicks status badge
3. Status: INACTIVE ⚪
4. Product hidden from customers
5. Vendor restocks
6. Vendor clicks status badge
7. Status: ACTIVE 🟢
8. Product visible again
```

### **Scenario 3: Rejected Product**
```
1. Vendor submits "Fake Rolex"
2. Status: PENDING 🟠
3. Admin rejects (prohibited item)
4. Status: REJECTED 🔴
5. Vendor sees rejection
6. Vendor can:
   - Edit and resubmit
   - Or delete product
```

### **Scenario 4: Seasonal Product**
```
1. "Christmas Decorations" active in December
2. Status: ACTIVE 🟢
3. January arrives
4. Vendor clicks status → INACTIVE ⚪
5. Product hidden until next December
6. December arrives
7. Vendor clicks status → ACTIVE 🟢
8. Product visible again
```

### **Scenario 5: Duplicate Product**
```
1. Vendor has "Red T-Shirt" (active)
2. Clicks "Duplicate Product"
3. Creates "Red T-Shirt (Copy)"
4. New product status: PENDING 🟠
5. Vendor edits to "Blue T-Shirt"
6. Admin approves
7. Status: ACTIVE 🟢
8. Now has both colors
```

---

## 🚦 **Status Rules**

### **Vendor Permissions:**

| Action | Pending | Active | Inactive | Rejected |
|--------|---------|--------|----------|----------|
| **View** | ✅ | ✅ | ✅ | ✅ |
| **Edit** | ✅ | ✅ | ✅ | ✅ |
| **Update Stock** | ✅ | ✅ | ✅ | ✅ |
| **Toggle Status** | ❌ | ✅ | ✅ | ❌ |
| **Duplicate** | ✅ | ✅ | ✅ | ✅ |
| **Delete** | ✅ | ✅ | ✅ | ✅ |
| **View Analytics** | ✅ | ✅ | ✅ | ✅ |

### **Admin Permissions:**

| Action | Pending | Active | Inactive | Rejected |
|--------|---------|--------|----------|----------|
| **Approve** | ✅ | ❌ | ❌ | ✅ |
| **Reject** | ✅ | ✅ | ✅ | ❌ |
| **Request Changes** | ✅ | ✅ | ✅ | ✅ |
| **Delete** | ✅ | ✅ | ✅ | ✅ |
| **Feature** | ❌ | ✅ | ❌ | ❌ |

---

## 📧 **Email Notifications**

### **To Vendor:**

**Product Approved:**
```
Subject: Your product has been approved! 🎉

Hi [Vendor Name],

Good news! Your product "[Product Name]" has been approved 
and is now live on FEROMARKETHUB.

Status: ACTIVE
Product Link: [link]

Start promoting your product to customers!

Thanks,
FEROMARKETHUB Team
```

**Product Rejected:**
```
Subject: Product submission needs revision

Hi [Vendor Name],

Your product "[Product Name]" requires some changes before 
it can be approved.

Reason: [Admin's reason]

Please review our product guidelines and resubmit.

Edit Product: [link]

Thanks,
FEROMARKETHUB Team
```

---

## 🎯 **Best Practices**

### **For Vendors:**

1. **New Products:**
   - Submit complete information
   - Use high-quality images
   - Accurate descriptions
   - Wait for approval before promoting

2. **Out of Stock:**
   - Mark as INACTIVE immediately
   - Update stock when available
   - Reactivate when ready

3. **Seasonal Items:**
   - Use INACTIVE for off-season
   - Keep product in system
   - Reactivate when season returns

4. **Rejected Products:**
   - Read rejection reason
   - Fix issues
   - Resubmit for approval

### **For Admins:**

1. **Review Quickly:**
   - Check within 24-48 hours
   - Clear rejection reasons
   - Helpful feedback

2. **Approval Criteria:**
   - Complete information
   - Quality images
   - Accurate descriptions
   - Complies with policies

3. **Rejection Reasons:**
   - Be specific
   - Cite policy violations
   - Suggest improvements

---

## 🔒 **Security & Validation**

### **Status Change Rules:**

```typescript
// Vendors can only toggle active ↔ inactive
if (userRole === "vendor") {
  if (currentStatus === "active") {
    allowedNewStatus = "inactive"
  } else if (currentStatus === "inactive") {
    allowedNewStatus = "active"
  } else {
    // Cannot change pending or rejected
    return error("Cannot change status")
  }
}

// Admins can change any status
if (userRole === "admin") {
  allowedStatuses = ["pending", "active", "inactive", "rejected"]
}
```

---

## 📊 **Analytics & Reporting**

### **Status Metrics:**

**Vendor Dashboard:**
- Total products
- Active products
- Pending approval
- Rejected products
- Inactive products

**Admin Dashboard:**
- Products pending review
- Approval rate
- Average review time
- Rejection reasons
- Top vendors

---

## ✅ **Summary**

### **Status System Features:**

1. ✅ **4 distinct statuses** (pending, active, inactive, rejected)
2. ✅ **Color-coded badges** for easy identification
3. ✅ **Smart status toggling** (vendors can only toggle active/inactive)
4. ✅ **Admin approval workflow** required for new products
5. ✅ **All action buttons working** (view, edit, stock, analytics, duplicate, delete)
6. ✅ **Two-step delete confirmation** prevents accidents
7. ✅ **Duplicate creates pending** products (requires approval)
8. ✅ **Clear visual feedback** with icons and helper text
9. ✅ **Proper permissions** (vendors vs admins)
10. ✅ **Email notifications** for status changes

---

**Your product status system is now complete and professional!** 🚀

Vendors have full control over their inventory while admins maintain quality control through the approval process.

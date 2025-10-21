# Order Status Workflow Documentation

## Overview
This document outlines the complete order status workflow for MarketHub, including permissions and status transitions for customers, vendors, and the system.

---

## Order Status Types

| Status | Description | Who Can Set |
|--------|-------------|-------------|
| `pending` | Order created, awaiting payment | System (on order creation) |
| `paid` | Payment confirmed via Paystack | System (after payment verification) |
| `processing` | Vendor is preparing the order | Vendor |
| `shipped` | Order has been shipped (physical only) | Vendor |
| `delivered` | Order completed/delivered | Vendor |
| `cancelled` | Order cancelled | Customer or System |
| `failed` | Payment failed | System |

---

## Status Transitions by Product Type

### Physical Products
```
pending → paid → processing → shipped → delivered
   ↓
cancelled (customer can cancel if pending or paid)
```

### Digital Products
```
pending → paid → delivered (instant)
   ↓
cancelled (customer can cancel if pending)
```

### Services
```
pending → paid → processing → delivered
   ↓
cancelled (customer can cancel if pending or paid)
```

---

## Permissions & Rules

### Customer Permissions

#### Can Cancel Order:
- ✅ Status is `pending` (not yet paid)
- ✅ Status is `paid` (paid but not shipped/processed yet)
- ❌ Status is `processing`, `shipped`, or `delivered`
- ❌ Status is already `cancelled`

#### Cannot:
- Change status to `processing`, `shipped`, or `delivered`
- Modify order items or total
- Cancel after vendor has started processing

### Vendor Permissions

#### Can Update Status:
- ✅ From `paid` → `processing` (all product types)
- ✅ From `processing` → `shipped` (physical products only)
- ✅ From `processing` → `delivered` (services)
- ✅ From `paid` → `delivered` (digital products - instant)
- ✅ From `shipped` → `delivered` (physical products)

#### Cannot:
- ❌ Modify cancelled orders
- ❌ Change status from `pending` (must wait for payment)
- ❌ Change order total or items
- ❌ Cancel customer orders
- ❌ Revert status backwards (e.g., delivered → processing)

### System/Admin Permissions

#### Automatic Status Changes:
- `pending` → `paid` (after Paystack payment verification)
- `pending` → `failed` (if payment fails)
- `pending` → `cancelled` (if payment timeout)

#### Admin Can:
- ✅ Update any order status
- ✅ Modify order details
- ✅ Delete orders
- ✅ Override any restriction

---

## Implementation Details

### Customer Side (`/app/account/page.tsx`)

```typescript
// Cancel Order Function
const handleCancelOrder = async (orderId: string, currentStatus: string) => {
  // Only allow cancellation for pending or paid orders
  if (currentStatus !== 'pending' && currentStatus !== 'paid') {
    toast.error('This order cannot be cancelled as it has already been processed')
    return
  }
  
  // Update order status to cancelled
  await updateDoc(orderRef, {
    status: 'cancelled',
    cancelledAt: new Date(),
    cancelledBy: 'customer',
    updatedAt: new Date()
  })
}
```

### Vendor Side (`/app/vendor/orders/page.tsx`)

Vendors should only be able to update status based on:
1. Current order status
2. Product type (physical/digital/service)
3. Order not being cancelled

**Recommended Status Update UI:**
- Show dropdown with only valid next statuses
- Disable status changes for cancelled orders
- Show product type indicator

### Firestore Security Rules

```javascript
// Customers can cancel their own orders (only if pending or paid)
allow update: if isSignedIn() && 
                (resource.data.customerId == request.auth.uid || resource.data.userId == request.auth.uid) &&
                resource.data.status in ['pending', 'paid'] &&
                request.resource.data.status == 'cancelled';

// Vendors can update order status (but NOT cancelled orders)
allow update: if isVerifiedVendor() && 
                request.auth.uid in resource.data.vendorIds &&
                resource.data.status != 'cancelled' &&
                resource.data.status in ['paid', 'processing', 'shipped'] &&
                request.resource.data.status in ['processing', 'shipped', 'delivered'];
```

---

## Order Data Structure

```typescript
interface Order {
  id: string
  userId: string // or customerId
  vendorIds: string[] // Array of vendor IDs
  items: OrderItem[]
  total: number
  status: OrderStatus
  paymentStatus: 'pending' | 'paid' | 'failed'
  paymentMethod: 'paystack' | 'wallet'
  
  // Timestamps
  createdAt: Timestamp
  updatedAt: Timestamp
  paidAt?: Timestamp
  shippedAt?: Timestamp
  deliveredAt?: Timestamp
  cancelledAt?: Timestamp
  
  // Cancellation info
  cancelledBy?: 'customer' | 'vendor' | 'admin' | 'system'
  cancellationReason?: string
  
  // Shipping info (physical products)
  shippingAddress?: Address
  trackingNumber?: string
  carrier?: string
}

interface OrderItem {
  productId: string
  productName: string
  productPrice: number
  productType: 'physical' | 'digital' | 'service'
  quantity: number
  image?: string
  vendorId: string
}
```

---

## Best Practices

### For Customers:
1. Cancel orders as soon as possible if needed
2. Once order is processing/shipped, contact vendor for cancellation
3. Check order status regularly

### For Vendors:
1. Update order status promptly
2. Don't modify cancelled orders
3. Add tracking numbers for physical products
4. Deliver digital products immediately after payment

### For Admins:
1. Monitor cancelled orders for refund processing
2. Handle disputes between customers and vendors
3. Override status only when necessary

---

## Future Enhancements

1. **Refund System**: Automatic refunds for cancelled paid orders
2. **Partial Cancellation**: Allow cancelling specific items in multi-vendor orders
3. **Return/Exchange**: Add return and exchange workflows
4. **Auto-Delivery**: Automatic delivery for digital products after payment
5. **Status Notifications**: Email/SMS notifications for status changes
6. **Vendor Response Time**: Track how quickly vendors process orders
7. **Cancellation Reasons**: Require reason when cancelling orders

---

## Testing Checklist

- [ ] Customer can cancel pending order
- [ ] Customer can cancel paid order (before processing)
- [ ] Customer cannot cancel processing order
- [ ] Customer cannot cancel shipped order
- [ ] Customer cannot cancel delivered order
- [ ] Vendor cannot modify cancelled order
- [ ] Vendor can update paid → processing
- [ ] Vendor can update processing → shipped (physical)
- [ ] Vendor can update shipped → delivered
- [ ] Vendor can update paid → delivered (digital)
- [ ] System updates pending → paid after payment
- [ ] Firestore rules enforce all restrictions

---

**Last Updated**: October 20, 2025
**Version**: 1.0

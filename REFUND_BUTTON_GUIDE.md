# 🔄 Refund Button Location Guide

## Where to Find the Refund Button

### ✅ **Correct Page**: `/orders`
- URL: `http://localhost:3001/orders`
- This is the main orders page with detailed order management

### ❌ **Wrong Page**: `/my-orders` 
- URL: `http://localhost:3001/my-orders`
- This page does NOT have refund buttons (only review functionality)

## Refund Button Conditions

The "Request Refund" button appears ONLY when ALL these conditions are met:

### 1. **Order Status** = `'delivered'`
- Order must be marked as delivered
- Shows green "Delivered" badge

### 2. **Payment Status** = `'paid'`
- Payment must be completed successfully
- Not pending, failed, or already refunded

### 3. **Time Window** = Within 7 days
- Order must be created within the last 7 days
- After 7 days, you'll see: "The 7-day return window for this order has expired"

### 4. **Page Location** = `/orders`
- Must be on the orders page, not my-orders page

## Visual Identification

### Button Appearance:
```
[🔄 Request Refund]
```
- Icon: Rotate counter-clockwise (RotateCcw)
- Text: "Request Refund"
- Style: Outline button
- Size: Small (sm)

### Button Location:
- In the "Actions" section at the bottom of each order card
- Appears alongside other action buttons like:
  - "View Details"
  - "Reorder" 
  - "Downloads"
  - "Cancel Order" (for pending orders)

## Testing the Refund System

### To Test Refund Functionality:

1. **Create a Test Order**:
   - Place an order for a physical product
   - Complete payment

2. **Simulate Delivery**:
   - Update order status to 'delivered' in admin panel
   - Or wait for actual delivery

3. **Check Refund Button**:
   - Go to `/orders` page
   - Look for the delivered order
   - Refund button should appear in actions section

### Sample Order Card with Refund Button:
```
┌─────────────────────────────────────────┐
│ Order #ABC12345                         │
│ Placed 2 days ago                       │
│ Status: [Delivered] ₦15,000            │
│                                         │
│ Items: Product Name x1                  │
│ Shipping: Lagos, Nigeria                │
│ Payment: Card • paid                    │
│                                         │
│ Actions:                                │
│ [👁 View Details] [🔄 Reorder]          │
│ [📥 Downloads] [🔄 Request Refund]      │
└─────────────────────────────────────────┘
```

## Refund Process Flow

1. **Click "Request Refund"**
2. **Enter Reason**: Popup asks for refund reason
3. **Validation**: System checks 7-day window
4. **API Call**: POST to `/api/refunds`
5. **Status Update**: Order may change to 'refund_requested'
6. **Admin Review**: Admin processes refund request
7. **Completion**: Refund processed and customer notified

## Admin Refund Management

Admins can view and process refunds at:
- `/admin/refunds` - Refund management dashboard
- View all refund requests
- Approve/deny refunds
- Process payments through Paystack/Coinbase

## Troubleshooting

### "I don't see the refund button":

1. ✅ **Check URL**: Are you on `/orders` (not `/my-orders`)?
2. ✅ **Check Status**: Is order status "Delivered"?
3. ✅ **Check Payment**: Is payment status "Paid"?
4. ✅ **Check Date**: Is order less than 7 days old?
5. ✅ **Refresh Page**: Try refreshing the browser

### "Button is grayed out":
- Order is outside 7-day window
- Payment status is not 'paid'
- Order status is not 'delivered'

### "Error when clicking":
- Check browser console for errors
- Ensure you're logged in
- Check network connection
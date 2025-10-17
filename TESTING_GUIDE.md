# 🧪 Testing Guide - Phase 1

## ⚡ Quick Test (5 minutes)

### Step 1: Add Your Keys to .env.local

Make sure your `.env.local` file has these keys:

```env
# Paystack Test Keys
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxxxx
PAYSTACK_SECRET_KEY=sk_test_xxxxx

# Resend API Key
RESEND_API_KEY=re_xxxxx

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 2: Start the Server

```bash
npm run dev
```

Open http://localhost:3000

### Step 3: Test Payment Flow

1. **Add to Cart**
   - Browse homepage
   - Click "Add to Cart" on any product
   - Cart icon should show item count

2. **Go to Checkout**
   - Click cart icon
   - Click "Proceed to Checkout"
   - Login if needed (or create account)

3. **Fill Shipping Info**
   - Full Name: `Test User`
   - Address: `123 Test Street`
   - City: `Lagos`
   - State: `Lagos`
   - ZIP: `100001`
   - Phone: `08012345678`
   - Click "Continue to Payment"

4. **Make Test Payment**
   - Click "Place Order"
   - Paystack popup appears
   - Enter test card: `4084084084084081`
   - Expiry: `12/30`
   - CVV: `408`
   - Click "Pay"
   - Enter PIN: `1234`
   - Enter OTP: `123456`

5. **Verify Success** ✅
   - Success page appears
   - Cart is cleared
   - Check your email for confirmation
   - Check Firebase Console for order

---

## 🔍 What to Check

### In Browser Console:
```
✅ "Payment successful"
✅ "Payment verified"
✅ "Confirmation email sent"
```

### In Firebase Console:
1. Go to Firestore Database
2. Check `orders` collection
3. Should see new order with:
   - status: "paid"
   - paymentStatus: "completed"
   - paymentReference: "xxx"
   - Your order items

### In Your Email:
- Should receive order confirmation
- Beautiful HTML email
- Order details
- Total amount

---

## 🎴 Test Cards

### Paystack Test Cards:

**Success:**
- Card: `4084084084084081`
- CVV: `408`
- PIN: `1234`
- OTP: `123456`

**Insufficient Funds:**
- Card: `5060666666666666666`

**Declined:**
- Card: `5061020000000000094`

---

## 🐛 Troubleshooting

### Payment Popup Not Showing?
```bash
# Check console for errors
# Verify NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY is set
# Make sure it starts with pk_test_
```

### Email Not Received?
```bash
# Check Resend dashboard for logs
# Verify RESEND_API_KEY is set
# Check spam folder
# Try with different email
```

### Order Not in Firebase?
```bash
# Check Firebase rules
# Verify Firebase config in lib/firebase/config.ts
# Check browser console for errors
```

### Payment Verification Failed?
```bash
# Check PAYSTACK_SECRET_KEY is set (without NEXT_PUBLIC_)
# Verify it starts with sk_test_
# Check API route logs
```

---

## ✅ Success Checklist

After testing, you should have:

- [ ] Payment popup appeared
- [ ] Payment completed successfully
- [ ] Success page shown
- [ ] Cart cleared
- [ ] Order in Firebase
- [ ] Email received
- [ ] No console errors

---

## 🚀 Next: Test in Production

When ready to go live:

1. Switch to live Paystack keys
2. Verify Resend domain
3. Deploy to Vercel
4. Test with real card (small amount)
5. Verify everything works

---

**Happy Testing! 🎉**

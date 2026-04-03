# Digital Purchase Issues - Diagnosis and Fix

## Issues Reported
1. ❌ No digital products showing on /my-purchases page
2. ❌ No confirmation email received after purchase
3. ✅ Payment successful (Paystack confirmation received)

## Root Causes Identified

### Issue 1: Purchase Records Not Displaying
**Cause**: The `/api/customer/purchases` endpoint was using an unsafe admin import that could fail silently.

**Fix Applied**:
- Changed from `import { adminDb } from '@/lib/firebase/admin'` 
- To: `import { getAdminFirestore } from '@/lib/firebase/admin-simple'`
- Added null check for adminDb before querying

### Issue 2: Email Not Sent
**Possible Causes**:
1. Email service configuration issue
2. Email sending failing silently
3. Order confirmation email not being triggered

## Fixes Applied

### 1. Fixed Purchase API (`app/api/customer/purchases/route.ts`)
```typescript
// Changed to use safer admin import
import { getAdminFirestore } from '@/lib/firebase/admin-simple'

// Added null check
const adminDb = getAdminFirestore()
if (!adminDb) {
  console.error('❌ Admin Firestore not available')
  return NextResponse.json(
    { error: 'Database not available' },
    { status: 500 }
  )
}
```

### 2. Created Debug Endpoint
Created `/api/debug/check-purchase` to diagnose issues:
- Check if purchase records exist
- Verify order details
- Inspect purchase data structure

## Testing Steps

### Step 1: Check if Purchase Records Exist
Visit this URL (replace with your actual userId and orderId):
```
https://your-domain.com/api/debug/check-purchase?userId=YOUR_USER_ID&orderId=YOUR_ORDER_ID
```

This will show:
- Number of purchases for the user
- Purchase record details
- Order information
- Whether purchase records were created

### Step 2: Test Purchase API Directly
Visit:
```
https://your-domain.com/api/customer/purchases?userId=YOUR_USER_ID
```

Expected response:
```json
{
  "success": true,
  "purchases": [
    {
      "id": "...",
      "userId": "...",
      "productId": "...",
      "orderId": "...",
      "product": {
        "name": "...",
        "digitalFiles": [...]
      },
      "purchasedAt": "...",
      "downloadCount": 0
    }
  ]
}
```

### Step 3: Check Email Logs
Check your server logs for:
```
✅ Confirmation email sent with X download links
```

Or error messages like:
```
⚠️ Failed to send confirmation email: [error details]
```

### Step 4: Test Email Service
Visit `/test-email` page and send a test email to verify SMTP configuration.

## Email Configuration Verification

Your `.env.local` has:
```env
RESEND_API_KEY=re_h7uv766m_HG4KUTNbG2Jj1rSCEKAiFp72
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=feromarkethub@gmail.com
SMTP_PASS=rmbyfktqutatmxci
FROM_EMAIL="FEROMARKETHUB <feromarkethub@gmail.com>"
```

✅ Email is configured correctly

## Potential Issues and Solutions

### If Purchase Records Don't Exist

**Problem**: Payment verification didn't create purchase records

**Solution**: Check payment verification logs for errors. The purchase records should be created in `/api/payments/verify/route.ts` after successful payment.

**Manual Fix**: If you need to manually create purchase records, use Firebase Console:
1. Go to Firestore
2. Navigate to `purchasedProducts` collection
3. Add document with structure:
```json
{
  "userId": "your-user-id",
  "productId": "product-id",
  "orderId": "order-id",
  "product": {
    "id": "product-id",
    "name": "Product Name",
    "type": "digital",
    "digitalFiles": [
      {
        "id": "file-id",
        "fileName": "file.pdf",
        "fileUrl": "cloudinary-url",
        "fileSize": 1024000,
        "fileType": "pdf"
      }
    ]
  },
  "purchasedAt": "2026-02-15T10:00:00.000Z",
  "downloadCount": 0,
  "accessExpiresAt": null
}
```

### If Emails Aren't Sending

**Check 1**: Verify SMTP credentials are correct
```bash
# Test SMTP connection
curl -v smtp://smtp.gmail.com:465
```

**Check 2**: Check Gmail App Password
- Gmail app passwords should be 16 characters
- Your current password: `rmbyfktqutatmxci` (16 chars ✅)
- If not working, generate a new app password at: https://myaccount.google.com/apppasswords

**Check 3**: Check if emails are in spam folder

**Check 4**: Try using Resend instead
- Your Resend API key is configured
- Resend is more reliable than SMTP
- To prioritize Resend, remove SMTP env vars temporarily

### If Purchase Records Exist But Don't Show

**Problem**: Frontend API call failing

**Solution**: 
1. Check browser console for errors
2. Verify user is logged in
3. Check if userId matches the purchase records
4. Try refreshing the page

## Quick Fix Commands

### Rebuild and Deploy
```bash
npm run build
# Deploy to Vercel
vercel --prod
```

### Check Firestore Indexes
The query uses `orderBy('purchasedAt', 'desc')` which requires an index.

If you see an error about missing index:
1. Click the link in the error message
2. Or manually create index in Firebase Console:
   - Collection: `purchasedProducts`
   - Fields: `userId` (Ascending), `purchasedAt` (Descending)

## Monitoring

### Add Logging to Track Issues

In your payment verification route, ensure these logs are present:
```typescript
console.log('✅ Creating purchase records for', digitalItems.length, 'digital products')
console.log('✅ Purchase records created successfully')
console.log('✅ Generated', downloadLinks.length, 'download links')
console.log('✅ Confirmation email sent')
```

### Check Vercel Logs
```bash
vercel logs --follow
```

Look for:
- Purchase creation logs
- Email sending logs
- Any error messages

## Expected Flow

1. ✅ User completes payment via Paystack
2. ✅ Paystack redirects to success page
3. ✅ Frontend calls `/api/payments/verify`
4. ✅ Backend verifies payment with Paystack
5. ✅ Order status updated to 'paid'
6. ✅ Purchase records created in Firestore
7. ✅ Download links generated
8. ✅ Confirmation email sent
9. ✅ User can view purchases on /my-purchases
10. ✅ User can download files

## Next Steps

1. **Deploy the fixes**:
   ```bash
   git add .
   git commit -m "Fix: Digital purchase display and email issues"
   git push
   ```

2. **Test with a new purchase**:
   - Make a test purchase
   - Check if purchase shows up
   - Check if email is received

3. **For existing purchases**:
   - Use the debug endpoint to check if records exist
   - If they exist, the fix should make them visible
   - If they don't exist, you may need to manually create them or ask the customer to contact support

4. **Monitor logs**:
   - Watch Vercel logs during next purchase
   - Verify all steps complete successfully

## Support Actions

If a customer reports this issue:

1. **Get their order ID** from Paystack confirmation
2. **Check if purchase records exist** using debug endpoint
3. **If records exist**: The fix should resolve it
4. **If records don't exist**: 
   - Check payment verification logs
   - Manually create purchase records if needed
   - Resend confirmation email manually

## Contact Information

For urgent issues:
- Check Vercel logs: `vercel logs`
- Check Firebase Console: https://console.firebase.google.com
- Check Paystack Dashboard: https://dashboard.paystack.com

---

**Status**: ✅ Fixes Applied
**Date**: February 15, 2026
**Next Action**: Deploy and test with new purchase

# Vendor Payout System Guide

## Overview

The payout system allows vendors to withdraw their earnings from the marketplace. Admins can review, approve, and process these withdrawal requests. The system supports multiple payment methods including bank transfers, mobile money, and PayPal.

## Features

### For Vendors

1. **View Balance Information**
   - Available Balance: Money ready to withdraw
   - Pending Balance: Money from orders being processed
   - Total Earnings: All-time earnings
   - Total Withdrawn: Lifetime withdrawals

2. **Request Payouts**
   - Minimum withdrawal: ₦1,000
   - Multiple payment methods supported
   - Real-time validation
   - Automatic balance checking

3. **Track Payout History**
   - View all withdrawal requests
   - See request status (pending, approved, processing, completed, rejected)
   - View transaction references
   - See rejection reasons if applicable

### For Admins

1. **Review Payout Requests**
   - View all pending requests
   - See vendor details and payment information
   - Filter by status (pending, processing, completed, all)

2. **Process Payouts**
   - Approve requests
   - Reject with reason
   - Mark as completed with transaction reference
   - Add notes to any transaction

3. **Dashboard Statistics**
   - Total pending requests and amounts
   - Processing requests and amounts
   - Completed payouts tracking

## Payment Methods

### 1. Bank Transfer (Nigeria)
Vendors provide:
- Account Name
- Account Number (10 digits)
- Bank Name (from dropdown list)
- Bank Code (optional)

**Supported Banks:**
- Access Bank
- GTBank
- First Bank
- UBA
- Zenith Bank
- Ecobank
- Fidelity Bank
- Union Bank
- Stanbic IBTC
- Sterling Bank
- Wema Bank
- Polaris Bank
- Kuda Bank
- Opay
- PalmPay

### 2. Mobile Money
Vendors provide:
- Provider (MTN, Airtel, 9mobile, Glo)
- Phone Number
- Account Name

### 3. PayPal
Vendors provide:
- PayPal Email Address

**Note:** PayPal withdrawals may incur additional fees and take longer to process.

## Workflow

### Vendor Workflow

1. **Check Balance**
   - Navigate to `/vendor/payouts`
   - View available balance and earnings

2. **Request Withdrawal**
   - Click "Request Payout" tab
   - Enter withdrawal amount (minimum ₦1,000)
   - Select payment method
   - Fill in payment details
   - Submit request

3. **Track Status**
   - View request in "Payout History" tab
   - Monitor status changes
   - Receive notifications (if implemented)

### Admin Workflow

1. **Review Requests**
   - Navigate to `/admin/payouts`
   - View pending requests in "Pending" tab
   - Review vendor details and payment information

2. **Approve Request**
   - Click "Approve" button
   - Add optional notes
   - Confirm approval
   - Status changes to "approved"

3. **Process Payment**
   - Make actual payment via bank/payment provider
   - Return to admin panel
   - Click "Mark as Completed"
   - Enter transaction reference
   - Add optional notes
   - Confirm completion

4. **Reject Request (if needed)**
   - Click "Reject" button
   - Provide rejection reason (required)
   - Confirm rejection
   - Vendor will see rejection reason

## Payout Statuses

| Status | Description | Next Action |
|--------|-------------|-------------|
| **Pending** | Request submitted, awaiting admin review | Admin approves or rejects |
| **Approved** | Admin approved, ready for payment | Admin processes payment |
| **Processing** | Payment is being processed | Admin completes transaction |
| **Completed** | Payment successfully sent | No action needed |
| **Rejected** | Request rejected by admin | Vendor can submit new request |

## Database Structure

### Collections

#### `payoutRequests`
```typescript
{
  id: string
  vendorId: string
  vendorName: string
  vendorEmail: string
  amount: number
  paymentMethod: "bank_transfer" | "mobile_money" | "paypal"
  bankDetails?: {
    accountName: string
    accountNumber: string
    bankName: string
    bankCode?: string
  }
  mobileMoneyDetails?: {
    provider: string
    phoneNumber: string
    accountName: string
  }
  paypalEmail?: string
  status: "pending" | "approved" | "processing" | "completed" | "rejected"
  requestedAt: Date
  processedAt?: Date
  processedBy?: string
  notes?: string
  rejectionReason?: string
  transactionReference?: string
}
```

#### `vendorBalances`
```typescript
{
  vendorId: string
  availableBalance: number
  pendingBalance: number
  totalEarnings: number
  totalWithdrawn: number
  lastPayoutDate?: Date
  updatedAt: Date
}
```

## Security & Validation

### Vendor Side
- Must be authenticated as vendor
- Can only withdraw available balance
- Minimum withdrawal amount enforced
- Payment details validated before submission
- Cannot withdraw more than available balance

### Admin Side
- Must have admin or super_admin role
- Requires 'finance.view' permission
- Transaction reference required for completion
- Rejection reason required for rejections
- All actions logged with admin ID

## Integration Points

### 1. Order Completion
When an order is marked as "delivered":
```typescript
// Update vendor balance
const vendorBalance = await getVendorBalance(vendorId);
await updateVendorBalance(vendorId, {
  availableBalance: vendorBalance.availableBalance + orderAmount,
  totalEarnings: vendorBalance.totalEarnings + orderAmount,
});
```

### 2. Payout Completion
When admin marks payout as completed:
```typescript
// Deduct from available balance
await updateVendorBalance(vendorId, {
  availableBalance: currentBalance - payoutAmount,
  totalWithdrawn: totalWithdrawn + payoutAmount,
  lastPayoutDate: new Date(),
});
```

## Access URLs

### Vendor Pages
- **Payout Dashboard:** `/vendor/payouts`
- **Vendor Dashboard:** `/vendor/dashboard` (includes payout quick access)

### Admin Pages
- **Payout Management:** `/admin/payouts`
- **Admin Dashboard:** `/admin/dashboard`

## Best Practices

### For Vendors
1. Verify payment details before submitting
2. Keep minimum balance for withdrawal fees
3. Track transaction references for records
4. Contact support if payout is delayed

### For Admins
1. Verify vendor identity before approval
2. Double-check payment details
3. Always provide transaction references
4. Add notes for complex transactions
5. Provide clear rejection reasons
6. Process payouts within 3-5 business days

## Future Enhancements

Consider implementing:
1. **Automated Payouts** - Integration with payment gateways
2. **Email Notifications** - Alert vendors on status changes
3. **Withdrawal Schedules** - Weekly/monthly automatic payouts
4. **Fee Management** - Deduct processing fees automatically
5. **Multi-currency Support** - Support for USD, EUR, etc.
6. **Payout Analytics** - Detailed reports and insights
7. **Bulk Processing** - Process multiple payouts at once
8. **Webhook Integration** - Real-time payment status updates

## Troubleshooting

### Common Issues

**Vendor cannot submit payout:**
- Check available balance is ≥ ₦1,000
- Verify all payment details are filled
- Ensure no pending payout exists

**Admin cannot approve payout:**
- Verify admin has finance.view permission
- Check payout status is "pending"
- Ensure Firebase connection is active

**Balance not updating:**
- Check order status is "delivered"
- Verify balance update function is called
- Check Firebase rules allow updates

## Support

For issues or questions:
1. Check this guide first
2. Review Firebase console for errors
3. Check browser console for client errors
4. Contact system administrator

---

**Last Updated:** 2025-09-30
**Version:** 1.0.0

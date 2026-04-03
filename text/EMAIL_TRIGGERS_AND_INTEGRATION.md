# Email Triggers & Integration Map

This document summarizes all email-related helpers, their triggers, and where they are wired into the MarketHub codebase. It is intended to make future changes and audits straightforward.

---

## 1. Core Infrastructure

- **Low-level sender**: `lib/email/send-email.ts`
  - `sendEmail(options)`
  - Sends via SMTP (Nodemailer) if configured, otherwise Resend, otherwise logs to console.
  - Shared by all email helpers.

- **High-level helpers**: `lib/email/service.ts`
  - Contains all domain-specific email functions documented below.
  - Uses constants:
    - `FROM_EMAIL = 'FEROMARKETHUB <orders@FEROMARKETHUB.com>'`
    - `SUPPORT_EMAIL = 'support@FEROMARKETHUB.com'`
    - `APP_URL` from `NEXT_PUBLIC_APP_URL` / `NEXTAUTH_URL` / `http://localhost:3000`.

---

## 2. Order Lifecycle Emails

### 2.1 Order Confirmation (customer)

- **Helper**: `sendOrderConfirmationEmail(order, downloadLinks?)`
  - **File**: `lib/email/service.ts`
  - **Purpose**: Full order confirmation:
    - Items (physical/digital/service), totals, shipping info.
    - Digital download links when provided.
  - **Recipient**: `order.userEmail` or `order.shippingAddress.email`.

- **Trigger**: Payment verification success
  - **Route**: `app/api/payments/verify/route.ts`
  - **Where**:
    - After:
      - Paystack verification succeeds.
      - Order status set to `paid` and `paymentStatus` set to `completed`.
      - Inventory and creator balances updated.
    - **Call**:
      - `sendOrderConfirmationEmail({ id: orderId, ...orderData })` (best-effort; errors logged, request not failed).

### 2.2 Order Status Updates (customer)

- **Helpers**:
  - `sendOrderShippedEmail(order)`
  - `sendOrderDeliveredEmail(order)`
  - `sendOrderCancelledEmail(order)`
- **Shared internal**: `sendOrderStatusEmail(order, 'shipped' | 'delivered' | 'cancelled')`
- **File**: `lib/email/service.ts`
- **Purpose**: Lightweight "Order Update" emails including:
  - Order ID, status, optional tracking number.
  - Link to `/orders` page.

#### Trigger A: Admin/creator status changes

- **Route**: `app/api/orders/[orderId]/status/route.ts`
- **Where**:
  - After Firestore `orders/{orderId}` `update(updateData)` and inventory restoration for cancelled orders.
  - Builds:
    - `latestOrderForEmail = { id: orderId, ...orderData, ...updateData }`.
  - **Calls** (inside `try/catch`):
    - If `status === 'shipped'` → `sendOrderShippedEmail(latestOrderForEmail)`
    - If `status === 'delivered'` → `sendOrderDeliveredEmail(latestOrderForEmail)`
    - If `status === 'cancelled'` → `sendOrderCancelledEmail(latestOrderForEmail)`
  - Email failures are logged via `logger.error` and do **not** affect the API response.

#### Trigger B: Customer-initiated cancellation

- **Route**: `app/api/orders/[orderId]/cancel/route.ts`
- **Where**:
  - After verifying user and order, and updating:
    - `status: 'cancelled'`
    - `paymentStatus: 'refunded'`
    - `cancelledAt`, `updatedAt`.
  - Builds:
    - `latestOrderForEmail = { id: orderId, ...order, ...cancellationUpdate }`.
  - **Call** (inside `try/catch`):
    - `sendOrderCancelledEmail(latestOrderForEmail)`.
  - Also triggers in-app notification:
    - `NotificationTriggers.onOrderStatusChange(orderId, order.userId, 'cancelled')`.

- **Customer UI entry point**:
  - **Page**: `app/orders/page.tsx`
  - **Action**: "Cancel Order" button for `status === 'pending'`:
    - Calls `handleCancelOrder(order.id)` → `PUT /api/orders/{orderId}/cancel` with `{ userId }`.

---

## 3. creator Sale & Payout Emails

### 3.1 creator Sale Notification

- **Helper**: `sendcreatorsaleNotification(creatorEmail, orderItem, orderId)`
  - **File**: `lib/email/service.ts`
  - **Purpose**: Notifies a creator when one of their items sells.
  - **Recipient**: creator email from `users/{creatorId}`.

- **Trigger**: On successful payment verification
  - **Route**: `app/api/payments/verify/route.ts`
  - **Where**:
    - After creator balances are updated for the order.
    - Code groups items by `creatorId`:
      - Reads each creator with `adminDb.collection('users').doc(creatorId)`.
      - For each item in that creator group, calls:
        - `sendcreatorsaleNotification(creatorEmail, item, orderId)`.
    - Wrapped in `try/catch`; failures logged and ignored.

### 3.2 Payout Completed / Rejected (creator)

- **Helpers**:
  - `sendPayoutCompletedEmail(payout)`
  - `sendPayoutRejectedEmail(payout)`
  - **Internal**: `sendPayoutStatusEmail(payout, 'completed' | 'rejected')`
  - **File**: `lib/email/service.ts`

- **Trigger**: Admin processes creator payout requests
  - **Route**: `app/api/payouts/[payoutId]/route.ts` (`PATCH`)
  - **Actions**:
    - `action === 'approve'` → status `approved` (no email yet).
    - `action === 'reject'` → status `rejected`.
    - `action === 'complete'` → status `completed`, creator balance updated.
  - **Notifications & Emails**:
    - For `completed`:
      - `NotificationTriggers.onPayoutProcessed(creatorId, amount, payoutId)` → in-app `payout_processed`.
      - `sendPayoutCompletedEmail(latestPayout)`.
    - For `rejected`:
      - `sendPayoutRejectedEmail(latestPayout)`.
  - All inside `try/catch`; failures do not affect the API response.

- **Admin UI entry point**:
  - **Page**: `app/admin/payouts/page.tsx`
  - **Action**: Approve/Reject/Complete buttons.
    - `confirmAction()` now calls `PATCH /api/payouts/{id}` instead of updating Firestore directly.

---

## 4. Security & Account Emails

### 4.1 Password Reset (user-initiated via Firebase)

- **Helper**: `sendPasswordResetEmail(email, resetLink)`
  - **File**: `lib/email/service.ts`
  - **Note**: This is available for use, but most reset flows currently use Firebase Auth’s built-in email templates.

### 4.2 Password Changed Confirmation

- **Helper**: `sendPasswordChangedEmail(email)`
  - **File**: `lib/email/service.ts`
  - **Purpose**: Security confirmation when a password is successfully changed.

- **Trigger**: User changes password in account page
  - **API Route**: `app/api/account/security/password-changed/route.ts` (`POST`)
    - Body: `{ email }`.
    - Calls `sendPasswordChangedEmail(email)`.
  - **UI**: `app/account/page.tsx` (`handleChangePassword`):
    - After successful `updatePassword(user, newPassword)`, best-effort call to:
      - `POST /api/account/security/password-changed` with `{ email: user.email }`.

- **Related in-app notification**:
  - Notification type `password_changed` exists in `lib/notifications/types.ts`, but is not yet wired to a trigger; the current implementation uses email only.

---

## 5. Refunds / Returns Emails

### 5.1 Refund Requested (customer)

- **Helper**: `sendRefundRequestedEmail(order, refund)`
  - **Internal**: `sendRefundEmail(order, refund, 'requested')`
  - **File**: `lib/email/service.ts`

- **Trigger**: Customer submits a refund request
  - **API Route**: `app/api/refunds/route.ts` (`POST`)
  - **Flow**:
    1. Validates `{ userId, orderId, reason }`.
    2. Loads `orders/{orderId}` and ensures ownership.
    3. Checks a 7-day window based on `order.createdAt`.
    4. Ensures no active `pending/approved` refunds for the same order/user.
    5. Creates `refunds/{refundId}` with:
       - `userId`, `orderId`, `creatorId`, `reason`, `status: 'pending'`, `amount`, timestamps.
    6. Best-effort order update: `status: 'refund_requested'`.
    7. **Email** (best-effort):
       - `sendRefundRequestedEmail({ id: orderId, ...orderData }, { id: refundRef.id, ...refundData })`.

- **Customer UI entry point**:
  - **Page**: `app/orders/page.tsx`
  - **Action**: "Request Refund" button
    - Visible when:
      - `order.status === 'delivered'` and `paymentStatus === 'paid'`.
      - Local 7-day check based on `order.createdAt`.
    - `handleRequestRefund(order)`:
      - Prompts for a text reason.
      - Calls `POST /api/refunds` with `{ userId, orderId, reason }`.
      - On success, reloads orders (so `refund_requested` status appears) and shows a toast.

### 5.2 Refund Rejected (customer)

- **Helper**: `sendRefundRejectedEmail(order, refund)`
  - **Internal**: `sendRefundEmail(order, refund, 'rejected')`
  - **File**: `lib/email/service.ts`

- **Trigger**: Admin rejects a refund request
  - **API Route**: `app/api/refunds/[refundId]/route.ts` (`PATCH`)
  - **Action**: `action === 'reject'` with `rejectionReason`.
  - **Flow**:
    - Validates body and loads `refunds/{refundId}` and its `orders/{orderId}`.
    - Updates refund status to `rejected` with reason and optional `resolutionNotes`.
    - **Email** (best-effort):
      - `sendRefundRejectedEmail({ id: refundData.orderId, ...orderData }, latestRefund)`.

### 5.3 Refund Processed (customer)

- **Helper**: `sendRefundProcessedEmail(order, refund)`
  - **Internal**: `sendRefundEmail(order, refund, 'processed')`
  - **File**: `lib/email/service.ts`

- **Trigger**: Admin marks a refund as refunded
  - **API Route**: `app/api/refunds/[refundId]/route.ts` (`PATCH`)
  - **Action**: `action === 'mark_refunded'`.
  - **Flow**:
    1. Updates refund status to `refunded` with `refundedAt`.
    2. Best-effort order update:
       - `status: 'refunded'`, `paymentStatus: 'refunded'`.
    3. If `orderData.userId` exists:
       - **Notification**:
         - `NotificationTriggers.onOrderRefunded(orderId, customerId, amount)` → `order_refunded` with metadata.
       - **Email**:
         - `sendRefundProcessedEmail({ id: orderId, ...orderData }, latestRefund)`.

- **In-app notification wiring**:
  - **File**: `lib/notifications/triggers.ts`
  - **Helper**: `onOrderRefunded(orderId, customerId, amount)`
    - Creates `order_refunded` notification linked to `/orders/{orderId}`.

---

## 6. Summary Table of Email Triggers

| Flow                      | Helper Function                         | Called From                                           | When                                                                 |
|---------------------------|------------------------------------------|-------------------------------------------------------|----------------------------------------------------------------------|
| Order confirmation        | `sendOrderConfirmationEmail`            | `api/payments/verify`                                 | After successful Paystack verify and order/payment updates           |
| Order shipped             | `sendOrderShippedEmail`                 | `api/orders/[orderId]/status`                         | When status set to `shipped` via admin/creator API                    |
| Order delivered           | `sendOrderDeliveredEmail`               | `api/orders/[orderId]/status`                         | When status set to `delivered` via admin/creator API                  |
| Order cancelled (admin)   | `sendOrderCancelledEmail`               | `api/orders/[orderId]/status`                         | When status set to `cancelled` via admin/creator API                  |
| Order cancelled (customer)| `sendOrderCancelledEmail`               | `api/orders/[orderId]/cancel`                         | When customer cancels own order via cancel API                       |
| creator sale notification  | `sendcreatorsaleNotification`            | `api/payments/verify`                                 | On payment success, per creator per item                              |
| Payout completed          | `sendPayoutCompletedEmail`              | `api/payouts/[payoutId]`                              | When admin marks payout `completed`                                  |
| Payout rejected           | `sendPayoutRejectedEmail`               | `api/payouts/[payoutId]`                              | When admin marks payout `rejected`                                   |
| Password changed          | `sendPasswordChangedEmail`              | `api/account/security/password-changed`               | After successful password change on account page                     |
| Refund requested          | `sendRefundRequestedEmail`              | `api/refunds`                                         | When customer submits refund request within 7 days                   |
| Refund rejected           | `sendRefundRejectedEmail`               | `api/refunds/[refundId]` (action `reject`)           | When admin rejects refund request                                    |
| Refund processed          | `sendRefundProcessedEmail`              | `api/refunds/[refundId]` (action `mark_refunded`)    | When admin marks refund as refunded and order set to `refunded`     |

---

## 7. Notes & Future Enhancements

- **Password-related notifications**:
  - A `password_changed` notification type exists but is not wired; only email is sent today.

- **Refund window**:
  - Enforced both in UI (orders page) and server (`api/refunds`) as 7 days after `order.createdAt`.

- **Extensibility**:
  - New flows should add email helpers in `lib/email/service.ts` and trigger them from API routes (never directly from client components) to avoid exposing credentials.
  - In-app notifications for each email event can be added in `lib/notifications/triggers.ts` using the same pattern as `onOrderRefunded` and `onPayoutProcessed`.

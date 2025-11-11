# Complete Advertising Workflow Implementation

## Overview
This document outlines the complete advertising workflow that connects the advertiser dashboard to the admin advertising management system with proper permissions and approval processes.

## Workflow Components

### 1. Advertiser Dashboard (`/app/advertiser/dashboard/page.tsx`)
**Features:**
- Campaign creation with multiple placement types
- Real-time campaign status tracking
- Budget management and balance checking
- Campaign performance analytics
- Notification system for status updates

**Campaign Status Flow:**
1. **Draft** → User creates campaign
2. **Pending Review** → Campaign submitted for admin approval
3. **Active** → Admin approved, funds deducted, campaign running
4. **Rejected** → Admin rejected with reason
5. **Paused** → Admin or system paused campaign
6. **Completed** → Campaign finished or budget exhausted

### 2. Admin Advertising Management (`/app/admin/advertising/page.tsx`)
**Features:**
- View all campaigns with filtering by status
- Approve/reject campaigns with reasons
- Pause/resume active campaigns
- View advertiser information and balances
- Comprehensive campaign analytics

**Admin Actions:**
- **Approve Campaign**: Deducts funds from advertiser account, activates campaign
- **Reject Campaign**: Provides reason, notifies advertiser
- **Pause Campaign**: Temporarily stops campaign
- **Resume Campaign**: Restarts paused campaign

### 3. Permission System (`/lib/admin/permissions.ts`)
**Advertising Permissions:**
- `ads.view` - View advertising campaigns
- `ads.approve` - Approve pending campaigns
- `ads.reject` - Reject campaigns
- `ads.pause` - Pause/resume campaigns
- `ads.delete` - Delete campaigns

**Role Assignments:**
- **Super Admin**: All permissions
- **Admin**: All except system management
- **Moderator**: View, approve, reject only
- **Support**: View only

### 4. API Endpoints

#### `/api/advertiser/campaigns/route.ts`
- **POST**: Create new campaign (status: pending_review)
- **GET**: Fetch advertiser's campaigns

#### `/api/admin/advertising/route.ts`
- **GET**: Fetch all campaigns with advertiser info (admin only)
- **PATCH**: Update campaign status (approve/reject/pause/resume)

### 5. Database Structure

#### `adCampaigns` Collection
```typescript
{
  id: string
  advertiserId: string
  campaignName: string
  budget: {
    total: number
    spent: number
    remaining: number
    dailyLimit: number
  }
  creative: {
    title: string
    description: string
    imageUrl: string
    destinationUrl: string
    ctaText: string
  }
  placement: {
    type: 'vendor_store' | 'homepage' | 'category' | 'sponsored_product'
    targetVendors: string[]
    targetCategories: string[]
  }
  stats: {
    impressions: number
    clicks: number
    conversions: number
    ctr: number
  }
  status: 'pending_review' | 'active' | 'paused' | 'rejected' | 'completed'
  fundsReserved: boolean
  reviewReason?: string
  reviewedBy?: string
  createdAt: Date
  updatedAt: Date
}
```

#### `advertisers` Collection
```typescript
{
  id: string (user UID)
  companyName: string
  contactEmail: string
  phone: string
  accountBalance: number
  totalSpent: number
  status: 'active' | 'suspended'
  createdAt: Date
}
```

#### `notifications` Collection
```typescript
{
  id: string
  userId: string
  type: 'campaign_status_update'
  title: string
  message: string
  metadata: {
    campaignId: string
    action: string
    reason?: string
  }
  read: boolean
  createdAt: Date
}
```

### 6. Notification System (`/components/advertiser/campaign-notifications.tsx`)
**Features:**
- Real-time campaign status notifications
- Visual indicators for different notification types
- Mark as read functionality
- Campaign-specific action links

**Notification Types:**
- Campaign Approved ✅
- Campaign Rejected ❌
- Campaign Paused ⏸️
- Campaign Resumed ▶️
- Low Budget Warning ⚠️
- Campaign Completed 🏁

## Complete User Journey

### Advertiser Journey
1. **Sign Up**: Create advertiser account
2. **Add Funds**: Deposit money to account balance
3. **Create Campaign**: Design ad with targeting and budget
4. **Submit for Review**: Campaign status becomes "pending_review"
5. **Wait for Approval**: Receive notification when reviewed
6. **Campaign Goes Live**: If approved, funds deducted and campaign starts
7. **Monitor Performance**: Track impressions, clicks, conversions
8. **Receive Updates**: Get notified of any status changes

### Admin Journey
1. **Access Admin Panel**: Login with proper permissions
2. **View Pending Campaigns**: Filter by "pending_review" status
3. **Review Campaign Details**: Check creative, budget, targeting
4. **Verify Advertiser**: Check account balance and history
5. **Make Decision**: Approve or reject with reason
6. **Monitor Active Campaigns**: Pause if needed
7. **Handle Issues**: Respond to advertiser queries

## Security Features

### Authentication
- Firebase Auth integration
- Admin role verification
- Permission-based access control

### Authorization
- Route-level protection
- API endpoint security
- Role-based UI components

### Data Validation
- Budget validation against account balance
- Minimum budget requirements per placement type
- Image upload validation
- Required field validation

## Budget Management

### Placement Type Minimums
- **Vendor Store Ads**: ₦1,000 minimum
- **Homepage Banner**: ₦50,000 minimum (1 week)
- **Category Page Ads**: ₦20,000 minimum (1 week)
- **Sponsored Product**: ₦5,000 minimum (1 day)

### Fund Flow
1. Advertiser deposits funds to account
2. Campaign creation reserves funds (not deducted)
3. Admin approval deducts reserved funds
4. Campaign rejection releases reserved funds
5. Campaign completion returns unused funds

## Integration Points

### With Existing Systems
- **User Management**: Links to existing user accounts
- **Payment System**: Integrates with transaction records
- **Notification System**: Uses existing notification infrastructure
- **Admin Panel**: Extends current admin functionality

### Future Enhancements
- **Analytics Dashboard**: Detailed performance metrics
- **A/B Testing**: Campaign variant testing
- **Automated Bidding**: Smart bid optimization
- **Fraud Detection**: Click fraud prevention
- **Reporting**: Comprehensive campaign reports

## Testing Checklist

### Advertiser Flow
- [ ] Create advertiser account
- [ ] Add funds to account
- [ ] Create campaign with different placement types
- [ ] Verify minimum budget validation
- [ ] Check campaign status updates
- [ ] Receive notifications

### Admin Flow
- [ ] Login with different admin roles
- [ ] View campaigns with proper permissions
- [ ] Approve campaign and verify fund deduction
- [ ] Reject campaign with reason
- [ ] Pause/resume active campaigns
- [ ] Verify notification sending

### Edge Cases
- [ ] Insufficient balance scenarios
- [ ] Invalid campaign data
- [ ] Permission denied access
- [ ] Network error handling
- [ ] Concurrent admin actions

## Deployment Notes

### Environment Variables Required
```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_preset
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_PRIVATE_KEY=your_private_key
FIREBASE_ADMIN_CLIENT_EMAIL=your_client_email
```

### Database Indexes Required
```javascript
// Firestore indexes
adCampaigns: {
  advertiserId: 'asc',
  status: 'asc',
  createdAt: 'desc'
}

notifications: {
  userId: 'asc',
  type: 'asc',
  createdAt: 'desc'
}
```

### File Structure
```
/app
  /advertiser
    /dashboard/page.tsx (Updated)
  /admin
    /advertising/page.tsx (New)
  /api
    /advertiser
      /campaigns/route.ts (Existing)
    /admin
      /advertising/route.ts (New)

/components
  /advertiser
    /campaign-notifications.tsx (New)
  /admin
    /permission-guard.tsx (Existing)

/lib
  /admin
    /permissions.ts (Updated)
  /firebase
    /admin-auth.ts (New)
```

## Success Metrics

### For Advertisers
- Campaign approval rate > 90%
- Average approval time < 24 hours
- Clear rejection reasons provided
- Real-time status updates

### For Admins
- Efficient campaign review process
- Proper permission enforcement
- Comprehensive campaign oversight
- Fraud prevention capabilities

This implementation provides a complete, secure, and user-friendly advertising workflow that connects advertisers with admin oversight while maintaining proper permissions and notifications throughout the process.

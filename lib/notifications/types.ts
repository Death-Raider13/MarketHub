export type NotificationType = 
  // Product-related
  | 'product_created'
  | 'product_approved'
  | 'product_rejected'
  | 'product_out_of_stock'
  | 'product_back_in_stock'
  | 'wishlist_item_sale'
  | 'cart_item_price_drop'
  
  // Order-related
  | 'order_placed'
  | 'order_confirmed'
  | 'order_shipped'
  | 'order_delivered'
  | 'order_cancelled'
  | 'order_refunded'
  
  // Vendor-related
  | 'vendor_approved'
  | 'vendor_rejected'
  | 'vendor_suspended'
  | 'new_order_received'
  | 'payout_processed'
  | 'payout_pending'
  
  // Admin-related
  | 'new_user_registered'
  | 'new_vendor_application'
  | 'product_pending_approval'
  | 'review_pending_moderation'
  | 'ad_pending_approval'
  | 'abuse_report_filed'
  | 'abuse_report_created'
  | 'abuse_report_updated'
  | 'abuse_report_resolved'
  | 'abuse_report_dismissed'
  | 'system_maintenance'
  | 'security_alert'
  
  // Storefront-related
  | 'favorite_store_new_product'
  | 'favorite_store_sale'
  | 'store_followed'
  | 'store_unfollowed'
  
  // Communication-related
  | 'new_message'
  | 'new_question'
  | 'question_answered'
  | 'new_review'
  
  // General
  | 'welcome'
  | 'account_verified'
  | 'password_changed'
  | 'profile_updated';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export type NotificationStatus = 'unread' | 'read' | 'archived';

export interface NotificationData {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  status: NotificationStatus;
  recipientId: string;
  recipientRole?: string | null;
  createdAt: Date;
  readAt?: Date;
  expiresAt?: Date | null;
  
  // Optional metadata for different notification types
  metadata?: {
    productId?: string;
    productName?: string;
    orderId?: string;
    vendorId?: string;
    vendorName?: string;
    storeId?: string;
    storeName?: string;
    userId?: string;
    userName?: string;
    amount?: number;
    rating?: number;
    conversationId?: string;
    senderName?: string;
    senderRole?: string;
    reportedItemType?: string;
    reportedItemId?: string;
    alertType?: string;
    imageUrl?: string;
    actionUrl?: string;
    actionText?: string;
  };
}

export interface NotificationPreferences {
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  inAppNotifications: boolean;
  
  // Notification type preferences
  productUpdates: boolean;
  orderUpdates: boolean;
  vendorUpdates: boolean;
  adminUpdates: boolean;
  marketingUpdates: boolean;
  securityUpdates: boolean;
}

// Notification templates for different types
export const NOTIFICATION_TEMPLATES: Record<NotificationType, {
  title: string;
  message: string;
  priority: NotificationPriority;
  icon: string;
}> = {
  // Product notifications
  product_created: {
    title: 'New Product Added',
    message: 'A new product "{productName}" has been added to the marketplace',
    priority: 'low',
    icon: '📦'
  },
  product_approved: {
    title: 'Product Approved',
    message: 'Your product "{productName}" has been approved and is now live',
    priority: 'medium',
    icon: '✅'
  },
  product_rejected: {
    title: 'Product Rejected',
    message: 'Your product "{productName}" was rejected. Please review and resubmit',
    priority: 'high',
    icon: '❌'
  },
  product_out_of_stock: {
    title: 'Product Out of Stock',
    message: 'Your product "{productName}" is now out of stock',
    priority: 'medium',
    icon: '📉'
  },
  product_back_in_stock: {
    title: 'Back in Stock!',
    message: '"{productName}" from your wishlist is back in stock',
    priority: 'medium',
    icon: '🔄'
  },
  wishlist_item_sale: {
    title: 'Wishlist Item on Sale!',
    message: '"{productName}" from your wishlist is now on sale',
    priority: 'medium',
    icon: '🏷️'
  },
  cart_item_price_drop: {
    title: 'Price Drop Alert!',
    message: 'An item in your cart has dropped in price',
    priority: 'medium',
    icon: '💰'
  },
  
  // Order notifications
  order_placed: {
    title: 'Order Placed',
    message: 'Your order #{orderId} has been placed successfully',
    priority: 'medium',
    icon: '🛒'
  },
  order_confirmed: {
    title: 'Order Confirmed',
    message: 'Your order #{orderId} has been confirmed by the vendor',
    priority: 'medium',
    icon: '✅'
  },
  order_shipped: {
    title: 'Order Shipped',
    message: 'Your order #{orderId} has been shipped',
    priority: 'medium',
    icon: '🚚'
  },
  order_delivered: {
    title: 'Order Delivered',
    message: 'Your order #{orderId} has been delivered',
    priority: 'medium',
    icon: '📦'
  },
  order_cancelled: {
    title: 'Order Cancelled',
    message: 'Your order #{orderId} has been cancelled',
    priority: 'high',
    icon: '❌'
  },
  order_refunded: {
    title: 'Refund Processed',
    message: 'Your refund for order #{orderId} has been processed',
    priority: 'medium',
    icon: '💳'
  },
  
  // Vendor notifications
  vendor_approved: {
    title: 'Vendor Account Approved',
    message: 'Congratulations! Your vendor account has been approved',
    priority: 'high',
    icon: '🎉'
  },
  vendor_rejected: {
    title: 'Vendor Application Rejected',
    message: 'Your vendor application was rejected. Please review requirements',
    priority: 'high',
    icon: '❌'
  },
  vendor_suspended: {
    title: 'Account Suspended',
    message: 'Your vendor account has been suspended. Contact support',
    priority: 'urgent',
    icon: '⚠️'
  },
  new_order_received: {
    title: 'New Order Received',
    message: 'You have received a new order #{orderId}',
    priority: 'high',
    icon: '🛒'
  },
  payout_processed: {
    title: 'Payout Processed',
    message: 'Your payout of ₦{amount} has been processed',
    priority: 'medium',
    icon: '💰'
  },
  payout_pending: {
    title: 'Payout Pending',
    message: 'Your payout request is being processed',
    priority: 'low',
    icon: '⏳'
  },
  
  // Admin notifications
  new_user_registered: {
    title: 'New User Registration',
    message: 'A new user "{userName}" has registered',
    priority: 'low',
    icon: '👤'
  },
  new_vendor_application: {
    title: 'New Vendor Application',
    message: 'New vendor application from "{vendorName}" requires review',
    priority: 'medium',
    icon: '🏪'
  },
  product_pending_approval: {
    title: 'Product Pending Approval',
    message: 'New product "{productName}" is pending approval',
    priority: 'medium',
    icon: '📦'
  },
  review_pending_moderation: {
    title: 'Review Pending Moderation',
    message: 'A new review requires moderation',
    priority: 'medium',
    icon: '⭐'
  },
  ad_pending_approval: {
    title: 'Ad Pending Approval',
    message: 'New advertisement campaign requires approval',
    priority: 'medium',
    icon: '📢'
  },
  abuse_report_filed: {
    title: 'Abuse Report Filed',
    message: 'A new abuse report has been filed',
    priority: 'high',
    icon: '🚨'
  },
  abuse_report_created: {
    title: 'New Abuse Report',
    message: 'New {reportType} report: "{reportedItem}" reported by {reportedBy}',
    priority: 'high',
    icon: '🚨'
  },
  abuse_report_updated: {
    title: 'Report Status Updated',
    message: 'Your report about "{reportedItem}" has been updated to {status}',
    priority: 'medium',
    icon: '📋'
  },
  abuse_report_resolved: {
    title: 'Report Resolved',
    message: 'Your report about "{reportedItem}" has been resolved',
    priority: 'medium',
    icon: '✅'
  },
  abuse_report_dismissed: {
    title: 'Report Dismissed',
    message: 'Your report about "{reportedItem}" has been dismissed',
    priority: 'medium',
    icon: '❌'
  },
  system_maintenance: {
    title: 'System Maintenance',
    message: 'Scheduled maintenance will begin soon',
    priority: 'high',
    icon: '🔧'
  },
  security_alert: {
    title: 'Security Alert',
    message: 'Unusual activity detected on your account',
    priority: 'urgent',
    icon: '🔒'
  },
  
  // Storefront notifications
  favorite_store_new_product: {
    title: 'New Product from Favorite Store',
    message: '"{storeName}" added a new product: "{productName}"',
    priority: 'medium',
    icon: '🏪'
  },
  favorite_store_sale: {
    title: 'Sale at Favorite Store',
    message: '"{storeName}" is having a sale!',
    priority: 'medium',
    icon: '🏷️'
  },
  store_followed: {
    title: 'New Follower',
    message: 'Someone started following your store',
    priority: 'low',
    icon: '👥'
  },
  store_unfollowed: {
    title: 'Store Unfollowed',
    message: 'Someone unfollowed your store',
    priority: 'low',
    icon: '👥'
  },
  
  // Communication notifications
  new_message: {
    title: 'New Message',
    message: 'You have a new message from {senderName}',
    priority: 'medium',
    icon: '💬'
  },
  new_question: {
    title: 'New Product Question',
    message: 'Someone asked a question about "{productName}"',
    priority: 'medium',
    icon: '❓'
  },
  question_answered: {
    title: 'Question Answered',
    message: 'Your question about "{productName}" was answered',
    priority: 'medium',
    icon: '💡'
  },
  new_review: {
    title: 'New Product Review',
    message: 'You received a new review for "{productName}"',
    priority: 'medium',
    icon: '⭐'
  },
  
  // General notifications
  welcome: {
    title: 'Welcome to FEROMARKETHUB!',
    message: 'Welcome to Nigeria\'s premier e-commerce platform',
    priority: 'medium',
    icon: '🎉'
  },
  account_verified: {
    title: 'Account Verified',
    message: 'Your account has been successfully verified',
    priority: 'medium',
    icon: '✅'
  },
  password_changed: {
    title: 'Password Changed',
    message: 'Your password has been successfully changed',
    priority: 'medium',
    icon: '🔒'
  },
  profile_updated: {
    title: 'Profile Updated',
    message: 'Your profile has been successfully updated',
    priority: 'low',
    icon: '👤'
  }
};

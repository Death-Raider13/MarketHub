import { notificationService, createAdminNotification, createModeratorNotification } from './service';
import { NotificationType } from './types';

/**
 * Notification triggers for various system events
 */
export class NotificationTriggers {

  /**
   * Trigger when a new user registers
   */
  static async onUserRegistration(userId: string, userName: string, userRole: string) {
    try {
      // Welcome notification to the new user
      await notificationService.createNotification(userId, 'welcome', {
        metadata: {
          userName: userName,
          actionUrl: '/dashboard'
        }
      });

      // Notify admins about new user registration
      if (userRole === 'creator') {
        await createAdminNotification('new_creator_application', {
          metadata: {
            userId: userId,
            userName: userName,
            actionUrl: `/admin/creators`
          }
        });
      } else {
        await createAdminNotification('new_user_registered', {
          metadata: {
            userId: userId,
            userName: userName,
            actionUrl: `/admin/users`
          }
        });
      }
    } catch (error) {
      console.error('Error triggering user registration notifications:', error);
    }
  }

  /**
   * Trigger when a new product is created
   */
  static async onProductCreated(productId: string, productName: string, creatorId: string, creatorName: string) {
    try {
      // Notify moderators about new product pending approval
      await createModeratorNotification('product_pending_approval', {
        metadata: {
          productId: productId,
          productName: productName,
          creatorId: creatorId,
          creatorName: creatorName,
          actionUrl: `/admin/products`
        }
      });

      // Notify followers of the creator's store (if implemented)
      // This would require a followers collection
      // await this.notifyStoreFollowers(creatorId, 'favorite_store_new_product', { productId, productName });
    } catch (error) {
      console.error('Error triggering product creation notifications:', error);
    }
  }

  /**
   * Trigger when a new order is placed
   */
  static async onOrderPlaced(orderId: string, customerId: string, creatorId: string, amount: number) {
    try {
      // Notify customer about order confirmation
      await notificationService.createNotification(customerId, 'order_placed', {
        metadata: {
          orderId: orderId,
          amount: amount,
          actionUrl: `/orders/${orderId}`
        }
      });

      // Notify creator about new order
      await notificationService.createNotification(creatorId, 'new_order_received', {
        metadata: {
          orderId: orderId,
          amount: amount,
          actionUrl: `/creator/orders/${orderId}`
        }
      });
    } catch (error) {
      console.error('Error triggering order placement notifications:', error);
    }
  }

  /**
   * Trigger when order status changes
   */
  static async onOrderStatusChange(orderId: string, customerId: string, newStatus: string) {
    try {
      let notificationType: NotificationType;

      switch (newStatus) {
        case 'confirmed':
          notificationType = 'order_confirmed';
          break;
        case 'shipped':
          notificationType = 'order_shipped';
          break;
        case 'delivered':
          notificationType = 'order_delivered';
          break;
        case 'cancelled':
          notificationType = 'order_cancelled';
          break;
        default:
          return; // Don't send notification for other statuses
      }

      await notificationService.createNotification(customerId, notificationType, {
        metadata: {
          orderId: orderId,
          actionUrl: `/orders/${orderId}`
        }
      });
    } catch (error) {
      console.error('Error triggering order status change notifications:', error);
    }
  }

  /**
   * Trigger when a new review is submitted
   */
  static async onReviewSubmitted(reviewId: string, productId: string, productName: string) {
    try {
      // Notify moderators about new review pending moderation
      await createModeratorNotification('review_pending_moderation', {
        metadata: {
          productId: productId,
          productName: productName,
          actionUrl: `/admin/reviews`
        }
      });
    } catch (error) {
      console.error('Error triggering review submission notifications:', error);
    }
  }

  /**
   * Trigger when an abuse report is filed
   */
  static async onAbuseReportFiled(reportId: string, reportedItemType: string, reportedItemId: string) {
    try {
      // Notify admins about new abuse report
      await createAdminNotification('abuse_report_filed', {
        priority: 'high',
        metadata: {
          reportedItemType: reportedItemType,
          reportedItemId: reportedItemId,
          actionUrl: `/admin/reports-abuse`
        }
      });
    } catch (error) {
      console.error('Error triggering abuse report notifications:', error);
    }
  }

  /**
   * Trigger when a payout is processed
   */
  static async onPayoutProcessed(creatorId: string, amount: number, payoutId: string) {
    try {
      await notificationService.createNotification(creatorId, 'payout_processed', {
        metadata: {
          amount: amount,
          actionUrl: `/creator/payouts/${payoutId}`
        }
      });
    } catch (error) {
      console.error('Error triggering payout processed notifications:', error);
    }
  }

  static async onOrderRefunded(orderId: string, customerId: string, amount: number) {
    try {
      await notificationService.createNotification(customerId, 'order_refunded', {
        metadata: {
          orderId: orderId,
          amount: amount,
          actionUrl: `/orders/${orderId}`
        }
      });
    } catch (error) {
      console.error('Error triggering order refunded notifications:', error);
    }
  }

  /**
   * Trigger system maintenance notification
   */
  static async onSystemMaintenance(maintenanceDate: Date, duration: string) {
    try {
      // Notify all users about upcoming maintenance
      await notificationService.createRoleNotification(
        ['customer', 'creator', 'admin', 'super_admin', 'moderator', 'support'],
        'system_maintenance',
        {
          priority: 'high',
          message: `Scheduled maintenance will begin on ${maintenanceDate.toLocaleDateString()} and last approximately ${duration}`,
          metadata: {
            actionUrl: '/maintenance-info'
          }
        }
      );
    } catch (error) {
      console.error('Error triggering system maintenance notifications:', error);
    }
  }

  /**
   * Trigger security alert notification
   */
  static async onSecurityAlert(userId: string, alertType: string, details: string) {
    try {
      await notificationService.createNotification(userId, 'security_alert', {
        priority: 'urgent',
        message: `Security Alert: ${details}`,
        metadata: {
          alertType: alertType,
          actionUrl: '/account/security'
        }
      });
    } catch (error) {
      console.error('Error triggering security alert notifications:', error);
    }
  }

  static async onPasswordChanged(userId: string) {
    try {
      await notificationService.createNotification(userId, 'password_changed', {
        metadata: {
          actionUrl: '/account/security',
        },
      });
    } catch (error) {
      console.error('Error triggering password changed notifications:', error);
    }
  }

  /**
   * Trigger wishlist item back in stock notification
   */
  static async onWishlistItemBackInStock(userId: string, productId: string, productName: string) {
    try {
      await notificationService.createNotification(userId, 'product_back_in_stock', {
        metadata: {
          productId: productId,
          productName: productName,
          actionUrl: `/products/${productId}`
        }
      });
    } catch (error) {
      console.error('Error triggering wishlist back in stock notifications:', error);
    }
  }

  /**
   * Trigger price drop notification for cart items
   */
  static async onCartItemPriceDrop(userId: string, productId: string, productName: string, oldPrice: number, newPrice: number) {
    try {
      const savings = oldPrice - newPrice;
      await notificationService.createNotification(userId, 'cart_item_price_drop', {
        message: `Great news! "${productName}" in your cart dropped by ₦${savings.toLocaleString()}`,
        metadata: {
          productId: productId,
          productName: productName,
          amount: savings,
          actionUrl: `/cart`
        }
      });
    } catch (error) {
      console.error('Error triggering cart price drop notifications:', error);
    }
  }
}

// Export convenience functions
export const {
  onUserRegistration,
  onProductCreated,
  onOrderPlaced,
  onOrderStatusChange,
  onReviewSubmitted,
  onAbuseReportFiled,
  onPayoutProcessed,
  onOrderRefunded,
  onSystemMaintenance,
  onSecurityAlert,
  onPasswordChanged,
  onWishlistItemBackInStock,
  onCartItemPriceDrop
} = NotificationTriggers;

import { notificationService } from './service';

/**
 * Clear all notifications for a user (for testing purposes)
 */
export async function clearUserNotifications(userId: string) {
  try {
    console.log('Clearing all notifications for user:', userId);
    
    // Get all notifications for the user
    const notifications = await notificationService.getUserNotifications(userId, 1000);
    
    // Delete each notification
    for (const notification of notifications) {
      try {
        await notificationService.deleteNotification(notification.id);
      } catch (error) {
        console.error('Error deleting notification:', notification.id, error);
      }
    }
    
    console.log(`Cleared ${notifications.length} notifications for user:`, userId);
    return true;
  } catch (error) {
    console.error('Error clearing user notifications:', error);
    return false;
  }
}

/**
 * Create sample notifications for testing the notification system
 * NOTE: This is for development testing only
 */
export async function createSampleNotifications(userId: string, userRole: string) {
  try {
    console.log('⚠️ Creating SAMPLE notifications for user:', userId, 'role:', userRole);
    console.log('⚠️ These are test notifications - real notifications will come from actual system events');

    // Clear existing notifications first
    await clearUserNotifications(userId);

    // Welcome notification
    await notificationService.createNotification(userId, 'welcome');

    console.log('✅ Sample notifications created successfully!');
    console.log('💡 Real notifications will be triggered by:');
    console.log('   - Adding products to cart');
    console.log('   - Placing orders');
    console.log('   - Payment confirmations');
    console.log('   - Order status changes');
    
    return true;
  } catch (error) {
    console.error('Error creating sample notifications:', error);
    return false;
  }
}

/**
 * Quick function to test notifications in browser console
 * Usage: testNotifications()
 */
export function setupNotificationTesting() {
  if (typeof window !== 'undefined') {
    (window as any).testNotifications = async (userId?: string, role?: string) => {
      const testUserId = userId || 'test-user-' + Date.now();
      const testRole = role || 'customer';
      
      console.log('Testing notifications for:', testUserId, testRole);
      const success = await createSampleNotifications(testUserId, testRole);
      
      if (success) {
        console.log('✅ Test notifications created! Check your notification bell.');
      } else {
        console.log('❌ Failed to create test notifications.');
      }
    };
    
    console.log('🔔 Notification testing ready! Use: testNotifications("your-user-id", "your-role")');
  }
}

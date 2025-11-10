import { collection, addDoc, query, where, orderBy, limit, getDocs, doc, updateDoc, deleteDoc, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { NotificationData, NotificationType, NotificationPriority, NOTIFICATION_TEMPLATES } from './types';

export class NotificationService {
  private static instance: NotificationService;
  
  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Create a new notification
   */
  async createNotification(
    recipientId: string,
    type: NotificationType,
    customData?: Partial<NotificationData>
  ): Promise<string> {
    try {
      const template = NOTIFICATION_TEMPLATES[type];
      
      // Replace placeholders in title and message
      let title = template.title;
      let message = template.message;
      
      if (customData?.metadata) {
        const metadata = customData.metadata;
        
        // Replace common placeholders
        title = title.replace('{productName}', metadata.productName || '');
        title = title.replace('{vendorName}', metadata.vendorName || '');
        title = title.replace('{storeName}', metadata.storeName || '');
        title = title.replace('{userName}', metadata.userName || '');
        title = title.replace('{orderId}', metadata.orderId || '');
        title = title.replace('{amount}', metadata.amount?.toLocaleString() || '');
        
        message = message.replace('{productName}', metadata.productName || '');
        message = message.replace('{vendorName}', metadata.vendorName || '');
        message = message.replace('{storeName}', metadata.storeName || '');
        message = message.replace('{userName}', metadata.userName || '');
        message = message.replace('{orderId}', metadata.orderId || '');
        message = message.replace('{amount}', metadata.amount?.toLocaleString() || '');
      }

      const notification: Omit<NotificationData, 'id'> = {
        type,
        title: customData?.title || title,
        message: customData?.message || message,
        priority: customData?.priority || template.priority,
        status: 'unread',
        recipientId,
        // Firestore rejects `undefined` values. Ensure optional fields are set to null when not provided.
        recipientRole: customData?.recipientRole ?? null,
        createdAt: new Date(),
        expiresAt: customData?.expiresAt ?? null,
        metadata: customData?.metadata || {},
      };

      const docRef = await addDoc(collection(db, 'notifications'), {
        ...notification,
        createdAt: Timestamp.fromDate(notification.createdAt),
        expiresAt: notification.expiresAt ? Timestamp.fromDate(notification.expiresAt) : null,
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Get notifications for a user
   */
  async getUserNotifications(
    userId: string,
    limitCount: number = 50,
    unreadOnly: boolean = false
  ): Promise<NotificationData[]> {
    try {
      let q = query(
        collection(db, 'notifications'),
        where('recipientId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      if (unreadOnly) {
        q = query(
          collection(db, 'notifications'),
          where('recipientId', '==', userId),
          where('status', '==', 'unread'),
          orderBy('createdAt', 'desc'),
          limit(limitCount)
        );
      }

      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          readAt: data.readAt?.toDate(),
          expiresAt: data.expiresAt?.toDate(),
        } as NotificationData;
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        status: 'read',
        readAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    try {
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('recipientId', '==', userId),
        where('status', '==', 'unread')
      );

      const snapshot = await getDocs(notificationsQuery);
      const promises = snapshot.docs.map(docSnapshot =>
        updateDoc(doc(db, 'notifications', docSnapshot.id), {
          status: 'read',
          readAt: Timestamp.now()
        })
      );

      await Promise.all(promises);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'notifications', notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('recipientId', '==', userId),
        where('status', '==', 'unread')
      );

      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  /**
   * Listen to real-time notifications
   */
  subscribeToNotifications(
    userId: string,
    callback: (notifications: NotificationData[]) => void,
    limitCount: number = 20
  ): () => void {
    const q = query(
      collection(db, 'notifications'),
      where('recipientId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    return onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          readAt: data.readAt?.toDate(),
          expiresAt: data.expiresAt?.toDate(),
        } as NotificationData;
      });

      callback(notifications);
    });
  }

  /**
   * Create bulk notifications (for admin broadcasts)
   */
  async createBulkNotifications(
    recipientIds: string[],
    type: NotificationType,
    customData?: Partial<NotificationData>
  ): Promise<void> {
    try {
      const promises = recipientIds.map(recipientId =>
        this.createNotification(recipientId, type, customData)
      );

      await Promise.all(promises);
    } catch (error) {
      console.error('Error creating bulk notifications:', error);
      throw error;
    }
  }

  /**
   * Create role-based notifications (for admin alerts)
   */
  async createRoleNotification(
    targetRoles: string[],
    type: NotificationType,
    customData?: Partial<NotificationData>
  ): Promise<void> {
    try {
      // Get all users with target roles
      const usersQuery = query(
        collection(db, 'users'),
        where('role', 'in', targetRoles)
      );

      const usersSnapshot = await getDocs(usersQuery);
      const userIds = usersSnapshot.docs.map(doc => doc.id);

      if (userIds.length > 0) {
        await this.createBulkNotifications(userIds, type, customData);
      }
    } catch (error) {
      console.error('Error creating role notifications:', error);
      throw error;
    }
  }
}

// Convenience functions
export const notificationService = NotificationService.getInstance();

export const createNotification = (
  recipientId: string,
  type: NotificationType,
  customData?: Partial<NotificationData>
) => notificationService.createNotification(recipientId, type, customData);

export const createAdminNotification = (
  type: NotificationType,
  customData?: Partial<NotificationData>
) => notificationService.createRoleNotification(['admin', 'super_admin'], type, customData);

export const createModeratorNotification = (
  type: NotificationType,
  customData?: Partial<NotificationData>
) => notificationService.createRoleNotification(['moderator', 'admin', 'super_admin'], type, customData);

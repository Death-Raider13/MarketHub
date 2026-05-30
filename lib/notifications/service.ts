import { NotificationData, NotificationType, NotificationPriority, NOTIFICATION_TEMPLATES } from './types';
import { getAdminFirestore } from '@/lib/firebase/admin'

// We avoid importing the client `db` at module load to prevent initializing
// the client Firebase SDK during server builds (which can cause invalid API key errors).
// When running on the server (Admin SDK available) we use admin Firestore. Otherwise
// we dynamically import the client `db` at runtime in the browser.

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
        title = title.replace('{creatorName}', metadata.creatorName || '');
        title = title.replace('{storeName}', metadata.storeName || '');
        title = title.replace('{userName}', metadata.userName || '');
        title = title.replace('{orderId}', metadata.orderId || '');
        title = title.replace('{amount}', metadata.amount?.toLocaleString() || '');

        message = message.replace('{productName}', metadata.productName || '');
        message = message.replace('{creatorName}', metadata.creatorName || '');
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

      const adminDb = getAdminFirestore()
      if (adminDb) {
        const docRef = await adminDb.collection('notifications').add({
          ...notification,
          createdAt: notification.createdAt, // Date is stored as Firestore timestamp by Admin SDK
          expiresAt: notification.expiresAt || null,
        })
        return docRef.id
      }

      // Fallback to client SDK in browser only
      const { collection, addDoc, Timestamp } = await import('firebase/firestore')
      const { db } = await import('@/lib/firebase/config')
      const docRef = await addDoc(collection(db, 'notifications'), {
        ...notification,
        createdAt: Timestamp.fromDate(notification.createdAt),
        expiresAt: notification.expiresAt ? Timestamp.fromDate(notification.expiresAt) : null,
      })

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
      const adminDb = getAdminFirestore()
      if (adminDb) {
        let q = adminDb.collection('notifications')
          .where('recipientId', '==', userId)
          .orderBy('createdAt', 'desc')
          .limit(limitCount)

        if (unreadOnly) {
          q = adminDb.collection('notifications')
            .where('recipientId', '==', userId)
            .where('status', '==', 'unread')
            .orderBy('createdAt', 'desc')
            .limit(limitCount)
        }

        const snapshot = await q.get()
        return snapshot.docs.map((docSnapshot: any) => {
          const data = docSnapshot.data()
          return {
            id: docSnapshot.id,
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt || new Date()),
            readAt: data.readAt?.toDate ? data.readAt.toDate() : data.readAt || null,
            expiresAt: data.expiresAt?.toDate ? data.expiresAt.toDate() : data.expiresAt || null,
          } as NotificationData
        })
      }

      // Fallback to client SDK in browser
      const { collection, query, where, orderBy, limit, getDocs } = await import('firebase/firestore')
      const { db } = await import('@/lib/firebase/config')

      let q = query(
        collection(db, 'notifications'),
        where('recipientId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      )

      if (unreadOnly) {
        q = query(
          collection(db, 'notifications'),
          where('recipientId', '==', userId),
          where('status', '==', 'unread'),
          orderBy('createdAt', 'desc'),
          limit(limitCount)
        )
      }

      const snapshot = await getDocs(q)
      return snapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          readAt: data.readAt?.toDate(),
          expiresAt: data.expiresAt?.toDate(),
        } as NotificationData
      })
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
      const adminDb = getAdminFirestore()
      if (adminDb) {
        await adminDb.collection('notifications').doc(notificationId).update({
          status: 'read',
          readAt: new Date(),
        })
        return
      }

      const { doc, updateDoc, Timestamp } = await import('firebase/firestore')
      const { db } = await import('@/lib/firebase/config')
      await updateDoc(doc(db, 'notifications', notificationId), {
        status: 'read',
        readAt: Timestamp.now(),
      })
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
      const adminDb = getAdminFirestore()
      if (adminDb) {
        const snapshot = await adminDb.collection('notifications')
          .where('recipientId', '==', userId)
          .where('status', '==', 'unread')
          .get()

        const promises = snapshot.docs.map((docSnapshot: any) =>
          adminDb.collection('notifications').doc(docSnapshot.id).update({
            status: 'read',
            readAt: new Date(),
          })
        )

        await Promise.all(promises)
        return
      }

      const { collection, query, where, getDocs, updateDoc, doc, Timestamp } = await import('firebase/firestore')
      const { db } = await import('@/lib/firebase/config')
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('recipientId', '==', userId),
        where('status', '==', 'unread')
      )

      const snapshot = await getDocs(notificationsQuery)
      const promises = snapshot.docs.map(docSnapshot =>
        updateDoc(doc(db, 'notifications', docSnapshot.id), {
          status: 'read',
          readAt: Timestamp.now()
        })
      )

      await Promise.all(promises)
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
      const adminDb = getAdminFirestore()
      if (adminDb) {
        await adminDb.collection('notifications').doc(notificationId).delete()
        return
      }

      const { doc, deleteDoc } = await import('firebase/firestore')
      const { db } = await import('@/lib/firebase/config')
      await deleteDoc(doc(db, 'notifications', notificationId))
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
      const adminDb = getAdminFirestore()
      if (adminDb) {
        const snapshot = await adminDb.collection('notifications')
          .where('recipientId', '==', userId)
          .where('status', '==', 'unread')
          .get()
        return snapshot.size
      }

      const { collection, query, where, getDocs } = await import('firebase/firestore')
      const { db } = await import('@/lib/firebase/config')
      const q = query(
        collection(db, 'notifications'),
        where('recipientId', '==', userId),
        where('status', '==', 'unread')
      )

      const snapshot = await getDocs(q)
      return snapshot.size
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
    // Real-time subscriptions require client SDK. Only support in browser.
    if (typeof window === 'undefined') {
      console.warn('subscribeToNotifications is only supported in the browser (client SDK).')
      return () => {}
    }

    // Dynamically import client SDK pieces in browser
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    const setup = async () => {
      const { collection, query, where, orderBy, limit, onSnapshot } = await import('firebase/firestore')
      const { db } = await import('@/lib/firebase/config')

      const q = query(
        collection(db, 'notifications'),
        where('recipientId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      )

      return onSnapshot(q, (snapshot) => {
        const notifications = snapshot.docs.map(doc => {
          const data = doc.data()
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            readAt: data.readAt?.toDate(),
            expiresAt: data.expiresAt?.toDate(),
          } as NotificationData
        })

        callback(notifications)
      })
    }

    let unsub: (() => void) | null = null
    setup().then(u => { unsub = u }).catch(err => console.error(err))

    return () => { if (unsub) unsub() }
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

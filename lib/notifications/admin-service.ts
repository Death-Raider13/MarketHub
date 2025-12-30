import { adminDb } from '@/lib/firebase/admin'
import { NotificationData, NotificationType, NOTIFICATION_TEMPLATES } from './types'

export class AdminNotificationService {
  private static instance: AdminNotificationService

  static getInstance(): AdminNotificationService {
    if (!AdminNotificationService.instance) {
      AdminNotificationService.instance = new AdminNotificationService()
    }
    return AdminNotificationService.instance
  }

  /**
   * Create a new notification using admin SDK
   */
  async createNotification(
    recipientId: string,
    type: NotificationType,
    customData?: Partial<NotificationData>
  ): Promise<string> {
    try {
      const template = NOTIFICATION_TEMPLATES[type]
      
      // Replace placeholders in title and message
      let title = template.title
      let message = template.message
      
      if (customData?.metadata) {
        const metadata = customData.metadata
        
        // Replace common placeholders
        title = title.replace('{productName}', metadata.productName || '')
        title = title.replace('{vendorName}', metadata.vendorName || '')
        title = title.replace('{storeName}', metadata.storeName || '')
        title = title.replace('{userName}', metadata.userName || '')
        title = title.replace('{orderId}', metadata.orderId || '')
        title = title.replace('{amount}', metadata.amount?.toLocaleString() || '')
        title = title.replace('{reportType}', (metadata as any).reportType || '')
        title = title.replace('{reportedItem}', (metadata as any).reportedItem || '')
        title = title.replace('{reportedBy}', (metadata as any).reportedBy || '')
        title = title.replace('{category}', (metadata as any).category || '')
        title = title.replace('{priority}', (metadata as any).priority || '')
        title = title.replace('{status}', (metadata as any).status || '')
        
        message = message.replace('{productName}', metadata.productName || '')
        message = message.replace('{vendorName}', metadata.vendorName || '')
        message = message.replace('{storeName}', metadata.storeName || '')
        message = message.replace('{userName}', metadata.userName || '')
        message = message.replace('{orderId}', metadata.orderId || '')
        message = message.replace('{amount}', metadata.amount?.toLocaleString() || '')
        message = message.replace('{reportType}', (metadata as any).reportType || '')
        message = message.replace('{reportedItem}', (metadata as any).reportedItem || '')
        message = message.replace('{reportedBy}', (metadata as any).reportedBy || '')
        message = message.replace('{category}', (metadata as any).category || '')
        message = message.replace('{priority}', (metadata as any).priority || '')
        message = message.replace('{status}', (metadata as any).status || '')
      }

      const notification: Omit<NotificationData, 'id'> = {
        type,
        title: customData?.title || title,
        message: customData?.message || message,
        priority: customData?.priority || template.priority,
        status: 'unread',
        recipientId,
        recipientRole: customData?.recipientRole || null,
        createdAt: new Date(),
        expiresAt: customData?.expiresAt || null,
        metadata: customData?.metadata || {},
      }

      const docRef = await adminDb.collection('notifications').add(notification)
      return docRef.id
    } catch (error) {
      console.error('Error creating notification with admin SDK:', error)
      throw error
    }
  }

  /**
   * Create bulk notifications for multiple recipients
   */
  async createBulkNotifications(
    recipientIds: string[],
    type: NotificationType,
    customData?: Partial<NotificationData>
  ): Promise<void> {
    try {
      const promises = recipientIds.map(recipientId =>
        this.createNotification(recipientId, type, customData)
      )
      await Promise.all(promises)
    } catch (error) {
      console.error('Error creating bulk notifications:', error)
      throw error
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
      const usersSnapshot = await adminDb
        .collection('users')
        .where('role', 'in', targetRoles)
        .get()

      const userIds = usersSnapshot.docs.map(doc => doc.id)

      if (userIds.length > 0) {
        await this.createBulkNotifications(userIds, type, customData)
      }
    } catch (error) {
      console.error('Error creating role notifications:', error)
      throw error
    }
  }
}

// Convenience functions for server-side use
export const adminNotificationService = AdminNotificationService.getInstance()

export const createAdminNotification = (
  recipientId: string,
  type: NotificationType,
  customData?: Partial<NotificationData>
) => adminNotificationService.createNotification(recipientId, type, customData)

export const createAdminRoleNotification = (
  targetRoles: string[],
  type: NotificationType,
  customData?: Partial<NotificationData>
) => adminNotificationService.createRoleNotification(targetRoles, type, customData)

export const createAdminBulkNotifications = (
  recipientIds: string[],
  type: NotificationType,
  customData?: Partial<NotificationData>
) => adminNotificationService.createBulkNotifications(recipientIds, type, customData)
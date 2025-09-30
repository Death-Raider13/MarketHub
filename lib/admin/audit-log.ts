/**
 * Admin Audit Logging System
 * Track all admin actions for security and compliance
 */

import { collection, addDoc, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export type AuditAction =
  // User Actions
  | 'user.create'
  | 'user.edit'
  | 'user.delete'
  | 'user.ban'
  | 'user.unban'
  | 'user.verify'
  
  // Vendor Actions
  | 'vendor.approve'
  | 'vendor.reject'
  | 'vendor.suspend'
  | 'vendor.unsuspend'
  | 'vendor.edit'
  | 'vendor.delete'
  | 'vendor.commission_change'
  
  // Product Actions
  | 'product.approve'
  | 'product.reject'
  | 'product.edit'
  | 'product.delete'
  | 'product.feature'
  | 'product.unfeature'
  
  // Order Actions
  | 'order.edit'
  | 'order.cancel'
  | 'order.refund'
  
  // Ad Actions
  | 'ad.approve'
  | 'ad.reject'
  | 'ad.pause'
  | 'ad.resume'
  | 'ad.delete'
  
  // Review Actions
  | 'review.approve'
  | 'review.reject'
  | 'review.delete'
  
  // Financial Actions
  | 'payout.process'
  | 'refund.process'
  | 'commission.change'
  
  // Settings Actions
  | 'settings.edit'
  | 'category.create'
  | 'category.edit'
  | 'category.delete'
  
  // Admin Actions
  | 'admin.create'
  | 'admin.edit'
  | 'admin.delete'
  | 'admin.role_change'
  
  // System Actions
  | 'system.backup'
  | 'system.restore'
  | 'system.maintenance';

export interface AuditLog {
  id?: string;
  action: AuditAction;
  adminId: string;
  adminEmail: string;
  adminRole: string;
  targetType: 'user' | 'vendor' | 'product' | 'order' | 'ad' | 'review' | 'admin' | 'system' | 'settings';
  targetId: string;
  targetName?: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  success: boolean;
  errorMessage?: string;
}

/**
 * Log an admin action
 */
export async function logAdminAction(log: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void> {
  try {
    await addDoc(collection(db, 'audit_logs'), {
      ...log,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Failed to log admin action:', error);
    // Don't throw - logging failure shouldn't break the action
  }
}

/**
 * Get audit logs with filters
 */
export async function getAuditLogs(filters: {
  adminId?: string;
  action?: AuditAction;
  targetType?: string;
  targetId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}): Promise<AuditLog[]> {
  try {
    let q = query(collection(db, 'audit_logs'));

    if (filters.adminId) {
      q = query(q, where('adminId', '==', filters.adminId));
    }

    if (filters.action) {
      q = query(q, where('action', '==', filters.action));
    }

    if (filters.targetType) {
      q = query(q, where('targetType', '==', filters.targetType));
    }

    if (filters.targetId) {
      q = query(q, where('targetId', '==', filters.targetId));
    }

    if (filters.startDate) {
      q = query(q, where('timestamp', '>=', filters.startDate));
    }

    if (filters.endDate) {
      q = query(q, where('timestamp', '<=', filters.endDate));
    }

    q = query(q, orderBy('timestamp', 'desc'));

    if (filters.limit) {
      q = query(q, limit(filters.limit));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp.toDate(),
    })) as AuditLog[];
  } catch (error) {
    console.error('Failed to get audit logs:', error);
    return [];
  }
}

/**
 * Get recent admin activity
 */
export async function getRecentAdminActivity(limitCount: number = 50): Promise<AuditLog[]> {
  return getAuditLogs({ limit: limitCount });
}

/**
 * Get admin's activity history
 */
export async function getAdminActivityHistory(adminId: string, limitCount: number = 100): Promise<AuditLog[]> {
  return getAuditLogs({ adminId, limit: limitCount });
}

/**
 * Get activity for a specific target
 */
export async function getTargetActivityHistory(
  targetType: string,
  targetId: string,
  limitCount: number = 50
): Promise<AuditLog[]> {
  return getAuditLogs({ targetType, targetId, limit: limitCount });
}

/**
 * Action descriptions for UI
 */
export const ACTION_DESCRIPTIONS: Record<AuditAction, string> = {
  'user.create': 'Created user account',
  'user.edit': 'Edited user information',
  'user.delete': 'Deleted user account',
  'user.ban': 'Banned user',
  'user.unban': 'Unbanned user',
  'user.verify': 'Verified user account',
  
  'vendor.approve': 'Approved vendor application',
  'vendor.reject': 'Rejected vendor application',
  'vendor.suspend': 'Suspended vendor account',
  'vendor.unsuspend': 'Unsuspended vendor account',
  'vendor.edit': 'Edited vendor information',
  'vendor.delete': 'Deleted vendor account',
  'vendor.commission_change': 'Changed vendor commission rate',
  
  'product.approve': 'Approved product',
  'product.reject': 'Rejected product',
  'product.edit': 'Edited product',
  'product.delete': 'Deleted product',
  'product.feature': 'Featured product',
  'product.unfeature': 'Unfeatured product',
  
  'order.edit': 'Edited order',
  'order.cancel': 'Cancelled order',
  'order.refund': 'Processed refund',
  
  'ad.approve': 'Approved advertisement',
  'ad.reject': 'Rejected advertisement',
  'ad.pause': 'Paused advertisement',
  'ad.resume': 'Resumed advertisement',
  'ad.delete': 'Deleted advertisement',
  
  'review.approve': 'Approved review',
  'review.reject': 'Rejected review',
  'review.delete': 'Deleted review',
  
  'payout.process': 'Processed vendor payout',
  'refund.process': 'Processed customer refund',
  'commission.change': 'Changed commission rate',
  
  'settings.edit': 'Updated platform settings',
  'category.create': 'Created category',
  'category.edit': 'Edited category',
  'category.delete': 'Deleted category',
  
  'admin.create': 'Created admin account',
  'admin.edit': 'Edited admin account',
  'admin.delete': 'Deleted admin account',
  'admin.role_change': 'Changed admin role',
  
  'system.backup': 'Created system backup',
  'system.restore': 'Restored from backup',
  'system.maintenance': 'Performed system maintenance',
};

/**
 * Helper to create audit log entry
 */
export function createAuditLog(
  action: AuditAction,
  adminId: string,
  adminEmail: string,
  adminRole: string,
  targetType: AuditLog['targetType'],
  targetId: string,
  details: Record<string, any>,
  ipAddress: string,
  userAgent: string,
  success: boolean = true,
  errorMessage?: string
): Omit<AuditLog, 'id' | 'timestamp'> {
  return {
    action,
    adminId,
    adminEmail,
    adminRole,
    targetType,
    targetId,
    details,
    ipAddress,
    userAgent,
    success,
    errorMessage,
  };
}

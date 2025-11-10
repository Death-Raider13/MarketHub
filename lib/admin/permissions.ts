/**
 * Admin Permission System for Nigerian E-commerce Platform
 * Role-based access control with granular permissions
 */

export type AdminRole = 'super_admin' | 'admin' | 'moderator' | 'support';

export type Permission =
  // User Management
  | 'users.view'
  | 'users.create'
  | 'users.edit'
  | 'users.delete'
  | 'users.ban'
  | 'users.verify'
  
  // Vendor Management
  | 'vendors.view'
  | 'vendors.approve'
  | 'vendors.reject'
  | 'vendors.suspend'
  | 'vendors.edit'
  | 'vendors.delete'
  | 'vendors.verify'
  | 'vendors.commission'
  
  // Product Management
  | 'products.view'
  | 'products.approve'
  | 'products.reject'
  | 'products.edit'
  | 'products.delete'
  | 'products.feature'
  
  // Order Management
  | 'orders.view'
  | 'orders.edit'
  | 'orders.cancel'
  | 'orders.refund'
  | 'orders.export'
  
  // Advertisement Management
  | 'ads.view'
  | 'ads.approve'
  | 'ads.reject'
  | 'ads.pause'
  | 'ads.delete'
  
  // Review Management
  | 'reviews.view'
  | 'reviews.approve'
  | 'reviews.reject'
  | 'reviews.delete'
  
  // Financial Management
  | 'finance.view'
  | 'finance.payouts'
  | 'finance.refunds'
  | 'finance.reports'
  | 'finance.settings'
  
  // Platform Settings
  | 'settings.view'
  | 'settings.edit'
  | 'settings.categories'
  | 'settings.shipping'
  | 'settings.payment'
  
  // Analytics
  | 'analytics.view'
  | 'analytics.export'
  
  // System Management
  | 'system.logs'
  | 'system.backup'
  | 'system.maintenance'
  
  // Admin Management
  | 'admins.view'
  | 'admins.create'
  | 'admins.edit'
  | 'admins.delete';

/**
 * Role-based permission mapping
 */
export const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  super_admin: [
    // Full access to everything
    'users.view', 'users.create', 'users.edit', 'users.delete', 'users.ban', 'users.verify',
    'vendors.view', 'vendors.approve', 'vendors.reject', 'vendors.suspend', 'vendors.edit', 'vendors.delete', 'vendors.verify', 'vendors.commission',
    'products.view', 'products.approve', 'products.reject', 'products.edit', 'products.delete', 'products.feature',
    'orders.view', 'orders.edit', 'orders.cancel', 'orders.refund', 'orders.export',
    'ads.view', 'ads.approve', 'ads.reject', 'ads.pause', 'ads.delete',
    'reviews.view', 'reviews.approve', 'reviews.reject', 'reviews.delete',
    'finance.view', 'finance.payouts', 'finance.refunds', 'finance.reports', 'finance.settings',
    'settings.view', 'settings.edit', 'settings.categories', 'settings.shipping', 'settings.payment',
    'analytics.view', 'analytics.export',
    'system.logs', 'system.backup', 'system.maintenance',
    'admins.view', 'admins.create', 'admins.edit', 'admins.delete',
  ],
  
  admin: [
    // Most permissions except system and admin management
    'users.view', 'users.edit', 'users.ban', 'users.verify',
    'vendors.view', 'vendors.approve', 'vendors.reject', 'vendors.suspend', 'vendors.edit', 'vendors.verify',
    'products.view', 'products.approve', 'products.reject', 'products.edit', 'products.delete', 'products.feature',
    'orders.view', 'orders.edit', 'orders.cancel', 'orders.refund', 'orders.export',
    'ads.view', 'ads.approve', 'ads.reject', 'ads.pause', 'ads.delete',
    'reviews.view', 'reviews.approve', 'reviews.reject', 'reviews.delete',
    'finance.view', 'finance.payouts', 'finance.refunds', 'finance.reports',
    'settings.view', 'settings.edit', 'settings.categories', 'settings.shipping',
    'analytics.view', 'analytics.export',
    'system.logs',
  ],
  
  moderator: [
    // Content moderation focused
    'users.view', 'users.ban',
    'vendors.view',
    'products.view', 'products.approve', 'products.reject',
    'orders.view',
    'ads.view', 'ads.approve', 'ads.reject',
    'reviews.view', 'reviews.approve', 'reviews.reject', 'reviews.delete',
    'analytics.view',
  ],
  
  support: [
    // Customer support focused
    'users.view',
    'vendors.view',
    'products.view',
    'orders.view', 'orders.edit',
    'reviews.view',
    'analytics.view',
  ],
};

/**
 * Role hierarchy for permission checks
 */
const ROLE_HIERARCHY: Record<AdminRole, number> = {
  'super_admin': 4,
  'admin': 3,
  'moderator': 2,
  'support': 1,
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: AdminRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

/**
 * Check if a role can manage another role (hierarchical check)
 */
export function canManageRole(managerRole: AdminRole, targetRole: AdminRole): boolean {
  return ROLE_HIERARCHY[managerRole] > ROLE_HIERARCHY[targetRole];
}

/**
 * Check if a role can perform an action on a specific user role
 */
export function canManageUser(managerRole: AdminRole, targetUserRole: AdminRole, permission: Permission): boolean {
  // Must have the base permission
  if (!hasPermission(managerRole, permission)) {
    return false;
  }
  
  // Super admin can manage anyone
  if (managerRole === 'super_admin') {
    return true;
  }
  
  // Cannot manage users of same or higher role
  if (ROLE_HIERARCHY[managerRole] <= ROLE_HIERARCHY[targetUserRole]) {
    return false;
  }
  
  return true;
}

/**
 * Check if a role has any of the specified permissions
 */
export function hasAnyPermission(role: AdminRole, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(role, permission));
}

/**
 * Check if a role has all of the specified permissions
 */
export function hasAllPermissions(role: AdminRole, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(role, permission));
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: AdminRole): Permission[] {
  return ROLE_PERMISSIONS[role];
}

/**
 * Permission descriptions for UI
 */
export const PERMISSION_DESCRIPTIONS: Record<Permission, string> = {
  'users.view': 'View user accounts',
  'users.create': 'Create new user accounts',
  'users.edit': 'Edit user information',
  'users.delete': 'Delete user accounts',
  'users.ban': 'Ban/suspend users',
  'users.verify': 'Verify user accounts',
  
  'vendors.view': 'View vendor accounts',
  'vendors.approve': 'Approve vendor applications',
  'vendors.reject': 'Reject vendor applications',
  'vendors.suspend': 'Suspend vendor accounts',
  'vendors.edit': 'Edit vendor information',
  'vendors.delete': 'Delete vendor accounts',
  'vendors.verify': 'Verify vendor accounts',
  'vendors.commission': 'Manage vendor commission rates',
  
  'products.view': 'View all products',
  'products.approve': 'Approve products',
  'products.reject': 'Reject products',
  'products.edit': 'Edit product information',
  'products.delete': 'Delete products',
  'products.feature': 'Feature products on homepage',
  
  'orders.view': 'View all orders',
  'orders.edit': 'Edit order information',
  'orders.cancel': 'Cancel orders',
  'orders.refund': 'Process refunds',
  'orders.export': 'Export order data',
  
  'ads.view': 'View advertisements',
  'ads.approve': 'Approve ad campaigns',
  'ads.reject': 'Reject ad campaigns',
  'ads.pause': 'Pause ad campaigns',
  'ads.delete': 'Delete advertisements',
  
  'reviews.view': 'View all reviews',
  'reviews.approve': 'Approve reviews',
  'reviews.reject': 'Reject reviews',
  'reviews.delete': 'Delete reviews',
  
  'finance.view': 'View financial data',
  'finance.payouts': 'Process vendor payouts',
  'finance.refunds': 'Process customer refunds',
  'finance.reports': 'Generate financial reports',
  'finance.settings': 'Manage financial settings',
  
  'settings.view': 'View platform settings',
  'settings.edit': 'Edit platform settings',
  'settings.categories': 'Manage categories',
  'settings.shipping': 'Manage shipping settings',
  'settings.payment': 'Manage payment settings',
  
  'analytics.view': 'View analytics dashboard',
  'analytics.export': 'Export analytics data',
  
  'system.logs': 'View system logs',
  'system.backup': 'Create system backups',
  'system.maintenance': 'Perform system maintenance',
  
  'admins.view': 'View admin accounts',
  'admins.create': 'Create admin accounts',
  'admins.edit': 'Edit admin accounts',
  'admins.delete': 'Delete admin accounts',
};

/**
 * Permission categories for UI organization
 */
export const PERMISSION_CATEGORIES = {
  'User Management': [
    'users.view', 'users.create', 'users.edit', 'users.delete', 'users.ban', 'users.verify'
  ] as Permission[],
  'Vendor Management': [
    'vendors.view', 'vendors.approve', 'vendors.reject', 'vendors.suspend', 
    'vendors.edit', 'vendors.delete', 'vendors.verify', 'vendors.commission'
  ] as Permission[],
  'Product Management': [
    'products.view', 'products.approve', 'products.reject', 'products.edit', 
    'products.delete', 'products.feature'
  ] as Permission[],
  'Order Management': [
    'orders.view', 'orders.edit', 'orders.cancel', 'orders.refund', 'orders.export'
  ] as Permission[],
  'Advertisement Management': [
    'ads.view', 'ads.approve', 'ads.reject', 'ads.pause', 'ads.delete'
  ] as Permission[],
  'Review Management': [
    'reviews.view', 'reviews.approve', 'reviews.reject', 'reviews.delete'
  ] as Permission[],
  'Financial Management': [
    'finance.view', 'finance.payouts', 'finance.refunds', 'finance.reports', 'finance.settings'
  ] as Permission[],
  'Platform Settings': [
    'settings.view', 'settings.edit', 'settings.categories', 'settings.shipping', 'settings.payment'
  ] as Permission[],
  'Analytics': [
    'analytics.view', 'analytics.export'
  ] as Permission[],
  'System Management': [
    'system.logs', 'system.backup', 'system.maintenance'
  ] as Permission[],
  'Admin Management': [
    'admins.view', 'admins.create', 'admins.edit', 'admins.delete'
  ] as Permission[],
};

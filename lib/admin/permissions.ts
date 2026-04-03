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

  // creator Management
  | 'creators.view'
  | 'creators.approve'
  | 'creators.reject'
  | 'creators.suspend'
  | 'creators.edit'
  | 'creators.delete'
  | 'creators.verify'
  | 'creators.commission'

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
    'creators.view', 'creators.approve', 'creators.reject', 'creators.suspend', 'creators.edit', 'creators.delete', 'creators.verify', 'creators.commission',
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
    'creators.view', 'creators.approve', 'creators.reject', 'creators.suspend', 'creators.edit', 'creators.verify',
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
    'creators.view',
    'products.view', 'products.approve', 'products.reject',
    'orders.view',
    'ads.view', 'ads.approve', 'ads.reject',
    'reviews.view', 'reviews.approve', 'reviews.reject', 'reviews.delete',
    'analytics.view',
  ],

  support: [
    // Customer support focused
    'users.view',
    'creators.view',
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
 *
 * This is defensive: if an unknown/non-admin role is passed, we log a warning
 * in development and simply return false instead of throwing at runtime.
 */
export function hasPermission(role: AdminRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role];

  if (!permissions) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[permissions] hasPermission called with unknown role:', role);
    }
    return false;
  }

  return permissions.includes(permission);
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
  const rolePermissions = ROLE_PERMISSIONS[role];

  if (!rolePermissions) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[permissions] hasAnyPermission called with unknown role:', role);
    }
    return false;
  }

  return permissions.some(permission => rolePermissions.includes(permission));
}

/**
 * Check if a role has all of the specified permissions
 */
export function hasAllPermissions(role: AdminRole, permissions: Permission[]): boolean {
  const rolePermissions = ROLE_PERMISSIONS[role];

  if (!rolePermissions) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[permissions] hasAllPermissions called with unknown role:', role);
    }
    return false;
  }

  return permissions.every(permission => rolePermissions.includes(permission));
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: AdminRole): Permission[] {
  const permissions = ROLE_PERMISSIONS[role];

  if (!permissions) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[permissions] getRolePermissions called with unknown role:', role);
    }
    return [];
  }

  return permissions;
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

  'creators.view': 'View creator accounts',
  'creators.approve': 'Approve creator applications',
  'creators.reject': 'Reject creator applications',
  'creators.suspend': 'Suspend creator accounts',
  'creators.edit': 'Edit creator information',
  'creators.delete': 'Delete creator accounts',
  'creators.verify': 'Verify creator accounts',
  'creators.commission': 'Manage creator commission rates',

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
  'finance.payouts': 'Process creator payouts',
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
  'creator Management': [
    'creators.view', 'creators.approve', 'creators.reject', 'creators.suspend',
    'creators.edit', 'creators.delete', 'creators.verify', 'creators.commission'
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

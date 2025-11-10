import { useAuth } from '@/lib/firebase/auth-context';
import { hasPermission, hasAnyPermission, hasAllPermissions, canManageUser, Permission, AdminRole } from '@/lib/admin/permissions';

export function usePermissions() {
  const { userProfile } = useAuth();
  
  const userRole = userProfile?.role as AdminRole;
  
  const checkPermission = (permission: Permission): boolean => {
    if (!userRole) return false;
    return hasPermission(userRole, permission);
  };
  
  const checkAnyPermission = (permissions: Permission[]): boolean => {
    if (!userRole) return false;
    return hasAnyPermission(userRole, permissions);
  };
  
  const checkAllPermissions = (permissions: Permission[]): boolean => {
    if (!userRole) return false;
    return hasAllPermissions(userRole, permissions);
  };
  
  const canManageUserRole = (targetUserRole: AdminRole, permission: Permission): boolean => {
    if (!userRole) return false;
    return canManageUser(userRole, targetUserRole, permission);
  };
  
  const canAccess = {
    // User Management
    viewUsers: () => checkPermission('users.view'),
    createUsers: () => checkPermission('users.create'),
    editUsers: () => checkPermission('users.edit'),
    deleteUsers: () => checkPermission('users.delete'),
    banUsers: () => checkPermission('users.ban'),
    
    // Vendor Management
    viewVendors: () => checkPermission('vendors.view'),
    approveVendors: () => checkPermission('vendors.approve'),
    editVendors: () => checkPermission('vendors.edit'),
    deleteVendors: () => checkPermission('vendors.delete'),
    
    // Product Management
    viewProducts: () => checkPermission('products.view'),
    approveProducts: () => checkPermission('products.approve'),
    editProducts: () => checkPermission('products.edit'),
    deleteProducts: () => checkPermission('products.delete'),
    
    // Order Management
    viewOrders: () => checkPermission('orders.view'),
    editOrders: () => checkPermission('orders.edit'),
    refundOrders: () => checkPermission('orders.refund'),
    
    // Advertisement Management
    viewAds: () => checkPermission('ads.view'),
    approveAds: () => checkPermission('ads.approve'),
    pauseAds: () => checkPermission('ads.pause'),
    
    // Review Management
    viewReviews: () => checkPermission('reviews.view'),
    approveReviews: () => checkPermission('reviews.approve'),
    deleteReviews: () => checkPermission('reviews.delete'),
    
    // Financial Management
    viewFinance: () => checkPermission('finance.view'),
    processPayouts: () => checkPermission('finance.payouts'),
    viewReports: () => checkPermission('finance.reports'),
    
    // Analytics
    viewAnalytics: () => checkPermission('analytics.view'),
    exportAnalytics: () => checkPermission('analytics.export'),
    
    // Settings
    viewSettings: () => checkPermission('settings.view'),
    editSettings: () => checkPermission('settings.edit'),
    
    // System Management
    viewLogs: () => checkPermission('system.logs'),
    systemMaintenance: () => checkPermission('system.maintenance'),
    
    // Admin Management
    viewAdmins: () => checkPermission('admins.view'),
    createAdmins: () => checkPermission('admins.create'),
    editAdmins: () => checkPermission('admins.edit'),
    deleteAdmins: () => checkPermission('admins.delete'),
  };
  
  return {
    userRole,
    checkPermission,
    checkAnyPermission,
    checkAllPermissions,
    canManageUserRole,
    canAccess,
  };
}

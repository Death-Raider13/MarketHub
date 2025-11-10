'use client';

import { ReactNode } from 'react';
import { usePermissions } from '@/hooks/use-permissions';
import { Permission } from '@/lib/admin/permissions';

interface PermissionGuardProps {
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
  fallback?: ReactNode;
  children: ReactNode;
}

export function PermissionGuard({ 
  permission, 
  permissions, 
  requireAll = false, 
  fallback = null, 
  children 
}: PermissionGuardProps) {
  const { checkPermission, checkAnyPermission, checkAllPermissions } = usePermissions();
  
  let hasAccess = false;
  
  if (permission) {
    hasAccess = checkPermission(permission);
  } else if (permissions) {
    hasAccess = requireAll 
      ? checkAllPermissions(permissions)
      : checkAnyPermission(permissions);
  }
  
  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

// Convenience components for common use cases
export function AdminOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGuard permission="admins.view" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function SuperAdminOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const { userRole } = usePermissions();
  
  if (userRole !== 'super_admin') {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

export function ModeratorOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGuard 
      permissions={['products.approve', 'reviews.approve', 'ads.approve']} 
      fallback={fallback}
    >
      {children}
    </PermissionGuard>
  );
}

"use client"

import type React from "react"

import { useAuth, type UserRole } from "./auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Permission, hasPermission, AdminRole } from "@/lib/admin/permissions"

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
  requiredPermission?: Permission
  requiredPermissions?: Permission[]
  requireAllPermissions?: boolean
  redirectTo?: string
}

export function ProtectedRoute({ 
  children, 
  allowedRoles, 
  requiredPermission,
  requiredPermissions,
  requireAllPermissions = false,
  redirectTo = "/auth/login" 
}: ProtectedRouteProps) {
  const { user, userProfile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      // User not logged in
      if (!user) {
        console.log('ProtectedRoute: No user, redirecting to', redirectTo)
        router.push(redirectTo)
        return
      }

      // User logged in but profile not loaded yet
      if (!userProfile) {
        console.log('ProtectedRoute: User exists but profile not loaded yet')
        return
      }

      // Check role permissions (legacy support)
      if (allowedRoles && !allowedRoles.includes(userProfile.role)) {
        console.log('ProtectedRoute: Access denied. User role:', userProfile.role, 'Allowed roles:', allowedRoles)
        router.push("/")
        return
      }

      // Check granular permissions
      const userRole = userProfile.role as AdminRole
      
      if (requiredPermission && !hasPermission(userRole, requiredPermission)) {
        console.log('ProtectedRoute: Permission denied. Required:', requiredPermission)
        router.push("/admin/dashboard")
        return
      }

      if (requiredPermissions) {
        const hasAccess = requireAllPermissions
          ? requiredPermissions.every(perm => hasPermission(userRole, perm))
          : requiredPermissions.some(perm => hasPermission(userRole, perm))
        
        if (!hasAccess) {
          console.log('ProtectedRoute: Permissions denied. Required:', requiredPermissions)
          router.push("/admin/dashboard")
          return
        }
      }

      console.log('ProtectedRoute: Access granted. User role:', userProfile.role)
    }
  }, [user, userProfile, loading, allowedRoles, requiredPermission, requiredPermissions, requireAllPermissions, redirectTo, router])

  // Show loading spinner while checking auth
  if (loading || !userProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  // User not logged in
  if (!user) {
    return null
  }

  // User doesn't have required role (legacy support)
  if (allowedRoles && !allowedRoles.includes(userProfile.role)) {
    return null
  }

  // Check granular permissions
  const userRole = userProfile.role as AdminRole
  
  if (requiredPermission && !hasPermission(userRole, requiredPermission)) {
    return null
  }

  if (requiredPermissions) {
    const hasAccess = requireAllPermissions
      ? requiredPermissions.every(perm => hasPermission(userRole, perm))
      : requiredPermissions.some(perm => hasPermission(userRole, perm))
    
    if (!hasAccess) {
      return null
    }
  }

  // All checks passed, render children
  return <>{children}</>
}

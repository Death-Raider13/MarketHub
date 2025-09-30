"use client"

import type React from "react"

import { useAuth, type UserRole } from "./auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
  redirectTo?: string
}

export function ProtectedRoute({ children, allowedRoles, redirectTo = "/auth/login" }: ProtectedRouteProps) {
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

      // Check role permissions
      if (allowedRoles && !allowedRoles.includes(userProfile.role)) {
        console.log('ProtectedRoute: Access denied. User role:', userProfile.role, 'Allowed roles:', allowedRoles)
        router.push("/")
        return
      }

      console.log('ProtectedRoute: Access granted. User role:', userProfile.role)
    }
  }, [user, userProfile, loading, allowedRoles, redirectTo, router])

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

  // User doesn't have required role
  if (allowedRoles && !allowedRoles.includes(userProfile.role)) {
    return null
  }

  // All checks passed, render children
  return <>{children}</>
}

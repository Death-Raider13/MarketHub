import { NextRequest } from "next/server"
import { getAdminAuth, getAdminFirestore } from "@/lib/firebase/admin"
import { AdminRole, hasPermission, type Permission } from "@/lib/admin/permissions"

export interface AdminUser {
  uid: string
  email: string
  role: AdminRole
  permissions: string[]
  displayName?: string
}

export interface AuthResult {
  success: boolean
  user?: AdminUser
  error?: string
}

/**
 * Verify admin authentication from request headers. When supplied, the
 * permission is checked against the canonical role matrix on the server.
 */
export async function verifyAdminAuth(request: NextRequest, requiredPermission?: Permission): Promise<AuthResult> {
  try {
    const adminAuth = getAdminAuth()
    const adminDb = getAdminFirestore()

    if (!adminAuth || !adminDb) {
      return { success: false, error: "Server configuration error" }
    }

    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { success: false, error: "Missing or invalid authorization header" }
    }

    const idToken = authHeader.substring(7)
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    if (!decodedToken.uid) return { success: false, error: "Invalid token" }

    const userDoc = await adminDb.collection("users").doc(decodedToken.uid).get()
    if (!userDoc.exists) return { success: false, error: "User not found" }

    const userData = userDoc.data()
    const adminRoles = ['admin', 'super_admin', 'moderator', 'support']
    if (!userData?.role || !adminRoles.includes(userData.role)) {
      return { success: false, error: "Insufficient permissions - admin role required" }
    }

    const role = userData.role as AdminRole
    if (requiredPermission && !hasPermission(role, requiredPermission)) {
      return { success: false, error: `Insufficient permissions - ${requiredPermission} required` }
    }

    return {
      success: true,
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email || userData.email,
        role,
        permissions: userData.permissions || [],
        displayName: userData.displayName || decodedToken.name
      }
    }
  } catch (error) {
    console.error("Error verifying admin auth:", error)
    return { success: false, error: "Authentication failed" }
  }
}

/** Verify admin authentication for client-side requests. */
export async function verifyClientAdminAuth(idToken: string): Promise<AuthResult> {
  try {
    const adminAuth = getAdminAuth()
    const adminDb = getAdminFirestore()

    if (!adminAuth || !adminDb) return { success: false, error: "Server configuration error" }

    const decodedToken = await adminAuth.verifyIdToken(idToken)
    if (!decodedToken.uid) return { success: false, error: "Invalid token" }

    const userDoc = await adminDb.collection("users").doc(decodedToken.uid).get()
    if (!userDoc.exists) return { success: false, error: "User not found" }

    const userData = userDoc.data()
    const adminRoles = ['admin', 'super_admin', 'moderator', 'support']
    if (!userData?.role || !adminRoles.includes(userData.role)) {
      return { success: false, error: "Insufficient permissions - admin role required" }
    }

    return {
      success: true,
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email || userData.email,
        role: userData.role as AdminRole,
        permissions: userData.permissions || [],
        displayName: userData.displayName || decodedToken.name
      }
    }
  } catch (error) {
    console.error("Error verifying client admin auth:", error)
    return { success: false, error: "Authentication failed" }
  }
}

import { NextRequest } from "next/server"
import { getAdminAuth, getAdminFirestore } from "@/lib/firebase/admin"
import { AdminRole } from "@/lib/admin/permissions"

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
 * Verify admin authentication from request headers
 */
export async function verifyAdminAuth(request: NextRequest): Promise<AuthResult> {
  try {
    const adminAuth = getAdminAuth()
    const adminDb = getAdminFirestore()
    
    if (!adminAuth || !adminDb) {
      return {
        success: false,
        error: "Server configuration error"
      }
    }

    // Get authorization header
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return {
        success: false,
        error: "Missing or invalid authorization header"
      }
    }

    const idToken = authHeader.substring(7) // Remove "Bearer " prefix

    // Verify the ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    
    if (!decodedToken.uid) {
      return {
        success: false,
        error: "Invalid token"
      }
    }

    // Get admin user data from Firestore
    const adminDoc = await adminDb.collection("admins").doc(decodedToken.uid).get()
    
    if (!adminDoc.exists) {
      return {
        success: false,
        error: "Admin user not found"
      }
    }

    const adminData = adminDoc.data()
    if (!adminData || !adminData.role || adminData.status !== 'active') {
      return {
        success: false,
        error: "Admin user inactive or invalid"
      }
    }

    return {
      success: true,
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email || adminData.email,
        role: adminData.role as AdminRole,
        permissions: adminData.permissions || [],
        displayName: adminData.displayName || decodedToken.name
      }
    }
  } catch (error) {
    console.error("Error verifying admin auth:", error)
    return {
      success: false,
      error: "Authentication failed"
    }
  }
}

/**
 * Verify admin authentication for client-side requests
 */
export async function verifyClientAdminAuth(idToken: string): Promise<AuthResult> {
  try {
    const adminAuth = getAdminAuth()
    const adminDb = getAdminFirestore()
    
    if (!adminAuth || !adminDb) {
      return {
        success: false,
        error: "Server configuration error"
      }
    }

    // Verify the ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    
    if (!decodedToken.uid) {
      return {
        success: false,
        error: "Invalid token"
      }
    }

    // Get admin user data from Firestore
    const adminDoc = await adminDb.collection("admins").doc(decodedToken.uid).get()
    
    if (!adminDoc.exists) {
      return {
        success: false,
        error: "Admin user not found"
      }
    }

    const adminData = adminDoc.data()
    if (!adminData || !adminData.role || adminData.status !== 'active') {
      return {
        success: false,
        error: "Admin user inactive or invalid"
      }
    }

    return {
      success: true,
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email || adminData.email,
        role: adminData.role as AdminRole,
        permissions: adminData.permissions || [],
        displayName: adminData.displayName || decodedToken.name
      }
    }
  } catch (error) {
    console.error("Error verifying client admin auth:", error)
    return {
      success: false,
      error: "Authentication failed"
    }
  }
}

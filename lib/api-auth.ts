/**
 * API Route Authentication Middleware
 * Verifies Firebase Auth tokens on protected API routes
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuth } from '@/lib/firebase/admin-simple'

export interface AuthenticatedRequest {
  uid: string
  email?: string
  role?: string
}

/**
 * Verify the Firebase ID token from the Authorization header.
 * Returns the decoded token payload or a 401 response.
 */
export async function verifyAuthToken(
  request: NextRequest
): Promise<{ user: AuthenticatedRequest } | { error: NextResponse }> {
  const authHeader = request.headers.get('Authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    return {
      error: NextResponse.json(
        { error: 'Missing or invalid Authorization header' },
        { status: 401 }
      ),
    }
  }

  const idToken = authHeader.split('Bearer ')[1]

  try {
    const adminAuth = getAdminAuth()
    if (!adminAuth) {
      console.error('Firebase Admin Auth not initialized')
      return {
        error: NextResponse.json(
          { error: 'Server authentication configuration error' },
          { status: 500 }
        ),
      }
    }

    const decodedToken = await adminAuth.verifyIdToken(idToken)

    return {
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        role: decodedToken.role as string | undefined,
      },
    }
  } catch (error) {
    console.error('Token verification failed:', error)
    return {
      error: NextResponse.json(
        { error: 'Invalid or expired authentication token' },
        { status: 401 }
      ),
    }
  }
}

/**
 * Dev-only guard: returns a 404 in production to hide debug endpoints.
 */
export function devOnlyGuard(): NextResponse | null {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return null
}

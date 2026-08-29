import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth, type Auth } from 'firebase-admin/auth'

let adminDb: any = null
let adminAuth: Auth | null = null

/**
 * Get Firestore instance with admin privileges
 * Simple version that uses service account credentials from env
 */
export function getAdminFirestore() {
  if (adminDb) {
    return adminDb
  }

  try {
    // Check if already initialized
    const existingApps = getApps()
    if (existingApps.length > 0) {
      adminDb = getFirestore(existingApps[0])
      return adminDb
    }

    // Prefer a complete service-account JSON, but also support the individual
    // variables commonly configured in Vercel projects.
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
    const serviceAccount = serviceAccountJson
      ? JSON.parse(serviceAccountJson)
      : {
          project_id: process.env.FIREBASE_ADMIN_PROJECT_ID,
          client_email: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
          private_key: process.env.FIREBASE_ADMIN_PRIVATE_KEY,
        }

    if (!serviceAccount.project_id || !serviceAccount.client_email || !serviceAccount.private_key) {
      console.error('❌ Firebase Admin credentials are missing. Configure FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY.')
      return null
    }

    // Vercel commonly stores escaped newline characters in environment values.
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n')

    const app = initializeApp({
      credential: cert(serviceAccount),
    })

    adminDb = getFirestore(app)
    console.log('✅ Firebase Admin SDK initialized successfully')
    return adminDb
  } catch (error: any) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', error.message)
    return null
  }
}

export function isAdminAvailable(): boolean {
  return getAdminFirestore() !== null
}

/**
 * Get Firebase Admin Auth instance for token verification
 */
export function getAdminAuth(): Auth | null {
  if (adminAuth) {
    return adminAuth
  }

  try {
    const existingApps = getApps()
    if (existingApps.length > 0) {
      adminAuth = getAuth(existingApps[0])
      return adminAuth
    }

    // Ensure admin is initialized by calling getAdminFirestore first
    getAdminFirestore()
    const apps = getApps()
    if (apps.length > 0) {
      adminAuth = getAuth(apps[0])
      return adminAuth
    }

    return null
  } catch (error: any) {
    console.error('Failed to get Admin Auth:', error.message)
    return null
  }
}

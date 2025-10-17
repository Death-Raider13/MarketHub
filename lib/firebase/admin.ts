import { initializeApp, getApps, cert, App } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

let adminApp: App | undefined

/**
 * Initialize Firebase Admin SDK for server-side operations
 * This allows us to bypass Firestore security rules when needed
 */
export function getAdminApp() {
  if (adminApp) {
    return adminApp
  }

  // Check if already initialized
  const existingApps = getApps()
  if (existingApps.length > 0) {
    adminApp = existingApps[0]
    return adminApp
  }

  // Initialize with service account credentials
  try {
    // Try to parse from JSON string first
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
    
    if (serviceAccountJson) {
      try {
        const serviceAccount = JSON.parse(serviceAccountJson)
        
        adminApp = initializeApp({
          credential: cert({
            projectId: serviceAccount.project_id,
            clientEmail: serviceAccount.client_email,
            privateKey: serviceAccount.private_key,
          }),
        })

        console.log('✅ Firebase Admin SDK initialized successfully from JSON')
        return adminApp
      } catch (parseError) {
        console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:', parseError)
      }
    }
    
    // Fallback to individual env vars
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')

    if (!projectId || !clientEmail || !privateKey) {
      console.warn('⚠️ Firebase Admin SDK credentials not found. Using Firestore with client SDK.')
      console.warn('⚠️ This may cause permission issues for server-side operations.')
      return undefined
    }

    adminApp = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    })

    console.log('✅ Firebase Admin SDK initialized successfully')
    return adminApp
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', error)
    return undefined
  }
}

/**
 * Get Firestore instance with admin privileges
 * This bypasses security rules and should only be used in server-side API routes
 */
export function getAdminFirestore() {
  const app = getAdminApp()
  if (!app) {
    return null
  }
  return getFirestore(app)
}

/**
 * Check if Firebase Admin SDK is available
 */
export function isAdminAvailable(): boolean {
  return getAdminApp() !== undefined
}

/**
 * Export adminDb for convenience
 */
export const adminDb = getAdminFirestore()!

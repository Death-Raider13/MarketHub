import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

let adminDb: any = null

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

    // Parse service account from environment variable
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
    
    if (!serviceAccountJson) {
      console.error('❌ FIREBASE_SERVICE_ACCOUNT_JSON not found in environment variables')
      return null
    }

    // Parse and ensure private_key has proper newlines
    const serviceAccount = JSON.parse(serviceAccountJson)
    
    // Fix the private key format - ensure \n are actual newlines
    if (serviceAccount.private_key) {
      // If the private key has literal \n strings, replace them with actual newlines
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n')
    }
    
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

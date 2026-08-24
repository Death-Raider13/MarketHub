import { initializeApp, getApps } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
const configuredAuthDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
// A Vercel hostname is not a Firebase Auth domain. If an old deployment URL
// was copied into this variable, use Firebase's project Auth domain instead so
// verification links are generated through the correct Firebase handler.
const authDomain = configuredAuthDomain?.endsWith('.vercel.app')
  ? (projectId ? `${projectId}.firebaseapp.com` : configuredAuthDomain)
  : configuredAuthDomain

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain,
  projectId,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Initialize Firebase (singleton pattern)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
const auth = getAuth(app)
const db = getFirestore(app)
const storage = getStorage(app)

export { app, auth, db, storage }

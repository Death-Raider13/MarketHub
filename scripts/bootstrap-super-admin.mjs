import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

const email = process.argv[2]?.trim().toLowerCase()
if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
  throw new Error('Usage: node scripts/bootstrap-super-admin.mjs existing-account@example.com')
}

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
if (!serviceAccountJson) {
  throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is required. Set it in your local shell; never commit it or paste it into source code.')
}

const serviceAccount = JSON.parse(serviceAccountJson)
if (serviceAccount.private_key) serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n')

const app = getApps()[0] || initializeApp({ credential: cert(serviceAccount) })
const auth = getAuth(app)
const db = getFirestore(app)

const target = await auth.getUserByEmail(email)
const existingSuperAdmins = await db.collection('users').where('role', '==', 'super_admin').limit(1).get()
if (!existingSuperAdmins.empty) {
  throw new Error('A super_admin already exists. Use the protected super-admin promotion workflow instead of this bootstrap script.')
}

const existingClaims = target.customClaims && typeof target.customClaims === 'object' ? target.customClaims : {}
await auth.setCustomUserClaims(target.uid, { ...existingClaims, role: 'super_admin' })
await db.collection('users').doc(target.uid).set({
  uid: target.uid,
  email: target.email || email,
  displayName: target.displayName || '',
  role: 'super_admin',
  status: 'active',
  emailVerified: target.emailVerified,
  updatedAt: FieldValue.serverTimestamp(),
}, { merge: true })

console.log(`Super-admin bootstrap completed for ${target.email || email}.`)
console.log('The account owner must sign out and sign in again, or refresh the ID token, to receive the new custom claim.')
console.log('After confirming access, remove or securely archive the service-account environment variable used for this operation.')

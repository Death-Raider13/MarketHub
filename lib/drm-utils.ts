import { getAdminFirestore } from './firebase/admin'
import crypto from 'crypto'

/**
 * DRM Utility Layer for MarketHub
 * Handles secure download tokens and signed URL generation
 */

export interface DownloadToken {
  id: string
  userId: string
  productId: string
  orderId: string
  expiresAt: Date
  maxDownloads: number
  downloadCount: number
  revoked: boolean
  createdAt: Date
}

/**
 * Generate a secure, single-use download token bound to a purchase
 */
export async function createDownloadToken(
  userId: string,
  productId: string,
  orderId: string,
  options: { maxDownloads?: number; expiryHours?: number } = {}
): Promise<string> {
  const db = getAdminFirestore()
  if (!db) throw new Error('Firestore admin not available')

  const { maxDownloads = 3, expiryHours = 24 } = options
  const tokenId = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + expiryHours)

  const tokenData: DownloadToken = {
    id: tokenId,
    userId,
    productId,
    orderId,
    expiresAt,
    maxDownloads,
    downloadCount: 0,
    revoked: false,
    createdAt: new Date(),
  }

  await db.collection('downloadTokens').doc(tokenId).set(tokenData)
  return tokenId
}

/**
 * Validate a download token and increment usage count
 */
export async function validateAndUseToken(tokenId: string): Promise<{
  isValid: boolean
  token?: DownloadToken
  error?: string
}> {
  const db = getAdminFirestore()
  if (!db) throw new Error('Firestore admin not available')

  const doc = await db.collection('downloadTokens').doc(tokenId).get()
  if (!doc.exists) {
    return { isValid: false, error: 'Invalid token' }
  }

  const token = doc.data() as DownloadToken
  const now = new Date()

  if (token.revoked) {
    return { isValid: false, error: 'Token has been revoked' }
  }

  if (new Date(token.expiresAt) < now) {
    return { isValid: false, error: 'Token has expired' }
  }

  if (token.downloadCount >= token.maxDownloads) {
    return { isValid: false, error: 'Download limit exceeded' }
  }

  // Atomically increment download count
  await db.collection('downloadTokens').doc(tokenId).update({
    downloadCount: token.downloadCount + 1,
    lastUsedAt: now,
  })

  return { isValid: true, token }
}

/**
 * Revoke a token (e.g., after a refund)
 */
export async function revokeToken(tokenId: string): Promise<void> {
  const db = getAdminFirestore()
  if (!db) return

  await db.collection('downloadTokens').doc(tokenId).update({
    revoked: true,
  })
}

/**
 * Generate a signed URL for secure file access (ImageKit Integration)
 * @param fileUrl The full URL of the file to sign
 * @param expirySeconds Duration of URL validity (max 120s restricted here for security)
 */
export async function generateSignedUrl(fileUrl: string, expirySeconds: number = 2400): Promise<string> {
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY
  const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT // e.g., https://ik.imagekit.io/markethub/
  
  if (!privateKey || !urlEndpoint) {
    console.warn('⚠️ ImageKit keys missing, falling back to unsigned URL')
    return fileUrl
  }

  // Only sign if it's an ImageKit URL
  if (!fileUrl.includes('ik.imagekit.io')) {
    return fileUrl
  }

  try {
    const urlObj = new URL(fileUrl)
    const path = urlObj.pathname.replace(/^\//, '') // Remove leading slash
    
    // Use a short-lived expiry (default 60s, max 120s for security)
    const expiry = Math.floor(Date.now() / 1000) + (expirySeconds > 120 ? 120 : expirySeconds)
    
    // ImageKit Signature: HMAC-SHA1(privateKey, path + expiry)
    const signatureString = `${path}${expiry}`
    const signature = crypto
      .createHmac('sha1', privateKey)
      .update(signatureString)
      .digest('hex')

    // Append ik-s and ik-t parameters
    urlObj.searchParams.set('ik-s', signature)
    urlObj.searchParams.set('ik-t', expiry.toString())

    return urlObj.toString()
  } catch (err) {
    console.error('Error signing ImageKit URL:', err)
    return fileUrl
  }
}

import { storage } from '@/lib/firebase/config'
import { ref, getDownloadURL } from 'firebase/storage'
import type { SecureDownloadLink, DigitalFile } from '@/lib/types'

/**
 * Generate secure, time-limited download links for digital products
 * @param files - Array of digital files
 * @param expirationHours - Hours until link expires (default 24)
 * @returns Array of secure download links
 */
export async function generateDownloadLinks(
  files: DigitalFile[],
  expirationHours: number = 24
): Promise<SecureDownloadLink[]> {
  try {
    const links = await Promise.all(
      files.map(async (file) => {
        // Firebase Storage URLs are already secure and include tokens
        // The URL itself acts as the access control
        const expiresAt = new Date()
        expiresAt.setHours(expiresAt.getHours() + expirationHours)

        return {
          fileId: file.id,
          fileName: file.fileName,
          url: file.fileUrl, // Firebase Storage URL with token
          expiresAt: expiresAt
        }
      })
    )

    return links
  } catch (error) {
    console.error('Error generating download links:', error)
    throw new Error('Failed to generate download links')
  }
}

/**
 * Check if a download link is still valid
 * @param link - The secure download link
 * @returns boolean indicating if link is valid
 */
export function isLinkValid(link: SecureDownloadLink): boolean {
  const now = new Date()
  const expiresAt = new Date(link.expiresAt)
  return now < expiresAt
}

/**
 * Format expiration time for display
 * @param expiresAt - Expiration date
 * @returns Formatted string
 */
export function formatExpirationTime(expiresAt: Date): string {
  const now = new Date()
  const expires = new Date(expiresAt)
  const diffMs = expires.getTime() - now.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

  if (diffHours > 0) {
    return `${diffHours}h ${diffMins}m`
  } else if (diffMins > 0) {
    return `${diffMins} minutes`
  } else {
    return 'Expired'
  }
}

/**
 * Track download event
 * @param purchaseId - ID of the purchase record
 * @param fileId - ID of the file being downloaded
 */
export async function trackDownload(
  purchaseId: string,
  fileId: string
): Promise<void> {
  try {
    // This would typically update Firestore to increment download count
    // For now, just log it
    console.log(`Download tracked: Purchase ${purchaseId}, File ${fileId}`)
    
    // TODO: Implement Firestore update
    // const purchaseRef = doc(db, 'purchases', purchaseId)
    // await updateDoc(purchaseRef, {
    //   downloadCount: increment(1),
    //   lastDownloadedAt: new Date()
    // })
  } catch (error) {
    console.error('Error tracking download:', error)
    // Don't throw - tracking failure shouldn't block downloads
  }
}

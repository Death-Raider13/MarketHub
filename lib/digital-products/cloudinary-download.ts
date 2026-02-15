/**
 * Cloudinary Download URL Generator
 * Handles secure download URLs for digital products stored in Cloudinary
 */

interface CloudinaryConfig {
  cloudName: string
  apiKey?: string
  apiSecret?: string
}

/**
 * Generate a secure Cloudinary download URL with proper headers
 * @param originalUrl - The original Cloudinary URL
 * @param fileName - The desired filename for download
 * @returns Secure download URL
 */
export function generateCloudinaryDownloadUrl(
  originalUrl: string,
  fileName?: string
): string {
  try {
    const url = new URL(originalUrl)

    // Ensure it's a Cloudinary URL
    if (!url.hostname.includes('cloudinary.com')) {
      throw new Error('Not a valid Cloudinary URL')
    }

    // Preserve the exact asset path (folders, version, extension, etc.) and only inject
    // `fl_attachment` to force download.
    // Examples:
    //  - /<cloud>/raw/upload/v123/folder/file.pdf
    //  - /<cloud>/raw/upload/folder/file
    const pathParts = url.pathname.split('/')
    const uploadIndex = pathParts.findIndex((part) => part === 'upload')

    if (uploadIndex === -1) {
      throw new Error('Invalid Cloudinary URL format')
    }

    const hasExistingTransformations =
      typeof pathParts[uploadIndex + 1] === 'string' &&
      pathParts[uploadIndex + 1].length > 0 &&
      !/^v\d+$/.test(pathParts[uploadIndex + 1])

    // Cloudinary's attachment flag is `fl_attachment`. To suggest a filename, use
    // `fl_attachment=<filename>` (not `:`). A colon will produce invalid URLs (HTTP 400).
    const safeFileName = fileName ? fileName.replace(/\//g, '_') : undefined
    const attachmentTransformation = safeFileName
      ? `fl_attachment=${encodeURIComponent(safeFileName)}`
      : 'fl_attachment'

    if (hasExistingTransformations) {
      // Merge with existing transformation string
      pathParts[uploadIndex + 1] = `${pathParts[uploadIndex + 1]},${attachmentTransformation}`
    } else {
      // Insert transformation segment after /upload
      pathParts.splice(uploadIndex + 1, 0, attachmentTransformation)
    }

    url.pathname = pathParts.join('/')
    return url.toString()

  } catch (error) {
    console.error('Error generating Cloudinary download URL:', error)
    // Fallback to original URL
    return originalUrl
  }
}

/**
 * Validate if a Cloudinary URL is accessible
 * @param url - The Cloudinary URL to validate
 * @returns Promise<boolean> - Whether the URL is accessible
 */
export async function validateCloudinaryUrl(url: string): Promise<boolean> {
  try {
    // Some CDNs / Cloudinary configurations don't reliably support HEAD.
    // Use a tiny ranged GET instead.
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Range: 'bytes=0-0'
      }
    })
    return response.ok
  } catch (error) {
    console.error('Error validating Cloudinary URL:', error)
    return false
  }
}

/**
 * Get file info from Cloudinary URL
 * @param url - The Cloudinary URL
 * @returns File information
 */
export function getCloudinaryFileInfo(url: string) {
  try {
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split('/')
    const fileName = pathParts[pathParts.length - 1]
    const fileExtension = fileName.split('.').pop()?.toLowerCase()
    
    return {
      fileName,
      fileExtension,
      isValid: urlObj.hostname.includes('cloudinary.com')
    }
  } catch (error) {
    return {
      fileName: 'download',
      fileExtension: 'file',
      isValid: false
    }
  }
}

/**
 * Create a proxy download URL through our API
 * This allows us to handle authentication and tracking
 * @param fileId - The digital file ID
 * @param purchaseId - The purchase record ID
 * @returns Proxy download URL
 */
export function createProxyDownloadUrl(fileId: string, purchaseId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return `${baseUrl}/api/digital-products/download?fileId=${fileId}&purchaseId=${purchaseId}`
}
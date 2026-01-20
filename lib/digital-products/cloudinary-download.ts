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

    // Extract the public ID from the URL
    const pathParts = url.pathname.split('/')
    const uploadIndex = pathParts.findIndex(part => part === 'upload')
    
    if (uploadIndex === -1) {
      throw new Error('Invalid Cloudinary URL format')
    }

    // Get the public ID (everything after version or upload)
    const publicIdParts = pathParts.slice(uploadIndex + 1)
    
    // Remove version if present (starts with 'v' followed by numbers)
    if (publicIdParts[0] && /^v\d+$/.test(publicIdParts[0])) {
      publicIdParts.shift()
    }

    const publicId = publicIdParts.join('/').replace(/\.[^/.]+$/, '') // Remove file extension

    // Get cloud name from hostname
    const cloudName = url.hostname.split('.')[0]

    // Create download URL with proper transformations
    const downloadUrl = `https://res.cloudinary.com/${cloudName}/raw/upload/fl_attachment${fileName ? `:${encodeURIComponent(fileName)}` : ''}/${publicId}`

    return downloadUrl

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
    const response = await fetch(url, { method: 'HEAD' })
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
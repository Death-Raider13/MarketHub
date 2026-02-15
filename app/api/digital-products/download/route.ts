import { NextRequest, NextResponse } from 'next/server'
import { getAdminFirestore } from '@/lib/firebase/admin-simple'
import { generateCloudinaryDownloadUrl, validateCloudinaryUrl } from '@/lib/digital-products/cloudinary-download'

// Mark this route as dynamic since it handles download requests with query params
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get('fileId')
    const purchaseId = searchParams.get('purchaseId')
    const userId = searchParams.get('userId')

    if (!fileId || !purchaseId) {
      return NextResponse.json(
        { error: 'File ID and Purchase ID are required' },
        { status: 400 }
      )
    }

    const adminDb = getAdminFirestore()
    if (!adminDb) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Get purchase record
    const purchaseDoc = await adminDb.collection('purchasedProducts').doc(purchaseId).get()
    
    if (!purchaseDoc.exists) {
      return NextResponse.json(
        { error: 'Purchase record not found' },
        { status: 404 }
      )
    }

    const purchaseData = purchaseDoc.data()
    
    // Verify user ownership if userId is provided
    if (userId && purchaseData?.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 403 }
      )
    }

    // Find the digital file
    const product = purchaseData?.product
    const digitalFile = product?.digitalFiles?.find((file: any) => file.id === fileId)

    if (!digitalFile) {
      return NextResponse.json(
        { error: 'Digital file not found' },
        { status: 404 }
      )
    }

    // Check download limits
    if (product.downloadLimit > 0 && purchaseData.downloadCount >= product.downloadLimit) {
      return NextResponse.json(
        { error: 'Download limit exceeded' },
        { status: 403 }
      )
    }

    // Check access expiration
    if (product.accessDuration > 0 && purchaseData.accessExpiresAt) {
      const expiresAt = purchaseData.accessExpiresAt.toDate ? 
        purchaseData.accessExpiresAt.toDate() : 
        new Date(purchaseData.accessExpiresAt)
      
      if (new Date() > expiresAt) {
        return NextResponse.json(
          { error: 'Access expired' },
          { status: 403 }
        )
      }
    }

    // Generate proper download URL
    let downloadUrl = digitalFile.fileUrl

    // If it's a Cloudinary URL, generate a proper download URL
    if (downloadUrl.includes('cloudinary.com')) {
      downloadUrl = generateCloudinaryDownloadUrl(downloadUrl, digitalFile.fileName)
    }

    // Validate the URL is accessible
    const isValid = await validateCloudinaryUrl(downloadUrl)
    if (!isValid) {
      console.error('Invalid or inaccessible file URL:', downloadUrl)
      return NextResponse.json(
        { error: 'File is currently unavailable. Please contact support.' },
        { status: 404 }
      )
    }

    // Update download count
    try {
      await adminDb.collection('purchasedProducts').doc(purchaseId).update({
        downloadCount: (purchaseData.downloadCount || 0) + 1,
        lastDownloadedAt: new Date()
      })
    } catch (updateError) {
      console.error('Failed to update download count:', updateError)
      // Don't fail the download if we can't update the count
    }

    // Redirect to the actual file URL
    return NextResponse.redirect(downloadUrl)

  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json(
      { error: 'Failed to process download' },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { getAdminFirestore } from '@/lib/firebase/admin-simple'
import { FieldValue } from 'firebase-admin/firestore'
import { generateCloudinaryDownloadUrl, validateCloudinaryUrl } from '@/lib/digital-products/cloudinary-download'
import { verifyAuthToken } from '@/lib/api-auth'
import { isWatermarkSupported, watermarkFile } from '@/lib/watermark'

// Mark this route as dynamic since it handles download requests with query params
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const MAX_PROXY_BYTES = 100 * 1024 * 1024

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuthToken(request)
    if ('error' in auth) return auth.error

    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get('fileId')
    const purchaseId = searchParams.get('purchaseId')
    const userId = auth.user.uid

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
    
    // Ownership is always checked against the verified Firebase token.
    if (purchaseData?.userId !== userId) {
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

    const originalUrl: string | undefined = digitalFile.fileUrl
    if (!originalUrl) {
      return NextResponse.json(
        { error: 'Digital file is missing a file URL' },
        { status: 500 }
      )
    }

    const fileName: string = digitalFile.fileName || 'download'
    const fileType: string | undefined = digitalFile.fileType

    // For proxying we fetch the ORIGINAL URL to avoid Cloudinary transformation quirks
    // across file types (PDF/ZIP/etc.). We still force download via our own
    // Content-Disposition header.
    // Sanitize URL (Handle ImageKit double-slash issue)
    let downloadUrl = originalUrl
    if (downloadUrl.includes('imagekit.io')) {
      const urlParts = downloadUrl.split('://')
      if (urlParts.length === 2) {
        urlParts[1] = urlParts[1].replace(/\/\/+/g, '/')
        downloadUrl = urlParts.join('://')
      }
    }

    // Proxy download through our server to ensure consistent download behavior
    // across file types (PDF/ZIP/etc.). We cap to 100MB to avoid serverless limits.
    const upstreamHead = await fetch(downloadUrl, {
      method: 'GET',
      headers: {
        Range: 'bytes=0-0'
      }
    }).catch(() => null)

    const upstreamLengthHeader = upstreamHead?.headers?.get('content-length') || null
    const upstreamLength = upstreamLengthHeader ? Number(upstreamLengthHeader) : NaN

    if (!Number.isNaN(upstreamLength) && upstreamLength > MAX_PROXY_BYTES) {
      return NextResponse.json(
        { error: 'File too large to download via proxy. Please reduce file size to 100MB or less.' },
        { status: 413 }
      )
    }

    const upstream = await fetch(downloadUrl)
    if (!upstream.ok) {
      const status = upstream.status
      const statusText = upstream.statusText
      return NextResponse.json(
        { error: 'File is currently unavailable. Please contact support.', upstreamStatus: status, upstreamStatusText: statusText },
        { status: 502 }
      )
    }

    const originalBytes = Buffer.from(await upstream.arrayBuffer())
    if (originalBytes.byteLength > MAX_PROXY_BYTES) {
      return NextResponse.json(
        { error: 'File too large to download via proxy. Please reduce file size to 100MB or less.' },
        { status: 413 }
      )
    }

    const contentType = upstream.headers.get('content-type') || fileType || 'application/octet-stream'
    let responseBytes = originalBytes
    let watermarkApplied = false

    if (!isWatermarkSupported(fileName, contentType)) {
      return NextResponse.json(
        { error: 'Protected delivery is not yet available for this file type. Please contact support.' },
        { status: 415 }
      )
    }

    try {
      const watermarked = await watermarkFile(originalBytes, fileName, contentType, {
        userId,
        orderId: purchaseId,
        productId: String(purchaseData?.productId || product?.id || ''),
        fileId,
      })
      responseBytes = Buffer.from(watermarked.bytes)
      watermarkApplied = true
      await adminDb.collection('purchasedProducts').doc(purchaseId).update({
        watermarkId: watermarked.watermarkId,
        watermarkSourceHash: watermarked.sourceHash,
        watermarkOutputHash: watermarked.outputHash,
        watermarkFormat: watermarked.format,
        watermarkVersion: 2,
        watermarkAppliedAt: FieldValue.serverTimestamp(),
      })
    } catch (watermarkError) {
      console.error('Protected file watermarking failed:', watermarkError)
      return NextResponse.json({ error: 'Protected delivery is temporarily unavailable. Please try again later.' }, { status: 503 })
    }

    // Update download count (best effort)
    try {
      await adminDb.collection('purchasedProducts').doc(purchaseId).update({
        downloadCount: FieldValue.increment(1),
        lastDownloadedAt: FieldValue.serverTimestamp()
      })
    } catch (updateError) {
      console.error('Failed to update download count:', updateError)
    }

    return new NextResponse(responseBytes, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
        'Cache-Control': 'no-store',
        'X-Fero-Watermark': watermarkApplied ? 'embedded' : 'not-supported-for-file-type',
      }
    })

  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json(
      { error: 'Failed to process download' },
      { status: 500 }
    )
  }
}
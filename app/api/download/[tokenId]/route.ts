import { NextRequest, NextResponse } from 'next/server'
import { validateAndUseToken } from '@/lib/drm-utils'
import { getAdminFirestore } from '@/lib/firebase/admin'
import { FieldValue } from 'firebase-admin/firestore'
import { isWatermarkSupported, watermarkFile } from '@/lib/watermark'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_DOWNLOAD_BYTES = 100 * 1024 * 1024

/**
 * Legacy token download endpoint. It remains available for links already sent by
 * email, but no longer redirects directly to the storage provider: it applies
 * the same purchaser-specific watermarking pipeline as the newer bearer route.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { tokenId: string } }
) {
  const { tokenId } = params
  const { searchParams } = new URL(request.url)
  const fileId = searchParams.get('fileId')
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

  try {
    const { isValid, token, error } = await validateAndUseToken(tokenId)
    if (!isValid || !token) {
      return NextResponse.json(
        { error: error || 'Invalid or expired download token' },
        { status: 410 }
      )
    }

    const db = getAdminFirestore()
    if (!db) throw new Error('Database connection failed')

    const productDoc = await db.collection('products').doc(token.productId).get()
    if (!productDoc.exists) return NextResponse.json({ error: 'Product no longer exists' }, { status: 404 })

    const product = productDoc.data()
    const digitalFiles = product?.digitalFiles || []
    if (digitalFiles.length === 0) return NextResponse.json({ error: 'No digital files associated with this product' }, { status: 404 })

    const selectedFile = fileId
      ? digitalFiles.find((file: any) => file.id === fileId)
      : digitalFiles[0]
    if (!selectedFile) return NextResponse.json({ error: 'Digital file not found' }, { status: 404 })
    if (!selectedFile.fileUrl || !selectedFile.fileName) return NextResponse.json({ error: 'Digital file is unavailable' }, { status: 404 })

    const upstream = await fetch(selectedFile.fileUrl)
    if (!upstream.ok) return NextResponse.json({ error: 'Digital file is currently unavailable' }, { status: 502 })
    const source = Buffer.from(await upstream.arrayBuffer())
    if (source.byteLength > MAX_DOWNLOAD_BYTES) {
      return NextResponse.json({ error: 'File too large to process securely' }, { status: 413 })
    }

    const contentType = upstream.headers.get('content-type') || selectedFile.fileType || 'application/octet-stream'
    if (!isWatermarkSupported(selectedFile.fileName, contentType)) {
      return NextResponse.json({ error: 'Protected delivery is not yet available for this file type' }, { status: 415 })
    }

    const watermarked = await watermarkFile(source, selectedFile.fileName, contentType, {
      userId: token.userId,
      orderId: token.orderId,
      productId: token.productId,
      fileId: selectedFile.id,
    })

    const purchasesQuery = await db.collection('purchasedProducts')
      .where('userId', '==', token.userId)
      .where('productId', '==', token.productId)
      .where('orderId', '==', token.orderId)
      .limit(1)
      .get()

    if (!purchasesQuery.empty) {
      await purchasesQuery.docs[0].ref.update({
        downloadCount: FieldValue.increment(1),
        lastDownloadedAt: FieldValue.serverTimestamp(),
        watermarkId: watermarked.watermarkId,
        watermarkSourceHash: watermarked.sourceHash,
        watermarkOutputHash: watermarked.outputHash,
        watermarkFormat: watermarked.format,
        watermarkVersion: 2,
        watermarkAppliedAt: FieldValue.serverTimestamp(),
      })
    }

    const { logEvent } = await import('@/lib/analytics')
    await logEvent('download', {
      tokenId,
      userId: token.userId,
      productId: token.productId,
      orderId: token.orderId,
      fileId: selectedFile.id,
      fileName: selectedFile.fileName,
      ip,
      watermarkId: watermarked.watermarkId,
      watermarkFormat: watermarked.format,
    })

    await db.collection('downloadLogs').add({
      tokenId,
      userId: token.userId,
      productId: token.productId,
      orderId: token.orderId,
      fileId: selectedFile.id,
      fileName: selectedFile.fileName,
      ip,
      userAgent: request.headers.get('user-agent'),
      watermarkId: watermarked.watermarkId,
      watermarkFormat: watermarked.format,
      timestamp: FieldValue.serverTimestamp(),
    })

    return new NextResponse(Buffer.from(watermarked.bytes), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(selectedFile.fileName)}"`,
        'Cache-Control': 'no-store',
        'X-Fero-Watermark': 'embedded',
      },
    })
  } catch (error) {
    console.error('Protected legacy download error:', error)
    return NextResponse.json({ error: 'Protected delivery is temporarily unavailable' }, { status: 503 })
  }
}

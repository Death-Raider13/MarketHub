import { NextRequest, NextResponse } from 'next/server'
import { validateAndUseToken, generateSignedUrl } from '@/lib/drm-utils'
import { getAdminFirestore } from '@/lib/firebase/admin'
import { FieldValue } from 'firebase-admin/firestore'

/**
 * Secure Download Endpoint
 * Validates DRM tokens and provides time-limited signed URLs for digital assets
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { tokenId: string } }
) {
  const { tokenId } = params
  const { searchParams } = new URL(request.url)
  const fileId = searchParams.get('fileId')
  
  // Get IP for anomaly logging
  const ip = request.headers.get('x-forwarded-for') || request.ip || 'unknown'

  try {
    // 1. Validate token
    const { isValid, token, error } = await validateAndUseToken(tokenId)
    
    if (!isValid || !token) {
      return NextResponse.json(
        { error: error || 'Invalid or expired download token' },
        { status: 410 } // Gone/Expired
      )
    }

    // 2. Fetch product to get file metadata
    const db = getAdminFirestore()
    if (!db) throw new Error('Database connection failed')

    const productDoc = await db.collection('products').doc(token.productId).get()
    
    if (!productDoc.exists) {
      return NextResponse.json({ error: 'Product no longer exists' }, { status: 404 })
    }

    const product = productDoc.data()
    const digitalFiles = product?.digitalFiles || []

    if (digitalFiles.length === 0) {
      return NextResponse.json({ error: 'No digital files associated with this product' }, { status: 404 })
    }

    // 3. Find requested file or default to first
    let selectedFile = digitalFiles[0]
    if (fileId) {
      const found = digitalFiles.find((f: any) => f.id === fileId)
      if (found) selectedFile = found
    }

    // 4. Generate signed URL (30-120s expiry)
    const signedUrl = await generateSignedUrl(selectedFile.fileUrl, 60)

    // 5. Log download attempt (Security/Audit)
    const { logEvent } = await import('@/lib/analytics')
    await logEvent('download', {
      tokenId,
      userId: token.userId,
      productId: token.productId,
      orderId: token.orderId,
      fileId: selectedFile.id,
      fileName: selectedFile.fileName,
      ip
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
      timestamp: new Date(),
    })

    // 6. Update download count on purchase record (Synchronize with UI)
    try {
      const purchasesQuery = await db.collection('purchasedProducts')
        .where('userId', '==', token.userId)
        .where('productId', '==', token.productId)
        .where('orderId', '==', token.orderId)
        .get()

      if (!purchasesQuery.empty) {
        const purchaseDoc = purchasesQuery.docs[0]
        await purchaseDoc.ref.update({
          downloadCount: FieldValue.increment(1),
          lastDownloadedAt: FieldValue.serverTimestamp()
        })
        console.log(`✅ Incremented download count for purchase: ${purchaseDoc.id}`)
      }
    } catch (trackError) {
      console.error('Failed to sync download count:', trackError)
    }

    // 7. Redirect to signed URL
    return NextResponse.redirect(signedUrl)

  } catch (error: any) {
    console.error('Download Error:', error)
    return NextResponse.json(
      { error: 'An internal error occurred during download' },
      { status: 500 }
    )
  }
}

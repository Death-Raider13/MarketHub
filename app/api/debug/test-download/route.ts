import { NextRequest, NextResponse } from 'next/server'
import { getAdminFirestore } from '@/lib/firebase/admin-simple'

export const dynamic = 'force-dynamic'

/**
 * Debug endpoint to test download link generation
 * Usage: /api/debug/test-download?orderId=XXX&userId=YYY
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')
    const userId = searchParams.get('userId')

    if (!orderId || !userId) {
      return NextResponse.json(
        { error: 'orderId and userId are required' },
        { status: 400 }
      )
    }

    const adminDb = getAdminFirestore()
    if (!adminDb) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 500 }
      )
    }

    const results: any = {
      orderId,
      userId,
      timestamp: new Date().toISOString()
    }

    // Get order
    const orderDoc = await adminDb.collection('orders').doc(orderId).get()
    if (!orderDoc.exists) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    const order = orderDoc.data()
    results.order = {
      id: orderDoc.id,
      status: order?.status,
      userId: order?.userId,
      itemCount: order?.items?.length || 0
    }

    // Get purchases
    const purchasesQuery = await adminDb
      .collection('purchasedProducts')
      .where('orderId', '==', orderId)
      .where('userId', '==', userId)
      .get()

    results.purchases = {
      count: purchasesQuery.size,
      items: purchasesQuery.docs.map((doc: any) => {
        const data = doc.data()
        const product = data.product || {}
        
        return {
          id: doc.id,
          productId: data.productId,
          productName: product.name,
          productType: product.type || product.productType,
          downloadLimit: product.downloadLimit,
          accessDuration: product.accessDuration,
          downloadCount: data.downloadCount || 0,
          hasDigitalFiles: Array.isArray(product.digitalFiles),
          digitalFilesCount: product.digitalFiles?.length || 0,
          digitalFiles: product.digitalFiles?.map((file: any) => ({
            id: file.id,
            fileName: file.fileName,
            fileUrl: file.fileUrl ? file.fileUrl.substring(0, 50) + '...' : null,
            fileSize: file.fileSize,
            fileType: file.fileType
          })) || []
        }
      })
    }

    // Check if any digital products
    const digitalPurchases = results.purchases.items.filter(
      (p: any) => p.productType === 'digital' && p.hasDigitalFiles
    )

    results.summary = {
      totalPurchases: results.purchases.count,
      digitalPurchases: digitalPurchases.length,
      canDownload: digitalPurchases.length > 0,
      issues: []
    }

    // Check for issues
    results.purchases.items.forEach((p: any) => {
      if (p.productType === 'digital' && !p.hasDigitalFiles) {
        results.summary.issues.push({
          purchaseId: p.id,
          productName: p.productName,
          issue: 'Digital product has no files uploaded'
        })
      }
      
      if (p.productType === 'digital' && p.hasDigitalFiles && p.digitalFilesCount === 0) {
        results.summary.issues.push({
          purchaseId: p.id,
          productName: p.productName,
          issue: 'Digital files array is empty'
        })
      }

      if (p.downloadLimit > 0 && p.downloadCount >= p.downloadLimit) {
        results.summary.issues.push({
          purchaseId: p.id,
          productName: p.productName,
          issue: `Download limit exceeded (${p.downloadCount}/${p.downloadLimit})`
        })
      }
    })

    return NextResponse.json(results, { status: 200 })

  } catch (error: any) {
    console.error('Debug test-download error:', error)
    return NextResponse.json(
      { error: 'Debug failed', details: error.message },
      { status: 500 }
    )
  }
}

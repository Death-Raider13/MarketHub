import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { getAuth } from 'firebase-admin/auth'
import { getStorage } from 'firebase-admin/storage'

// Generate secure download links for purchased digital products
export async function POST(request: NextRequest) {
  try {
    const { orderId, userId } = await request.json()

    if (!orderId || !userId) {
      return NextResponse.json(
        { error: 'Order ID and User ID are required' },
        { status: 400 }
      )
    }

    // Verify the order exists and belongs to the user
    const orderDoc = await adminDb.collection('orders').doc(orderId).get()
    
    if (!orderDoc.exists) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    const order = orderDoc.data()
    
    if (order?.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized access to order' },
        { status: 403 }
      )
    }

    if (order?.status !== 'completed' && order?.status !== 'delivered') {
      return NextResponse.json(
        { error: 'Order not yet completed' },
        { status: 400 }
      )
    }

    // Get all digital products from the order
    const digitalProducts = order.items?.filter((item: any) => 
      item.product?.productType === 'digital' && 
      item.product?.digitalFiles?.length > 0
    ) || []

    if (digitalProducts.length === 0) {
      return NextResponse.json(
        { error: 'No digital products found in this order' },
        { status: 404 }
      )
    }

    // Generate secure download links for each digital product
    const storage = getStorage()
    const bucket = storage.bucket()
    const downloadLinks: any[] = []

    for (const item of digitalProducts) {
      const product = item.product
      const productLinks: any[] = []

      // Check if user has already purchased this product
      const purchaseQuery = await adminDb
        .collection('purchasedProducts')
        .where('userId', '==', userId)
        .where('productId', '==', product.id)
        .where('orderId', '==', orderId)
        .get()

      let purchaseDoc: any = null
      
      if (!purchaseQuery.empty) {
        purchaseDoc = purchaseQuery.docs[0]
        const purchaseData = purchaseDoc.data()
        
        // Check download limits
        if (product.downloadLimit > 0 && purchaseData.downloadCount >= product.downloadLimit) {
          continue // Skip this product if download limit exceeded
        }
        
        // Check access expiration
        if (product.accessDuration > 0 && purchaseData.accessExpiresAt && 
            new Date() > purchaseData.accessExpiresAt.toDate()) {
          continue // Skip this product if access expired
        }
      } else {
        // Create purchase record
        const accessExpiresAt = product.accessDuration > 0 
          ? new Date(Date.now() + (product.accessDuration * 24 * 60 * 60 * 1000))
          : null

        const purchaseData = {
          userId,
          productId: product.id,
          orderId,
          product: product,
          purchasedAt: new Date(),
          accessExpiresAt,
          downloadCount: 0,
          lastDownloadedAt: null
        }

        const newPurchaseDoc = await adminDb.collection('purchasedProducts').add(purchaseData)
        purchaseDoc = newPurchaseDoc
      }

      // Generate signed URLs for each digital file
      for (const digitalFile of product.digitalFiles) {
        try {
          // Extract file path from Firebase Storage URL
          const url = new URL(digitalFile.fileUrl)
          const pathMatch = url.pathname.match(/\/o\/(.+?)\?/)
          
          if (!pathMatch) {
            console.error('Could not extract file path from URL:', digitalFile.fileUrl)
            continue
          }
          
          const filePath = decodeURIComponent(pathMatch[1])
          const file = bucket.file(filePath)
          
          // Generate signed URL valid for 1 hour
          const [signedUrl] = await file.getSignedUrl({
            action: 'read',
            expires: Date.now() + 60 * 60 * 1000, // 1 hour
          })

          productLinks.push({
            fileId: digitalFile.id,
            fileName: digitalFile.fileName,
            fileSize: digitalFile.fileSize,
            fileType: digitalFile.fileType,
            downloadUrl: signedUrl,
            expiresAt: new Date(Date.now() + 60 * 60 * 1000)
          })
        } catch (error) {
          console.error('Error generating signed URL for file:', digitalFile.fileName, error)
        }
      }

      if (productLinks.length > 0) {
        downloadLinks.push({
          productId: product.id,
          productName: product.name,
          purchaseId: purchaseDoc?.id,
          files: productLinks,
          downloadLimit: product.downloadLimit,
          currentDownloads: purchaseDoc?.data()?.downloadCount || 0,
          accessExpiresAt: purchaseDoc?.data()?.accessExpiresAt
        })
      }
    }

    return NextResponse.json({
      success: true,
      downloadLinks,
      message: `Generated download links for ${downloadLinks.length} digital product(s)`
    })

  } catch (error) {
    console.error('Error generating download links:', error)
    return NextResponse.json(
      { error: 'Failed to generate download links' },
      { status: 500 }
    )
  }
}

// Track download when user clicks download link
export async function PUT(request: NextRequest) {
  try {
    const { purchaseId, fileId, userId } = await request.json()

    if (!purchaseId || !fileId || !userId) {
      return NextResponse.json(
        { error: 'Purchase ID, File ID, and User ID are required' },
        { status: 400 }
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
    
    if (purchaseData?.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 403 }
      )
    }

    // Update download count
    await adminDb.collection('purchasedProducts').doc(purchaseId).update({
      downloadCount: (purchaseData?.downloadCount || 0) + 1,
      lastDownloadedAt: new Date()
    })

    return NextResponse.json({
      success: true,
      message: 'Download tracked successfully'
    })

  } catch (error) {
    console.error('Error tracking download:', error)
    return NextResponse.json(
      { error: 'Failed to track download' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { getAuth } from 'firebase-admin/auth'

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

    // Allow digital delivery for paid orders too (digital goods can be delivered immediately)
    const allowedStatuses = ['completed', 'delivered', 'paid']
    if (!allowedStatuses.includes(order?.status)) {
      return NextResponse.json(
        { error: `Order not yet completed. Current status: ${order?.status}` },
        { status: 400 }
      )
    }

    // First, try to get digital products from purchased products collection
    // This is more reliable as it contains the full product data
    const purchasedProductsQuery = await adminDb
      .collection('purchasedProducts')
      .where('userId', '==', userId)
      .where('orderId', '==', orderId)
      .get()

    let digitalProducts: any[] = []

    if (!purchasedProductsQuery.empty) {
      // Use purchased products data (more reliable)
      digitalProducts = purchasedProductsQuery.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((purchase: any) => {
          const p = purchase.product || {}
          const isDigital = (p.productType === 'digital' || p.type === 'digital')
          const hasFiles = Array.isArray(p.digitalFiles) && p.digitalFiles.length > 0
          return isDigital && hasFiles
        })
        .map((purchase: any) => ({
          product: purchase.product,
          purchaseDoc: { id: purchase.id, data: () => purchase }
        }))
    } else {
      // Fallback to order items data
      digitalProducts = order?.items?.filter((item: any) => {
        const p = item.product || {}
        const isDigital = (p.productType === 'digital' || p.type === 'digital')
        const hasFiles = Array.isArray(p.digitalFiles) && p.digitalFiles.length > 0
        return isDigital && hasFiles
      }).map((item: any) => ({
        product: item.product,
        purchaseDoc: null
      })) || []
    }

    if (digitalProducts.length === 0) {
      // Check if there are digital products without files
      const digitalProductsWithoutFiles = (purchasedProductsQuery.empty ? order?.items : purchasedProductsQuery.docs.map(doc => ({ product: doc.data().product })))
        ?.filter((item: any) => {
          const p = item.product || {}
          const isDigital = (p.productType === 'digital' || p.type === 'digital')
          return isDigital
        }) || []


      if (digitalProductsWithoutFiles.length > 0) {
        return NextResponse.json(
          { 
            error: `Found ${digitalProductsWithoutFiles.length} digital product(s) in this order, but none have files uploaded. Please contact support to have files added to these products.`,
            products: digitalProductsWithoutFiles.map((item: any) => ({
              name: item.product?.name,
              id: item.product?.id
            }))
          },
          { status: 404 }
        )
      }

      return NextResponse.json(
        { error: 'No digital products found in this order' },
        { status: 404 }
      )
    }

    // Generate download links for each digital product
    const downloadLinks: any[] = []

    for (const item of digitalProducts) {
      const product = item.product
      const productLinks: any[] = []

      // Use existing purchase doc if available, otherwise create one
      let purchaseDoc: any = item.purchaseDoc

      if (!purchaseDoc) {
        // Check if user has already purchased this product
        const purchaseQuery = await adminDb
          .collection('purchasedProducts')
          .where('userId', '==', userId)
          .where('productId', '==', product.id)
          .where('orderId', '==', orderId)
          .get()

        if (!purchaseQuery.empty) {
          purchaseDoc = purchaseQuery.docs[0]
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
      }

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

      // Process Cloudinary URLs for each digital file
      for (const digitalFile of product.digitalFiles) {
        try {
          if (!digitalFile.fileUrl) {
            continue
          }
          
          // Validate Cloudinary URL
          const url = new URL(digitalFile.fileUrl)
          if (!url.hostname.includes('cloudinary.com')) {
            continue
          }

          // For Cloudinary, we can use the URL directly or create a secure download token
          // Since Cloudinary URLs are already secure, we'll use them directly
          productLinks.push({
            fileId: digitalFile.id,
            fileName: digitalFile.fileName,
            fileSize: digitalFile.fileSize,
            fileType: digitalFile.fileType,
            downloadUrl: digitalFile.fileUrl,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours for Cloudinary
          })
        } catch (error) {
          // Skip file on error
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

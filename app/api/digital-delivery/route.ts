import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { getAdminFirestore } from '@/lib/firebase/admin-simple'
import { verifyAuthToken } from '@/lib/api-auth'

// Generate secure download links for purchased digital products
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuthToken(request)
    if ('error' in auth) return auth.error

    const { orderId } = await request.json()
    const userId = auth.user.uid

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID and User ID are required' },
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
      // Use purchased products data, but fetch fresh product data if files are missing
      const purchasedDocs = purchasedProductsQuery.docs.map((doc: any) => ({ 
        id: doc.id, 
        ...doc.data() 
      }))

      for (const purchase of purchasedDocs) {
        const p = purchase.product || {}
        const isDigital = (p.productType === 'digital' || p.type === 'digital')
        
        if (!isDigital) continue

        console.log('📦 Processing purchase:', {
          purchaseId: purchase.id,
          productId: p.id,
          productName: p.name,
          hasFiles: Array.isArray(p.digitalFiles),
          fileCount: p.digitalFiles?.length || 0
        })

        let productData = p
        const hasFiles = Array.isArray(p.digitalFiles) && p.digitalFiles.length > 0

        // If no files in purchase record, fetch fresh product data
        if (!hasFiles && p.id) {
          try {
            const freshProductDoc = await adminDb.collection('products').doc(p.id).get()
            if (freshProductDoc.exists) {
              const freshProduct = freshProductDoc.data()
              if (freshProduct && Array.isArray(freshProduct.digitalFiles) && freshProduct.digitalFiles.length > 0) {
                productData = { ...p, digitalFiles: freshProduct.digitalFiles }
                
                // Update purchase record with fresh files
                await adminDb.collection('purchasedProducts').doc(purchase.id).update({
                  'product.digitalFiles': freshProduct.digitalFiles
                })
                
                console.log(`✅ Updated purchase ${purchase.id} with ${freshProduct.digitalFiles.length} files from product`)
              }
            }
          } catch (fetchError) {
            console.error('Error fetching fresh product data:', fetchError)
          }
        }

        if (Array.isArray(productData.digitalFiles) && productData.digitalFiles.length > 0) {
          digitalProducts.push({
            product: productData,
            purchaseDoc: { id: purchase.id, data: () => purchase }
          })
        }
      }
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
      const digitalProductsWithoutFiles = (purchasedProductsQuery.empty ? order?.items : purchasedProductsQuery.docs.map((doc: any) => ({ product: doc.data().product })))
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
            console.warn('⚠️ Digital file missing fileUrl:', digitalFile)
            continue
          }
          
          // Validate URL (Support both Cloudinary and ImageKit)
          let url: URL
          let fileUrl = digitalFile.fileUrl
          
          // Cleanup double slashes in URL (common ImageKit issue)
          if (fileUrl.includes('imagekit.io')) {
            // Replace double slashes in path, but keep the ones in the protocol (https://)
            const urlParts = fileUrl.split('://')
            if (urlParts.length === 2) {
              urlParts[1] = urlParts[1].replace(/\/\/+/g, '/')
              fileUrl = urlParts.join('://')
            }
          }

          try {
            url = new URL(fileUrl)
          } catch (urlError) {
            console.error('❌ Invalid file URL:', fileUrl, urlError)
            continue
          }
          
          const allowedHosts = ['cloudinary.com', 'imagekit.io']
          if (!allowedHosts.some(host => url.hostname.includes(host))) {
            console.warn('⚠️ File URL is not from a supported provider (Cloudinary/ImageKit):', fileUrl)
            continue
          }

          // Use proxy download URL for better security and tracking
          productLinks.push({
            fileId: digitalFile.id || `file-${Date.now()}`,
            fileName: digitalFile.fileName || 'download',
            fileSize: digitalFile.fileSize || 0,
            fileType: digitalFile.fileType || 'file',
            downloadUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/digital-products/download?fileId=${digitalFile.id || 'unknown'}&purchaseId=${purchaseDoc?.id}&userId=${userId}`,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
          })
          
          console.log('✅ Added download link for file:', digitalFile.fileName)
        } catch (error) {
          console.error('❌ Error processing digital file:', error, digitalFile)
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
    const auth = await verifyAuthToken(request)
    if ('error' in auth) return auth.error

    const { purchaseId, fileId } = await request.json()
    const userId = auth.user.uid

    if (!purchaseId || !fileId) {
      return NextResponse.json(
        { error: 'Purchase ID, File ID, and User ID are required' },
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

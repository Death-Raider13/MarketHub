import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api-auth'
import { getAdminFirestore } from '@/lib/firebase/admin'
import { getR2Client } from '@/lib/r2'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import axios from 'axios'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if ('error' in auth) return auth.error

    const adminDb = getAdminFirestore()
    if (!adminDb) {
      return NextResponse.json({ error: 'Firebase Admin not initialized' }, { status: 500 })
    }

    const r2Client = getR2Client()
    const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'fero-elibrary'
    const publicDomain = process.env.NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL || 'https://pub-8df3facea5b446d2aed1eafbfca818b1.r2.dev'

    const productsSnapshot = await adminDb.collection('products').get()
    let migratedFilesCount = 0
    let updatedProductsCount = 0

    for (const doc of productsSnapshot.docs) {
      const product = doc.data()
      let isModified = false
      const digitalFiles = Array.isArray(product.digitalFiles) ? [...product.digitalFiles] : []

      for (let i = 0; i < digitalFiles.length; i++) {
        const file = digitalFiles[i]
        const currentUrl = file.fileUrl || file.url || ''

        if (currentUrl.includes('imagekit.io')) {
          try {
            const response = await axios.get(currentUrl, { responseType: 'arraybuffer' })
            const fileBuffer = Buffer.from(response.data)
            const contentType = response.headers['content-type'] || file.fileType || 'application/octet-stream'

            const safeName = (file.fileName || 'file').replace(/[^a-zA-Z0-9._-]/g, '_')
            const r2Key = `digital-products/migrated_${Date.now()}_${safeName}`

            await r2Client.send(new PutObjectCommand({
              Bucket: bucketName,
              Key: r2Key,
              Body: fileBuffer,
              ContentType: contentType,
            }))

            const newFileUrl = `${publicDomain.replace(/\/$/, '')}/${r2Key}`
            digitalFiles[i] = {
              ...file,
              fileUrl: newFileUrl,
              migratedFromImageKit: true,
              migratedAt: new Date().toISOString()
            }

            isModified = true
            migratedFilesCount++
          } catch (err: any) {
            console.error(`Failed to migrate file ${currentUrl}:`, err)
          }
        }
      }

      if (isModified) {
        await doc.ref.update({ digitalFiles })
        updatedProductsCount++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Migration complete. ${migratedFilesCount} files migrated across ${updatedProductsCount} products.`,
      migratedFilesCount,
      updatedProductsCount
    })
  } catch (error: any) {
    console.error('Storage Migration API Error:', error)
    return NextResponse.json({ error: error?.message || 'Migration failed' }, { status: 500 })
  }
}

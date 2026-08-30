import dotenv from 'dotenv'
import path from 'path'
import axios from 'axios'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

// Load .env.local variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

import { getAdminFirestore } from '../lib/firebase/admin'

async function runMigration() {
  console.log('🚀 Starting ImageKit -> Cloudflare R2 Migration Script...')

  const adminDb = getAdminFirestore()
  if (!adminDb) {
    console.error('❌ Failed to initialize Firebase Admin. Check .env.local for FIREBASE_SERVICE_ACCOUNT_JSON or admin keys.')
    process.exit(1)
  }

  const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID || '8df3facea5b446d2aed1eafbfca818b1'
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || process.env.CLOUDFLARE_ACCESS_KEY_ID
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || process.env.CLOUDFLARE_SECRET_ACCESS_KEY
  const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'fero-elibrary'
  const publicDomain = process.env.NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL || 'https://pub-8df3facea5b446d2aed1eafbfca818b1.r2.dev'

  if (!accessKeyId || !secretAccessKey) {
    console.error('❌ Missing Cloudflare R2 credentials (CLOUDFLARE_R2_ACCESS_KEY_ID & CLOUDFLARE_R2_SECRET_ACCESS_KEY) in .env.local')
    process.exit(1)
  }

  const r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  })

  // 1. Fetch all products
  const productsSnapshot = await adminDb.collection('products').get()
  console.log(`📦 Found ${productsSnapshot.size} total products in database. Scanning for ImageKit files...`)

  let updatedProductsCount = 0
  let migratedFilesCount = 0

  for (const doc of productsSnapshot.docs) {
    const product = doc.data()
    let isModified = false
    const digitalFiles = Array.isArray(product.digitalFiles) ? [...product.digitalFiles] : []

    for (let i = 0; i < digitalFiles.length; i++) {
      const file = digitalFiles[i]
      const currentUrl = file.fileUrl || file.url || ''

      if (currentUrl.includes('imagekit.io')) {
        console.log(`\n⏳ Migrating file "${file.fileName || 'file'}" for product "${product.name || doc.id}"...`)
        console.log(`   Source: ${currentUrl}`)

        try {
          // Download file from ImageKit
          const response = await axios.get(currentUrl, { responseType: 'arraybuffer' })
          const fileBuffer = Buffer.from(response.data)
          const contentType = response.headers['content-type'] || file.fileType || 'application/octet-stream'

          // Generate R2 Key
          const safeName = (file.fileName || 'file').replace(/[^a-zA-Z0-9._-]/g, '_')
          const r2Key = `digital-products/migrated_${Date.now()}_${safeName}`

          // Upload to R2
          await r2Client.send(new PutObjectCommand({
            Bucket: bucketName,
            Key: r2Key,
            Body: fileBuffer,
            ContentType: contentType,
          }))

          const newFileUrl = `${publicDomain.replace(/\/$/, '')}/${r2Key}`
          console.log(`   ✅ Uploaded to Cloudflare R2: ${newFileUrl}`)

          // Update file entry in array
          digitalFiles[i] = {
            ...file,
            fileUrl: newFileUrl,
            migratedFromImageKit: true,
            migratedAt: new Date().toISOString()
          }

          isModified = true
          migratedFilesCount++
        } catch (err: any) {
          console.error(`   ❌ Failed to migrate file ${currentUrl}:`, err?.message || err)
        }
      }
    }

    // Check single fileUrl property if exists
    let mainFileUrl = product.fileUrl || product.downloadUrl || ''
    if (mainFileUrl && mainFileUrl.includes('imagekit.io')) {
      try {
        console.log(`\n⏳ Migrating main fileUrl for product "${product.name || doc.id}"...`)
        const response = await axios.get(mainFileUrl, { responseType: 'arraybuffer' })
        const fileBuffer = Buffer.from(response.data)
        const contentType = response.headers['content-type'] || 'application/octet-stream'
        const r2Key = `digital-products/migrated_main_${Date.now()}_${doc.id}`

        await r2Client.send(new PutObjectCommand({
          Bucket: bucketName,
          Key: r2Key,
          Body: fileBuffer,
          ContentType: contentType,
        }))

        const newFileUrl = `${publicDomain.replace(/\/$/, '')}/${r2Key}`
        await doc.ref.update({ fileUrl: newFileUrl, downloadUrl: newFileUrl })
        isModified = true
      } catch (err: any) {
        console.error(`   ❌ Failed to migrate main fileUrl for product ${doc.id}:`, err?.message || err)
      }
    }

    if (isModified) {
      await doc.ref.update({ digitalFiles })
      updatedProductsCount++
      console.log(`✨ Product "${product.name || doc.id}" updated with Cloudflare R2 links.`)
    }
  }

  console.log(`\n🎉 Migration Complete!`)
  console.log(`📊 Summary:`)
  console.log(`   - Migrated Files: ${migratedFilesCount}`)
  console.log(`   - Products Updated: ${updatedProductsCount}`)
}

runMigration().catch((err) => {
  console.error('Fatal Migration Error:', err)
})

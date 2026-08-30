const dotenv = require('dotenv')
const path = require('path')
const axios = require('axios')
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')
const admin = require('firebase-admin')

// Load .env.local variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

async function runMigration() {
  console.log('🚀 Starting ImageKit -> Cloudflare R2 Migration Script...\n')

  // 1. Initialize Firebase Admin
  let adminApp
  if (admin.apps.length > 0) {
    adminApp = admin.apps[0]
  } else {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
    if (serviceAccountJson) {
      try {
        const sa = JSON.parse(serviceAccountJson)
        adminApp = admin.initializeApp({
          credential: admin.credential.cert(sa)
        })
      } catch (err) {
        console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:', err)
      }
    }

    if (!adminApp) {
      const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
      const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL
      const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY ? process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined

      if (projectId && clientEmail && privateKey) {
        adminApp = admin.initializeApp({
          credential: admin.credential.cert({ projectId, clientEmail, privateKey })
        })
      }
    }
  }

  if (!admin.apps.length) {
    console.error('❌ Could not initialize Firebase Admin SDK. Please check FIREBASE_SERVICE_ACCOUNT_JSON or Admin credentials in .env.local')
    process.exit(1)
  }

  const adminDb = admin.firestore()

  // 2. Initialize Cloudflare R2 Client
  let accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID || '8df3facea5b446d2aed1eafbfca818b1'
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || process.env.CLOUDFLARE_ACCESS_KEY_ID
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || process.env.CLOUDFLARE_SECRET_ACCESS_KEY
  const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'fero-elibrary'
  const publicDomain = process.env.NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL || 'https://pub-8df3facea5b446d2aed1eafbfca818b1.r2.dev'

  if (accountId.startsWith('cfat_') && publicDomain) {
    const match = publicDomain.match(/pub-([a-f0-9]{32})\.r2\.dev/)
    if (match && match[1]) accountId = match[1]
  }

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

  // 3. Scan products for ImageKit URLs
  const productsSnapshot = await adminDb.collection('products').get()
  console.log(`📦 Found ${productsSnapshot.size} products in database. Scanning for ImageKit URLs...`)

  let updatedProductsCount = 0
  let migratedFilesCount = 0

  for (const doc of productsSnapshot.docs) {
    const product = doc.data()
    let isModified = false
    const digitalFiles = Array.isArray(product.digitalFiles) ? [...product.digitalFiles] : []

    for (let i = 0; i < digitalFiles.length; i++) {
      const file = digitalFiles[i]
      let currentUrl = (file.fileUrl || file.url || '').trim()
      // Fix double slash in URL e.g. markethub//digital-products
      currentUrl = currentUrl.replace(/([^:]\/)\/+/g, "$1")

      if (currentUrl.includes('imagekit.io')) {
        console.log(`\n⏳ Migrating file "${file.fileName || 'file'}" for product "${product.name || doc.id}"...`)
        console.log(`   Source URL: ${currentUrl}`)

        // Sign ImageKit URL if private key is available
        const ikPrivateKey = process.env.IMAGEKIT_PRIVATE_KEY
        let downloadTargetUrl = currentUrl
        if (ikPrivateKey) {
          try {
            const urlObj = new URL(currentUrl)
            const pathName = urlObj.pathname.replace(/^\//, '')
            const expiry = Math.floor(Date.now() / 1000) + 300
            const crypto = require('crypto')
            const signature = crypto.createHmac('sha1', ikPrivateKey).update(`${pathName}${expiry}`).digest('hex')
            urlObj.searchParams.set('ik-s', signature)
            urlObj.searchParams.set('ik-t', expiry.toString())
            downloadTargetUrl = urlObj.toString()
          } catch (e) {
            console.warn('   ⚠️ Could not sign URL, using raw URL:', e.message)
          }
        }

        try {
          const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept': '*/*'
          }

          if (ikPrivateKey) {
            headers['Authorization'] = `Basic ${Buffer.from(ikPrivateKey + ':').toString('base64')}`
          }

          // Download file buffer
          const response = await axios.get(downloadTargetUrl, {
            responseType: 'arraybuffer',
            headers,
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
            timeout: 300000 // 5 min timeout for large videos
          })
          const fileBuffer = Buffer.from(response.data)
          const contentType = response.headers['content-type'] || file.fileType || 'application/octet-stream'

          // Generate R2 key
          const safeName = (file.fileName || 'file').replace(/[^a-zA-Z0-9._-]/g, '_')
          const r2Key = `digital-products/migrated_${Date.now()}_${safeName}`

          // Upload buffer to Cloudflare R2
          await r2Client.send(new PutObjectCommand({
            Bucket: bucketName,
            Key: r2Key,
            Body: fileBuffer,
            ContentType: contentType,
          }))

          const newFileUrl = `${publicDomain.replace(/\/$/, '')}/${r2Key}`
          console.log(`   ✅ Migrated to Cloudflare R2: ${newFileUrl}`)

          digitalFiles[i] = {
            ...file,
            fileUrl: newFileUrl,
            migratedFromImageKit: true,
            migratedAt: new Date().toISOString()
          }

          isModified = true
          migratedFilesCount++
        } catch (err) {
          console.error(`   ❌ Failed to migrate file ${currentUrl}:`, err.message || err)
        }
      }
    }

    if (isModified) {
      await doc.ref.update({ digitalFiles })
      updatedProductsCount++
      console.log(`✨ Product "${product.name || doc.id}" updated in Firestore.`)
    }
  }

  console.log(`\n🎉 Migration Complete!`)
  console.log(`-----------------------------------`)
  console.log(`📊 Total Files Migrated: ${migratedFilesCount}`)
  console.log(`📦 Total Products Updated: ${updatedProductsCount}`)
  console.log(`-----------------------------------\n`)
}

runMigration().catch((err) => {
  console.error('Fatal Migration Error:', err)
})

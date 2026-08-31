import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

let accountId = (process.env.CLOUDFLARE_R2_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID || '').trim()
const accessKeyId = (process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || process.env.CLOUDFLARE_ACCESS_KEY_ID || '').trim()
const secretAccessKey = (process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || process.env.CLOUDFLARE_SECRET_ACCESS_KEY || '').trim()
const bucketName = (process.env.CLOUDFLARE_R2_BUCKET_NAME || 'fero-elibrary').trim()
const publicDomain = (process.env.NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL || 'https://pub-8df3facea5b446d2aed1eafbfca818b1.r2.dev').trim()

// Extract 32-char hex account ID or fallback to 8df3facea5b446d2aed1eafbfca818b1
if (!/^[a-f0-9]{32}$/i.test(accountId)) {
  const match = publicDomain.match(/([a-f0-9]{32})/)
  if (match && match[1]) {
    accountId = match[1]
  } else {
    accountId = '8df3facea5b446d2aed1eafbfca818b1'
  }
}

export function getR2Client() {
  if (!accessKeyId || !secretAccessKey) {
    throw new Error('Cloudflare R2 keys (CLOUDFLARE_R2_ACCESS_KEY_ID & CLOUDFLARE_R2_SECRET_ACCESS_KEY) are missing in environment variables')
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    forcePathStyle: true,
  })
}

export async function generateR2UploadUrl(key: string, contentType: string) {
  const client = getR2Client()
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: contentType,
  })

  // Generate 15-minute presigned upload URL
  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 900 })
  const publicDomain = process.env.NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL
  const fileUrl = publicDomain ? `${publicDomain.replace(/\/$/, '')}/${key}` : `https://${accountId}.r2.cloudflarestorage.com/${bucketName}/${key}`

  return { uploadUrl, fileUrl, key }
}

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

let accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID || ''
const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || process.env.CLOUDFLARE_ACCESS_KEY_ID || ''
const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || process.env.CLOUDFLARE_SECRET_ACCESS_KEY || ''
const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'fero-elibrary'
const publicDomain = process.env.NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL || ''

// If accountId is an API Token ID (starts with cfat_), extract real 32-char Account ID from publicDomain (e.g. pub-<ACCOUNT_ID>.r2.dev)
if (accountId.startsWith('cfat_') && publicDomain) {
  const match = publicDomain.match(/pub-([a-f0-9]{32})\.r2\.dev/)
  if (match && match[1]) {
    accountId = match[1]
  }
}

export function getR2Client() {
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error('Cloudflare R2 is not fully configured in environment variables')
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

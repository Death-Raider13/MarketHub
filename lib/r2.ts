import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID
const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID
const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY
const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'fero-elibrary'

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

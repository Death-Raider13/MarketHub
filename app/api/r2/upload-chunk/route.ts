import { NextRequest, NextResponse } from 'next/server'
import { verifyAuthToken } from '@/lib/api-auth'
import { getR2Client } from '@/lib/r2'
import {
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand
} from '@aws-sdk/client-s3'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuthToken(request)
    if ('error' in auth) return auth.error

    const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'fero-elibrary'
    const publicDomain = process.env.NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL || 'https://pub-8df3facea5b446d2aed1eafbfca818b1.r2.dev'
    const r2Client = getR2Client()

    const contentTypeHeader = request.headers.get('content-type') || ''

    // Action 1: Init Multipart Upload or Complete / Abort
    if (contentTypeHeader.includes('application/json')) {
      const body = await request.json()
      const { action, fileName, fileType, uploadId, key, parts } = body

      if (action === 'init') {
        const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
        const r2Key = `digital-products/${Date.now()}_${sanitizedFileName}`

        const initCommand = new CreateMultipartUploadCommand({
          Bucket: bucketName,
          Key: r2Key,
          ContentType: fileType || 'application/octet-stream',
        })

        const res = await r2Client.send(initCommand)

        return NextResponse.json({
          uploadId: res.UploadId,
          key: r2Key,
        })
      }

      if (action === 'complete') {
        const completeCommand = new CompleteMultipartUploadCommand({
          Bucket: bucketName,
          Key: key,
          UploadId: uploadId,
          MultipartUpload: {
            Parts: parts, // Array of { ETag, PartNumber }
          },
        })

        await r2Client.send(completeCommand)
        const fileUrl = `${publicDomain.replace(/\/$/, '')}/${key}`

        return NextResponse.json({
          success: true,
          fileUrl,
          key,
        })
      }

      if (action === 'abort') {
        await r2Client.send(
          new AbortMultipartUploadCommand({
            Bucket: bucketName,
            Key: key,
            UploadId: uploadId,
          })
        )
        return NextResponse.json({ success: true })
      }
    }

    // Action 2: Upload Chunk (FormData)
    const formData = await request.formData()
    const chunk = formData.get('chunk') as File | null
    const key = formData.get('key') as string
    const uploadId = formData.get('uploadId') as string
    const partNumberStr = formData.get('partNumber') as string

    if (!chunk || !key || !uploadId || !partNumberStr) {
      return NextResponse.json({ error: 'Missing required chunk parameter' }, { status: 400 })
    }

    const partNumber = parseInt(partNumberStr, 10)
    const bytes = await chunk.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uploadPartCommand = new UploadPartCommand({
      Bucket: bucketName,
      Key: key,
      UploadId: uploadId,
      PartNumber: partNumber,
      Body: buffer,
    })

    const partRes = await r2Client.send(uploadPartCommand)

    return NextResponse.json({
      partNumber,
      ETag: partRes.ETag,
    })
  } catch (error: any) {
    console.error('R2 Multipart Upload Error:', error)
    return NextResponse.json(
      { error: error?.message || 'Multipart chunk upload failed' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuthToken } from '@/lib/api-auth'
import { getR2Client } from '@/lib/r2'
import { PutObjectCommand } from '@aws-sdk/client-s3'

export const dynamic = 'force-dynamic'

// Set maximum duration for video upload processing
export const maxDuration = 60 // 60 seconds max execution time on Vercel

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuthToken(request)
    if ('error' in auth) return auth.error

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const key = `digital-products/${Date.now()}_${sanitizedFileName}`
    const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'fero-elibrary'
    const publicDomain = process.env.NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL || 'https://pub-8df3facea5b446d2aed1eafbfca818b1.r2.dev'

    const r2Client = getR2Client()

    await r2Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: buffer,
        ContentType: file.type || 'application/octet-stream',
      })
    )

    const fileUrl = `${publicDomain.replace(/\/$/, '')}/${key}`

    return NextResponse.json({
      success: true,
      fileUrl,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type || 'application/octet-stream',
      key,
    })
  } catch (error: any) {
    console.error('Server R2 Upload Error:', error)
    return NextResponse.json(
      { error: error?.message || 'Server upload failed' },
      { status: 500 }
    )
  }
}

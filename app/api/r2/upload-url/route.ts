import { NextRequest, NextResponse } from 'next/server'
import { verifyAuthToken } from '@/lib/api-auth'
import { generateR2UploadUrl } from '@/lib/r2'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuthToken(request)
    if ('error' in auth) return auth.error

    const { fileName, fileType } = await request.json()

    if (!fileName || !fileType) {
      return NextResponse.json(
        { error: 'fileName and fileType are required' },
        { status: 400 }
      )
    }

    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
    const key = `digital-products/${Date.now()}_${sanitizedFileName}`

    const { uploadUrl, fileUrl } = await generateR2UploadUrl(key, fileType)

    return NextResponse.json({ uploadUrl, fileUrl, key })
  } catch (error: any) {
    console.error('Cloudflare R2 presigned URL generation error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to generate upload URL' },
      { status: 500 }
    )
  }
}

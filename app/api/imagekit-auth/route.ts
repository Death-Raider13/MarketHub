import { NextResponse } from 'next/server'
import crypto from 'crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY

    if (!privateKey) {
      return NextResponse.json(
        { error: 'ImageKit is not configured' },
        { status: 500 }
      )
    }

    const token = crypto.randomBytes(16).toString('hex')
    const expire = Math.floor(Date.now() / 1000) + 60 * 30
    const signature = crypto
      .createHmac('sha1', privateKey)
      .update(token + expire)
      .digest('hex')

    return NextResponse.json({ token, expire, signature })
  } catch (error) {
    console.error('ImageKit auth error:', error)
    return NextResponse.json(
      { error: 'Failed to generate ImageKit auth parameters' },
      { status: 500 }
    )
  }
}

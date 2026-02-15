import { NextResponse } from 'next/server'
import ImageKit from 'imagekit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY
    const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT

    if (!publicKey || !privateKey || !urlEndpoint) {
      return NextResponse.json(
        { error: 'ImageKit is not configured' },
        { status: 500 }
      )
    }

    const imagekit = new ImageKit({
      publicKey,
      privateKey,
      urlEndpoint
    })

    const authParams = imagekit.getAuthenticationParameters()
    return NextResponse.json(authParams)
  } catch (error) {
    console.error('ImageKit auth error:', error)
    return NextResponse.json(
      { error: 'Failed to generate ImageKit auth parameters' },
      { status: 500 }
    )
  }
}

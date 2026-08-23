import { NextRequest, NextResponse } from 'next/server'
import { recordAffiliateClick } from '@/lib/affiliate'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const productId = typeof body.productId === 'string' ? body.productId.trim() : ''
    const code = body.code
    const clickId = typeof body.clickId === 'string' ? body.clickId : null

    if (!productId || !code) {
      return NextResponse.json({ error: 'Product ID and affiliate code are required' }, { status: 400 })
    }

    const result = await recordAffiliateClick({
      code,
      productId,
      clickId,
      landingPath: typeof body.landingPath === 'string' ? body.landingPath : null,
      userAgent: request.headers.get('user-agent'),
    })

    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('Affiliate click tracking error:', error)
    return NextResponse.json({ error: 'Unable to record affiliate click' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { logEvent } from '@/lib/analytics'

/**
 * Handle product view analytics
 */
export async function POST(request: NextRequest) {
  try {
    const { productId, creatorId, userId } = await request.json()

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    await logEvent('view', { productId, creatorId, userId })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('View Analytics Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

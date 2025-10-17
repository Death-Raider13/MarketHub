import { NextRequest, NextResponse } from 'next/server'
import { saveImpression } from '@/lib/advertising/ad-database'

/**
 * Track ad impression
 * POST /api/ads/track/impression
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, campaign, timestamp, userAgent, referrer, pageUrl } = body

    // Get client IP
    const ip = request.headers.get('x-forwarded-for') || 
                request.headers.get('x-real-ip') || 
                'unknown'

    // Parse search params
    const searchParams = request.nextUrl.searchParams
    const impressionId = searchParams.get('id') || id
    const campaignId = searchParams.get('campaign') || campaign

    if (!impressionId || !campaignId) {
      return NextResponse.json(
        { error: 'Missing impression ID or campaign ID' },
        { status: 400 }
      )
    }

    // Note: Actual impression was already created by selectAdToDisplay
    // This endpoint just confirms visibility and updates metadata

    return NextResponse.json({ 
      success: true,
      impressionId 
    })

  } catch (error) {
    console.error('Error tracking impression:', error)
    return NextResponse.json(
      { error: 'Failed to track impression' },
      { status: 500 }
    )
  }
}

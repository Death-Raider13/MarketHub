import { NextRequest, NextResponse } from 'next/server'
import { recordClick } from '@/lib/advertising/ad-database'

/**
 * Track ad click
 * POST /api/ads/track/click
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { timestamp, clickPosition } = body

    // Parse search params
    const searchParams = request.nextUrl.searchParams
    const impressionId = searchParams.get('id')
    const campaignId = searchParams.get('campaign')

    if (!impressionId || !campaignId) {
      return NextResponse.json(
        { error: 'Missing impression ID or campaign ID' },
        { status: 400 }
      )
    }

    // Get client info
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const device = getDeviceFromUserAgent(userAgent)

    // Record click
    await recordClick(impressionId, {
      campaignId,
      slotId: '', // TODO: Get from impression
      vendorId: '', // TODO: Get from impression
      timestamp: new Date(timestamp),
      clickPosition: clickPosition || { x: 0, y: 0 },
      sessionId: '', // TODO: Get from session
      device,
      destinationUrl: '', // TODO: Get from campaign
      openedInNewTab: true,
      cost: 0, // TODO: Calculate based on campaign
      vendorEarning: 0,
      platformEarning: 0
    })

    return NextResponse.json({ 
      success: true,
      impressionId,
      campaignId
    })

  } catch (error) {
    console.error('Error tracking click:', error)
    return NextResponse.json(
      { error: 'Failed to track click' },
      { status: 500 }
    )
  }
}

/**
 * Detect device type from user agent
 */
function getDeviceFromUserAgent(userAgent: string): 'desktop' | 'mobile' | 'tablet' {
  const ua = userAgent.toLowerCase()
  
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet'
  }
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return 'mobile'
  }
  return 'desktop'
}

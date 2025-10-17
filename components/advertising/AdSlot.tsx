"use client"

import { useEffect, useState, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, X } from 'lucide-react'
import { selectAdToDisplay } from '@/lib/advertising/ad-rotation'
import { AdSelectionResult, AdDisplayContext } from '@/lib/types/advertising'

interface AdSlotProps {
  vendorId: string
  placement: 'sidebar' | 'banner' | 'inline' | 'footer'
  storeCategory: string
  storeRating: number
  storeType: 'all' | 'premium' | 'verified'
  className?: string
  fallback?: React.ReactNode
}

/**
 * AdSlot Component
 * Displays ads on vendor storefronts with smart rotation
 */
export function AdSlot({
  vendorId,
  placement,
  storeCategory,
  storeRating,
  storeType,
  className = '',
  fallback
}: AdSlotProps) {
  const [ad, setAd] = useState<AdSelectionResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const adRef = useRef<HTMLDivElement>(null)
  const impressionTracked = useRef(false)

  // Generate session ID
  const sessionId = useRef(
    typeof window !== 'undefined' 
      ? `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      : ''
  )

  // Detect device type
  const getDeviceType = (): 'desktop' | 'mobile' | 'tablet' => {
    if (typeof window === 'undefined') return 'desktop'
    
    const width = window.innerWidth
    if (width < 768) return 'mobile'
    if (width < 1024) return 'tablet'
    return 'desktop'
  }

  // Load ad on mount
  useEffect(() => {
    loadAd()
  }, [vendorId, placement])

  // Track impression when ad becomes visible
  useEffect(() => {
    if (!ad || !adRef.current || impressionTracked.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !impressionTracked.current) {
            setVisible(true)
            trackImpression()
            impressionTracked.current = true
          }
        })
      },
      { threshold: 0.5 } // Ad must be 50% visible
    )

    observer.observe(adRef.current)

    return () => {
      if (adRef.current) {
        observer.unobserve(adRef.current)
      }
    }
  }, [ad])

  /**
   * Load ad from rotation system
   */
  const loadAd = async () => {
    try {
      setLoading(true)

      // Build display context
      const context: AdDisplayContext = {
        vendorId,
        storeCategory,
        storeRating,
        storeType,
        sessionId: sessionId.current,
        device: getDeviceType(),
        pageType: 'home', // TODO: Detect page type
        placement
      }

      // Get ad slot ID (format: vendorId_placement)
      const slotId = `${vendorId}_${placement}`

      // Select ad to display
      const selectedAd = await selectAdToDisplay(slotId, context)

      if (selectedAd) {
        setAd(selectedAd)
      } else {
        setAd(null)
      }
    } catch (error) {
      console.error('Error loading ad:', error)
      setAd(null)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Track impression
   */
  const trackImpression = async () => {
    if (!ad) return

    try {
      await fetch(ad.trackingUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          referrer: document.referrer,
          pageUrl: window.location.href
        })
      })
    } catch (error) {
      console.error('Error tracking impression:', error)
    }
  }

  /**
   * Handle ad click
   */
  const handleClick = async () => {
    if (!ad) return

    try {
      // Track click
      await fetch(ad.clickUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          clickPosition: { x: 0, y: 0 } // TODO: Get actual click position
        })
      })

      // Open destination URL
      window.open(ad.campaign.creative.destinationUrl, '_blank')
    } catch (error) {
      console.error('Error tracking click:', error)
      // Still open URL even if tracking fails
      window.open(ad.campaign.creative.destinationUrl, '_blank')
    }
  }

  /**
   * Dismiss ad (for popup/banner types)
   */
  const handleDismiss = () => {
    setDismissed(true)
  }

  // Don't render if dismissed
  if (dismissed) return null

  // Show loading state
  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <Card className="p-4">
          <div className="h-48 bg-muted rounded" />
        </Card>
      </div>
    )
  }

  // Show fallback if no ad
  if (!ad) {
    return fallback ? <>{fallback}</> : null
  }

  // Render ad based on placement type
  return (
    <div ref={adRef} className={className}>
      {placement === 'banner' && (
        <BannerAd ad={ad} onClick={handleClick} onDismiss={handleDismiss} />
      )}
      {placement === 'sidebar' && (
        <SidebarAd ad={ad} onClick={handleClick} />
      )}
      {placement === 'inline' && (
        <InlineAd ad={ad} onClick={handleClick} />
      )}
      {placement === 'footer' && (
        <FooterAd ad={ad} onClick={handleClick} />
      )}
    </div>
  )
}

/**
 * Banner Ad (Top of page)
 */
function BannerAd({ 
  ad, 
  onClick, 
  onDismiss 
}: { 
  ad: AdSelectionResult
  onClick: () => void
  onDismiss: () => void
}) {
  return (
    <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
      <div className="flex items-center gap-4 p-4">
        {/* Ad Image */}
        <div className="flex-shrink-0">
          <img
            src={ad.campaign.creative.imageUrl}
            alt={ad.campaign.creative.title}
            className="w-24 h-24 object-cover rounded"
          />
        </div>

        {/* Ad Content */}
        <div className="flex-1 min-w-0">
          <Badge variant="outline" className="mb-2 text-xs">
            Sponsored
          </Badge>
          <h3 className="font-semibold text-lg mb-1 truncate">
            {ad.campaign.creative.title}
          </h3>
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {ad.campaign.creative.description}
          </p>
          <button
            onClick={onClick}
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            {ad.campaign.creative.ctaText}
            <ExternalLink className="h-4 w-4" />
          </button>
        </div>

        {/* Dismiss Button */}
        <button
          onClick={onDismiss}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted"
          aria-label="Dismiss ad"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </Card>
  )
}

/**
 * Sidebar Ad (Right side)
 */
function SidebarAd({ 
  ad, 
  onClick 
}: { 
  ad: AdSelectionResult
  onClick: () => void
}) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={onClick}>
      {/* Ad Image */}
      <div className="aspect-square bg-muted overflow-hidden">
        <img
          src={ad.campaign.creative.imageUrl}
          alt={ad.campaign.creative.title}
          className="w-full h-full object-cover hover:scale-105 transition-transform"
        />
      </div>

      {/* Ad Content */}
      <div className="p-4">
        <Badge variant="secondary" className="mb-2 text-xs">
          Sponsored
        </Badge>
        <h3 className="font-semibold mb-2 line-clamp-2">
          {ad.campaign.creative.title}
        </h3>
        <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
          {ad.campaign.creative.description}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-primary">
            {ad.campaign.creative.ctaText}
          </span>
          <ExternalLink className="h-4 w-4 text-primary" />
        </div>
      </div>
    </Card>
  )
}

/**
 * Inline Ad (Between products)
 */
function InlineAd({ 
  ad, 
  onClick 
}: { 
  ad: AdSelectionResult
  onClick: () => void
}) {
  return (
    <Card 
      className="overflow-hidden hover:shadow-md transition-all cursor-pointer border-2 border-dashed border-primary/30"
      onClick={onClick}
    >
      <div className="flex items-center gap-4 p-4">
        {/* Ad Image */}
        <div className="flex-shrink-0">
          <img
            src={ad.campaign.creative.imageUrl}
            alt={ad.campaign.creative.title}
            className="w-20 h-20 object-cover rounded"
          />
        </div>

        {/* Ad Content */}
        <div className="flex-1 min-w-0">
          <Badge variant="outline" className="mb-1 text-xs">
            Sponsored
          </Badge>
          <h3 className="font-semibold mb-1 truncate">
            {ad.campaign.creative.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {ad.campaign.creative.description}
          </p>
        </div>

        {/* CTA */}
        <div className="flex-shrink-0">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            {ad.campaign.creative.ctaText}
            <ExternalLink className="h-4 w-4" />
          </div>
        </div>
      </div>
    </Card>
  )
}

/**
 * Footer Ad (Bottom of page)
 */
function FooterAd({ 
  ad, 
  onClick 
}: { 
  ad: AdSelectionResult
  onClick: () => void
}) {
  return (
    <Card 
      className="overflow-hidden hover:shadow-md transition-all cursor-pointer bg-muted/50"
      onClick={onClick}
    >
      <div className="flex items-center justify-between gap-4 p-3">
        {/* Ad Image */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <img
            src={ad.campaign.creative.imageUrl}
            alt={ad.campaign.creative.title}
            className="w-12 h-12 object-cover rounded"
          />
          <div className="flex-1 min-w-0">
            <Badge variant="secondary" className="mb-1 text-xs">
              Ad
            </Badge>
            <h3 className="font-medium text-sm truncate">
              {ad.campaign.creative.title}
            </h3>
          </div>
        </div>

        {/* CTA */}
        <div className="flex-shrink-0">
          <span className="text-sm font-medium text-primary">
            {ad.campaign.creative.ctaText}
          </span>
        </div>
      </div>
    </Card>
  )
}

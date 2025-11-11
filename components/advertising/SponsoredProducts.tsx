"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink, Star } from "lucide-react"
import { getSponsoredProductCampaigns, trackCampaignImpression, trackCampaignClick, DisplayCampaign } from "@/lib/advertising/campaign-display"
import Image from "next/image"

interface SponsoredProductsProps {
  category: string
  maxAds?: number
  layout?: 'grid' | 'list' | 'carousel'
  className?: string
}

export function SponsoredProducts({ 
  category, 
  maxAds = 6, 
  layout = 'grid',
  className = "" 
}: SponsoredProductsProps) {
  const [campaigns, setCampaigns] = useState<DisplayCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [impressionTracked, setImpressionTracked] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadCampaigns()
  }, [category, maxAds])

  useEffect(() => {
    // Track impressions for visible ads
    campaigns.forEach(campaign => {
      if (!impressionTracked.has(campaign.id)) {
        trackImpression(campaign)
        setImpressionTracked(prev => new Set([...prev, campaign.id]))
      }
    })
  }, [campaigns, impressionTracked])

  const loadCampaigns = async () => {
    try {
      setLoading(true)
      const activeCampaigns = await getSponsoredProductCampaigns(category, maxAds)
      setCampaigns(activeCampaigns)
    } catch (error) {
      console.error("Error loading sponsored product campaigns:", error)
    } finally {
      setLoading(false)
    }
  }

  const trackImpression = async (campaign: DisplayCampaign) => {
    try {
      await trackCampaignImpression(campaign.id, {
        placement: `sponsored_product_${layout}`,
        category,
        deviceType: getDeviceType(),
        userAgent: navigator.userAgent
      })
    } catch (error) {
      console.error("Error tracking impression:", error)
    }
  }

  const handleClick = async (campaign: DisplayCampaign) => {
    try {
      await trackCampaignClick(campaign.id, {
        placement: `sponsored_product_${layout}`,
        category,
        deviceType: getDeviceType(),
        userAgent: navigator.userAgent
      })
      
      window.open(campaign.creative.destinationUrl, '_blank')
    } catch (error) {
      console.error("Error tracking click:", error)
      window.open(campaign.creative.destinationUrl, '_blank')
    }
  }

  const getDeviceType = (): string => {
    if (typeof window === 'undefined') return 'desktop'
    const width = window.innerWidth
    if (width < 768) return 'mobile'
    if (width < 1024) return 'tablet'
    return 'desktop'
  }

  if (loading) {
    const gridCols = layout === 'grid' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6' : 'grid-cols-1'
    
    return (
      <div className={`grid ${gridCols} gap-4 ${className}`}>
        {Array.from({ length: maxAds }).map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardContent className="p-3">
              <div className="aspect-square bg-muted rounded mb-2" />
              <div className="h-3 bg-muted rounded mb-1" />
              <div className="h-2 bg-muted rounded w-2/3 mb-1" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (campaigns.length === 0) {
    return null
  }

  // Grid layout (default)
  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-4">
        <Badge variant="outline" className="text-xs">
          Sponsored Products
        </Badge>
        <span className="text-xs text-muted-foreground">
          {campaigns.length} sponsored results in {category}
        </span>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {campaigns.map((campaign) => (
          <Card key={campaign.id} className="group cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="p-3">
              <div className="relative aspect-square mb-2 overflow-hidden rounded">
                <Image
                  src={campaign.creative.imageUrl || "/placeholder.svg"}
                  alt={campaign.creative.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform"
                />
                <Badge className="absolute top-2 left-2 text-xs bg-orange-500 text-white">
                  Sponsored
                </Badge>
              </div>
              
              <h3 className="font-medium text-sm mb-1 line-clamp-2">
                {campaign.creative.title}
              </h3>
              <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
                {campaign.creative.description}
              </p>
              
              <div className="flex items-center gap-1 mb-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                ))}
                <span className="text-xs text-muted-foreground ml-1">(4.8)</span>
              </div>
              
              <Button 
                size="sm" 
                className="w-full text-xs"
                onClick={() => handleClick(campaign)}
              >
                {campaign.creative.ctaText || "View"}
                <ExternalLink className="ml-1 h-3 w-3" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

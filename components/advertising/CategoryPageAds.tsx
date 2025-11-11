"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"
import { getCategoryPageCampaigns, trackCampaignImpression, trackCampaignClick, DisplayCampaign } from "@/lib/advertising/campaign-display"
import Image from "next/image"

interface CategoryPageAdsProps {
  category: string
  placement?: 'top' | 'sidebar' | 'grid'
  maxAds?: number
  className?: string
}

export function CategoryPageAds({ 
  category, 
  placement = 'top', 
  maxAds = 4, 
  className = "" 
}: CategoryPageAdsProps) {
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
      const activeCampaigns = await getCategoryPageCampaigns(category, maxAds)
      setCampaigns(activeCampaigns)
    } catch (error) {
      console.error("Error loading category page campaigns:", error)
    } finally {
      setLoading(false)
    }
  }

  const trackImpression = async (campaign: DisplayCampaign) => {
    try {
      await trackCampaignImpression(campaign.id, {
        placement: `category_${placement}`,
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
        placement: `category_${placement}`,
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
    if (placement === 'grid') {
      return (
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${className}`}>
          {Array.from({ length: maxAds }).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardContent className="p-3">
                <div className="aspect-square bg-muted rounded mb-2" />
                <div className="h-3 bg-muted rounded mb-1" />
                <div className="h-2 bg-muted rounded w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      )
    }

    return (
      <div className={`space-y-4 ${className}`}>
        {Array.from({ length: Math.min(maxAds, 2) }).map((_, index) => (
          <Card key={index} className="animate-pulse">
            <div className="aspect-[4/1] bg-muted" />
          </Card>
        ))}
      </div>
    )
  }

  if (campaigns.length === 0) {
    return null
  }

  if (placement === 'grid') {
    return (
      <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${className}`}>
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
                <Badge className="absolute top-2 left-2 text-xs bg-black/70 text-white">
                  Sponsored
                </Badge>
              </div>
              <h3 className="font-medium text-sm mb-1 line-clamp-2">
                {campaign.creative.title}
              </h3>
              <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
                {campaign.creative.description}
              </p>
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
    )
  }

  if (placement === 'sidebar') {
    return (
      <div className={`space-y-4 ${className}`}>
        {campaigns.slice(0, 2).map((campaign) => (
          <Card key={campaign.id} className="group">
            <CardContent className="p-4">
              <Badge variant="secondary" className="text-xs mb-3">
                Sponsored
              </Badge>
              
              <div className="relative aspect-[3/2] mb-3 overflow-hidden rounded">
                <Image
                  src={campaign.creative.imageUrl || "/placeholder.svg"}
                  alt={campaign.creative.title}
                  fill
                  className="object-cover hover:scale-105 transition-transform cursor-pointer"
                  onClick={() => handleClick(campaign)}
                />
              </div>
              
              <h3 className="font-semibold text-sm mb-1 line-clamp-2">
                {campaign.creative.title}
              </h3>
              <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                {campaign.creative.description}
              </p>
              
              <Button 
                size="sm" 
                className="w-full"
                onClick={() => handleClick(campaign)}
              >
                {campaign.creative.ctaText || "Learn More"}
                <ExternalLink className="ml-1 h-3 w-3" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // Top placement (banner style)
  return (
    <div className={`space-y-4 ${className}`}>
      {campaigns.slice(0, 2).map((campaign) => (
        <Card key={campaign.id} className="relative overflow-hidden group">
          <div className="relative aspect-[4/1] w-full">
            <Image
              src={campaign.creative.imageUrl || "/placeholder.svg"}
              alt={campaign.creative.title}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-between p-6">
              <div className="flex-1 text-white">
                <Badge className="mb-2 bg-white/20 text-white border-white/30">
                  Sponsored • {category}
                </Badge>
                <h3 className="text-xl font-bold mb-2 drop-shadow-lg">
                  {campaign.creative.title}
                </h3>
                <p className="text-sm drop-shadow-lg mb-3 max-w-2xl">
                  {campaign.creative.description}
                </p>
                <Button 
                  onClick={() => handleClick(campaign)}
                  className="bg-white text-black hover:bg-gray-100"
                >
                  {campaign.creative.ctaText || "Shop Now"}
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

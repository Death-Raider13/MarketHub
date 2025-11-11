"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink, X } from "lucide-react"
import { getVendorStoreCampaigns, trackCampaignImpression, trackCampaignClick, DisplayCampaign } from "@/lib/advertising/campaign-display"
import Image from "next/image"

interface VendorStoreAdsProps {
  vendorId: string
  placement?: 'sidebar' | 'banner' | 'inline'
  maxAds?: number
  className?: string
}

export function VendorStoreAds({ 
  vendorId, 
  placement = 'sidebar', 
  maxAds = 3, 
  className = "" 
}: VendorStoreAdsProps) {
  const [campaigns, setCampaigns] = useState<DisplayCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [dismissedAds, setDismissedAds] = useState<Set<string>>(new Set())
  const [impressionTracked, setImpressionTracked] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadCampaigns()
  }, [vendorId, maxAds])

  useEffect(() => {
    // Track impressions for visible ads
    campaigns.forEach(campaign => {
      if (!impressionTracked.has(campaign.id) && !dismissedAds.has(campaign.id)) {
        trackImpression(campaign)
        setImpressionTracked(prev => new Set([...prev, campaign.id]))
      }
    })
  }, [campaigns, impressionTracked, dismissedAds])

  const loadCampaigns = async () => {
    try {
      setLoading(true)
      const activeCampaigns = await getVendorStoreCampaigns(vendorId, maxAds)
      setCampaigns(activeCampaigns)
    } catch (error) {
      console.error("Error loading vendor store campaigns:", error)
    } finally {
      setLoading(false)
    }
  }

  const trackImpression = async (campaign: DisplayCampaign) => {
    try {
      await trackCampaignImpression(campaign.id, {
        placement: `vendor_store_${placement}`,
        vendorId,
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
        placement: `vendor_store_${placement}`,
        vendorId,
        deviceType: getDeviceType(),
        userAgent: navigator.userAgent
      })
      
      window.open(campaign.creative.destinationUrl, '_blank')
    } catch (error) {
      console.error("Error tracking click:", error)
      window.open(campaign.creative.destinationUrl, '_blank')
    }
  }

  const handleDismiss = (campaignId: string) => {
    setDismissedAds(prev => new Set([...prev, campaignId]))
  }

  const getDeviceType = (): string => {
    if (typeof window === 'undefined') return 'desktop'
    const width = window.innerWidth
    if (width < 768) return 'mobile'
    if (width < 1024) return 'tablet'
    return 'desktop'
  }

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {Array.from({ length: maxAds }).map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardContent className="p-4">
              <div className="aspect-[3/2] bg-muted rounded mb-3" />
              <div className="h-4 bg-muted rounded mb-2" />
              <div className="h-3 bg-muted rounded w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const visibleCampaigns = campaigns.filter(campaign => !dismissedAds.has(campaign.id))

  if (visibleCampaigns.length === 0) {
    return null
  }

  if (placement === 'banner') {
    return (
      <div className={`space-y-4 ${className}`}>
        {visibleCampaigns.map((campaign) => (
          <Card key={campaign.id} className="relative overflow-hidden group">
            <div className="relative aspect-[4/1] w-full">
              <Image
                src={campaign.creative.imageUrl || "/placeholder.svg"}
                alt={campaign.creative.title}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/20 flex items-center justify-between p-4">
                <div className="flex-1 text-white">
                  <Badge className="mb-2 bg-white/20 text-white border-white/30">
                    Sponsored
                  </Badge>
                  <h3 className="text-lg font-bold mb-1 drop-shadow-lg">
                    {campaign.creative.title}
                  </h3>
                  <p className="text-sm drop-shadow-lg mb-2">
                    {campaign.creative.description}
                  </p>
                  <Button 
                    size="sm"
                    onClick={() => handleClick(campaign)}
                    className="bg-white text-black hover:bg-gray-100"
                  >
                    {campaign.creative.ctaText || "Learn More"}
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleDismiss(campaign.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {visibleCampaigns.map((campaign) => (
        <Card key={campaign.id} className="relative group">
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-3">
              <Badge variant="secondary" className="text-xs">
                Sponsored
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleDismiss(campaign.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            
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

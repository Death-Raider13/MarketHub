"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react"
import { getHomepageBannerCampaigns, selectWeightedRandomCampaign, trackCampaignImpression, trackCampaignClick, DisplayCampaign } from "@/lib/advertising/campaign-display"
import Image from "next/image"

interface HomepageBannerProps {
  className?: string
  maxAds?: number
  autoRotate?: boolean
  rotationInterval?: number // in seconds
}

export function HomepageBanner({ 
  className = "", 
  maxAds = 5, 
  autoRotate = true, 
  rotationInterval = 10 
}: HomepageBannerProps) {
  const [campaigns, setCampaigns] = useState<DisplayCampaign[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [impressionTracked, setImpressionTracked] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadCampaigns()
  }, [maxAds])

  useEffect(() => {
    if (autoRotate && campaigns.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % campaigns.length)
      }, rotationInterval * 1000)

      return () => clearInterval(interval)
    }
  }, [campaigns.length, autoRotate, rotationInterval])

  // Track impression when ad becomes visible
  useEffect(() => {
    if (campaigns.length > 0 && currentIndex < campaigns.length) {
      const currentCampaign = campaigns[currentIndex]
      if (currentCampaign && !impressionTracked.has(currentCampaign.id)) {
        trackImpression(currentCampaign)
        setImpressionTracked(prev => new Set([...prev, currentCampaign.id]))
      }
    }
  }, [currentIndex, campaigns, impressionTracked])

  const loadCampaigns = async () => {
    try {
      setLoading(true)
      const activeCampaigns = await getHomepageBannerCampaigns(maxAds)
      setCampaigns(activeCampaigns)
    } catch (error) {
      console.error("Error loading homepage banner campaigns:", error)
    } finally {
      setLoading(false)
    }
  }

  const trackImpression = async (campaign: DisplayCampaign) => {
    try {
      await trackCampaignImpression(campaign.id, {
        placement: 'homepage_banner',
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
        placement: 'homepage_banner',
        deviceType: getDeviceType(),
        userAgent: navigator.userAgent
      })
      
      // Open destination URL
      window.open(campaign.creative.destinationUrl, '_blank')
    } catch (error) {
      console.error("Error tracking click:", error)
      // Still open the URL even if tracking fails
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

  const nextAd = () => {
    setCurrentIndex((prev) => (prev + 1) % campaigns.length)
  }

  const prevAd = () => {
    setCurrentIndex((prev) => (prev - 1 + campaigns.length) % campaigns.length)
  }

  if (loading) {
    return (
      <Card className={`relative overflow-hidden ${className}`}>
        <div className="aspect-[4/1] w-full bg-muted animate-pulse" />
      </Card>
    )
  }

  if (campaigns.length === 0) {
    return null // No ads to show
  }

  const currentCampaign = campaigns[currentIndex]

  return (
    <Card className={`relative overflow-hidden group ${className}`}>
      <div className="relative aspect-[4/1] w-full bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
        <Image
          src={currentCampaign.creative.imageUrl || "/placeholder.svg"}
          alt={currentCampaign.creative.title}
          fill
          className="object-cover"
          priority
        />
        
        {/* Overlay Content */}
        <div className="absolute inset-0 bg-black/20 flex items-center justify-between p-6">
          <div className="flex-1 text-white">
            <Badge className="mb-2 bg-white/20 text-white border-white/30">
              Sponsored
            </Badge>
            <h2 className="text-2xl font-bold mb-2 drop-shadow-lg">
              {currentCampaign.creative.title}
            </h2>
            <p className="text-lg mb-4 drop-shadow-lg max-w-2xl">
              {currentCampaign.creative.description}
            </p>
            <Button 
              onClick={() => handleClick(currentCampaign)}
              className="bg-white text-black hover:bg-gray-100"
            >
              {currentCampaign.creative.ctaText || "Learn More"}
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Navigation Arrows */}
        {campaigns.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={prevAd}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={nextAd}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </>
        )}

        {/* Dots Indicator */}
        {campaigns.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
            {campaigns.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex 
                    ? 'bg-white' 
                    : 'bg-white/50 hover:bg-white/70'
                }`}
                onClick={() => setCurrentIndex(index)}
              />
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}

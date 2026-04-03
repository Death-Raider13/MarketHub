"use client"

import { useState, useEffect } from "react"
import { getCreatorName } from "@/lib/creator-utils"

interface CreatorNameProps {
  creatorId: string
  creatorName?: string
  fallback?: string
  className?: string
}

export function CreatorName({
  creatorId,
  creatorName,
  fallback = "Creator Hub",
  className = ""
}: CreatorNameProps) {
  const [displayName, setDisplayName] = useState<string>(creatorName || fallback)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchCreatorName = async () => {
      // Only fetch if we don't have a creator name or it's the default fallback
      if (creatorId && (!creatorName || creatorName === 'creator' || creatorName === 'Creator' || creatorName === fallback)) {
        setLoading(true)
        try {
          const name = await getCreatorName(creatorId)
          setDisplayName(name)
        } catch (error) {
          console.error('Error fetching creator name:', error)
          setDisplayName(fallback)
        } finally {
          setLoading(false)
        }
      }
    }

    fetchCreatorName()
  }, [creatorId, creatorName, fallback])

  if (loading) {
    return <span className={`animate-pulse ${className}`}>Loading...</span>
  }

  return <span className={className}>{displayName}</span>
}

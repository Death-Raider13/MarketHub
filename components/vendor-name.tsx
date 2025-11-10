"use client"

import { useState, useEffect } from "react"
import { getVendorName } from "@/lib/vendor-utils"

interface VendorNameProps {
  vendorId: string
  vendorName?: string
  fallback?: string
  className?: string
}

export function VendorName({ 
  vendorId, 
  vendorName, 
  fallback = "Vendor", 
  className = "" 
}: VendorNameProps) {
  const [displayName, setDisplayName] = useState<string>(vendorName || fallback)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchVendorName = async () => {
      // Only fetch if we don't have a vendor name or it's the default fallback
      if (vendorId && (!vendorName || vendorName === 'Vendor' || vendorName === fallback)) {
        setLoading(true)
        try {
          const name = await getVendorName(vendorId)
          setDisplayName(name)
        } catch (error) {
          console.error('Error fetching vendor name:', error)
          setDisplayName(fallback)
        } finally {
          setLoading(false)
        }
      }
    }

    fetchVendorName()
  }, [vendorId, vendorName, fallback])

  if (loading) {
    return <span className={`animate-pulse ${className}`}>Loading...</span>
  }

  return <span className={className}>{displayName}</span>
}

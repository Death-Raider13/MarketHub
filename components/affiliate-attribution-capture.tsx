"use client"

import { useEffect } from "react"

export function AffiliateAttributionCapture() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('ref')
    if (!code) return

    const productId = params.get('aff_product')
    window.localStorage.setItem('markethub_affiliate_attribution', JSON.stringify({
      code,
      productId: productId || null,
      expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000),
    }))
  }, [])

  return null
}

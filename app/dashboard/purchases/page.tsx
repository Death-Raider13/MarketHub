"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function PurchasesPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/my-purchases')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center p-6">
        <h2 className="text-xl font-semibold mb-2">Redirecting to your Digital Library...</h2>
        <p className="text-muted-foreground">Please wait while we take you to your digital purchases.</p>
      </div>
    </div>
  )
}

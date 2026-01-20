"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function OrdersPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the enhanced my-orders page
    router.replace('/my-orders')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Redirecting...</h2>
        <p className="text-gray-600">Taking you to your orders page</p>
      </div>
    </div>
  )
}

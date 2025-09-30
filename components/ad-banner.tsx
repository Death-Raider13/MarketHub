import Image from "next/image"
import Link from "next/link"
import type { Advertisement } from "@/lib/types"

interface AdBannerProps {
  ad: Advertisement
  className?: string
}

export function AdBanner({ ad, className = "" }: AdBannerProps) {
  return (
    <Link href={ad.linkUrl} className={`block overflow-hidden rounded-lg ${className}`}>
      <div className="relative aspect-[4/1] w-full bg-muted">
        <Image
          src={ad.imageUrl || "/placeholder.svg"}
          alt={ad.title}
          fill
          className="object-cover transition-transform hover:scale-105"
        />
        <div className="absolute left-2 top-2 rounded bg-black/50 px-2 py-1 text-xs text-white">Sponsored</div>
      </div>
    </Link>
  )
}

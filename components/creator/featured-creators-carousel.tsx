"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Crown, Store } from "lucide-react"
import { Button } from "@/components/ui/button"

export interface FeaturedCreator {
  id: string
  name: string
  storeName?: string
  description?: string
  logoUrl?: string
  storeUrl?: string
}

export function FeaturedCreatorsCarousel({ creators }: { creators: FeaturedCreator[] }) {
  const [active, setActive] = useState(0)
  useEffect(() => {
    if (creators.length < 2) return
    const timer = window.setInterval(() => setActive((index) => (index + 1) % creators.length), 5000)
    return () => window.clearInterval(timer)
  }, [creators.length])

  if (!creators.length) return null
  const creator = creators[active]
  return <section className="border-y border-border/60 bg-muted/30 px-6 py-16">
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 text-center"><div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300"><Crown className="h-4 w-4" /> Featured Creators</div><h2 className="text-3xl font-extrabold">Meet the educators building the library</h2><p className="mt-2 text-sm text-muted-foreground">Every eligible featured creator takes a turn in this rotating showcase.</p></div>
      <div className="relative rounded-3xl border border-primary/20 bg-background p-8 shadow-xl md:p-12">
        <div className="flex flex-col items-center gap-8 text-center md:flex-row md:text-left">
          <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-primary/20 bg-primary/10 text-primary">{creator.logoUrl ? <img src={creator.logoUrl} alt="" className="h-full w-full object-cover" /> : <Store className="h-12 w-12" />}</div>
          <div className="min-w-0 flex-1"><p className="mb-2 text-xs font-bold uppercase tracking-widest text-primary">Verified & Featured Creator</p><h3 className="text-2xl font-bold">{creator.storeName || creator.name}</h3><p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{creator.description || "Discover educational books, study guides, and videos from this featured creator."}</p><Button asChild className="mt-5"><Link href={`/hub/${creator.id}`}>Visit creator hub</Link></Button></div>
        </div>
        {creators.length > 1 && <div className="mt-8 flex items-center justify-center gap-3"><Button aria-label="Previous featured creator" variant="outline" size="icon" onClick={() => setActive((active - 1 + creators.length) % creators.length)}><ChevronLeft className="h-4 w-4" /></Button><div className="flex gap-1.5">{creators.map((item, index) => <button key={item.id} aria-label={`Show ${item.storeName || item.name}`} onClick={() => setActive(index)} className={`h-2 rounded-full transition-all ${index === active ? "w-8 bg-primary" : "w-2 bg-muted-foreground/30"}`} />)}</div><Button aria-label="Next featured creator" variant="outline" size="icon" onClick={() => setActive((active + 1) % creators.length)}><ChevronRight className="h-4 w-4" /></Button></div>}
      </div>
    </div>
  </section>
}

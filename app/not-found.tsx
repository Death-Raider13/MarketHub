import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ShoppingBag, ArrowLeft, Home } from "lucide-react"

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-blue-600 to-slate-900 px-4">
      <div className="max-w-2xl w-full bg-background/95 text-foreground rounded-3xl shadow-2xl border border-white/10 p-8 md:p-10 backdrop-blur">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="inline-flex items-center gap-3 rounded-full border border-purple-200/60 bg-purple-50/60 px-4 py-1 text-xs font-medium text-purple-700 uppercase tracking-wide">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <span>Oops, page not found</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-purple-600 via-blue-600 to-pink-500 bg-clip-text text-transparent">
            404
          </h1>

          <p className="text-lg md:text-xl font-semibold">
            This MarketHub aisle is empty.
          </p>
          <p className="text-sm md:text-base text-muted-foreground max-w-md">
            The page you are looking for might have been moved, deleted, or never existed. Let&apos;s get you back to shopping.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link href="/">
              <Button size="lg" className="gap-2">
                <Home className="h-4 w-4" />
                Go to Homepage
              </Button>
            </Link>
            <Link href="/products">
              <Button size="lg" variant="outline" className="gap-2">
                <ShoppingBag className="h-4 w-4" />
                Browse Products
              </Button>
            </Link>
          </div>

          <button
            type="button"
            onClick={() => typeof window !== "undefined" && window.history.back()}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors pt-2"
          >
            <ArrowLeft className="h-3 w-3" />
            Go back to previous page
          </button>
        </div>
      </div>
    </main>
  )
}

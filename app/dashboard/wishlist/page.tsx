"use client"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { ProductCard } from "@/components/product-card"
import { ProtectedRoute } from "@/lib/firebase/protected-route"
import { useCart } from "@/lib/cart-context"
import { Heart, Package, MapPin, CreditCard, Settings, Star } from "lucide-react"
import Link from "next/link"
import type { Product } from "@/lib/types"

// Mock wishlist products
const mockWishlist: Product[] = [
  {
    id: "1",
    vendorId: "v1",
    vendorName: "TechStore Pro",
    name: "Wireless Noise-Cancelling Headphones",
    description: "Premium audio experience",
    price: 199.99,
    comparePrice: 299.99,
    category: "electronics",
    images: ["/diverse-people-listening-headphones.png"],
    stock: 45,
    sku: "WH-1000",
    rating: 4.5,
    reviewCount: 128,
    featured: true,
    sponsored: false,
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

function WishlistContent() {
  const { addToCart } = useCart()

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <h1 className="mb-8 text-3xl font-bold">My Wishlist</h1>

          <div className="grid gap-6 lg:grid-cols-4">
            {/* Sidebar */}
            <aside className="space-y-2">
              <Link href="/dashboard">
                <Button variant="ghost" className="w-full justify-start">
                  <Package className="mr-2 h-4 w-4" />
                  My Orders
                </Button>
              </Link>
              <Link href="/dashboard/wishlist">
                <Button variant="default" className="w-full justify-start">
                  <Heart className="mr-2 h-4 w-4" />
                  Wishlist
                </Button>
              </Link>
              <Link href="/dashboard/addresses">
                <Button variant="ghost" className="w-full justify-start">
                  <MapPin className="mr-2 h-4 w-4" />
                  Addresses
                </Button>
              </Link>
              <Link href="/dashboard/payment-methods">
                <Button variant="ghost" className="w-full justify-start">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Payment Methods
                </Button>
              </Link>
              <Link href="/dashboard/reviews">
                <Button variant="ghost" className="w-full justify-start">
                  <Star className="mr-2 h-4 w-4" />
                  My Reviews
                </Button>
              </Link>
              <Link href="/dashboard/settings">
                <Button variant="ghost" className="w-full justify-start">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Button>
              </Link>
            </aside>

            {/* Wishlist Products */}
            <div className="lg:col-span-3">
              {mockWishlist.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {mockWishlist.map((product) => (
                    <ProductCard key={product.id} product={product} onAddToCart={addToCart} />
                  ))}
                </div>
              ) : (
                <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-border bg-background">
                  <div className="text-center">
                    <Heart className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-4 text-lg font-medium">Your wishlist is empty</p>
                    <p className="text-sm text-muted-foreground">Save items you love for later</p>
                    <Button asChild className="mt-4">
                      <Link href="/products">Browse Products</Link>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default function WishlistPage() {
  return (
    <ProtectedRoute allowedRoles={["customer"]}>
      <WishlistContent />
    </ProtectedRoute>
  )
}

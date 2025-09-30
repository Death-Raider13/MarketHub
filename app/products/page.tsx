"use client"

import { useState } from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { ProductCard } from "@/components/product-card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useCart } from "@/lib/cart-context"
import { Grid3x3, List, SlidersHorizontal } from "lucide-react"
import type { Product } from "@/lib/types"

// Mock products
const mockProducts: Product[] = Array.from({ length: 12 }, (_, i) => ({
  id: `prod-${i + 1}`,
  vendorId: `vendor-${(i % 3) + 1}`,
  vendorName: ["TechStore Pro", "Fashion Hub", "Home Essentials"][i % 3],
  name: `Product ${i + 1}`,
  description: "High-quality product with excellent features",
  price: 29.99 + i * 10,
  comparePrice: i % 3 === 0 ? 49.99 + i * 10 : undefined,
  category: ["electronics", "fashion", "home"][i % 3],
  images: [`/placeholder.svg?height=400&width=400&query=product+${i + 1}`],
  stock: 50 + i * 5,
  sku: `SKU-${1000 + i}`,
  rating: 4 + (i % 5) * 0.2,
  reviewCount: 20 + i * 10,
  featured: i % 4 === 0,
  sponsored: i % 5 === 0,
  status: "active",
  createdAt: new Date(),
  updatedAt: new Date(),
}))

export default function ProductsPage() {
  const { addToCart } = useCart()
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [priceRange, setPriceRange] = useState([0, 500])

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">All Products</h1>
            <p className="text-muted-foreground">Discover amazing products from our vendors</p>
          </div>

          <div className="flex gap-8">
            {/* Filters Sidebar */}
            <aside className="hidden w-64 shrink-0 lg:block">
              <div className="sticky top-24 space-y-6">
                <div>
                  <h3 className="mb-4 font-semibold flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4" />
                    Filters
                  </h3>

                  {/* Price Range */}
                  <div className="space-y-4 rounded-lg border border-border p-4">
                    <Label>Price Range</Label>
                    <Slider value={priceRange} onValueChange={setPriceRange} max={500} step={10} className="mt-2" />
                    <div className="flex items-center justify-between text-sm">
                      <span>${priceRange[0]}</span>
                      <span>${priceRange[1]}</span>
                    </div>
                  </div>

                  {/* Categories */}
                  <div className="mt-6 space-y-4 rounded-lg border border-border p-4">
                    <Label>Categories</Label>
                    <div className="space-y-2">
                      {["Electronics", "Fashion", "Home & Garden", "Sports", "Books"].map((cat) => (
                        <div key={cat} className="flex items-center space-x-2">
                          <Checkbox id={cat} />
                          <label htmlFor={cat} className="text-sm cursor-pointer">
                            {cat}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="mt-6 space-y-4 rounded-lg border border-border p-4">
                    <Label>Minimum Rating</Label>
                    <div className="space-y-2">
                      {[4, 3, 2, 1].map((rating) => (
                        <div key={rating} className="flex items-center space-x-2">
                          <Checkbox id={`rating-${rating}`} />
                          <label htmlFor={`rating-${rating}`} className="text-sm cursor-pointer">
                            {rating}+ Stars
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </aside>

            {/* Products Grid */}
            <div className="flex-1">
              {/* Toolbar */}
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">{mockProducts.length} products found</p>

                <div className="flex items-center gap-4">
                  <Select defaultValue="featured">
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="featured">Featured</SelectItem>
                      <SelectItem value="price-low">Price: Low to High</SelectItem>
                      <SelectItem value="price-high">Price: High to Low</SelectItem>
                      <SelectItem value="rating">Highest Rated</SelectItem>
                      <SelectItem value="newest">Newest</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex gap-1">
                    <Button
                      variant={viewMode === "grid" ? "default" : "ghost"}
                      size="icon"
                      onClick={() => setViewMode("grid")}
                    >
                      <Grid3x3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "ghost"}
                      size="icon"
                      onClick={() => setViewMode("list")}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Products */}
              <div className={viewMode === "grid" ? "grid gap-6 sm:grid-cols-2 lg:grid-cols-3" : "flex flex-col gap-4"}>
                {mockProducts.map((product) => (
                  <ProductCard key={product.id} product={product} onAddToCart={addToCart} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { ProductCard } from "@/components/product-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { useCart } from "@/lib/cart-context"
import { Search, SlidersHorizontal, X } from "lucide-react"
import type { Product } from "@/lib/types"

// Mock search results
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

export default function SearchPage() {
  const searchParams = useSearchParams()
  const query = searchParams.get("q") || ""
  const { addToCart } = useCart()
  
  const [searchQuery, setSearchQuery] = useState(query)
  const [priceRange, setPriceRange] = useState([0, 500])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedRatings, setSelectedRatings] = useState<number[]>([])
  const [sortBy, setSortBy] = useState("relevance")
  const [filteredProducts, setFilteredProducts] = useState(mockProducts)

  useEffect(() => {
    setSearchQuery(query)
  }, [query])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // In production: fetch from Firebase/API
    console.log("Searching for:", searchQuery)
  }

  const clearFilters = () => {
    setPriceRange([0, 500])
    setSelectedCategories([])
    setSelectedRatings([])
  }

  const activeFiltersCount = selectedCategories.length + selectedRatings.length + 
    (priceRange[0] !== 0 || priceRange[1] !== 500 ? 1 : 0)

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          {/* Search Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">
              {query ? `Search Results for "${query}"` : "Search Products"}
            </h1>
            <p className="text-muted-foreground">
              {filteredProducts.length} products found
            </p>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search for products, brands, or categories..."
                className="pl-10 pr-4 h-12 text-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </form>

          <div className="flex gap-8">
            {/* Filters Sidebar */}
            <aside className="hidden w-64 shrink-0 lg:block">
              <div className="sticky top-24 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4" />
                    Filters
                    {activeFiltersCount > 0 && (
                      <Badge variant="secondary">{activeFiltersCount}</Badge>
                    )}
                  </h3>
                  {activeFiltersCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      Clear All
                    </Button>
                  )}
                </div>

                {/* Price Range */}
                <div className="space-y-4 rounded-lg border border-border p-4 bg-card">
                  <Label>Price Range</Label>
                  <Slider 
                    value={priceRange} 
                    onValueChange={setPriceRange} 
                    max={500} 
                    step={10} 
                    className="mt-2" 
                  />
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">${priceRange[0]}</span>
                    <span className="font-medium">${priceRange[1]}</span>
                  </div>
                </div>

                {/* Categories */}
                <div className="space-y-4 rounded-lg border border-border p-4 bg-card">
                  <Label>Categories</Label>
                  <div className="space-y-2">
                    {["Electronics", "Fashion", "Home & Garden", "Sports", "Books", "Gaming"].map((cat) => (
                      <div key={cat} className="flex items-center space-x-2">
                        <Checkbox 
                          id={cat}
                          checked={selectedCategories.includes(cat)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedCategories([...selectedCategories, cat])
                            } else {
                              setSelectedCategories(selectedCategories.filter(c => c !== cat))
                            }
                          }}
                        />
                        <label htmlFor={cat} className="text-sm cursor-pointer flex-1">
                          {cat}
                        </label>
                        <span className="text-xs text-muted-foreground">(123)</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rating */}
                <div className="space-y-4 rounded-lg border border-border p-4 bg-card">
                  <Label>Minimum Rating</Label>
                  <div className="space-y-2">
                    {[4, 3, 2, 1].map((rating) => (
                      <div key={rating} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`rating-${rating}`}
                          checked={selectedRatings.includes(rating)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedRatings([...selectedRatings, rating])
                            } else {
                              setSelectedRatings(selectedRatings.filter(r => r !== rating))
                            }
                          }}
                        />
                        <label htmlFor={`rating-${rating}`} className="text-sm cursor-pointer">
                          {rating}+ Stars
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Availability */}
                <div className="space-y-4 rounded-lg border border-border p-4 bg-card">
                  <Label>Availability</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="in-stock" />
                      <label htmlFor="in-stock" className="text-sm cursor-pointer">
                        In Stock
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="on-sale" />
                      <label htmlFor="on-sale" className="text-sm cursor-pointer">
                        On Sale
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="free-shipping" />
                      <label htmlFor="free-shipping" className="text-sm cursor-pointer">
                        Free Shipping
                      </label>
                    </div>
                  </div>
                </div>

                {/* Vendor */}
                <div className="space-y-4 rounded-lg border border-border p-4 bg-card">
                  <Label>Vendor</Label>
                  <div className="space-y-2">
                    {["TechStore Pro", "Fashion Hub", "Home Essentials"].map((vendor) => (
                      <div key={vendor} className="flex items-center space-x-2">
                        <Checkbox id={vendor} />
                        <label htmlFor={vendor} className="text-sm cursor-pointer">
                          {vendor}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </aside>

            {/* Products Grid */}
            <div className="flex-1">
              {/* Active Filters */}
              {activeFiltersCount > 0 && (
                <div className="mb-6 flex flex-wrap gap-2">
                  {selectedCategories.map((cat) => (
                    <Badge key={cat} variant="secondary" className="gap-1">
                      {cat}
                      <button
                        onClick={() => setSelectedCategories(selectedCategories.filter(c => c !== cat))}
                        className="ml-1 hover:text-destructive"
                        aria-label={`Remove ${cat} filter`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  {selectedRatings.map((rating) => (
                    <Badge key={rating} variant="secondary" className="gap-1">
                      {rating}+ Stars
                      <button
                        onClick={() => setSelectedRatings(selectedRatings.filter(r => r !== rating))}
                        className="ml-1 hover:text-destructive"
                        aria-label={`Remove ${rating} stars filter`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  {(priceRange[0] !== 0 || priceRange[1] !== 500) && (
                    <Badge variant="secondary" className="gap-1">
                      ${priceRange[0]} - ${priceRange[1]}
                      <button
                        onClick={() => setPriceRange([0, 500])}
                        className="ml-1 hover:text-destructive"
                        aria-label="Remove price filter"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                </div>
              )}

              {/* Toolbar */}
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredProducts.length} results
                </p>

                <div className="flex items-center gap-4">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relevance">Most Relevant</SelectItem>
                      <SelectItem value="price-low">Price: Low to High</SelectItem>
                      <SelectItem value="price-high">Price: High to Low</SelectItem>
                      <SelectItem value="rating">Highest Rated</SelectItem>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="popular">Most Popular</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Mobile Filter Button */}
                  <Button variant="outline" className="lg:hidden">
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Filters
                    {activeFiltersCount > 0 && (
                      <Badge variant="secondary" className="ml-2">{activeFiltersCount}</Badge>
                    )}
                  </Button>
                </div>
              </div>

              {/* Products */}
              {filteredProducts.length > 0 ? (
                <>
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredProducts.map((product) => (
                      <ProductCard key={product.id} product={product} onAddToCart={addToCart} />
                    ))}
                  </div>

                  {/* Pagination */}
                  <div className="mt-12 flex justify-center gap-2">
                    <Button variant="outline" disabled>Previous</Button>
                    <Button variant="default">1</Button>
                    <Button variant="outline">2</Button>
                    <Button variant="outline">3</Button>
                    <Button variant="outline">Next</Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-16">
                  <Search className="h-16 w-16 mx-auto text-muted-foreground" />
                  <h3 className="mt-4 text-xl font-semibold">No products found</h3>
                  <p className="mt-2 text-muted-foreground">
                    Try adjusting your filters or search terms
                  </p>
                  <Button onClick={clearFilters} className="mt-6">
                    Clear All Filters
                  </Button>
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

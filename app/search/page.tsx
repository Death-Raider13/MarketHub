"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
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
import { Search, SlidersHorizontal, X, Loader2 } from "lucide-react"
import type { Product } from "@/lib/types"
import { collection, getDocs, query as firestoreQuery, where, limit as firestoreLimit } from "firebase/firestore"
import { db } from "@/lib/firebase/config"

function SearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const query = searchParams.get("q") || ""
  const { addToCart } = useCart()
  
  const [searchQuery, setSearchQuery] = useState(query)
  const [priceRange, setPriceRange] = useState([0, 1000000]) // Max 1M Naira
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [minRating, setMinRating] = useState<number>(0)
  const [sortBy, setSortBy] = useState("relevance")
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch products from Firestore
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        const productsRef = collection(db, 'products')
        const q = firestoreQuery(
          productsRef,
          where('status', 'in', ['active', 'approved']),
          firestoreLimit(100)
        )
        
        const snapshot = await getDocs(q)
        const fetchedProducts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Product[]
        
        setProducts(fetchedProducts)
      } catch (error) {
        console.error("Error fetching products:", error)
        setProducts([])
      } finally {
        setLoading(false)
      }
    }
    
    fetchProducts()
  }, [])

  // Filter and search products
  useEffect(() => {
    let filtered = [...products]
    
    // Search by query
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase()
      filtered = filtered.filter(p => 
        p.name?.toLowerCase().includes(searchLower) ||
        p.description?.toLowerCase().includes(searchLower) ||
        p.category?.toLowerCase().includes(searchLower) ||
        p.vendorName?.toLowerCase().includes(searchLower)
      )
    }
    
    // Filter by price range
    filtered = filtered.filter(p => 
      p.price >= priceRange[0] && p.price <= priceRange[1]
    )
    
    // Filter by categories
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(p => 
        selectedCategories.includes(p.category)
      )
    }
    
    // Filter by rating
    if (minRating > 0) {
      filtered = filtered.filter(p => 
        (p.rating || 0) >= minRating
      )
    }
    
    // Sort products
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price)
        break
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price)
        break
      case 'rating':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0))
        break
      case 'newest':
        filtered.sort((a, b) => {
          const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt)
          const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt)
          return dateB.getTime() - dateA.getTime()
        })
        break
      case 'popular':
        filtered.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0))
        break
      case 'relevance':
      default:
        // Keep current order (search relevance)
        break
    }
    
    setFilteredProducts(filtered)
  }, [products, searchQuery, priceRange, selectedCategories, minRating, sortBy])

  useEffect(() => {
    setSearchQuery(query)
  }, [query])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  const clearFilters = () => {
    setPriceRange([0, 1000000])
    setSelectedCategories([])
    setMinRating(0)
  }

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  const handleRatingToggle = (rating: number) => {
    setMinRating(prev => prev === rating ? 0 : rating)
  }

  const activeFiltersCount = selectedCategories.length + 
    (minRating > 0 ? 1 : 0) +
    (priceRange[0] !== 0 || priceRange[1] !== 1000000 ? 1 : 0)

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
              {loading ? "Searching..." : `${filteredProducts.length} products found`}
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
              {loading && (
                <Loader2 className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-muted-foreground" />
              )}
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
                    max={1000000} 
                    step={10000} 
                    className="mt-2" 
                  />
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">₦{priceRange[0].toLocaleString()}</span>
                    <span className="font-medium">₦{priceRange[1].toLocaleString()}</span>
                  </div>
                </div>

                {/* Categories */}
                <div className="space-y-4 rounded-lg border border-border p-4 bg-card">
                  <Label>Categories</Label>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {["electronics", "computers", "phones", "gaming", "fashion-men", "fashion-women", "shoes", "bags", "beauty", "home", "furniture", "appliances", "sports", "books", "food", "health", "toys", "baby", "digital-courses", "digital-ebooks", "digital-software"].map((cat) => (
                      <div key={cat} className="flex items-center space-x-2">
                        <Checkbox 
                          id={cat}
                          checked={selectedCategories.includes(cat)}
                          onCheckedChange={() => handleCategoryToggle(cat)}
                        />
                        <label htmlFor={cat} className="text-sm cursor-pointer flex-1 capitalize">
                          {cat.replace(/-/g, ' ')}
                        </label>
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
                          checked={minRating === rating}
                          onCheckedChange={() => handleRatingToggle(rating)}
                        />
                        <label htmlFor={`rating-${rating}`} className="text-sm cursor-pointer">
                          {rating}+ Stars
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
                    <Badge key={cat} variant="secondary" className="gap-1 capitalize">
                      {cat.replace(/-/g, ' ')}
                      <button
                        onClick={() => handleCategoryToggle(cat)}
                        className="ml-1 hover:text-destructive"
                        aria-label={`Remove ${cat} filter`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  {minRating > 0 && (
                    <Badge variant="secondary" className="gap-1">
                      {minRating}+ Stars
                      <button
                        onClick={() => setMinRating(0)}
                        className="ml-1 hover:text-destructive"
                        aria-label={`Remove ${minRating} stars filter`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {(priceRange[0] !== 0 || priceRange[1] !== 1000000) && (
                    <Badge variant="secondary" className="gap-1">
                      ₦{priceRange[0].toLocaleString()} - ₦{priceRange[1].toLocaleString()}
                      <button
                        onClick={() => setPriceRange([0, 1000000])}
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

              {/* Loading State */}
              {loading && (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Searching products...</p>
                  </div>
                </div>
              )}

              {/* Products */}
              {!loading && filteredProducts.length > 0 && (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} onAddToCart={addToCart} />
                  ))}
                </div>
              )}

              {/* Empty State */}
              {!loading && filteredProducts.length === 0 && (
                <div className="text-center py-16">
                  <Search className="h-16 w-16 mx-auto text-muted-foreground" />
                  <h3 className="mt-4 text-xl font-semibold">No products found</h3>
                  <p className="mt-2 text-muted-foreground">
                    {query ? `No results for "${query}". Try different keywords or adjust your filters.` : 'Try adjusting your filters or search terms'}
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

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 bg-muted/30">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center py-16">
              <p className="text-muted-foreground">Loading search results...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}

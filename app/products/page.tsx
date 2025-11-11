"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { ProductCard } from "@/components/product-card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useCart } from "@/lib/cart-context"
import { Grid3x3, List, SlidersHorizontal, Loader2, Package } from "lucide-react"
import type { Product } from "@/lib/types"
import { collection, getDocs, query, where, orderBy, limit as firestoreLimit, doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import { CategoryPageAds } from "@/components/advertising/CategoryPageAds"
import { SponsoredProducts } from "@/components/advertising/SponsoredProducts"

export default function ProductsPage() {
  const { addToCart } = useCart()
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [priceRange, setPriceRange] = useState([0, 1000000]) // Max 1M Naira
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [minRating, setMinRating] = useState<number>(0)
  const [sortBy, setSortBy] = useState<string>("newest")
  const [selectedVendors, setSelectedVendors] = useState<string[]>([])
  const [vendors, setVendors] = useState<{id: string, name: string}[]>([])
  
  // Fetch products from Firestore
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        const productsRef = collection(db, 'products')
        const q = query(
          productsRef,
          where('status', 'in', ['active', 'approved']),
          firestoreLimit(100) // Fetch up to 100 products
        )
        
        const snapshot = await getDocs(q)
        const fetchedProducts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Product[]
        
        setProducts(fetchedProducts)
        setFilteredProducts(fetchedProducts)
        
        // Extract unique vendors from products
        const uniqueVendorIds = Array.from(new Set(fetchedProducts.map(p => p.vendorId).filter(Boolean)))
        
        // Get vendor names from products (don't fetch from users to avoid permission issues)
        const vendorsList = uniqueVendorIds.map(vendorId => {
          const product = fetchedProducts.find(p => p.vendorId === vendorId)
          return {
            id: vendorId,
            name: product?.vendorName || 'Vendor Store'
          }
        })
        
        setVendors(vendorsList)
      } catch (error) {
        console.error("Error fetching products:", error)
        setProducts([])
        setFilteredProducts([])
      } finally {
        setLoading(false)
      }
    }
    
    fetchProducts()
  }, [])
  
  // Apply filters whenever filter criteria change
  useEffect(() => {
    let filtered = [...products]
    
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
    
    // Filter by rating (if rating data exists)
    if (minRating > 0) {
      filtered = filtered.filter(p => 
        (p.rating || 0) >= minRating
      )
    }
    
    // Filter by vendors
    if (selectedVendors.length > 0) {
      filtered = filtered.filter(p => 
        selectedVendors.includes(p.vendorId)
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
      case 'featured':
        filtered.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))
        break
    }
    
    setFilteredProducts(filtered)
  }, [products, priceRange, selectedCategories, minRating, sortBy])
  
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
  
  const handleVendorToggle = (vendorId: string) => {
    setSelectedVendors(prev => 
      prev.includes(vendorId)
        ? prev.filter(v => v !== vendorId)
        : [...prev, vendorId]
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">All Products</h1>
            <p className="text-muted-foreground">Discover amazing products from our vendors</p>
          </div>

          {/* Category Banner Ads */}
          <CategoryPageAds 
            category="general"
            placement="top"
            maxAds={2}
            className="mb-8"
          />

          <div className="flex gap-8">
            {/* Filters Sidebar */}
            <aside className="w-80 flex-shrink-0">
              <div className="sticky top-8 space-y-6">
                {/* Sidebar Ads */}
                <CategoryPageAds 
                  category="general"
                  placement="sidebar"
                  maxAds={2}
                  className="mb-6"
                />
                <div>
                  <h3 className="mb-4 font-semibold flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4" />
                    Filters
                  </h3>

                  {/* Price Range */}
                  <div className="space-y-4 rounded-lg border border-border p-4">
                    <Label>Price Range</Label>
                    <Slider 
                      value={priceRange} 
                      onValueChange={setPriceRange} 
                      max={1000000} 
                      step={10000} 
                      className="mt-2" 
                    />
                    <div className="flex items-center justify-between text-sm">
                      <span>₦{priceRange[0].toLocaleString()}</span>
                      <span>₦{priceRange[1].toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Categories */}
                  <div className="mt-6 space-y-4 rounded-lg border border-border p-4">
                    <Label>Categories</Label>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {["electronics", "computers", "phones", "gaming", "fashion-men", "fashion-women", "fashion-kids", "shoes", "bags", "beauty", "jewelry", "home", "furniture", "appliances", "kitchen", "sports", "books", "food", "health", "automotive", "toys", "baby", "digital-courses", "digital-ebooks", "digital-software", "service-consulting", "service-design", "other"].map((cat) => (
                        <div key={cat} className="flex items-center space-x-2">
                          <Checkbox 
                            id={cat} 
                            checked={selectedCategories.includes(cat)}
                            onCheckedChange={() => handleCategoryToggle(cat)}
                          />
                          <label htmlFor={cat} className="text-sm cursor-pointer capitalize">
                            {cat.replace(/-/g, ' ')}
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

                  {/* Vendors */}
                  <div className="mt-6 space-y-4 rounded-lg border border-border p-4">
                    <Label>Vendors</Label>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {vendors.length > 0 ? (
                        vendors.map((vendor) => (
                          <div key={vendor.id} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`vendor-${vendor.id}`}
                              checked={selectedVendors.includes(vendor.id)}
                              onCheckedChange={() => handleVendorToggle(vendor.id)}
                            />
                            <label htmlFor={`vendor-${vendor.id}`} className="text-sm cursor-pointer">
                              {vendor.name}
                            </label>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No vendors found</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </aside>

            {/* Products Grid */}
            <div className="flex-1">
              {/* Toolbar */}
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  {loading ? "Loading..." : `${filteredProducts.length} products found`}
                </p>

                <div className="flex items-center gap-4">
                  <Select value={sortBy} onValueChange={setSortBy}>
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

              {/* Loading State */}
              {loading && (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading products...</p>
                  </div>
                </div>
              )}

              {/* Empty State */}
              {!loading && filteredProducts.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <Package className="h-20 w-20 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No products found</h3>
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your filters or search criteria
                  </p>
                  <Button 
                    onClick={() => {
                      setPriceRange([0, 1000000])
                      setSelectedCategories([])
                      setMinRating(0)
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              )}

              {/* Products */}
              {!loading && filteredProducts.length > 0 && (
                <>
                  <div className={viewMode === "grid" ? "grid gap-6 sm:grid-cols-2 lg:grid-cols-3" : "flex flex-col gap-4"}>
                    {filteredProducts.map((product) => (
                      <ProductCard key={product.id} product={product} onAddToCart={addToCart} />
                    ))}
                  </div>
                  
                  {/* Sponsored Products */}
                  <div className="mt-12">
                    <SponsoredProducts 
                      category="general"
                      layout="grid"
                      maxAds={6}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

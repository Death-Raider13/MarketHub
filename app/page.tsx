"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { HomepageBanner } from "@/components/advertising/HomepageBanner"
import { ShoppingBag, TrendingUp, Shield, Zap, ArrowRight, Star, Store } from "lucide-react"

interface Product {
  id: string
  name: string
  price: number
  imageUrl: string
  category: string
  vendorName: string
  status: string
}

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [featuredVendors, setFeaturedVendors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [vendorsLoading, setVendorsLoading] = useState(true)

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        // Dynamically import Firebase only on client side
        const { collection, getDocs, query, where, limit, orderBy } = await import("firebase/firestore")
        const { db } = await import("@/lib/firebase/config")
        
        const productsRef = collection(db, "products")
        const q = query(
          productsRef,
          where("status", "==", "approved"),
          orderBy("createdAt", "desc"),
          limit(8)
        )
        const snapshot = await getDocs(q)
        const products = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Product[]
        setFeaturedProducts(products)
      } catch (error) {
        console.error("Error fetching products:", error)
        // Set empty array on error to prevent crash
        setFeaturedProducts([])
      } finally {
        setLoading(false)
      }
    }

    // Only fetch on client side
    if (typeof window !== 'undefined') {
      fetchFeaturedProducts()
    } else {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const fetchFeaturedVendors = async () => {
      try {
        const { collection, getDocs, query, where, limit } = await import("firebase/firestore")
        const { db } = await import("@/lib/firebase/config")
        
        const vendorsQuery = query(
          collection(db, 'users'),
          where('role', '==', 'vendor'),
          where('verified', '==', true),
          limit(6)
        )
        const snapshot = await getDocs(vendorsQuery)
        const vendors = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }))
        setFeaturedVendors(vendors)
      } catch (error) {
        console.error("Error fetching vendors:", error)
        setFeaturedVendors([])
      } finally {
        setVendorsLoading(false)
      }
    }

    if (typeof window !== 'undefined') {
      fetchFeaturedVendors()
    } else {
      setVendorsLoading(false)
    }
  }, [])

  const categories = [
    { name: "Electronics", icon: "💻", count: "500+" },
    { name: "Fashion", icon: "👕", count: "800+" },
    { name: "Home & Living", icon: "🏠", count: "350+" },
    { name: "Books", icon: "📚", count: "1000+" },
    { name: "Sports", icon: "⚽", count: "200+" },
    { name: "Beauty", icon: "💄", count: "450+" },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                🎉 Nigeria's Fastest Growing Marketplace
              </Badge>
              <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                Discover Amazing Products from Trusted Sellers
              </h1>
              <p className="text-xl text-white/90">
                Shop from thousands of verified vendors. Quality products, secure payments, and fast delivery across Nigeria.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/products">
                  <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100">
                    <ShoppingBag className="mr-2 h-5 w-5" />
                    Start Shopping
                  </Button>
                </Link>
                <Link href="/auth/vendor-register-new">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                    Become a Seller
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 pt-8">
                <div>
                  <div className="text-3xl font-bold">500K+</div>
                  <div className="text-white/80">Monthly Visitors</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">10K+</div>
                  <div className="text-white/80">Products</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">1K+</div>
                  <div className="text-white/80">Vendors</div>
                </div>
              </div>
            </div>
            
            <div className="hidden md:block">
              <div className="relative">
                <div className="absolute inset-0 bg-white/10 backdrop-blur-sm rounded-3xl transform rotate-6"></div>
                <div className="relative bg-white/20 backdrop-blur-md rounded-3xl p-8 space-y-4">
                  <div className="flex items-center gap-4 bg-white/90 rounded-xl p-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg"></div>
                    <div className="flex-1">
                      <div className="h-3 bg-gray-300 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 bg-white/90 rounded-xl p-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-orange-500 rounded-lg"></div>
                    <div className="flex-1">
                      <div className="h-3 bg-gray-300 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 bg-white/90 rounded-xl p-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-500 rounded-lg"></div>
                    <div className="flex-1">
                      <div className="h-3 bg-gray-300 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Advertisement Banner Section */}
      <section className="py-8 px-4">
        <div className="container mx-auto max-w-7xl">
          <HomepageBanner 
            maxAds={5}
            autoRotate={true}
            rotationInterval={10}
            className="rounded-xl shadow-lg"
          />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto max-w-7xl">
          <div className="grid md:grid-cols-4 gap-8">
            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>Secure Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">100% secure transactions with Paystack integration</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle>Fast Delivery</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Quick delivery across Nigeria within 2-5 days</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Star className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle>Quality Products</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Verified sellers and authentic products only</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle>Best Prices</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Competitive prices from multiple vendors</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Browse by Category</h2>
            <p className="text-gray-600 text-lg">Find exactly what you're looking for</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {categories.map((category) => (
              <Link key={category.name} href={`/products`}>
                <Card className="hover:shadow-lg transition-all hover:scale-105 cursor-pointer border-2 hover:border-purple-500">
                  <CardContent className="p-6 text-center">
                    <div className="text-5xl mb-3">{category.icon}</div>
                    <h3 className="font-semibold mb-1">{category.name}</h3>
                    <p className="text-sm text-gray-500">{category.count} items</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto max-w-7xl">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-4xl font-bold mb-2">Featured Products</h2>
              <p className="text-gray-600">Discover our handpicked selection</p>
            </div>
            <Link href="/products">
              <Button variant="outline">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-48 bg-gray-200"></div>
                  <CardContent className="p-4 space-y-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <Link key={product.id} href={`/products/${product.id}`}>
                  <Card className="hover:shadow-xl transition-all hover:scale-105 cursor-pointer h-full">
                    <div className="relative h-48 bg-gray-100 overflow-hidden rounded-t-lg">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <ShoppingBag className="h-16 w-16" />
                        </div>
                      )}
                      <Badge className="absolute top-2 right-2 bg-green-500">New</Badge>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-2 line-clamp-2">{product.name}</h3>
                      <p className="text-sm text-gray-500 mb-2">{product.vendorName}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-purple-600">
                          ₦{product.price.toLocaleString()}
                        </span>
                        <div className="flex items-center text-yellow-500">
                          <Star className="h-4 w-4 fill-current" />
                          <span className="ml-1 text-sm text-gray-600">4.5</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured Vendors Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-4xl font-bold mb-2">Featured Vendors</h2>
              <p className="text-gray-600">Shop from our top-rated sellers</p>
            </div>
            <Link href="/vendors">
              <Button variant="outline">
                View All Vendors
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {vendorsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6 space-y-4">
                    <div className="h-16 w-16 bg-gray-200 rounded-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredVendors.map((vendor) => (
                <Card key={vendor.id} className="hover:shadow-xl transition-all hover:scale-105 cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold text-2xl">
                          {vendor.storeName?.charAt(0) || vendor.displayName?.charAt(0) || 'V'}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{vendor.storeName || vendor.displayName || 'Vendor Store'}</h3>
                          <Badge variant="secondary" className="text-xs mt-1">
                            ✓ Verified
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 mb-4">
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${i < 4 ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600 ml-1">(4.8)</span>
                    </div>

                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                      Quality products with excellent service and fast delivery.
                    </p>

                    <Link href={`/store/${vendor.id}`}>
                      <Button className="w-full" variant="outline">
                        <Store className="mr-2 h-4 w-4" />
                        Visit Store
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Start Selling?
          </h2>
          <p className="text-xl mb-8 text-white/90">
            Join thousands of successful vendors on MarketHub. Set up your store in minutes and start earning today.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/auth/vendor-register-new">
              <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100">
                Become a Vendor
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/auth/vendor-register-new">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                Start Selling Today
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

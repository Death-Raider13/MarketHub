"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { ProductCard } from "@/components/product-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useCart } from "@/lib/cart-context"
import { 
  Store, 
  Star, 
  MapPin, 
  Clock, 
  Shield, 
  MessageCircle,
  Heart,
  Share2
} from "lucide-react"
import Image from "next/image"
import type { Product } from "@/lib/types"

// Mock vendor data
const mockVendor = {
  id: "v1",
  name: "TechStore Pro",
  description: "Your trusted source for premium electronics and tech accessories. We've been serving customers since 2015 with quality products and excellent service.",
  logo: "/placeholder.svg",
  banner: "/placeholder.svg",
  rating: 4.8,
  reviewCount: 3456,
  totalProducts: 234,
  totalSales: 12456,
  joinedDate: "2015-03-15",
  location: "San Francisco, CA",
  responseTime: "Within 2 hours",
  verified: true,
  followers: 8934,
}

const mockProducts: Product[] = Array.from({ length: 8 }, (_, i) => ({
  id: `prod-${i + 1}`,
  vendorId: "v1",
  vendorName: "TechStore Pro",
  name: `Product ${i + 1}`,
  description: "High-quality product with excellent features",
  price: 29.99 + i * 10,
  comparePrice: i % 3 === 0 ? 49.99 + i * 10 : undefined,
  category: "electronics",
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

const mockReviews = [
  {
    id: "1",
    userName: "John Doe",
    rating: 5,
    comment: "Excellent vendor! Fast shipping and great customer service. Products are exactly as described.",
    date: "2024-01-15",
  },
  {
    id: "2",
    userName: "Sarah Smith",
    rating: 5,
    comment: "Very reliable seller. I've ordered multiple times and always satisfied with the quality.",
    date: "2024-01-10",
  },
  {
    id: "3",
    userName: "Mike Johnson",
    rating: 4,
    comment: "Good products and reasonable prices. Shipping could be faster but overall happy with my purchases.",
    date: "2024-01-05",
  },
]

export default function VendorStorePage() {
  const params = useParams()
  const id = params.id as string
  const { addToCart } = useCart()
  const [vendor, setVendor] = useState(mockVendor)

  // In production: fetch from Firebase using id
  useEffect(() => {
    // const fetchVendor = async () => {
    //   const vendorData = await getVendor(id)
    //   setVendor(vendorData)
    // }
    // fetchVendor()
  }, [id])

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Vendor Banner */}
        <div className="relative h-64 bg-gradient-to-br from-primary/20 to-primary/5">
          <Image
            src={vendor.banner}
            alt={`${vendor.name} banner`}
            fill
            className="object-cover"
          />
        </div>

        <div className="container mx-auto px-4">
          {/* Vendor Info */}
          <div className="relative -mt-16 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col gap-6 md:flex-row md:items-start">
                  <Avatar className="h-32 w-32 border-4 border-background">
                    <AvatarImage src={vendor.logo} alt={vendor.name} />
                    <AvatarFallback className="text-3xl">
                      {vendor.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h1 className="text-3xl font-bold">{vendor.name}</h1>
                          {vendor.verified && (
                            <Badge className="gap-1">
                              <Shield className="h-3 w-3" />
                              Verified
                            </Badge>
                          )}
                        </div>
                        <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-medium">{vendor.rating}</span>
                            <span>({vendor.reviewCount.toLocaleString()} reviews)</span>
                          </div>
                          <span>•</span>
                          <span>{vendor.totalProducts} Products</span>
                          <span>•</span>
                          <span>{vendor.followers.toLocaleString()} Followers</span>
                        </div>
                        <p className="mt-3 text-muted-foreground max-w-2xl">
                          {vendor.description}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button>
                          <Heart className="h-4 w-4 mr-2" />
                          Follow
                        </Button>
                        <Button variant="outline">
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Contact
                        </Button>
                        <Button variant="outline" size="icon">
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-4 sm:grid-cols-3">
                      <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                        <MapPin className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">Location</p>
                          <p className="font-medium">{vendor.location}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                        <Clock className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">Response Time</p>
                          <p className="font-medium">{vendor.responseTime}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                        <Store className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">Member Since</p>
                          <p className="font-medium">
                            {new Date(vendor.joinedDate).getFullYear()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="products" className="w-full">
            <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
              <TabsTrigger 
                value="products" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              >
                Products ({vendor.totalProducts})
              </TabsTrigger>
              <TabsTrigger 
                value="about" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              >
                About
              </TabsTrigger>
              <TabsTrigger 
                value="reviews" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              >
                Reviews ({vendor.reviewCount})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="products" className="mt-8">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {mockProducts.map((product) => (
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
            </TabsContent>

            <TabsContent value="about" className="mt-8">
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold mb-4">About {vendor.name}</h2>
                  <div className="prose max-w-none">
                    <p className="text-muted-foreground">
                      {vendor.description}
                    </p>
                    <h3 className="mt-6 text-xl font-semibold">Our Story</h3>
                    <p className="text-muted-foreground">
                      Founded in 2015, TechStore Pro has grown from a small startup to one of the most trusted 
                      electronics retailers on the platform. We specialize in bringing you the latest technology 
                      products at competitive prices, backed by excellent customer service.
                    </p>
                    <h3 className="mt-6 text-xl font-semibold">Why Choose Us?</h3>
                    <ul className="space-y-2 text-muted-foreground">
                      <li>✓ Authentic products with manufacturer warranty</li>
                      <li>✓ Fast and secure shipping</li>
                      <li>✓ 30-day return policy</li>
                      <li>✓ Dedicated customer support</li>
                      <li>✓ Competitive pricing</li>
                    </ul>
                    <h3 className="mt-6 text-xl font-semibold">Contact Information</h3>
                    <p className="text-muted-foreground">
                      Have questions? Our customer service team is available Monday-Friday, 9AM-6PM PST.
                      Response time: {vendor.responseTime}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reviews" className="mt-8">
              <div className="space-y-6">
                {/* Rating Summary */}
                <Card>
                  <CardContent className="p-6">
                    <div className="grid gap-8 md:grid-cols-2">
                      <div className="text-center">
                        <div className="text-5xl font-bold">{vendor.rating}</div>
                        <div className="flex justify-center mt-2">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-6 w-6 ${
                                i < Math.floor(vendor.rating)
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "fill-muted text-muted"
                              }`}
                            />
                          ))}
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Based on {vendor.reviewCount.toLocaleString()} reviews
                        </p>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Product Quality</span>
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: "95%" }} />
                          </div>
                          <span className="text-sm text-muted-foreground">4.8</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Communication</span>
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: "92%" }} />
                          </div>
                          <span className="text-sm text-muted-foreground">4.6</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Shipping Speed</span>
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: "90%" }} />
                          </div>
                          <span className="text-sm text-muted-foreground">4.5</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Reviews List */}
                {mockReviews.map((review) => (
                  <Card key={review.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <Avatar>
                          <AvatarFallback>{review.userName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium">{review.userName}</p>
                            <span className="text-sm text-muted-foreground">{review.date}</span>
                          </div>
                          <div className="flex mt-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "fill-muted text-muted"
                                }`}
                              />
                            ))}
                          </div>
                          <p className="mt-3 text-muted-foreground">{review.comment}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <Button variant="outline" className="w-full">
                  Load More Reviews
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  )
}

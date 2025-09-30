"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { useCart } from "@/lib/cart-context"
import { 
  Star, 
  Heart, 
  Share2, 
  Truck, 
  Shield, 
  RotateCcw, 
  Store,
  ChevronRight,
  Minus,
  Plus,
  Check,
  MessageCircle
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import type { Product } from "@/lib/types"

// Mock product data - replace with Firebase fetch
const mockProduct: Product = {
  id: "1",
  vendorId: "v1",
  vendorName: "TechStore Pro",
  name: "Wireless Noise-Cancelling Headphones Premium Edition",
  description: "Experience superior sound quality with our premium wireless headphones featuring active noise cancellation, 30-hour battery life, and comfortable over-ear design. Perfect for travel, work, or leisure.",
  price: 199.99,
  comparePrice: 299.99,
  category: "electronics",
  images: [
    "/diverse-people-listening-headphones.png",
    "/diverse-people-listening-headphones.png",
    "/diverse-people-listening-headphones.png",
    "/diverse-people-listening-headphones.png",
  ],
  stock: 45,
  sku: "WH-1000XM5",
  rating: 4.5,
  reviewCount: 2847,
  featured: true,
  sponsored: false,
  status: "active",
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockReviews = [
  {
    id: "1",
    userName: "John Doe",
    rating: 5,
    comment: "Absolutely amazing headphones! The noise cancellation is top-notch and the sound quality is incredible. Worth every penny.",
    date: "2024-01-15",
    verified: true,
    helpful: 234,
  },
  {
    id: "2",
    userName: "Sarah Smith",
    rating: 4,
    comment: "Great headphones overall. Battery life is excellent and they're very comfortable for long listening sessions. Only minor issue is the case could be more compact.",
    date: "2024-01-10",
    verified: true,
    helpful: 156,
  },
  {
    id: "3",
    userName: "Mike Johnson",
    rating: 5,
    comment: "Best purchase I've made this year. The active noise cancellation blocks out everything. Perfect for flights and commuting.",
    date: "2024-01-05",
    verified: true,
    helpful: 89,
  },
]

const relatedProducts: Product[] = [
  {
    id: "2",
    vendorId: "v1",
    vendorName: "TechStore Pro",
    name: "Wireless Earbuds Pro",
    description: "Compact wireless earbuds with premium sound",
    price: 149.99,
    comparePrice: 199.99,
    category: "electronics",
    images: ["/placeholder.svg"],
    stock: 67,
    sku: "WE-PRO",
    rating: 4.3,
    reviewCount: 1234,
    featured: true,
    sponsored: false,
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

export default function ProductDetailPage() {
  const params = useParams()
  const id = params.id as string
  const { addToCart } = useCart()
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [product, setProduct] = useState(mockProduct)

  // In production: fetch from Firebase using id
  useEffect(() => {
    // Fetch product data here
    // const fetchProduct = async () => {
    //   const productData = await getProduct(id)
    //   setProduct(productData)
    // }
    // fetchProduct()
  }, [id])

  const discount = product.comparePrice 
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0

  const handleAddToCart = () => {
    addToCart(product, quantity)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Breadcrumb */}
        <div className="border-b border-border bg-muted/30">
          <div className="container mx-auto px-4 py-3">
            <nav className="flex items-center gap-2 text-sm text-muted-foreground" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-foreground">Home</Link>
              <ChevronRight className="h-4 w-4" />
              <Link href="/products" className="hover:text-foreground">Products</Link>
              <ChevronRight className="h-4 w-4" />
              <Link href={`/products?category=${product.category}`} className="hover:text-foreground capitalize">
                {product.category}
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground line-clamp-1">{product.name}</span>
            </nav>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Product Images */}
            <div className="space-y-4">
              <div className="relative aspect-square overflow-hidden rounded-lg border border-border bg-muted">
                <Image
                  src={product.images[selectedImage] || "/placeholder.svg"}
                  alt={product.name}
                  fill
                  className="object-cover"
                  priority
                />
                {discount > 0 && (
                  <Badge className="absolute left-4 top-4 bg-red-600 hover:bg-red-700">
                    -{discount}% OFF
                  </Badge>
                )}
              </div>
              <div className="grid grid-cols-4 gap-4">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`relative aspect-square overflow-hidden rounded-lg border-2 transition-colors ${
                      selectedImage === index ? "border-primary" : "border-border hover:border-primary/50"
                    }`}
                    aria-label={`View image ${index + 1}`}
                  >
                    <Image
                      src={image || "/placeholder.svg"}
                      alt={`${product.name} - Image ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div>
                <Link 
                  href={`/vendors/${product.vendorId}`}
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline mb-2"
                >
                  <Store className="h-4 w-4" />
                  {product.vendorName}
                </Link>
                <h1 className="text-3xl font-bold">{product.name}</h1>
                <div className="mt-2 flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-5 w-5 ${
                            i < Math.floor(product.rating)
                              ? "fill-yellow-400 text-yellow-400"
                              : "fill-muted text-muted"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="font-medium">{product.rating}</span>
                  </div>
                  <Separator orientation="vertical" className="h-5" />
                  <Link href="#reviews" className="text-sm text-primary hover:underline">
                    {product.reviewCount.toLocaleString()} reviews
                  </Link>
                </div>
              </div>

              <Separator />

              {/* Price */}
              <div>
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-bold">${product.price.toFixed(2)}</span>
                  {product.comparePrice && (
                    <>
                      <span className="text-xl text-muted-foreground line-through">
                        ${product.comparePrice.toFixed(2)}
                      </span>
                      <Badge variant="destructive">Save {discount}%</Badge>
                    </>
                  )}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Tax included. Shipping calculated at checkout.
                </p>
              </div>

              {/* Stock Status */}
              <div>
                {product.stock > 0 ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <Check className="h-5 w-5" />
                    <span className="font-medium">In Stock ({product.stock} available)</span>
                  </div>
                ) : (
                  <div className="text-red-600 font-medium">Out of Stock</div>
                )}
              </div>

              {/* Quantity Selector */}
              <div>
                <label className="mb-2 block text-sm font-medium">Quantity</label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-border rounded-lg">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-12 text-center font-medium">{quantity}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      disabled={quantity >= product.stock}
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button 
                  size="lg" 
                  className="flex-1" 
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                >
                  Add to Cart
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setIsWishlisted(!isWishlisted)}
                  aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                >
                  <Heart className={`h-5 w-5 ${isWishlisted ? "fill-red-500 text-red-500" : ""}`} />
                </Button>
                <Button size="lg" variant="outline" aria-label="Share product">
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>

              {/* Features */}
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <Truck className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Free Shipping</p>
                      <p className="text-sm text-muted-foreground">On orders over $50</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Secure Payment</p>
                      <p className="text-sm text-muted-foreground">100% secure transactions</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <RotateCcw className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">30-Day Returns</p>
                      <p className="text-sm text-muted-foreground">Easy returns & refunds</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Product Details Tabs */}
          <div className="mt-16">
            <Tabs defaultValue="description" className="w-full">
              <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
                <TabsTrigger value="description" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                  Description
                </TabsTrigger>
                <TabsTrigger value="specifications" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                  Specifications
                </TabsTrigger>
                <TabsTrigger value="reviews" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                  Reviews ({product.reviewCount})
                </TabsTrigger>
                <TabsTrigger value="qa" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                  Q&A
                </TabsTrigger>
              </TabsList>

              <TabsContent value="description" className="mt-6">
                <div className="prose max-w-none">
                  <p className="text-lg">{product.description}</p>
                  <h3 className="mt-6 text-xl font-semibold">Key Features</h3>
                  <ul className="space-y-2">
                    <li>Active Noise Cancellation (ANC) technology</li>
                    <li>30-hour battery life with ANC on</li>
                    <li>Quick charge: 10 min = 5 hours playback</li>
                    <li>Premium comfort with memory foam ear cushions</li>
                    <li>Multipoint connection - connect to 2 devices simultaneously</li>
                    <li>Hi-Res Audio certified</li>
                    <li>Built-in Alexa and Google Assistant</li>
                  </ul>
                </div>
              </TabsContent>

              <TabsContent value="specifications" className="mt-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="font-semibold mb-4">Technical Specifications</h3>
                      <dl className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">SKU:</dt>
                          <dd className="font-medium">{product.sku}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Weight:</dt>
                          <dd className="font-medium">250g</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Bluetooth:</dt>
                          <dd className="font-medium">5.2</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Driver Size:</dt>
                          <dd className="font-medium">40mm</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Frequency Response:</dt>
                          <dd className="font-medium">4Hz - 40kHz</dd>
                        </div>
                      </dl>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="font-semibold mb-4">Package Contents</h3>
                      <ul className="space-y-2 text-sm">
                        <li>• Wireless Headphones</li>
                        <li>• USB-C Charging Cable</li>
                        <li>• 3.5mm Audio Cable</li>
                        <li>• Carrying Case</li>
                        <li>• Quick Start Guide</li>
                        <li>• Warranty Card</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="reviews" id="reviews" className="mt-6">
                <div className="space-y-8">
                  {/* Rating Summary */}
                  <Card>
                    <CardContent className="p-6">
                      <div className="grid gap-8 md:grid-cols-2">
                        <div className="text-center">
                          <div className="text-5xl font-bold">{product.rating}</div>
                          <div className="flex justify-center mt-2">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-6 w-6 ${
                                  i < Math.floor(product.rating)
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "fill-muted text-muted"
                                }`}
                              />
                            ))}
                          </div>
                          <p className="mt-2 text-sm text-muted-foreground">
                            Based on {product.reviewCount.toLocaleString()} reviews
                          </p>
                        </div>
                        <div className="space-y-2">
                          {[5, 4, 3, 2, 1].map((stars) => (
                            <div key={stars} className="flex items-center gap-3">
                              <span className="text-sm w-8">{stars} ★</span>
                              <Progress value={stars === 5 ? 75 : stars === 4 ? 15 : 5} className="flex-1" />
                              <span className="text-sm text-muted-foreground w-12 text-right">
                                {stars === 5 ? "75%" : stars === 4 ? "15%" : "5%"}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Reviews List */}
                  <div className="space-y-6">
                    {mockReviews.map((review) => (
                      <Card key={review.id}>
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <Avatar>
                              <AvatarFallback>{review.userName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium">{review.userName}</p>
                                  {review.verified && (
                                    <Badge variant="secondary" className="mt-1">
                                      <Check className="h-3 w-3 mr-1" />
                                      Verified Purchase
                                    </Badge>
                                  )}
                                </div>
                                <span className="text-sm text-muted-foreground">{review.date}</span>
                              </div>
                              <div className="flex mt-2">
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
                              <div className="mt-4 flex items-center gap-4">
                                <Button variant="ghost" size="sm">
                                  Helpful ({review.helpful})
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <MessageCircle className="h-4 w-4 mr-2" />
                                  Reply
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <Button variant="outline" className="w-full">
                    Load More Reviews
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="qa" className="mt-6">
                <Card>
                  <CardContent className="p-6 text-center">
                    <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">No questions yet</h3>
                    <p className="mt-2 text-muted-foreground">Be the first to ask a question about this product</p>
                    <Button className="mt-4">Ask a Question</Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Related Products */}
          <div className="mt-16">
            <h2 className="text-2xl font-bold mb-6">Customers Also Viewed</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {relatedProducts.map((relatedProduct) => (
                <Card key={relatedProduct.id}>
                  <CardContent className="p-4">
                    <Link href={`/products/${relatedProduct.id}`}>
                      <div className="relative aspect-square mb-4 overflow-hidden rounded-lg bg-muted">
                        <Image
                          src={relatedProduct.images[0] || "/placeholder.svg"}
                          alt={relatedProduct.name}
                          fill
                          className="object-cover hover:scale-105 transition-transform"
                        />
                      </div>
                      <h3 className="font-medium line-clamp-2 mb-2">{relatedProduct.name}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold">${relatedProduct.price.toFixed(2)}</span>
                        {relatedProduct.comparePrice && (
                          <span className="text-sm text-muted-foreground line-through">
                            ${relatedProduct.comparePrice.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

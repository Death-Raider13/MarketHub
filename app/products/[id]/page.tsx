"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
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
import { useAuth } from "@/lib/firebase/auth-context"
import { db } from "@/lib/firebase/config"
import { doc, getDoc, collection, query, where, limit, getDocs } from "firebase/firestore"
import { ProductReviews } from "@/components/customer/product-reviews"
import { ContactVendor } from "@/components/customer/contact-vendor"
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
  MessageCircle,
  Loader2,
  AlertCircle
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { toast } from "sonner"
import type { Product } from "@/lib/types"

// Currency formatter for Nigerian Naira
const formatNGN = (amount: number) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { user } = useAuth()
  const { addToCart } = useCart()
  
  const [product, setProduct] = useState<Product | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [hasPurchased, setHasPurchased] = useState(false)

  // Fetch product data from Firestore
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Get product document
        const productDoc = await getDoc(doc(db, 'products', id))
        
        if (!productDoc.exists()) {
          setError('Product not found')
          return
        }
        
        const productData = {
          id: productDoc.id,
          ...productDoc.data(),
          createdAt: productDoc.data().createdAt?.toDate(),
          updatedAt: productDoc.data().updatedAt?.toDate()
        } as Product
        
        // Check if product is active
        if (productData.status !== 'active') {
          setError('This product is not available')
          return
        }
        
        setProduct(productData)
        
        // Fetch related products (same category, different vendor or same vendor)
        const relatedQuery = query(
          collection(db, 'products'),
          where('category', '==', productData.category),
          where('status', '==', 'active'),
          limit(5)
        )
        
        const relatedSnapshot = await getDocs(relatedQuery)
        const related = relatedSnapshot.docs
          .filter(doc => doc.id !== id) // Exclude current product
          .slice(0, 4) // Limit to 4
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate()
          })) as Product[]
        
        setRelatedProducts(related)
        
        // Check if user has purchased this product (for verified review badge)
        if (user) {
          const purchaseQuery = query(
            collection(db, 'purchasedProducts'),
            where('userId', '==', user.uid),
            where('productId', '==', id)
          )
          const purchaseSnapshot = await getDocs(purchaseQuery)
          setHasPurchased(!purchaseSnapshot.empty)
        }
        
      } catch (err) {
        console.error('Error fetching product:', err)
        setError('Failed to load product. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    
    if (id) {
      fetchProduct()
    }
  }, [id, user])

  const discount = product?.comparePrice 
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, quantity)
      toast.success('Added to cart!')
    }
  }
  
  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          <div className="container mx-auto px-4 py-16">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading product...</span>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }
  
  // Error state
  if (error || !product) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          <div className="container mx-auto px-4 py-16">
            <div className="mx-auto max-w-md text-center">
              <AlertCircle className="mx-auto h-24 w-24 text-destructive" />
              <h1 className="mt-6 text-2xl font-bold">{error || 'Product not found'}</h1>
              <p className="mt-2 text-muted-foreground">The product you're looking for doesn't exist or has been removed.</p>
              <Button asChild className="mt-6">
                <Link href="/products">Browse Products</Link>
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
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
                  <span className="text-4xl font-bold">{formatNGN(product.price)}</span>
                  {product.comparePrice && (
                    <>
                      <span className="text-xl text-muted-foreground line-through">
                        {formatNGN(product.comparePrice)}
                      </span>
                      <Badge variant="destructive">Save {discount}%</Badge>
                    </>
                  )}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Tax included. {product.productType === 'digital' ? 'Instant delivery after payment.' : 'Shipping calculated at checkout.'}
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
              <div className="space-y-3">
                <div className="flex gap-3">
                  <Button 
                    size="lg" 
                    className="flex-1" 
                    onClick={handleAddToCart}
                    disabled={product.productType === 'physical' && product.stock === 0}
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
                
                {/* Contact Vendor Button */}
                <ContactVendor
                  vendorId={product.vendorId}
                  vendorName={product.vendorName}
                  productId={product.id}
                  productName={product.name}
                  trigger={
                    <Button variant="outline" size="lg" className="w-full">
                      <MessageCircle className="mr-2 h-5 w-5" />
                      Contact Vendor
                    </Button>
                  }
                />
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
                <ProductReviews
                  productId={product.id}
                  vendorId={product.vendorId}
                  canReview={hasPurchased}
                />
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
                        <span className="text-lg font-bold">{formatNGN(relatedProduct.price)}</span>
                        {relatedProduct.comparePrice && (
                          <span className="text-sm text-muted-foreground line-through">
                            {formatNGN(relatedProduct.comparePrice)}
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

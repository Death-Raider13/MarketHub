"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import Head from "next/head"
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
import { useWishlist } from "@/lib/wishlist-context"
import { db } from "@/lib/firebase/config"
import { doc, getDoc, collection, query, where, limit, getDocs } from "firebase/firestore"
import { ProductReviews } from "@/components/customer/product-reviews"
import { ServiceReviews } from "@/components/services/service-reviews"
import { DigitalProductReviews } from "@/components/digital-products/digital-product-reviews"
import { ContactCreator } from "@/components/customer/contact-creator"
import { ProductQA } from "@/components/customer/product-qa"
import { ReportContent } from "@/components/common/report-content"
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
  AlertCircle,
  Flag,
  Copy,
  Crown
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
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
  const { user, userProfile } = useAuth()
  const { addToCart } = useCart()
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist()

  const [product, setProduct] = useState<Product | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [hasPurchased, setHasPurchased] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [affiliateCopied, setAffiliateCopied] = useState(false)
  const [creatorstats, setcreatorstats] = useState<{ rating: number, reviewCount: number, productCount: number } | null>(null)
  const [creatorInfo, setcreatorInfo] = useState<{ description: string, verified: boolean, name: string } | null>(null)

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

        // Check if product is active or approved
        if (productData.status !== 'active' && productData.status !== 'approved') {
          setError('This product is not available')
          return
        }

        // Log view event for analytics
        if (productData.status === 'active' || productData.status === 'approved') {
          fetch('/api/analytics/view', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              productId: id,
              creatorId: productData.creatorId,
              userId: user?.uid
            })
          }).catch(err => console.error('Failed to log view:', err))
        }

        setProduct(productData)

        // Fetch related products (similar tags or same category)
        let related: Product[] = []

        // First, try to find products with similar tags
        if (productData.tags && productData.tags.length > 0) {
          const tagQuery = query(
            collection(db, 'products'),
            where('tags', 'array-contains-any', productData.tags.slice(0, 10)),
            where('status', '==', 'active'),
            limit(10)
          )

          const tagSnapshot = await getDocs(tagQuery)
          related = tagSnapshot.docs
            .filter(doc => doc.id !== id) // Exclude current product
            .map(doc => ({
              id: doc.id,
              ...doc.data(),
              createdAt: doc.data().createdAt?.toDate(),
              updatedAt: doc.data().updatedAt?.toDate()
            })) as Product[]
        }

        // If not enough products with similar tags, add products from same category
        if (related.length < 4) {
          const categoryQuery = query(
            collection(db, 'products'),
            where('category', '==', productData.category),
            where('status', '==', 'active'),
            limit(10)
          )

          const categorySnapshot = await getDocs(categoryQuery)
          const categoryProducts = categorySnapshot.docs
            .filter(doc => doc.id !== id && !related.some(p => p.id === doc.id))
            .map(doc => ({
              id: doc.id,
              ...doc.data(),
              createdAt: doc.data().createdAt?.toDate(),
              updatedAt: doc.data().updatedAt?.toDate()
            })) as Product[]

          related = [...related, ...categoryProducts]
        }

        setRelatedProducts(related.slice(0, 4))

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

        // Fetch creator information
        try {
          const creatorDoc = await getDoc(doc(db, 'users', productData.creatorId))
          if (creatorDoc.exists()) {
            const creatorData = creatorDoc.data()
            setcreatorInfo({
              name: creatorData.displayName || creatorData.businessName || creatorData.email?.split('@')[0] || 'creator',
              description: creatorData.storeDescription || creatorData.bio || 'Quality products with excellent customer service.',
              verified: creatorData.verified === true || creatorData.featured === true || creatorData.verificationStatus === 'verified'
            })
          }

          // Get creator product count
          const creatorProductsQuery = query(
            collection(db, 'products'),
            where('creatorId', '==', productData.creatorId),
            where('status', '==', 'active')
          )
          const creatorProductsSnapshot = await getDocs(creatorProductsQuery)

          // Calculate creator rating from all their product reviews
          const reviewsQuery = query(
            collection(db, 'reviews'),
            where('creatorId', '==', productData.creatorId)
          )
          const reviewsSnapshot = await getDocs(reviewsQuery)

          let totalRating = 0
          let reviewCount = 0

          reviewsSnapshot.forEach(doc => {
            const review = doc.data()
            if (review.rating) {
              totalRating += review.rating
              reviewCount++
            }
          })

          const averageRating = reviewCount > 0 ? (totalRating / reviewCount) : 0

          setcreatorstats({
            rating: reviewCount > 0 ? Number(averageRating.toFixed(1)) : 0,
            reviewCount: reviewCount,
            productCount: creatorProductsSnapshot.size
          })
        } catch (err) {
          console.error('Error fetching creator info:', err)
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

  // Capture a product-specific affiliate referral for 30 days and record the click once per browser/product/code.
  useEffect(() => {
    if (!id || typeof window === 'undefined') return

    const params = new URLSearchParams(window.location.search)
    const code = params.get('ref')
    if (!code) return

    const affiliateProductId = params.get('aff_product') || id
    const expiresAt = Date.now() + (30 * 24 * 60 * 60 * 1000)
    window.localStorage.setItem('markethub_affiliate_attribution', JSON.stringify({
      code,
      productId: affiliateProductId,
      expiresAt,
    }))

    const clickStorageKey = `markethub_affiliate_click_${code}_${id}`
    let clickId = window.localStorage.getItem(clickStorageKey)
    if (!clickId) {
      clickId = crypto.randomUUID()
      window.localStorage.setItem(clickStorageKey, clickId)
    }

    fetch('/api/affiliate/click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        productId: id,
        clickId,
        landingPath: window.location.pathname,
      }),
    }).catch(error => console.error('Failed to record affiliate click:', error))
  }, [id])

  // Track product view for analytics (counts toward creator dashboard total views)
  useEffect(() => {
    if (!id) return

    // Fire-and-forget; errors are logged in the API route
    fetch(`/api/products/${id}/track-view`, {
      method: "POST",
    }).catch(() => {
      // Intentionally ignore client-side errors here
    })
  }, [id])

  const discount = product?.comparePrice
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, quantity)
      toast.success('Added to cart!')
    }
  }

  const handleAffiliateLink = async () => {
    if (!product || userProfile?.role !== 'promoter' || !userProfile.referralCode) return

    const link = `${window.location.origin}/products/${product.id}?ref=${encodeURIComponent(userProfile.referralCode)}&aff_product=${encodeURIComponent(product.id)}`
    await navigator.clipboard.writeText(link)
    setAffiliateCopied(true)
    toast.success('Product affiliate link copied')
    window.setTimeout(() => setAffiliateCopied(false), 2000)
  }

  const handleShare = async () => {
    if (!product || isSharing) return

    // Create rich share content
    const priceText = formatNGN(product.price)
    const compareText = product.comparePrice ? ` (was ${formatNGN(product.comparePrice)})` : ''
    const creatorText = product.creatorName || 'FEROMARKETHUB creator'

    const shareText = `🛍️ ${product.name}

💰 ${priceText}${compareText}
🏪 Available at ${creatorText}'s store on FEROMARKETHUB

${product.description.length > 100 ? product.description.substring(0, 100) + '...' : product.description}

✨ Shop now and get quality products with secure payment!

#FEROMARKETHUB #Shopping #${product.category}`

    const shareData = {
      title: `${product.name} - ${priceText}`,
      text: shareText,
      url: window.location.href
    }

    try {
      setIsSharing(true)

      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData)
        toast.success('Shared successfully!')
      } else {
        // Fallback: Copy rich text to clipboard
        const fullShareText = `${shareText}\n\n🔗 ${window.location.href}`
        await navigator.clipboard.writeText(fullShareText)
        toast.success('Product details copied to clipboard!')
      }
    } catch (error) {
      console.error('Error sharing:', error)

      // Handle specific share errors
      if (error instanceof Error && (error.name === 'InvalidStateError' || error.name === 'AbortError')) {
        // User cancelled or share in progress, don't show error
        return
      }

      // Fallback: Copy rich text to clipboard
      try {
        const fullShareText = `${shareText}\n\n🔗 ${window.location.href}`
        await navigator.clipboard.writeText(fullShareText)
        toast.success('Product details copied to clipboard!')
      } catch (clipboardError) {
        toast.error('Failed to share')
      }
    } finally {
      setIsSharing(false)
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
      <Head>
        <title>{product.name} - {formatNGN(product.price)} | FEROMARKETHUB</title>
        <meta name="description" content={`${product.description.substring(0, 160)}... Available at ${product.creatorName || 'FEROMARKETHUB'}'s store. Shop now with secure payment!`} />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="product" />
        <meta property="og:title" content={`${product.name} - ${formatNGN(product.price)}`} />
        <meta property="og:description" content={`${product.description.substring(0, 200)}... Shop now at ${product.creatorName || 'FEROMARKETHUB'}'s store on FEROMARKETHUB!`} />
        <meta property="og:image" content={product.images[0] || '/placeholder.svg'} />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:site_name" content="FEROMARKETHUB" />

        {/* Product specific */}
        <meta property="product:price:amount" content={product.price.toString()} />
        <meta property="product:price:currency" content="NGN" />
        <meta property="product:availability" content={product.stock > 0 ? "in stock" : "out of stock"} />
        <meta property="product:brand" content={product.creatorName || 'FEROMARKETHUB'} />
        <meta property="product:category" content={product.category} />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${product.name} - ${formatNGN(product.price)}`} />
        <meta name="twitter:description" content={`${product.description.substring(0, 200)}... Shop now at ${product.creatorName || 'FEROMARKETHUB'}'s store on FEROMARKETHUB!`} />
        <meta name="twitter:image" content={product.images[0] || '/placeholder.svg'} />
      </Head>

      <Header />

      <main className="flex-1">
        {/* Breadcrumb */}
        <div className="border-b border-border bg-muted/30">
          <div className="container mx-auto px-4 py-3 overflow-x-auto scrollbar-none">
            <nav className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground whitespace-nowrap" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-foreground shrink-0">Home</Link>
              <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
              <Link href="/products" className="hover:text-foreground shrink-0">Products</Link>
              <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
              <Link href={`/products?category=${product.category}`} className="hover:text-foreground capitalize shrink-0">
                {product.category}
              </Link>
              <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
              <span className="text-foreground line-clamp-1 truncate max-w-[180px] sm:max-w-none">{product.name}</span>
            </nav>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6 sm:py-8">
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
              <div className="grid grid-cols-4 gap-2 sm:gap-4">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`relative aspect-square overflow-hidden rounded-lg border-2 transition-colors ${selectedImage === index ? "border-primary" : "border-border hover:border-primary/50"
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
                <div className="flex items-center gap-2 mb-2">
                  <Link
                    href={`/hub/${product.creatorId}`}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                  >
                    <Store className="h-4 w-4" />
                    {creatorInfo?.name || 'Creator Hub'}
                  </Link>
                  {creatorInfo?.verified && (
                    <Badge className="bg-amber-500 hover:bg-amber-600 text-black text-[10px] font-extrabold px-2 py-0.5 uppercase tracking-wider flex items-center gap-1">
                      <Crown className="h-3 w-3 fill-black" /> Verified Educator
                    </Badge>
                  )}
                </div>
                <h1 className="text-3xl font-bold">{product.name}</h1>
                <div className="mt-2 flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-5 w-5 ${i < Math.floor(product.rating || 0)
                            ? "fill-yellow-400 text-yellow-400"
                            : "fill-muted text-muted"
                            }`}
                        />
                      ))}
                    </div>
                    <span className="font-medium">{product.rating || 0}</span>
                  </div>
                  <Separator orientation="vertical" className="h-5" />
                  <Link href="#reviews" className="text-sm text-primary hover:underline">
                    {(product.reviewCount || 0).toLocaleString()} reviews
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
                  Tax included. {product.type === 'digital' ? 'Instant access after payment.' : 'Service scheduling details provided after purchase.'}
                </p>
              </div>

              {/* Stock Status */}
              <div className="flex items-center gap-2 text-green-600">
                <Check className="h-5 w-5" />
                <span className="font-medium">
                  {product.type === 'digital' ? 'Available for instant access' : 'Service available'}
                </span>
              </div>


              {/* Action Buttons */}
              <div className="space-y-3">
                <div className="flex flex-wrap sm:flex-nowrap gap-2 sm:gap-3">
                  <Button
                    size="lg"
                    className="w-full sm:flex-1 font-bold min-w-[140px]"
                    onClick={handleAddToCart}
                  >
                    {product.type === 'digital' ? 'Buy Now' : 'Book Service'}
                  </Button>
                  <div className="flex gap-2 w-full sm:w-auto justify-stretch sm:justify-start">
                    <Button
                      size="lg"
                      variant="outline"
                      className="flex-1 sm:flex-none px-3"
                      onClick={() => {
                        if (product) {
                          if (isInWishlist(product.id)) {
                            removeFromWishlist(product.id)
                          } else {
                            addToWishlist(product)
                          }
                        }
                      }}
                      aria-label={product && isInWishlist(product.id) ? "Remove from wishlist" : "Add to wishlist"}
                    >
                      <Heart className={`h-5 w-5 ${product && isInWishlist(product.id) ? "fill-red-500 text-red-500" : ""}`} />
                    </Button>
                    <Button size="lg" variant="outline" className="flex-1 sm:flex-none px-3" onClick={handleShare} disabled={isSharing} aria-label="Share product">
                      {isSharing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Share2 className="h-5 w-5" />}
                    </Button>
                    <ReportContent
                      type="product"
                      itemId={product.id}
                      itemTitle={product.name}
                      itemUrl={`/products/${product.id}`}
                      trigger={
                        <Button size="lg" variant="outline" className="flex-1 sm:flex-none px-3" aria-label="Report product">
                          <Flag className="h-5 w-5" />
                        </Button>
                      }
                    />
                  </div>
                </div>

                {userProfile?.role === 'promoter' && userProfile.referralCode && (
                  <Button variant="secondary" size="lg" className="w-full font-bold" onClick={handleAffiliateLink}>
                    <Copy className="mr-2 h-5 w-5" />
                    {affiliateCopied ? 'Affiliate Link Copied' : 'Advertise This Product'}
                  </Button>
                )}

                {/* Contact Creator Button */}
                <ContactCreator
                  creatorId={product.creatorId}
                  creatorName={creatorInfo?.name || 'Creator'}
                  productId={product.id}
                  productName={product.name}
                  trigger={
                    <Button variant="outline" size="lg" className="w-full font-medium">
                      <MessageCircle className="mr-2 h-5 w-5" />
                      Contact Creator
                    </Button>
                  }
                />
              </div>

              {/* Features */}
              <Card>
                <CardContent className="p-4 sm:p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-sm sm:text-base">Secure Payment</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">100% secure encrypted transactions</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-sm sm:text-base">
                        {product.type === 'digital' ? 'Instant Access' : 'Verified Service'}
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {product.type === 'digital' ? 'Download immediately after payment' : 'Professional quality guaranteed'}
                      </p>
                    </div>
                  </div>
                  {product.type === 'digital' && (
                    <>
                      <Separator />
                      <div className="flex items-start gap-3">
                        <RotateCcw className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                        <div>
                          <p className="font-medium text-sm sm:text-base">Instant Access</p>
                          <p className="text-xs sm:text-sm text-muted-foreground">Download immediately after purchase</p>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* creator Information Section */}
          <div className="mt-8 sm:mt-12">
            <Card className="border-2">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 text-center sm:text-left">
                  <Avatar className="h-16 w-16 sm:h-20 sm:w-20 shrink-0">
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${creatorInfo?.name}`} />
                    <AvatarFallback className="text-2xl bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                      {creatorInfo?.name?.charAt(0) || 'V'}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 w-full">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div>
                        <h3 className="text-lg sm:text-xl font-bold mb-1">{creatorInfo?.name || 'Creator'}</h3>
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground mb-3">
                          {creatorstats && (
                            <>
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span className="font-medium">{creatorstats.rating}</span>
                                <span>({creatorstats.reviewCount} reviews)</span>
                              </div>
                              <span className="hidden sm:inline">•</span>
                              <span>{creatorstats.productCount}+ creations</span>
                            </>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
                          {creatorInfo?.description || 'Quality creations with excellent service.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 mt-4 w-full sm:w-auto">
                      <Button asChild variant="default" className="w-full sm:w-auto">
                        <Link href={`/hub/${product.creatorId}`}>
                          <Store className="mr-2 h-4 w-4" />
                          Visit Store
                        </Link>
                      </Button>
                      <ContactCreator
                        creatorId={product.creatorId}
                        creatorName={creatorInfo?.name || 'Creator'}
                        productId={product.id}
                        productName={product.name}
                        trigger={
                          <Button variant="outline" className="w-full sm:w-auto">
                            <MessageCircle className="mr-2 h-4 w-4" />
                            Contact Creator
                          </Button>
                        }
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Product Details Tabs */}
          <div className="mt-10 sm:mt-16">
            <Tabs defaultValue="description" className="w-full">
              <div className="overflow-x-auto scrollbar-none border-b">
                <TabsList className="w-full justify-start border-none rounded-none h-auto p-0 bg-transparent flex-nowrap min-w-max">
                  <TabsTrigger value="description" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary py-2.5 px-4 text-xs sm:text-sm">
                    Description
                  </TabsTrigger>
                  <TabsTrigger value="specifications" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary py-2.5 px-4 text-xs sm:text-sm">
                    Specifications
                  </TabsTrigger>
                  <TabsTrigger value="reviews" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary py-2.5 px-4 text-xs sm:text-sm">
                    Reviews ({product.reviewCount || 0})
                  </TabsTrigger>
                  <TabsTrigger value="qa" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary py-2.5 px-4 text-xs sm:text-sm">
                    Q&A
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="description" className="mt-6">
                <div className="prose max-w-none">
                  <p className="text-lg whitespace-pre-wrap">{product.description}</p>
                  {product.features && product.features.length > 0 && (
                    <>
                      <h3 className="mt-6 text-xl font-semibold">Key Features</h3>
                      <ul className="space-y-2">
                        {product.features.map((feature: string, index: number) => (
                          <li key={index}>{feature}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="specifications" className="mt-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="font-semibold mb-4">Product Information</h3>
                      <dl className="space-y-2 text-sm">
                        {product.sku && (
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">SKU:</dt>
                            <dd className="font-medium">{product.sku}</dd>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Category:</dt>
                          <dd className="font-medium capitalize">{product.category}</dd>
                        </div>
                        {product.subcategory && (
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Subcategory:</dt>
                            <dd className="font-medium capitalize">{product.subcategory}</dd>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Type:</dt>
                          <dd className="font-medium capitalize">{product.type || 'Physical'}</dd>
                        </div>
                        {product.tags && product.tags.length > 0 && (
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Tags:</dt>
                            <dd className="font-medium">{product.tags.join(', ')}</dd>
                          </div>
                        )}
                      </dl>
                    </CardContent>
                  </Card>
                  {product.specifications && Object.keys(product.specifications).length > 0 && (
                    <Card>
                      <CardContent className="p-6">
                        <h3 className="font-semibold mb-4">Specifications</h3>
                        <dl className="space-y-2 text-sm">
                          {Object.entries(product.specifications).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <dt className="text-muted-foreground capitalize">{key}:</dt>
                              <dd className="font-medium">{value as string}</dd>
                            </div>
                          ))}
                        </dl>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="reviews" id="reviews" className="mt-6">
                {product.type === 'service' ? (
                  <ServiceReviews
                    serviceId={product.id}
                  />
                ) : product.type === 'digital' ? (
                  <DigitalProductReviews
                    productId={product.id}
                  />
                ) : (
                  <ProductReviews
                    productId={product.id}
                    creatorId={product.creatorId}
                    canReview={hasPurchased}
                  />
                )}
              </TabsContent>

              <TabsContent value="qa" className="mt-6">
                <ProductQA
                  productId={product.id}
                  creatorId={product.creatorId}
                  productName={product.name}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Related Products */}
          <div className="mt-16">
            <h2 className="text-2xl font-bold mb-6">You May Also Like</h2>
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

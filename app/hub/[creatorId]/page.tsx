"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Store, ShoppingCart, Share2, Mail, Globe, 
  Twitter, Instagram, Facebook, Loader2, Flag, Shield, Crown,
  Search, Star, Youtube, Linkedin, MessageCircle, AlertCircle, HelpCircle
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { ReportContent } from "@/components/common/report-content"
import { useCart } from "@/lib/cart-context"
import type { Product } from "@/lib/types"

interface CreatorData {
  uid: string
  email: string
  phone?: string
  displayName?: string
  hubName?: string
  reputation?: {
    score: number
    level: string
    badges: string[]
    averageRating: number
    totalSales: number
  }
  createdAt?: any // Firebase Timestamp
  storeCustomization?: {
    theme?: {
      primaryColor: string
      secondaryColor: string
      backgroundColor: string
      textColor: string
      accentColor: string
      fontFamily: string
    }
    branding?: {
      hubName: string
      tagline: string
      description: string
      logo: string
      bannerImage: string
    }
    layout?: {
      headerStyle: "minimal" | "centered" | "full"
      productGrid: "2" | "3" | "4"
      showCategories: boolean
      showSearch: boolean
      showBanner: boolean
    }
    social?: {
      twitter: string
      instagram: string
      facebook: string
      linkedin: string
      youtube: string
      tiktok: string
      website: string
    }
    contact?: {
      whatsapp: string
    }
    content?: {
      aboutPage: string
      returnPolicy: string
      shippingInfo: string
    }
    features?: {
      enableCart: boolean
      enableWishlist: boolean
      enableReviews: boolean
      showSocialProof: boolean
    }
  }
}

export default function CreatorHubPage() {
  const params = useParams()
  const creatorId = params.creatorId as string
  const { addToCart, totalItems } = useCart()

  const [creator, setCreator] = useState<CreatorData | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    loadCreatorData()
    loadProducts()
  }, [creatorId])

  // Track hub page view for creator analytics
  useEffect(() => {
    if (!creatorId) return

    fetch(`/api/hub/${creatorId}/track-view`, {
      method: "POST",
    }).catch(() => {})
  }, [creatorId])

  const loadCreatorData = async () => {
    try {
      const creatorDoc = await getDoc(doc(db, "users", creatorId))
      if (!creatorDoc.exists()) {
        toast.error("Creator Hub not found")
        setLoading(false)
        return
      }

      const creatorData = creatorDoc.data()
      const reputationDoc = await getDoc(doc(db, "creator_reputation", creatorId))
      const reputationData = reputationDoc.exists() ? reputationDoc.data() : null

      const customizationDoc = await getDoc(doc(db, "hubCustomization", creatorId))
      const customizationData = customizationDoc.exists() ? customizationDoc.data() : null

      setCreator({
        ...creatorData,
        reputation: reputationData,
        storeCustomization: customizationData
      } as any)
    } catch (error) {
      console.error("Error loading creator:", error)
      toast.error("Failed to load Creator Hub")
    } finally {
      setLoading(false)
    }
  }

  const loadProducts = async () => {
    try {
      const productsQuery = query(
        collection(db, "products"),
        where("creatorId", "==", creatorId),
        where("status", "in", ["active", "approved"])
      )
      const productsSnapshot = await getDocs(productsQuery)
      const productsData = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[]
      setProducts(productsData)
    } catch (error) {
      console.error("Error loading products:", error)
    }
  }

  const handleShare = async () => {
    try {
      const url = window.location.href
      if (navigator.share) {
        await navigator.share({
          title: branding.hubName,
          text: `Check out ${branding.hubName} on FEROMARKETHUB`,
          url,
        })
        return
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url)
        toast.success("Hub link copied to clipboard!")
      } else {
        toast.error("Sharing is not supported on this browser.")
      }
    } catch (error) {
      console.error("Error sharing hub:", error)
      toast.error("Failed to share Hub. Please copy the link from the address bar.")
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!creator) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Store className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-2">Creator Hub Not Found</h1>
          <p className="text-muted-foreground mb-4">
            This Hub doesn't exist or has been removed.
          </p>
          <Button asChild>
            <Link href="/">Go to Homepage</Link>
          </Button>
        </div>
      </div>
    )
  }

  // Get customization or use defaults gracefully
  const custom = (creator.storeCustomization || {}) as any
  const theme = custom.theme || {
    primaryColor: "hsl(var(--primary))",
    secondaryColor: "hsl(var(--secondary))",
    backgroundColor: "hsl(var(--background))",
    textColor: "hsl(var(--foreground))",
    accentColor: "#7DD3FC",
    fontFamily: "var(--font-sans)"
  }
  const customBranding = custom.branding || {}
  const layout = custom.layout || {
    headerStyle: "centered" as const,
    productGrid: "3",
    showCategories: true,
    showSearch: true,
    showBanner: true,
  }
  const social = custom.social || {}
  const contact = custom.contact || {}
  const content = custom.content || {}
  const features = custom.features || {
    enableCart: true,
    enableWishlist: true,
    enableReviews: true,
    showSocialProof: true
  }

  // Merge branding with creator profile data
  const branding = {
    hubName: creator.hubName || creator.displayName || customBranding.hubName || "Creator Hub",
    tagline: customBranding.tagline || "",
    description: customBranding.description || "",
    logo: customBranding.logo || "",
    bannerImage: customBranding.bannerImage || ""
  }

  // Filter products by search
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const hasSocials = social.twitter || social.instagram || social.facebook || social.linkedin || social.youtube || social.tiktok || social.website
  const hasAbout = !!branding.description || !!content.aboutPage
  const hasSupportPolicy = !!content.supportPolicy
  const hasFaqs = !!content.faqs && content.faqs.length > 0

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: theme.backgroundColor,
        color: theme.textColor,
        fontFamily: theme.fontFamily
      }}
    >
      {/* Header */}
      <header
        className={`border-b sticky top-0 z-50 backdrop-blur-sm ${layout.headerStyle === 'minimal' ? 'py-2' : 'py-4'}`}
        style={{
          backgroundColor: theme.backgroundColor + 'f0',
          borderColor: theme.primaryColor + '20'
        }}
      >
        <div className="container mx-auto px-4">
          <div className={`flex items-center justify-between ${layout.headerStyle === 'centered' ? 'flex-col gap-4 text-center sm:flex-row sm:text-left' : ''}`}>
            {/* Logo & Hub Name */}
            <div className={`flex items-center gap-3 ${layout.headerStyle === 'centered' ? 'flex-col sm:flex-row' : ''}`}>
              {branding.logo ? (
                <img
                  src={branding.logo}
                  alt={branding.hubName}
                  className={`${layout.headerStyle === 'minimal' ? 'w-8 h-8' : 'w-12 h-12'} object-contain`}
                />
              ) : (
                <div
                  className={`${layout.headerStyle === 'minimal' ? 'w-8 h-8' : 'w-12 h-12'} rounded-full flex items-center justify-center`}
                  style={{ backgroundColor: theme.primaryColor }}
                >
                  <Store className={`${layout.headerStyle === 'minimal' ? 'h-4 w-4' : 'h-6 w-6'} text-white`} />
                </div>
              )}
              <div className={`${layout.headerStyle === 'centered' ? 'flex flex-col items-center sm:items-start' : ''}`}>
                <div className="flex items-center gap-2">
                  <h1 className={`${layout.headerStyle === 'minimal' ? 'text-lg' : 'text-xl'} font-bold`}>{branding.hubName}</h1>
                  {(creator as any).verified === true && (
                    <Badge className="bg-amber-500 text-black border-none text-[10px] font-extrabold px-2 py-0.5 uppercase tracking-wider flex items-center gap-1 shadow-sm">
                      <Crown className="h-3 w-3 fill-black" /> Verified Educator
                    </Badge>
                  )}
                  {creator.reputation?.level && features.showSocialProof !== false && (
                    <Badge variant="secondary" className="bg-blue-600 text-white border-none text-[10px] h-5 uppercase">
                      {creator.reputation.level}
                    </Badge>
                  )}
                </div>
                {layout.headerStyle !== 'minimal' && (
                  <div className={`flex items-center gap-2 mt-1 ${layout.headerStyle === 'centered' ? 'justify-center sm:justify-start' : ''}`}>
                    {branding.tagline && (
                      <p className="text-sm opacity-75">{branding.tagline}</p>
                    )}
                    {creator.reputation?.badges?.map((badge: string) => (
                      <Badge key={badge} variant="outline" className="text-[10px] h-4 border-blue-400 text-blue-600 bg-blue-50">
                        {badge}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={handleShare}>
                <Share2 className="h-5 w-5" />
              </Button>
              <ReportContent
                type="creator"
                itemId={creatorId}
                itemTitle={branding.hubName}
                itemUrl={`/hub/${creatorId}`}
                trigger={
                  <Button variant="ghost" size="icon">
                    <Flag className="h-5 w-5" />
                  </Button>
                }
              />
              {features.enableCart !== false && (
                <Button
                  variant="outline"
                  asChild
                  style={{ borderColor: theme.primaryColor, color: theme.primaryColor }}
                >
                  <Link href="/cart">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4" />
                      <span className="hidden sm:inline">Cart</span>
                      {totalItems > 0 && (
                        <span className="rounded-full px-2 py-0.5 text-xs text-white" style={{ backgroundColor: theme.primaryColor }}>
                          {totalItems}
                        </span>
                      )}
                    </div>
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Banner */}
      {layout.showBanner !== false && branding.bannerImage && (
        <div className="w-full h-64 overflow-hidden relative">
          <div className="absolute inset-0 bg-black/10 z-10"></div>
          <img
            src={branding.bannerImage}
            alt="Hub Banner"
            className="w-full h-full object-cover relative z-0"
          />
        </div>
      )}

      {/* Announcement */}
      {content.announcement && (
        <div className="w-full py-2 px-4 text-center text-sm font-medium" style={{ backgroundColor: theme.primaryColor + '15', color: theme.primaryColor }}>
          {content.announcement}
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Main Content Area */}
          <div className="lg:col-span-3">
            
            {/* Search conditionally rendered */}
            {layout.showSearch !== false && (
              <div className="mb-8">
                <div className="relative max-w-xl">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 opacity-50" />
                  <Input
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-12 text-md shadow-sm border-2 transition-all focus-visible:ring-0"
                    style={{ borderColor: theme.primaryColor + '40', backgroundColor: theme.backgroundColor }}
                  />
                </div>
              </div>
            )}


            <Tabs defaultValue="products" className="w-full">
              <TabsList 
                className="mb-8 w-full justify-start overflow-x-auto rounded-none border-b bg-transparent p-0 flex-nowrap" 
                style={{ borderColor: theme.primaryColor + '20' }}
              >
                <TabsTrigger 
                  value="products" 
                  className="rounded-none border-b-2 border-transparent px-6 pb-3 pt-3 font-semibold data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none whitespace-nowrap"
                  style={{ color: theme.textColor }}
                >
                  Products <Badge variant="secondary" className="ml-2 opacity-80">{filteredProducts.length}</Badge>
                </TabsTrigger>
                
                {hasAbout && (
                  <TabsTrigger 
                    value="about" 
                    className="rounded-none border-b-2 border-transparent px-6 pb-3 pt-3 font-semibold data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none whitespace-nowrap"
                    style={{ color: theme.textColor }}
                  >
                    About Hub
                  </TabsTrigger>
                )}

                {hasSupportPolicy && (
                  <TabsTrigger 
                    value="support" 
                    className="rounded-none border-b-2 border-transparent px-6 pb-3 pt-3 font-semibold data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none whitespace-nowrap"
                    style={{ color: theme.textColor }}
                  >
                    Support
                  </TabsTrigger>
                )}

                {hasFaqs && (
                  <TabsTrigger 
                    value="faqs" 
                    className="rounded-none border-b-2 border-transparent px-6 pb-3 pt-3 font-semibold data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none whitespace-nowrap"
                    style={{ color: theme.textColor }}
                  >
                    FAQ
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="products" className="mt-0 outline-none animate-in fade-in-50 duration-500">
                {filteredProducts.length === 0 ? (
                  <Card className="border-dashed" style={{ borderColor: theme.primaryColor + '40', backgroundColor: 'transparent' }}>
                    <CardContent className="p-16 text-center">
                      <Store className="h-16 w-16 mx-auto mb-4 opacity-20" />
                      <h3 className="text-xl font-semibold mb-2">No Products Yet</h3>
                      <p className="text-muted-foreground max-w-sm mx-auto">
                        {searchQuery
                          ? "We couldn't find any products matching your search."
                          : "This hub hasn't published any products yet. Check back soon!"}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className={`grid gap-6 ${
                    layout.productGrid === '2' ? 'grid-cols-1 sm:grid-cols-2' :
                    layout.productGrid === '4' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' :
                    'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                  }`}>
                    {filteredProducts.map((product) => (
                      <Card
                        key={product.id}
                        className="group overflow-hidden rounded-xl border-2 transition-all hover:scale-[1.02] cursor-pointer"
                        style={{ borderColor: theme.primaryColor + '15', backgroundColor: theme.backgroundColor }}
                      >
                        <CardContent className="p-0 flex flex-col h-full">
                          <Link href={`/products/${product.id}`} className="block">
                            <div className="aspect-[4/3] bg-muted/30 overflow-hidden relative">
                              {product.images && product.images[0] ? (
                                <img
                                  src={product.images[0]}
                                  alt={product.name}
                                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Store className="h-12 w-12 opacity-10" />
                                </div>
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-4">
                                <Button size="sm" variant="secondary" className="backdrop-blur-md bg-white/20 border-white/40 text-white hover:bg-white/40 font-medium w-full">View Details</Button>
                              </div>
                            </div>
                          </Link>

                          <div className="p-5 flex-1 flex flex-col">
                            <h3 className="font-bold mb-1 line-clamp-1 text-lg">{product.name}</h3>
                            {features.showSocialProof !== false && (
                              <div className="flex items-center gap-1 mb-3">
                                <Star className={`h-3.5 w-3.5 ${product.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
                                <span className="text-xs font-medium opacity-80">
                                  {product.rating ? product.rating.toFixed(1) : "5.0"}
                                  {product.reviewCount ? ` (${product.reviewCount})` : " (0)"}
                                </span>
                              </div>
                            )}
                            <p className="text-sm opacity-70 mb-4 line-clamp-2 leading-relaxed flex-1">
                              {product.description}
                            </p>
                            <div className="flex items-center justify-between mt-auto pt-4 border-t" style={{ borderColor: theme.primaryColor + '15' }}>
                              <span className="text-xl font-bold" style={{ color: theme.primaryColor }}>
                                ₦{product.price.toLocaleString()}
                              </span>
                              {features.enableCart !== false && (
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    addToCart(product as Product)
                                    toast.success("Added to cart")
                                  }}
                                  className="rounded-full px-4 shadow-sm hover:shadow-md transition-shadow"
                                  style={{ backgroundColor: theme.primaryColor, color: '#ffffff' }}
                                >
                                  <ShoppingCart className="h-4 w-4 mr-1.5" />
                                  Add
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {hasAbout && (
                <TabsContent value="about" className="mt-0 outline-none animate-in fade-in-50 duration-500">
                  <Card style={{ borderColor: theme.primaryColor + '20', backgroundColor: theme.backgroundColor + 'AA' }} className="shadow-sm">
                    <CardContent className="p-8 prose prose-slate dark:prose-invert max-w-none">
                      <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                         <Store className="h-6 w-6 opacity-70" />
                         Welcome to {branding.hubName}
                      </h2>
                      {branding.description && (
                         <div className="text-lg opacity-90 leading-relaxed mb-8 border-b pb-8" style={{ borderColor: theme.primaryColor + '20' }}>
                           {branding.description}
                         </div>
                      )}
                      {content.aboutPage && (
                        <div className="whitespace-pre-wrap leading-relaxed opacity-85 text-base">
                          {content.aboutPage}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              )}

              {hasSupportPolicy && (
                <TabsContent value="support" className="mt-0 outline-none animate-in fade-in-50 duration-500">
                  <Card style={{ borderColor: theme.primaryColor + '20', backgroundColor: theme.backgroundColor + 'AA' }} className="shadow-sm">
                    <CardContent className="p-8">
                       <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                         <HelpCircle className="h-6 w-6 opacity-70" /> Support Policy
                       </h2>
                       <div className="whitespace-pre-wrap leading-relaxed opacity-85 text-base">
                         {content.supportPolicy}
                       </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}

              {hasFaqs && (
                <TabsContent value="faqs" className="mt-0 outline-none animate-in fade-in-50 duration-500">
                  <Card style={{ borderColor: theme.primaryColor + '20', backgroundColor: theme.backgroundColor + 'AA' }} className="shadow-sm">
                    <CardContent className="p-8">
                       <h2 className="text-xl font-bold mb-6">Frequently Asked Questions</h2>
                       <div className="space-y-6">
                         {content.faqs?.map((faq: { question: string, answer: string }, idx: number) => (
                           <div key={idx} className="border-b pb-6 last:border-0 last:pb-0" style={{ borderColor: theme.primaryColor + '15' }}>
                             <h4 className="font-semibold text-lg mb-2">{faq.question}</h4>
                             <p className="opacity-80 leading-relaxed text-sm">{faq.answer}</p>
                           </div>
                         ))}
                       </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-28 space-y-6">
              
              {/* Creator Stats Card */}
              {features.showSocialProof !== false && (
                <Card className="border-none shadow-sm" style={{ backgroundColor: theme.primaryColor + '0A', borderColor: theme.primaryColor + '20', borderWidth: '1px' }}>
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-5 flex items-center gap-2 uppercase tracking-wider text-xs opacity-70">
                      <Shield className="h-4 w-4" /> Provider Verification
                    </h3>
                    <div className="space-y-5">
                      <div className="flex justify-between items-center text-sm border-b pb-3" style={{ borderColor: theme.primaryColor + '15' }}>
                        <span className="opacity-80">Expertise Rating</span>
                        <span className="font-bold text-lg">{creator.reputation?.averageRating?.toFixed(1) || "5.0"} / 5.0</span>
                      </div>
                      <div className="flex justify-between items-center text-sm border-b pb-3" style={{ borderColor: theme.primaryColor + '15' }}>
                        <span className="opacity-80">Total Impact</span>
                        <span className="font-bold text-lg">{creator.reputation?.totalSales || 0}+ Sales</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="opacity-80">Trust Level</span>
                        <Badge variant="outline" className="text-[10px] uppercase border font-bold" style={{ borderColor: theme.primaryColor, color: theme.primaryColor }}>
                          {creator.reputation?.level || "Rising Star"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Social & Contact Card */}
              {(hasSocials || contact.whatsapp || creator.email) && (
                <Card className="shadow-sm border-none" style={{ backgroundColor: theme.backgroundColor, borderColor: theme.primaryColor + '20', borderWidth: '1px' }}>
                  <CardContent className="p-6 space-y-8">
                    
                    {/* Social Links */}
                    {hasSocials && (
                      <div>
                        <h3 className="font-semibold text-xs uppercase tracking-wider mb-4 opacity-70 flex items-center gap-2"><Globe className="h-4 w-4" /> Follow Outpost</h3>
                        <div className="flex flex-wrap gap-2">
                          {social.twitter && (
                            <Button variant="outline" size="icon" className="rounded-full h-10 w-10 hover:bg-black hover:text-white transition-colors" style={{ borderColor: theme.primaryColor + '30' }} asChild>
                              <a href={`https://twitter.com/${social.twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer"><Twitter className="h-4 w-4" /></a>
                            </Button>
                          )}
                          {social.instagram && (
                            <Button variant="outline" size="icon" className="rounded-full h-10 w-10 hover:bg-pink-600 hover:border-pink-600 hover:text-white transition-colors" style={{ borderColor: theme.primaryColor + '30' }} asChild>
                              <a href={`https://instagram.com/${social.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer"><Instagram className="h-4 w-4" /></a>
                            </Button>
                          )}
                          {social.facebook && (
                            <Button variant="outline" size="icon" className="rounded-full h-10 w-10 hover:bg-blue-600 hover:border-blue-600 hover:text-white transition-colors" style={{ borderColor: theme.primaryColor + '30' }} asChild>
                              <a href={`https://facebook.com/${social.facebook}`} target="_blank" rel="noopener noreferrer"><Facebook className="h-4 w-4" /></a>
                            </Button>
                          )}
                          {social.youtube && (
                            <Button variant="outline" size="icon" className="rounded-full h-10 w-10 hover:bg-red-600 hover:border-red-600 hover:text-white transition-colors" style={{ borderColor: theme.primaryColor + '30' }} asChild>
                              <a href={`https://youtube.com/@${social.youtube.replace('@', '')}`} target="_blank" rel="noopener noreferrer"><Youtube className="h-4 w-4" /></a>
                            </Button>
                          )}
                          {social.linkedin && (
                            <Button variant="outline" size="icon" className="rounded-full h-10 w-10 hover:bg-blue-700 hover:border-blue-700 hover:text-white transition-colors" style={{ borderColor: theme.primaryColor + '30' }} asChild>
                              <a href={`https://linkedin.com/in/${social.linkedin}`} target="_blank" rel="noopener noreferrer"><Linkedin className="h-4 w-4" /></a>
                            </Button>
                          )}
                          {social.tiktok && (
                            <Button variant="outline" size="icon" className="rounded-full h-10 w-10 hover:bg-[#000] hover:text-white transition-colors" style={{ borderColor: theme.primaryColor + '30' }} asChild>
                              <a href={`https://tiktok.com/@${social.tiktok.replace('@', '')}`} target="_blank" rel="noopener noreferrer">Tk</a>
                            </Button>
                          )}
                          {social.website && (
                            <Button variant="outline" size="icon" className="rounded-full h-10 w-10 hover:bg-[#000] hover:border-[#000] hover:text-white transition-colors" style={{ borderColor: theme.primaryColor + '30' }} asChild>
                              <a href={social.website.startsWith('http') ? social.website : `https://${social.website}`} target="_blank" rel="noopener noreferrer"><Globe className="h-4 w-4" /></a>
                            </Button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Contact Methods */}
                    <div>
                      <h3 className="font-semibold text-xs uppercase tracking-wider mb-4 opacity-70 flex items-center gap-2"><Mail className="h-4 w-4" /> Contact Support</h3>
                      <div className="space-y-3">
                        {creator.email && (
                          <Button variant="outline" className="w-full justify-start font-medium h-12 hover:bg-black hover:text-white hover:border-black transition-colors" style={{ borderColor: theme.primaryColor + '40' }} asChild>
                            <a href={`mailto:${creator.email}`}>
                              <Mail className="h-4 w-4 mr-3 opacity-70" />
                              Email Creator
                            </a>
                          </Button>
                        )}
                        {(contact.whatsapp || creator.phone) && (
                          <Button 
                            variant="outline" 
                            className="w-full justify-start font-medium h-12 bg-green-50/50 hover:bg-green-600 hover:text-white border-green-200 text-green-700 transition-colors" 
                            asChild
                          >
                            <a href={`https://wa.me/${(contact.whatsapp || creator.phone || '').replace(/[^0-9\+]/g, '')}`} target="_blank" rel="noopener noreferrer">
                              <MessageCircle className="h-4 w-4 mr-3" />
                              WhatsApp Hub
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-20 py-10" style={{ backgroundColor: theme.primaryColor + '08', borderTop: `1px solid ${theme.primaryColor}20` }}>
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center justify-center bg-white/80 dark:bg-black/80 rounded-full px-6 py-3 shadow-sm border mb-6 backdrop-blur-sm transition-transform hover:scale-105">
            <span className="opacity-60 text-sm mr-2 font-medium">Powered by</span>
            <Link
              href="/"
              className="font-black text-lg bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
            >
              FEROMARKETHUB
            </Link>
          </div>

          <div className="opacity-50 text-sm space-y-2 font-medium">
            <p>
              © {creator?.createdAt ? new Date(creator.createdAt.toDate ? creator.createdAt.toDate() : creator.createdAt).getFullYear() : new Date().getFullYear()} {branding.hubName}. All Rights Reserved.
            </p>
            <p className="text-xs uppercase tracking-wider">
              Creator Infrastructure OS
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

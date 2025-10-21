"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Store,
  Search,
  ShoppingCart,
  Heart,
  Share2,
  Mail,
  Phone,
  Globe,
  Twitter,
  Instagram,
  Facebook,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { AdSlot } from "@/components/advertising/AdSlot"

interface VendorData {
  uid: string
  email: string
  displayName?: string
  storeName?: string
  storeCustomization?: {
    theme: {
      primaryColor: string
      secondaryColor: string
      backgroundColor: string
      textColor: string
      accentColor: string
      fontFamily: string
    }
    branding: {
      storeName: string
      tagline: string
      description: string
      logo: string
      bannerImage: string
    }
  }
}

interface Product {
  id: string
  name: string
  description: string
  price: number
  images: string[]
  category: string
  vendorId: string
}

export default function VendorStorefrontPage() {
  const params = useParams()
  const vendorId = params.vendorId as string

  const [vendor, setVendor] = useState<VendorData | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    loadVendorData()
    loadProducts()
  }, [vendorId])

  const loadVendorData = async () => {
    try {
      // Load vendor profile
      const vendorDoc = await getDoc(doc(db, "users", vendorId))
      if (!vendorDoc.exists()) {
        toast.error("Store not found")
        setLoading(false)
        return
      }

      const vendorData = vendorDoc.data()

      // Load store customization from separate collection
      const customizationDoc = await getDoc(doc(db, "storeCustomization", vendorId))
      const customizationData = customizationDoc.exists() ? customizationDoc.data() : null

      // Merge vendor data with customization
      setVendor({
        ...vendorData,
        storeCustomization: customizationData
      } as VendorData)
    } catch (error) {
      console.error("Error loading vendor:", error)
      toast.error("Failed to load store")
    } finally {
      setLoading(false)
    }
  }

  const loadProducts = async () => {
    try {
      const productsQuery = query(
        collection(db, "products"),
        where("vendorId", "==", vendorId),
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

  const handleShare = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url)
    toast.success("Store link copied to clipboard!")
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!vendor) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Store className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-2">Store Not Found</h1>
          <p className="text-muted-foreground mb-4">
            This store doesn't exist or has been removed.
          </p>
          <Button asChild>
            <Link href="/">Go to Homepage</Link>
          </Button>
        </div>
      </div>
    )
  }

  // Get customization or use defaults
  const customization = vendor.storeCustomization || {
    theme: {
      primaryColor: "#0EA5E9",
      secondaryColor: "#06B6D4",
      backgroundColor: "#F0F9FF",
      textColor: "#0C4A6E",
      accentColor: "#7DD3FC",
      fontFamily: "Inter, sans-serif"
    },
    branding: {
      tagline: "",
      description: "",
      logo: "",
      bannerImage: ""
    }
  }

  const { theme, branding: customBranding } = customization

  // Merge branding with vendor profile data (storeName comes from profile)
  const branding = {
    storeName: vendor.storeName || vendor.displayName || "Store",
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
        className="border-b sticky top-0 z-50 backdrop-blur-sm"
        style={{
          backgroundColor: theme.backgroundColor + 'f0',
          borderColor: theme.primaryColor + '20'
        }}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo & Store Name */}
            <div className="flex items-center gap-3">
              {branding.logo ? (
                <img
                  src={branding.logo}
                  alt={branding.storeName}
                  className="w-12 h-12 object-contain"
                />
              ) : (
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: theme.primaryColor }}
                >
                  <Store className="h-6 w-6 text-white" />
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold">{branding.storeName}</h1>
                {branding.tagline && (
                  <p className="text-sm opacity-75">{branding.tagline}</p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleShare}
              >
                <Share2 className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                asChild
                style={{
                  borderColor: theme.primaryColor,
                  color: theme.primaryColor
                }}
              >
                <Link href="/cart">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Cart
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Banner */}
      {branding.bannerImage && (
        <div className="w-full h-64 overflow-hidden">
          <img
            src={branding.bannerImage}
            alt="Store Banner"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {/* About Section */}
            {branding.description && (
              <Card className="mb-8" style={{ borderColor: theme.primaryColor + '20' }}>
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold mb-3">About This Store</h2>
                  <p className="opacity-90">{branding.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Search */}
            <div className="mb-8">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 opacity-50" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  style={{ borderColor: theme.primaryColor + '40' }}
                />
              </div>
            </div>

            {/* Banner Ad */}
            <AdSlot
              vendorId={vendorId}
              placement="banner"
              storeCategory="general"
              storeRating={4.5}
              storeType="all"
              className="mb-8"
            />

            {/* Products Grid */}
        <div>
          <h2 className="text-2xl font-bold mb-6">
            Products ({filteredProducts.length})
          </h2>

          {filteredProducts.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Store className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No Products Yet</h3>
                <p className="text-muted-foreground">
                  {searchQuery
                    ? "No products match your search."
                    : "This store hasn't added any products yet."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <Card
                  key={product.id}
                  className="group hover:shadow-lg transition-all cursor-pointer"
                  style={{ borderColor: theme.primaryColor + '20' }}
                >
                  <CardContent className="p-0">
                    {/* Product Image */}
                    <div className="aspect-square bg-muted overflow-hidden">
                      {product.images && product.images[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Store className="h-16 w-16 opacity-20" />
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="p-4">
                      <h3 className="font-semibold mb-1 line-clamp-1">
                        {product.name}
                      </h3>
                      <p className="text-sm opacity-75 mb-3 line-clamp-2">
                        {product.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span
                          className="text-xl font-bold"
                          style={{ color: theme.primaryColor }}
                        >
                          ₦{product.price.toLocaleString()}
                        </span>
                        <Button
                          size="sm"
                          style={{
                            backgroundColor: theme.primaryColor,
                            color: '#ffffff'
                          }}
                        >
                          <ShoppingCart className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Sidebar Ad */}
              <AdSlot
                vendorId={vendorId}
                placement="sidebar"
                storeCategory="general"
                storeRating={4.5}
                storeType="all"
              />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        className="border-t mt-16"
        style={{ borderColor: theme.primaryColor + '20' }}
      >
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Store Info */}
            <div>
              <h3 className="font-bold mb-3">{branding.storeName}</h3>
              <p className="text-sm opacity-75">
                {branding.description || "Welcome to our store!"}
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-bold mb-3">Quick Links</h3>
              <div className="space-y-2 text-sm">
                <Link href="/" className="block hover:underline">
                  Home
                </Link>
                <Link href="/about" className="block hover:underline">
                  About
                </Link>
                <Link href="/contact" className="block hover:underline">
                  Contact
                </Link>
              </div>
            </div>

            {/* Powered By */}
            <div>
              <h3 className="font-bold mb-3">Powered By</h3>
              <Link
                href="/"
                className="text-sm hover:underline"
                style={{ color: theme.primaryColor }}
              >
                MarketHub
              </Link>
              <p className="text-xs opacity-50 mt-2">
                © 2025 All rights reserved
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

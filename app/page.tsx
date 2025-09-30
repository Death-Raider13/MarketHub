"use client"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { ProductCard } from "@/components/product-card"
import { CategoryCard } from "@/components/category-card"
import { AdBanner } from "@/components/ad-banner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useCart } from "@/lib/cart-context"
import { ArrowRight, TrendingUp, Award, Shield, Truck } from "lucide-react"
import Link from "next/link"
import type { Product, Category, Advertisement } from "@/lib/types"

// Mock data - in production, fetch from Firebase
const mockCategories: Category[] = [
  { id: "1", name: "Electronics", slug: "electronics", icon: "smartphone", productCount: 1234 },
  { id: "2", name: "Fashion", slug: "fashion", icon: "shirt", productCount: 2456 },
  { id: "3", name: "Home & Garden", slug: "home", icon: "home", productCount: 987 },
  { id: "4", name: "Sports", slug: "sports", icon: "dumbbell", productCount: 654 },
  { id: "5", name: "Books", slug: "books", icon: "book", productCount: 432 },
  { id: "6", name: "Gaming", slug: "gaming", icon: "gamepad", productCount: 876 },
]

const mockProducts: Product[] = [
  {
    id: "1",
    vendorId: "v1",
    vendorName: "TechStore Pro",
    name: "Wireless Noise-Cancelling Headphones",
    description: "Premium audio experience with active noise cancellation",
    price: 199.99,
    comparePrice: 299.99,
    category: "electronics",
    images: ["/diverse-people-listening-headphones.png"],
    stock: 45,
    sku: "WH-1000",
    rating: 4.5,
    reviewCount: 128,
    featured: true,
    sponsored: false,
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    vendorId: "v2",
    vendorName: "Fashion Hub",
    name: "Premium Cotton T-Shirt",
    description: "Comfortable and stylish everyday wear",
    price: 29.99,
    category: "fashion",
    images: ["/plain-white-tshirt.png"],
    stock: 120,
    sku: "TS-2000",
    rating: 4.8,
    reviewCount: 89,
    featured: true,
    sponsored: true,
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "3",
    vendorId: "v3",
    vendorName: "Home Essentials",
    name: "Smart LED Desk Lamp",
    description: "Adjustable brightness with USB charging port",
    price: 49.99,
    comparePrice: 79.99,
    category: "home",
    images: ["/modern-desk-lamp.png"],
    stock: 67,
    sku: "DL-3000",
    rating: 4.3,
    reviewCount: 45,
    featured: true,
    sponsored: false,
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "4",
    vendorId: "v4",
    vendorName: "FitGear",
    name: "Yoga Mat with Carrying Strap",
    description: "Non-slip, eco-friendly exercise mat",
    price: 34.99,
    category: "sports",
    images: ["/rolled-yoga-mat.png"],
    stock: 89,
    sku: "YM-4000",
    rating: 4.6,
    reviewCount: 156,
    featured: true,
    sponsored: false,
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

const mockAd: Advertisement = {
  id: "ad1",
  vendorId: "v1",
  type: "banner",
  title: "Summer Sale - Up to 50% Off",
  imageUrl: "/summer-sale-banner.png",
  linkUrl: "/products?sale=true",
  placement: "homepage-top",
  impressions: 12450,
  clicks: 234,
  budget: 500,
  spent: 123.45,
  status: "active",
  startDate: new Date(),
  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
}

export default function HomePage() {
  const { addToCart } = useCart()

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="border-b border-border bg-gradient-to-br from-primary/5 via-background to-background">
          <div className="container mx-auto px-4 py-16 md:py-24">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-4xl font-bold tracking-tight md:text-6xl text-balance">
                Discover Amazing Products from Trusted Vendors
              </h1>
              <p className="mt-6 text-lg text-muted-foreground text-pretty">
                Shop from thousands of verified sellers offering quality products at competitive prices. Your one-stop
                marketplace for everything you need.
              </p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
                <Button size="lg" asChild>
                  <Link href="/products">
                    Start Shopping
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/auth/vendor-register">Become a Vendor</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Advertisement Banner */}
        <section className="container mx-auto px-4 py-8">
          <AdBanner ad={mockAd} />
        </section>

        {/* Features */}
        <section className="border-b border-border bg-muted/30 py-12">
          <div className="container mx-auto px-4">
            <div className="grid gap-8 md:grid-cols-4">
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 rounded-full bg-primary/10 p-4">
                  <Truck className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">Free Shipping</h3>
                <p className="text-sm text-muted-foreground">On orders over $50</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 rounded-full bg-primary/10 p-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">Secure Payment</h3>
                <p className="text-sm text-muted-foreground">100% protected</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 rounded-full bg-primary/10 p-4">
                  <Award className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">Verified Vendors</h3>
                <p className="text-sm text-muted-foreground">Trusted sellers only</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 rounded-full bg-primary/10 p-4">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">Best Prices</h3>
                <p className="text-sm text-muted-foreground">Competitive rates</p>
              </div>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="container mx-auto px-4 py-16">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-3xl font-bold">Shop by Category</h2>
            <Button variant="ghost" asChild>
              <Link href="/categories">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {mockCategories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        </section>

        {/* Featured Products */}
        <section className="border-t border-border bg-muted/30 py-16">
          <div className="container mx-auto px-4">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-3xl font-bold">Featured Products</h2>
              <Button variant="ghost" asChild>
                <Link href="/products">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {mockProducts.map((product) => (
                <ProductCard key={product.id} product={product} onAddToCart={addToCart} />
              ))}
            </div>
          </div>
        </section>

        {/* Newsletter */}
        <section className="border-t border-border py-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold">Stay Updated</h2>
              <p className="mt-4 text-muted-foreground">
                Subscribe to our newsletter for exclusive deals and new product announcements
              </p>
              <form className="mt-8 flex gap-2">
                <Input type="email" placeholder="Enter your email" className="flex-1" />
                <Button type="submit">Subscribe</Button>
              </form>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

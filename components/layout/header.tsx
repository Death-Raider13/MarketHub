"use client"

import type React from "react"

import Link from "next/link"
import { Search, ShoppingCart, User, Menu, Store, LayoutDashboard, X, Heart, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useAuth } from "@/lib/firebase/auth-context"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"
import { useCart } from "@/lib/cart-context"
import { useRouter } from "next/navigation"

export function Header() {
  const { user, userProfile, logout } = useAuth()
  const { totalItems } = useCart()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Top Banner - Optional promotional banner */}
      <div className="border-b border-border bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-2 text-center text-sm">
          <p>Free shipping on orders over ₦50,000 | 7-day returns | Pay on Delivery Available</p>
        </div>
      </div>

      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2" aria-label="MarketHub Home">
            <Store className="h-6 w-6" aria-hidden="true" />
            <span className="text-xl font-bold">MarketHub</span>
          </Link>

          {/* Search Bar - Desktop */}
          <form onSubmit={handleSearch} className="hidden flex-1 max-w-2xl md:flex" role="search">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                type="search"
                placeholder="Search products, vendors..."
                className="w-full pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search products and vendors"
              />
            </div>
          </form>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Vendor Mode Switch - Show on homepage for vendors */}
            {user && userProfile?.role === "vendor" && (
              <Button 
                variant="outline" 
                size="sm" 
                asChild 
                className="hidden md:flex bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 border-purple-200"
              >
                <Link href="/vendor/dashboard">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Switch to Selling
                </Link>
              </Button>
            )}
            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <button 
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 w-10 md:hidden"
                  aria-label="Open menu"
                >
                  <Menu className="h-5 w-5" aria-hidden="true" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <nav className="mt-6 flex flex-col gap-4" aria-label="Mobile navigation">
                  <Link 
                    href="/products" 
                    className="flex items-center gap-3 text-lg font-medium hover:text-primary"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Package className="h-5 w-5" />
                    All Products
                  </Link>
                  <Link 
                    href="/categories" 
                    className="flex items-center gap-3 text-lg font-medium hover:text-primary"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Store className="h-5 w-5" />
                    Categories
                  </Link>
                  {user && (
                    <>
                      <Link 
                        href="/account" 
                        className="flex items-center gap-3 text-lg font-medium hover:text-primary"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <User className="h-5 w-5" />
                        My Account
                      </Link>
                      <Link 
                        href="/account" 
                        className="flex items-center gap-3 text-lg font-medium hover:text-primary"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Heart className="h-5 w-5" />
                        Wishlist
                      </Link>
                    </>
                  )}
                  <Link 
                    href="/help" 
                    className="flex items-center gap-3 text-lg font-medium hover:text-primary"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Help Center
                  </Link>
                  {!user && (
                    <div className="mt-4 flex flex-col gap-2">
                      <Button asChild onClick={() => setMobileMenuOpen(false)}>
                        <Link href="/auth/login">Login</Link>
                      </Button>
                      <Button variant="outline" asChild onClick={() => setMobileMenuOpen(false)}>
                        <Link href="/auth/signup">Sign Up</Link>
                      </Button>
                    </div>
                  )}
                </nav>
              </SheetContent>
            </Sheet>

            {/* Cart */}
            <Link href="/cart" aria-label={`Shopping cart with ${totalItems} items`}>
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" aria-hidden="true" />
                {totalItems > 0 && (
                  <Badge 
                    className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs"
                    aria-label={`${totalItems} items in cart`}
                  >
                    {totalItems}
                  </Badge>
                )}
              </Button>
            </Link>

            {/* User Menu */}
            {user ? (
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <button
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 w-10"
                    aria-label="User menu"
                    onClick={(e) => {
                      console.log("User button clicked")
                    }}
                  >
                    <User className="h-5 w-5" aria-hidden="true" />
                    <span className="sr-only">Open user menu</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end" 
                  className="w-56 z-[9999]"
                  sideOffset={5}
                >
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{userProfile?.displayName || "User"}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                    <Badge variant="secondary" className="mt-1 text-xs">
                      {userProfile?.role}
                    </Badge>
                  </div>
                  <DropdownMenuSeparator />

                  {userProfile?.role === "customer" && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/account">My Account</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/account">My Orders</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/account">Wishlist</Link>
                      </DropdownMenuItem>
                    </>
                  )}

                  {userProfile?.role === "vendor" && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/vendor/dashboard">
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          Vendor Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/vendor/products">My Products</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/vendor/orders">Orders</Link>
                      </DropdownMenuItem>
                    </>
                  )}

                  {userProfile?.role === "admin" && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/dashboard">
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          Admin Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/vendors">Manage Vendors</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/products">Moderate Products</Link>
                      </DropdownMenuItem>
                    </>
                  )}

                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={async () => {
                      try {
                        await logout()
                        router.push("/auth/login")
                      } catch (error) {
                        console.error("Logout error:", error)
                      }
                    }} 
                    className="text-destructive cursor-pointer"
                  >
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden gap-2 md:flex">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/auth/login">Login</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/auth/signup">Sign Up</Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Search */}
        <form onSubmit={handleSearch} className="pb-4 md:hidden" role="search">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              type="search"
              placeholder="Search products..."
              className="w-full pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search products"
            />
          </div>
        </form>
      </div>
    </header>
  )
}

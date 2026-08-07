"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  Search,
  ShoppingCart,
  User,
  Menu,
  X,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Package,
  MessageSquare,
  HelpCircle,
  Store,
  Bell
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth, type UserRole } from "@/lib/firebase/auth-context"
import { useCart } from "@/lib/cart-context"
import { useMessages } from "@/hooks/use-messages"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
import { NotificationBell } from "@/components/notifications/notification-bell"
import { ModeToggle } from "@/components/mode-toggle"
import { RoleSwitcher } from "@/components/navigation/RoleSwitcher"

export function Header() {
  const router = useRouter()
  const { user, userProfile, logout } = useAuth()
  const { totalItems } = useCart()
  const { unreadCount } = useMessages()
  const [query, setQuery] = useState("")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`)
      setIsMobileMenuOpen(false)
    }
  }

  const isAdminRole = ['admin', 'super_admin', 'moderator', 'support'].includes(userProfile?.role || '')

  return (
    <nav className={`sticky top-0 z-50 w-full transition-all duration-300 ${scrolled ? "border-b border-white/10 glass shadow-2xl" : "bg-transparent border-b border-transparent"
      }`}>
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 relative z-50 shrink-0">
          <div className="relative h-8 w-8 rounded-lg overflow-hidden">
            <Image src="/logo.png" alt="FeroLibrary Logo" fill className="object-contain" />
          </div>
          <span className="text-xl font-bold tracking-tight hidden sm:inline-block">
            Fero<span className="text-primary text-gradient">E-Library</span>
          </span>
        </Link>

        {/* Search Bar - Desktop */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md lg:max-w-xl mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search books, topic summaries, live classes..."
              className="w-full bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/50"
            />
          </div>
        </form>

        {/* Right Actions */}
        <div className="flex items-center gap-2 lg:gap-4 relative z-50 shrink-0">
          {user && <RoleSwitcher />}
          <ModeToggle />
          {/* Cart */}
          <Link href="/cart" className="relative p-2 hover:bg-white/5 rounded-full transition-colors cursor-pointer group">
            <ShoppingCart className="h-5 w-5 text-foreground/80 group-hover:text-primary transition-colors" />
            {totalItems > 0 && (
              <Badge className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-primary text-[10px] flex items-center justify-center rounded-full text-white border-0 p-0 font-bold">
                {totalItems}
              </Badge>
            )}
          </Link>

          {/* User Section */}
          {user ? (
            <>
              <div className="hidden sm:block">
                <NotificationBell />
              </div>

              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full bg-white/5 border border-white/10">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 glass-card border-white/10 z-[9999] p-2 mt-2">
                  <div className="px-3 py-3 mb-2">
                    <p className="text-sm font-bold truncate">{userProfile?.displayName || "Member"}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    <Badge variant="secondary" className="mt-2 text-[10px] uppercase tracking-wider bg-primary/20 text-primary border-primary/20">
                      {userProfile?.role || 'user'}
                    </Badge>
                  </div>
                  <DropdownMenuSeparator className="bg-white/5" />

                  {userProfile?.role === "creator" ? (
                    <>
                      <DropdownMenuItem asChild className="focus:bg-primary/10 cursor-pointer rounded-lg mb-1">
                        <Link href="/creator/dashboard" className="flex items-center w-full py-2">
                          <LayoutDashboard className="mr-3 h-4 w-4 text-primary" />
                          Educator Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="focus:bg-primary/10 cursor-pointer rounded-lg mb-1">
                        <Link href="/creator/products" className="flex items-center w-full py-2">
                          <Package className="mr-3 h-4 w-4" />
                          My Resources
                        </Link>
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      <DropdownMenuItem asChild className="focus:bg-primary/10 cursor-pointer rounded-lg mb-1">
                        <Link href="/my-purchases" className="flex items-center w-full py-2">
                          <Package className="mr-3 h-4 w-4" />
                          My Library
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="focus:bg-primary/10 cursor-pointer rounded-lg mb-1">
                        <Link href="/messages" className="flex items-center w-full py-2">
                          <MessageSquare className="mr-3 h-4 w-4" />
                          Messages
                          {unreadCount > 0 && <Badge className="ml-auto bg-destructive">{unreadCount}</Badge>}
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}

                  {isAdminRole && (
                    <DropdownMenuItem asChild className="focus:bg-primary/10 cursor-pointer rounded-lg mb-1 border border-primary/20 bg-primary/5">
                      <Link href="/admin/dashboard" className="flex items-center w-full py-2">
                        <LayoutDashboard className="mr-3 h-4 w-4 text-primary" />
                        Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuItem asChild className="focus:bg-primary/10 cursor-pointer rounded-lg mb-1">
                    <Link href="/account" className="flex items-center w-full py-2">
                      <User className="mr-3 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="bg-white/5" />
                  <DropdownMenuItem
                    onClick={async () => {
                      await logout()
                      router.push("/auth/login")
                    }}
                    className="focus:bg-destructive/10 text-destructive cursor-pointer rounded-lg"
                  >
                    <LogOut className="mr-3 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Link href="/auth/login" className="flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary px-4 lg:px-6 py-2 rounded-full text-sm font-bold hover:bg-primary/20 transition-all active:scale-95">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Sign In</span>
            </Link>
          )}

          {/* Mobile Menu Trigger */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <button
                className="md:hidden p-2 hover:bg-white/10 rounded-full transition-colors"
                aria-label="Open menu"
              >
                <Menu className="h-6 w-6 text-foreground/80" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] glass-card border-white/10 p-6 z-[10000]">
              <SheetHeader className="mb-8">
                <SheetTitle className="text-left flex items-center gap-2">
                  <div className="relative h-6 w-6">
                    <Image src="/logo.png" alt="Logo" fill className="object-contain" />
                  </div>
                  Fero<span className="text-primary">Library</span>
                </SheetTitle>
              </SheetHeader>

              <div className="space-y-6">
                <form onSubmit={handleSearch} className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search resources..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm"
                  />
                </form>

                <div className="flex items-center justify-between p-2 glass rounded-xl border border-white/10">
                  <span className="text-sm font-medium ml-2">Theme Preference</span>
                  <ModeToggle />
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {!user ? (
                    <Button asChild className="w-full bg-primary font-bold rounded-xl h-12" onClick={() => setIsMobileMenuOpen(false)}>
                      <Link href="/auth/login">Sign In / Register</Link>
                    </Button>
                  ) : (
                    <Button asChild variant="outline" className="w-full border-white/10 bg-white/5 rounded-xl h-12" onClick={() => setIsMobileMenuOpen(false)}>
                      <Link href="/account">My Profile</Link>
                    </Button>
                  )}

                  <nav className="space-y-2 pt-4">
                    <Link href="/search" className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl transition-colors font-medium" onClick={() => setIsMobileMenuOpen(false)}>
                      <GraduationCap className="h-5 w-5 text-primary" />
                      Browse Library Books
                    </Link>
                    <Link href="/classes" className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl transition-colors font-medium" onClick={() => setIsMobileMenuOpen(false)}>
                      <Store className="h-5 w-5 text-primary" />
                      Online Live Classes
                    </Link>
                    {userProfile?.role === 'creator' && (
                      <Link href="/creator/dashboard" className="flex items-center gap-3 p-3 bg-primary/10 border border-primary/20 rounded-xl transition-colors font-bold text-primary" onClick={() => setIsMobileMenuOpen(false)}>
                        <LayoutDashboard className="h-5 w-5" />
                        Educator Hub
                      </Link>
                    )}
                  </nav>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  )
}

import Link from "next/link"
import { Store, Facebook, Twitter, Instagram, Youtube } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Store className="h-6 w-6" />
              <span className="text-xl font-bold">MarketHub</span>
            </Link>
            <p className="text-sm text-muted-foreground mb-4">
              Your trusted multi-vendor marketplace for quality products from verified sellers.
            </p>
            <div className="flex gap-3">
              <Link href="#" className="text-muted-foreground hover:text-foreground">
                <Facebook className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground">
                <Twitter className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground">
                <Instagram className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground">
                <Youtube className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h3 className="font-semibold mb-4">Shop</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/products?category=electronics" className="hover:text-foreground">
                  Electronics
                </Link>
              </li>
              <li>
                <Link href="/products?category=fashion" className="hover:text-foreground">
                  Fashion
                </Link>
              </li>
              <li>
                <Link href="/products?category=home" className="hover:text-foreground">
                  Home & Garden
                </Link>
              </li>
              <li>
                <Link href="/products?category=sports" className="hover:text-foreground">
                  Sports
                </Link>
              </li>
              <li>
                <Link href="/vendors" className="hover:text-foreground">
                  All Vendors
                </Link>
              </li>
            </ul>
          </div>

          {/* Sell */}
          <div>
            <h3 className="font-semibold mb-4">Sell</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/vendor/register" className="hover:text-foreground">
                  Become a Vendor
                </Link>
              </li>
              <li>
                <Link href="/vendor/dashboard" className="hover:text-foreground">
                  Vendor Dashboard
                </Link>
              </li>
              <li>
                <Link href="/advertising" className="hover:text-foreground">
                  Advertise
                </Link>
              </li>
              <li>
                <Link href="/help/seller" className="hover:text-foreground">
                  Seller Help
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/help" className="hover:text-foreground">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-foreground">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-foreground">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-foreground">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/returns" className="hover:text-foreground">
                  Returns & Refunds
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} MarketHub. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

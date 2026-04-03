import Link from "next/link"
import Image from "next/image"
import { Store, Facebook, Twitter, Instagram, Youtube } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <span className="text-xl font-bold tracking-tight">Fero<span className="text-primary">Library</span></span>
            </Link>
            <p className="text-sm text-muted-foreground mb-4">
              The Trust-First Academic Marketplace. Verified past questions, handouts, and study guides.
            </p>
            <div className="flex gap-3">
              <Link href="#" className="text-muted-foreground hover:text-foreground">
                <Facebook className="h-5 w-5" />
              </Link>
              <Link href="https://tiktok.com/@market.hub76" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M16.5 3c.4 3.4 2.4 5.5 5.5 5.7V12c-1.7 0-3.3-.5-4.7-1.5V16c0 3.6-2.9 6.5-6.5 6.5S4.3 19.6 4.3 16.1c0-3.6 2.9-6.5 6.5-6.5.3 0 .7 0 1 .1v3.6c-.3-.2-.6-.2-1-.2-1.6 0-2.9 1.3-2.9 2.9 0 1.6 1.3 2.9 2.9 2.9 1.6 0 3-1.1 3-3.3V3h2.7Z" />
                </svg>
              </Link>
              <Link href="https://www.instagram.com/fero_mark_ethub25?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                <Instagram className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground">
                <Youtube className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h3 className="font-semibold mb-4">Explore</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/products?category=university" className="hover:text-foreground">
                  University Resources
                </Link>
              </li>
              <li>
                <Link href="/products?category=secondary" className="hover:text-foreground">
                  JAMB / WAEC
                </Link>
              </li>
              <li>
                <Link href="/products?category=professional" className="hover:text-foreground">
                  Professional Exams
                </Link>
              </li>
              <li>
                <Link href="/creators" className="hover:text-foreground">
                  Verified Educators
                </Link>
              </li>
            </ul>
          </div>

          {/* Creator Hub */}
          <div>
            <h3 className="font-semibold mb-4">Educator Hub</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/auth/creator-register-new" className="hover:text-foreground">
                  Become an Educator
                </Link>
              </li>
              <li>
                <Link href="/creator/dashboard" className="hover:text-foreground">
                  Educator Dashboard
                </Link>
              </li>
              <li>
                <Link href="/advertise" className="hover:text-foreground">
                  Advertise
                </Link>
              </li>
              <li>
                <Link href="/help/creator" className="hover:text-foreground">
                  Educator Help
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

        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-col items-center justify-center gap-3 text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} FeroLibrary. All rights reserved.</p>
            <div className="flex items-center gap-2">
              <span>Powered by</span>
              <Link
                href="https://cloudsparkdigital.netlify.app"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-primary hover:underline inline-flex items-center gap-1"
              >
                CloudSparkDigital
                <svg
                  className="h-3 w-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

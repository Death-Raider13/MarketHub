import Link from "next/link"
import Image from "next/image"
import { Facebook, Instagram, Youtube, Send, Store, GraduationCap, ShieldCheck, HelpCircle } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border bg-background pt-12 sm:pt-20 pb-8 sm:pb-10 text-foreground">
      <div className="container mx-auto px-4">
        <div className="grid gap-8 sm:gap-12 md:px-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand & Mission */}
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-2 mb-4 group">
              <div className="relative h-8 w-8 rounded-lg overflow-hidden group-hover:scale-110 transition-transform bg-muted/50">
                <Image src="/logo.png" alt="Logo" fill className="object-contain" />
              </div>
              <span className="text-xl font-bold tracking-tight text-foreground">Fero<span className="text-primary text-gradient">E-Library</span></span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Specialized digital e-library marketplace. Empowering students, course creators, and affiliates with verified topic summaries and live online webinars.
            </p>
            <div className="flex gap-4">
              <Link href="#" className="p-2 bg-muted/50 border border-border rounded-lg hover:bg-primary/10 hover:border-primary/20 transition-all text-muted-foreground hover:text-primary">
                <Facebook className="h-5 w-5" />
              </Link>
              <Link href="https://www.instagram.com/fero_mark_ethub25" target="_blank" className="p-2 bg-muted/50 border border-border rounded-lg hover:bg-primary/10 hover:border-primary/20 transition-all text-muted-foreground hover:text-primary">
                <Instagram className="h-5 w-5" />
              </Link>
              <Link href="#" className="p-2 bg-muted/50 border border-border rounded-lg hover:bg-primary/10 hover:border-primary/20 transition-all text-muted-foreground hover:text-primary">
                <Send className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Library Section */}
          <div className="space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-primary/80">The Library</h3>
            <ul className="space-y-4 text-sm font-medium">
              <li>
                <Link href="/search?q=Mathematics" className="text-muted-foreground hover:text-foreground hover:translate-x-1 transition-all flex items-center gap-2">
                  <div className="h-1 w-1 bg-primary rounded-full" />
                  Mathematics & Sciences
                </Link>
              </li>
              <li>
                <Link href="/search?q=Special+Needs" className="text-muted-foreground hover:text-foreground hover:translate-x-1 transition-all flex items-center gap-2">
                  <div className="h-1 w-1 bg-primary rounded-full" />
                  Special Needs Summaries
                </Link>
              </li>
              <li>
                <Link href="/classes" className="text-muted-foreground hover:text-foreground hover:translate-x-1 transition-all flex items-center gap-2">
                  <div className="h-1 w-1 bg-primary rounded-full" />
                  Online Live Classes
                </Link>
              </li>
              <li>
                <Link href="/search" className="text-muted-foreground hover:text-foreground hover:translate-x-1 transition-all flex items-center gap-2">
                  <div className="h-1 w-1 bg-primary rounded-full" />
                  All Books & Courses
                </Link>
              </li>
            </ul>
          </div>

          {/* Portals Section */}
          <div className="space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-primary/80">Join Portals</h3>
            <ul className="space-y-4 text-sm font-medium">
              <li>
                <Link href="/auth/signup?role=creator" className="text-muted-foreground hover:text-foreground hover:translate-x-1 transition-all flex items-center gap-2">
                  <div className="h-1 w-1 bg-primary rounded-full" />
                  Become a Creator / Seller
                </Link>
              </li>
              <li>
                <Link href="/auth/signup?role=promoter" className="text-muted-foreground hover:text-foreground hover:translate-x-1 transition-all flex items-center gap-2">
                  <div className="h-1 w-1 bg-primary rounded-full" />
                  Become an Affiliate
                </Link>
              </li>
              <li>
                <Link href="/auth/signup" className="text-muted-foreground hover:text-foreground hover:translate-x-1 transition-all flex items-center gap-2">
                  <div className="h-1 w-1 bg-primary rounded-full" />
                  Student Registration
                </Link>
              </li>
            </ul>
          </div>

          {/* Trust Section */}
          <div className="space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-primary/80">Support</h3>
            <ul className="space-y-4 text-sm font-medium">
              <li>
                <Link href="/help" className="text-muted-foreground hover:text-foreground hover:translate-x-1 transition-all flex items-center gap-2">
                  <div className="h-1 w-1 bg-primary rounded-full" />
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-foreground hover:translate-x-1 transition-all flex items-center gap-2">
                  <div className="h-1 w-1 bg-primary rounded-full" />
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-foreground hover:translate-x-1 transition-all flex items-center gap-2">
                  <div className="h-1 w-1 bg-primary rounded-full" />
                  Privacy Policy
                </Link>
              </li>
            </ul>
            <div className="p-4 bg-primary/10 border border-primary/20 rounded-2xl flex items-center gap-3">
              <ShieldCheck className="h-6 w-6 text-primary shrink-0" />
              <div className="text-[10px] leading-tight font-medium text-muted-foreground">
                All purchases on Fero E-Library are protected by our automated customer refund guarantee.
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 sm:mt-20 pt-8 sm:pt-10 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6 px-2 sm:px-6 text-center md:text-left">
          <div className="flex flex-col items-center md:items-start gap-1">
            <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} Fero E-Library. All rights reserved.</p>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60">
              <span>Architected by</span>
              <Link href="https://cloudsparkdigital.netlify.app" target="_blank" className="text-primary hover:underline font-bold">CloudSparkDigital</Link>
            </div>
          </div>
          
          <div className="flex items-center gap-4 sm:gap-6">
            <Link href="/terms" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Terms</Link>
            <Link href="/privacy" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/help" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Support</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

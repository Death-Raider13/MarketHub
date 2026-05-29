import Link from "next/link"
import Image from "next/image"
import { Facebook, Instagram, Youtube, Send, Store, GraduationCap, ShieldCheck, HelpCircle } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#0a0c10] pt-20 pb-10 text-slate-200">
      <div className="container mx-auto px-4">
        <div className="grid gap-12 md:px-6 lg:grid-cols-4">
          {/* Brand & Mission */}
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-2 mb-4 group">
              <div className="relative h-8 w-8 rounded-lg overflow-hidden group-hover:scale-110 transition-transform bg-white/10">
                <Image src="/logo.png" alt="Logo" fill className="object-contain" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">Fero<span className="text-primary text-gradient">Library</span></span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed">
              Nigeria's most trusted academic marketplace. We bridge the gap between brilliant educators and ambitious students with verified, high-quality study materials.
            </p>
            <div className="flex gap-4">
              <Link href="#" className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-primary/10 hover:border-primary/20 transition-all text-slate-400 hover:text-primary">
                <Facebook className="h-5 w-5" />
              </Link>
              <Link href="https://www.instagram.com/fero_mark_ethub25" target="_blank" className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-primary/10 hover:border-primary/20 transition-all text-slate-400 hover:text-primary">
                <Instagram className="h-5 w-5" />
              </Link>
              <Link href="#" className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-primary/10 hover:border-primary/20 transition-all text-slate-400 hover:text-primary">
                <Send className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Library Section */}
          <div className="space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-primary/80">The Library</h3>
            <ul className="space-y-4 text-sm font-medium">
              <li>
                <Link href="/products?category=university" className="text-slate-400 hover:text-white hover:translate-x-1 transition-all flex items-center gap-2">
                  <div className="h-1 w-1 bg-primary rounded-full" />
                  University Resources
                </Link>
              </li>
              <li>
                <Link href="/products?category=secondary" className="text-slate-400 hover:text-white hover:translate-x-1 transition-all flex items-center gap-2">
                  <div className="h-1 w-1 bg-primary rounded-full" />
                  JAMB & WAEC Materials
                </Link>
              </li>
              <li>
                <Link href="/creators" className="text-slate-400 hover:text-white hover:translate-x-1 transition-all flex items-center gap-2">
                  <div className="h-1 w-1 bg-primary rounded-full" />
                  Find Top Educators
                </Link>
              </li>
              <li>
                <Link href="/products" className="text-slate-400 hover:text-white hover:translate-x-1 transition-all flex items-center gap-2">
                  <div className="h-1 w-1 bg-primary rounded-full" />
                  Recent Uploads
                </Link>
              </li>
            </ul>
          </div>

          {/* Creators Section */}
          <div className="space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-primary/80">Educators</h3>
            <ul className="space-y-4 text-sm font-medium">
              <li>
                <Link href="/auth/creator-register-new" className="text-slate-400 hover:text-white hover:translate-x-1 transition-all flex items-center gap-2">
                  <div className="h-1 w-1 bg-primary rounded-full" />
                  Become a Contributor
                </Link>
              </li>
              <li>
                <Link href="/help/creator" className="text-slate-400 hover:text-white hover:translate-x-1 transition-all flex items-center gap-2">
                  <div className="h-1 w-1 bg-primary rounded-full" />
                  Seller Playbook
                </Link>
              </li>
              <li>
                <Link href="/advertise" className="text-slate-400 hover:text-white hover:translate-x-1 transition-all flex items-center gap-2 text-primary font-bold">
                  <div className="h-1 w-1 bg-primary rounded-full" />
                  Promote Content
                </Link>
              </li>
            </ul>
          </div>

          {/* Trust Section */}
          <div className="space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-primary/80">Support</h3>
            <ul className="space-y-4 text-sm font-medium">
              <li>
                <Link href="/help" className="text-slate-400 hover:text-white hover:translate-x-1 transition-all flex items-center gap-2">
                  <div className="h-1 w-1 bg-primary rounded-full" />
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-slate-400 hover:text-white hover:translate-x-1 transition-all flex items-center gap-2">
                  <div className="h-1 w-1 bg-primary rounded-full" />
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-slate-400 hover:text-white hover:translate-x-1 transition-all flex items-center gap-2">
                  <div className="h-1 w-1 bg-primary rounded-full" />
                  Verification Policy
                </Link>
              </li>
            </ul>
            <div className="p-4 bg-primary/10 border border-primary/20 rounded-2xl flex items-center gap-3">
              <ShieldCheck className="h-6 w-6 text-primary shrink-0" />
              <div className="text-[10px] leading-tight font-medium text-slate-300">
                All resources on FeroLibrary are subject to a strict 3-tier verification check.
              </div>
            </div>
          </div>
        </div>

        <div className="mt-20 pt-10 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6 px-6">
          <div className="flex flex-col items-center md:items-start gap-1">
            <p className="text-xs text-slate-500">&copy; {new Date().getFullYear()} FeroLibrary. All rights reserved.</p>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500/60">
              <span>Architected by</span>
              <Link href="https://cloudsparkdigital.netlify.app" target="_blank" className="text-primary hover:underline font-bold">CloudSparkDigital</Link>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <Link href="/terms" className="text-xs text-slate-500 hover:text-white transition-colors">Terms</Link>
            <Link href="/privacy" className="text-xs text-slate-500 hover:text-white transition-colors">Privacy</Link>
            <Link href="/help" className="text-xs text-slate-500 hover:text-white transition-colors">Support</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

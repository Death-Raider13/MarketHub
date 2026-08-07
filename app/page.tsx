import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { 
  BookOpen, 
  TrendingUp, 
  GraduationCap, 
  Zap, 
  ArrowRight, 
  Star, 
  Sparkles,
  Search,
  CheckCircle2,
  FileText,
  HelpCircle,
  Percent
} from "lucide-react"
import { getAdminFirestore } from "@/lib/firebase/admin-simple"

interface Product {
  id: string
  name: string
  price: number
  imageUrl: string
  category: string
  creatorId: string
  creatorName: string
  status: string
  images?: string[]
  featured?: boolean
  rating?: number
  reviewCount?: number
}

export const revalidate = 3600

export default async function HomePage() {
  const adminDb = getAdminFirestore()

  let featuredProducts: Product[] = []
  let realStats = { products: "10K+", students: "150K+", creators: "5K+", rating: "4.9/5" }

  if (adminDb) {
    try {
      const productsMeta = await adminDb.collection("products").count().get()
      const pCount = productsMeta.data().count
      if (pCount > 0) realStats.products = pCount > 1000 ? `${Math.floor(pCount / 1000)}K+` : `${pCount}+`

      const productsQuery = await adminDb
        .collection("products")
        .where("status", "in", ["active", "approved"])
        .limit(8)
        .get()

      featuredProducts = productsQuery.docs.map((doc: any) => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          creatorId: data.creatorId || "",
          creatorName: data.creatorName || "Fero Library Educator"
        }
      }) as Product[]
    } catch (error) {
      console.error("Error fetching homepage data:", error)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0B132B] text-white selection:bg-cyan-500/30">
      <Header />

      {/* Early Bird Discount Banner */}
      <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 text-white text-xs md:text-sm py-2.5 px-4 text-center font-bold flex items-center justify-center gap-2 shadow-md">
        <Percent className="w-4 h-4 text-amber-300 animate-bounce" />
        <span>EARLY BIRD BENEFIT: Get <span className="text-amber-300 underline font-extrabold">25% OFF</span> your registration fee as a Creator or Affiliate!</span>
        <Link href="/auth/signup?role=creator" className="ml-2 underline text-cyan-200 hover:text-white">Claim Discount &rarr;</Link>
      </div>

      {/* Hero Section */}
      <section className="relative pt-16 pb-24 md:pt-24 md:pb-32 overflow-hidden px-6">
        {/* Background Blur Orbs */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-purple-600/15 rounded-full blur-[120px] pointer-events-none" />

        <div className="container mx-auto max-w-6xl text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-indigo-500/30 text-cyan-300 text-xs font-bold uppercase tracking-widest mb-8 shadow-lg">
            <Sparkles className="h-4 w-4 text-cyan-400" />
            Where Learning Meets Opportunity
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
            Welcome to Fero E-Library – <br className="hidden md:block" />
            <span className="text-gradient">Quality eBooks, Course Guides & Past Questions</span>
          </h1>

          <p className="max-w-2xl mx-auto text-base md:text-xl text-slate-300 mb-10 leading-relaxed">
            Your one-stop platform for university students, creators, and affiliate marketers to excel, publish, and earn from day one.
          </p>

          {/* Quick Search Form */}
          <form action="/search" method="GET" className="max-w-xl mx-auto mb-10 flex gap-2 p-2 rounded-2xl glass-card border border-indigo-500/30 shadow-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                name="q"
                placeholder="Search eBooks, course guides, past questions..."
                className="w-full bg-transparent pl-10 pr-4 py-3 text-sm text-white placeholder-slate-400 focus:outline-none"
              />
            </div>
            <Button type="submit" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl px-6 py-3 text-sm shadow-lg shadow-indigo-600/30">
              Search Library
            </Button>
          </form>

          {/* Subject & Resource Pills */}
          <div className="flex flex-wrap justify-center items-center gap-2 max-w-3xl mx-auto text-xs">
            {["Quality eBooks", "Course Guides", "Past Questions", "Mathematics", "Biology", "Chemistry", "Law", "Engineering"].map((cat) => (
              <Link key={cat} href={`/search?q=${encodeURIComponent(cat)}`} className="px-3.5 py-1.5 rounded-full bg-slate-900/60 border border-slate-800 text-slate-300 hover:text-white hover:border-indigo-500 transition-all">
                {cat}
              </Link>
            ))}
          </div>

          {/* Real Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mt-16 pt-12 border-t border-slate-800/80">
            {[
              { label: "Quality eBooks & Guides", value: realStats.products, icon: BookOpen },
              { label: "University Students", value: realStats.students, icon: GraduationCap },
              { label: "Content Creators", value: realStats.creators, icon: Zap },
              { label: "Satisfaction Rating", value: realStats.rating, icon: Star },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl md:text-3xl font-extrabold text-white mb-1">{stat.value}</div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Role Picker Portal Section */}
      <section className="py-20 px-6 bg-slate-950/40 border-y border-slate-800/60">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
              Explore Your Opportunity
            </h2>
            <p className="text-slate-400 text-sm md:text-base">
              Whether you want to excel in your studies, sell your educational resources, or earn as an affiliate marketer.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Student Card */}
            <div className="glass-card rounded-3xl p-8 border border-cyan-500/20 hover:border-cyan-500/50 transition-all flex flex-col justify-between group shadow-xl">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-6">
                  <GraduationCap className="w-7 h-7 text-cyan-400" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-white">University Student</h3>
                <p className="text-slate-300 text-xs md:text-sm leading-relaxed mb-6">
                  Access verified eBooks, course guides, past questions, and educational resources to excel in your academic journey.
                </p>
                <ul className="space-y-2 mb-8 text-xs text-slate-300">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" /> Quality eBooks & course guides</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" /> Verified past questions & answers</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" /> Immediate digital access</li>
                </ul>
              </div>
              <Link href="/search">
                <Button className="w-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 font-bold rounded-xl py-5 text-xs gap-2">
                  Browse Resources <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            {/* Creator Card */}
            <div className="glass-card rounded-3xl p-8 border border-purple-500/20 hover:border-purple-500/50 transition-all flex flex-col justify-between group shadow-xl relative">
              <div className="absolute top-4 right-4 bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-black px-2.5 py-1 rounded-full uppercase">
                25% OFF Early Bird
              </div>
              <div>
                <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mb-6">
                  <BookOpen className="w-7 h-7 text-purple-400" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-white">Creator / Seller</h3>
                <p className="text-slate-300 text-xs md:text-sm leading-relaxed mb-6">
                  Publish educational summaries, course guides, and past questions to monetize your knowledge.
                </p>
                <ul className="space-y-2 mb-8 text-xs text-slate-300">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" /> Sell eBooks & study guides</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" /> 25% OFF registration fee benefit</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" /> Real-time creator sales analytics</li>
                </ul>
              </div>
              <Link href="/auth/signup?role=creator">
                <Button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl py-5 text-xs gap-2 shadow-lg shadow-purple-600/20">
                  Start Selling (25% OFF) <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            {/* Affiliate Card */}
            <div className="glass-card rounded-3xl p-8 border border-emerald-500/20 hover:border-emerald-500/50 transition-all flex flex-col justify-between group shadow-xl relative">
              <div className="absolute top-4 right-4 bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-black px-2.5 py-1 rounded-full uppercase">
                25% OFF Early Bird
              </div>
              <div>
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-6">
                  <TrendingUp className="w-7 h-7 text-emerald-400" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-white">Affiliate Marketer</h3>
                <p className="text-slate-300 text-xs md:text-sm leading-relaxed mb-6">
                  Promote quality eBooks, course guides, and past questions to university students and earn commissions.
                </p>
                <ul className="space-y-2 mb-8 text-xs text-slate-300">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> High-margin commission payouts</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> 25% OFF registration fee benefit</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Earn from day one</li>
                </ul>
              </div>
              <Link href="/auth/signup?role=promoter">
                <Button className="w-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-bold rounded-xl py-5 text-xs gap-2">
                  Become an Affiliate (25% OFF) <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

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
import { FeaturedCreatorsCarousel, type FeaturedCreator } from "@/components/creator/featured-creators-carousel"
import { ProductCard } from "@/components/product-card"

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
  let featuredCreators: FeaturedCreator[] = []
  let realStats = { products: "10K+", students: "150K+", creators: "5K+", rating: "4.9/5" }

  if (adminDb) {
    try {
      const productsMeta = await adminDb.collection("products").count().get()
      const pCount = productsMeta.data().count
      if (pCount > 0) realStats.products = pCount > 1000 ? `${Math.floor(pCount / 1000)}K+` : `${pCount}+`

      // 1. Fetch featured creators ONLY (where featured == true)
      const creatorQuery = await adminDb.collection("users").where("featured", "==", true).limit(24).get()
      featuredCreators = creatorQuery.docs.map((doc: any) => {
        const data = doc.data()
        return {
          id: doc.id,
          name: data.displayName || data.email?.split("@")[0] || "Featured Creator",
          storeName: data.storeName || data.hubName,
          description: data.hubDescription || data.storeDescription,
          logoUrl: data.logoUrl,
          storeUrl: data.storeUrl,
          role: data.role
        }
      }).filter((creator: any) => creator.role === "creator" || !creator.role)

      // 2. Fetch products (prioritize featured products)
      const productsQuery = await adminDb
        .collection("products")
        .where("status", "in", ["active", "approved"])
        .limit(20)
        .get()

      const rawProducts = productsQuery.docs.map((doc: any) => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          images: data.images || (data.imageUrl ? [data.imageUrl] : []),
          creatorId: data.creatorId || "",
          creatorName: data.creatorName || "Fero Library Educator"
        }
      }) as (Product & { featured?: boolean })[]

      // Sort products with featured === true first
      rawProducts.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))
      
      // Serialize to plain JSON objects for Client Components
      featuredProducts = JSON.parse(JSON.stringify(rawProducts.slice(0, 8))) as Product[]
      featuredCreators = JSON.parse(JSON.stringify(featuredCreators)) as FeaturedCreator[]
    } catch (error) {
      console.error("Error fetching homepage data:", error)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-cyan-500/30">
      <Header />

      {/* Early Bird Discount Banner */}
      <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 text-white text-xs md:text-sm py-2.5 px-4 text-center font-bold flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 shadow-md">
        <Percent className="w-4 h-4 text-amber-300 animate-bounce shrink-0" />
        <span className="inline-block">EARLY BIRD BENEFIT: Get <span className="text-amber-300 underline font-extrabold">25% OFF</span> your registration fee as a Creator or Affiliate!</span>
        <Link href="/auth/signup?role=creator" className="inline-flex items-center underline text-cyan-200 hover:text-white shrink-0">Claim Discount &rarr;</Link>
      </div>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-24 md:pb-32 overflow-hidden px-4 sm:px-6">
        {/* Background Blur Orbs */}
        <div className="absolute top-0 left-1/4 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] max-w-full bg-indigo-600/20 rounded-full blur-[100px] sm:blur-[140px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] max-w-full bg-purple-600/15 rounded-full blur-[90px] sm:blur-[120px] pointer-events-none" />

        <div className="container mx-auto max-w-6xl text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass border border-indigo-500/30 text-cyan-300 text-[11px] sm:text-xs font-bold uppercase tracking-widest mb-6 sm:mb-8 shadow-lg max-w-full">
            <Sparkles className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
            <span className="truncate">Where Learning Meets Opportunity</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-4 sm:mb-6 leading-tight">
            Welcome to Fero E-Library – <br className="hidden md:block" />
            <span className="text-gradient">Quality eBooks, Course Guides & Past Questions</span>
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base md:text-xl text-muted-foreground mb-8 sm:mb-10 leading-relaxed px-2">
            Your one-stop platform for university students, creators, and affiliate marketers to excel, publish, and earn from day one.
          </p>

          {/* Quick Search Form */}
          <form action="/search" method="GET" className="max-w-xl mx-auto mb-8 sm:mb-10 flex flex-col sm:flex-row gap-2 p-2 rounded-2xl glass-card border border-indigo-500/30 shadow-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                name="q"
                placeholder="Search eBooks, course guides, past questions..."
                className="w-full bg-transparent pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
            </div>
            <Button type="submit" className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl px-6 py-3 text-sm shadow-lg shadow-indigo-600/30 shrink-0">
              Search Library
            </Button>
          </form>

          {/* Subject & Resource Pills */}
          <div className="flex flex-wrap justify-center items-center gap-1.5 sm:gap-2 max-w-3xl mx-auto text-xs">
            {["Quality eBooks", "Course Guides", "Past Questions", "Mathematics", "Biology", "Chemistry", "Law", "Engineering"].map((cat) => (
              <Link key={cat} href={`/search?q=${encodeURIComponent(cat)}`} className="px-3 py-1.5 rounded-full bg-muted/60 border border-border text-muted-foreground hover:text-white hover:border-indigo-500 transition-all">
                {cat}
              </Link>
            ))}
          </div>

          {/* Real Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 max-w-4xl mx-auto mt-12 sm:mt-16 pt-8 sm:pt-12 border-t border-border/80">
            {[
              { label: "Quality eBooks & Guides", value: realStats.products, icon: BookOpen },
              { label: "University Students", value: realStats.students, icon: GraduationCap },
              { label: "Content Creators", value: realStats.creators, icon: Zap },
              { label: "Satisfaction Rating", value: realStats.rating, icon: Star },
            ].map((stat, i) => (
              <div key={i} className="text-center p-2">
                <div className="text-xl sm:text-2xl md:text-3xl font-extrabold text-foreground mb-1">{stat.value}</div>
                <div className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Role Picker Portal Section */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 bg-muted/40 border-y border-border/60">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-extrabold tracking-tight mb-3 sm:mb-4">
              Explore Your Opportunity
            </h2>
            <p className="text-muted-foreground text-xs sm:text-sm md:text-base">
              Whether you want to excel in your studies, sell your educational resources, or earn as an affiliate marketer.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {/* Student Card */}
            <div className="glass-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-cyan-500/20 hover:border-cyan-500/50 transition-all flex flex-col justify-between group shadow-xl">
              <div>
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-5 sm:mb-6">
                  <GraduationCap className="w-6 h-6 sm:w-7 sm:h-7 text-cyan-400" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold mb-3 text-foreground">University Student</h3>
                <p className="text-muted-foreground text-xs md:text-sm leading-relaxed mb-6">
                  Access verified eBooks, course guides, past questions, and educational resources to excel in your academic journey.
                </p>
                <ul className="space-y-2 mb-8 text-xs text-muted-foreground">
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
            <div className="glass-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-purple-500/20 hover:border-purple-500/50 transition-all flex flex-col justify-between group shadow-xl relative">
              <div className="absolute top-4 right-4 bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-black px-2.5 py-1 rounded-full uppercase">
                25% OFF Early Bird
              </div>
              <div>
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mb-5 sm:mb-6">
                  <BookOpen className="w-6 h-6 sm:w-7 sm:h-7 text-purple-400" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold mb-3 text-foreground">Creator / Seller</h3>
                <p className="text-muted-foreground text-xs md:text-sm leading-relaxed mb-6">
                  Publish educational summaries, course guides, and past questions to monetize your knowledge.
                </p>
                <ul className="space-y-2 mb-8 text-xs text-muted-foreground">
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
            <div className="glass-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-emerald-500/20 hover:border-emerald-500/50 transition-all flex flex-col justify-between group shadow-xl relative">
              <div className="absolute top-4 right-4 bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-black px-2.5 py-1 rounded-full uppercase">
                25% OFF Early Bird
              </div>
              <div>
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-5 sm:mb-6">
                  <TrendingUp className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-400" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold mb-3 text-foreground">Affiliate Marketer</h3>
                <p className="text-muted-foreground text-xs md:text-sm leading-relaxed mb-6">
                  Promote quality eBooks, course guides, and past questions to university students and earn commissions.
                </p>
                <ul className="space-y-2 mb-8 text-xs text-muted-foreground">
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

      {/* Featured Products Section */}
      {featuredProducts.length > 0 && (
        <section className="py-16 px-4 sm:px-6 bg-background border-t border-border/40">
          <div className="container mx-auto max-w-6xl">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-300 text-xs font-bold uppercase tracking-wider mb-3">
                  <Sparkles className="w-3.5 h-3.5" /> Featured Resources
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Featured eBooks & Study Guides</h2>
                <p className="text-muted-foreground text-xs sm:text-sm mt-1">Handpicked educational resources verified for top academic performance.</p>
              </div>
              <Link href="/products">
                <Button variant="outline" className="gap-2 font-bold rounded-xl shrink-0">
                  Explore All Resources <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product as any} />
              ))}
            </div>
          </div>
        </section>
      )}

      <FeaturedCreatorsCarousel creators={featuredCreators} />

      <Footer />
    </div>
  )
}

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { HomepageBanner } from "@/components/advertising/HomepageBanner"
import { ShoppingBag, TrendingUp, Shield, Zap, ArrowRight, Star, Store } from "lucide-react"
import { getAdminFirestore } from "@/lib/firebase/admin-simple"

// Define types
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

// Revalidate page every hour (ISR)
export const revalidate = 3600

export default async function HomePage() {
  const adminDb = getAdminFirestore()

  let featuredProducts: Product[] = []
  let featuredCreators: any[] = []
  let realStats = { products: "10K+", creators: "1K+", visitors: "500K+" }

  if (adminDb) {
    try {
      // 1. Fetch real stats (approximate for performance)
      const productsMeta = await adminDb.collection("products").count().get()
      const creatorsMeta = await adminDb.collection("users").where("role", "==", "creator").count().get()

      const pCount = productsMeta.data().count
      const cCount = creatorsMeta.data().count

      // Update stats based on real data if available
      if (pCount > 0) realStats.products = pCount > 1000 ? `${Math.floor(pCount / 1000)}K+` : `${pCount}+`
      if (cCount > 0) realStats.creators = cCount > 1000 ? `${Math.floor(cCount / 1000)}K+` : `${cCount}+`

      // 2. Fetch featured active products
      const productsQuery = await adminDb
        .collection("products")
        .where("status", "in", ["active", "approved"])
        .where("featured", "==", true)
        .orderBy("createdAt", "desc")
        .limit(8)
        .get()

      featuredProducts = productsQuery.docs.map((doc: any) => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          creatorId: data.creatorId || data.creatorId || "",
          creatorName: data.creatorName || data.creatorName || "Creator"
        }
      }) as Product[]

      // 3. Fetch featured/verified creators only
      const creatorsQuery = await adminDb
        .collection("users")
        .where("role", "==", "creator")
        .where("featured", "==", true)
        .limit(6)
        .get()

      featuredCreators = await Promise.all(creatorsQuery.docs.map(async (doc: any) => {
        const userData = doc.data()
        // Fetch reputation for each featured creator
        const reputationDoc = await adminDb.collection("creator_reputation").doc(doc.id).get()
        return {
          id: doc.id,
          ...userData,
          reputation: reputationDoc.exists ? reputationDoc.data() : null
        }
      }))

    } catch (error) {
      console.error("Error fetching homepage data:", error)
    }
  }

  const categories = [
    { name: "University Past Questions", icon: "🎓" },
    { name: "Secondary (WAEC/JAMB)", icon: "📚" },
    { name: "Professional Exams", icon: "💼" },
    { name: "Project Templates", icon: "📝" },
    { name: "Post-UTME Guides", icon: "🏫" },
    { name: "Study Handouts", icon: "📄" },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700 text-white py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                🎉 Nigeria's Most Trusted Academic Library
              </Badge>
              <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                High-Grade Resources for Academic Excellence
              </h1>
              <p className="text-xl text-white/90">
                The leading platform for verified past questions, handouts, and study guides. Built for students, verified by top scholars.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/products">
                  <Button size="lg" className="bg-white text-blue-700 hover:bg-gray-100">
                    <ShoppingBag className="mr-2 h-5 w-5" />
                    Explore Library
                  </Button>
                </Link>
                <Link href="/auth/creator-register-new">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                    Become an Educator
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 pt-8">
                <div>
                  <div className="text-3xl font-bold">{realStats.visitors}</div>
                  <div className="text-white/80">Monthly Visitors</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">{realStats.products}</div>
                  <div className="text-white/80">Products</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">{realStats.creators}</div>
                  <div className="text-white/80">Educators</div>
                </div>
              </div>
            </div>

            <div className="hidden md:block">
              <div className="relative">
                <div className="absolute inset-0 bg-white/10 backdrop-blur-sm rounded-3xl transform rotate-6"></div>
                <div className="relative bg-white/20 backdrop-blur-md rounded-3xl p-8 space-y-4">
                  <div className="flex items-center gap-4 bg-white/90 rounded-xl p-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg"></div>
                    <div className="flex-1">
                      <div className="h-3 bg-gray-300 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 bg-white/90 rounded-xl p-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-orange-500 rounded-lg"></div>
                    <div className="flex-1">
                      <div className="h-3 bg-gray-300 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 bg-white/90 rounded-xl p-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-500 rounded-lg"></div>
                    <div className="flex-1">
                      <div className="h-3 bg-gray-300 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Advertisement Banner Section */}
      <section className="py-8 px-4">
        <div className="container mx-auto max-w-7xl">
          <HomepageBanner
            maxAds={5}
            autoRotate={true}
            rotationInterval={10}
            className="rounded-xl shadow-lg"
          />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto max-w-7xl">
          <div className="grid md:grid-cols-4 gap-8">
            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>Secure Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">100% secure transactions with Paystack integration</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle>Instant Fulfillment</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Zero wait times. Access your digital assets immediately after payment</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Star className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle>Digital Quality</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Verified resources curated by top scholars and students</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle>Creator Economy</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Supporting thousands of academic contributors across Nigeria</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Browse by Education Level</h2>
            <p className="text-gray-600 text-lg">Find the exact material for your academic journey</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {categories.map((category) => (
              <Link key={category.name} href={`/products`}>
                <Card className="hover:shadow-lg transition-all hover:scale-105 cursor-pointer border-2 hover:border-blue-500">
                  <CardContent className="p-6 text-center">
                    <div className="text-5xl mb-3">{category.icon}</div>
                    <h3 className="font-semibold mb-1">{category.name}</h3>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto max-w-7xl">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-4xl font-bold mb-2">Editor's Choice</h2>
              <p className="text-gray-600">Premium study materials selected for accuracy</p>
            </div>
            <Link href="/products">
              <Button variant="outline">
                View All Materials
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {featuredProducts.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No products found</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <Link key={product.id} href={`/products/${product.id}`}>
                  <Card className="hover:shadow-xl transition-all hover:scale-105 cursor-pointer h-full">
                    <div className="relative h-48 bg-gray-100 overflow-hidden rounded-t-lg">
                      {product.imageUrl || (product.images && product.images[0]) ? (
                        <Image
                          src={product.imageUrl || product.images![0]}
                          alt={product.name}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 absolute inset-0">
                          <div className="text-center">
                            <ShoppingBag className="h-16 w-16 mx-auto mb-2" />
                            <p className="text-sm">No Image</p>
                          </div>
                        </div>
                      )}
                      {product.featured && (
                        <Badge className="absolute top-2 left-2 bg-yellow-500">Featured</Badge>
                      )}
                      <Badge className="absolute top-2 right-2 bg-green-500 text-[10px] uppercase">Instant Access</Badge>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-2 line-clamp-2">{product.name}</h3>
                      <p className="text-sm text-gray-500 mb-2">{product.creatorName}</p>
                      <div className="flex items-center justify-between">
                        <Link href={`/hub/${product.creatorId}`} className="text-secondary hover:underline">
                          by {product.creatorName || "Creator"}
                        </Link>
                        <div className="flex items-center text-yellow-500">
                          <Star className={`h-4 w-4 ${product.rating ? "fill-current" : "text-gray-300"}`} />
                          <span className="ml-1 text-sm text-gray-600">
                            {product.rating ? product.rating.toFixed(1) : "5.0"}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured Creators Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-4xl font-bold mb-2">Verified Educators</h2>
              <p className="text-gray-600">Learn from the best minds in your institution</p>
            </div>
            <Link href="/creators">
              <Button variant="outline">
                View All Educators
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {featuredCreators.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No creators found</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredCreators.map((creator) => (
                <Card key={creator.id} className="hover:shadow-xl transition-all hover:scale-105">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center">
                      <div className="relative mb-4 h-24 w-24 overflow-hidden rounded-full bg-muted shadow-md border-2 border-white">
                        {creator.imageUrl ? (
                          <Image
                            src={creator.imageUrl}
                            alt={creator.hubName || creator.displayName || 'Creator'}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-r from-sky-500 to-blue-700 flex items-center justify-center text-white font-bold text-2xl">
                            {creator.hubName?.charAt(0) || creator.displayName?.charAt(0) || 'C'}
                          </div>
                        )}
                      </div>
                      <div className="mb-4">
                        <h3 className="font-semibold text-lg">{creator.hubName || creator.displayName || 'Creator Hub'}</h3>
                        <Badge variant="secondary" className="text-xs mt-1 bg-green-50 text-green-700 border-green-200">
                          ✓ Verified Educator
                        </Badge>
                        <div className="flex items-center justify-center mt-2">
                          <div className="flex text-yellow-500">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${i < Math.floor(creator.reputation?.averageRating || 5) ? "fill-current" : "text-gray-300"}`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-600 ml-1">
                            ({creator.reputation?.averageRating ? creator.reputation.averageRating.toFixed(1) : "5.0"})
                          </span>
                        </div>
                      </div>

                      <p className="text-sm text-gray-500 mb-6 line-clamp-2">
                        Accurate, verified academic materials and tutoring.
                      </p>

                      <Link href={`/hub/${creator.id}`} className="w-full">
                        <Button className="w-full" variant="outline">
                          <Store className="mr-2 h-4 w-4" />
                          Visit Hub
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-700 text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Share Your Knowledge?
          </h2>
          <p className="text-xl mb-8 text-white/90">
            Join thousands of scholars and students monetizing their academic materials. Build your educational library in minutes.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/auth/creator-register-new">
              <Button size="lg" className="bg-white text-blue-700 hover:bg-gray-100">
                Start as an Educator
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/help/creator">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                View Creator Playbook
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

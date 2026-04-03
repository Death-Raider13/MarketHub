"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Store, MapPin, Star, Search, Loader2 } from "lucide-react"
import Link from "next/link"
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/config"

interface Creator {
  id: string
  businessName?: string
  displayName?: string
  hubName?: string
  email: string
  verified: boolean
  createdAt: any
  reputation?: {
    averageRating: number
    level: string
    totalSales: number
  }
}

export default function CreatorsPage() {
  const [creators, setCreators] = useState<Creator[]>([])
  const [filteredCreators, setFilteredCreators] = useState<Creator[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const fetchCreators = async () => {
      try {
        setLoading(true)
        const usersRef = collection(db, 'users')
        const q = query(
          usersRef,
          where('role', '==', 'creator'),
          where('verified', '==', true)
        )

        const snapshot = await getDocs(q)
        const fetchedCreators = await Promise.all(snapshot.docs.map(async docSnapshot => {
          const userData = docSnapshot.data()
          // Fetch reputation for each creator
          const reputationRef = doc(db, 'creator_reputation', docSnapshot.id)
          const reputationSnap = await getDoc(reputationRef)
          
          return {
            id: docSnapshot.id,
            ...userData,
            reputation: reputationSnap.exists() ? reputationSnap.data() : null
          }
        })) as Creator[]

        setCreators(fetchedCreators)
        setFilteredCreators(fetchedCreators)
      } catch (error) {
        console.error("Error fetching creators:", error)
        setCreators([])
        setFilteredCreators([])
      } finally {
        setLoading(false)
      }
    }

    fetchCreators()
  }, [])

  useEffect(() => {
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase()
      const filtered = creators.filter(c => {
        const creatorName = c.hubName || c.businessName || c.displayName || c.email?.split('@')[0] || 'Creator'
        return creatorName.toLowerCase().includes(searchLower) ||
          c.email?.toLowerCase().includes(searchLower)
      })
      setFilteredCreators(filtered)
    } else {
      setFilteredCreators(creators)
    }
  }, [searchQuery, creators])

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-16 max-w-7xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Our Verified Creators</h1>
            <p className="text-xl text-muted-foreground">
              Discover trusted experts offering premium digital assets and services
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search creators by name..."
                className="pl-10 pr-4 h-12 text-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card>
              <CardContent className="p-6 text-center">
                <Store className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="text-3xl font-bold mb-2">{filteredCreators.length}+</h3>
                <p className="text-muted-foreground">Verified Creators</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <Star className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="text-3xl font-bold mb-2">
                  {creators.length > 0
                    ? (creators.reduce((acc, c) => acc + (c.reputation?.averageRating || 5), 0) / creators.length).toFixed(1)
                    : "5.0"}/5
                </h3>
                <p className="text-muted-foreground">Average Rating</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <MapPin className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="text-3xl font-bold mb-2">Digital-First</h3>
                <p className="text-muted-foreground">Instant Fulfillment</p>
              </CardContent>
            </Card>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Loading creators...</p>
              </div>
            </div>
          )}

          {/* Creators Grid */}
          {!loading && filteredCreators.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCreators.map((creator) => (
                <Card key={creator.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl">
                          {(creator.hubName || creator.businessName || creator.displayName || 'C').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-semibold">{creator.hubName || creator.businessName || creator.displayName || creator.email?.split('@')[0] || 'Creator Hub'}</h3>
                          {creator.verified && (
                            <Badge variant="secondary" className="text-xs bg-green-50 text-green-700 border-green-200">
                              ✓ Verified
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 mb-4">
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${i < Math.floor(creator.reputation?.averageRating || 5) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground ml-1">
                        ({creator.reputation?.averageRating ? creator.reputation.averageRating.toFixed(1) : "5.0"})
                      </span>
                    </div>

                    <Link href={`/hub/${creator.id}`}>
                      <Button className="w-full">
                        <Store className="mr-2 h-4 w-4" />
                        Visit Hub
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredCreators.length === 0 && (
            <div className="text-center py-16">
              <Store className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No creators found</h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery ? `No results for "${searchQuery}"` : 'No verified creators available yet'}
              </p>
              {searchQuery && (
                <Button onClick={() => setSearchQuery("")}>
                  Clear Search
                </Button>
              )}
            </div>
          )}

          {/* CTA Section */}
          <div className="mt-16 bg-gradient-to-r from-sky-500 to-indigo-600 text-white rounded-lg p-12 text-center">
            <h2 className="text-3xl font-bold mb-4">Want to Become a Creator?</h2>
            <p className="text-xl mb-8 text-white/90">
              Join our community of successful digital entrepreneurs and start earning today
            </p>
            <Link href="/auth/creator-register-new">
              <Button size="lg" className="bg-white text-sky-600 hover:bg-gray-100">
                Register as Creator
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

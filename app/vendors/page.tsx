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
import { collection, getDocs, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase/config"

interface Vendor {
  id: string
  businessName: string
  email: string
  verified: boolean
  createdAt: any
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        setLoading(true)
        const usersRef = collection(db, 'users')
        const q = query(
          usersRef,
          where('role', '==', 'vendor'),
          where('verified', '==', true)
        )
        
        const snapshot = await getDocs(q)
        const fetchedVendors = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Vendor[]
        
        setVendors(fetchedVendors)
        setFilteredVendors(fetchedVendors)
      } catch (error) {
        console.error("Error fetching vendors:", error)
        setVendors([])
        setFilteredVendors([])
      } finally {
        setLoading(false)
      }
    }
    
    fetchVendors()
  }, [])

  useEffect(() => {
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase()
      const filtered = vendors.filter(v => 
        v.businessName?.toLowerCase().includes(searchLower) ||
        v.email?.toLowerCase().includes(searchLower)
      )
      setFilteredVendors(filtered)
    } else {
      setFilteredVendors(vendors)
    }
  }, [searchQuery, vendors])

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1">
        <div className="container mx-auto px-4 py-16 max-w-7xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Our Verified Vendors</h1>
            <p className="text-xl text-muted-foreground">
              Discover trusted sellers offering quality products
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search vendors by name..."
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
                <h3 className="text-3xl font-bold mb-2">{filteredVendors.length}+</h3>
                <p className="text-muted-foreground">Verified Vendors</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <Star className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="text-3xl font-bold mb-2">4.8/5</h3>
                <p className="text-muted-foreground">Average Rating</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <MapPin className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="text-3xl font-bold mb-2">All Nigeria</h3>
                <p className="text-muted-foreground">Nationwide Delivery</p>
              </CardContent>
            </Card>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Loading vendors...</p>
              </div>
            </div>
          )}

          {/* Vendors Grid */}
          {!loading && filteredVendors.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVendors.map((vendor) => (
                <Card key={vendor.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold text-xl">
                          {vendor.businessName?.charAt(0).toUpperCase() || 'V'}
                        </div>
                        <div>
                          <h3 className="font-semibold">{vendor.businessName || 'Vendor Store'}</h3>
                          {vendor.verified && (
                            <Badge variant="secondary" className="text-xs">
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
                            className={`h-4 w-4 ${i < 4 ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground ml-1">(4.8)</span>
                    </div>

                    <Link href={`/store/${vendor.id}`}>
                      <Button className="w-full">
                        <Store className="mr-2 h-4 w-4" />
                        Visit Store
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredVendors.length === 0 && (
            <div className="text-center py-16">
              <Store className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No vendors found</h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery ? `No results for "${searchQuery}"` : 'No verified vendors available yet'}
              </p>
              {searchQuery && (
                <Button onClick={() => setSearchQuery("")}>
                  Clear Search
                </Button>
              )}
            </div>
          )}

          {/* CTA Section */}
          <div className="mt-16 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg p-12 text-center">
            <h2 className="text-3xl font-bold mb-4">Want to Become a Vendor?</h2>
            <p className="text-xl mb-8 text-white/90">
              Join our community of successful sellers and start earning today
            </p>
            <Link href="/auth/vendor-register-new">
              <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100">
                Register as Vendor
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

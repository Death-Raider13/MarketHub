// Example: Vendor Store Page with integrated advertising
// File: app/vendor/[vendorId]/page.tsx

import { VendorStoreAds } from "@/components/advertising/VendorStoreAds"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Star, MapPin, Phone, Mail } from "lucide-react"

interface VendorStorePageProps {
  params: {
    vendorId: string
  }
}

export default function VendorStorePage({ params }: VendorStorePageProps) {
  const { vendorId } = params

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Vendor Header */}
      <section className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 bg-gray-200 rounded-lg"></div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">TechStore Pro</h1>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="ml-1 font-semibold">4.8</span>
                  <span className="ml-1 text-gray-600">(1,234 reviews)</span>
                </div>
                <Badge variant="secondary">Verified Vendor</Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  Lagos, Nigeria
                </div>
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-1" />
                  +234 123 456 7890
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Main Content Area */}
          <div className="lg:col-span-3">
            
            {/* Banner Ads - Top of store */}
            <VendorStoreAds 
              vendorId={vendorId}
              placement="banner"
              maxAds={2}
              className="mb-8"
            />

            {/* Store Navigation */}
            <div className="flex gap-4 mb-8 border-b">
              <Button variant="ghost" className="border-b-2 border-blue-500">
                All Products
              </Button>
              <Button variant="ghost">Categories</Button>
              <Button variant="ghost">About</Button>
              <Button variant="ghost">Reviews</Button>
            </div>

            {/* Products Grid */}
            <section>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Products (234)</h2>
                <select className="border rounded-lg px-3 py-2">
                  <option>Sort by: Featured</option>
                  <option>Price: Low to High</option>
                  <option>Price: High to Low</option>
                  <option>Newest First</option>
                </select>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {/* Your existing product cards */}
                {Array.from({ length: 12 }).map((_, index) => (
                  <Card key={index} className="group cursor-pointer hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="aspect-square bg-gray-200 rounded mb-3"></div>
                      <h3 className="font-semibold mb-1">Product {index + 1}</h3>
                      <p className="text-sm text-gray-600 mb-2">Short description</p>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-lg">₦25,000</span>
                        <div className="flex items-center">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="ml-1 text-sm">4.5</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Load More */}
              <div className="text-center mt-8">
                <Button variant="outline">Load More Products</Button>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            
            {/* SIDEBAR ADS - Multiple ad slots */}
            <VendorStoreAds 
              vendorId={vendorId}
              placement="sidebar"
              maxAds={3}
              className="mb-8"
            />

            {/* Store Info */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Store Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">About This Store</h4>
                  <p className="text-sm text-gray-600">
                    We specialize in high-quality electronics and gadgets. 
                    Serving customers since 2020 with excellent service and competitive prices.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Store Stats</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Products:</span>
                      <span className="font-semibold">234</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Followers:</span>
                      <span className="font-semibold">1,567</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Response Rate:</span>
                      <span className="font-semibold">98%</span>
                    </div>
                  </div>
                </div>

                <Button className="w-full">
                  <Mail className="h-4 w-4 mr-2" />
                  Contact Store
                </Button>
              </CardContent>
            </Card>

            {/* Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {['Smartphones', 'Laptops', 'Accessories', 'Audio', 'Gaming'].map((category) => (
                    <div key={category} className="flex justify-between items-center py-2 border-b last:border-b-0">
                      <span className="text-sm">{category}</span>
                      <Badge variant="secondary" className="text-xs">
                        {Math.floor(Math.random() * 50) + 10}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

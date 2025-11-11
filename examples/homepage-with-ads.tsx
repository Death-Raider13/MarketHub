// Example: Homepage with integrated advertising
// File: app/page.tsx or components/Homepage.tsx

import { HomepageBanner } from "@/components/advertising/HomepageBanner"
import { SponsoredProducts } from "@/components/advertising/SponsoredProducts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function Homepage() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        {/* Your existing navigation */}
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        
        {/* 1. HOMEPAGE BANNER ADS - Top of page */}
        <section className="mb-12">
          <HomepageBanner 
            maxAds={5}
            autoRotate={true}
            rotationInterval={8}
            className="rounded-xl shadow-lg"
          />
        </section>

        {/* 2. Featured Categories */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Shop by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {/* Your existing category cards */}
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4"></div>
                <h3 className="font-semibold">Electronics</h3>
              </CardContent>
            </Card>
            {/* More categories... */}
          </div>
        </section>

        {/* 3. SPONSORED PRODUCTS - Mixed with featured products */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Featured Products</h2>
          
          {/* Regular featured products grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
            {/* Your existing featured products */}
          </div>
          
          {/* Sponsored products section */}
          <SponsoredProducts 
            category="general"
            layout="grid"
            maxAds={6}
            className="mb-8"
          />
        </section>

        {/* 4. Popular Vendors */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Popular Vendors</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Your existing vendor cards */}
          </div>
        </section>

        {/* 5. Recent Products */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Recently Added</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {/* Your existing recent products */}
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t">
        {/* Your existing footer */}
      </footer>
    </div>
  )
}

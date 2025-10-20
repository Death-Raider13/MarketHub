import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, Users, Target, BarChart } from "lucide-react"
import Link from "next/link"

export default function AdvertisingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1">
        <div className="container mx-auto px-4 py-16 max-w-6xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Advertise on MarketHub</h1>
            <p className="text-xl text-muted-foreground">
              Reach thousands of potential customers and grow your business
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <Card>
              <CardContent className="p-6 text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="font-semibold mb-2">500K+ Monthly Visitors</h3>
                <p className="text-sm text-muted-foreground">
                  Get your products in front of engaged shoppers
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <Target className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="font-semibold mb-2">Targeted Advertising</h3>
                <p className="text-sm text-muted-foreground">
                  Reach the right audience for your products
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="font-semibold mb-2">Boost Sales</h3>
                <p className="text-sm text-muted-foreground">
                  Increase visibility and drive more sales
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <BarChart className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="font-semibold mb-2">Analytics & Insights</h3>
                <p className="text-sm text-muted-foreground">
                  Track performance with detailed reports
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg p-12 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-xl mb-8 text-white/90">
              Contact our advertising team to discuss your marketing goals
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/contact">
                <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100">
                  Contact Us
                </Button>
              </Link>
              <Link href="/auth/vendor-register-new">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  Become a Vendor
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

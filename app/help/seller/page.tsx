import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Package, DollarSign, TrendingUp, Settings, HelpCircle, MessageSquare } from "lucide-react"
import Link from "next/link"

export default function SellerHelpPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1">
        <div className="container mx-auto px-4 py-16 max-w-6xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Seller Help Center</h1>
            <p className="text-xl text-muted-foreground">
              Everything you need to know about selling on MarketHub
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <Card>
              <CardHeader>
                <Package className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>Getting Started</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• How to register as a vendor</li>
                  <li>• Setting up your store</li>
                  <li>• Adding your first product</li>
                  <li>• Verification process</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <DollarSign className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>Payments & Payouts</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• How payments work</li>
                  <li>• Setting up payout methods</li>
                  <li>• Understanding fees</li>
                  <li>• Withdrawal process</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <TrendingUp className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>Growing Your Sales</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Optimizing product listings</li>
                  <li>• Using analytics</li>
                  <li>• Promotional strategies</li>
                  <li>• Customer engagement</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Settings className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>Managing Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Processing orders</li>
                  <li>• Shipping & delivery</li>
                  <li>• Handling returns</li>
                  <li>• Customer support</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <HelpCircle className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>Policies & Guidelines</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Seller policies</li>
                  <li>• Product guidelines</li>
                  <li>• Prohibited items</li>
                  <li>• Best practices</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <MessageSquare className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>Support</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Contact seller support</li>
                  <li>• Report an issue</li>
                  <li>• Technical help</li>
                  <li>• FAQs</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg p-12 text-center">
            <h2 className="text-3xl font-bold mb-4">Need More Help?</h2>
            <p className="text-xl mb-8 text-white/90">
              Our seller support team is here to help you succeed
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/contact">
                <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100">
                  Contact Support
                </Button>
              </Link>
              <Link href="/vendor/dashboard">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  Go to Dashboard
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

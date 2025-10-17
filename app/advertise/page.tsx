"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Megaphone,
  Target,
  TrendingUp,
  Users,
  DollarSign,
  BarChart3,
  Check,
  ArrowRight,
  Eye,
  MousePointer,
  Zap,
  Shield,
  Globe,
  Store,
} from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/firebase/auth-context"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export default function AdvertisePage() {
  const { user } = useAuth()
  const router = useRouter()

  const handleGetStarted = () => {
    // Always redirect to advertiser signup page
    // It will handle checking if user is logged in and if they have advertiser profile
    router.push("/advertiser/signup")
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-background border-b">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-4" variant="secondary">
              <Megaphone className="h-3 w-3 mr-1" />
              Advertising Platform
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Reach Your Target Customers on{" "}
              <span className="text-primary">MarketHub</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Advertise your products and services to thousands of engaged shoppers
              across Nigeria's fastest-growing e-commerce marketplace.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={handleGetStarted}>
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="#pricing">View Pricing</Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">500K+</div>
                <div className="text-sm text-muted-foreground">Monthly Visitors</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">1,000+</div>
                <div className="text-sm text-muted-foreground">Active Stores</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">2.5%</div>
                <div className="text-sm text-muted-foreground">Avg CTR</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">₦50M+</div>
                <div className="text-sm text-muted-foreground">Monthly GMV</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Advertise Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Advertise on MarketHub?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Connect with shoppers who are ready to buy
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Target className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Targeted Reach</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Target by location, category, store type, and device. Reach exactly
                  who you want, when you want.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Users className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Engaged Audience</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Reach shoppers with high purchase intent actively browsing products
                  on vendor stores.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <DollarSign className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Flexible Pricing</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Choose CPM, CPC, or CPA pricing. Set your budget and bid amount.
                  Only pay for results.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <BarChart3 className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Real-Time Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Track impressions, clicks, conversions, and ROI in real-time.
                  Optimize campaigns on the fly.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Zap className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Quick Setup</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Launch campaigns in minutes. No complex setup or long approval
                  process required.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Shield className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Brand Safety</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Your ads appear on verified, quality stores. We ensure brand safety
                  and ad quality.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Start advertising in 4 simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="font-semibold text-lg mb-2">Sign Up</h3>
              <p className="text-sm text-muted-foreground">
                Create your advertiser account in seconds
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="font-semibold text-lg mb-2">Create Campaign</h3>
              <p className="text-sm text-muted-foreground">
                Set budget, upload creative, and choose targeting
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="font-semibold text-lg mb-2">Launch</h3>
              <p className="text-sm text-muted-foreground">
                Your ads go live instantly on relevant stores
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                4
              </div>
              <h3 className="font-semibold text-lg mb-2">Track & Optimize</h3>
              <p className="text-sm text-muted-foreground">
                Monitor performance and optimize for better results
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose the pricing model that works for your goals
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* CPM Pricing */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Eye className="h-8 w-8 text-primary mb-2" />
                <CardTitle>CPM</CardTitle>
                <CardDescription>Cost Per 1000 Impressions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <div className="text-3xl font-bold">₦500 - ₦2,000</div>
                  <div className="text-sm text-muted-foreground">per 1,000 views</div>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Best for brand awareness</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Guaranteed impressions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Predictable costs</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* CPC Pricing */}
            <Card className="hover:shadow-lg transition-shadow border-primary">
              <CardHeader>
                <Badge className="w-fit mb-2">Most Popular</Badge>
                <MousePointer className="h-8 w-8 text-primary mb-2" />
                <CardTitle>CPC</CardTitle>
                <CardDescription>Cost Per Click</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <div className="text-3xl font-bold">₦20 - ₦100</div>
                  <div className="text-sm text-muted-foreground">per click</div>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Best for traffic generation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Only pay for clicks</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Higher engagement</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* CPA Pricing */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <TrendingUp className="h-8 w-8 text-primary mb-2" />
                <CardTitle>CPA</CardTitle>
                <CardDescription>Cost Per Action</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <div className="text-3xl font-bold">₦500 - ₦5,000</div>
                  <div className="text-sm text-muted-foreground">per conversion</div>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Best for performance marketing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Only pay for results</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Maximum ROI</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-8">
            <p className="text-sm text-muted-foreground">
              No setup fees • No monthly minimums • Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Start Advertising?
          </h2>
          <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
            Join hundreds of businesses reaching their target customers on MarketHub
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="secondary"
              onClick={handleGetStarted}
            >
              Get Started Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
              asChild
            >
              <Link href="/contact">Contact Sales</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

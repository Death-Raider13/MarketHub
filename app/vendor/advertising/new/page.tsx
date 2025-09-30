"use client"

import type React from "react"

import { useState } from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ProtectedRoute } from "@/lib/firebase/protected-route"
import { Upload, X } from "lucide-react"
import { useRouter } from "next/navigation"

function CreateCampaignContent() {
  const router = useRouter()
  const [adType, setAdType] = useState<"banner" | "sidebar" | "sponsored-product">("banner")
  const [image, setImage] = useState<string>("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Simulate campaign creation
    await new Promise((resolve) => setTimeout(resolve, 1500))

    router.push("/vendor/advertising")
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImage(URL.createObjectURL(file))
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Create Ad Campaign</h1>
            <p className="text-muted-foreground">Set up a new advertising campaign for your products</p>
            <div className="mt-4 rounded-lg bg-orange-50 dark:bg-orange-950 p-4 text-sm">
              <p className="font-medium text-orange-800 dark:text-orange-200 mb-2">
                📋 Campaign Approval Process
              </p>
              <ul className="space-y-1 text-orange-700 dark:text-orange-300 text-xs">
                <li>• Your campaign will be reviewed by our team within 1-2 business days</li>
                <li>• We'll verify content complies with our advertising policies</li>
                <li>• You'll receive an email notification once approved or if changes are needed</li>
                <li>• Payment is only charged after approval and when campaign goes live</li>
              </ul>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                {/* Campaign Details */}
                <Card>
                  <CardHeader>
                    <CardTitle>Campaign Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Campaign Name</Label>
                      <Input id="title" placeholder="e.g., Summer Sale 2024" required />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description (Optional)</Label>
                      <Textarea id="description" placeholder="Describe your campaign..." rows={3} />
                    </div>

                    <div className="space-y-2">
                      <Label>Ad Type</Label>
                      <RadioGroup value={adType} onValueChange={(value: any) => setAdType(value)}>
                        <div className="grid gap-3 sm:grid-cols-3">
                          <div className="flex items-center space-x-2 rounded-lg border border-border p-4">
                            <RadioGroupItem value="banner" id="banner" />
                            <Label htmlFor="banner" className="cursor-pointer">
                              <div className="font-medium">Homepage Banner</div>
                              <div className="text-xs text-muted-foreground">Full-width banner</div>
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2 rounded-lg border border-border p-4">
                            <RadioGroupItem value="sidebar" id="sidebar" />
                            <Label htmlFor="sidebar" className="cursor-pointer">
                              <div className="font-medium">Sidebar Ad</div>
                              <div className="text-xs text-muted-foreground">Side placement</div>
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2 rounded-lg border border-border p-4">
                            <RadioGroupItem value="sponsored-product" id="sponsored" />
                            <Label htmlFor="sponsored" className="cursor-pointer">
                              <div className="font-medium">Sponsored Product</div>
                              <div className="text-xs text-muted-foreground">Product highlight</div>
                            </Label>
                          </div>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="linkUrl">Destination URL</Label>
                      <Input id="linkUrl" type="url" placeholder="https://..." required />
                    </div>
                  </CardContent>
                </Card>

                {/* Ad Creative */}
                <Card>
                  <CardHeader>
                    <CardTitle>Ad Creative</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Upload Image</Label>
                      {image ? (
                        <div className="relative aspect-[4/1] overflow-hidden rounded-lg bg-muted">
                          <img
                            src={image || "/placeholder.svg"}
                            alt="Ad preview"
                            className="h-full w-full object-cover"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute right-2 top-2"
                            onClick={() => setImage("")}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <label className="flex aspect-[4/1] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/50 hover:bg-muted">
                          <Upload className="h-8 w-8 text-muted-foreground" />
                          <span className="mt-2 text-sm text-muted-foreground">Click to upload ad image</span>
                          <span className="text-xs text-muted-foreground">Recommended: 1200x300px for banners</span>
                          <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                        </label>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Budget & Schedule */}
                <Card>
                  <CardHeader>
                    <CardTitle>Budget & Schedule</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="budget">Total Budget ($)</Label>
                        <Input 
                          id="budget" 
                          type="number" 
                          step="0.01" 
                          min="100" 
                          placeholder="500.00" 
                          required 
                        />
                        <p className="text-xs text-muted-foreground">Minimum: $100</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="dailyBudget">Daily Budget ($)</Label>
                        <Input 
                          id="dailyBudget" 
                          type="number" 
                          step="0.01" 
                          min="10" 
                          placeholder="50.00" 
                        />
                        <p className="text-xs text-muted-foreground">Minimum: $10/day</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="startDate">Start Date</Label>
                        <Input id="startDate" type="date" required />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="endDate">End Date</Label>
                        <Input id="endDate" type="date" required />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Placement</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="placement">Ad Placement</Label>
                      <Select defaultValue="homepage-top">
                        <SelectTrigger id="placement">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="homepage-top">Homepage - Top</SelectItem>
                          <SelectItem value="homepage-sidebar">Homepage - Sidebar</SelectItem>
                          <SelectItem value="product-listing">Product Listing</SelectItem>
                          <SelectItem value="product-detail">Product Detail</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Pricing</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cost per 1000 impressions (CPM)</span>
                      <span className="font-medium">$25.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cost per click (CPC)</span>
                      <span className="font-medium">$2.50</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Setup Fee (One-time)</span>
                      <span className="font-medium">$50.00</span>
                    </div>
                    <div className="border-t border-border pt-3">
                      <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-3">
                        <p className="text-xs font-medium text-blue-800 dark:text-blue-200 mb-1">
                          Estimated Reach
                        </p>
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                          $500 budget = ~20,000 impressions or 200 clicks
                        </p>
                      </div>
                    </div>
                    <div className="border-t border-border pt-3">
                      <p className="text-xs text-muted-foreground">
                        • Minimum budget: $100
                        <br />• You'll only be charged for actual performance
                        <br />• Admin approval required (1-2 business days)
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? "Creating..." : "Create Campaign"}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default function CreateCampaignPage() {
  return (
    <ProtectedRoute allowedRoles={["vendor"]}>
      <CreateCampaignContent />
    </ProtectedRoute>
  )
}

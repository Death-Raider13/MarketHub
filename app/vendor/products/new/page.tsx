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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ProtectedRoute } from "@/lib/firebase/protected-route"
import { Upload, X, Plus, Tag, Star, Package } from "lucide-react"
import { useRouter } from "next/navigation"

function AddProductContent() {
  const router = useRouter()
  const [images, setImages] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [variants, setVariants] = useState<Array<{name: string, options: string[]}>>([{name: "Size", options: []}])
  const [requestReviews, setRequestReviews] = useState(true)
  const [showRelatedProducts, setShowRelatedProducts] = useState(true)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Simulate product creation
    await new Promise((resolve) => setTimeout(resolve, 1500))

    router.push("/vendor/products")
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      const newImages = Array.from(files).map((file) => URL.createObjectURL(file))
      setImages([...images, ...newImages])
    }
  }

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const addVariant = () => {
    setVariants([...variants, {name: "", options: []}])
  }

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index))
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Add New Product</h1>
            <p className="text-muted-foreground">Create a new product listing for your store</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Product Name</Label>
                      <Input id="name" placeholder="Enter product name" required />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea id="description" placeholder="Describe your product..." rows={5} required />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select required>
                          <SelectTrigger id="category">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="electronics">Electronics</SelectItem>
                            <SelectItem value="fashion">Fashion</SelectItem>
                            <SelectItem value="home">Home & Garden</SelectItem>
                            <SelectItem value="sports">Sports</SelectItem>
                            <SelectItem value="books">Books</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="sku">SKU</Label>
                        <Input id="sku" placeholder="Product SKU" required />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Pricing & Inventory */}
                <Card>
                  <CardHeader>
                    <CardTitle>Pricing & Inventory</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="price">Price</Label>
                        <Input id="price" type="number" step="0.01" placeholder="0.00" required />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="comparePrice">Compare at Price (Optional)</Label>
                        <Input id="comparePrice" type="number" step="0.01" placeholder="0.00" />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="stock">Stock Quantity</Label>
                        <Input id="stock" type="number" placeholder="0" required />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Images */}
                <Card>
                  <CardHeader>
                    <CardTitle>Product Images</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">Upload up to 10 images. First image will be the main product image.</p>
                    <div className="grid gap-4 sm:grid-cols-4">
                      {images.map((image, index) => (
                        <div key={index} className="relative aspect-square overflow-hidden rounded-lg bg-muted">
                          {index === 0 && (
                            <div className="absolute left-2 top-2 z-10">
                              <span className="rounded bg-primary px-2 py-1 text-xs text-primary-foreground">Main</span>
                            </div>
                          )}
                          <img
                            src={image || "/placeholder.svg"}
                            alt={`Product ${index + 1}`}
                            className="h-full w-full object-cover"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute right-2 top-2 h-6 w-6"
                            onClick={() => removeImage(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}

                      {images.length < 10 && (
                        <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/50 hover:bg-muted">
                          <Upload className="h-8 w-8 text-muted-foreground" />
                          <span className="mt-2 text-sm text-muted-foreground">Upload</span>
                          <span className="text-xs text-muted-foreground">{images.length}/10</span>
                          <input type="file" className="hidden" accept="image/*" multiple onChange={handleImageUpload} />
                        </label>
                      )}
                    </div>
                    {images.length === 0 && (
                      <p className="text-sm text-destructive">⚠️ At least one image is required</p>
                    )}
                  </CardContent>
                </Card>

                {/* Tags & Categories */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Tag className="h-5 w-5" />
                      Tags & Keywords
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Product Tags</Label>
                      <p className="text-xs text-muted-foreground">Add tags to help customers find your product. These are used for "You might like" recommendations.</p>
                      <div className="flex gap-2">
                        <Input
                          placeholder="e.g., wireless, bluetooth, portable"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                        />
                        <Button type="button" onClick={addTag} size="sm">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {tags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm"
                            >
                              {tag}
                              <button
                                type="button"
                                onClick={() => removeTag(tag)}
                                className="hover:text-destructive"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Product Variants */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Product Variants (Optional)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">Add variants like size, color, or material if your product has different options.</p>
                    {variants.map((variant, index) => (
                      <div key={index} className="space-y-2 p-4 border border-border rounded-lg">
                        <div className="flex items-center justify-between">
                          <Label>Variant {index + 1}</Label>
                          {variants.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeVariant(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <Input placeholder="Variant name (e.g., Size, Color)" />
                        <Input placeholder="Options (e.g., Small, Medium, Large)" />
                      </div>
                    ))}
                    <Button type="button" variant="outline" onClick={addVariant} className="w-full">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Variant
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Product Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select defaultValue="active">
                        <SelectTrigger id="status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="h-5 w-5" />
                      Customer Engagement
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start space-x-2">
                      <input
                        type="checkbox"
                        id="requestReviews"
                        checked={requestReviews}
                        onChange={(e) => setRequestReviews(e.target.checked)}
                        className="mt-1"
                      />
                      <div>
                        <label htmlFor="requestReviews" className="text-sm font-medium cursor-pointer">
                          Request Reviews
                        </label>
                        <p className="text-xs text-muted-foreground">
                          Automatically send review request emails to customers after delivery
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-2">
                      <input
                        type="checkbox"
                        id="showRelated"
                        checked={showRelatedProducts}
                        onChange={(e) => setShowRelatedProducts(e.target.checked)}
                        className="mt-1"
                      />
                      <div>
                        <label htmlFor="showRelated" className="text-sm font-medium cursor-pointer">
                          Show "You Might Like"
                        </label>
                        <p className="text-xs text-muted-foreground">
                          Display related products based on tags on product page
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>SEO</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="metaTitle">Meta Title</Label>
                      <Input id="metaTitle" placeholder="SEO title" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="metaDescription">Meta Description</Label>
                      <Textarea id="metaDescription" placeholder="SEO description" rows={3} />
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? "Creating..." : "Create Product"}
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

export default function AddProductPage() {
  return (
    <ProtectedRoute allowedRoles={["vendor"]}>
      <AddProductContent />
    </ProtectedRoute>
  )
}

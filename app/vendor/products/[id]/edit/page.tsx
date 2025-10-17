"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/firebase/auth-context"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ProtectedRoute } from "@/lib/firebase/protected-route"
import { Upload, X, Plus, Tag, Star, Package, Save, ArrowLeft, Loader2 } from "lucide-react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"

interface Variant {
  id: string
  name: string
  options: VariantOption[]
}

interface VariantOption {
  id: string
  value: string
  stock: number
  price?: number
  sku?: string
}

function EditProductContent() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const productId = params.id as string

  const [productName, setProductName] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [sku, setSku] = useState("")
  const [price, setPrice] = useState("")
  const [comparePrice, setComparePrice] = useState("")
  const [stock, setStock] = useState("")
  const [productType, setProductType] = useState<"physical" | "digital" | "service">("physical")
  const [images, setImages] = useState<string[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [status, setStatus] = useState("active")
  const [loading, setLoading] = useState(false)
  const [loadingProduct, setLoadingProduct] = useState(true)
  const [uploadingImages, setUploadingImages] = useState(false)
  const [requestReviews, setRequestReviews] = useState(true)
  const [showRelatedProducts, setShowRelatedProducts] = useState(true)

  // Load product data from Firestore
  useEffect(() => {
    async function loadProduct() {
      if (!productId) return

      try {
        const response = await fetch(`/api/vendor/products/${productId}`)
        const data = await response.json()

        if (data.id) {
          setProductName(data.name || "")
          setDescription(data.description || "")
          setCategory(data.category || "")
          setSku(data.sku || "")
          setPrice(data.price?.toString() || "")
          setComparePrice(data.compareAtPrice?.toString() || "")
          setStock(data.stock?.toString() || "")
          setProductType(data.type || "physical")
          setImages(data.images || [])
          setTags(data.tags || [])
          setStatus(data.status || "active")
        } else {
          toast.error("Product not found")
          router.push("/vendor/products")
        }
      } catch (error) {
        console.error("Error loading product:", error)
        toast.error("Failed to load product")
      } finally {
        setLoadingProduct(false)
      }
    }

    loadProduct()
  }, [productId, router])

  // Variants
  const [variants, setVariants] = useState<Variant[]>([
    {
      id: "1",
      name: "Color",
      options: [
        { id: "1-1", value: "Black", stock: 15, price: 199.99, sku: "WH-1000-BLK" },
        { id: "1-2", value: "White", stock: 20, price: 199.99, sku: "WH-1000-WHT" },
        { id: "1-3", value: "Silver", stock: 10, price: 209.99, sku: "WH-1000-SLV" },
      ],
    },
    {
      id: "2",
      name: "Size",
      options: [
        { id: "2-1", value: "Standard", stock: 30, sku: "WH-1000-STD" },
        { id: "2-2", value: "Large", stock: 15, sku: "WH-1000-LRG" },
      ],
    },
  ])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      toast.error("Please login to continue")
      return
    }

    // Validate required fields
    if (!productName) {
      toast.error("Please enter a product name")
      return
    }

    if (!price) {
      toast.error("Please enter a product price")
      return
    }

    if (!category) {
      toast.error("Please select a category")
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/vendor/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: productName,
          description,
          price,
          compareAtPrice: comparePrice,
          category,
          sku,
          images,
          stock,
          type: productType,
          tags,
          status,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Product updated successfully! 🎉")
        router.push("/vendor/products")
      } else {
        toast.error(data.error || "Failed to update product")
      }
    } catch (error) {
      console.error("Error updating product:", error)
      toast.error("Failed to update product")
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploadingImages(true)
    
    try {
      const uploadedUrls: string[] = []
      
      for (const file of Array.from(files)) {
        // Validate file
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} is not an image file`)
          continue
        }
        
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} is too large (max 5MB)`)
          continue
        }

        // Upload to Cloudinary
        const formData = new FormData()
        formData.append('file', file)
        formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!)
        formData.append('folder', 'products')
        
        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
          {
            method: 'POST',
            body: formData,
          }
        )
        
        const data = await response.json()
        
        if (data.secure_url) {
          uploadedUrls.push(data.secure_url)
        }
      }
      
      if (uploadedUrls.length > 0) {
        setImages([...images, ...uploadedUrls])
        toast.success(`${uploadedUrls.length} image(s) uploaded successfully!`)
      }
    } catch (error) {
      console.error("Error uploading images:", error)
      toast.error("Failed to upload images")
    } finally {
      setUploadingImages(false)
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
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const addVariant = () => {
    const newVariant: Variant = {
      id: Date.now().toString(),
      name: "",
      options: [{ id: `${Date.now()}-1`, value: "", stock: 0 }],
    }
    setVariants([...variants, newVariant])
  }

  const removeVariant = (variantId: string) => {
    setVariants(variants.filter((v) => v.id !== variantId))
  }

  const updateVariantName = (variantId: string, name: string) => {
    setVariants(
      variants.map((v) => (v.id === variantId ? { ...v, name } : v))
    )
  }

  const addVariantOption = (variantId: string) => {
    setVariants(
      variants.map((v) =>
        v.id === variantId
          ? {
              ...v,
              options: [
                ...v.options,
                { id: `${Date.now()}-${v.options.length}`, value: "", stock: 0 },
              ],
            }
          : v
      )
    )
  }

  const removeVariantOption = (variantId: string, optionId: string) => {
    setVariants(
      variants.map((v) =>
        v.id === variantId
          ? { ...v, options: v.options.filter((o) => o.id !== optionId) }
          : v
      )
    )
  }

  const updateVariantOption = (
    variantId: string,
    optionId: string,
    field: keyof VariantOption,
    value: string | number
  ) => {
    setVariants(
      variants.map((v) =>
        v.id === variantId
          ? {
              ...v,
              options: v.options.map((o) =>
                o.id === optionId ? { ...o, [field]: value } : o
              ),
            }
          : v
      )
    )
  }

  // Show loading state while fetching product
  if (loadingProduct) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 bg-muted/30 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading product...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Button variant="ghost" size="icon" asChild>
                  <Link href="/vendor/products">
                    <ArrowLeft className="h-5 w-5" />
                  </Link>
                </Button>
                <h1 className="text-3xl font-bold">Edit Product</h1>
              </div>
              <p className="text-muted-foreground ml-12">Update product details, variants, and inventory</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={loading || uploadingImages}>
                <Save className="mr-2 h-4 w-4" />
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
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
                      <Label htmlFor="name">Product Name *</Label>
                      <Input
                        id="name"
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description *</Label>
                      <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={5}
                        required
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="category">Category *</Label>
                        <Select value={category} onValueChange={setCategory}>
                          <SelectTrigger id="category">
                            <SelectValue />
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
                        <Label htmlFor="sku">SKU *</Label>
                        <Input
                          id="sku"
                          value={sku}
                          onChange={(e) => setSku(e.target.value)}
                          required
                        />
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
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="price">Price ($) *</Label>
                        <Input
                          id="price"
                          type="number"
                          step="0.01"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="comparePrice">Compare at Price ($)</Label>
                        <Input
                          id="comparePrice"
                          type="number"
                          step="0.01"
                          value={comparePrice}
                          onChange={(e) => setComparePrice(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">Show discount</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="stock">Stock Quantity *</Label>
                        <Input
                          id="stock"
                          type="number"
                          value={stock}
                          onChange={(e) => setStock(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Product Images */}
                <Card>
                  <CardHeader>
                    <CardTitle>Product Images</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Upload up to 10 images. First image will be the main product image.
                    </p>
                    <div className="grid gap-4 sm:grid-cols-4">
                      {images.map((image, index) => (
                        <div
                          key={index}
                          className="relative aspect-square overflow-hidden rounded-lg bg-muted"
                        >
                          {index === 0 && (
                            <div className="absolute left-2 top-2 z-10">
                              <span className="rounded bg-primary px-2 py-1 text-xs text-primary-foreground">
                                Main
                              </span>
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
                          <span className="text-xs text-muted-foreground">
                            {images.length}/10
                          </span>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            multiple
                            onChange={handleImageUpload}
                          />
                        </label>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Tags */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Tag className="h-5 w-5" />
                      Product Tags
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Tags</Label>
                      <p className="text-xs text-muted-foreground">
                        Add tags for better search and "You might like" recommendations
                      </p>
                      <div className="flex gap-2">
                        <Input
                          placeholder="e.g., wireless, bluetooth, portable"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyPress={(e) =>
                            e.key === "Enter" && (e.preventDefault(), addTag())
                          }
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
                      Product Variants
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Manage different versions of this product (colors, sizes, etc.)
                    </p>

                    {variants.map((variant, variantIndex) => (
                      <div
                        key={variant.id}
                        className="space-y-3 rounded-lg border border-border p-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 mr-4">
                            <Label>Variant Type</Label>
                            <Input
                              placeholder="e.g., Color, Size, Material"
                              value={variant.name}
                              onChange={(e) =>
                                updateVariantName(variant.id, e.target.value)
                              }
                              className="mt-1"
                            />
                          </div>
                          {variants.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeVariant(variant.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Options</Label>
                          {variant.options.map((option, optionIndex) => (
                            <div
                              key={option.id}
                              className="grid gap-2 sm:grid-cols-5 items-end"
                            >
                              <div className="sm:col-span-1">
                                <Label className="text-xs">Value</Label>
                                <Input
                                  placeholder="e.g., Red"
                                  value={option.value}
                                  onChange={(e) =>
                                    updateVariantOption(
                                      variant.id,
                                      option.id,
                                      "value",
                                      e.target.value
                                    )
                                  }
                                  className="h-9"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Stock</Label>
                                <Input
                                  type="number"
                                  placeholder="0"
                                  value={option.stock}
                                  onChange={(e) =>
                                    updateVariantOption(
                                      variant.id,
                                      option.id,
                                      "stock",
                                      Number(e.target.value)
                                    )
                                  }
                                  className="h-9"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Price ($)</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="Optional"
                                  value={option.price || ""}
                                  onChange={(e) =>
                                    updateVariantOption(
                                      variant.id,
                                      option.id,
                                      "price",
                                      e.target.value ? Number(e.target.value) : ""
                                    )
                                  }
                                  className="h-9"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">SKU</Label>
                                <Input
                                  placeholder="Optional"
                                  value={option.sku || ""}
                                  onChange={(e) =>
                                    updateVariantOption(
                                      variant.id,
                                      option.id,
                                      "sku",
                                      e.target.value
                                    )
                                  }
                                  className="h-9"
                                />
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  removeVariantOption(variant.id, option.id)
                                }
                                disabled={variant.options.length === 1}
                                className="h-9"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addVariantOption(variant.id)}
                            className="w-full"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Option
                          </Button>
                        </div>
                      </div>
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      onClick={addVariant}
                      className="w-full"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Variant Type
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
                      <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger id="status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        {status === "active"
                          ? "Product is visible to customers"
                          : "Product is hidden from customers"}
                      </p>
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
                        <label
                          htmlFor="requestReviews"
                          className="text-sm font-medium cursor-pointer"
                        >
                          Request Reviews
                        </label>
                        <p className="text-xs text-muted-foreground">
                          Send review request emails after delivery
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
                        <label
                          htmlFor="showRelated"
                          className="text-sm font-medium cursor-pointer"
                        >
                          Show "You Might Like"
                        </label>
                        <p className="text-xs text-muted-foreground">
                          Display related products based on tags
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-sm">Quick Tips</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs text-blue-800 dark:text-blue-200">
                    <p>• Use variants to manage different sizes/colors</p>
                    <p>• Set individual stock levels per variant</p>
                    <p>• Add variant-specific pricing if needed</p>
                    <p>• Use SKUs to track inventory</p>
                    <p>• Add 5-10 tags for better discoverability</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default function EditProductPage() {
  return (
    <ProtectedRoute allowedRoles={["vendor"]}>
      <EditProductContent />
    </ProtectedRoute>
  )
}

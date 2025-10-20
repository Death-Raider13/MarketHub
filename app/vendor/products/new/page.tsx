"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/lib/firebase/auth-context"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ProtectedRoute } from "@/lib/firebase/protected-route"
import { Upload, X, Plus, Tag, Star, Package, FileText, Truck, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { DigitalFileUpload } from "@/components/vendor/digital-file-upload"
import type { DigitalFile } from "@/lib/types"
import { toast } from "sonner"

function AddProductContent() {
  const router = useRouter()
  const { user } = useAuth()
  const [images, setImages] = useState<string[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const [loading, setLoading] = useState(false)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [variants, setVariants] = useState<Array<{name: string, options: string[]}>>([{name: "Size", options: []}])
  const [requestReviews, setRequestReviews] = useState(true)
  const [showRelatedProducts, setShowRelatedProducts] = useState(true)
  
  // Product form data
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    compareAtPrice: "",
    category: "",
    subcategory: "",
    stock: "",
    sku: "",
    seoTitle: "",
    seoDescription: "",
  })
  
  // Digital product fields
  const [productType, setProductType] = useState<"physical" | "digital" | "service">("physical")
  const [digitalFiles, setDigitalFiles] = useState<DigitalFile[]>([])
  const [accessDuration, setAccessDuration] = useState<number>(0) // 0 = lifetime
  const [downloadLimit, setDownloadLimit] = useState<number>(0) // 0 = unlimited

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      toast.error("Please login to continue")
      return
    }

    if (images.length === 0) {
      toast.error("Please upload at least one product image")
      return
    }

    // Validate required fields
    if (!formData.name) {
      toast.error("Please enter a product name")
      return
    }

    if (!formData.price) {
      toast.error("Please enter a product price")
      return
    }

    if (!formData.category) {
      toast.error("⚠️ Please select a category from the dropdown")
      return
    }

    if (!formData.sku) {
      toast.error("Please enter a SKU")
      return
    }

    if (productType === 'physical' && !formData.stock) {
      toast.error("Please enter stock quantity for physical products")
      return
    }

    console.log("Form data being submitted:", {
      name: formData.name,
      price: formData.price,
      category: formData.category,
      sku: formData.sku,
      type: productType
    })

    setLoading(true)

    try {
      const response = await fetch("/api/vendor/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId: user.uid,
          name: formData.name,
          description: formData.description,
          price: formData.price,
          compareAtPrice: formData.compareAtPrice,
          category: formData.category,
          subcategory: formData.subcategory,
          images,
          stock: formData.stock,
          sku: formData.sku,
          type: productType,
          digitalFiles,
          accessDuration,
          downloadLimit,
          variants,
          tags,
          status: "active",
          seoTitle: formData.seoTitle,
          seoDescription: formData.seoDescription,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Product created successfully! 🎉")
        router.push("/vendor/products")
      } else {
        toast.error(data.error || "Failed to create product")
      }
    } catch (error) {
      console.error("Error creating product:", error)
      toast.error("Failed to create product")
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
                      <Input 
                        id="name" 
                        placeholder="Enter product name" 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        required 
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea 
                        id="description" 
                        placeholder="Describe your product..." 
                        rows={5} 
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        required 
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select 
                          value={formData.category}
                          onValueChange={(value) => setFormData({...formData, category: value})}
                          required
                        >
                          <SelectTrigger id="category">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            {/* Electronics & Technology */}
                            <SelectItem value="electronics">Electronics & Gadgets</SelectItem>
                            <SelectItem value="computers">Computers & Accessories</SelectItem>
                            <SelectItem value="phones">Phones & Tablets</SelectItem>
                            <SelectItem value="gaming">Gaming & Consoles</SelectItem>
                            
                            {/* Fashion & Beauty */}
                            <SelectItem value="fashion-men">Men's Fashion</SelectItem>
                            <SelectItem value="fashion-women">Women's Fashion</SelectItem>
                            <SelectItem value="fashion-kids">Kids & Baby Fashion</SelectItem>
                            <SelectItem value="shoes">Shoes & Footwear</SelectItem>
                            <SelectItem value="bags">Bags & Accessories</SelectItem>
                            <SelectItem value="beauty">Beauty & Personal Care</SelectItem>
                            <SelectItem value="jewelry">Jewelry & Watches</SelectItem>
                            
                            {/* Home & Living */}
                            <SelectItem value="home">Home & Garden</SelectItem>
                            <SelectItem value="furniture">Furniture</SelectItem>
                            <SelectItem value="appliances">Home Appliances</SelectItem>
                            <SelectItem value="kitchen">Kitchen & Dining</SelectItem>
                            <SelectItem value="decor">Home Decor</SelectItem>
                            
                            {/* Sports & Outdoors */}
                            <SelectItem value="sports">Sports & Fitness</SelectItem>
                            <SelectItem value="outdoor">Outdoor & Camping</SelectItem>
                            
                            {/* Books & Media */}
                            <SelectItem value="books">Books & Stationery</SelectItem>
                            <SelectItem value="music">Music & Instruments</SelectItem>
                            
                            {/* Food & Groceries */}
                            <SelectItem value="food">Food & Beverages</SelectItem>
                            <SelectItem value="groceries">Groceries & Essentials</SelectItem>
                            
                            {/* Health & Wellness */}
                            <SelectItem value="health">Health & Wellness</SelectItem>
                            <SelectItem value="supplements">Supplements & Vitamins</SelectItem>
                            
                            {/* Automotive */}
                            <SelectItem value="automotive">Automotive & Parts</SelectItem>
                            
                            {/* Toys & Kids */}
                            <SelectItem value="toys">Toys & Games</SelectItem>
                            <SelectItem value="baby">Baby Products</SelectItem>
                            
                            {/* Digital Products */}
                            <SelectItem value="digital-courses">Online Courses & Training</SelectItem>
                            <SelectItem value="digital-ebooks">eBooks & Digital Books</SelectItem>
                            <SelectItem value="digital-software">Software & Apps</SelectItem>
                            <SelectItem value="digital-templates">Templates & Graphics</SelectItem>
                            <SelectItem value="digital-music">Music & Audio</SelectItem>
                            <SelectItem value="digital-video">Videos & Tutorials</SelectItem>
                            <SelectItem value="digital-photography">Photography & Stock Images</SelectItem>
                            
                            {/* Services */}
                            <SelectItem value="service-consulting">Consulting & Coaching</SelectItem>
                            <SelectItem value="service-design">Design & Creative</SelectItem>
                            <SelectItem value="service-writing">Writing & Translation</SelectItem>
                            <SelectItem value="service-marketing">Marketing & Advertising</SelectItem>
                            <SelectItem value="service-tech">Tech & Programming</SelectItem>
                            <SelectItem value="service-business">Business Services</SelectItem>
                            <SelectItem value="service-education">Education & Tutoring</SelectItem>
                            <SelectItem value="service-events">Events & Entertainment</SelectItem>
                            <SelectItem value="service-repair">Repair & Maintenance</SelectItem>
                            
                            {/* Other */}
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="sku">SKU</Label>
                        <Input 
                          id="sku" 
                          placeholder="Product SKU" 
                          value={formData.sku}
                          onChange={(e) => setFormData({...formData, sku: e.target.value})}
                          required 
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Product Type */}
                <Card>
                  <CardHeader>
                    <CardTitle>Product Type</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <RadioGroup value={productType} onValueChange={(value: any) => setProductType(value)}>
                      <div className="flex items-center space-x-2 rounded-lg border p-4">
                        <RadioGroupItem value="physical" id="physical" />
                        <Label htmlFor="physical" className="flex flex-1 cursor-pointer items-center gap-3">
                          <Truck className="h-5 w-5 text-primary" />
                          <div>
                            <div className="font-medium">Physical Product</div>
                            <div className="text-sm text-muted-foreground">Tangible item that requires shipping</div>
                          </div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 rounded-lg border p-4">
                        <RadioGroupItem value="digital" id="digital" />
                        <Label htmlFor="digital" className="flex flex-1 cursor-pointer items-center gap-3">
                          <FileText className="h-5 w-5 text-primary" />
                          <div>
                            <div className="font-medium">Digital Product</div>
                            <div className="text-sm text-muted-foreground">Downloadable files (PDF, video, audio, etc.)</div>
                          </div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 rounded-lg border p-4">
                        <RadioGroupItem value="service" id="service" />
                        <Label htmlFor="service" className="flex flex-1 cursor-pointer items-center gap-3">
                          <Star className="h-5 w-5 text-primary" />
                          <div>
                            <div className="font-medium">Service</div>
                            <div className="text-sm text-muted-foreground">Consultation, booking, or service offering</div>
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>
                  </CardContent>
                </Card>

                {/* Digital Files Upload - Only show for digital products */}
                {productType === "digital" && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Digital Files</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <DigitalFileUpload
                        onFilesUploaded={setDigitalFiles}
                        existingFiles={digitalFiles}
                        maxFiles={10}
                        maxSizePerFile={500}
                      />
                      
                      <div className="grid gap-4 sm:grid-cols-2 pt-4 border-t">
                        <div className="space-y-2">
                          <Label htmlFor="accessDuration">Access Duration (days)</Label>
                          <Input
                            id="accessDuration"
                            type="number"
                            value={accessDuration}
                            onChange={(e) => setAccessDuration(Number(e.target.value))}
                            placeholder="0 for lifetime access"
                          />
                          <p className="text-xs text-muted-foreground">
                            Set to 0 for lifetime access
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="downloadLimit">Download Limit</Label>
                          <Input
                            id="downloadLimit"
                            type="number"
                            value={downloadLimit}
                            onChange={(e) => setDownloadLimit(Number(e.target.value))}
                            placeholder="0 for unlimited"
                          />
                          <p className="text-xs text-muted-foreground">
                            Set to 0 for unlimited downloads
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Pricing & Inventory */}
                <Card>
                  <CardHeader>
                    <CardTitle>Pricing & Inventory</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="price">Price</Label>
                        <Input 
                          id="price" 
                          type="number" 
                          step="0.01" 
                          placeholder="0.00" 
                          value={formData.price}
                          onChange={(e) => setFormData({...formData, price: e.target.value})}
                          required 
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="comparePrice">Compare at Price (Optional)</Label>
                        <Input 
                          id="comparePrice" 
                          type="number" 
                          step="0.01" 
                          placeholder="0.00" 
                          value={formData.compareAtPrice}
                          onChange={(e) => setFormData({...formData, compareAtPrice: e.target.value})}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="stock">Stock Quantity</Label>
                        <Input 
                          id="stock" 
                          type="number" 
                          placeholder="0" 
                          value={formData.stock}
                          onChange={(e) => setFormData({...formData, stock: e.target.value})}
                          required={productType === 'physical'}
                          disabled={productType !== 'physical'}
                        />
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
                          {uploadingImages ? (
                            <>
                              <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
                              <span className="mt-2 text-sm text-muted-foreground">Uploading...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="h-8 w-8 text-muted-foreground" />
                              <span className="mt-2 text-sm text-muted-foreground">Upload</span>
                              <span className="text-xs text-muted-foreground">{images.length}/10</span>
                            </>
                          )}
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*" 
                            multiple 
                            onChange={handleImageUpload}
                            disabled={uploadingImages}
                          />
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

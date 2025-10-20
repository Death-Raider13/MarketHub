"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/firebase/auth-context"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProtectedRoute } from "@/lib/firebase/protected-route"
import {
  Palette,
  Image as ImageIcon,
  Type,
  Layout,
  Globe,
  Eye,
  Save,
  Settings,
  Sparkles,
  RotateCcw,
  Upload,
  Store,
  Loader2,
  Megaphone,
  DollarSign,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { doc, setDoc, updateDoc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import Link from "next/link"

// Theme Presets
const THEME_PRESETS = [
  {
    name: "Ocean Breeze",
    colors: {
      primary: "#0EA5E9",
      secondary: "#06B6D4",
      background: "#F0F9FF",
      text: "#0C4A6E",
      accent: "#7DD3FC"
    }
  },
  {
    name: "Sunset Glow",
    colors: {
      primary: "#F97316",
      secondary: "#FB923C",
      background: "#FFF7ED",
      text: "#7C2D12",
      accent: "#FDBA74"
    }
  },
  {
    name: "Forest Fresh",
    colors: {
      primary: "#10B981",
      secondary: "#34D399",
      background: "#F0FDF4",
      text: "#064E3B",
      accent: "#6EE7B7"
    }
  },
  {
    name: "Royal Purple",
    colors: {
      primary: "#8B5CF6",
      secondary: "#A78BFA",
      background: "#FAF5FF",
      text: "#581C87",
      accent: "#C4B5FD"
    }
  },
  {
    name: "Rose Garden",
    colors: {
      primary: "#EC4899",
      secondary: "#F472B6",
      background: "#FDF2F8",
      text: "#831843",
      accent: "#FBCFE8"
    }
  },
  {
    name: "Midnight Pro",
    colors: {
      primary: "#1F2937",
      secondary: "#374151",
      background: "#F9FAFB",
      text: "#111827",
      accent: "#6B7280"
    }
  },
  {
    name: "Minimal White",
    colors: {
      primary: "#000000",
      secondary: "#404040",
      background: "#FFFFFF",
      text: "#171717",
      accent: "#737373"
    }
  },
  {
    name: "Bold Dark",
    colors: {
      primary: "#FBBF24",
      secondary: "#F59E0B",
      background: "#111827",
      text: "#F9FAFB",
      accent: "#FCD34D"
    }
  }
]

// Font Families
const FONT_FAMILIES = [
  { name: "Inter", subtitle: "Modern & Clean", value: "Inter, sans-serif", preview: "The quick brown fox jumps" },
  { name: "Poppins", subtitle: "Friendly & Rounded", value: "Poppins, sans-serif", preview: "The quick brown fox jumps" },
  { name: "Playfair Display", subtitle: "Elegant & Serif", value: "Playfair Display, serif", preview: "The quick brown fox jumps" },
  { name: "Roboto", subtitle: "Clean & Professional", value: "Roboto, sans-serif", preview: "The quick brown fox jumps" },
  { name: "Montserrat", subtitle: "Bold & Modern", value: "Montserrat, sans-serif", preview: "The quick brown fox jumps" },
  { name: "Lora", subtitle: "Classic & Readable", value: "Lora, serif", preview: "The quick brown fox jumps" },
]

function StoreCustomizeContent() {
  const { userProfile } = useAuth()
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  
  // Store theme state
  const [theme, setTheme] = useState({
    primaryColor: "#0EA5E9",
    secondaryColor: "#06B6D4",
    backgroundColor: "#F0F9FF",
    textColor: "#0C4A6E",
    accentColor: "#7DD3FC"
  })

  // Typography state
  const [fontFamily, setFontFamily] = useState("Inter, sans-serif")

  // Branding state (storeName removed - comes from user profile)
  const [branding, setBranding] = useState({
    tagline: "",
    description: "",
    logo: "",
    bannerImage: ""
  })

  // Layout state
  const [layout, setLayout] = useState({
    headerStyle: "centered" as "minimal" | "centered" | "full",
    productGrid: "3" as "2" | "3" | "4",
    showCategories: true,
    showSearch: true,
    showBanner: true,
  })

  // Social & Contact state
  const [social, setSocial] = useState({
    twitter: "",
    instagram: "",
    facebook: "",
    linkedin: "",
    youtube: "",
    tiktok: "",
    website: "",
  })

  // Contact state (email, phone, address removed - come from user profile)
  const [contact, setContact] = useState({
    whatsapp: "", // Optional WhatsApp (can be different from main phone)
  })

  // Content state
  const [content, setContent] = useState({
    aboutPage: "",
    returnPolicy: "",
    shippingInfo: "",
  })

  // Features state
  const [features, setFeatures] = useState({
    enableCart: true,
    enableWishlist: true,
    enableReviews: true,
    enableNewsletter: false,
    showSocialProof: true,
  })

  // Advertising state
  const [advertising, setAdvertising] = useState({
    enableAds: false,
    adPlacement: "sidebar" as "sidebar" | "banner" | "inline" | "popup",
    maxAdsPerPage: 2,
    allowedAdTypes: {
      banner: true,
      video: false,
      sponsored: true,
    }
  })

  // Load existing store settings from Firestore
  useEffect(() => {
    async function loadStoreSettings() {
      if (!userProfile?.uid) return

      try {
        const storeRef = doc(db, "storeCustomization", userProfile.uid)
        const storeDoc = await getDoc(storeRef)

        if (storeDoc.exists()) {
          const data = storeDoc.data()
          
          // Load all saved settings
          if (data.theme) setTheme(data.theme)
          if (data.fontFamily) setFontFamily(data.fontFamily)
          if (data.branding) setBranding(data.branding)
          if (data.layout) setLayout(data.layout)
          if (data.social) setSocial(data.social)
          if (data.contact) setContact(data.contact)
          if (data.content) setContent(data.content)
          if (data.features) setFeatures(data.features)
          if (data.advertising) setAdvertising(data.advertising)
          
          console.log("✅ Store settings loaded successfully")
        } else {
          console.log("ℹ️ No saved settings found, using defaults")
        }
      } catch (error) {
        console.error("Error loading store settings:", error)
        toast.error("Failed to load store settings")
      } finally {
        setLoading(false)
      }
    }

    loadStoreSettings()
  }, [userProfile?.uid])

  // Cloudinary upload function
  const uploadToCloudinary = async (file: File): Promise<string> => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

    if (!cloudName || !uploadPreset) {
      throw new Error("Cloudinary configuration missing")
    }

    const formData = new FormData()
    formData.append("file", file)
    formData.append("upload_preset", uploadPreset)

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    )

    if (!response.ok) {
      throw new Error("Upload failed")
    }

    const data = await response.json()
    return data.secure_url
  }

  // Handle logo upload
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file")
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo must be less than 2MB")
      return
    }

    setUploadingLogo(true)
    try {
      const url = await uploadToCloudinary(file)
      setBranding({ ...branding, logo: url })
      toast.success("Logo uploaded successfully!")
    } catch (error) {
      console.error("Logo upload error:", error)
      toast.error("Failed to upload logo")
    } finally {
      setUploadingLogo(false)
    }
  }

  // Handle banner upload
  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Banner must be less than 5MB")
      return
    }

    setUploadingBanner(true)
    try {
      const url = await uploadToCloudinary(file)
      setBranding({ ...branding, bannerImage: url })
      toast.success("Banner uploaded successfully!")
    } catch (error) {
      console.error("Banner upload error:", error)
      toast.error("Failed to upload banner")
    } finally {
      setUploadingBanner(false)
    }
  }

  const applyThemePreset = (preset: typeof THEME_PRESETS[0]) => {
    setTheme({
      primaryColor: preset.colors.primary,
      secondaryColor: preset.colors.secondary,
      backgroundColor: preset.colors.background,
      textColor: preset.colors.text,
      accentColor: preset.colors.accent
    })
    toast.success(`${preset.name} theme applied! 🎨`)
  }

  const handleSave = async () => {
    if (!userProfile?.uid) {
      toast.error("User not found")
      return
    }

    setSaving(true)
    try {
      // Prepare store customization data
      const storeCustomization = {
        vendorId: userProfile.uid,
        theme,
        fontFamily,
        branding,
        layout,
        social,
        contact,
        content,
        features,
        advertising,
        updatedAt: new Date()
      }

      // Save to dedicated storeCustomization collection
      const storeRef = doc(db, "storeCustomization", userProfile.uid)
      await setDoc(storeRef, storeCustomization, { merge: true })

      console.log("✅ Store settings saved to Firestore")
      toast.success("Store settings saved successfully! 🎉")
    } catch (error: any) {
      console.error("Save error:", error)
      toast.error("Failed to save settings: " + error.message)
    } finally {
      setSaving(false)
    }
  }

  // Show loading state
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 bg-muted/30 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading your store settings...</p>
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
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">
                Customize Your Store
              </h1>
              <p className="text-muted-foreground">
                Design your store exactly how you want it - just like Selar, but better!
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" asChild>
                <Link href={`/store/${userProfile?.uid}`} target="_blank">
                  <Eye className="mr-2 h-4 w-4" />
                  View My Store
                </Link>
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>

          {/* Info Banner */}
          <Card className="mb-6 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-primary/10 p-3">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Complete Control Over Your Store Design</h3>
                  <p className="text-sm text-muted-foreground">
                    Customize colors, fonts, layout, branding, and more. Changes are saved automatically and applied to your live store.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Content */}
          <Card>
            <CardContent className="p-6">
              <Tabs defaultValue="design" className="space-y-6">
                <TabsList className="grid w-full grid-cols-7">
                  <TabsTrigger value="design">
                    <Palette className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Design</span>
                  </TabsTrigger>
                  <TabsTrigger value="branding">
                    <ImageIcon className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Branding</span>
                  </TabsTrigger>
                  <TabsTrigger value="layout">
                    <Layout className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Layout</span>
                  </TabsTrigger>
                  <TabsTrigger value="content">
                    <Type className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Content</span>
                  </TabsTrigger>
                  <TabsTrigger value="social">
                    <Globe className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Social</span>
                  </TabsTrigger>
                  <TabsTrigger value="advertising">
                    <Megaphone className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Ads</span>
                  </TabsTrigger>
                  <TabsTrigger value="features">
                    <Settings className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Features</span>
                  </TabsTrigger>
                </TabsList>

                {/* Design Tab */}
                <TabsContent value="design" className="space-y-6">
                  {/* Theme Presets */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        Theme Presets
                      </CardTitle>
                      <CardDescription>
                        Choose a pre-made theme or customize your own colors below
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {THEME_PRESETS.map((preset) => (
                          <button
                            key={preset.name}
                            onClick={() => applyThemePreset(preset)}
                            className="group relative rounded-lg border-2 p-4 hover:border-primary transition-all hover:shadow-lg"
                          >
                            {/* Color Preview */}
                            <div className="flex gap-1 mb-3">
                              <div
                                className="h-8 flex-1 rounded"
                                style={{ backgroundColor: preset.colors.primary }}
                                title="Primary"
                              />
                              <div
                                className="h-8 flex-1 rounded"
                                style={{ backgroundColor: preset.colors.secondary }}
                                title="Secondary"
                              />
                              <div
                                className="h-8 flex-1 rounded"
                                style={{ backgroundColor: preset.colors.accent }}
                                title="Accent"
                              />
                            </div>
                            
                            {/* Theme Name */}
                            <p className="text-sm font-medium text-center">{preset.name}</p>
                            
                            {/* Hover Effect */}
                            <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                              <Sparkles className="h-6 w-6 text-primary" />
                            </div>
                            
                            {/* Active Indicator */}
                            {theme.primaryColor === preset.colors.primary && (
                              <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                                <Sparkles className="h-3 w-3" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                      
                      {/* Current Theme Display */}
                      <div className="mt-6 p-4 rounded-lg border bg-muted/50">
                        <p className="text-sm font-medium mb-3">Current Theme Colors:</p>
                        <div className="flex gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-8 h-8 rounded border"
                              style={{ backgroundColor: theme.primaryColor }}
                            />
                            <span className="text-xs text-muted-foreground">Primary</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-8 h-8 rounded border"
                              style={{ backgroundColor: theme.secondaryColor }}
                            />
                            <span className="text-xs text-muted-foreground">Secondary</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-8 h-8 rounded border"
                              style={{ backgroundColor: theme.backgroundColor }}
                            />
                            <span className="text-xs text-muted-foreground">Background</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-8 h-8 rounded border"
                              style={{ backgroundColor: theme.textColor }}
                            />
                            <span className="text-xs text-muted-foreground">Text</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-8 h-8 rounded border"
                              style={{ backgroundColor: theme.accentColor }}
                            />
                            <span className="text-xs text-muted-foreground">Accent</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Custom Colors */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Palette className="h-5 w-5 text-primary" />
                        Custom Colors
                      </CardTitle>
                      <CardDescription>
                        Fine-tune your brand colors or create your own unique theme
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Primary Color */}
                        <div className="space-y-2">
                          <Label htmlFor="primaryColor">Primary Color</Label>
                          <div className="flex gap-2">
                            <Input
                              id="primaryColor"
                              type="color"
                              value={theme.primaryColor}
                              onChange={(e) => setTheme({ ...theme, primaryColor: e.target.value })}
                              className="w-20 h-10 cursor-pointer"
                            />
                            <Input
                              value={theme.primaryColor}
                              onChange={(e) => setTheme({ ...theme, primaryColor: e.target.value })}
                              placeholder="#0EA5E9"
                              className="flex-1 font-mono"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Main brand color for buttons, links, and accents
                          </p>
                        </div>

                        {/* Secondary Color */}
                        <div className="space-y-2">
                          <Label htmlFor="secondaryColor">Secondary Color</Label>
                          <div className="flex gap-2">
                            <Input
                              id="secondaryColor"
                              type="color"
                              value={theme.secondaryColor}
                              onChange={(e) => setTheme({ ...theme, secondaryColor: e.target.value })}
                              className="w-20 h-10 cursor-pointer"
                            />
                            <Input
                              value={theme.secondaryColor}
                              onChange={(e) => setTheme({ ...theme, secondaryColor: e.target.value })}
                              placeholder="#06B6D4"
                              className="flex-1 font-mono"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Supporting color for highlights and variations
                          </p>
                        </div>

                        {/* Background Color */}
                        <div className="space-y-2">
                          <Label htmlFor="backgroundColor">Background Color</Label>
                          <div className="flex gap-2">
                            <Input
                              id="backgroundColor"
                              type="color"
                              value={theme.backgroundColor}
                              onChange={(e) => setTheme({ ...theme, backgroundColor: e.target.value })}
                              className="w-20 h-10 cursor-pointer"
                            />
                            <Input
                              value={theme.backgroundColor}
                              onChange={(e) => setTheme({ ...theme, backgroundColor: e.target.value })}
                              placeholder="#F0F9FF"
                              className="flex-1 font-mono"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Main background color for your store
                          </p>
                        </div>

                        {/* Text Color */}
                        <div className="space-y-2">
                          <Label htmlFor="textColor">Text Color</Label>
                          <div className="flex gap-2">
                            <Input
                              id="textColor"
                              type="color"
                              value={theme.textColor}
                              onChange={(e) => setTheme({ ...theme, textColor: e.target.value })}
                              className="w-20 h-10 cursor-pointer"
                            />
                            <Input
                              value={theme.textColor}
                              onChange={(e) => setTheme({ ...theme, textColor: e.target.value })}
                              placeholder="#0C4A6E"
                              className="flex-1 font-mono"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Main text color for readability
                          </p>
                        </div>

                        {/* Accent Color */}
                        <div className="space-y-2">
                          <Label htmlFor="accentColor">Accent Color</Label>
                          <div className="flex gap-2">
                            <Input
                              id="accentColor"
                              type="color"
                              value={theme.accentColor}
                              onChange={(e) => setTheme({ ...theme, accentColor: e.target.value })}
                              className="w-20 h-10 cursor-pointer"
                            />
                            <Input
                              value={theme.accentColor}
                              onChange={(e) => setTheme({ ...theme, accentColor: e.target.value })}
                              placeholder="#7DD3FC"
                              className="flex-1 font-mono"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Accent color for badges and highlights
                          </p>
                        </div>
                      </div>

                      {/* Reset Button */}
                      <div className="flex justify-end pt-4 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => applyThemePreset(THEME_PRESETS[0])}
                        >
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Reset to Ocean Breeze
                        </Button>
                      </div>

                      {/* Color Preview */}
                      <div className="mt-6 p-6 rounded-lg border" style={{ backgroundColor: theme.backgroundColor }}>
                        <h4 className="font-semibold mb-4" style={{ color: theme.textColor }}>
                          Preview Your Theme
                        </h4>
                        <div className="space-y-3">
                          <Button
                            style={{
                              backgroundColor: theme.primaryColor,
                              color: '#ffffff'
                            }}
                            className="w-full"
                          >
                            Primary Button
                          </Button>
                          <Button
                            variant="outline"
                            style={{
                              borderColor: theme.secondaryColor,
                              color: theme.secondaryColor
                            }}
                            className="w-full"
                          >
                            Secondary Button
                          </Button>
                          <div
                            className="p-3 rounded"
                            style={{
                              backgroundColor: theme.accentColor + '20',
                              borderLeft: `4px solid ${theme.accentColor}`
                            }}
                          >
                            <p style={{ color: theme.textColor }} className="text-sm">
                              This is how your content will look with your custom colors.
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Typography */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Type className="h-5 w-5 text-primary" />
                        Typography
                      </CardTitle>
                      <CardDescription>
                        Choose the perfect font for your store's personality
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {FONT_FAMILIES.map((font) => (
                          <button
                            key={font.value}
                            onClick={() => {
                              setFontFamily(font.value)
                              toast.success(`${font.name} font applied! ✍️`)
                            }}
                            className={`p-4 rounded-lg border-2 text-left transition-all hover:shadow-md ${
                              fontFamily === font.value
                                ? 'border-primary bg-primary/5 shadow-md'
                                : 'border-muted hover:border-primary/50'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="font-semibold text-base" style={{ fontFamily: font.value }}>
                                  {font.name}
                                </p>
                                <p className="text-xs text-muted-foreground">{font.subtitle}</p>
                              </div>
                              {fontFamily === font.value && (
                                <div className="bg-primary text-primary-foreground rounded-full p-1">
                                  <Sparkles className="h-3 w-3" />
                                </div>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground" style={{ fontFamily: font.value }}>
                              {font.preview}
                            </p>
                          </button>
                        ))}
                      </div>

                      {/* Font Preview */}
                      <div className="mt-6 p-6 rounded-lg border bg-muted/50">
                        <p className="text-sm text-muted-foreground mb-3">Preview with your font:</p>
                        <div className="space-y-3" style={{ fontFamily: fontFamily }}>
                          <h1 className="text-3xl font-bold">Welcome to Our Store</h1>
                          <h2 className="text-2xl font-semibold">Featured Products</h2>
                          <p className="text-base">
                            Discover amazing products at great prices. Shop now and enjoy free shipping on orders over ₦50,000.
                          </p>
                          <div className="flex gap-2">
                            <span className="text-sm px-3 py-1 bg-primary/10 rounded">New Arrival</span>
                            <span className="text-sm px-3 py-1 bg-primary/10 rounded">Best Seller</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Branding Tab */}
                <TabsContent value="branding" className="space-y-6">
                  {/* Store Identity */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        Store Identity
                      </CardTitle>
                      <CardDescription>
                        Your store's basic information that customers will see
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Read-only Store Info from Profile */}
                      <div className="bg-muted/50 p-4 rounded-lg space-y-3 border">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-xs text-muted-foreground">Store Name (from Profile)</Label>
                            <p className="font-semibold text-lg">{userProfile?.storeName || "Not set"}</p>
                          </div>
                          <Button asChild variant="outline" size="sm">
                            <Link href="/vendor/profile">
                              Edit Profile →
                            </Link>
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          To change your store name, email, or phone, edit your profile settings
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="tagline">Tagline</Label>
                        <Input
                          id="tagline"
                          value={branding.tagline}
                          onChange={(e) => setBranding({ ...branding, tagline: e.target.value })}
                          placeholder="Quality products, delivered with care"
                        />
                        <p className="text-xs text-muted-foreground">
                          A short, catchy phrase that describes your store
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">Store Description</Label>
                        <Textarea
                          id="description"
                          value={branding.description}
                          onChange={(e) => setBranding({ ...branding, description: e.target.value })}
                          placeholder="Tell customers about your store, your mission, and what makes you unique..."
                          rows={4}
                        />
                        <p className="text-xs text-muted-foreground">
                          {branding.description.length}/500 characters
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Logo & Images */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ImageIcon className="h-5 w-5 text-primary" />
                        Logo & Images
                      </CardTitle>
                      <CardDescription>
                        Upload your brand assets to make your store stand out
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Logo Upload */}
                      <div className="space-y-3">
                        <Label>Store Logo</Label>
                        <div className="flex items-start gap-4">
                          <div className="w-32 h-32 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center bg-muted/30 overflow-hidden">
                            {uploadingLogo ? (
                              <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            ) : branding.logo ? (
                              <img src={branding.logo} alt="Logo" className="w-full h-full object-cover" />
                            ) : (
                              <Upload className="h-10 w-10 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex gap-2">
                              <input
                                type="file"
                                id="logo-upload"
                                accept="image/*"
                                onChange={handleLogoUpload}
                                className="hidden"
                                disabled={uploadingLogo}
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => document.getElementById('logo-upload')?.click()}
                                disabled={uploadingLogo}
                              >
                                <Upload className="mr-2 h-4 w-4" />
                                {uploadingLogo ? "Uploading..." : "Upload Logo"}
                              </Button>
                              {branding.logo && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setBranding({ ...branding, logo: "" })}
                                  disabled={uploadingLogo}
                                >
                                  Remove
                                </Button>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground space-y-1">
                              <p>• Recommended: 200x200px</p>
                              <p>• PNG with transparent background</p>
                              <p>• Max file size: 2MB</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Banner Upload */}
                      <div className="space-y-3">
                        <Label>Banner Image</Label>
                        <div className="space-y-3">
                          <div className="w-full h-40 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center bg-muted/30 overflow-hidden">
                            {uploadingBanner ? (
                              <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            ) : branding.bannerImage ? (
                              <img src={branding.bannerImage} alt="Banner" className="w-full h-full object-cover" />
                            ) : (
                              <div className="text-center">
                                <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                                <p className="text-sm text-muted-foreground">Upload banner image</p>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="file"
                              id="banner-upload"
                              accept="image/*"
                              onChange={handleBannerUpload}
                              className="hidden"
                              disabled={uploadingBanner}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => document.getElementById('banner-upload')?.click()}
                              disabled={uploadingBanner}
                            >
                              <Upload className="mr-2 h-4 w-4" />
                              {uploadingBanner ? "Uploading..." : "Upload Banner"}
                            </Button>
                            {branding.bannerImage && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setBranding({ ...branding, bannerImage: "" })}
                                disabled={uploadingBanner}
                              >
                                Remove
                              </Button>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground space-y-1">
                            <p>• Recommended: 1920x400px</p>
                            <p>• JPG or PNG format</p>
                            <p>• Max file size: 5MB</p>
                          </div>
                        </div>
                      </div>

                      {/* Preview */}
                      <div className="mt-6 p-6 rounded-lg border bg-muted/50">
                        <p className="text-sm font-medium mb-4">Preview:</p>
                        <div className="space-y-3">
                          {/* Header Preview */}
                          <div className="flex items-center gap-3 p-4 bg-background rounded-lg border">
                            {branding.logo ? (
                              <img src={branding.logo} alt="Logo" className="w-12 h-12 object-contain" />
                            ) : (
                              <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                                <Store className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <p className="font-semibold">{userProfile?.storeName || "Your Store Name"}</p>
                              {branding.tagline && (
                                <p className="text-xs text-muted-foreground">{branding.tagline}</p>
                              )}
                            </div>
                          </div>

                          {/* Banner Preview */}
                          {branding.bannerImage && (
                            <div className="rounded-lg overflow-hidden border">
                              <img src={branding.bannerImage} alt="Banner" className="w-full h-32 object-cover" />
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Layout Tab */}
                <TabsContent value="layout" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Layout className="h-5 w-5 text-primary" />
                        Page Layout
                      </CardTitle>
                      <CardDescription>
                        Customize how your store looks and feels
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Header Style */}
                      <div className="space-y-3">
                        <Label>Header Style</Label>
                        <div className="grid grid-cols-3 gap-3">
                          {(['minimal', 'centered', 'full'] as const).map((style) => (
                            <button
                              key={style}
                              onClick={() => setLayout({ ...layout, headerStyle: style })}
                              className={`p-4 rounded-lg border-2 transition-all ${
                                layout.headerStyle === style
                                  ? 'border-primary bg-primary/5'
                                  : 'border-muted hover:border-primary/50'
                              }`}
                            >
                              <div className="h-12 bg-muted rounded mb-2 flex items-center justify-center">
                                <Store className="h-6 w-6" />
                              </div>
                              <p className="text-xs font-medium capitalize">{style}</p>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Product Grid */}
                      <div className="space-y-3">
                        <Label>Product Grid Columns</Label>
                        <div className="grid grid-cols-3 gap-3">
                          {(['2', '3', '4'] as const).map((cols) => (
                            <button
                              key={cols}
                              onClick={() => setLayout({ ...layout, productGrid: cols })}
                              className={`p-4 rounded-lg border-2 transition-all ${
                                layout.productGrid === cols
                                  ? 'border-primary bg-primary/5'
                                  : 'border-muted hover:border-primary/50'
                              }`}
                            >
                              <div className={`grid grid-cols-${cols} gap-1 mb-2`}>
                                {Array.from({ length: parseInt(cols) }).map((_, i) => (
                                  <div key={i} className="h-8 bg-muted rounded" />
                                ))}
                              </div>
                              <p className="text-xs font-medium">{cols} Columns</p>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Toggles */}
                      <div className="space-y-4 pt-4 border-t">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Show Categories</Label>
                            <p className="text-xs text-muted-foreground">Display product categories</p>
                          </div>
                          <Switch
                            checked={layout.showCategories}
                            onCheckedChange={(checked) => setLayout({ ...layout, showCategories: checked })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Show Search Bar</Label>
                            <p className="text-xs text-muted-foreground">Enable product search</p>
                          </div>
                          <Switch
                            checked={layout.showSearch}
                            onCheckedChange={(checked) => setLayout({ ...layout, showSearch: checked })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Show Banner</Label>
                            <p className="text-xs text-muted-foreground">Display banner image</p>
                          </div>
                          <Switch
                            checked={layout.showBanner}
                            onCheckedChange={(checked) => setLayout({ ...layout, showBanner: checked })}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Content Tab */}
                <TabsContent value="content" className="space-y-6">
                  {/* About Page */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Type className="h-5 w-5 text-primary" />
                        About Your Store
                      </CardTitle>
                      <CardDescription>
                        Tell customers about your store, mission, and what makes you unique
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="aboutPage">About Page Content</Label>
                        <Textarea
                          id="aboutPage"
                          value={content.aboutPage}
                          onChange={(e) => setContent({ ...content, aboutPage: e.target.value })}
                          placeholder="Write about your store's story, mission, values, and what makes you special...

Example:
- When and why you started
- What products you offer
- Your commitment to quality
- What makes you different
- Your values and mission"
                          rows={10}
                          className="font-sans"
                        />
                        <p className="text-xs text-muted-foreground">
                          {content.aboutPage.length} characters • This will appear on your store's About page
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Return Policy */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Return & Refund Policy</CardTitle>
                      <CardDescription>
                        Set clear expectations for returns and refunds
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="returnPolicy">Return Policy</Label>
                        <Textarea
                          id="returnPolicy"
                          value={content.returnPolicy}
                          onChange={(e) => setContent({ ...content, returnPolicy: e.target.value })}
                          placeholder="Describe your return policy...

Example:
- Return window (e.g., 7 days, 14 days, 30 days)
- Conditions for returns
- Refund process
- Items that cannot be returned
- How to initiate a return"
                          rows={8}
                        />
                        <p className="text-xs text-muted-foreground">
                          {content.returnPolicy.length} characters
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Shipping Info */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Shipping Information</CardTitle>
                      <CardDescription>
                        Provide shipping details and delivery expectations
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="shippingInfo">Shipping Details</Label>
                        <Textarea
                          id="shippingInfo"
                          value={content.shippingInfo}
                          onChange={(e) => setContent({ ...content, shippingInfo: e.target.value })}
                          placeholder="Describe your shipping process...

Example:
- Delivery timeframes
- Shipping costs
- Available locations
- Tracking information
- Packaging details
- Express shipping options"
                          rows={8}
                        />
                        <p className="text-xs text-muted-foreground">
                          {content.shippingInfo.length} characters
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Future Features */}
                  <Card>
                    <CardContent className="p-6">
                      <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-4">
                        <p className="text-sm text-blue-900 dark:text-blue-100">
                          <Sparkles className="inline h-4 w-4 mr-1" />
                          <strong>Coming Soon:</strong> FAQ builder, custom pages, and more!
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Social Tab */}
                <TabsContent value="social" className="space-y-6">
                  {/* Social Media */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Globe className="h-5 w-5 text-primary" />
                        Social Media Links
                      </CardTitle>
                      <CardDescription>
                        Connect your social profiles to your store
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="twitter">Twitter/X</Label>
                          <Input
                            id="twitter"
                            placeholder="@yourhandle"
                            value={social.twitter}
                            onChange={(e) => setSocial({ ...social, twitter: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="instagram">Instagram</Label>
                          <Input
                            id="instagram"
                            placeholder="@yourhandle"
                            value={social.instagram}
                            onChange={(e) => setSocial({ ...social, instagram: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="facebook">Facebook</Label>
                          <Input
                            id="facebook"
                            placeholder="Your page name"
                            value={social.facebook}
                            onChange={(e) => setSocial({ ...social, facebook: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="linkedin">LinkedIn</Label>
                          <Input
                            id="linkedin"
                            placeholder="Your profile"
                            value={social.linkedin}
                            onChange={(e) => setSocial({ ...social, linkedin: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="youtube">YouTube</Label>
                          <Input
                            id="youtube"
                            placeholder="Channel name"
                            value={social.youtube}
                            onChange={(e) => setSocial({ ...social, youtube: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="tiktok">TikTok</Label>
                          <Input
                            id="tiktok"
                            placeholder="@yourhandle"
                            value={social.tiktok}
                            onChange={(e) => setSocial({ ...social, tiktok: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="website">Website</Label>
                          <Input
                            id="website"
                            type="url"
                            placeholder="https://yourwebsite.com"
                            value={social.website}
                            onChange={(e) => setSocial({ ...social, website: e.target.value })}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Contact Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Contact Information</CardTitle>
                      <CardDescription>
                        How customers can reach you
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Read-only Contact Info from Profile */}
                      <div className="bg-muted/50 p-4 rounded-lg space-y-3 border">
                        <div className="flex items-center justify-between mb-3">
                          <Label className="text-sm font-semibold">Contact Information (from Profile)</Label>
                          <Button asChild variant="outline" size="sm">
                            <Link href="/vendor/profile">
                              Edit Profile →
                            </Link>
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs text-muted-foreground">Email</Label>
                            <p className="font-medium">{userProfile?.email || "Not set"}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Phone</Label>
                            <p className="font-medium">{userProfile?.phone || "Not set"}</p>
                          </div>
                          <div className="md:col-span-2">
                            <Label className="text-xs text-muted-foreground">Address</Label>
                            <p className="font-medium">
                              {userProfile?.address?.addressLine1 || "Not set"}
                              {userProfile?.address?.city && `, ${userProfile.address.city}`}
                              {userProfile?.address?.state && `, ${userProfile.address.state}`}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Optional WhatsApp (can be different from main phone) */}
                      <div className="space-y-2">
                        <Label htmlFor="whatsapp">WhatsApp Number (Optional)</Label>
                        <Input
                          id="whatsapp"
                          type="tel"
                          placeholder="+234 800 000 0000"
                          value={contact.whatsapp}
                          onChange={(e) => setContact({ ...contact, whatsapp: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground">
                          If different from your main phone number
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Advertising Tab */}
                <TabsContent value="advertising" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Megaphone className="h-5 w-5 text-primary" />
                        Advertising Space
                      </CardTitle>
                      <CardDescription>
                        Monetize your store by displaying ads (Unique Feature!)
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Enable Ads */}
                      <div className="rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 p-6 border border-green-200">
                        <div className="flex items-start gap-4">
                          <div className="rounded-full bg-green-500 p-3">
                            <DollarSign className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold mb-2 text-green-900 dark:text-green-100">
                              Earn Extra Revenue with Ads!
                            </h3>
                            <p className="text-sm text-green-800 dark:text-green-200 mb-4">
                              Enable advertising on your store and earn money from ad impressions. You control where ads appear and what types are allowed.
                            </p>
                            <div className="flex items-center justify-between">
                              <div>
                                <Label className="text-green-900 dark:text-green-100">Enable Advertising</Label>
                                <p className="text-xs text-green-700 dark:text-green-300">Start earning from ads</p>
                              </div>
                              <Switch
                                checked={advertising.enableAds}
                                onCheckedChange={(checked) => setAdvertising({ ...advertising, enableAds: checked })}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Ad Settings (only show if ads enabled) */}
                      {advertising.enableAds && (
                        <>
                          {/* Ad Placement */}
                          <div className="space-y-3">
                            <Label>Ad Placement</Label>
                            <p className="text-sm text-muted-foreground mb-3">
                              Choose where ads will appear on your store
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                              {([
                                { value: 'sidebar', label: 'Sidebar', desc: 'Right side of page' },
                                { value: 'banner', label: 'Banner', desc: 'Top of page' },
                                { value: 'inline', label: 'Inline', desc: 'Between products' },
                                { value: 'popup', label: 'Popup', desc: 'Occasional popup' },
                              ] as const).map((placement) => (
                                <button
                                  key={placement.value}
                                  onClick={() => setAdvertising({ ...advertising, adPlacement: placement.value })}
                                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                                    advertising.adPlacement === placement.value
                                      ? 'border-primary bg-primary/5'
                                      : 'border-muted hover:border-primary/50'
                                  }`}
                                >
                                  <p className="font-medium mb-1">{placement.label}</p>
                                  <p className="text-xs text-muted-foreground">{placement.desc}</p>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Max Ads Per Page */}
                          <div className="space-y-3">
                            <Label htmlFor="maxAds">Maximum Ads Per Page</Label>
                            <p className="text-sm text-muted-foreground mb-2">
                              Control how many ads appear on each page
                            </p>
                            <div className="flex items-center gap-4">
                              <Input
                                id="maxAds"
                                type="number"
                                min="1"
                                max="5"
                                value={advertising.maxAdsPerPage}
                                onChange={(e) => setAdvertising({ ...advertising, maxAdsPerPage: parseInt(e.target.value) || 1 })}
                                className="w-24"
                              />
                              <span className="text-sm text-muted-foreground">ads per page</span>
                            </div>
                          </div>

                          {/* Allowed Ad Types */}
                          <div className="space-y-3">
                            <Label>Allowed Ad Types</Label>
                            <p className="text-sm text-muted-foreground mb-3">
                              Choose which types of ads can appear
                            </p>
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <Label>Banner Ads</Label>
                                  <p className="text-xs text-muted-foreground">Static image ads</p>
                                </div>
                                <Switch
                                  checked={advertising.allowedAdTypes.banner}
                                  onCheckedChange={(checked) => 
                                    setAdvertising({ 
                                      ...advertising, 
                                      allowedAdTypes: { ...advertising.allowedAdTypes, banner: checked }
                                    })
                                  }
                                />
                              </div>
                              <div className="flex items-center justify-between">
                                <div>
                                  <Label>Video Ads</Label>
                                  <p className="text-xs text-muted-foreground">Short video advertisements</p>
                                </div>
                                <Switch
                                  checked={advertising.allowedAdTypes.video}
                                  onCheckedChange={(checked) => 
                                    setAdvertising({ 
                                      ...advertising, 
                                      allowedAdTypes: { ...advertising.allowedAdTypes, video: checked }
                                    })
                                  }
                                />
                              </div>
                              <div className="flex items-center justify-between">
                                <div>
                                  <Label>Sponsored Products</Label>
                                  <p className="text-xs text-muted-foreground">Product recommendations</p>
                                </div>
                                <Switch
                                  checked={advertising.allowedAdTypes.sponsored}
                                  onCheckedChange={(checked) => 
                                    setAdvertising({ 
                                      ...advertising, 
                                      allowedAdTypes: { ...advertising.allowedAdTypes, sponsored: checked }
                                    })
                                  }
                                />
                              </div>
                            </div>
                          </div>

                          {/* Revenue Info */}
                          <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-4 border border-blue-200">
                            <h4 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">
                              💰 Estimated Earnings
                            </h4>
                            <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                              Based on your settings, you could earn:
                            </p>
                            <div className="grid grid-cols-3 gap-3">
                              <div className="bg-white dark:bg-gray-900 rounded p-3 text-center">
                                <p className="text-xs text-muted-foreground">Per 1K Views</p>
                                <p className="text-lg font-bold text-primary">₦500-2K</p>
                              </div>
                              <div className="bg-white dark:bg-gray-900 rounded p-3 text-center">
                                <p className="text-xs text-muted-foreground">Monthly Est.</p>
                                <p className="text-lg font-bold text-primary">₦5K-50K</p>
                              </div>
                              <div className="bg-white dark:bg-gray-900 rounded p-3 text-center">
                                <p className="text-xs text-muted-foreground">Your Share</p>
                                <p className="text-lg font-bold text-primary">70%</p>
                              </div>
                            </div>
                            <p className="text-xs text-blue-700 dark:text-blue-300 mt-3">
                              * Earnings depend on traffic, ad placement, and engagement
                            </p>
                          </div>
                        </>
                      )}

                      {/* CTA if ads disabled */}
                      {!advertising.enableAds && (
                        <div className="text-center py-8">
                          <Megaphone className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                          <h3 className="text-lg font-semibold mb-2">Start Earning Today!</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Enable advertising to monetize your store traffic
                          </p>
                          <Button
                            onClick={() => setAdvertising({ ...advertising, enableAds: true })}
                          >
                            <DollarSign className="mr-2 h-4 w-4" />
                            Enable Advertising
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Features Tab */}
                <TabsContent value="features" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5 text-primary" />
                        Store Features
                      </CardTitle>
                      <CardDescription>
                        Enable or disable features for your store
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Shopping Cart</Label>
                          <p className="text-xs text-muted-foreground">Allow customers to add items to cart</p>
                        </div>
                        <Switch
                          checked={features.enableCart}
                          onCheckedChange={(checked) => setFeatures({ ...features, enableCart: checked })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Wishlist</Label>
                          <p className="text-xs text-muted-foreground">Let customers save favorite items</p>
                        </div>
                        <Switch
                          checked={features.enableWishlist}
                          onCheckedChange={(checked) => setFeatures({ ...features, enableWishlist: checked })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Product Reviews</Label>
                          <p className="text-xs text-muted-foreground">Allow product reviews and ratings</p>
                        </div>
                        <Switch
                          checked={features.enableReviews}
                          onCheckedChange={(checked) => setFeatures({ ...features, enableReviews: checked })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Newsletter Signup</Label>
                          <p className="text-xs text-muted-foreground">Email subscription form</p>
                        </div>
                        <Switch
                          checked={features.enableNewsletter}
                          onCheckedChange={(checked) => setFeatures({ ...features, enableNewsletter: checked })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Social Proof</Label>
                          <p className="text-xs text-muted-foreground">Display recent purchases notifications</p>
                        </div>
                        <Switch
                          checked={features.showSocialProof}
                          onCheckedChange={(checked) => setFeatures({ ...features, showSocialProof: checked })}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default function StoreCustomizePage() {
  return (
    <ProtectedRoute allowedRoles={["vendor"]}>
      <StoreCustomizeContent />
    </ProtectedRoute>
  )
}

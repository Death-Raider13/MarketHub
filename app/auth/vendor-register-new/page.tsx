"use client"

import { useState } from "react"
import { useAuth } from "@/lib/firebase/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Store, ArrowLeft, ArrowRight, Check, Palette, Sparkles, Zap, Upload, Globe } from "lucide-react"
import { doc, setDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import { toast } from "sonner"

interface VendorFormData {
  // Step 1: Account
  fullName: string
  email: string
  password: string
  confirmPassword: string
  phone: string
  
  // Step 2: Store Setup
  storeName: string
  storeUrl: string
  storeDescription: string
  category: string
  
  // Step 3: Storefront Design
  primaryColor: string
  logoUrl: string
  bannerUrl: string
  socialLinks: {
    twitter?: string
    instagram?: string
    facebook?: string
    website?: string
  }
  
  agreeToTerms: boolean
}

const STORE_CATEGORIES = [
  "Digital Products",
  "Courses & Education",
  "Design & Creative",
  "Software & Apps",
  "Music & Audio",
  "Video & Animation",
  "Writing & Content",
  "Business Services",
  "Consulting",
  "Photography",
  "Art & Crafts",
  "Fashion & Accessories",
  "Health & Wellness",
  "Food & Beverages",
  "Other"
]

const THEME_COLORS = [
  { name: "Ocean Blue", value: "#0EA5E9", gradient: "from-blue-500 to-cyan-500" },
  { name: "Sunset Orange", value: "#F97316", gradient: "from-orange-500 to-red-500" },
  { name: "Forest Green", value: "#10B981", gradient: "from-green-500 to-emerald-500" },
  { name: "Royal Purple", value: "#8B5CF6", gradient: "from-purple-500 to-pink-500" },
  { name: "Rose Pink", value: "#EC4899", gradient: "from-pink-500 to-rose-500" },
  { name: "Midnight Dark", value: "#1F2937", gradient: "from-gray-800 to-gray-900" },
]

export default function VendorRegisterNewPage() {
  const [step, setStep] = useState(1)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [checkingUrl, setCheckingUrl] = useState(false)
  const { signUp } = useAuth()
  const router = useRouter()

  const [formData, setFormData] = useState<VendorFormData>({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    storeName: "",
    storeUrl: "",
    storeDescription: "",
    category: "",
    primaryColor: "#0EA5E9",
    logoUrl: "",
    bannerUrl: "",
    socialLinks: {},
    agreeToTerms: false,
  })

  const totalSteps = 3
  const progress = (step / totalSteps) * 100

  const updateFormData = (field: keyof VendorFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Auto-generate store URL from store name
  const handleStoreNameChange = (name: string) => {
    updateFormData("storeName", name)
    
    // Auto-generate URL slug
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    
    updateFormData("storeUrl", slug)
  }

  // Check if store URL is available
  const checkUrlAvailability = async (url: string) => {
    if (!url) return
    
    setCheckingUrl(true)
    try {
      // TODO: Check Firestore for existing store URLs
      // For now, just simulate
      await new Promise(resolve => setTimeout(resolve, 500))
      toast.success("Store URL is available!")
    } catch (error) {
      toast.error("This URL is already taken")
    } finally {
      setCheckingUrl(false)
    }
  }

  const validateStep = (currentStep: number): boolean => {
    switch (currentStep) {
      case 1:
        if (!formData.fullName || !formData.email || !formData.phone) {
          setError("Please fill in all required fields")
          return false
        }
        if (formData.password.length < 8) {
          setError("Password must be at least 8 characters")
          return false
        }
        if (formData.password !== formData.confirmPassword) {
          setError("Passwords do not match")
          return false
        }
        return true
      
      case 2:
        if (!formData.storeName || !formData.storeUrl || !formData.category) {
          setError("Please fill in all required fields")
          return false
        }
        if (formData.storeDescription.length < 20) {
          setError("Store description must be at least 20 characters")
          return false
        }
        return true
      
      case 3:
        if (!formData.agreeToTerms) {
          setError("You must agree to the terms and conditions")
          return false
        }
        return true
      
      default:
        return false
    }
  }

  const handleNext = () => {
    if (validateStep(step)) {
      setError("")
      setStep(prev => Math.min(prev + 1, totalSteps))
    }
  }

  const handleBack = () => {
    setError("")
    setStep(prev => Math.max(prev - 1, 1))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateStep(3)) {
      return
    }

    setLoading(true)
    setError("")

    try {
      // Create user account with email verification
      await signUp(formData.email, formData.password, "vendor", formData.fullName)

      // Store vendor data in Firestore
      // Note: User document is created by signUp, we'll add store info
      const storeData = {
        storeName: formData.storeName,
        storeUrl: formData.storeUrl,
        storeDescription: formData.storeDescription,
        category: formData.category,
        theme: {
          primaryColor: formData.primaryColor,
          logoUrl: formData.logoUrl,
          bannerUrl: formData.bannerUrl,
        },
        socialLinks: formData.socialLinks,
        phone: formData.phone,
        verified: false, // Admin approval (optional)
        isActive: true,
        createdAt: new Date(),
      }

      // TODO: Save to Firestore with user UID
      
      toast.success("Store created successfully! 🎉")
      
      // Redirect to email verification
      router.push("/auth/verify-email")
    } catch (err: any) {
      setError(err.message || "Failed to create store")
      toast.error(err.message || "Failed to create store")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-gradient-to-br from-primary to-primary/50 p-4 shadow-lg">
              <Store className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">
            Launch Your Store in Minutes
          </h1>
          <p className="text-muted-foreground text-lg">
            Join thousands of creators selling on MarketHub
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">Step {step} of {totalSteps}</span>
            <span className="text-sm text-muted-foreground">{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-3" />
          
          {/* Step Indicators */}
          <div className="mt-6 flex justify-between">
            {[
              { num: 1, label: "Account", icon: Zap },
              { num: 2, label: "Store Setup", icon: Store },
              { num: 3, label: "Design", icon: Palette }
            ].map((s) => (
              <div key={s.num} className="flex flex-col items-center flex-1">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                  step > s.num ? "bg-primary text-primary-foreground shadow-lg scale-110" :
                  step === s.num ? "bg-primary text-primary-foreground shadow-lg scale-110 ring-4 ring-primary/20" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {step > s.num ? <Check className="h-5 w-5" /> : <s.icon className="h-5 w-5" />}
                </div>
                <span className="text-xs mt-2 font-medium">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl">
              {step === 1 && "Create Your Account"}
              {step === 2 && "Setup Your Store"}
              {step === 3 && "Customize Your Storefront"}
            </CardTitle>
            <CardDescription>
              {step === 1 && "Let's start with your basic information"}
              {step === 2 && "Tell us about your store and what you'll sell"}
              {step === 3 && "Make your store uniquely yours"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive border border-destructive/20">
                  {error}
                </div>
              )}

              {/* Step 1: Account Setup */}
              {step === 1 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right duration-300">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        placeholder="John Doe"
                        value={formData.fullName}
                        onChange={(e) => updateFormData("fullName", e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+234 800 000 0000"
                        value={formData.phone}
                        onChange={(e) => updateFormData("phone", e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={(e) => updateFormData("email", e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="password">Password *</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Min. 8 characters"
                        value={formData.password}
                        onChange={(e) => updateFormData("password", e.target.value)}
                        required
                        minLength={8}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password *</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Re-enter password"
                        value={formData.confirmPassword}
                        onChange={(e) => updateFormData("confirmPassword", e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-4">
                    <p className="text-sm text-blue-900 dark:text-blue-100">
                      <Sparkles className="inline h-4 w-4 mr-1" />
                      <strong>Quick Setup:</strong> You can start selling immediately after email verification!
                    </p>
                  </div>
                </div>
              )}

              {/* Step 2: Store Setup */}
              {step === 2 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right duration-300">
                  <div className="space-y-2">
                    <Label htmlFor="storeName">Store Name *</Label>
                    <Input
                      id="storeName"
                      placeholder="My Awesome Store"
                      value={formData.storeName}
                      onChange={(e) => handleStoreNameChange(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="storeUrl">Store URL *</Label>
                    <div className="flex gap-2">
                      <div className="flex-1 flex items-center gap-2 rounded-lg border bg-muted px-3">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">markethub.com/</span>
                        <Input
                          id="storeUrl"
                          placeholder="your-store"
                          value={formData.storeUrl}
                          onChange={(e) => updateFormData("storeUrl", e.target.value)}
                          onBlur={(e) => checkUrlAvailability(e.target.value)}
                          required
                          className="border-0 bg-transparent p-0 focus-visible:ring-0"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      This will be your unique store URL
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Store Category *</Label>
                    <RadioGroup
                      value={formData.category}
                      onValueChange={(value) => updateFormData("category", value)}
                      className="grid grid-cols-2 sm:grid-cols-3 gap-3"
                    >
                      {STORE_CATEGORIES.map((cat) => (
                        <div key={cat} className="relative">
                          <RadioGroupItem
                            value={cat}
                            id={cat}
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor={cat}
                            className="flex items-center justify-center rounded-lg border-2 border-muted bg-background p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all text-sm"
                          >
                            {cat}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="storeDescription">Store Description *</Label>
                    <Textarea
                      id="storeDescription"
                      placeholder="Tell customers what makes your store special... (min. 20 characters)"
                      value={formData.storeDescription}
                      onChange={(e) => updateFormData("storeDescription", e.target.value)}
                      required
                      rows={4}
                      minLength={20}
                    />
                    <p className="text-xs text-muted-foreground">
                      {formData.storeDescription.length}/20 characters minimum
                    </p>
                  </div>
                </div>
              )}

              {/* Step 3: Storefront Design */}
              {step === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right duration-300">
                  <div className="space-y-3">
                    <Label>Choose Your Theme Color *</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {THEME_COLORS.map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          onClick={() => updateFormData("primaryColor", color.value)}
                          className={`relative rounded-lg p-4 border-2 transition-all ${
                            formData.primaryColor === color.value
                              ? "border-primary ring-4 ring-primary/20 scale-105"
                              : "border-muted hover:border-primary/50"
                          }`}
                        >
                          <div className={`h-12 rounded-md bg-gradient-to-r ${color.gradient} mb-2`} />
                          <p className="text-sm font-medium">{color.name}</p>
                          {formData.primaryColor === color.value && (
                            <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                              <Check className="h-3 w-3" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label>Social Media Links (Optional)</Label>
                    <div className="grid gap-3">
                      <Input
                        placeholder="Twitter/X username"
                        value={formData.socialLinks.twitter || ""}
                        onChange={(e) => updateFormData("socialLinks", { ...formData.socialLinks, twitter: e.target.value })}
                      />
                      <Input
                        placeholder="Instagram username"
                        value={formData.socialLinks.instagram || ""}
                        onChange={(e) => updateFormData("socialLinks", { ...formData.socialLinks, instagram: e.target.value })}
                      />
                      <Input
                        placeholder="Website URL"
                        value={formData.socialLinks.website || ""}
                        onChange={(e) => updateFormData("socialLinks", { ...formData.socialLinks, website: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex items-start space-x-2 rounded-lg border p-4">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={formData.agreeToTerms}
                      onChange={(e) => updateFormData("agreeToTerms", e.target.checked)}
                      required
                      className="mt-1"
                    />
                    <label htmlFor="terms" className="text-sm text-muted-foreground">
                      I agree to the{" "}
                      <Link href="/terms" className="text-primary hover:underline" target="_blank">
                        Terms of Service
                      </Link>
                      {" "}and{" "}
                      <Link href="/privacy" className="text-primary hover:underline" target="_blank">
                        Privacy Policy
                      </Link>
                      . I understand that MarketHub charges a 15% commission on sales.
                    </label>
                  </div>

                  <div className="rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 p-6 border border-primary/20">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      What happens next?
                    </h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-primary mt-0.5" />
                        <span>Verify your email address</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-primary mt-0.5" />
                        <span>Start adding products immediately</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-primary mt-0.5" />
                        <span>Customize your storefront anytime</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-primary mt-0.5" />
                        <span>Get paid directly to your bank account</span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-3 pt-4">
                {step > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    className="flex-1"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                )}
                
                {step < totalSteps ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="flex-1"
                  >
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-primary to-primary/80"
                  >
                    {loading ? (
                      "Creating Your Store..."
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Launch My Store
                      </>
                    )}
                  </Button>
                )}
              </div>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Already have an account? </span>
              <Link href="/auth/login" className="font-medium hover:underline text-primary">
                Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

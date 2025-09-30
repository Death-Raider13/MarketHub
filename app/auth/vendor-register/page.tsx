"use client"

import { useState } from "react"
import { useAuth } from "@/lib/firebase/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Store, ArrowLeft, ArrowRight, Check, Upload, Building2, FileText, CreditCard } from "lucide-react"
import { doc, setDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/config"

interface VendorData {
  // Personal Information
  fullName: string
  email: string
  password: string
  phone: string
  
  // Business Information
  businessName: string
  businessType: string
  businessRegistrationNumber: string
  taxId: string
  yearEstablished: string
  
  // Store Information
  storeName: string
  storeDescription: string
  storeCategory: string[]
  
  // Business Address
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  zipCode: string
  country: string
  
  // Bank Information
  bankName: string
  accountHolderName: string
  accountNumber: string
  routingNumber: string
  
  // Legal & Compliance
  agreeToTerms: boolean
  agreeToCommission: boolean
  businessLicense: File | null
  taxDocument: File | null
  identityProof: File | null
}

const BUSINESS_TYPES = [
  "Sole Proprietorship",
  "Partnership",
  "LLC",
  "Corporation",
  "Non-Profit",
  "Other"
]

const STORE_CATEGORIES = [
  "Electronics",
  "Fashion & Apparel",
  "Home & Garden",
  "Sports & Outdoors",
  "Books & Media",
  "Gaming",
  "Beauty & Personal Care",
  "Toys & Games",
  "Automotive",
  "Pet Supplies",
  "Office Supplies",
  "Health & Wellness",
  "Food & Beverages",
  "Jewelry & Accessories",
  "Arts & Crafts"
]

export default function VendorRegisterPage() {
  const [step, setStep] = useState(1)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuth()
  const router = useRouter()

  const [formData, setFormData] = useState<VendorData>({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    businessName: "",
    businessType: "",
    businessRegistrationNumber: "",
    taxId: "",
    yearEstablished: "",
    storeName: "",
    storeDescription: "",
    storeCategory: [],
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    zipCode: "",
    country: "United States",
    bankName: "",
    accountHolderName: "",
    accountNumber: "",
    routingNumber: "",
    agreeToTerms: false,
    agreeToCommission: false,
    businessLicense: null,
    taxDocument: null,
    identityProof: null,
  })

  const totalSteps = 5
  const progress = (step / totalSteps) * 100

  const updateFormData = (field: keyof VendorData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const validateStep = (currentStep: number): boolean => {
    switch (currentStep) {
      case 1:
        return !!(formData.fullName && formData.email && formData.password.length >= 6 && formData.phone)
      case 2:
        return !!(formData.businessName && formData.businessType && formData.taxId)
      case 3:
        return !!(formData.storeName && formData.storeDescription && formData.storeCategory.length > 0)
      case 4:
        return !!(formData.addressLine1 && formData.city && formData.state && formData.zipCode)
      case 5:
        return !!(formData.agreeToTerms && formData.agreeToCommission)
      default:
        return false
    }
  }

  const handleNext = () => {
    if (validateStep(step)) {
      setError("")
      setStep(prev => Math.min(prev + 1, totalSteps))
    } else {
      setError("Please fill in all required fields")
    }
  }

  const handleBack = () => {
    setError("")
    setStep(prev => Math.max(prev - 1, 1))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateStep(5)) {
      setError("Please complete all required fields and agree to terms")
      return
    }

    setLoading(true)
    setError("")

    try {
      // Create user account
      await signUp(formData.email, formData.password, "vendor", formData.fullName)

      // In production, you would:
      // 1. Upload documents to Firebase Storage
      // 2. Create vendor profile in Firestore
      // 3. Send verification email
      // 4. Notify admin for approval

      // For now, redirect to pending approval page
      router.push("/vendor/pending-approval")
    } catch (err: any) {
      setError(err.message || "Failed to create vendor account")
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = (field: keyof VendorData, file: File | null) => {
    updateFormData(field, file)
  }

  return (
    <div className="min-h-screen bg-muted/30 py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-4">
              <Store className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">Become a Vendor</h1>
          <p className="text-muted-foreground">
            Join thousands of successful sellers on MarketHub
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">Step {step} of {totalSteps}</span>
            <span className="text-sm text-muted-foreground">{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
          
          {/* Step Indicators */}
          <div className="mt-4 flex justify-between">
            {[
              { num: 1, label: "Personal" },
              { num: 2, label: "Business" },
              { num: 3, label: "Store" },
              { num: 4, label: "Address" },
              { num: 5, label: "Review" }
            ].map((s) => (
              <div key={s.num} className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step > s.num ? "bg-primary text-primary-foreground" :
                  step === s.num ? "bg-primary text-primary-foreground" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {step > s.num ? <Check className="h-4 w-4" /> : s.num}
                </div>
                <span className="text-xs mt-1 hidden sm:block">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {step === 1 && "Personal Information"}
              {step === 2 && "Business Information"}
              {step === 3 && "Store Details"}
              {step === 4 && "Business Address & Banking"}
              {step === 5 && "Review & Submit"}
            </CardTitle>
            <CardDescription>
              {step === 1 && "Let's start with your personal details"}
              {step === 2 && "Tell us about your business"}
              {step === 3 && "Set up your online store"}
              {step === 4 && "Where is your business located?"}
              {step === 5 && "Review your information and submit for approval"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              {error && (
                <div className="mb-6 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              {/* Step 1: Personal Information */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        value={formData.fullName}
                        onChange={(e) => updateFormData("fullName", e.target.value)}
                        placeholder="John Doe"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => updateFormData("phone", e.target.value)}
                        placeholder="+1 (555) 123-4567"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateFormData("email", e.target.value)}
                      placeholder="you@example.com"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      This will be your login email
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => updateFormData("password", e.target.value)}
                      placeholder="Minimum 6 characters"
                      required
                      minLength={6}
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Business Information */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Legal Business Name *</Label>
                    <Input
                      id="businessName"
                      value={formData.businessName}
                      onChange={(e) => updateFormData("businessName", e.target.value)}
                      placeholder="ABC Company LLC"
                      required
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="businessType">Business Type *</Label>
                      <Select
                        value={formData.businessType}
                        onValueChange={(value) => updateFormData("businessType", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {BUSINESS_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="yearEstablished">Year Established</Label>
                      <Input
                        id="yearEstablished"
                        type="number"
                        value={formData.yearEstablished}
                        onChange={(e) => updateFormData("yearEstablished", e.target.value)}
                        placeholder="2020"
                        min="1900"
                        max={new Date().getFullYear()}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="taxId">Tax ID / EIN *</Label>
                      <Input
                        id="taxId"
                        value={formData.taxId}
                        onChange={(e) => updateFormData("taxId", e.target.value)}
                        placeholder="XX-XXXXXXX"
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Required for tax reporting
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="businessRegistrationNumber">Business Registration Number</Label>
                      <Input
                        id="businessRegistrationNumber"
                        value={formData.businessRegistrationNumber}
                        onChange={(e) => updateFormData("businessRegistrationNumber", e.target.value)}
                        placeholder="Optional"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Upload Business License</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileUpload("businessLicense", e.target.files?.[0] || null)}
                        className="flex-1"
                      />
                      <Upload className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      PDF, JPG, or PNG (Max 5MB)
                    </p>
                  </div>
                </div>
              )}

              {/* Step 3: Store Information */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="storeName">Store Name *</Label>
                    <Input
                      id="storeName"
                      value={formData.storeName}
                      onChange={(e) => updateFormData("storeName", e.target.value)}
                      placeholder="My Awesome Store"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      This will be displayed to customers
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="storeDescription">Store Description *</Label>
                    <Textarea
                      id="storeDescription"
                      value={formData.storeDescription}
                      onChange={(e) => updateFormData("storeDescription", e.target.value)}
                      placeholder="Tell customers about your store, products, and what makes you unique..."
                      rows={5}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      {formData.storeDescription.length}/500 characters
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Product Categories * (Select all that apply)</Label>
                    <div className="grid gap-2 sm:grid-cols-2 max-h-64 overflow-y-auto border border-border rounded-lg p-4">
                      {STORE_CATEGORIES.map((category) => (
                        <div key={category} className="flex items-center space-x-2">
                          <Checkbox
                            id={category}
                            checked={formData.storeCategory.includes(category)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                updateFormData("storeCategory", [...formData.storeCategory, category])
                              } else {
                                updateFormData("storeCategory", formData.storeCategory.filter(c => c !== category))
                              }
                            }}
                          />
                          <label htmlFor={category} className="text-sm cursor-pointer">
                            {category}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Address & Banking */}
              {step === 4 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Business Address
                    </h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="addressLine1">Address Line 1 *</Label>
                        <Input
                          id="addressLine1"
                          value={formData.addressLine1}
                          onChange={(e) => updateFormData("addressLine1", e.target.value)}
                          placeholder="123 Main Street"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="addressLine2">Address Line 2</Label>
                        <Input
                          id="addressLine2"
                          value={formData.addressLine2}
                          onChange={(e) => updateFormData("addressLine2", e.target.value)}
                          placeholder="Suite 100"
                        />
                      </div>

                      <div className="grid gap-4 sm:grid-cols-3">
                        <div className="space-y-2">
                          <Label htmlFor="city">City *</Label>
                          <Input
                            id="city"
                            value={formData.city}
                            onChange={(e) => updateFormData("city", e.target.value)}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="state">State *</Label>
                          <Input
                            id="state"
                            value={formData.state}
                            onChange={(e) => updateFormData("state", e.target.value)}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="zipCode">ZIP Code *</Label>
                          <Input
                            id="zipCode"
                            value={formData.zipCode}
                            onChange={(e) => updateFormData("zipCode", e.target.value)}
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Banking Information (Optional)
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Add your bank details now or later in your dashboard to receive payouts
                    </p>
                    <div className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="bankName">Bank Name</Label>
                          <Input
                            id="bankName"
                            value={formData.bankName}
                            onChange={(e) => updateFormData("bankName", e.target.value)}
                            placeholder="Bank of America"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="accountHolderName">Account Holder Name</Label>
                          <Input
                            id="accountHolderName"
                            value={formData.accountHolderName}
                            onChange={(e) => updateFormData("accountHolderName", e.target.value)}
                            placeholder="John Doe"
                          />
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="accountNumber">Account Number</Label>
                          <Input
                            id="accountNumber"
                            type="password"
                            value={formData.accountNumber}
                            onChange={(e) => updateFormData("accountNumber", e.target.value)}
                            placeholder="••••••••"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="routingNumber">Routing Number</Label>
                          <Input
                            id="routingNumber"
                            value={formData.routingNumber}
                            onChange={(e) => updateFormData("routingNumber", e.target.value)}
                            placeholder="123456789"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Review & Submit */}
              {step === 5 && (
                <div className="space-y-6">
                  <div className="rounded-lg bg-muted p-6 space-y-4">
                    <h3 className="font-semibold text-lg">Review Your Information</h3>
                    
                    <div className="grid gap-4 sm:grid-cols-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Full Name</p>
                        <p className="font-medium">{formData.fullName}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Email</p>
                        <p className="font-medium">{formData.email}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Business Name</p>
                        <p className="font-medium">{formData.businessName}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Store Name</p>
                        <p className="font-medium">{formData.storeName}</p>
                      </div>
                      <div className="sm:col-span-2">
                        <p className="text-muted-foreground">Categories</p>
                        <p className="font-medium">{formData.storeCategory.join(", ")}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="terms"
                        checked={formData.agreeToTerms}
                        onCheckedChange={(checked) => updateFormData("agreeToTerms", checked)}
                        required
                      />
                      <label htmlFor="terms" className="text-sm cursor-pointer">
                        I agree to the{" "}
                        <Link href="/terms" className="text-primary hover:underline" target="_blank">
                          Terms of Service
                        </Link>
                        {" "}and{" "}
                        <Link href="/privacy" className="text-primary hover:underline" target="_blank">
                          Privacy Policy
                        </Link>
                      </label>
                    </div>

                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="commission"
                        checked={formData.agreeToCommission}
                        onCheckedChange={(checked) => updateFormData("agreeToCommission", checked)}
                        required
                      />
                      <label htmlFor="commission" className="text-sm cursor-pointer">
                        I understand and agree to the 15% commission fee on all sales
                      </label>
                    </div>
                  </div>

                  <div className="rounded-lg bg-blue-500/10 p-4 text-sm">
                    <p className="font-medium text-blue-600 mb-2">What happens next?</p>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Your application will be reviewed by our team (1-3 business days)</li>
                      <li>• You'll receive an email notification once approved</li>
                      <li>• After approval, you can start adding products to your store</li>
                      <li>• Our support team is here to help you get started</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="mt-8 flex justify-between gap-4">
                {step > 1 && (
                  <Button type="button" variant="outline" onClick={handleBack}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                )}
                
                {step < totalSteps ? (
                  <Button type="button" onClick={handleNext} className="ml-auto">
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button type="submit" disabled={loading} className="ml-auto">
                    {loading ? "Submitting..." : "Submit Application"}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Already have account */}
        <div className="mt-6 text-center text-sm">
          <span className="text-muted-foreground">Already have a vendor account? </span>
          <Link href="/auth/login" className="font-medium hover:underline">
            Login
          </Link>
        </div>
      </div>
    </div>
  )
}

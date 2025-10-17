"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/firebase/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Megaphone, ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { doc, setDoc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/config"

export default function AdvertiserSignupPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    businessName: "",
    businessEmail: user?.email || "",
    phone: "",
    website: "",
    businessType: "",
    agreeToTerms: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.agreeToTerms) {
      toast.error("Please agree to the terms and conditions")
      return
    }

    if (!user) {
      toast.error("Please login first")
      router.push("/auth/login?returnUrl=/advertiser/signup")
      return
    }

    setLoading(true)

    try {
      // Check if advertiser profile already exists
      const advertiserRef = doc(db, "advertisers", user.uid)
      const advertiserSnap = await getDoc(advertiserRef)

      if (advertiserSnap.exists()) {
        toast.error("You already have an advertiser account")
        router.push("/advertiser/dashboard")
        return
      }

      // Create advertiser profile
      await setDoc(advertiserRef, {
        uid: user.uid,
        email: user.email,
        businessName: formData.businessName,
        businessEmail: formData.businessEmail,
        phone: formData.phone,
        website: formData.website,
        businessType: formData.businessType,
        accountStatus: "active",
        accountBalance: 0,
        totalSpent: 0,
        campaigns: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      toast.success("Advertiser account created successfully!")
      
      // Redirect to dashboard
      setTimeout(() => {
        router.push("/advertiser/dashboard")
      }, 1000)

    } catch (error) {
      console.error("Error creating advertiser account:", error)
      toast.error("Failed to create advertiser account. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Megaphone className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Create Advertiser Account</CardTitle>
            <CardDescription>
              Set up your advertising account to start promoting your business on MarketHub
            </CardDescription>
            {user && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>Logged in as:</strong> {user.email}
                </p>
              </div>
            )}
          </CardHeader>

          <CardContent>
            {!user ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  You need to be logged in to create an advertiser account
                </p>
                <div className="flex gap-3 justify-center">
                  <Button asChild>
                    <Link href="/auth/login?returnUrl=/advertiser/signup">
                      Login
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/auth/signup?returnUrl=/advertiser/signup">
                      Sign Up
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Business Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Business Information</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="businessName">
                      Business Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="businessName"
                      placeholder="Your Business Name"
                      value={formData.businessName}
                      onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="businessEmail">
                      Business Email <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="businessEmail"
                      type="email"
                      placeholder="business@example.com"
                      value={formData.businessEmail}
                      onChange={(e) => setFormData({ ...formData, businessEmail: e.target.value })}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      This can be the same as your account email or a different business email
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">
                      Phone Number <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+234 800 000 0000"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="businessType">
                      Business Type <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="businessType"
                      placeholder="e.g., E-commerce, Services, Agency"
                      value={formData.businessType}
                      onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">Website (Optional)</Label>
                    <Input
                      id="website"
                      type="url"
                      placeholder="https://yourbusiness.com"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    />
                  </div>
                </div>

                {/* Terms and Conditions */}
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="terms"
                      checked={formData.agreeToTerms}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, agreeToTerms: checked as boolean })
                      }
                    />
                    <div className="space-y-1">
                      <Label htmlFor="terms" className="text-sm font-normal cursor-pointer">
                        I agree to the{" "}
                        <Link href="/terms" className="text-primary hover:underline">
                          Terms and Conditions
                        </Link>{" "}
                        and{" "}
                        <Link href="/privacy" className="text-primary hover:underline">
                          Privacy Policy
                        </Link>
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        By creating an advertiser account, you agree to our advertising policies
                        and payment terms.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={loading || !formData.agreeToTerms}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      "Create Advertiser Account"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Additional Info */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>
            Already have an advertiser account?{" "}
            <Link href="/advertiser/dashboard" className="text-primary hover:underline">
              Go to Dashboard
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

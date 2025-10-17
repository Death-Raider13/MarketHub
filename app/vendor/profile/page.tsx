"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/firebase/auth-context"
import { useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ProtectedRoute } from "@/lib/firebase/protected-route"
import { Save, Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

function VendorProfileContent() {
  const { user, refreshUserProfile } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(true)

  const [storeName, setStoreName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [storeDescription, setStoreDescription] = useState("")
  const [addressLine1, setAddressLine1] = useState("")
  const [addressLine2, setAddressLine2] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [zipCode, setZipCode] = useState("")

  // Load profile
  useEffect(() => {
    async function loadProfile() {
      if (!user) return

      try {
        const response = await fetch(`/api/vendor/profile?vendorId=${user.uid}`)
        const data = await response.json()

        if (data.profile) {
          setStoreName(data.profile.storeName || "")
          setEmail(data.profile.email || user.email || "")
          setPhone(data.profile.phone || "")
          setStoreDescription(data.profile.storeDescription || "")
          setAddressLine1(data.profile.address?.addressLine1 || "")
          setAddressLine2(data.profile.address?.addressLine2 || "")
          setCity(data.profile.address?.city || "")
          setState(data.profile.address?.state || "")
          setZipCode(data.profile.address?.zipCode || "")
        }
      } catch (error) {
        console.error("Error loading profile:", error)
        toast.error("Failed to load profile")
      } finally {
        setLoadingProfile(false)
      }
    }

    loadProfile()
  }, [user])

  const handleSave = async () => {
    if (!user) {
      toast.error("Please login to continue")
      return
    }

    if (!storeName) {
      toast.error("Store name is required")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/vendor/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId: user.uid,
          storeName,
          phone,
          storeDescription,
          address: {
            addressLine1,
            addressLine2,
            city,
            state,
            zipCode,
            country: "Nigeria",
          },
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Profile updated successfully! 🎉")
        // Refresh the user profile in auth context so changes reflect everywhere
        await refreshUserProfile()
      } else {
        toast.error(data.error || "Failed to update profile")
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      toast.error("Failed to update profile")
    } finally {
      setLoading(false)
    }
  }

  if (loadingProfile) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 bg-muted/30 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading profile...</p>
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
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-3xl font-bold">Vendor Profile</h1>
            </div>
            <p className="text-muted-foreground ml-12">
              Update your store information. Changes will reflect across all pages.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Store Information</CardTitle>
              <CardDescription>
                This information will be displayed on your store page and used throughout the platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="storeName">Store Name *</Label>
                <Input
                  id="storeName"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="My Awesome Store"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  This will be displayed as your store name everywhere
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed here. Contact support if needed.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+234 803 123 4567"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="storeDescription">Store Description</Label>
                <Textarea
                  id="storeDescription"
                  value={storeDescription}
                  onChange={(e) => setStoreDescription(e.target.value)}
                  placeholder="Tell customers about your store..."
                  rows={4}
                />
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Store Address</h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="addressLine1">Address Line 1</Label>
                    <Input
                      id="addressLine1"
                      value={addressLine1}
                      onChange={(e) => setAddressLine1(e.target.value)}
                      placeholder="123 Main Street"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
                    <Input
                      id="addressLine2"
                      value={addressLine2}
                      onChange={(e) => setAddressLine2(e.target.value)}
                      placeholder="Suite 100"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Lagos"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        placeholder="Lagos State"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="zipCode">Postal Code</Label>
                    <Input
                      id="zipCode"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      placeholder="100001"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-6">
                <Button
                  variant="outline"
                  onClick={() => router.back()}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default function VendorProfilePage() {
  return (
    <ProtectedRoute allowedRoles={["vendor"]}>
      <VendorProfileContent />
    </ProtectedRoute>
  )
}

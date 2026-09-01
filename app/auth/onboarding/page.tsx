"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/firebase/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useRouter } from "next/navigation"
import { Store } from "lucide-react"

export default function OnboardingPage() {
  const [role, setRole] = useState<"customer" | "creator" | "promoter">("customer")
  const [displayName, setDisplayName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const { user, userProfile, refreshUserProfile } = useAuth()
  const router = useRouter()

  // Read URL query parameter for role preselection (e.g., ?role=promoter)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search)
      const roleParam = urlParams.get("role")
      if (roleParam === "creator" || roleParam === "promoter" || roleParam === "customer") {
        setRole(roleParam)
      }
    }
  }, [])

  // Redirect if not authenticated or already onboarded
  useEffect(() => {
    if (!user) {
      router.push("/auth/login")
      return
    }

    if (typeof window !== 'undefined' && sessionStorage.getItem('suppressRoleRedirect') === 'true') {
      return
    }

    if (userProfile && userProfile.role) {
      // Already has a role, redirect based on role
      switch (userProfile.role) {
        case "admin":
          router.push("/admin/dashboard")
          break
        case "creator":
          if (userProfile.verified) {
            router.push("/creator/dashboard")
          } else {
            router.push("/creator/pending-approval")
          }
          break
        case "promoter":
          router.push("/dashboard/promoter")
          break
        case "customer":
        default:
          router.push("/")
          break
      }
    } else if (userProfile?.displayName) {
      // Pre-fill display name if available
      setDisplayName(userProfile.displayName)
    }
  }, [user, userProfile, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!displayName.trim()) {
      setError("Please enter your name")
      return
    }

    setLoading(true)
    setError("")

    try {
      const { doc, setDoc } = await import("firebase/firestore")
      const { db } = await import("@/lib/firebase/config")

      let referralCode: string | undefined
      try {
        const raw = typeof window !== 'undefined' ? window.localStorage.getItem('markethub_affiliate_attribution') : null
        const parsed = raw ? JSON.parse(raw) : null
        if (parsed?.code && (!parsed.expiresAt || Number(parsed.expiresAt) > Date.now())) {
          referralCode = String(parsed.code).trim().toUpperCase()
        }
      } catch {}

      // Update user profile via Admin API for bulletproof permission handling
      try {
        const token = await user!.getIdToken()
        const response = await fetch('/api/auth/complete-onboarding', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            role,
            displayName: displayName.trim(),
            referredByCode: referralCode
          })
        })

        const resData = await response.json()
        if (!response.ok) {
          throw new Error(resData.error || 'Failed to complete profile onboarding')
        }
      } catch (apiError) {
        // Fallback to client setDoc if API endpoint is unreachable
        const updateData = {
          role,
          activeRole: role,
          displayName: displayName.trim(),
          updatedAt: new Date(),
          ...(role === "creator" && { verified: false }),
          ...(role === "promoter" && { affiliateStatus: 'approved' }),
          ...(referralCode ? { referredByCode: referralCode } : {}),
        }
        await setDoc(doc(db, "users", user!.uid), updateData, { merge: true })
      }
      
      // Refresh the user profile in context
      await refreshUserProfile()

      if (role === "creator") {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('suppressRoleRedirect', 'true')
        }
        router.push("/auth/creator-register-new")
        return
      }

      if (role === "promoter") {
        router.push("/dashboard/promoter")
        return
      }

      router.push("/")
    } catch (err: any) {
      setError(err.message || "Failed to complete onboarding")
    } finally {
      setLoading(false)
    }
  }

  if (!user || (userProfile && userProfile.role)) {
    return null // Will redirect
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-8">
      <Card className="w-full max-w-md shadow-xl border-border">
        <CardHeader className="space-y-1 text-center p-5 sm:p-6">
          <div className="flex justify-center mb-3 sm:mb-4 text-primary">
            <Store className="h-10 w-10 sm:h-12 sm:w-12" />
          </div>
          <CardTitle className="text-xl sm:text-2xl font-bold">Complete your profile</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Tell us a bit more about yourself to get started
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 sm:p-6 pt-0 sm:pt-0">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="rounded-lg bg-destructive/10 p-3 text-xs sm:text-sm text-destructive">{error}</div>}

            <div className="space-y-1.5">
              <Label htmlFor="displayName" className="text-xs font-semibold">Full Name</Label>
              <Input
                id="displayName"
                type="text"
                placeholder="Enter your full name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="h-11 sm:h-10 text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold">Account type</Label>
              <RadioGroup value={role} onValueChange={(value: "customer" | "creator" | "promoter") => setRole(value)} className="space-y-2">
                <div className={`flex items-center space-x-3 rounded-xl border p-3.5 transition-all cursor-pointer ${role === 'customer' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border'}`}>
                  <RadioGroupItem value="customer" id="customer" />
                  <Label htmlFor="customer" className="cursor-pointer text-xs sm:text-sm font-medium flex-1">
                    Student / Customer <span className="block text-[10px] text-muted-foreground font-normal">I want to browse & buy educational resources</span>
                  </Label>
                </div>
                <div className={`flex items-center space-x-3 rounded-xl border p-3.5 transition-all cursor-pointer ${role === 'creator' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border'}`}>
                  <RadioGroupItem value="creator" id="creator" />
                  <Label htmlFor="creator" className="cursor-pointer text-xs sm:text-sm font-medium flex-1">
                    Creator / Educator <span className="block text-[10px] text-muted-foreground font-normal">I want to sell materials & build a hub</span>
                  </Label>
                </div>
                <div className={`flex items-center space-x-3 rounded-xl border p-3.5 transition-all cursor-pointer ${role === 'promoter' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border'}`}>
                  <RadioGroupItem value="promoter" id="promoter" />
                  <Label htmlFor="promoter" className="cursor-pointer text-xs sm:text-sm font-medium flex-1">
                    Affiliate Promoter <span className="block text-[10px] text-muted-foreground font-normal">I want to promote resources & earn commissions</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <Button type="submit" className="w-full h-11 font-bold text-sm" disabled={loading}>
              {loading ? "Completing..." : "Complete Setup"}
            </Button>
          </form>

          <div className="mt-6 text-center text-xs sm:text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Button variant="link" className="p-0 h-auto font-semibold text-primary" onClick={() => router.push("/auth/login")}>
              Sign in
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

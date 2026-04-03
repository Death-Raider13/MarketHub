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
  const [role, setRole] = useState<"customer" | "creator">("customer")
  const [displayName, setDisplayName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const { user, userProfile, refreshUserProfile } = useAuth()
  const router = useRouter()

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

      // Update user profile with role and displayName
      const updateData = {
        role,
        displayName: displayName.trim(),
        updatedAt: new Date(),
        ...(role === "creator" && { verified: false, commission: 10 }),
      }

      await setDoc(doc(db, "users", user!.uid), updateData, { merge: true })
      
      // Refresh the user profile in context
      await refreshUserProfile()

      if (role === "creator") {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('suppressRoleRedirect', 'true')
        }
        router.push("/auth/creator-register-new")
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
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <Store className="h-12 w-12" />
          </div>
          <CardTitle className="text-2xl font-bold">Complete your profile</CardTitle>
          <CardDescription>
            Tell us a bit more about yourself to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

            <div className="space-y-2">
              <Label htmlFor="displayName">Full Name</Label>
              <Input
                id="displayName"
                type="text"
                placeholder="Enter your full name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Account type</Label>
              <RadioGroup value={role} onValueChange={(value: "customer" | "creator") => setRole(value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="customer" id="customer" />
                  <Label htmlFor="customer">Customer - I want to buy products</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="creator" id="creator" />
                  <Label htmlFor="creator">Creator - I want to build a digital hub</Label>
                </div>
              </RadioGroup>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Completing..." : "Complete Setup"}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Button variant="link" className="p-0 h-auto font-medium" onClick={() => router.push("/auth/login")}>
              Sign in
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

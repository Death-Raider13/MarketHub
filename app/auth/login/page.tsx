"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/firebase/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Sparkles } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [earlyAccessNotice, setEarlyAccessNotice] = useState(false)
  const { signIn, signInWithGoogle, user, userProfile, logout, loading: authLoading } = useAuth()
  const router = useRouter()

  // 3-Day Creator Early Access Lock
  const IS_CREATOR_EARLY_ACCESS_ACTIVE = true

  // Redirect based on user role after successful login
  useEffect(() => {
    if (user && userProfile && !authLoading) {
      // Check if user needs onboarding (Google signup case)
      if (typeof window !== 'undefined' && sessionStorage.getItem('needsOnboarding')) {
        sessionStorage.removeItem('needsOnboarding')
        router.push('/auth/onboarding')
        return
      }

      // If user has no role, send to onboarding
      if (!userProfile.role) {
        router.push('/auth/onboarding')
        return
      }

      // Block non-creators/non-admins during Creator Early Access Period
      if (IS_CREATOR_EARLY_ACCESS_ACTIVE && userProfile.role !== 'creator' && userProfile.role !== 'admin' && (userProfile.role as string) !== 'super_admin') {
        setEarlyAccessNotice(true)
        logout()
        return
      }

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
    }
  }, [user, userProfile, authLoading, router, logout])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      await signIn(email, password)
      // Auth context will handle profile loading and redirect via useEffect
    } catch (err: any) {
      setError(err.message || "Failed to login")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError("")
    setLoading(true)

    try {
      await signInWithGoogle()
      // Auth context will handle profile loading and redirect via useEffect
    } catch (err: any) {
      setError(err.message || "Failed to sign in with Google")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-8">
      <Card className="w-full max-w-md shadow-xl border-border">
        <CardHeader className="space-y-1 text-center p-5 sm:p-6">
          <div className="flex justify-center mb-3 sm:mb-4 text-primary">
            <Sparkles className="h-10 w-10 sm:h-12 sm:w-12" />
          </div>
          <CardTitle className="text-xl sm:text-2xl font-bold">Creator Portal</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Enter your credentials to manage your digital hub</CardDescription>
        </CardHeader>
        <CardContent className="p-5 sm:p-6 pt-0 sm:pt-0">
          {earlyAccessNotice && (
            <div className="mb-4 rounded-xl bg-amber-500/10 border border-amber-500/30 p-4 text-xs sm:text-sm text-amber-900 dark:text-amber-200">
              <div className="font-bold text-sm flex items-center gap-1.5 mb-1 text-amber-600 dark:text-amber-400">
                ⏳ Educator Early Access Window Active!
              </div>
              We are giving Creators & Educators <strong>3 days</strong> to upload textbooks, past questions, and resources before opening the doors for Affiliates and Readers.
              <div className="mt-2 font-medium text-green-700 dark:text-green-400">
                🎉 Your account & 25% Waitlist Discount are safely active. Full launch opens in 3 days!
              </div>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="rounded-lg bg-destructive/10 p-3 text-xs sm:text-sm text-destructive">{error}</div>}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 sm:h-10 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-semibold">Password</Label>
                <Link href="/auth/reset-password" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11 sm:h-10 text-sm"
              />
            </div>

            <Button type="submit" className="w-full h-11 font-bold text-sm" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </Button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-wider font-semibold">
                <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full h-11 font-semibold text-sm"
              disabled={loading}
              onClick={handleGoogleSignIn}
            >
              <svg className="mr-2 h-4 w-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </Button>
          </form>

          <div className="mt-6 text-center text-xs sm:text-sm">
            <span className="text-muted-foreground">Don't have an account? </span>
            <Link href="/auth/signup" className="font-semibold text-primary hover:underline">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

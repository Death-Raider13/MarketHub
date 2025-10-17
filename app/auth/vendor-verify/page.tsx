"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/firebase/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, CheckCircle, RefreshCw, Clock, Shield, Store } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"

export default function VendorVerifyPage() {
  const { user, userProfile, resendVerificationEmail } = useAuth()
  const router = useRouter()
  const [resending, setResending] = useState(false)
  const [checking, setChecking] = useState(false)
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    // Redirect if not logged in
    if (!user) {
      router.push("/auth/login")
      return
    }

    // Redirect if not a vendor
    if (userProfile && userProfile.role !== "vendor") {
      router.push("/")
      return
    }

    // Redirect if already verified
    if (user.emailVerified) {
      router.push("/vendor/pending-approval")
      return
    }
  }, [user, userProfile, router])

  useEffect(() => {
    // Countdown timer for resend button
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleResend = async () => {
    if (countdown > 0) return

    setResending(true)
    try {
      await resendVerificationEmail()
      toast.success("Verification email sent! Check your inbox.")
      setCountdown(60) // 60 second cooldown
    } catch (error: any) {
      toast.error(error.message || "Failed to send verification email")
    } finally {
      setResending(false)
    }
  }

  const handleCheckVerification = async () => {
    if (!user) return

    setChecking(true)
    try {
      // Reload user to get latest emailVerified status
      await user.reload()
      
      if (user.emailVerified) {
        toast.success("Email verified successfully!")
        router.push("/vendor/pending-approval")
      } else {
        toast.error("Email not verified yet. Please check your inbox.")
      }
    } catch (error) {
      toast.error("Failed to check verification status")
    } finally {
      setChecking(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-4">
              <Store className="h-12 w-12 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Vendor Account Setup</CardTitle>
          <CardDescription>
            Complete these steps to start selling on MarketHub
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress Steps */}
          <div className="space-y-4">
            {/* Step 1: Email Verification */}
            <div className="flex gap-4 p-4 rounded-lg border-2 border-primary bg-primary/5">
              <div className="flex-shrink-0">
                <div className="rounded-full bg-primary/10 p-3">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold">Step 1: Verify Your Email</h3>
                  <span className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded">
                    In Progress
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  We've sent a verification link to <strong>{user.email}</strong>
                </p>
                <ol className="text-sm text-muted-foreground space-y-1 ml-4 list-decimal mb-3">
                  <li>Check your email inbox</li>
                  <li>Click the verification link</li>
                  <li>Return here and click "I've Verified"</li>
                </ol>
                <div className="flex gap-2">
                  <Button
                    onClick={handleCheckVerification}
                    size="sm"
                    disabled={checking}
                  >
                    {checking ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Checking...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        I've Verified My Email
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleResend}
                    variant="outline"
                    size="sm"
                    disabled={resending || countdown > 0}
                  >
                    {resending ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : countdown > 0 ? (
                      `Resend in ${countdown}s`
                    ) : (
                      "Resend Email"
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Step 2: Admin Approval */}
            <div className="flex gap-4 p-4 rounded-lg border bg-muted/50">
              <div className="flex-shrink-0">
                <div className="rounded-full bg-muted p-3">
                  <Shield className="h-6 w-6 text-muted-foreground" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-muted-foreground">Step 2: Admin Approval</h3>
                  <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">
                    Pending
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  After email verification, our team will review your application
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                  <li>Review time: 1-2 business days</li>
                  <li>We'll verify your business information</li>
                  <li>You'll receive an email when approved</li>
                </ul>
              </div>
            </div>

            {/* Step 3: Start Selling */}
            <div className="flex gap-4 p-4 rounded-lg border bg-muted/50">
              <div className="flex-shrink-0">
                <div className="rounded-full bg-muted p-3">
                  <Store className="h-6 w-6 text-muted-foreground" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-muted-foreground">Step 3: Start Selling</h3>
                  <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">
                    Locked
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Once approved, you can:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                  <li>Create product listings</li>
                  <li>Manage your store</li>
                  <li>Process orders</li>
                  <li>Track sales and earnings</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Help Section */}
          <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-4">
            <p className="text-sm text-blue-900 dark:text-blue-100 font-medium mb-2">
              💡 Tips while you wait:
            </p>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 ml-4 list-disc">
              <li>Check your spam folder if you don't see the email</li>
              <li>Prepare product photos and descriptions</li>
              <li>Review our <Link href="/vendor-guidelines" className="underline">Vendor Guidelines</Link></li>
              <li>Set up your payment information</li>
            </ul>
          </div>

          {/* Additional Actions */}
          <div className="space-y-2 pt-4 border-t">
            <Button
              variant="outline"
              className="w-full"
              asChild
            >
              <Link href="/">
                Browse MarketHub
              </Link>
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Wrong email address?{" "}
              <Link href="/auth/signup" className="text-primary hover:underline">
                Create a new account
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

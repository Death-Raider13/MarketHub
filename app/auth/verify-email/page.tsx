"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/firebase/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, CheckCircle, RefreshCw, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"

export default function VerifyEmailPage() {
  const { user, resendVerificationEmail } = useAuth()
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

    // Redirect if already verified
    if (user.emailVerified) {
      router.push("/")
      return
    }
  }, [user, router])

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
        router.push("/")
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
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-4">
              <Mail className="h-12 w-12 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Verify Your Email</CardTitle>
          <CardDescription>
            We've sent a verification link to
          </CardDescription>
          <p className="text-sm font-medium text-foreground">{user.email}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Instructions */}
          <div className="space-y-3">
            <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-4 space-y-2">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                📧 Check your email inbox
              </p>
              <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 ml-4 list-decimal">
                <li>Open the email from MarketHub</li>
                <li>Click the verification link</li>
                <li>Return here and click "I've Verified"</li>
              </ol>
            </div>

            <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950 p-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                💡 <strong>Tip:</strong> Check your spam folder if you don't see the email within a few minutes.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleCheckVerification}
              className="w-full"
              size="lg"
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
              className="w-full"
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
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Resend Verification Email
                </>
              )}
            </Button>
          </div>

          {/* Additional Actions */}
          <div className="space-y-2 pt-4 border-t">
            <Button
              variant="ghost"
              className="w-full"
              asChild
            >
              <Link href="/">
                <ArrowRight className="mr-2 h-4 w-4" />
                Continue Browsing (Limited Access)
              </Link>
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              You can browse products but can't make purchases until verified
            </p>
          </div>

          {/* Help */}
          <div className="text-center text-sm text-muted-foreground">
            <p>Wrong email address?</p>
            <Link href="/auth/signup" className="text-primary hover:underline">
              Create a new account
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

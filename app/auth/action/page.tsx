"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { applyActionCode } from "firebase/auth"
import { auth } from "@/lib/firebase/config"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Loader2, Store } from "lucide-react"
import Link from "next/link"

function AuthActionContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    const mode = searchParams.get("mode")
    const oobCode = searchParams.get("oobCode")

    if (!mode || !oobCode) {
      setStatus("error")
      setMessage("Invalid verification link")
      return
    }

    if (mode === "verifyEmail") {
      handleEmailVerification(oobCode)
    } else if (mode === "resetPassword") {
      // Redirect to password reset page with code
      router.push(`/auth/reset-password?oobCode=${oobCode}`)
    } else {
      setStatus("error")
      setMessage("Unknown action type")
    }
  }, [searchParams, router])

  const handleEmailVerification = async (code: string) => {
    try {
      await applyActionCode(auth, code)
      setStatus("success")
      setMessage("Your email has been verified successfully!")
    } catch (error: any) {
      setStatus("error")
      if (error.code === "auth/invalid-action-code") {
        setMessage("This verification link has expired or has already been used.")
      } else if (error.code === "auth/expired-action-code") {
        setMessage("This verification link has expired. Please request a new one.")
      } else {
        setMessage("Failed to verify email. Please try again.")
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/5 px-4 py-12">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-4 text-center pb-8">
          <div className="flex justify-center">
            <div className="rounded-full bg-background p-3 shadow-md">
              <Store className="h-12 w-12 text-primary" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">MarketHub</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Your Digital Marketplace</p>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6 pb-8">
          {status === "loading" && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="rounded-full bg-primary/10 p-6">
                  <Loader2 className="h-12 w-12 text-primary animate-spin" />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-2">Verifying Your Email</h2>
                <p className="text-muted-foreground">Please wait while we verify your email address...</p>
              </div>
            </div>
          )}

          {status === "success" && (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="rounded-full bg-green-100 dark:bg-green-900 p-6">
                  <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2 text-green-600 dark:text-green-400">
                  Email Verified! 🎉
                </h2>
                <p className="text-muted-foreground">{message}</p>
              </div>
              <div className="rounded-lg bg-green-50 dark:bg-green-950 p-4 space-y-2">
                <p className="text-sm font-medium text-green-900 dark:text-green-100">
                  ✅ You can now:
                </p>
                <ul className="text-sm text-green-800 dark:text-green-200 space-y-1 text-left ml-6 list-disc">
                  <li>Make purchases on MarketHub</li>
                  <li>Access all platform features</li>
                  <li>Receive order confirmations</li>
                  <li>Track your orders</li>
                </ul>
              </div>
              <div className="space-y-3">
                <Button asChild className="w-full" size="lg">
                  <Link href="/auth/login">
                    Continue to Login
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/">
                    Browse Products
                  </Link>
                </Button>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="rounded-full bg-red-100 dark:bg-red-900 p-6">
                  <XCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2 text-red-600 dark:text-red-400">
                  Verification Failed
                </h2>
                <p className="text-muted-foreground">{message}</p>
              </div>
              <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950 p-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  💡 <strong>Need help?</strong> You can request a new verification email from your account settings.
                </p>
              </div>
              <div className="space-y-3">
                <Button asChild className="w-full" size="lg">
                  <Link href="/auth/login">
                    Go to Login
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/auth/verify-email">
                    Resend Verification Email
                  </Link>
                </Button>
              </div>
            </div>
          )}

          <div className="pt-4 border-t text-center">
            <p className="text-xs text-muted-foreground">
              Need help? <Link href="/support" className="text-primary hover:underline">Contact Support</Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AuthActionPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/5">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
              </div>
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <AuthActionContent />
    </Suspense>
  )
}

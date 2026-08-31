"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/firebase/auth-context"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ProtectedRoute } from "@/lib/firebase/protected-route"
import { authenticatedFetch } from "@/lib/firebase/authenticated-fetch"
import { CheckCircle2, Crown, Loader2, ShieldCheck, Sparkles, UploadCloud, BookOpen } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

export default function VerificationPage() {
  return (
    <ProtectedRoute allowedRoles={["creator"]}>
      <VerificationContent />
    </ProtectedRoute>
  )
}

function VerificationContent() {
  const { user, userProfile } = useAuth()
  const searchParams = useSearchParams()
  const [featured, setFeatured] = useState(false)
  const [resourceCount, setResourceCount] = useState(0)
  const [waitlistEligible, setWaitlistEligible] = useState(false)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState<"badge" | "uploads" | null>(null)

  const loadStatus = async () => {
    if (!user) return
    try {
      setLoading(true)
      const [verificationResponse, productsResponse] = await Promise.all([
        authenticatedFetch(`/api/creator/verification?userId=${encodeURIComponent(user.uid)}`),
        authenticatedFetch(`/api/creator/products?creatorId=${encodeURIComponent(user.uid)}`),
      ])
      const verification = await verificationResponse.json().catch(() => ({}))
      const products = await productsResponse.json().catch(() => ({}))

      setFeatured(Boolean(verification.featured))
      setWaitlistEligible(Boolean(verification.waitlistEligible || userProfile?.waitlistMember))
      setResourceCount(Array.isArray(products.products) ? products.products.length : 0)
    } catch (error) {
      console.error("Error loading creator verification status:", error)
      toast.error("Could not load creator status")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStatus()
  }, [user])

  useEffect(() => {
    const reference = searchParams.get("reference")
    const paymentId = searchParams.get("paymentId")
    if (!reference || !paymentId || !user) return
    setPaying("badge")
    authenticatedFetch("/api/fees/verify", {
      method: "POST",
      body: JSON.stringify({ paymentId, reference }),
    })
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || "Payment verification failed")
        toast.success("🎉 Payment confirmed! Your creator benefits are active.")
        await loadStatus()
      })
      .catch((error) => toast.error(error.message || "Payment verification failed"))
      .finally(() => setPaying(null))
  }, [searchParams, user])

  const startPayment = async (kind: "badge" | "uploads") => {
    if (!user) return
    setPaying(kind)
    try {
      const feeType = kind === "badge"
        ? "creator_verification_featuring"
        : (waitlistEligible ? "creator_waitlist_additional_upload" : "creator_additional_upload")

      const createResponse = await authenticatedFetch("/api/fees/create", {
        method: "POST",
        body: JSON.stringify({ feeType }),
      })
      const created = await createResponse.json()
      if (!createResponse.ok) throw new Error(created.error || "Unable to create fee session")

      const initResponse = await authenticatedFetch("/api/fees/initialize", {
        method: "POST",
        body: JSON.stringify({ paymentId: created.paymentId }),
      })
      const initialized = await initResponse.json()
      if (!initResponse.ok || !initialized.authorizationUrl) throw new Error(initialized.error || "Unable to start Paystack checkout")

      window.location.assign(initialized.authorizationUrl)
    } catch (error: any) {
      toast.error(error?.message || "Unable to start payment")
      setPaying(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    )
  }

  const freeUploadsLeft = Math.max(0, 3 - resourceCount)
  const isWaitlist = Boolean(userProfile?.waitlistMember || waitlistEligible)
  const additionalUploadFee = isWaitlist ? 3000 : 4000

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 py-10 px-4">
        <div className="container mx-auto max-w-4xl space-y-8">
          
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-wider mb-2">
              <ShieldCheck className="h-3.5 w-3.5" /> Educator Account Status
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Creator Account & Upload Access</h1>
            <p className="text-muted-foreground mt-1">Manage your book upload quota, waitlist discounts, and verified educator badge.</p>
          </div>

          {/* Upload Quota Card */}
          <Card className="border-primary/20 bg-muted/30">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" /> Your Upload Quota
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Every creator gets <strong>3 FREE book uploads</strong>. Additional book uploads cost ₦{additionalUploadFee.toLocaleString()} each.
                  </CardDescription>
                </div>
                <Badge variant={freeUploadsLeft > 0 ? "default" : "secondary"} className="w-fit text-sm px-3 py-1 font-bold">
                  {freeUploadsLeft > 0 ? `${freeUploadsLeft} Free Uploads Remaining` : "3 Free Uploads Used"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border bg-background p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="font-bold">Total Books Published: <span className="text-primary font-extrabold">{resourceCount}</span></p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {freeUploadsLeft > 0 
                      ? `You can publish ${freeUploadsLeft} more resource${freeUploadsLeft > 1 ? 's' : ''} for free!` 
                      : `Purchase additional upload access to publish your next resource.`}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline" className="font-bold">
                    <Link href="/creator/products/new">
                      Upload Resource ➔
                    </Link>
                  </Button>
                  <Button 
                    onClick={() => startPayment("uploads")} 
                    disabled={paying === "uploads"}
                    className="font-bold bg-primary hover:bg-primary/90 text-white"
                  >
                    {paying === "uploads" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UploadCloud className="h-4 w-4 mr-2" />}
                    Pay Upload Access Fee (₦{additionalUploadFee.toLocaleString()})
                  </Button>
                </div>
              </div>

              {isWaitlist && (
                <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 p-3 text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 shrink-0 text-amber-600" />
                  <span><strong>25% Waitlist Discount Active:</strong> Your additional upload fee is reduced from ₦4,000 to ₦3,000!</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Verified Badge & Featuring Card */}
          <Card className={`border-2 transition-all ${featured ? "border-amber-500/50 bg-amber-500/5" : "border-border"}`}>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <Crown className={`h-5 w-5 ${featured ? "text-amber-500 fill-amber-500" : "text-primary"}`} />
                    Verified Educator Badge & Featuring (Optional)
                  </CardTitle>
                  <CardDescription>
                    Upgrade your creator profile to receive an official Verified Badge and top featuring in search results.
                  </CardDescription>
                </div>
                {featured && (
                  <Badge className="bg-amber-500 text-black font-black uppercase text-xs">
                    Verified Educator Active
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2 text-sm">
                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-muted/40 border">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Official <strong>Verified Educator Badge</strong> on all your book pages.</span>
                </div>
                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-muted/40 border">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Priority Featuring</strong> in marketplace search and creator hubs.</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t">
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">One-time Badge Fee</p>
                  <p className="text-2xl font-black text-primary">₦10,000</p>
                </div>

                {!featured ? (
                  <Button 
                    size="lg"
                    onClick={() => startPayment("badge")}
                    disabled={paying === "badge"}
                    className="w-full sm:w-auto font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl"
                  >
                    {paying === "badge" ? (
                      <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Connecting Paystack...</>
                    ) : (
                      <><Crown className="h-4 w-4 mr-2" /> Get Verified Educator Badge (₦10,000)</>
                    )}
                  </Button>
                ) : (
                  <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                    <CheckCircle2 className="h-5 w-5" /> Your Store is Verified & Featured
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

        </div>
      </main>

      <Footer />
    </div>
  )
}

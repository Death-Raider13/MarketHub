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
import { CheckCircle2, Clock, Crown, Loader2, Sparkles, UploadCloud, ShieldCheck } from "lucide-react"
import { toast } from "sonner"

type Status = "none" | "pending" | "paid" | "verified"

function VerificationContent() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<Status>("none")
  const [featured, setFeatured] = useState(false)
  const [resourceCount, setResourceCount] = useState(0)
  const [waitlistEligible, setWaitlistEligible] = useState(false)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState<"badge" | "uploads" | null>(null)

  const loadStatus = async () => {
    if (!user) return
    try {
      const [verificationResponse, productsResponse] = await Promise.all([
        authenticatedFetch(`/api/creator/verification?userId=${encodeURIComponent(user.uid)}`),
        authenticatedFetch(`/api/creator/products?creatorId=${encodeURIComponent(user.uid)}`),
      ])
      const verification = await verificationResponse.json()
      const products = await productsResponse.json()
      setStatus(verification.verificationPaymentStatus || verification.status || "none")
      setFeatured(Boolean(verification.featured))
      setWaitlistEligible(Boolean(verification.waitlistEligible))
      setResourceCount(Array.isArray(products.products) ? products.products.length : 0)
    } catch (error) {
      console.error("Error loading creator verification status:", error)
      toast.error("Could not load creator account status")
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
    }).then(async (response) => {
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Payment verification failed")
      toast.success("Payment confirmed. Your creator benefits are now active.")
      await loadStatus()
    }).catch((error) => toast.error(error.message || "Payment verification failed"))
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
      const initResponse = await authenticatedFetch("/api/fees/initialize", {
        method: "POST",
        body: JSON.stringify({ paymentId: created.paymentId }),
      })
      const initialized = await initResponse.json()
      if (!initResponse.ok || !initialized.authorizationUrl) throw new Error(initialized.error || "Unable to start payment")
      window.location.assign(initialized.authorizationUrl)
    } catch (error: any) {
      toast.error(error?.message || "Unable to start payment")
      setPaying(null)
    }
  }

  if (loading) return <div className="min-h-screen"><Header /><main className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></main><Footer /></div>

  const badgePaid = status === "paid" || status === "verified"
  const uploadFee = waitlistEligible ? 3000 : 4000

  return <div className="flex min-h-screen flex-col"><Header /><main className="flex-1 bg-muted/30"><div className="container mx-auto max-w-5xl px-4 py-10">
    <div className="mb-10 text-center"><Crown className="mx-auto mb-4 h-12 w-12 text-primary" /><h1 className="text-3xl font-bold">Creator Benefits</h1><p className="mt-2 text-muted-foreground">Grow your reach on a marketplace built only for books, educational resources, and videos.</p></div>
    <div className="mb-8 grid gap-4 sm:grid-cols-3"><Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Resources uploaded</p><p className="text-3xl font-bold">{resourceCount}</p><p className="text-xs text-muted-foreground">First 3 resources are free</p></CardContent></Card><Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Free uploads remaining</p><p className="text-3xl font-bold">{Math.max(0, 3 - resourceCount)}</p></CardContent></Card><Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Feature status</p><p className="text-xl font-bold">{featured ? "Featured" : "Not featured"}</p></CardContent></Card></div>
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="border-primary/30"><CardHeader><div className="flex items-center justify-between"><CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" />Verified Badge + Featuring</CardTitle>{badgePaid && <Badge className="bg-green-600">Active</Badge>}</div><CardDescription>Pay once to receive the verified creator badge and automatic featuring.</CardDescription></CardHeader><CardContent className="space-y-5"><p className="text-3xl font-bold">₦10,000</p><div className="space-y-2 text-sm text-muted-foreground"><p><CheckCircle2 className="mr-2 inline h-4 w-4 text-green-600" />Verified badge on your creator profile</p><p><CheckCircle2 className="mr-2 inline h-4 w-4 text-green-600" />Automatic inclusion in the rotating featured-creators carousel</p><p><CheckCircle2 className="mr-2 inline h-4 w-4 text-green-600" />Your feature remains visible through the rotating showcase so every eligible creator gets exposure</p></div>{featured ? <Badge variant="outline" className="w-full justify-center py-3"><ShieldCheck className="mr-2 h-4 w-4" />You are currently featured</Badge> : <Button className="w-full" onClick={() => startPayment("badge")} disabled={paying !== null}>{paying === "badge" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Crown className="mr-2 h-4 w-4" />}Pay ₦10,000 and get featured</Button>}</CardContent></Card>
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><UploadCloud className="h-5 w-5 text-primary" />Additional Resource Uploads</CardTitle><CardDescription>Upload your first three books, educational resources, or videos at no cost.</CardDescription></CardHeader><CardContent className="space-y-5"><p className="text-3xl font-bold">₦{uploadFee.toLocaleString()}</p><p className="text-sm text-muted-foreground">After the first three resources, pay for upload access before adding more. {waitlistEligible ? "Your waitlist discount is applied." : "Eligible waitlist members may receive the discounted rate."}</p>{resourceCount < 3 ? <Badge variant="outline" className="w-full justify-center py-3">You can upload {3 - resourceCount} more free resource{3 - resourceCount === 1 ? "" : "s"}</Badge> : <Button className="w-full" variant="outline" onClick={() => startPayment("uploads")} disabled={paying !== null}>{paying === "uploads" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}Pay ₦{uploadFee.toLocaleString()} for more uploads</Button>}</CardContent></Card>
    </div>
    <div className="mt-8 rounded-lg border bg-background p-5 text-sm text-muted-foreground"><Clock className="mr-2 inline h-4 w-4" />Payments are verified server-side through Paystack. Benefits are activated only after successful verification; the browser cannot mark an account as paid.</div>
  </div></main><Footer /></div>
}

export default function VerificationPage() { return <ProtectedRoute allowedRoles={["creator"]}><VerificationContent /></ProtectedRoute> }

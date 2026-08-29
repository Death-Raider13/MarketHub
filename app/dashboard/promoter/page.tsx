"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useAuth } from "@/lib/firebase/auth-context"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import { affiliateCourseModules, affiliateQuiz, AFFILIATE_QUIZ_PASS_PERCENT } from "@/lib/affiliate-course"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import {
  ArrowRight,
  CheckCircle2,
  Copy,
  ExternalLink,
  Link2,
  Loader2,
  Megaphone,
  MousePointerClick,
  Search,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react"

type AffiliateDashboard = {
  affiliate: {
    referralCode: string
    commissionRate: number
    totalEarnings: number
    availableBalance: number
    pendingBalance: number
    conversionCount: number
    clickCount: number
    affiliateStatus?: 'pending_payment' | 'course_pending' | 'task_pending' | 'approved' | 'suspended'
    referralRewardEarnings?: number
    referralRewardAvailableBalance?: number
  }
  clicks: Array<{ id: string; productName?: string; productId?: string; createdAt?: string }>
  conversions: Array<{
    id: string
    orderId: string
    productId?: string
    orderSubtotal: number
    commissionRate: number
    commissionAmount: number
    status: string
    createdAt?: string
  }>
  payouts: Array<{ id: string; amount: number; status: string; createdAt?: string }>
}

const formatNGN = (value: number) => `₦${Number(value || 0).toLocaleString('en-NG', { maximumFractionDigits: 2 })}`

export default function PromoterDashboard() {
  const { user, userProfile, loading: authLoading } = useAuth()
  const router = useRouter()
  const [dashboard, setDashboard] = useState<AffiliateDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [showPayoutForm, setShowPayoutForm] = useState(false)
  const [payoutAmount, setPayoutAmount] = useState("")
  const [accountName, setAccountName] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [bankName, setBankName] = useState("")
  const [bankCode, setBankCode] = useState("")
  const [submittingPayout, setSubmittingPayout] = useState(false)
  const [completedModules, setCompletedModules] = useState<number[]>([])
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({})
  const [quizScore, setQuizScore] = useState<number | null>(null)
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [savingCourse, setSavingCourse] = useState(false)

  useEffect(() => {
    if (!authLoading && (!user || userProfile?.role !== "promoter")) {
      router.push("/")
    }
  }, [authLoading, user, userProfile, router])

  useEffect(() => {
    if (!user || userProfile?.role !== "promoter") return

    const loadDashboard = async () => {
      try {
        setLoading(true)
        const token = await user.getIdToken()
        const response = await fetch('/api/affiliate/me', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Unable to load affiliate dashboard')
        setDashboard(data)
      } catch (error: any) {
        toast.error(error.message || 'Unable to load affiliate dashboard')
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [user, userProfile])

  useEffect(() => {
    if (!user?.uid || userProfile?.role !== 'promoter') return
    getDoc(doc(db, 'users', user.uid)).then(snapshot => {
      const progress = snapshot.data()?.affiliateCourseProgress
      if (progress) {
        setCompletedModules(Array.isArray(progress.completedModules) ? progress.completedModules : [])
        setQuizScore(typeof progress.quizScore === 'number' ? progress.quizScore : null)
        setQuizSubmitted(typeof progress.quizScore === 'number')
      }
    }).catch(() => toast.error('Unable to load affiliate course progress'))
  }, [user, userProfile])

  const markModuleComplete = async (moduleId: number) => {
    if (!user) return
    const nextModules = Array.from(new Set([...completedModules, moduleId])).sort((a, b) => a - b)
    setSavingCourse(true)
    try {
      await setDoc(doc(db, 'users', user.uid), {
        affiliateCourseProgress: { completedModules: nextModules, quizScore, quizPassed: quizScore !== null && quizScore >= AFFILIATE_QUIZ_PASS_PERCENT, updatedAt: new Date() }
      }, { merge: true })
      setCompletedModules(nextModules)
    } catch { toast.error('Unable to save course progress') } finally { setSavingCourse(false) }
  }

  const submitCourseQuiz = async () => {
    if (!user || completedModules.length < affiliateCourseModules.length) return
    const correct = affiliateQuiz.filter(question => quizAnswers[question.id] === question.answer).length
    const score = Math.round((correct / affiliateQuiz.length) * 100)
    setSavingCourse(true)
    try {
      const passed = score >= AFFILIATE_QUIZ_PASS_PERCENT
      await setDoc(doc(db, 'users', user.uid), {
        affiliateCourseProgress: { completedModules, quizScore: score, quizPassed: passed, updatedAt: new Date() },
        ...(passed ? { affiliateStatus: 'approved' } : {})
      }, { merge: true })
      setQuizScore(score)
      setQuizSubmitted(true)
      toast[score >= AFFILIATE_QUIZ_PASS_PERCENT ? 'success' : 'error'](score >= AFFILIATE_QUIZ_PASS_PERCENT ? 'Course quiz passed. Advertising access is now unlocked automatically.' : `You scored ${score}%. Review the lessons and try again.`)
    } catch { toast.error('Unable to save quiz result') } finally { setSavingCourse(false) }
  }

  const referralCode = dashboard?.affiliate.referralCode || userProfile?.referralCode || ''
  const referralLink = useMemo(() => {
    if (typeof window === 'undefined' || !referralCode) return ''
    return `${window.location.origin}/?ref=${encodeURIComponent(referralCode)}`
  }, [referralCode])

  const copyLink = async (link: string, message: string) => {
    if (!link) return
    await navigator.clipboard.writeText(link)
    setCopied(true)
    toast.success(message)
    window.setTimeout(() => setCopied(false), 2000)
  }

  const submitPayout = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!user) return

    try {
      setSubmittingPayout(true)
      const token = await user.getIdToken()
      const response = await fetch('/api/affiliate/payouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: Number(payoutAmount),
          payoutMethod: 'bank_transfer',
          bankDetails: { accountName, accountNumber, bankName, bankCode },
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to submit payout request')
      toast.success('Payout request submitted for review')
      setShowPayoutForm(false)
      setPayoutAmount('')
      setAccountName('')
      setAccountNumber('')
      setBankName('')
      setBankCode('')
      setDashboard(previous => previous ? {
        ...previous,
        affiliate: {
          ...previous.affiliate,
          availableBalance: previous.affiliate.availableBalance - Number(data.payout.amount),
          pendingBalance: previous.affiliate.pendingBalance + Number(data.payout.amount),
        },
        payouts: [data.payout, ...previous.payouts],
      } : previous)
    } catch (error: any) {
      toast.error(error.message || 'Unable to submit payout request')
    } finally {
      setSubmittingPayout(false)
    }
  }

  if (authLoading || loading || !userProfile) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-6 w-6 animate-spin mr-2" />Loading affiliate dashboard...</div>
  }

  if (!dashboard) {
    return <div className="min-h-screen flex items-center justify-center bg-background">Unable to load affiliate data.</div>
  }

  const { affiliate, conversions, payouts } = dashboard
  const courseCompleted = completedModules.length === affiliateCourseModules.length && quizScore !== null && quizScore >= AFFILIATE_QUIZ_PASS_PERCENT
  const advertisingApproved = courseCompleted

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 py-10 px-4">
        <div className="container mx-auto max-w-6xl space-y-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest mb-4">
                <Megaphone className="h-3 w-3" /> Affiliate workspace
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2">
                Welcome back, <span className="text-gradient">{userProfile.displayName?.split(' ')[0] || 'Promoter'}</span>
              </h1>
              <p className="text-muted-foreground">Choose products from the marketplace, generate their links, and follow your verified commissions here.</p>
            </div>
            {advertisingApproved ? (
              <Button asChild className="font-bold rounded-xl">
                <Link href="/products"><Search className="mr-2 h-4 w-4" /> Browse products to advertise</Link>
              </Button>
            ) : (
              <Button variant="outline" className="font-bold rounded-xl" disabled>
                Advertising access pending
              </Button>
            )}
          </div>

          <Card className="border-primary/20">
            <CardHeader><CardTitle className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-primary" /> Affiliate Masterclass</CardTitle><p className="text-sm text-muted-foreground">Complete all ten lessons and pass the short quiz with at least {AFFILIATE_QUIZ_PASS_PERCENT}% before advertising access can be activated.</p></CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-2 grid-cols-1 sm:grid-cols-2">
                {affiliateCourseModules.map(module => {
                  const complete = completedModules.includes(module.id)
                  return <button type="button" key={module.id} disabled={complete || savingCourse} onClick={() => markModuleComplete(module.id)} className={`text-left rounded-xl border p-3 transition-colors ${complete ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-border hover:border-primary/50'}`}><div className="flex items-start gap-2"><CheckCircle2 className={`h-4 w-4 mt-0.5 shrink-0 ${complete ? 'text-emerald-500' : 'text-muted-foreground'}`} /><span><strong className="text-sm">Module {module.id}: {module.title}</strong><span className="block text-xs text-muted-foreground mt-1">{module.summary}</span></span></div></button>
                })}
              </div>
              {completedModules.length === affiliateCourseModules.length && <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-4"><div><p className="font-bold">Knowledge check</p><p className="text-sm text-muted-foreground">Answer all {affiliateQuiz.length} questions. You need {AFFILIATE_QUIZ_PASS_PERCENT}% to pass.</p></div>{affiliateQuiz.map((question, index) => <fieldset key={question.id} className="space-y-2"><legend className="text-sm font-medium">{index + 1}. {question.question}</legend><div className="grid gap-2 sm:grid-cols-2">{question.options.map((option, optionIndex) => <label key={option} className="flex items-center gap-2 rounded-lg border border-border p-2 text-sm cursor-pointer hover:bg-muted"><input type="radio" name={question.id} checked={quizAnswers[question.id] === optionIndex} onChange={() => { setQuizSubmitted(false); setQuizAnswers(previous => ({ ...previous, [question.id]: optionIndex })) }} />{option}</label>)}</div></fieldset>)}<Button type="button" onClick={submitCourseQuiz} disabled={savingCourse || Object.keys(quizAnswers).length !== affiliateQuiz.length}>{savingCourse ? 'Saving...' : quizScore !== null ? 'Retake quiz' : 'Submit quiz'}</Button>{quizSubmitted && quizScore !== null && <p className={`text-sm font-medium ${courseCompleted ? 'text-emerald-600' : 'text-destructive'}`}>{courseCompleted ? `Final grade: ${quizScore}%. Course completed and advertising access is now unlocked automatically.` : `Final grade: ${quizScore}%. Please review the modules and retake the quiz.`}</p>}</div>}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card><CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">Total earnings</CardTitle></CardHeader><CardContent><div className="text-2xl sm:text-3xl font-black truncate">{formatNGN(affiliate.totalEarnings)}</div><p className="text-xs text-muted-foreground mt-1">Approved commissions</p></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">Available to withdraw</CardTitle></CardHeader><CardContent><div className="text-2xl sm:text-3xl font-black truncate">{formatNGN(affiliate.availableBalance)}</div><p className="text-xs text-muted-foreground mt-1">Minimum request: ₦1,000</p></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">Tracked clicks</CardTitle></CardHeader><CardContent><div className="text-2xl sm:text-3xl font-black truncate">{affiliate.clickCount}</div><p className="text-xs text-muted-foreground mt-1">Unique browser/product clicks</p></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">Conversions</CardTitle></CardHeader><CardContent><div className="text-2xl sm:text-3xl font-black truncate">{affiliate.conversionCount}</div><p className="text-xs text-muted-foreground mt-1">Commissioned purchases</p></CardContent></Card>
          </div>

          <div className="grid lg:grid-cols-[1.25fr_0.75fr] gap-6">
            <Card className="border-primary/20">
              <CardHeader><CardTitle className="flex items-center gap-2"><Link2 className="h-5 w-5 text-primary" /> Your affiliate code</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                <p className="text-sm text-muted-foreground">To advertise a product, open <strong>Browse products to advertise</strong>, find the product, and click the copy-link icon on its card or <strong>Advertise This Product</strong> on its detail page. Every link includes this promoter code and the selected product ID.</p>
                <div className="rounded-xl border bg-muted/40 p-4 font-mono text-sm break-all">{referralCode}</div>
                {!advertisingApproved && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                    <strong>Advertising is not active yet.</strong> Complete the registration payment, all course modules, and the quiz. Passing with at least 75% unlocks advertising automatically.
                    <span className="block mt-1 text-xs uppercase tracking-wide">Current status: {affiliate.affiliateStatus || 'pending approval'}</span>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button variant="outline" className="w-full sm:w-auto" onClick={() => copyLink(referralLink, 'General affiliate link copied')} disabled={!advertisingApproved}><Copy className="mr-2 h-4 w-4" />{copied ? 'Copied' : 'Copy general link'}</Button>
                  {advertisingApproved ? <Button asChild variant="secondary" className="w-full sm:w-auto"><Link href="/products"><Search className="mr-2 h-4 w-4" /> Select a product</Link></Button> : <Button variant="secondary" className="w-full sm:w-auto" disabled><Search className="mr-2 h-4 w-4" /> Select a product</Button>}
                </div>
                <p className="text-xs text-muted-foreground break-words">A product link looks like: <code className="break-all">/products/PRODUCT_ID?ref={referralCode}&amp;aff_product=PRODUCT_ID</code>. Attribution lasts 30 days in the visitor&apos;s browser.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Wallet className="h-5 w-5 text-emerald-500" /> Withdraw earnings</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm"><span>Available</span><strong>{formatNGN(affiliate.availableBalance)}</strong></div>
                <div className="flex justify-between text-sm"><span>Pending payout</span><strong>{formatNGN(affiliate.pendingBalance)}</strong></div>
                {!showPayoutForm ? (
                  <Button className="w-full" onClick={() => setShowPayoutForm(true)} disabled={affiliate.availableBalance < 1000}>Request payout <ArrowRight className="ml-2 h-4 w-4" /></Button>
                ) : (
                  <form className="space-y-3" onSubmit={submitPayout}>
                    <div><Label htmlFor="payoutAmount">Amount</Label><Input id="payoutAmount" type="number" min="1000" max={affiliate.availableBalance} value={payoutAmount} onChange={event => setPayoutAmount(event.target.value)} placeholder="1000" required /></div>
                    <div><Label htmlFor="accountName">Account name</Label><Input id="accountName" value={accountName} onChange={event => setAccountName(event.target.value)} required /></div>
                    <div><Label htmlFor="accountNumber">Account number</Label><Input id="accountNumber" inputMode="numeric" value={accountNumber} onChange={event => setAccountNumber(event.target.value)} required /></div>
                    <div><Label htmlFor="bankName">Bank name</Label><Input id="bankName" value={bankName} onChange={event => setBankName(event.target.value)} required /></div>
                    <div><Label htmlFor="bankCode">Bank code</Label><Input id="bankCode" inputMode="numeric" value={bankCode} onChange={event => setBankCode(event.target.value)} placeholder="e.g. 058" required /></div>
                    <div className="flex flex-col sm:flex-row gap-2"><Button type="submit" className="w-full sm:flex-1" disabled={submittingPayout}>{submittingPayout ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit request'}</Button><Button type="button" variant="outline" className="w-full sm:flex-1" onClick={() => setShowPayoutForm(false)}>Cancel</Button></div>
                  </form>
                )}
                <p className="text-xs text-muted-foreground">Requests are reviewed before transfer. Bank details are stored with the payout request for processing.</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" /> Recent conversions</CardTitle></CardHeader>
              <CardContent>
                {conversions.length === 0 ? <div className="py-10 text-center text-sm text-muted-foreground">No conversions yet. Select a product and share its link to get started.</div> : <div className="space-y-3">{conversions.slice(0, 8).map(conversion => <div key={conversion.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border p-3"><div><p className="font-medium">Order {conversion.orderId.slice(0, 10)}...</p><p className="text-xs text-muted-foreground">{conversion.status} · {conversion.createdAt ? new Date(conversion.createdAt).toLocaleDateString() : 'Recently'}</p></div><strong className="text-emerald-600">+{formatNGN(conversion.commissionAmount)}</strong></div>)}</div>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><MousePointerClick className="h-5 w-5 text-primary" /> Payout history</CardTitle></CardHeader>
              <CardContent>
                {payouts.length === 0 ? <div className="py-10 text-center text-sm text-muted-foreground">No payout requests yet.</div> : <div className="space-y-3">{payouts.slice(0, 8).map(payout => <div key={payout.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border p-3"><div><p className="font-medium">{formatNGN(payout.amount)}</p><p className="text-xs text-muted-foreground">{payout.createdAt ? new Date(payout.createdAt).toLocaleDateString() : 'Recently'}</p></div><span className="text-xs capitalize rounded-full bg-muted px-2 py-1 self-start sm:self-auto">{payout.status}</span></div>)}</div>}
              </CardContent>
            </Card>
          </div>

          <Card className="bg-primary/5 border-primary/10">
            <CardContent className="p-5 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
              <div><p className="font-bold">{advertisingApproved ? 'Want to promote another product?' : 'Finish affiliate onboarding first'}</p><p className="text-sm text-muted-foreground">{advertisingApproved ? 'Browse the live catalog and generate a product-specific link directly from the product card.' : 'Product advertising unlocks after the registration payment, course, task, and approval are complete.'}</p></div>
              {advertisingApproved && <Button asChild variant="outline" className="w-full sm:w-auto shrink-0"><Link href="/products">Open catalog <ExternalLink className="ml-2 h-4 w-4" /></Link></Button>}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}

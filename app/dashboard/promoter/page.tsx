"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useAuth } from "@/lib/firebase/auth-context"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import { affiliateCourseModules, affiliateQuiz, AFFILIATE_QUIZ_PASS_PERCENT, type AffiliateCourseModule } from "@/lib/affiliate-course"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { NIGERIAN_BANKS_LIST, resolveBankCode } from "@/lib/payment/paystack-transfers"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Copy,
  ExternalLink,
  Link2,
  Loader2,
  Megaphone,
  MousePointerClick,
  Search,
  Sparkles,
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
  const [activeModule, setActiveModule] = useState<AffiliateCourseModule | null>(null)
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({})
  const [quizScore, setQuizScore] = useState<number | null>(null)
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [savingCourse, setSavingCourse] = useState(false)
  const [isCourseExpanded, setIsCourseExpanded] = useState(false)

  useEffect(() => {
    if (!authLoading && (!user || userProfile?.role !== "promoter")) {
      router.push("/")
    }
  }, [authLoading, user, userProfile, router])

  const [paymentInitializing, setPaymentInitializing] = useState(false)
  const [paymentVerifying, setPaymentVerifying] = useState(false)

  useEffect(() => {
    if (!user || userProfile?.role !== "promoter") return

    const urlParams = new URLSearchParams(window.location.search)
    const paymentId = urlParams.get('paymentId')
    const reference = urlParams.get('reference') || urlParams.get('trxref')

    if (paymentId && reference) {
      const verifyPayment = async () => {
        try {
          setPaymentVerifying(true)
          toast.info('Verifying your affiliate registration payment...')
          const token = await user.getIdToken()
          const response = await fetch('/api/fees/verify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ paymentId, reference })
          })

          const data = await response.json()
          if (data.success) {
            toast.success('🎉 Registration payment verified! Welcome to the Affiliate Masterclass.')
            // Clean URL query params
            window.history.replaceState({}, document.title, window.location.pathname)
          } else {
            toast.error(data.error || 'Could not verify fee payment')
          }
        } catch (err: any) {
          console.error('Error verifying payment:', err)
          toast.error('Unable to verify registration payment')
        } finally {
          setPaymentVerifying(false)
        }
      }
      verifyPayment()
    }

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

  const handlePayRegistrationFee = async () => {
    if (!user) return
    try {
      setPaymentInitializing(true)
      toast.info('Initializing registration fee payment via Paystack...')
      const token = await user.getIdToken()
      
      const createRes = await fetch('/api/fees/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ feeType: 'affiliate_registration' })
      })

      const createData = await createRes.json()
      if (!createRes.ok) throw new Error(createData.error || 'Failed to create fee payment')

      const initRes = await fetch('/api/fees/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ paymentId: createData.paymentId })
      })

      const initData = await initRes.json()
      if (!initRes.ok || !initData.authorizationUrl) throw new Error(initData.error || 'Failed to initialize Paystack')

      window.location.href = initData.authorizationUrl
    } catch (err: any) {
      console.error('Registration fee payment error:', err)
      toast.error(err.message || 'Unable to start registration payment')
    } finally {
      setPaymentInitializing(false)
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

  const showCourseGrid = !courseCompleted || isCourseExpanded

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

          {affiliate.affiliateStatus === 'pending_payment' && (
            <Card className="border-amber-500/30 bg-amber-500/10 dark:bg-amber-950/20 shadow-lg">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-amber-500/20 text-amber-800 dark:text-amber-300 font-extrabold text-xs rounded-full border border-amber-500/30">
                        ⚡ Account Activation Required
                      </span>
                      {userProfile.waitlistMember && (
                        <span className="px-3 py-1 bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-extrabold text-xs rounded-full border border-emerald-500/30">
                          🎉 25% Waitlist Discount Applied!
                        </span>
                      )}
                    </div>
                    <h3 className="text-2xl font-black">Pay One-Time Affiliate Registration Fee</h3>
                    <p className="text-sm text-muted-foreground max-w-2xl">
                      Activate your official affiliate account to unlock full access to the <strong>Affiliate Marketing Masterclass</strong>, your unique referral links, and earn 15% commissions on all book sales + 50% referral share rewards.
                    </p>
                    <div className="flex items-center gap-4 pt-1">
                      <div className="text-xl font-black">
                        {userProfile.waitlistMember ? (
                          <>
                            <span className="line-through text-muted-foreground text-sm mr-2">₦8,000</span>
                            <span className="text-emerald-600 dark:text-emerald-400">₦6,000</span>
                          </>
                        ) : (
                          <span>₦8,000</span>
                        )}
                        <span className="text-xs font-normal text-muted-foreground ml-1">(One-time registration fee)</span>
                      </div>
                    </div>
                  </div>
                  <Button 
                    size="lg"
                    onClick={handlePayRegistrationFee} 
                    disabled={paymentInitializing}
                    className="font-bold bg-amber-600 hover:bg-amber-700 text-white shrink-0 px-8 py-6 rounded-xl shadow-md"
                  >
                    {paymentInitializing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Connecting Paystack...
                      </>
                    ) : (
                      <>
                        <Wallet className="w-5 h-5 mr-2" />
                        Pay {userProfile.waitlistMember ? '₦6,000' : '₦8,000'} & Activate
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className={`transition-all duration-300 ${courseCompleted ? 'border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/10' : 'border-primary/20 shadow-lg'}`}>
            <CardHeader className="p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="flex items-center gap-2 text-xl font-bold">
                      <CheckCircle2 className={`h-6 w-6 ${courseCompleted ? 'text-emerald-500' : 'text-primary'}`} />
                      {courseCompleted ? "🎉 Affiliate Masterclass Passed & Active" : "Affiliate Masterclass"}
                    </CardTitle>
                    {courseCompleted && (
                      <span className="text-xs font-black px-3 py-1 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded-full border border-emerald-500/30">
                        Score: {quizScore}%
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {courseCompleted
                      ? "Your advertising access is active! The masterclass modules are folded below to keep your workspace clean."
                      : `Tap any module to read the lesson notes & strategies. Complete all lessons and pass the quiz with at least ${AFFILIATE_QUIZ_PASS_PERCENT}% to activate advertising.`
                    }
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {!courseCompleted && (
                    <span className="text-xs font-bold px-3 py-1 bg-primary/10 text-primary rounded-full">
                      {completedModules.length} of {affiliateCourseModules.length} Read
                    </span>
                  )}
                  {courseCompleted && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsCourseExpanded(!isCourseExpanded)}
                      className="font-bold border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 rounded-xl gap-2 text-xs"
                    >
                      {isCourseExpanded ? (
                        <>Fold Course <ChevronUp className="h-4 w-4" /></>
                      ) : (
                        <>Review Lessons & Quiz <ChevronDown className="h-4 w-4" /></>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>

            {showCourseGrid && (
              <CardContent className="p-5 sm:p-6 pt-0 sm:pt-0 space-y-5 border-t border-border/50 mt-4">
                <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 pt-4">
                {affiliateCourseModules.map(module => {
                  const complete = completedModules.includes(module.id)
                  return (
                    <button
                      type="button"
                      key={module.id}
                      onClick={() => setActiveModule(module)}
                      className={`text-left rounded-2xl border p-4 transition-all duration-200 hover:shadow-md flex flex-col justify-between min-h-[110px] ${
                        complete
                          ? 'border-emerald-500/40 bg-emerald-500/10 dark:bg-emerald-950/20'
                          : 'border-border bg-card hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className={`h-5 w-5 mt-0.5 shrink-0 ${complete ? 'text-emerald-500' : 'text-muted-foreground/60'}`} />
                        <div>
                          <strong className="text-sm font-bold text-foreground block">
                            Module {module.id}: {module.title}
                          </strong>
                          <span className="block text-xs text-muted-foreground mt-1 line-clamp-2">
                            {module.summary}
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs font-semibold pt-2 border-t border-border/50">
                        <span className={complete ? "text-emerald-600 dark:text-emerald-400" : "text-primary"}>
                          {complete ? "Completed (Click to re-read)" : "Tap to Read Lesson"}
                        </span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </button>
                  )
                })}
              </div>

              {completedModules.length === affiliateCourseModules.length && (
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 space-y-4">
                  <div>
                    <p className="font-bold text-base">Knowledge Check Quiz</p>
                    <p className="text-sm text-muted-foreground">Answer all {affiliateQuiz.length} questions. You need {AFFILIATE_QUIZ_PASS_PERCENT}% to pass and unlock advertising access.</p>
                  </div>
                  {affiliateQuiz.map((question, index) => (
                    <fieldset key={question.id} className="space-y-2 bg-background p-4 rounded-xl border border-border">
                      <legend className="text-sm font-semibold">{index + 1}. {question.question}</legend>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {question.options.map((option, optionIndex) => (
                          <label key={option} className="flex items-center gap-2.5 rounded-lg border border-border p-3 text-sm cursor-pointer hover:bg-muted/50 transition-colors">
                            <input
                              type="radio"
                              name={question.id}
                              checked={quizAnswers[question.id] === optionIndex}
                              onChange={() => {
                                setQuizSubmitted(false)
                                setQuizAnswers(previous => ({ ...previous, [question.id]: optionIndex }))
                              }}
                              className="accent-primary"
                            />
                            <span>{option}</span>
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  ))}
                  <Button type="button" onClick={submitCourseQuiz} disabled={savingCourse || Object.keys(quizAnswers).length !== affiliateQuiz.length} className="w-full sm:w-auto font-bold px-6 py-3">
                    {savingCourse ? 'Saving...' : quizScore !== null ? 'Retake Quiz' : 'Submit Quiz'}
                  </Button>
                  {quizSubmitted && quizScore !== null && (
                    <p className={`text-sm font-bold ${courseCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}`}>
                      {courseCompleted ? `🎉 Final grade: ${quizScore}%. Course completed! Advertising access is now unlocked automatically.` : `❌ Final grade: ${quizScore}%. Please review the lessons and retake the quiz.`}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          )}
          </Card>

          {/* Lesson Reader Modal */}
          {activeModule && (
            <Dialog open={!!activeModule} onOpenChange={(open) => { if (!open) setActiveModule(null) }}>
              <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl p-6 sm:p-8">
                <DialogHeader className="space-y-2 border-b border-border pb-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-wider w-fit">
                    <BookOpen className="h-3.5 w-3.5" /> Module {activeModule.id} of {affiliateCourseModules.length}
                  </div>
                  <DialogTitle className="text-2xl font-black">{activeModule.title}</DialogTitle>
                  <DialogDescription className="text-sm font-medium text-muted-foreground">
                    {activeModule.summary}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                  {activeModule.sections.map((section, idx) => (
                    <div key={idx} className="space-y-3">
                      {section.heading && (
                        <h3 className="text-base font-bold text-primary flex items-center gap-2">
                          <Sparkles className="h-4 w-4 shrink-0" />
                          {section.heading}
                        </h3>
                      )}
                      {section.text && (
                        <p className="text-sm text-foreground/90 leading-relaxed">
                          {section.text}
                        </p>
                      )}
                      {section.bullets && section.bullets.length > 0 && (
                        <ul className="space-y-2 bg-muted/30 p-4 rounded-xl border border-border/50 text-sm">
                          {section.bullets.map((bullet, bIdx) => (
                            <li key={bIdx} className="flex items-start gap-2.5">
                              <span className="text-primary font-bold mt-0.5">•</span>
                              <span className="text-foreground/90 font-medium">{bullet}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      {section.example && (
                        <div className="p-4 bg-primary/10 border-l-4 border-primary rounded-r-xl text-xs sm:text-sm font-medium text-foreground">
                          <strong className="block text-primary font-bold uppercase tracking-wider text-[10px] mb-1">Example Strategy / Script:</strong>
                          {section.example}
                        </div>
                      )}
                    </div>
                  ))}

                  {activeModule.id === 9 && (
                    <div className="p-5 bg-gradient-to-r from-emerald-500/10 via-primary/10 to-emerald-500/10 border border-emerald-500/30 rounded-2xl space-y-3 mt-4">
                      <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                        <Users className="h-4 w-4 text-emerald-500" /> Join Official Affiliate Channels:
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <a
                          href="https://chat.whatsapp.com/H15NqzspEi9Ew9lsqioRH1?mode=gi_t"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-sm transition-all shadow-sm active:scale-95"
                        >
                          <Megaphone className="h-4 w-4" /> Join WhatsApp Group
                        </a>
                        <a
                          href="https://t.me/FeroELibraryAffiliates"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 px-4 rounded-xl text-sm transition-all shadow-sm active:scale-95"
                        >
                          <ExternalLink className="h-4 w-4" /> Join Telegram Channel
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                <DialogFooter className="border-t border-border pt-4 flex flex-col sm:flex-row gap-3">
                  <Button
                    type="button"
                    onClick={async () => {
                      await markModuleComplete(activeModule.id)
                      const nextId = activeModule.id + 1
                      const nextMod = affiliateCourseModules.find(m => m.id === nextId)
                      if (nextMod) {
                        setActiveModule(nextMod)
                        toast.success(`Module ${activeModule.id} completed! Advanced to Module ${nextId}.`)
                      } else {
                        setActiveModule(null)
                        toast.success(`Module ${activeModule.id} completed! All lessons read. Scroll down to complete the quiz!`)
                      }
                    }}
                    className="w-full sm:flex-1 font-bold py-6 rounded-xl bg-primary text-white hover:bg-primary/90 transition-all shadow-md text-base"
                  >
                    {completedModules.includes(activeModule.id) ? "Mark as Read & Close" : "Mark as Completed & Continue ➔"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card><CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">Total earnings</CardTitle></CardHeader><CardContent><div className="text-2xl sm:text-3xl font-black truncate">{formatNGN(affiliate.totalEarnings)}</div><p className="text-xs text-muted-foreground mt-1">Approved commissions</p></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">Available to withdraw</CardTitle></CardHeader><CardContent><div className="text-2xl sm:text-3xl font-black truncate">{formatNGN(affiliate.availableBalance)}</div><p className="text-xs text-muted-foreground mt-1">Minimum request: ₦200</p></CardContent></Card>
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
                    <div><Label htmlFor="payoutAmount">Amount (₦)</Label><Input id="payoutAmount" type="number" min="1000" max={affiliate.availableBalance} value={payoutAmount} onChange={event => setPayoutAmount(event.target.value)} placeholder="1000" required /></div>
                    <div><Label htmlFor="accountName">Account name</Label><Input id="accountName" value={accountName} onChange={event => setAccountName(event.target.value)} required /></div>
                    <div><Label htmlFor="accountNumber">Account number</Label><Input id="accountNumber" inputMode="numeric" value={accountNumber} onChange={event => setAccountNumber(event.target.value)} required /></div>
                    <div>
                      <Label>Bank name</Label>
                      <Select 
                        value={bankName} 
                        onValueChange={(selectedBank) => {
                          setBankName(selectedBank)
                          setBankCode(resolveBankCode(selectedBank))
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Bank" />
                        </SelectTrigger>
                        <SelectContent>
                          {NIGERIAN_BANKS_LIST.map((b) => (
                            <SelectItem key={b.code} value={b.name}>{b.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="rounded-lg border bg-muted/40 p-3 text-xs space-y-1">
                      <div className="flex justify-between"><span>Requested Amount:</span><strong>₦{Number(payoutAmount || 0).toLocaleString()}</strong></div>
                      <div className="flex justify-between"><span>Processing Fee:</span><strong className="text-amber-600">₦100</strong></div>
                      <div className="flex justify-between pt-1 border-t border-border/60"><span className="font-semibold">Net Payout to Bank:</span><strong className="text-emerald-600">₦{Math.max(0, Number(payoutAmount || 0) - 100).toLocaleString()}</strong></div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2"><Button type="submit" className="w-full sm:flex-1 font-bold bg-emerald-600 hover:bg-emerald-700" disabled={submittingPayout}>{submittingPayout ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit request'}</Button><Button type="button" variant="outline" className="w-full sm:flex-1" onClick={() => setShowPayoutForm(false)}>Cancel</Button></div>
                  </form>
                )}
                <p className="text-xs text-muted-foreground bg-primary/5 p-2 rounded border border-primary/10">ℹ️ <strong>24/7 Requesting:</strong> Submit requests anytime 24/7. Requests are reviewed and processed within 24–48 business hours (Mon–Fri).</p>
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

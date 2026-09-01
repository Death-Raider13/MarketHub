"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useAuth, type UserRole } from "@/lib/firebase/auth-context"
import { PASSWORD_REQUIREMENTS } from "@/lib/auth/password-policy"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { GraduationCap, ShieldCheck, Zap, Megaphone, ArrowRight } from "lucide-react"

export default function SignupPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [role, setRole] = useState<"customer" | "creator" | "promoter" | "verifier">("customer")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { signUp, signInWithGoogle } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const requestedRole = new URLSearchParams(window.location.search).get('role')
    if (requestedRole === 'promoter' || requestedRole === 'customer') {
      setRole(requestedRole)
    }
  }, [])

  // 3-Day Creator Early Access Lock
  const IS_CREATOR_EARLY_ACCESS_ACTIVE = true

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Block non-creators during Creator Early Access Period
    if (IS_CREATOR_EARLY_ACCESS_ACTIVE && role !== "creator" && role !== "verifier") {
      setError("⏳ Early Access Active: Signups are currently open exclusively for Educators/Creators during our 3-day resource upload window. Please select 'Creator' if you are an educator!")
      return
    }

    // Redirect to specialized onboarding flows
    if (role === "creator") {
      router.push("/auth/creator-register-new")
      return
    }

    if (role === "verifier") {
      router.push("/auth/verifier-apply")
      return
    }

    // Validate password confirmation
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    // Validate terms agreement
    if (!agreeToTerms) {
      setError("You must agree to the Terms of Service and Privacy Policy")
      return
    }

    setLoading(true)

    try {
      // Preserve an existing affiliate referral attribution for role-referral rewards.
      let referralCode: string | undefined
      try {
        const raw = window.localStorage.getItem('markethub_affiliate_attribution')
        const parsed = raw ? JSON.parse(raw) : null
        if (parsed?.code && (!parsed.expiresAt || Number(parsed.expiresAt) > Date.now())) {
          referralCode = String(parsed.code).trim().toUpperCase()
        }
      } catch { }

      // Combine first and last name for display name
      const fullName = `${firstName} ${lastName}`.trim()
      await signUp(email, password, role as UserRole, fullName, referralCode)

      if (role === "promoter") {
        router.push("/dashboard/promoter")
      } else {
        router.push("/auth/verify-email")
      }
    } catch (err: any) {
      setError(err.message || "Failed to create account")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    setError("")
    setLoading(true)

    try {
      await signInWithGoogle()
      router.push(`/auth/onboarding?role=${role}`)
    } catch (err: any) {
      setError(err.message || "Failed to sign up with Google")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 relative overflow-hidden bg-background">
      {/* Background Ambience */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -z-10 opacity-30" />
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] -z-10 opacity-20" />

      <div className="w-full max-w-[1000px] mx-auto grid lg:grid-cols-2 gap-8 items-center z-10">

        {/* Left column - Branding */}
        <div className="hidden lg:flex flex-col justify-center h-full pr-8">
          <Link href="/" className="flex items-center gap-2 mb-8">
            <div className="relative h-10 w-10">
              <img src="/logo.jpg" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-3xl font-bold tracking-tight">Fero<span className="text-primary text-gradient">E-Library</span></span>
          </Link>

          <h1 className="text-5xl font-black mb-6 tracking-tighter leading-[1.1]">
            Join Fero E-Library <br />
            <span className="text-muted-foreground/50">Digital Learning Engine.</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-12">
            Create your account to access topic summaries, enroll in live webinars, or monetize your educational materials.
          </p>

          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="p-3 glass rounded-[1.2rem] text-primary">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm">Customer Refund Guarantee</h4>
                <p className="text-xs text-muted-foreground mt-1">Full protection on all digital library purchases.</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-3 glass rounded-[1.2rem] text-primary">
                <Zap className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm">Instant Fulfillment</h4>
                <p className="text-xs text-muted-foreground mt-1">Zero wait times on summary downloads & live class links.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right column - Form */}
        <div className="glass-card rounded-3xl sm:rounded-[2.5rem] p-5 sm:p-8 md:p-10 shadow-2xl relative overflow-hidden w-full max-w-xl mx-auto">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-black mb-1.5 sm:mb-2">Create your account</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">Choose your portal to get started.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            {error && <div className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20 text-center font-medium">{error}</div>}

            <div className="space-y-2.5 sm:space-y-3">
              <Label className="text-[10px] sm:text-xs uppercase tracking-widest text-muted-foreground font-bold">1. Select Role</Label>
              <RadioGroup value={role} onValueChange={(value: any) => setRole(value)} className="grid grid-cols-3 gap-1.5 sm:gap-3">

                {/* Student */}
                <Label htmlFor="customer" className={`cursor-pointer border rounded-xl sm:rounded-2xl p-2.5 sm:p-4 transition-all flex flex-col items-center text-center gap-1.5 sm:gap-2 ${role === 'customer' ? 'border-primary bg-primary/10 shadow-[0_0_15px_rgba(79,70,229,0.15)] ring-1 ring-primary' : 'border-border bg-background/50 hover:border-primary/20'}`}>
                  <RadioGroupItem value="customer" id="customer" className="sr-only" />
                  <GraduationCap className={`h-5 w-5 sm:h-6 sm:w-6 ${role === 'customer' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div>
                    <div className={`text-[11px] sm:text-xs font-bold ${role === 'customer' ? 'text-foreground' : 'text-muted-foreground'}`}>Student</div>
                  </div>
                </Label>

                {/* Creator */}
                <Label htmlFor="creator" className={`relative overflow-hidden cursor-pointer border rounded-xl sm:rounded-2xl p-2.5 sm:p-4 transition-all flex flex-col items-center text-center gap-1.5 sm:gap-2 ${role === 'creator' ? 'border-primary bg-primary/10 shadow-[0_0_15px_rgba(79,70,229,0.15)] ring-1 ring-primary' : 'border-border bg-background/50 hover:border-primary/20'}`}>
                  <RadioGroupItem value="creator" id="creator" className="sr-only" />
                  <Zap className={`h-5 w-5 sm:h-6 sm:w-6 ${role === 'creator' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div>
                    <div className={`text-[11px] sm:text-xs font-bold ${role === 'creator' ? 'text-foreground' : 'text-muted-foreground'}`}>Creator</div>
                  </div>
                </Label>

                {/* Promoter */}
                <Label htmlFor="promoter" className={`cursor-pointer border rounded-xl sm:rounded-2xl p-2.5 sm:p-4 transition-all flex flex-col items-center text-center gap-1.5 sm:gap-2 ${role === 'promoter' ? 'border-primary bg-primary/10 shadow-[0_0_15px_rgba(79,70,229,0.15)] ring-1 ring-primary' : 'border-border bg-background/50 hover:border-primary/20'}`}>
                  <RadioGroupItem value="promoter" id="promoter" className="sr-only" />
                  <Megaphone className={`h-5 w-5 sm:h-6 sm:w-6 ${role === 'promoter' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div>
                    <div className={`text-[11px] sm:text-xs font-bold ${role === 'promoter' ? 'text-foreground' : 'text-muted-foreground'}`}>Affiliate</div>
                  </div>
                </Label>
              </RadioGroup>
            </div>

            {IS_CREATOR_EARLY_ACCESS_ACTIVE && (role === "customer" || role === "promoter") && (
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-4 text-xs sm:text-sm text-amber-900 dark:text-amber-200 animate-in fade-in duration-300 space-y-2">
                <div className="font-bold text-sm text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  ⏳ 3-Day Creator Early Access Active
                </div>
                <p>
                  We are giving Educators <strong>3 days</strong> to upload textbooks, past questions, and study materials before opening public signups for Students and Affiliates.
                </p>
                <div className="pt-1 text-xs border-t border-amber-500/20 space-y-1">
                  <div className="text-green-700 dark:text-green-400 font-semibold">
                    🔑 <strong>Waitlist Members:</strong> Your account is pre-registered! Use <strong>Sign In</strong> with your waitlist email when public launch opens in 3 days to claim your 25% discount.
                  </div>
                  <div className="text-primary font-bold">
                    👉 <strong>Educators & Authors:</strong> Select "Creator" above to get started & upload immediately!
                  </div>
                </div>
              </div>
            )}

            {/* Form Fields - Only show for Student and Promoter in this view */}
            {(role === "customer" || role === "promoter") && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="firstName" className="text-xs text-muted-foreground font-bold uppercase">First Name</Label>
                    <Input id="firstName" required className="bg-muted/50 border-border focus:border-primary/50 rounded-xl" value={firstName} onChange={e => setFirstName(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lastName" className="text-xs text-muted-foreground font-bold uppercase">Last Name</Label>
                    <Input id="lastName" required className="bg-muted/50 border-border focus:border-primary/50 rounded-xl" value={lastName} onChange={e => setLastName(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs text-muted-foreground font-bold uppercase">Email Address</Label>
                  <Input id="email" type="email" required className="bg-muted/50 border-border focus:border-primary/50 rounded-xl" value={email} onChange={e => setEmail(e.target.value)} />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-xs text-muted-foreground font-bold uppercase">Phone Number</Label>
                  <Input id="phone" type="tel" required className="bg-muted/50 border-border focus:border-primary/50 rounded-xl" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-xs text-muted-foreground font-bold uppercase">Password</Label>
                    <Input id="password" type="password" required minLength={12} className="bg-muted/50 border-border focus:border-primary/50 rounded-xl" value={password} onChange={e => setPassword(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="confirmPassword" className="text-xs text-muted-foreground font-bold uppercase">Confirm Password</Label>
                    <Input id="confirmPassword" type="password" required minLength={12} className="bg-muted/50 border-border focus:border-primary/50 rounded-xl" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                  </div>
                </div>
                <ul className="grid gap-1 text-xs text-muted-foreground sm:grid-cols-2" aria-label="Password requirements">
                  {PASSWORD_REQUIREMENTS.map((requirement) => <li key={requirement}>• {requirement}</li>)}
                </ul>

                <div className="flex items-start space-x-3 pt-2">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={agreeToTerms}
                    onChange={(e) => setAgreeToTerms(e.target.checked)}
                    required
                    className="mt-1 flex-shrink-0 w-4 h-4 rounded appearance-none border border-white/20 checked:bg-primary checked:border-primary relative
                      after:content-[''] after:absolute after:top-[2px] after:left-[5px] after:w-1.5 after:h-2.5 after:border-r-2 after:border-b-2 after:border-white after:rotate-45 after:scale-0 checked:after:scale-100 transition-all cursor-pointer"
                  />
                  <label htmlFor="terms" className="text-xs text-muted-foreground cursor-pointer leading-tight">
                    I agree to the <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                  </label>
                </div>
              </div>
            )}

            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white font-black h-14 rounded-xl text-md transition-all active:scale-[0.98]" disabled={loading}>
              {loading ? "Processing..." :
                role === "creator" ? "Continue to Educator Setup" :
                  role === "verifier" ? "Start Verifier Application" :
                    role === "promoter" ? "Setup Affiliate Account" :
                      "Create Account"}
              {!loading && <ArrowRight className="ml-2 h-5 w-5" />}
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-widest">
                <span className="bg-background px-4 text-muted-foreground">Or sign up with</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full border-border bg-background hover:bg-muted h-12 rounded-xl text-sm font-bold transition-all"
              disabled={loading}
              onClick={handleGoogleSignUp}
            >
              <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </Button>
          </form>

          <div className="mt-8 text-center text-sm font-medium">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link href="/auth/login" className="text-primary hover:underline">
              Sign In
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}

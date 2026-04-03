"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "sonner"
import { Sparkles, Zap, ShieldCheck, Rocket, ArrowRight, CheckCircle2, Globe, Users } from "lucide-react"
import Link from "next/link"

export default function InvitePage() {
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "creator",
    message: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch("/api/beta/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || "Failed to submit")

      toast.success("Application submitted successfully! 🚀")
      setSubmitted(true)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4">
        <Card className="max-w-md w-full text-center p-8 animate-in fade-in zoom-in duration-500">
          <div className="flex justify-center mb-6">
            <div className="rounded-full bg-primary/10 p-4">
              <CheckCircle2 className="h-12 w-12 text-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold mb-4">You're on the list!</CardTitle>
          <CardDescription className="text-lg mb-8">
            Thank you for your interest in MarketHub. We've received your application and will reach out to you via email or phone shortly.
          </CardDescription>
          <Button asChild className="w-full h-12 text-lg">
            <Link href="/">Return Home</Link>
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background selection:bg-primary/10">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_40%_at_50%_50%,rgba(var(--primary-rgb),0.08)_0%,transparent_100%)]" />
        <div className="container px-4 mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10 text-primary text-sm font-medium mb-6 animate-in fade-in slide-in-from-top duration-500">
            <Sparkles className="h-4 w-4" />
            Join the Beta Launch
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent">
            The Infrastructure for <br />
            <span className="text-primary">Digital Excellence.</span>
          </h1>
          <p className="max-w-2xl mx-auto text-xl text-muted-foreground mb-10">
            MarketHub is the premium ecosystem for creators to sell digital products, courses, and services with 90% revenue retention and instant global delivery.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="h-14 px-8 text-lg gap-2 shadow-xl shadow-primary/20" asChild>
              <a href="#apply">Apply Now <ArrowRight className="h-5 w-5" /></a>
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-8 text-lg" asChild>
              <Link href="/">Explore Products</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-24 border-y bg-muted/30">
        <div className="container px-4 mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-start">
            {/* Value Propositions */}
            <div className="space-y-12">
              <div>
                <h2 className="text-3xl font-bold mb-8">Why MarketHub?</h2>
                <div className="grid gap-8">
                  <div className="flex gap-4">
                    <div className="shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Zap className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">90/10 Revenue Split</h3>
                      <p className="text-muted-foreground">Keep more of what you earn. We only take 10% to keep the infrastructure running. No hidden fees.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <ShieldCheck className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">Trust & Security</h3>
                      <p className="text-muted-foreground">Verified buyer badges, secure escrow for services, and automated DRM for digital goods protect your hard work.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Globe className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">Fiat & Crypto Ready</h3>
                      <p className="text-muted-foreground">Get paid in your local currency via Paystack or receive crypto directly to your Coinbase wallet.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 rounded-2xl bg-primary text-primary-foreground">
                <h3 className="text-2xl font-bold mb-4">Beta Phase 1</h3>
                <p className="mb-6 opacity-90">We're manually onboarding a select group of creators and power-customers to ensure the best experience possible.</p>
                <div className="flex items-center gap-4 text-sm font-medium">
                  <div className="flex -space-x-2">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-primary bg-muted flex items-center justify-center text-[10px] text-foreground">
                        User
                      </div>
                    ))}
                  </div>
                  <span>Limited spots remaining</span>
                </div>
              </div>
            </div>

            {/* Application Form */}
            <div id="apply" className="scroll-mt-24">
              <Card className="shadow-2xl border-primary/20">
                <CardHeader className="text-center">
                  <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Rocket className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-2xl font-bold">Apply for Access</CardTitle>
                  <CardDescription>Fill in your details and we'll reach out to guide you through the process.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="role">I am a...</Label>
                      <RadioGroup 
                        value={formData.role} 
                        onValueChange={(v) => setFormData(prev => ({ ...prev, role: v }))}
                        className="grid grid-cols-2 gap-4"
                      >
                        <div>
                          <RadioGroupItem value="creator" id="role-creator" className="peer sr-only" />
                          <Label
                            htmlFor="role-creator"
                            className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                          >
                            <Users className="mb-2 h-6 w-6" />
                            <span className="font-semibold">Creator</span>
                          </Label>
                        </div>
                        <div>
                          <RadioGroupItem value="customer" id="role-customer" className="peer sr-only" />
                          <Label
                            htmlFor="role-customer"
                            className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                          >
                            <Sparkles className="mb-2 h-6 w-6" />
                            <span className="font-semibold">Customer</span>
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input 
                          id="name" 
                          placeholder="John Doe" 
                          required 
                          value={formData.name}
                          onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input 
                          id="email" 
                          type="email" 
                          placeholder="john@example.com" 
                          required 
                          value={formData.email}
                          onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number (WhatsApp preferred)</Label>
                        <Input 
                          id="phone" 
                          type="tel" 
                          placeholder="+234 ..." 
                          required 
                          value={formData.phone}
                          onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="message">Anything else you'd like us to know? (Optional)</Label>
                        <Textarea 
                          id="message" 
                          placeholder="Tell us about your brand or what you're looking for..." 
                          rows={3}
                          value={formData.message}
                          onChange={e => setFormData(prev => ({ ...prev, message: e.target.value }))}
                        />
                      </div>
                    </div>

                    <Button type="submit" className="w-full h-12 text-lg" disabled={loading}>
                      {loading ? "Submitting..." : "Apply Now"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t text-center text-muted-foreground">
        <div className="container px-4 mx-auto">
          <p className="mb-4">© 2025 MarketHub. All rights reserved.</p>
          <div className="flex justify-center gap-6 text-sm">
            <Link href="/terms" className="hover:text-foreground">Terms</Link>
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link href="/contact" className="hover:text-foreground">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

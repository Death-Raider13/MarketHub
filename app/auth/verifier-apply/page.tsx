"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ShieldCheck, ArrowRight, CheckCircle2 } from "lucide-react"
import { collection, addDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/config"

export default function VerifierApplyPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    institution: "",
    degree: "",
    expertise: "",
    motivation: ""
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData(prev => ({ ...prev, [id]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      // Save application to Firestore
      await addDoc(collection(db, "verifier_applications"), {
        ...formData,
        fullName: `${formData.firstName} ${formData.lastName}`.trim(),
        status: "pending",
        appliedAt: new Date().toISOString()
      })

      setSubmitted(true)
    } catch (err: any) {
      console.error("Error submitting application:", err)
      setError("Failed to submit application. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 relative overflow-hidden bg-background">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -z-10 opacity-30" />
        <div className="glass-card w-full max-w-md rounded-[2.5rem] p-10 border-white/10 text-center animate-in fade-in zoom-in duration-500">
          <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-3xl font-black mb-4">Application Sent</h2>
          <p className="text-muted-foreground mb-8">
            Thank you for applying to be a FeroLibrary Verifier. Our academic review board will assess your credentials and contact you via email within 48 hours.
          </p>
          <Button asChild className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-foreground font-bold h-12 rounded-xl">
            <Link href="/">Return to Homepage</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 relative overflow-hidden bg-background">
      {/* Background Ambience */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] -z-10 opacity-30" />

      <div className="w-full max-w-[800px] mx-auto z-10 glass-card rounded-[2.5rem] overflow-hidden border-white/10 shadow-2xl flex flex-col md:flex-row">

        {/* Left column - Branding */}
        <div className="w-full md:w-[40%] bg-white/5 p-8 flex flex-col justify-between border-r border-white/5">
          <div>
            <Link href="/" className="inline-block mb-10">
              <div className="flex items-center gap-2">
                <div className="relative h-8 w-8">
                  <img src="/logo.jpg" alt="Logo" className="w-full h-full object-contain" />
                </div>
                <span className="text-xl font-bold tracking-tight">Fero<span className="text-primary text-gradient">Library</span></span>
              </div>
            </Link>

            <Badge className="bg-primary/20 text-primary border-primary/20 mb-4 px-3 py-1 rounded-full text-[10px] font-black uppercase">
              Auditors Network
            </Badge>
            <h1 className="text-3xl font-black mb-4 tracking-tight">
              Verifier <br /> Application.
            </h1>
            <p className="text-sm text-muted-foreground mb-8">
              Verifiers are the backbone of our trust ecosystem. By reviewing and certifying academic materials, you ensure quality and earn revenue share.
            </p>
          </div>

          <div className="p-4 bg-primary/10 border border-primary/20 rounded-2xl flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="text-[11px] leading-tight font-medium text-primary/80">
              We require strong academic credentials (e.g., active lecturer, graduate student, or certified tutor) to join the verification team.
            </div>
          </div>
        </div>

        {/* Right column - Form */}
        <div className="w-full md:w-[60%] p-8 md:p-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <div className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20 text-center font-medium">{error}</div>}

            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground border-b border-white/10 pb-2">Personal Details</h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName" className="text-[10px] text-muted-foreground font-bold uppercase">First Name</Label>
                  <Input id="firstName" required className="bg-black/20 border-white/10 focus:border-primary/50 rounded-xl" value={formData.firstName} onChange={handleChange} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName" className="text-[10px] text-muted-foreground font-bold uppercase">Last Name</Label>
                  <Input id="lastName" required className="bg-black/20 border-white/10 focus:border-primary/50 rounded-xl" value={formData.lastName} onChange={handleChange} />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-[10px] text-muted-foreground font-bold uppercase">Email Address</Label>
                  <Input id="email" type="email" required className="bg-black/20 border-white/10 focus:border-primary/50 rounded-xl" value={formData.email} onChange={handleChange} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-[10px] text-muted-foreground font-bold uppercase">Phone Number</Label>
                  <Input id="phone" type="tel" required className="bg-black/20 border-white/10 focus:border-primary/50 rounded-xl" value={formData.phone} onChange={handleChange} />
                </div>
              </div>

              <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground border-b border-white/10 pb-2 pt-4">Academic Background</h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="institution" className="text-[10px] text-muted-foreground font-bold uppercase">Institution</Label>
                  <Input id="institution" required placeholder="e.g. University of Lagos" className="bg-black/20 border-white/10 focus:border-primary/50 rounded-xl" value={formData.institution} onChange={handleChange} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="degree" className="text-[10px] text-muted-foreground font-bold uppercase">Highest Degree/Level</Label>
                  <Input id="degree" required placeholder="e.g. B.Sc / M.Sc" className="bg-black/20 border-white/10 focus:border-primary/50 rounded-xl" value={formData.degree} onChange={handleChange} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="expertise" className="text-[10px] text-muted-foreground font-bold uppercase">Areas of Expertise</Label>
                <Input id="expertise" required placeholder="e.g. Mathematics, Physics, JAMB Prep" className="bg-black/20 border-white/10 focus:border-primary/50 rounded-xl" value={formData.expertise} onChange={handleChange} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="motivation" className="text-[10px] text-muted-foreground font-bold uppercase">Why do you want to be a verifier?</Label>
                <Textarea
                  id="motivation"
                  required
                  placeholder="Tell us about your experience..."
                  className="bg-black/20 border-white/10 focus:border-primary/50 rounded-xl min-h-[80px]"
                  value={formData.motivation}
                  onChange={handleChange}
                />
              </div>
            </div>

            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white font-black h-12 rounded-xl text-sm transition-all" disabled={loading}>
              {loading ? "Submitting..." : "Submit Application"}
              {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>

            <div className="text-center">
              <Link href="/auth/signup" className="text-xs text-muted-foreground hover:text-white transition-colors">
                Back to Role Selection
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Ensure the badge component is imported
import { Badge } from "@/components/ui/badge"

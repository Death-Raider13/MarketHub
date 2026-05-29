"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/firebase/auth-context"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { 
  Megaphone, 
  Copy, 
  TrendingUp, 
  Users, 
  Wallet, 
  ArrowRight,
  ExternalLink,
  CheckCircle2
} from "lucide-react"

export default function PromoterDashboard() {
  const { userProfile, loading } = useAuth()
  const router = useRouter()
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!loading && userProfile?.role !== "promoter") {
      router.push("/")
    }
  }, [userProfile, loading, router])

  if (loading || !userProfile) {
    return <div className="min-h-screen flex items-center justify-center bg-background">Loading...</div>
  }

  const referralLink = `https://ferolibrary.com/?ref=${userProfile.referralCode || 'PROMOTER'}`

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 py-12 px-4 relative">
        {/* Background Ambient Glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px] pointer-events-none" />
        
        <div className="container mx-auto max-w-6xl relative z-10">
          
          {/* Header section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest mb-4">
                <Megaphone className="h-3 w-3" />
                Affiliate Dashboard
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2">
                Welcome back, <span className="text-gradient">{userProfile.displayName?.split(' ')[0] || 'Promoter'}</span>
              </h1>
              <p className="text-muted-foreground font-medium">Tracking your impact across the FeroLibrary ecosystem.</p>
            </div>
            
            <Button className="bg-muted border border-border hover:bg-muted/80 text-foreground font-bold h-12 px-6 rounded-xl transition-all">
              Withdraw Earnings
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {/* Core Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="glass-card rounded-2xl border-border p-6 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Total Earnings</h3>
                <div className="p-2 glass rounded-xl bg-green-500/10 text-green-500">
                  <Wallet className="h-5 w-5" />
                </div>
              </div>
              <div className="text-4xl font-black mb-1">₦{userProfile.earnings?.toLocaleString() || '0'}</div>
              <div className="text-xs font-medium text-green-500 flex items-center gap-1 mt-auto">
                <TrendingUp className="h-3 w-3" /> +0% this week
              </div>
            </Card>

            <Card className="glass-card rounded-2xl border-white/5 p-6 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Total Referrals</h3>
                <div className="p-2 glass rounded-xl bg-primary/10 text-primary">
                  <Users className="h-5 w-5" />
                </div>
              </div>
              <div className="text-4xl font-black mb-1">0</div>
              <div className="text-xs font-medium text-muted-foreground mt-auto">
                Active users brought to platform
              </div>
            </Card>

            <Card className="glass-card rounded-2xl border-white/5 p-6 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Commission Rate</h3>
                <div className="p-2 glass rounded-xl bg-orange-500/10 text-orange-500">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </div>
              <div className="text-4xl font-black mb-1">{userProfile.commission || 20}%</div>
              <div className="text-xs font-medium text-muted-foreground mt-auto">
                Standard affiliate tier
              </div>
            </Card>
          </div>

          {/* Control Center */}
          <div className="grid md:grid-cols-2 gap-8">
            
            {/* Link Generator */}
            <Card className="glass-card rounded-[2rem] border-border p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[50px]" />
              
              <h2 className="text-2xl font-black mb-2">Your Ambassador Link</h2>
              <p className="text-sm text-muted-foreground mb-8">
                Share this link directly with students. Any signups or purchases made within 30 days will credit your account.
              </p>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-muted/50 border border-border rounded-xl p-4 font-mono text-xs md:text-sm truncate text-muted-foreground">
                    {referralLink}
                  </div>
                  <Button 
                    onClick={copyToClipboard}
                    className="h-14 px-6 rounded-xl bg-primary hover:bg-primary/90 font-bold shadow-[0_0_15px_rgba(79,70,229,0.2)] transition-all"
                  >
                    {copied ? <CheckCircle2 className="h-5 w-5" /> : <Copy className="h-5 w-5 mb-0.5" />}
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border/50">
                  <Button variant="outline" className="w-full bg-muted/50 border-border hover:bg-muted rounded-xl">
                    Share to WhatsApp
                  </Button>
                  <Button variant="outline" className="w-full bg-muted/50 border-border hover:bg-muted rounded-xl">
                    Share to Twitter
                  </Button>
                </div>
              </div>
            </Card>

            {/* Recent Activity */}
            <Card className="glass-card rounded-[2rem] border-border p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black">Recent Conversions</h2>
                <Button variant="link" className="text-sm text-primary p-0">View All</Button>
              </div>
              
              <div className="h-[200px] flex flex-col items-center justify-center text-center border-2 border-dashed border-border/50 rounded-2xl">
                <div className="p-3 bg-muted rounded-full mb-3">
                  <TrendingUp className="h-6 w-6 text-muted-foreground/50" />
                </div>
                <h4 className="font-bold mb-1">No activity yet</h4>
                <p className="text-xs text-muted-foreground">Share your link to generate your first conversion.</p>
              </div>
            </Card>

          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}

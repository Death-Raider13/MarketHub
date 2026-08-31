"use client"

import { useEffect, useState } from 'react'
import { ProtectedRoute } from '@/lib/firebase/protected-route'
import { AdminHeader } from '@/components/admin/admin-header'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { useAuth } from '@/lib/firebase/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Wallet } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

type AffiliatePayout = {
  id: string
  affiliateId: string
  affiliateName?: string
  affiliateEmail?: string
  amount: number
  status: string
  createdAt?: string
  bankDetails?: { accountName: string; accountNumber: string; bankName: string; bankCode: string }
  rejectionReason?: string
}

function AffiliatePayoutsContent() {
  const { user } = useAuth()
  const [payouts, setPayouts] = useState<AffiliatePayout[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)

  const loadPayouts = async () => {
    if (!user) return
    try {
      setLoading(true)
      const token = await user.getIdToken()
      const response = await fetch('/api/affiliate/payouts', { headers: { Authorization: `Bearer ${token}` } })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to load affiliate payouts')
      setPayouts(data.payouts || [])
    } catch (error: any) {
      toast({ title: 'Unable to load payouts', description: error.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadPayouts() }, [user])

  const processPayout = async (payoutId: string) => {
    if (!user) return
    try {
      setProcessingId(payoutId)
      const token = await user.getIdToken()
      const response = await fetch(`/api/affiliate/payouts/${payoutId}/process`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to process payout')
      toast({ title: 'Affiliate payout processed', description: data.transferReference || 'Transfer submitted successfully' })
      await loadPayouts()
    } catch (error: any) {
      toast({ title: 'Payout processing failed', description: error.message, variant: 'destructive' })
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            <div><h1 className="text-3xl font-bold flex items-center gap-2"><Wallet className="h-7 w-7" /> Affiliate payouts</h1><p className="text-muted-foreground mt-1">Review promoter commission withdrawals and process approved bank transfers.</p></div>
            {loading ? <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin" /></div> : payouts.length === 0 ? <Card><CardContent className="py-16 text-center text-muted-foreground">No affiliate payout requests yet.</CardContent></Card> : <div className="grid gap-4">{payouts.map(payout => <Card key={payout.id}><CardHeader className="pb-3"><div className="flex items-start justify-between gap-3"><div><CardTitle className="text-xl">₦{Number(payout.amount).toLocaleString()}</CardTitle><p className="text-sm text-muted-foreground">{payout.affiliateName || 'Affiliate'} · {payout.affiliateEmail || payout.affiliateId}</p></div><Badge variant={payout.status === 'completed' ? 'default' : payout.status === 'rejected' ? 'destructive' : 'secondary'}>{payout.status}</Badge></div></CardHeader><CardContent className="space-y-4"><div className="rounded-lg bg-muted/50 p-3 text-sm space-y-2"><div className="flex items-center justify-between"><p><strong>Account:</strong> {payout.bankDetails?.accountName || 'Not provided'}</p><Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => { navigator.clipboard.writeText(payout.bankDetails?.accountName || ''); toast({ title: 'Copied account name' }); }}>Copy Name</Button></div><div className="flex items-center justify-between font-bold text-primary bg-background/80 p-2 rounded border border-primary/20"><p><strong>Number:</strong> <span className="font-mono text-base">{payout.bankDetails?.accountNumber || 'Not provided'}</span></p><Button variant="secondary" size="sm" className="h-7 text-xs font-bold" onClick={() => { navigator.clipboard.writeText(payout.bankDetails?.accountNumber || ''); toast({ title: 'Copied account number' }); }}>Copy Account #</Button></div><div className="flex items-center justify-between"><p><strong>Bank:</strong> {payout.bankDetails?.bankName || 'Not provided'} ({payout.bankDetails?.bankCode || 'no code'})</p><Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => { navigator.clipboard.writeText(payout.bankDetails?.bankName || ''); toast({ title: 'Copied bank name' }); }}>Copy Bank</Button></div></div>{payout.rejectionReason && <p className="text-sm text-destructive">{payout.rejectionReason}</p>}{(payout.status === 'pending' || payout.status === 'approved') && <Button onClick={() => processPayout(payout.id)} disabled={processingId === payout.id}>{processingId === payout.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Process Paystack transfer</Button>}</CardContent></Card>)}</div>}
          </div>
        </main>
      </div>
    </div>
  )
}

export default function AffiliatePayoutsPage() {
  return <ProtectedRoute allowedRoles={['admin', 'super_admin']}><AffiliatePayoutsContent /></ProtectedRoute>
}

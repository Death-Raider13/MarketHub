"use client"

import { useEffect, useState } from 'react'
import { ProtectedRoute } from '@/lib/firebase/protected-route'
import { AdminHeader } from '@/components/admin/admin-header'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { useAuth } from '@/lib/firebase/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Loader2, Wallet, CheckCircle, XCircle, Copy, AlertCircle } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

type AffiliatePayout = {
  id: string
  affiliateId: string
  affiliateName?: string
  affiliateEmail?: string
  amount: number
  fee?: number
  netAmount?: number
  status: string
  createdAt?: string
  bankDetails?: { accountName: string; accountNumber: string; bankName: string; bankCode?: string }
  rejectionReason?: string
  transactionReference?: string
  notes?: string
}

function AffiliatePayoutsContent() {
  const { user } = useAuth()
  const [payouts, setPayouts] = useState<AffiliatePayout[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)

  // Dialog States
  const [selectedPayout, setSelectedPayout] = useState<AffiliatePayout | null>(null)
  const [actionType, setActionType] = useState<'complete' | 'reject' | null>(null)
  const [transactionRef, setTransactionRef] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [actionNotes, setActionNotes] = useState('')
  const [submittingAction, setSubmittingAction] = useState(false)

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

  const processPaystackTransfer = async (payoutId: string) => {
    if (!user) return
    try {
      setProcessingId(payoutId)
      const token = await user.getIdToken()
      const response = await fetch(`/api/affiliate/payouts/${payoutId}/process`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to process Paystack transfer')
      toast({ title: 'Affiliate payout processed', description: data.transferReference || 'Transfer submitted successfully' })
      await loadPayouts()
    } catch (error: any) {
      toast({ title: 'Paystack Transfer Failed', description: error.message, variant: 'destructive' })
      await loadPayouts()
    } finally {
      setProcessingId(null)
    }
  }

  const handleManualAction = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !selectedPayout || !actionType) return

    try {
      setSubmittingAction(true)
      const token = await user.getIdToken()
      const response = await fetch(`/api/affiliate/payouts/${selectedPayout.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          action: actionType,
          transactionReference: transactionRef,
          rejectionReason: actionType === 'reject' ? rejectionReason : undefined,
          notes: actionNotes
        })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to update payout request')

      toast({
        title: actionType === 'complete' ? 'Payout Marked as Completed' : 'Payout Request Rejected',
        description: actionType === 'complete' ? 'Promoter balance updated and notification email sent.' : 'Restored funds to promoter available balance.'
      })

      setSelectedPayout(null)
      setActionType(null)
      setTransactionRef('')
      setRejectionReason('')
      setActionNotes('')
      await loadPayouts()
    } catch (error: any) {
      toast({ title: 'Action Failed', description: error.message, variant: 'destructive' })
    } finally {
      setSubmittingAction(false)
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Wallet className="h-7 w-7 text-primary" /> Affiliate Payouts
              </h1>
              <p className="text-muted-foreground mt-1">
                Review promoter commission withdrawal requests and disburse payouts manually or via Paystack.
              </p>
            </div>

            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
              </div>
            ) : payouts.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center text-muted-foreground">
                  No affiliate payout requests yet.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {payouts.map(payout => {
                  const fee = payout.fee ?? 100
                  const netAmount = payout.netAmount ?? Math.max(0, Number(payout.amount) - fee)

                  return (
                    <Card key={payout.id} className="border-border/80">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <CardTitle className="text-2xl font-black text-primary">
                              ₦{Number(payout.amount).toLocaleString()}
                            </CardTitle>
                            <p className="text-sm font-medium text-muted-foreground mt-0.5">
                              Promoter: <strong>{payout.affiliateName || 'Promoter'}</strong> ({payout.affiliateEmail || payout.affiliateId})
                            </p>
                          </div>
                          <Badge variant={payout.status === 'completed' ? 'default' : payout.status === 'rejected' ? 'destructive' : 'secondary'} className="capitalize font-bold text-xs">
                            {payout.status}
                          </Badge>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        {/* Bank Details Box */}
                        <div className="rounded-xl bg-muted/60 p-3.5 text-xs space-y-2 border border-border/60">
                          <div className="flex items-center justify-between">
                            <p><strong>Account Name:</strong> {payout.bankDetails?.accountName || 'Not provided'}</p>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 text-[11px]" 
                              onClick={() => { 
                                navigator.clipboard.writeText(payout.bankDetails?.accountName || ''); 
                                toast({ title: 'Copied account name' }); 
                              }}
                            >
                              <Copy className="h-3 w-3 mr-1" /> Copy Name
                            </Button>
                          </div>

                          <div className="flex items-center justify-between font-bold text-primary bg-background/80 p-2 rounded-lg border border-primary/20">
                            <p><strong>Account Number:</strong> <span className="font-mono text-sm sm:text-base">{payout.bankDetails?.accountNumber || 'Not provided'}</span></p>
                            <Button 
                              variant="secondary" 
                              size="sm" 
                              className="h-7 text-xs font-bold gap-1" 
                              onClick={() => { 
                                navigator.clipboard.writeText(payout.bankDetails?.accountNumber || ''); 
                                toast({ title: 'Copied account number' }); 
                              }}
                            >
                              <Copy className="h-3.5 w-3.5" /> Copy Account #
                            </Button>
                          </div>

                          <div className="flex items-center justify-between">
                            <p><strong>Bank Name:</strong> {payout.bankDetails?.bankName || 'Not provided'} {payout.bankDetails?.bankCode ? `(${payout.bankDetails.bankCode})` : ''}</p>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 text-[11px]" 
                              onClick={() => { 
                                navigator.clipboard.writeText(payout.bankDetails?.bankName || ''); 
                                toast({ title: 'Copied bank name' }); 
                              }}
                            >
                              <Copy className="h-3 w-3 mr-1" /> Copy Bank
                            </Button>
                          </div>
                        </div>

                        {/* Amount Breakdown */}
                        <div className="flex items-center justify-between text-xs rounded-lg border bg-muted/30 p-2.5">
                          <span>Gross: <strong>₦{Number(payout.amount).toLocaleString()}</strong></span>
                          <span>Fee: <strong className="text-amber-600">₦{fee}</strong></span>
                          <span className="font-bold text-emerald-600">Net to Bank: ₦{netAmount.toLocaleString()}</span>
                        </div>

                        {payout.rejectionReason && (
                          <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-xs text-destructive">
                            <strong>Rejection Reason:</strong> {payout.rejectionReason}
                          </div>
                        )}

                        {payout.transactionReference && (
                          <p className="text-xs text-muted-foreground font-mono">
                            Ref: {payout.transactionReference}
                          </p>
                        )}

                        {/* Admin Action Buttons */}
                        {(payout.status === 'pending' || payout.status === 'approved' || payout.status === 'processing') && (
                          <div className="flex flex-wrap gap-2 pt-2">
                            <Button 
                              size="sm" 
                              onClick={() => processPaystackTransfer(payout.id)} 
                              disabled={processingId === payout.id}
                              className="bg-blue-600 hover:bg-blue-700 font-semibold"
                            >
                              {processingId === payout.id ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Wallet className="h-4 w-4 mr-1.5" />}
                              Process Paystack Transfer
                            </Button>

                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => {
                                setSelectedPayout(payout)
                                setActionType('complete')
                                setTransactionRef(`MANUAL-AFF-${Date.now().toString().slice(-6)}`)
                              }}
                              className="border-emerald-600 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 font-semibold"
                            >
                              <CheckCircle className="h-4 w-4 mr-1.5 text-emerald-600" />
                              Mark as Completed (Manual)
                            </Button>

                            <Button 
                              size="sm" 
                              variant="destructive" 
                              onClick={() => {
                                setSelectedPayout(payout)
                                setActionType('reject')
                              }}
                              className="font-semibold"
                            >
                              <XCircle className="h-4 w-4 mr-1.5" />
                              Reject Payout
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Action Dialog (Complete or Reject) */}
      {selectedPayout && actionType && (
        <Dialog open={!!selectedPayout} onOpenChange={(open) => { if (!open) setSelectedPayout(null) }}>
          <DialogContent className="max-w-md rounded-2xl p-6">
            <DialogHeader className="space-y-2">
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                {actionType === 'complete' ? (
                  <><CheckCircle className="h-5 w-5 text-emerald-600" /> Mark Affiliate Payout as Completed</>
                ) : (
                  <><AlertCircle className="h-5 w-5 text-destructive" /> Reject Affiliate Payout Request</>
                )}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Promoter: <strong>{selectedPayout.affiliateName || 'Promoter'}</strong> ({selectedPayout.affiliateEmail})
                <br />
                Amount: <strong>₦{Number(selectedPayout.amount).toLocaleString()}</strong> (Net Disburse: <strong>₦{(selectedPayout.netAmount ?? (selectedPayout.amount - 100)).toLocaleString()}</strong>)
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleManualAction} className="space-y-4 py-2">
              {actionType === 'complete' ? (
                <div>
                  <Label htmlFor="txRef" className="text-xs font-bold">Transaction Reference (Bank Transfer Ref)</Label>
                  <Input 
                    id="txRef" 
                    value={transactionRef} 
                    onChange={e => setTransactionRef(e.target.value)} 
                    placeholder="e.g. TRF-83920194 or KUD-849301" 
                    className="font-mono text-sm mt-1"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">Optional. Auto-generated fallback will be used if left empty.</p>
                </div>
              ) : (
                <div>
                  <Label htmlFor="rejReason" className="text-xs font-bold">Rejection Reason *</Label>
                  <Textarea 
                    id="rejReason" 
                    value={rejectionReason} 
                    onChange={e => setRejectionReason(e.target.value)} 
                    placeholder="e.g. Account name mismatch or incorrect account number." 
                    required 
                    className="mt-1 text-sm"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="notes" className="text-xs font-bold">Internal Notes (Optional)</Label>
                <Input 
                  id="notes" 
                  value={actionNotes} 
                  onChange={e => setActionNotes(e.target.value)} 
                  placeholder="e.g. Sent via GTBank mobile app." 
                  className="mt-1 text-sm"
                />
              </div>

              <DialogFooter className="pt-2 flex flex-col sm:flex-row gap-2">
                <Button type="button" variant="outline" onClick={() => setSelectedPayout(null)} className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={submittingAction} 
                  variant={actionType === 'reject' ? 'destructive' : 'default'}
                  className={`w-full sm:w-auto font-bold ${actionType === 'complete' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
                >
                  {submittingAction ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                  {actionType === 'complete' ? 'Confirm Completed' : 'Confirm Rejection'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

export default function AffiliatePayoutsPage() {
  return (
    <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
      <AffiliatePayoutsContent />
    </ProtectedRoute>
  )
}

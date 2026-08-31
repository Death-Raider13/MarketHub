'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ProtectedRoute } from '@/lib/firebase/protected-route';
import { AdminHeader } from '@/components/admin/admin-header';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { DollarSign, Clock, CheckCircle, XCircle, AlertCircle, Wallet, TrendingUp, Copy } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { PayoutRequest } from '@/lib/types';
import { useAuth } from '@/lib/firebase/auth-context';

function AdminPayoutsContent() {
  const { user } = useAuth();
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayout, setSelectedPayout] = useState<PayoutRequest | null>(null);
  const [actionDialog, setActionDialog] = useState<'approve' | 'reject' | 'complete' | 'process' | null>(null);
  const [transactionRef, setTransactionRef] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  const [stats, setStats] = useState({
    totalPending: 0,
    totalPendingAmount: 0,
    totalProcessing: 0,
    totalProcessingAmount: 0,
    totalCompleted: 0,
    totalCompletedAmount: 0,
  });

  useEffect(() => {
    loadPayouts();
  }, []);

  const loadPayouts = async () => {
    setLoading(true);
    try {
      const payoutsQuery = query(
        collection(db, 'payoutRequests'),
        orderBy('requestedAt', 'desc')
      );
      const payoutsSnapshot = await getDocs(payoutsQuery);
      const payoutsData = payoutsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        requestedAt: doc.data().requestedAt?.toDate(),
        processedAt: doc.data().processedAt?.toDate(),
      })) as PayoutRequest[];

      setPayouts(payoutsData);

      // Calculate stats
      const pending = payoutsData.filter(p => p.status === 'pending');
      const processing = payoutsData.filter(p => p.status === 'processing' || p.status === 'approved');
      const completed = payoutsData.filter(p => p.status === 'completed');

      setStats({
        totalPending: pending.length,
        totalPendingAmount: pending.reduce((sum, p) => sum + p.amount, 0),
        totalProcessing: processing.length,
        totalProcessingAmount: processing.reduce((sum, p) => sum + p.amount, 0),
        totalCompleted: completed.length,
        totalCompletedAmount: completed.reduce((sum, p) => sum + p.amount, 0),
      });
    } catch (error) {
      console.error('Error loading payouts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load payout requests',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (payout: PayoutRequest, action: 'approve' | 'reject' | 'complete' | 'process') => {
    setSelectedPayout(payout);
    setActionDialog(action);
    setTransactionRef('');
    setRejectionReason('');
    setNotes('');
  };

  const confirmAction = async () => {
    if (!selectedPayout || !actionDialog || !user) return;

    setProcessing(true);
    try {
      const payload: any = {
        action: actionDialog,
        notes,
        adminUserId: user.uid,
      };

      if (actionDialog === 'reject') {
        if (!rejectionReason) {
          toast({
            title: 'Rejection Reason Required',
            description: 'Please provide a reason for rejection',
            variant: 'destructive',
          });
          setProcessing(false);
          return;
        }
        payload.rejectionReason = rejectionReason;
      } else if (actionDialog === 'complete') {
        const finalRef = transactionRef.trim() || `MANUAL-TRF-${Date.now().toString().slice(-6)}`
        payload.transactionReference = finalRef;
      } else if (actionDialog === 'process') {
        // Process transfer via Paystack
        const processResponse = await fetch(`/api/payouts/${selectedPayout.id}/process`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ adminUserId: user.uid }),
        });

        if (!processResponse.ok) {
          const errorData = await processResponse.json().catch(() => ({}));
          toast({
            title: 'Transfer Failed',
            description: errorData.error || 'Failed to process transfer via Paystack',
            variant: 'destructive',
          });
          setProcessing(false);
          return;
        }

        const processResult = await processResponse.json();
        toast({
          title: 'Transfer Successful',
          description: `Transfer processed successfully via Paystack. Reference: ${processResult.reference}`,
        });

        setActionDialog(null);
        setSelectedPayout(null);
        loadPayouts();
        setProcessing(false);
        return;
      }

      const response = await fetch(`/api/payouts/${selectedPayout.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        toast({
          title: 'Error',
          description: errorData.error || 'Failed to process payout',
          variant: 'destructive',
        });
        setProcessing(false);
        return;
      }

      toast({
        title: 'Success',
        description: `Payout ${actionDialog}d successfully`,
      });

      setActionDialog(null);
      setSelectedPayout(null);
      loadPayouts();
    } catch (error) {
      console.error('Error processing payout:', error);
      toast({
        title: 'Error',
        description: 'Failed to process payout',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: PayoutRequest['status']) => {
    const variants: Record<PayoutRequest['status'], { variant: any; icon: any; color: string }> = {
      pending: { variant: 'secondary', icon: Clock, color: 'text-yellow-600' },
      approved: { variant: 'default', icon: CheckCircle, color: 'text-blue-600' },
      processing: { variant: 'default', icon: AlertCircle, color: 'text-blue-600' },
      completed: { variant: 'default', icon: CheckCircle, color: 'text-green-600' },
      rejected: { variant: 'destructive', icon: XCircle, color: 'text-red-600' },
      cancelled: { variant: 'secondary', icon: XCircle, color: 'text-gray-600' },
    };

    const { variant, icon: Icon, color } = variants[status];

    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className={`h-3 w-3 ${color}`} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const filterPayouts = (status?: PayoutRequest['status']) => {
    if (!status) return payouts;
    return payouts.filter(p => p.status === status);
  };

  const PayoutCard = ({ payout }: { payout: PayoutRequest }) => (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-lg">₦{payout.amount.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">{payout.creatorName}</p>
              <p className="text-xs text-muted-foreground">{payout.creatorEmail}</p>
            </div>
            {getStatusBadge(payout.status)}
          </div>

          <div className="space-y-1 text-sm">
            <p><span className="font-medium">Requested:</span> {payout.requestedAt.toLocaleDateString()} at {payout.requestedAt.toLocaleTimeString()}</p>
            <p><span className="font-medium">Payment Method:</span> {payout.paymentMethod.replace('_', ' ').toUpperCase()}</p>

            {payout.bankDetails && (
              <div className="p-3 bg-muted rounded-lg mt-2 border border-border/80 space-y-1.5 text-xs">
                <p className="font-semibold text-foreground mb-1">Bank Details:</p>
                <div className="flex items-center justify-between">
                  <span>Name: <strong>{payout.bankDetails.accountName}</strong></span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { navigator.clipboard.writeText(payout.bankDetails?.accountName || ''); toast({ title: 'Copied account name' }); }}>
                    <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </div>
                <div className="flex items-center justify-between font-bold text-primary bg-background/80 p-1.5 rounded border border-primary/20">
                  <span>Account: <strong className="font-mono text-sm">{payout.bankDetails.accountNumber}</strong></span>
                  <Button variant="secondary" size="sm" className="h-6 text-[11px] font-bold gap-1 px-2" onClick={() => { navigator.clipboard.writeText(payout.bankDetails?.accountNumber || ''); toast({ title: 'Copied account number' }); }}>
                    <Copy className="h-3 w-3" /> Copy Account #
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <span>Bank: <strong>{payout.bankDetails.bankName}</strong> {payout.bankDetails.bankCode ? `(${payout.bankDetails.bankCode})` : ''}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { navigator.clipboard.writeText(payout.bankDetails?.bankName || ''); toast({ title: 'Copied bank name' }); }}>
                    <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            )}

            {payout.mobileMoneyDetails && (
              <div className="p-2 bg-muted rounded mt-2">
                <p className="font-medium mb-1">Mobile Money Details:</p>
                <p>Provider: {payout.mobileMoneyDetails.provider}</p>
                <p>Phone: {payout.mobileMoneyDetails.phoneNumber}</p>
                <p>Name: {payout.mobileMoneyDetails.accountName}</p>
              </div>
            )}

            {payout.paypalEmail && (
              <div className="p-2 bg-muted rounded mt-2">
                <p className="font-medium mb-1">PayPal Details:</p>
                <p>Email: {payout.paypalEmail}</p>
              </div>
            )}

            {(payout as any).cryptoWallet && (
              <div className="p-2 bg-muted rounded mt-2 border border-orange-200">
                <p className="font-medium mb-1">🪙 Crypto Wallet (Manual Settlement):</p>
                <p className="font-mono text-xs break-all">{(payout as any).cryptoWallet}</p>
                <p className="text-xs text-muted-foreground mt-1">Process via Coinbase or send manually to the address above.</p>
              </div>
            )}

            {payout.transactionReference && (
              <p><span className="font-medium">Transaction Ref:</span> {payout.transactionReference}</p>
            )}

            {payout.processedAt && (
              <p><span className="font-medium">Processed:</span> {payout.processedAt.toLocaleDateString()}</p>
            )}

            {payout.rejectionReason && (
              <Alert variant="destructive" className="mt-2">
                <AlertDescription>
                  <span className="font-medium">Rejection Reason:</span> {payout.rejectionReason}
                </AlertDescription>
              </Alert>
            )}

            {payout.notes && (
              <Alert className="mt-2">
                <AlertDescription>
                  <span className="font-medium">Notes:</span> {payout.notes}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {payout.status === 'pending' && (
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                onClick={() => handleAction(payout, 'approve')}
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleAction(payout, 'reject')}
                className="flex-1"
              >
                <XCircle className="h-4 w-4 mr-1" />
                Reject
              </Button>
            </div>
          )}

          {(payout.status === 'approved' || payout.status === 'processing') && (
            <div className="flex gap-2 pt-2">
              {payout.paymentMethod === 'bank_transfer' && payout.status === 'approved' && (
                <Button
                  size="sm"
                  onClick={() => handleAction(payout, 'process')}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <DollarSign className="h-4 w-4 mr-1" />
                  Process Transfer
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => handleAction(payout, 'complete')}
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Mark as Completed
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex h-screen flex-col">
      <AdminHeader />

      <div className="flex flex-1 overflow-hidden">
        <AdminSidebar />

        <main className="flex-1 overflow-y-auto bg-muted/30 p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Wallet className="h-8 w-8" />
              Payout Management
            </h1>
            <p className="text-muted-foreground">Review and process creator withdrawal requests</p>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pending Requests</p>
                    <p className="text-2xl font-bold">{stats.totalPending}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      ₦{stats.totalPendingAmount.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-full bg-yellow-500/10 p-3">
                    <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Processing</p>
                    <p className="text-2xl font-bold">{stats.totalProcessing}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      ₦{stats.totalProcessingAmount.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-full bg-blue-500/10 p-3">
                    <AlertCircle className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Completed</p>
                    <p className="text-2xl font-bold">{stats.totalCompleted}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      ₦{stats.totalCompletedAmount.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-full bg-green-500/10 p-3">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="pending" className="space-y-6">
            <TabsList>
              <TabsTrigger value="pending">
                Pending ({stats.totalPending})
              </TabsTrigger>
              <TabsTrigger value="processing">
                Processing ({stats.totalProcessing})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed ({stats.totalCompleted})
              </TabsTrigger>
              <TabsTrigger value="all">
                All Requests
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              {loading ? (
                <p>Loading...</p>
              ) : filterPayouts('pending').length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No pending payout requests</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filterPayouts('pending').map(payout => (
                    <PayoutCard key={payout.id} payout={payout} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="processing">
              {loading ? (
                <p>Loading...</p>
              ) : filterPayouts('approved').length === 0 && filterPayouts('processing').length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No payouts being processed</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {[...filterPayouts('approved'), ...filterPayouts('processing')].map(payout => (
                    <PayoutCard key={payout.id} payout={payout} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="completed">
              {loading ? (
                <p>Loading...</p>
              ) : filterPayouts('completed').length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No completed payouts</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filterPayouts('completed').map(payout => (
                    <PayoutCard key={payout.id} payout={payout} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="all">
              {loading ? (
                <p>Loading...</p>
              ) : payouts.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No payout requests</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {payouts.map(payout => (
                    <PayoutCard key={payout.id} payout={payout} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Action Dialogs */}
      <Dialog open={actionDialog === 'approve'} onOpenChange={() => setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Payout Request</DialogTitle>
            <DialogDescription>
              Approve this withdrawal request for ₦{selectedPayout?.amount.toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this approval..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>
              Cancel
            </Button>
            <Button onClick={confirmAction} disabled={processing}>
              {processing ? 'Processing...' : 'Approve Payout'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={actionDialog === 'reject'} onOpenChange={() => setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Payout Request</DialogTitle>
            <DialogDescription>
              Reject this withdrawal request for ₦{selectedPayout?.amount.toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rejectionReason">Rejection Reason *</Label>
              <Textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Provide a reason for rejection..."
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmAction} disabled={processing}>
              {processing ? 'Processing...' : 'Reject Payout'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={actionDialog === 'complete'} onOpenChange={() => setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Payout (Manual Transfer)</DialogTitle>
            <DialogDescription>
              Mark this Net Payout of ₦{(selectedPayout ? (selectedPayout.netAmount || (selectedPayout.amount - 100)) : 0).toLocaleString()} (after ₦100 fee) as completed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="transactionRef">Transaction Reference (Optional)</Label>
              <Input
                id="transactionRef"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                placeholder="e.g. 00001928374 (Leave blank to auto-generate)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="completionNotes">Notes (Optional)</Label>
              <Textarea
                id="completionNotes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this transaction..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>
              Cancel
            </Button>
            <Button onClick={confirmAction} disabled={processing}>
              {processing ? 'Processing...' : 'Complete Payout'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={actionDialog === 'process'} onOpenChange={() => setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Transfer via Paystack</DialogTitle>
            <DialogDescription>
              This will initiate a bank transfer of ₦{(selectedPayout ? (selectedPayout.netAmount || (selectedPayout.amount - 100)) : 0).toLocaleString()} via Paystack
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedPayout && (
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <h4 className="font-medium">Transfer Details</h4>
                <div className="text-sm space-y-1">
                  <p><span className="font-medium">Creator:</span> {selectedPayout.creatorName}</p>
                  <p><span className="font-medium">Gross Requested Amount:</span> ₦{selectedPayout.amount.toLocaleString()}</p>
                  <p><span className="font-medium">Processing Fee:</span> ₦{(selectedPayout.fee || 100).toLocaleString()}</p>
                  <p><span className="font-semibold text-emerald-600">Net Payout to Bank:</span> <strong className="text-emerald-700">₦{(selectedPayout.netAmount || (selectedPayout.amount - 100)).toLocaleString()}</strong></p>
                  <p><span className="font-medium">Bank:</span> {selectedPayout.bankDetails?.bankName}</p>
                  <p><span className="font-medium">Account:</span> {selectedPayout.bankDetails?.accountNumber}</p>
                  <p><span className="font-medium">Account Name:</span> {selectedPayout.bankDetails?.accountName}</p>
                </div>
              </div>
            )}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This will create a transfer recipient and initiate the transfer via Paystack.
                The transfer will be processed immediately and cannot be undone.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>
              Cancel
            </Button>
            <Button onClick={confirmAction} disabled={processing} className="bg-green-600 hover:bg-green-700">
              {processing ? 'Processing Transfer...' : 'Process Transfer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminPayoutsPage() {
  return (
    <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
      <AdminPayoutsContent />
    </ProtectedRoute>
  );
}

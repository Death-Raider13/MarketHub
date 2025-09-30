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
import { collection, getDocs, query, where, orderBy, updateDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { DollarSign, Clock, CheckCircle, XCircle, AlertCircle, Wallet, TrendingUp } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { PayoutRequest } from '@/lib/types';
import { useAuth } from '@/lib/firebase/auth-context';

function AdminPayoutsContent() {
  const { user } = useAuth();
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayout, setSelectedPayout] = useState<PayoutRequest | null>(null);
  const [actionDialog, setActionDialog] = useState<'approve' | 'reject' | 'complete' | null>(null);
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

  const handleAction = (payout: PayoutRequest, action: 'approve' | 'reject' | 'complete') => {
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
      const updateData: any = {
        processedAt: new Date(),
        processedBy: user.uid,
      };

      if (actionDialog === 'approve') {
        updateData.status = 'approved';
        if (notes) updateData.notes = notes;
      } else if (actionDialog === 'reject') {
        if (!rejectionReason) {
          toast({
            title: 'Rejection Reason Required',
            description: 'Please provide a reason for rejection',
            variant: 'destructive',
          });
          setProcessing(false);
          return;
        }
        updateData.status = 'rejected';
        updateData.rejectionReason = rejectionReason;
      } else if (actionDialog === 'complete') {
        if (!transactionRef) {
          toast({
            title: 'Transaction Reference Required',
            description: 'Please provide a transaction reference',
            variant: 'destructive',
          });
          setProcessing(false);
          return;
        }
        updateData.status = 'completed';
        updateData.transactionReference = transactionRef;
        if (notes) updateData.notes = notes;

        // Update vendor balance
        const balanceRef = doc(db, 'vendorBalances', selectedPayout.vendorId);
        const balanceDoc = await getDoc(balanceRef);
        
        if (balanceDoc.exists()) {
          const currentBalance = balanceDoc.data();
          await updateDoc(balanceRef, {
            availableBalance: (currentBalance.availableBalance || 0) - selectedPayout.amount,
            totalWithdrawn: (currentBalance.totalWithdrawn || 0) + selectedPayout.amount,
            lastPayoutDate: new Date(),
            updatedAt: new Date(),
          });
        }
      }

      await updateDoc(doc(db, 'payoutRequests', selectedPayout.id), updateData);

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
              <p className="text-sm text-muted-foreground">{payout.vendorName}</p>
              <p className="text-xs text-muted-foreground">{payout.vendorEmail}</p>
            </div>
            {getStatusBadge(payout.status)}
          </div>

          <div className="space-y-1 text-sm">
            <p><span className="font-medium">Requested:</span> {payout.requestedAt.toLocaleDateString()} at {payout.requestedAt.toLocaleTimeString()}</p>
            <p><span className="font-medium">Payment Method:</span> {payout.paymentMethod.replace('_', ' ').toUpperCase()}</p>
            
            {payout.bankDetails && (
              <div className="p-2 bg-muted rounded mt-2">
                <p className="font-medium mb-1">Bank Details:</p>
                <p>Name: {payout.bankDetails.accountName}</p>
                <p>Account: {payout.bankDetails.accountNumber}</p>
                <p>Bank: {payout.bankDetails.bankName}</p>
                {payout.bankDetails.bankCode && <p>Code: {payout.bankDetails.bankCode}</p>}
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
            <Button
              size="sm"
              onClick={() => handleAction(payout, 'complete')}
              className="w-full"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Mark as Completed
            </Button>
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
            <p className="text-muted-foreground">Review and process vendor withdrawal requests</p>
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
            <DialogTitle>Complete Payout</DialogTitle>
            <DialogDescription>
              Mark this payout of ₦{selectedPayout?.amount.toLocaleString()} as completed
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="transactionRef">Transaction Reference *</Label>
              <Input
                id="transactionRef"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                placeholder="Enter transaction reference number"
                required
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

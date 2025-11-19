'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/lib/firebase/auth-context';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { updateVendorBalance } from '@/lib/firebase/firestore';
import { DollarSign, Wallet, TrendingUp, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { PayoutRequest, VendorBalance } from '@/lib/types';

export default function VendorPayoutsPage() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<VendorBalance | null>(null);
  const [payoutHistory, setPayoutHistory] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'mobile_money' | 'paypal'>('bank_transfer');
  
  // Bank transfer fields
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankCode, setBankCode] = useState('');
  
  // Mobile money fields
  const [mobileProvider, setMobileProvider] = useState('');
  const [mobilePhone, setMobilePhone] = useState('');
  const [mobileAccountName, setMobileAccountName] = useState('');
  
  // PayPal fields
  const [paypalEmail, setPaypalEmail] = useState('');

  useEffect(() => {
    if (user) {
      loadPayoutData();
    }
  }, [user]);

  const loadPayoutData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Load vendor balance
      const balanceDoc = await getDoc(doc(db, 'vendorBalances', user.uid));
      if (balanceDoc.exists()) {
        setBalance({ id: balanceDoc.id, ...balanceDoc.data() } as any);
      } else {
        // Initialize balance if it doesn't exist
        setBalance({
          vendorId: user.uid,
          availableBalance: 0,
          pendingBalance: 0,
          totalEarnings: 0,
          totalWithdrawn: 0,
          updatedAt: new Date(),
        } as any);
      }

      // Load payout history
      const payoutsQuery = query(
        collection(db, 'payoutRequests'),
        where('vendorId', '==', user.uid),
        orderBy('requestedAt', 'desc')
      );
      const payoutsSnapshot = await getDocs(payoutsQuery);
      const payouts = payoutsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        requestedAt: doc.data().requestedAt?.toDate(),
        processedAt: doc.data().processedAt?.toDate(),
      })) as PayoutRequest[];
      setPayoutHistory(payouts);
    } catch (error) {
      console.error('Error loading payout data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load payout data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !balance) return;

    const requestAmount = parseFloat(amount);
    
    // Validation
    if (isNaN(requestAmount) || requestAmount <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid amount',
        variant: 'destructive',
      });
      return;
    }

    if (requestAmount > balance.availableBalance) {
      toast({
        title: 'Insufficient Balance',
        description: `You can only withdraw up to ₦${balance.availableBalance.toLocaleString()}`,
        variant: 'destructive',
      });
      return;
    }

    if (requestAmount < 1000) {
      toast({
        title: 'Minimum Withdrawal',
        description: 'Minimum withdrawal amount is ₦1,000',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const payoutData: Omit<PayoutRequest, 'id'> = {
        vendorId: user.uid,
        vendorName: user.displayName || 'Unknown Vendor',
        vendorEmail: user.email || '',
        amount: requestAmount,
        paymentMethod,
        status: 'pending',
        requestedAt: new Date(),
      };

      // Add payment method specific details
      if (paymentMethod === 'bank_transfer') {
        if (!accountName || !accountNumber || !bankName) {
          toast({
            title: 'Missing Information',
            description: 'Please fill in all bank details',
            variant: 'destructive',
          });
          setSubmitting(false);
          return;
        }
        payoutData.bankDetails = {
          accountName,
          accountNumber,
          bankName,
          bankCode,
        };
      } else if (paymentMethod === 'mobile_money') {
        if (!mobileProvider || !mobilePhone || !mobileAccountName) {
          toast({
            title: 'Missing Information',
            description: 'Please fill in all mobile money details',
            variant: 'destructive',
          });
          setSubmitting(false);
          return;
        }
        payoutData.mobileMoneyDetails = {
          provider: mobileProvider,
          phoneNumber: mobilePhone,
          accountName: mobileAccountName,
        };
      } else if (paymentMethod === 'paypal') {
        if (!paypalEmail) {
          toast({
            title: 'Missing Information',
            description: 'Please enter your PayPal email',
            variant: 'destructive',
          });
          setSubmitting(false);
          return;
        }
        payoutData.paypalEmail = paypalEmail;
      }

      await addDoc(collection(db, 'payoutRequests'), payoutData);

      // Move funds from available to pending balance for this vendor
      try {
        const newAvailable = (balance.availableBalance || 0) - requestAmount;
        const newPending = (balance.pendingBalance || 0) + requestAmount;

        await updateVendorBalance(user.uid, {
          ...balance,
          availableBalance: newAvailable,
          pendingBalance: newPending,
        });

        setBalance(prev => prev ? {
          ...prev,
          availableBalance: newAvailable,
          pendingBalance: newPending,
        } : prev);
      } catch (balanceError) {
        console.error('Error updating vendor balance after payout request:', balanceError);
      }

      toast({
        title: 'Payout Request Submitted',
        description: 'Your withdrawal request has been submitted for review',
      });

      // Reset form
      setAmount('');
      setAccountName('');
      setAccountNumber('');
      setBankName('');
      setBankCode('');
      setMobileProvider('');
      setMobilePhone('');
      setMobileAccountName('');
      setPaypalEmail('');

      // Reload data
      loadPayoutData();
    } catch (error) {
      console.error('Error submitting payout:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit payout request',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: PayoutRequest['status']) => {
    const variants: Record<PayoutRequest['status'], { variant: any; icon: any }> = {
      pending: { variant: 'secondary', icon: Clock },
      approved: { variant: 'default', icon: CheckCircle },
      processing: { variant: 'default', icon: AlertCircle },
      completed: { variant: 'default', icon: CheckCircle },
      rejected: { variant: 'destructive', icon: XCircle },
    };
    
    const { variant, icon: Icon } = variants[status];
    
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <p>Loading payout information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Wallet className="h-8 w-8" />
          Payouts & Withdrawals
        </h1>
        <p className="text-muted-foreground">Manage your earnings and withdrawal requests</p>
      </div>

      {/* Balance Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Available Balance</p>
                <p className="text-2xl font-bold">₦{balance?.availableBalance.toLocaleString() || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Ready to withdraw</p>
              </div>
              <div className="rounded-full bg-green-500/10 p-3">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Balance</p>
                <p className="text-2xl font-bold">₦{balance?.pendingBalance.toLocaleString() || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Processing orders</p>
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
                <p className="text-sm text-muted-foreground">Total Earnings</p>
                <p className="text-2xl font-bold">₦{balance?.totalEarnings.toLocaleString() || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">All time</p>
              </div>
              <div className="rounded-full bg-blue-500/10 p-3">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="request" className="space-y-6">
        <TabsList>
          <TabsTrigger value="request">Request Payout</TabsTrigger>
          <TabsTrigger value="history">Payout History</TabsTrigger>
        </TabsList>

        <TabsContent value="request">
          <Card>
            <CardHeader>
              <CardTitle>Request Withdrawal</CardTitle>
              <CardDescription>
                Submit a withdrawal request. Minimum withdrawal is ₦1,000. Funds will be processed within 3-5 business days.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitPayout} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="amount">Withdrawal Amount (₦)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="1000"
                    max={balance?.availableBalance || 0}
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    Available: ₦{balance?.availableBalance.toLocaleString() || 0}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <Select value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank_transfer">Bank Transfer (Nigeria)</SelectItem>
                      <SelectItem value="mobile_money">Mobile Money</SelectItem>
                      <SelectItem value="paypal">PayPal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {paymentMethod === 'bank_transfer' && (
                  <div className="space-y-4 p-4 border rounded-lg">
                    <h3 className="font-semibold">Bank Transfer Details</h3>
                    <div className="space-y-2">
                      <Label htmlFor="accountName">Account Name</Label>
                      <Input
                        id="accountName"
                        value={accountName}
                        onChange={(e) => setAccountName(e.target.value)}
                        placeholder="Full name as on bank account"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="accountNumber">Account Number</Label>
                      <Input
                        id="accountNumber"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        placeholder="10-digit account number"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bankName">Bank Name</Label>
                      <Select value={bankName} onValueChange={setBankName}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your bank" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Access Bank">Access Bank</SelectItem>
                          <SelectItem value="GTBank">GTBank</SelectItem>
                          <SelectItem value="First Bank">First Bank</SelectItem>
                          <SelectItem value="UBA">UBA</SelectItem>
                          <SelectItem value="Zenith Bank">Zenith Bank</SelectItem>
                          <SelectItem value="Ecobank">Ecobank</SelectItem>
                          <SelectItem value="Fidelity Bank">Fidelity Bank</SelectItem>
                          <SelectItem value="Union Bank">Union Bank</SelectItem>
                          <SelectItem value="Stanbic IBTC">Stanbic IBTC</SelectItem>
                          <SelectItem value="Sterling Bank">Sterling Bank</SelectItem>
                          <SelectItem value="Wema Bank">Wema Bank</SelectItem>
                          <SelectItem value="Polaris Bank">Polaris Bank</SelectItem>
                          <SelectItem value="Kuda Bank">Kuda Bank</SelectItem>
                          <SelectItem value="Opay">Opay</SelectItem>
                          <SelectItem value="PalmPay">PalmPay</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bankCode">Bank Code (Optional)</Label>
                      <Input
                        id="bankCode"
                        value={bankCode}
                        onChange={(e) => setBankCode(e.target.value)}
                        placeholder="Bank sort code"
                      />
                    </div>
                  </div>
                )}

                {paymentMethod === 'mobile_money' && (
                  <div className="space-y-4 p-4 border rounded-lg">
                    <h3 className="font-semibold">Mobile Money Details</h3>
                    <div className="space-y-2">
                      <Label htmlFor="mobileProvider">Provider</Label>
                      <Select value={mobileProvider} onValueChange={setMobileProvider}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select provider" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MTN Mobile Money">MTN Mobile Money</SelectItem>
                          <SelectItem value="Airtel Money">Airtel Money</SelectItem>
                          <SelectItem value="9mobile">9mobile</SelectItem>
                          <SelectItem value="Glo">Glo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mobilePhone">Phone Number</Label>
                      <Input
                        id="mobilePhone"
                        value={mobilePhone}
                        onChange={(e) => setMobilePhone(e.target.value)}
                        placeholder="080XXXXXXXX"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mobileAccountName">Account Name</Label>
                      <Input
                        id="mobileAccountName"
                        value={mobileAccountName}
                        onChange={(e) => setMobileAccountName(e.target.value)}
                        placeholder="Name registered with mobile money"
                        required
                      />
                    </div>
                  </div>
                )}

                {paymentMethod === 'paypal' && (
                  <div className="space-y-4 p-4 border rounded-lg">
                    <h3 className="font-semibold">PayPal Details</h3>
                    <div className="space-y-2">
                      <Label htmlFor="paypalEmail">PayPal Email</Label>
                      <Input
                        id="paypalEmail"
                        type="email"
                        value={paypalEmail}
                        onChange={(e) => setPaypalEmail(e.target.value)}
                        placeholder="your@email.com"
                        required
                      />
                    </div>
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        PayPal withdrawals may incur additional fees and take longer to process.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}

                <Button type="submit" disabled={submitting || !balance || balance.availableBalance < 1000}>
                  {submitting ? 'Submitting...' : 'Submit Withdrawal Request'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Payout History</CardTitle>
              <CardDescription>View all your withdrawal requests and their status</CardDescription>
            </CardHeader>
            <CardContent>
              {payoutHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No payout requests yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {payoutHistory.map((payout) => (
                    <div key={payout.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-lg">₦{payout.amount.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">
                            {payout.requestedAt.toLocaleDateString()} at {payout.requestedAt.toLocaleTimeString()}
                          </p>
                        </div>
                        {getStatusBadge(payout.status)}
                      </div>
                      
                      <div className="space-y-1 text-sm">
                        <p><span className="font-medium">Payment Method:</span> {payout.paymentMethod.replace('_', ' ').toUpperCase()}</p>
                        
                        {payout.bankDetails && (
                          <p><span className="font-medium">Bank:</span> {payout.bankDetails.bankName} - {payout.bankDetails.accountNumber}</p>
                        )}
                        
                        {payout.mobileMoneyDetails && (
                          <p><span className="font-medium">Mobile Money:</span> {payout.mobileMoneyDetails.provider} - {payout.mobileMoneyDetails.phoneNumber}</p>
                        )}
                        
                        {payout.paypalEmail && (
                          <p><span className="font-medium">PayPal:</span> {payout.paypalEmail}</p>
                        )}
                        
                        {payout.transactionReference && (
                          <p><span className="font-medium">Reference:</span> {payout.transactionReference}</p>
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
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

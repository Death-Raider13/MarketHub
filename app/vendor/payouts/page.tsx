'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/lib/firebase/auth-context';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { DollarSign, Wallet, TrendingUp, Clock, CheckCircle, XCircle, AlertCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { PayoutRequest, VendorBalance } from '@/lib/types';

export default function VendorPayoutsPage() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<VendorBalance | null>(null);
  const [payoutHistory, setPayoutHistory] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Pending payout state
  const [pendingPayout, setPendingPayout] = useState<PayoutRequest | null>(null);
  
  // Form state
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'mobile_money' | 'paypal'>('bank_transfer');
  
  // Bank transfer fields
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [banks, setBanks] = useState<Array<{code: string, name: string, slug: string}>>([]);
  const [verifyingAccount, setVerifyingAccount] = useState(false);
  const [accountVerified, setAccountVerified] = useState(false);
  const [bankSearch, setBankSearch] = useState('');
  const [showBankDropdown, setShowBankDropdown] = useState(false);

  // Filter banks based on search
  const filteredBanks = banks.filter(bank => 
    bank.name.toLowerCase().includes(bankSearch.toLowerCase())
  );
  
  // Mobile money fields
  const [mobileProvider, setMobileProvider] = useState('');
  const [mobilePhone, setMobilePhone] = useState('');
  const [mobileAccountName, setMobileAccountName] = useState('');
  
  // PayPal fields
  const [paypalEmail, setPaypalEmail] = useState('');

  useEffect(() => {
    if (user) {
      loadPayoutData();
      loadBanks();
    }
  }, [user]);

  const loadBanks = async () => {
    try {
      const response = await fetch('/api/payouts/banks');
      if (response.ok) {
        const data = await response.json();
        setBanks(data.banks || []);
      }
    } catch (error) {
      console.error('Error loading banks:', error);
    }
  };

  const verifyAccount = async () => {
    if (!accountNumber || !bankCode) return;

    setVerifyingAccount(true);
    try {
      const response = await fetch('/api/payouts/verify-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountNumber,
          bankCode,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setAccountName(data.accountDetails.accountName);
        setAccountVerified(true);
        toast({
          title: 'Account Verified',
          description: `Account belongs to ${data.accountDetails.accountName}`,
        });
      } else {
        toast({
          title: 'Verification Failed',
          description: data.error || 'Failed to verify account. Please check your details.',
          variant: 'destructive',
        });
        setAccountVerified(false);
      }
    } catch (error) {
      console.error('Error verifying account:', error);
      toast({
        title: 'Error',
        description: 'Failed to verify account. Please try again.',
        variant: 'destructive',
      });
      setAccountVerified(false);
    } finally {
      setVerifyingAccount(false);
    }
  };

  const loadPayoutData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Load vendor balance
      const balanceDoc = await getDoc(doc(db, 'vendorBalances', user.uid));
      if (balanceDoc.exists()) {
        setBalance({ id: balanceDoc.id, ...balanceDoc.data() } as any);
      } else {
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

      // Check for pending/processing payouts
      const activePayout = payouts.find(p => 
        p.status === 'pending' || p.status === 'approved' || p.status === 'processing'
      );
      setPendingPayout(activePayout || null);

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

    // Check for existing pending payout
    if (pendingPayout) {
      toast({
        title: 'Payout Already In Progress',
        description: `You have a ${pendingPayout.status} payout request for ₦${pendingPayout.amount.toLocaleString()}. Please wait for it to be processed or cancel it before requesting a new one.`,
        variant: 'destructive',
      });
      return;
    }

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
      const payoutData: any = {
        vendorId: user.uid,
        vendorName: user.displayName || 'Unknown Vendor',
        vendorEmail: user.email || '',
        amount: requestAmount,
        paymentMethod,
      };

      // Add payment method specific details
      if (paymentMethod === 'bank_transfer') {
        if (!accountName || !accountNumber || !bankName || !bankCode) {
          toast({
            title: 'Missing Information',
            description: 'Please fill in all bank details',
            variant: 'destructive',
          });
          setSubmitting(false);
          return;
        }
        
        if (!accountVerified) {
          toast({
            title: 'Account Not Verified',
            description: 'Please verify your account details before submitting',
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

      const response = await fetch('/api/payouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payoutData),
      });

      const result = await response.json();

      if (!response.ok) {
        toast({
          title: 'Error',
          description: result.error || 'Failed to submit payout request',
          variant: 'destructive',
        });
        setSubmitting(false);
        return;
      }

      toast({
        title: 'Payout Request Submitted',
        description: 'Your withdrawal request has been submitted for review. You will be notified once it is processed.',
      });

      // Reset form
      setAmount('');
      setAccountName('');
      setAccountNumber('');
      setBankName('');
      setBankCode('');
      setAccountVerified(false);
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

  const handleCancelPayout = async (payoutId: string) => {
    if (!user) return;

    try {
      const response = await fetch(`/api/payouts/${payoutId}/cancel`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ vendorId: user.uid }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast({
          title: 'Error',
          description: errorData.error || 'Failed to cancel payout request',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Payout Cancelled',
        description: 'Your payout request has been cancelled and funds restored to your balance',
      });

      loadPayoutData();
    } catch (error) {
      console.error('Error cancelling payout:', error);
      toast({
        title: 'Error',
        description: 'Failed to cancel payout request',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: PayoutRequest['status']) => {
    const variants: Record<PayoutRequest['status'], { variant: any; icon: any; color: string }> = {
      pending: { variant: 'secondary', icon: Clock, color: 'text-yellow-600' },
      approved: { variant: 'default', icon: CheckCircle, color: 'text-blue-600' },
      processing: { variant: 'default', icon: Loader2, color: 'text-blue-600' },
      completed: { variant: 'default', icon: CheckCircle, color: 'text-green-600' },
      rejected: { variant: 'destructive', icon: XCircle, color: 'text-red-600' },
      cancelled: { variant: 'secondary', icon: XCircle, color: 'text-gray-600' },
    };
    
    const { variant, icon: Icon, color } = variants[status];
    
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className={`h-3 w-3 ${color} ${status === 'processing' ? 'animate-spin' : ''}`} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getStatusDescription = (status: PayoutRequest['status']) => {
    switch (status) {
      case 'pending':
        return 'Your request is awaiting admin review. This usually takes 1-2 business days.';
      case 'approved':
        return 'Your request has been approved and is queued for transfer.';
      case 'processing':
        return 'Your funds are being transferred to your account. This may take a few minutes.';
      case 'completed':
        return 'Your funds have been successfully transferred to your account.';
      case 'rejected':
        return 'Your request was rejected. Please check the reason and try again.';
      case 'cancelled':
        return 'You cancelled this payout request.';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
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

      {/* Active Payout Alert */}
      {pendingPayout && (
        <Alert className="mb-6 border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          <AlertTitle className="text-yellow-800 dark:text-yellow-200">
            Active Payout Request
          </AlertTitle>
          <AlertDescription className="text-yellow-700 dark:text-yellow-300">
            <div className="mt-2 space-y-2">
              <p>
                You have a <strong>{pendingPayout.status}</strong> payout request for{' '}
                <strong>₦{pendingPayout.amount.toLocaleString()}</strong>.
              </p>
              <p className="text-sm">{getStatusDescription(pendingPayout.status)}</p>
              <p className="text-sm">
                Requested on: {pendingPayout.requestedAt.toLocaleDateString()} at {pendingPayout.requestedAt.toLocaleTimeString()}
              </p>
              {pendingPayout.status === 'pending' && (
                <div className="mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCancelPayout(pendingPayout.id)}
                    className="text-red-600 hover:text-red-700 border-red-300"
                  >
                    Cancel This Request
                  </Button>
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

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
                <p className="text-sm text-muted-foreground">Pending Withdrawal</p>
                <p className="text-2xl font-bold">₦{balance?.pendingBalance.toLocaleString() || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Being processed</p>
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
          <TabsTrigger value="history">
            Payout History
            {payoutHistory.length > 0 && (
              <Badge variant="secondary" className="ml-2">{payoutHistory.length}</Badge>
            )}
          </TabsTrigger>
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
              {/* Show warning if there's a pending payout */}
              {pendingPayout ? (
                <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Cannot Submit New Request</AlertTitle>
                  <AlertDescription>
                    You already have a {pendingPayout.status} payout request for ₦{pendingPayout.amount.toLocaleString()}.
                    Please wait for it to be processed or cancel it before requesting a new withdrawal.
                  </AlertDescription>
                </Alert>
              ) : null}

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
                    disabled={!!pendingPayout}
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    Available: ₦{balance?.availableBalance.toLocaleString() || 0}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <Select 
                    value={paymentMethod} 
                    onValueChange={(value: any) => setPaymentMethod(value)}
                    disabled={!!pendingPayout}
                  >
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
                      <Label htmlFor="bankName">Select Bank</Label>
                      <div className="relative">
                        <Input
                          placeholder="Search and select your bank..."
                          value={bankName || bankSearch}
                          onChange={(e) => {
                            setBankSearch(e.target.value);
                            setShowBankDropdown(true);
                            if (!e.target.value) {
                              setBankCode('');
                              setBankName('');
                              setAccountVerified(false);
                              setAccountName('');
                            }
                          }}
                          onFocus={() => setShowBankDropdown(true)}
                          disabled={!!pendingPayout}
                          className="cursor-pointer"
                        />
                        {showBankDropdown && !pendingPayout && (
                          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto">
                            {filteredBanks.length > 0 ? (
                              filteredBanks.map((bank) => (
                                <div
                                  key={bank.code}
                                  className="px-3 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-800 last:border-b-0"
                                  onClick={() => {
                                    setBankCode(bank.code);
                                    setBankName(bank.name);
                                    setBankSearch('');
                                    setShowBankDropdown(false);
                                    setAccountVerified(false);
                                    setAccountName('');
                                  }}
                                >
                                  <div className="font-medium text-sm">{bank.name}</div>
                                </div>
                              ))
                            ) : (
                              <div className="px-3 py-2 text-gray-500 text-sm">
                                {banks.length === 0 ? 'Loading banks...' : `No banks found matching "${bankSearch}"`}
                              </div>
                            )}
                          </div>
                        )}
                        {showBankDropdown && (
                          <div 
                            className="fixed inset-0 z-40" 
                            onClick={() => setShowBankDropdown(false)}
                          />
                        )}
                      </div>
                      {bankName && (
                        <div className="text-sm text-green-600 font-medium">
                          Selected: {bankName}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="accountNumber">Account Number</Label>
                      <div className="flex gap-2">
                        <Input
                          id="accountNumber"
                          value={accountNumber}
                          onChange={(e) => {
                            setAccountNumber(e.target.value);
                            setAccountVerified(false);
                            setAccountName('');
                          }}
                          placeholder="10-digit account number"
                          maxLength={10}
                          disabled={!!pendingPayout}
                          required
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={verifyAccount}
                          disabled={!accountNumber || !bankCode || verifyingAccount || !!pendingPayout}
                        >
                          {verifyingAccount ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                              Verifying...
                            </>
                          ) : 'Verify'}
                        </Button>
                      </div>
                    </div>

                    {accountVerified && accountName && (
                      <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800 dark:text-green-200">Account Verified</span>
                        </div>
                        <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                          Account Name: <strong>{accountName}</strong>
                        </p>
                      </div>
                    )}

                    {!accountVerified && accountNumber && bankCode && !pendingPayout && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Please verify your account details before submitting the payout request.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}

                {paymentMethod === 'mobile_money' && (
                  <div className="space-y-4 p-4 border rounded-lg">
                    <h3 className="font-semibold">Mobile Money Details</h3>
                    <div className="space-y-2">
                      <Label htmlFor="mobileProvider">Provider</Label>
                      <Select value={mobileProvider} onValueChange={setMobileProvider} disabled={!!pendingPayout}>
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
                        disabled={!!pendingPayout}
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
                        disabled={!!pendingPayout}
                        required
                      />
                    </div>
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Mobile money withdrawals require manual processing and may take longer.
                      </AlertDescription>
                    </Alert>
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
                        disabled={!!pendingPayout}
                        required
                      />
                    </div>
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        PayPal withdrawals require manual processing and may incur additional fees.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}

                <Button 
                  type="submit" 
                  disabled={submitting || !balance || balance.availableBalance < 1000 || !!pendingPayout}
                  className="w-full sm:w-auto"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : pendingPayout ? (
                    'Cannot Submit - Pending Request Exists'
                  ) : (
                    'Submit Withdrawal Request'
                  )}
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
                  <p className="text-sm mt-2">When you request a withdrawal, it will appear here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {payoutHistory.map((payout) => (
                    <div 
                      key={payout.id} 
                      className={`border rounded-lg p-4 ${
                        payout.status === 'pending' || payout.status === 'approved' || payout.status === 'processing'
                          ? 'border-yellow-300 bg-yellow-50/50 dark:bg-yellow-950/20'
                          : ''
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-lg">₦{payout.amount.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">
                            {payout.requestedAt.toLocaleDateString()} at {payout.requestedAt.toLocaleTimeString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(payout.status)}
                          {payout.status === 'pending' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancelPayout(payout.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {/* Status description */}
                      <p className="text-sm text-muted-foreground mb-3 italic">
                        {getStatusDescription(payout.status)}
                      </p>
                      
                      <div className="space-y-1 text-sm">
                        <p><span className="font-medium">Payment Method:</span> {payout.paymentMethod.replace('_', ' ').toUpperCase()}</p>
                        
                        {payout.bankDetails && (
                          <p><span className="font-medium">Bank:</span> {payout.bankDetails.bankName} - ****{payout.bankDetails.accountNumber.slice(-4)}</p>
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
                          <p><span className="font-medium">Processed:</span> {payout.processedAt.toLocaleDateString()} at {payout.processedAt.toLocaleTimeString()}</p>
                        )}
                        
                        {payout.rejectionReason && (
                          <Alert variant="destructive" className="mt-2">
                            <XCircle className="h-4 w-4" />
                            <AlertDescription>
                              <span className="font-medium">Rejection Reason:</span> {payout.rejectionReason}
                            </AlertDescription>
                          </Alert>
                        )}
                        
                        {payout.notes && (
                          <Alert className="mt-2">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                              <span className="font-medium">Admin Notes:</span> {payout.notes}
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

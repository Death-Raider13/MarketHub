"use client"
import { authenticatedFetch } from "@/lib/firebase/authenticated-fetch"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/firebase/auth-context"
import { db } from "@/lib/firebase/config"
import { doc, getDoc, updateDoc, onSnapshot, setDoc } from "firebase/firestore"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { 
  Landmark, 
  Wallet, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw,
  LayoutDashboard,
  Package,
  ShoppingCart
} from "lucide-react"
import Link from "next/link"

const NIGERIAN_BANKS = [
  "Access Bank", "GTBank", "First Bank", "UBA", "Zenith Bank",
  "Ecobank", "Fidelity Bank", "Union Bank", "Stanbic IBTC",
  "Sterling Bank", "Wema Bank", "Polaris Bank", "Kuda Bank",
  "Opay", "PalmPay"
]

export default function PayoutSettingsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [configuring, setConfiguring] = useState(false)
  const [creatorData, setCreatorData] = useState<any>(null)
  const [balances, setBalances] = useState<any>(null)
  const [payoutDetails, setPayoutDetails] = useState({
    bankName: "",
    accountNumber: "",
    accountName: "",
    cryptoWallet: "",
  })

  useEffect(() => {
    if (!user) return

    const unsubUser = onSnapshot(doc(db, "users", user.uid), (doc) => {
      if (doc.exists()) {
        const data = doc.data()
        setCreatorData(data)
        setPayoutDetails({
          bankName: data.payoutDetails?.bankName || "",
          accountNumber: data.payoutDetails?.accountNumber || "",
          accountName: data.payoutDetails?.accountName || "",
          cryptoWallet: data.payoutDetails?.cryptoWallet || "",
        })
      }
    })

    const unsubBalances = onSnapshot(doc(db, "creatorBalances", user.uid), (doc) => {
      if (doc.exists()) {
        setBalances(doc.data())
      }
    })

    setLoading(false)

    return () => {
      unsubUser()
      unsubBalances()
    }
  }, [user])

  const handleSaveDetails = async () => {
    if (!user) return
    setSaving(true)
    try {
      await setDoc(doc(db, "users", user.uid), {
        payoutDetails,
        updatedAt: new Date()
      }, { merge: true })
      toast.success("Payout details updated successfully")
    } catch (error) {
      toast.error("Failed to update payout details")
    } finally {
      setSaving(false)
    }
  }

  const handleSetupAutomatedPayouts = async () => {
    if (!user) return
    setConfiguring(true)
    try {
      const idToken = await user.getIdToken()
      const response = await authenticatedFetch("/api/creators/payout-setup", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${idToken}`,
          "Content-Type": "application/json"
        }
      })
      
      const result = await response.json()
      if (result.success) {
        toast.success("Automated payouts configured! 🚀")
      } else {
        throw new Error(result.error || "Configuration failed")
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to setup automated payouts")
    } finally {
      setConfiguring(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1 bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <div className="grid gap-6 lg:grid-cols-4">
            <aside className="space-y-2">
              <Link href="/creator/dashboard">
                <Button variant="ghost" className="w-full justify-start">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
              <Link href="/creator/products">
                <Button variant="ghost" className="w-full justify-start">
                  <Package className="mr-2 h-4 w-4" />
                  Products
                </Button>
              </Link>
              <Link href="/creator/orders">
                <Button variant="ghost" className="w-full justify-start">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Orders
                </Button>
              </Link>
              <Link href="/creator/payouts">
                <Button variant="default" className="w-full justify-start">
                  <Wallet className="mr-2 h-4 w-4" />
                  Payouts
                </Button>
              </Link>
            </aside>

            <main className="lg:col-span-3 space-y-8">
          <div className="mx-auto max-w-4xl space-y-8">
            <div>
              <h1 className="text-3xl font-bold">Payout Settings</h1>
              <p className="text-muted-foreground">Manage how you receive your earnings.</p>
            </div>

            {/* Balances Overview */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="bg-primary/5 border-primary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Available Balance (Fiat)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">₦{(balances?.availableBalance || 0).toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">Split automated via Paystack Subaccount</p>
                </CardContent>
              </Card>

              <Card className="bg-orange-500/5 border-orange-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Pending Crypto Balance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">₦{(balances?.pendingCryptoBalance || 0).toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1 text-orange-600">Manual settlement required</p>
                </CardContent>
              </Card>
            </div>

            {/* Configuration Status */}
            {!creatorData?.paystackSubaccountCode ? (
              <Card className="border-yellow-200 bg-yellow-50">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <AlertCircle className="h-6 w-6 text-yellow-600 mt-1" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-yellow-900">Automated Payouts Not Configured</h3>
                      <p className="text-sm text-yellow-800 mt-1">
                        Connect your bank account to receive 90% of every sale automatically. 
                        Without this, earnings will be tracked but won't be sent to your bank.
                      </p>
                      <Button 
                        className="mt-4 bg-yellow-600 hover:bg-yellow-700" 
                        onClick={handleSetupAutomatedPayouts}
                        disabled={configuring || !payoutDetails.accountNumber}
                      >
                        {configuring ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                        Configure Automated Payouts
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="flex items-center gap-2 text-green-600 bg-green-50 p-4 rounded-lg border border-green-100">
                <CheckCircle2 className="h-5 w-5" />
                <span className="text-sm font-medium">Automated Payouts Active (Subaccount: {creatorData.paystackSubaccountCode})</span>
              </div>
            )}

            <div className="grid gap-8 md:grid-cols-2">
              {/* Bank Details Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Landmark className="h-5 w-5 text-primary" />
                    <CardTitle>Bank Account</CardTitle>
                  </div>
                  <CardDescription>Withdrawals are sent to this account.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Bank Name</Label>
                    <Select 
                      value={payoutDetails.bankName} 
                      onValueChange={(v) => setPayoutDetails({...payoutDetails, bankName: v})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Bank" />
                      </SelectTrigger>
                      <SelectContent>
                        {NIGERIAN_BANKS.map(bank => (
                          <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountNumber">Account Number</Label>
                    <Input 
                      id="accountNumber"
                      value={payoutDetails.accountNumber}
                      onChange={(e) => setPayoutDetails({...payoutDetails, accountNumber: e.target.value})}
                      placeholder="0123456789"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountName">Account Name</Label>
                    <Input 
                      id="accountName"
                      value={payoutDetails.accountName}
                      onChange={(e) => setPayoutDetails({...payoutDetails, accountName: e.target.value})}
                      placeholder="John Doe"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Crypto Details Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-primary" />
                    <CardTitle>Crypto Wallet</CardTitle>
                  </div>
                  <CardDescription>Optional for crypto settlements.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cryptoWallet">Wallet Address (USDT/BTC/ETH)</Label>
                    <Input 
                      id="cryptoWallet"
                      value={payoutDetails.cryptoWallet}
                      onChange={(e) => setPayoutDetails({...payoutDetails, cryptoWallet: e.target.value})}
                      placeholder="0x... or 1..."
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-4">
                    Note: Crypto payments are processed manually by the platform within 24-48 hours.
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={handleSaveDetails} disabled={saving} size="lg">
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Payout Details
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  </div>
</div>
  )
}

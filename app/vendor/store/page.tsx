"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/firebase/auth-context"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ProtectedRoute } from "@/lib/firebase/protected-route"
import { toast } from "sonner"
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  TrendingUp,
  Megaphone,
  StoreIcon,
  Save,
  Upload,
  X,
  Bell,
  CreditCard,
  Shield,
  Globe,
  Mail,
  Phone,
  MapPin,
  Clock,
  DollarSign,
  Truck,
  AlertCircle,
  Settings,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

function VendorStoreSettingsContent() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [loadingSettings, setLoadingSettings] = useState(true)

  // User Profile Data (loaded from Firestore)
  const [userProfile, setUserProfile] = useState<any>(null)

  // Business Information (Store name, email, phone, address come from user profile)
  const [businessName, setBusinessName] = useState("")
  const [taxId, setTaxId] = useState("")
  const [businessType, setBusinessType] = useState("limited")
  const [registrationNumber, setRegistrationNumber] = useState("")

  // Payment Settings
  const [bankName, setBankName] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [accountName, setAccountName] = useState("")
  const [bankCode, setBankCode] = useState("")

  // Shipping Settings
  const [freeShippingThreshold, setFreeShippingThreshold] = useState("50000")
  const [lagosShippingFee, setLagosShippingFee] = useState("2500")
  const [outsideLagosShippingFee, setOutsideLagosShippingFee] = useState("5000")
  const [processingTime, setProcessingTime] = useState("1-3")

  // Notification Settings
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [orderNotifications, setOrderNotifications] = useState(true)
  const [reviewNotifications, setReviewNotifications] = useState(true)
  const [lowStockNotifications, setLowStockNotifications] = useState(true)
  const [marketingEmails, setMarketingEmails] = useState(false)

  // Store Policies
  const [returnPolicy, setReturnPolicy] = useState("")
  const [shippingPolicy, setShippingPolicy] = useState("")
  const [privacyPolicy, setPrivacyPolicy] = useState("")

  // Load profile and settings from Firestore
  useEffect(() => {
    async function loadSettings() {
      if (!user) return

      try {
        // Load user profile
        const profileResponse = await fetch(`/api/vendor/profile?vendorId=${user.uid}`)
        const profileData = await profileResponse.json()
        if (profileData.profile) {
          setUserProfile(profileData.profile)
        }

        // Load store settings
        const response = await fetch(`/api/vendor/store-settings?vendorId=${user.uid}`)
        const data = await response.json()

        if (data.settings) {
          const s = data.settings
          // Business Info (Store info comes from user profile)
          if (s.businessInfo) {
            setBusinessName(s.businessInfo.name || "")
            setTaxId(s.businessInfo.taxId || "")
            setBusinessType(s.businessInfo.type || "limited")
            setRegistrationNumber(s.businessInfo.registrationNumber || "")
          }
          // Payment Settings
          if (s.paymentSettings) {
            setBankName(s.paymentSettings.bankName || "")
            setAccountNumber(s.paymentSettings.accountNumber || "")
            setAccountName(s.paymentSettings.accountName || "")
            setBankCode(s.paymentSettings.bankCode || "")
          }
          // Shipping Settings
          if (s.shippingSettings) {
            setFreeShippingThreshold(s.shippingSettings.freeShippingThreshold || "50000")
            setLagosShippingFee(s.shippingSettings.lagosShippingFee || "2500")
            setOutsideLagosShippingFee(s.shippingSettings.outsideLagosShippingFee || "5000")
            setProcessingTime(s.shippingSettings.processingTime || "1-3")
          }
          // Notifications
          if (s.notifications) {
            setEmailNotifications(s.notifications.email ?? true)
            setOrderNotifications(s.notifications.orders ?? true)
            setReviewNotifications(s.notifications.reviews ?? true)
            setLowStockNotifications(s.notifications.lowStock ?? true)
            setMarketingEmails(s.notifications.marketing ?? false)
          }
          // Policies
          if (s.policies) {
            setReturnPolicy(s.policies.return || "")
            setShippingPolicy(s.policies.shipping || "")
            setPrivacyPolicy(s.policies.privacy || "")
          }
        }
      } catch (error) {
        console.error("Error loading settings:", error)
        toast.error("Failed to load store settings")
      } finally {
        setLoadingSettings(false)
      }
    }

    loadSettings()
  }, [user])

  const handleSave = async () => {
    if (!user) {
      toast.error("Please login to continue")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/vendor/store-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId: user.uid,
          businessInfo: {
            name: businessName,
            taxId,
            type: businessType,
            registrationNumber,
          },
          paymentSettings: {
            bankName,
            accountNumber,
            accountName,
            bankCode,
          },
          shippingSettings: {
            freeShippingThreshold,
            lagosShippingFee,
            outsideLagosShippingFee,
            processingTime,
          },
          notifications: {
            email: emailNotifications,
            orders: orderNotifications,
            reviews: reviewNotifications,
            lowStock: lowStockNotifications,
            marketing: marketingEmails,
          },
          policies: {
            return: returnPolicy,
            shipping: shippingPolicy,
            privacy: privacyPolicy,
          },
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Store settings saved successfully! 🎉")
      } else {
        toast.error(data.error || "Failed to save settings")
      }
    } catch (error) {
      console.error("Error saving settings:", error)
      toast.error("Failed to save settings")
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Store Settings</h1>
            <p className="text-muted-foreground">Manage your store information, payments, and preferences</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-4">
            {/* Sidebar */}
            <aside className="space-y-2">
              <Link href="/vendor/dashboard">
                <Button variant="ghost" className="w-full justify-start">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
              <Link href="/vendor/products">
                <Button variant="ghost" className="w-full justify-start">
                  <Package className="mr-2 h-4 w-4" />
                  Products
                </Button>
              </Link>
              <Link href="/vendor/orders">
                <Button variant="ghost" className="w-full justify-start">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Orders
                </Button>
              </Link>
              <Link href="/vendor/analytics">
                <Button variant="ghost" className="w-full justify-start">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Analytics
                </Button>
              </Link>
              <Link href="/vendor/store">
                <Button variant="default" className="w-full justify-start">
                  <StoreIcon className="mr-2 h-4 w-4" />
                  Store Settings
                </Button>
              </Link>
            </aside>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <Tabs defaultValue="general" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
                  <TabsTrigger value="general">General</TabsTrigger>
                  <TabsTrigger value="business">Business</TabsTrigger>
                  <TabsTrigger value="payment">Payment</TabsTrigger>
                  <TabsTrigger value="shipping">Shipping</TabsTrigger>
                  <TabsTrigger value="notifications">Notifications</TabsTrigger>
                </TabsList>

                {/* General Settings */}
                <TabsContent value="general" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Store Information</CardTitle>
                      <CardDescription>
                        Your store's contact information. To edit these, go to your Profile Settings.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Read-only Store Info from Profile */}
                      <div className="bg-muted/50 p-6 rounded-lg space-y-4 border">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold text-lg">Contact Information (from Profile)</h3>
                          <Button asChild variant="outline" size="sm">
                            <Link href="/vendor/profile">
                              <Settings className="mr-2 h-4 w-4" />
                              Edit Profile
                            </Link>
                          </Button>
                        </div>
                        
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <Label className="text-xs text-muted-foreground">Store Name</Label>
                            <p className="font-semibold text-lg">{userProfile?.storeName || "Not set"}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              Email
                            </Label>
                            <p className="font-medium">{userProfile?.email || user?.email || "Not set"}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              Phone
                            </Label>
                            <p className="font-medium">{userProfile?.phone || "Not set"}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              Address
                            </Label>
                            <p className="font-medium">
                              {userProfile?.address?.addressLine1 ? (
                                <>
                                  {userProfile.address.addressLine1}
                                  {userProfile.address.city && `, ${userProfile.address.city}`}
                                  {userProfile.address.state && `, ${userProfile.address.state}`}
                                </>
                              ) : (
                                "Not set"
                              )}
                            </p>
                          </div>
                        </div>
                        
                        <p className="text-xs text-muted-foreground mt-4">
                          These details are used throughout the platform and on your public store page.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Business Settings */}
                <TabsContent value="business" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Store Policies</CardTitle>
                      <CardDescription>Define your store policies</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="returnPolicy">Return Policy</Label>
                        <Textarea
                          id="returnPolicy"
                          value={returnPolicy}
                          onChange={(e) => setReturnPolicy(e.target.value)}
                          rows={3}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="shippingPolicy">Shipping Policy</Label>
                        <Textarea
                          id="shippingPolicy"
                          value={shippingPolicy}
                          onChange={(e) => setShippingPolicy(e.target.value)}
                          rows={3}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="privacyPolicy">Privacy Policy</Label>
                        <Textarea
                          id="privacyPolicy"
                          value={privacyPolicy}
                          onChange={(e) => setPrivacyPolicy(e.target.value)}
                          rows={3}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Business Settings */}
                <TabsContent value="business" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Business Information</CardTitle>
                      <CardDescription>Legal and tax information</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="businessName">Legal Business Name *</Label>
                        <Input
                          id="businessName"
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                        />
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="taxId">Tax Identification Number (TIN)</Label>
                          <Input
                            id="taxId"
                            value={taxId}
                            onChange={(e) => setTaxId(e.target.value)}
                            placeholder="12345678-0001"
                          />
                          <p className="text-xs text-muted-foreground">FIRS Tax Identification Number</p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="businessType">Business Type</Label>
                          <Select value={businessType} onValueChange={setBusinessType}>
                            <SelectTrigger id="businessType">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sole">Sole Proprietorship (Business Name)</SelectItem>
                              <SelectItem value="limited">Limited Liability Company (Ltd)</SelectItem>
                              <SelectItem value="plc">Public Limited Company (PLC)</SelectItem>
                              <SelectItem value="partnership">Partnership</SelectItem>
                              <SelectItem value="enterprise">Enterprise</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="registrationNumber">CAC Registration Number (RC Number)</Label>
                        <Input
                          id="registrationNumber"
                          value={registrationNumber}
                          onChange={(e) => setRegistrationNumber(e.target.value)}
                          placeholder="RC-1234567"
                        />
                        <p className="text-xs text-muted-foreground">Corporate Affairs Commission (CAC) registration number</p>
                      </div>

                      <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-4">
                        <div className="flex gap-3">
                          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                          <div className="text-sm text-blue-800 dark:text-blue-200">
                            <p className="font-medium mb-1">Important</p>
                            <p>This information is required for tax reporting and legal compliance. Keep it up to date.</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Payment Settings */}
                <TabsContent value="payment" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>
                        <CreditCard className="inline h-5 w-5 mr-2" />
                        Payment Methods
                      </CardTitle>
                      <CardDescription>Configure how you receive payments</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <h3 className="font-medium">Nigerian Bank Account</h3>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="bankName">Bank Name</Label>
                            <Select value={bankName} onValueChange={setBankName}>
                              <SelectTrigger id="bankName">
                                <SelectValue placeholder="Select bank" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Access Bank">Access Bank</SelectItem>
                                <SelectItem value="GTBank">Guaranty Trust Bank (GTBank)</SelectItem>
                                <SelectItem value="First Bank">First Bank of Nigeria</SelectItem>
                                <SelectItem value="UBA">United Bank for Africa (UBA)</SelectItem>
                                <SelectItem value="Zenith Bank">Zenith Bank</SelectItem>
                                <SelectItem value="Ecobank">Ecobank Nigeria</SelectItem>
                                <SelectItem value="Fidelity Bank">Fidelity Bank</SelectItem>
                                <SelectItem value="Union Bank">Union Bank</SelectItem>
                                <SelectItem value="Stanbic IBTC">Stanbic IBTC Bank</SelectItem>
                                <SelectItem value="Sterling Bank">Sterling Bank</SelectItem>
                                <SelectItem value="Wema Bank">Wema Bank</SelectItem>
                                <SelectItem value="Polaris Bank">Polaris Bank</SelectItem>
                                <SelectItem value="Kuda Bank">Kuda Bank</SelectItem>
                                <SelectItem value="Opay">Opay</SelectItem>
                                <SelectItem value="Palmpay">Palmpay</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="accountNumber">Account Number (NUBAN)</Label>
                            <Input
                              id="accountNumber"
                              value={accountNumber}
                              onChange={(e) => setAccountNumber(e.target.value)}
                              placeholder="0123456789"
                              maxLength={10}
                            />
                            <p className="text-xs text-muted-foreground">10-digit account number</p>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="accountName">Account Name</Label>
                            <Input
                              id="accountName"
                              value={accountName}
                              onChange={(e) => setAccountName(e.target.value)}
                              placeholder="As registered with bank"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="bankCode">Bank Code</Label>
                            <Input
                              id="bankCode"
                              value={bankCode}
                              onChange={(e) => setBankCode(e.target.value)}
                              placeholder="044"
                            />
                            <p className="text-xs text-muted-foreground">3-digit bank code for transfers</p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-lg bg-green-50 dark:bg-green-950 p-4">
                        <div className="flex gap-3">
                          <Shield className="h-5 w-5 text-green-600 mt-0.5" />
                          <div className="text-sm text-green-800 dark:text-green-200">
                            <p className="font-medium mb-1">Secure</p>
                            <p>Your payment information is encrypted and secure.</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Shipping Settings */}
                <TabsContent value="shipping" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>
                        <Truck className="inline h-5 w-5 mr-2" />
                        Shipping Configuration
                      </CardTitle>
                      <CardDescription>Set up shipping rates and processing times</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="freeShipping">
                          Free Shipping Threshold (₦)
                        </Label>
                        <Input
                          id="freeShipping"
                          type="number"
                          step="100"
                          value={freeShippingThreshold}
                          onChange={(e) => setFreeShippingThreshold(e.target.value)}
                          placeholder="50000"
                        />
                        <p className="text-xs text-muted-foreground">Orders above this amount get free shipping (e.g., ₦50,000)</p>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="lagosShipping">Lagos Shipping Fee (₦)</Label>
                          <Input
                            id="lagosShipping"
                            type="number"
                            step="100"
                            value={lagosShippingFee}
                            onChange={(e) => setLagosShippingFee(e.target.value)}
                            placeholder="2500"
                          />
                          <p className="text-xs text-muted-foreground">Within Lagos State</p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="outsideLagosShipping">Outside Lagos Shipping Fee (₦)</Label>
                          <Input
                            id="outsideLagosShipping"
                            type="number"
                            step="100"
                            value={outsideLagosShippingFee}
                            onChange={(e) => setOutsideLagosShippingFee(e.target.value)}
                            placeholder="5000"
                          />
                          <p className="text-xs text-muted-foreground">Other states in Nigeria</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="processingTime">
                          <Clock className="inline h-4 w-4 mr-1" />
                          Processing Time (business days)
                        </Label>
                        <Input
                          id="processingTime"
                          value={processingTime}
                          onChange={(e) => setProcessingTime(e.target.value)}
                          placeholder="e.g., 1-2"
                        />
                        <p className="text-xs text-muted-foreground">How long before you ship orders</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Notification Settings */}
                <TabsContent value="notifications" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>
                        <Bell className="inline h-5 w-5 mr-2" />
                        Notification Preferences
                      </CardTitle>
                      <CardDescription>Choose what notifications you want to receive</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="emailNotifications">Email Notifications</Label>
                          <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                        </div>
                        <Switch
                          id="emailNotifications"
                          checked={emailNotifications}
                          onCheckedChange={setEmailNotifications}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="orderNotifications">New Order Alerts</Label>
                          <p className="text-sm text-muted-foreground">Get notified when you receive new orders</p>
                        </div>
                        <Switch
                          id="orderNotifications"
                          checked={orderNotifications}
                          onCheckedChange={setOrderNotifications}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="reviewNotifications">Review Notifications</Label>
                          <p className="text-sm text-muted-foreground">Get notified when customers leave reviews</p>
                        </div>
                        <Switch
                          id="reviewNotifications"
                          checked={reviewNotifications}
                          onCheckedChange={setReviewNotifications}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="lowStockNotifications">Low Stock Alerts</Label>
                          <p className="text-sm text-muted-foreground">Get notified when products are running low</p>
                        </div>
                        <Switch
                          id="lowStockNotifications"
                          checked={lowStockNotifications}
                          onCheckedChange={setLowStockNotifications}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="marketingEmails">Marketing Emails</Label>
                          <p className="text-sm text-muted-foreground">Receive tips and promotional emails</p>
                        </div>
                        <Switch
                          id="marketingEmails"
                          checked={marketingEmails}
                          onCheckedChange={setMarketingEmails}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Save Button */}
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={loading}>
                  <Save className="mr-2 h-4 w-4" />
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default function VendorStoreSettingsPage() {
  return (
    <ProtectedRoute allowedRoles={["vendor"]}>
      <VendorStoreSettingsContent />
    </ProtectedRoute>
  )
}

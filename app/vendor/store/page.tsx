"use client"

import { useState } from "react"
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
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

function VendorStoreSettingsContent() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  // Store Information
  const [storeName, setStoreName] = useState("TechStore Pro")
  const [storeDescription, setStoreDescription] = useState("Your one-stop shop for premium electronics and gadgets")
  const [storeEmail, setStoreEmail] = useState("contact@techstore.com")
  const [storePhone, setStorePhone] = useState("+234 803 123 4567")
  const [storeAddress, setStoreAddress] = useState("123 Admiralty Way, Lekki Phase 1, Lagos, Nigeria")
  const [storeLogo, setStoreLogo] = useState("")
  const [storeBanner, setStoreBanner] = useState("")

  // Business Information
  const [businessName, setBusinessName] = useState("TechStore Nigeria Ltd")
  const [taxId, setTaxId] = useState("12345678-0001") // TIN format
  const [businessType, setBusinessType] = useState("limited")
  const [registrationNumber, setRegistrationNumber] = useState("RC-1234567") // CAC Registration

  // Payment Settings
  const [bankName, setBankName] = useState("Access Bank")
  const [accountNumber, setAccountNumber] = useState("0123456789")
  const [accountName, setAccountName] = useState("TechStore Nigeria Ltd")
  const [bankCode, setBankCode] = useState("044") // Access Bank code

  // Shipping Settings
  const [freeShippingThreshold, setFreeShippingThreshold] = useState("50000") // ₦50,000
  const [lagosShippingFee, setLagosShippingFee] = useState("2500") // ₦2,500
  const [outsideLagosShippingFee, setOutsideLagosShippingFee] = useState("5000") // ₦5,000
  const [processingTime, setProcessingTime] = useState("1-3")

  // Notification Settings
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [orderNotifications, setOrderNotifications] = useState(true)
  const [reviewNotifications, setReviewNotifications] = useState(true)
  const [lowStockNotifications, setLowStockNotifications] = useState(true)
  const [marketingEmails, setMarketingEmails] = useState(false)

  // Store Policies
  const [returnPolicy, setReturnPolicy] = useState("30-day return policy on all items")
  const [shippingPolicy, setShippingPolicy] = useState("We ship within 1-2 business days")
  const [privacyPolicy, setPrivacyPolicy] = useState("We protect your data")

  const handleSave = async () => {
    setLoading(true)
    // Simulate save
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setLoading(false)
    alert("Settings saved successfully!")
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setStoreLogo(URL.createObjectURL(file))
    }
  }

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setStoreBanner(URL.createObjectURL(file))
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
              <Link href="/vendor/advertising">
                <Button variant="ghost" className="w-full justify-start">
                  <Megaphone className="mr-2 h-4 w-4" />
                  Advertising
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
                      <CardDescription>Update your store's public information</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="storeName">Store Name *</Label>
                        <Input
                          id="storeName"
                          value={storeName}
                          onChange={(e) => setStoreName(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="storeDescription">Store Description</Label>
                        <Textarea
                          id="storeDescription"
                          value={storeDescription}
                          onChange={(e) => setStoreDescription(e.target.value)}
                          rows={3}
                        />
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="storeEmail">
                            <Mail className="inline h-4 w-4 mr-1" />
                            Email
                          </Label>
                          <Input
                            id="storeEmail"
                            type="email"
                            value={storeEmail}
                            onChange={(e) => setStoreEmail(e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="storePhone">
                            <Phone className="inline h-4 w-4 mr-1" />
                            Phone
                          </Label>
                          <Input
                            id="storePhone"
                            type="tel"
                            value={storePhone}
                            onChange={(e) => setStorePhone(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="storeAddress">
                          <MapPin className="inline h-4 w-4 mr-1" />
                          Address
                        </Label>
                        <Input
                          id="storeAddress"
                          value={storeAddress}
                          onChange={(e) => setStoreAddress(e.target.value)}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Store Branding</CardTitle>
                      <CardDescription>Upload your store logo and banner</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Store Logo</Label>
                        <div className="flex items-center gap-4">
                          {storeLogo ? (
                            <div className="relative h-20 w-20 rounded-lg overflow-hidden border">
                              <img src={storeLogo} alt="Store logo" className="h-full w-full object-cover" />
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute right-1 top-1 h-6 w-6"
                                onClick={() => setStoreLogo("")}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <label className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/50 hover:bg-muted">
                              <Upload className="h-6 w-6 text-muted-foreground" />
                              <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                            </label>
                          )}
                          <div className="text-sm text-muted-foreground">
                            <p>Recommended: 200x200px</p>
                            <p>Max size: 2MB</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Store Banner</Label>
                        <div className="space-y-2">
                          {storeBanner ? (
                            <div className="relative aspect-[4/1] rounded-lg overflow-hidden border">
                              <img src={storeBanner} alt="Store banner" className="h-full w-full object-cover" />
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute right-2 top-2 h-6 w-6"
                                onClick={() => setStoreBanner("")}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <label className="flex aspect-[4/1] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/50 hover:bg-muted">
                              <Upload className="h-8 w-8 text-muted-foreground" />
                              <span className="mt-2 text-sm text-muted-foreground">Click to upload banner</span>
                              <input type="file" className="hidden" accept="image/*" onChange={handleBannerUpload} />
                            </label>
                          )}
                          <p className="text-sm text-muted-foreground">Recommended: 1200x300px, Max size: 5MB</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

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

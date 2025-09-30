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
  Users,
  Package,
  ShoppingCart,
  TrendingUp,
  Settings,
  Save,
  Globe,
  Mail,
  Shield,
  DollarSign,
  Percent,
  Bell,
  Database,
  Key,
  Upload,
  X,
  AlertCircle,
  CheckCircle2,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

function AdminSettingsContent() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  // Platform Settings
  const [platformName, setPlatformName] = useState("MarketHub")
  const [platformEmail, setPlatformEmail] = useState("support@markethub.com")
  const [platformPhone, setPlatformPhone] = useState("+1 (800) 123-4567")
  const [platformDescription, setPlatformDescription] = useState("Your trusted online marketplace")
  const [platformLogo, setPlatformLogo] = useState("")
  const [platformFavicon, setPlatformFavicon] = useState("")

  // Commission Settings
  const [vendorCommission, setVendorCommission] = useState("15")
  const [transactionFee, setTransactionFee] = useState("2.5")
  const [minimumPayout, setMinimumPayout] = useState("50")
  const [payoutSchedule, setPayoutSchedule] = useState("weekly")

  // Email Settings
  const [smtpHost, setSmtpHost] = useState("smtp.gmail.com")
  const [smtpPort, setSmtpPort] = useState("587")
  const [smtpUsername, setSmtpUsername] = useState("noreply@markethub.com")
  const [smtpPassword, setSmtpPassword] = useState("••••••••")

  // Security Settings
  const [twoFactorAuth, setTwoFactorAuth] = useState(true)
  const [passwordMinLength, setPasswordMinLength] = useState("8")
  const [sessionTimeout, setSessionTimeout] = useState("30")
  const [maxLoginAttempts, setMaxLoginAttempts] = useState("5")

  // Feature Toggles
  const [vendorRegistration, setVendorRegistration] = useState(true)
  const [customerReviews, setCustomerReviews] = useState(true)
  const [guestCheckout, setGuestCheckout] = useState(true)
  const [socialLogin, setSocialLogin] = useState(true)
  const [wishlist, setWishlist] = useState(true)

  // Notification Settings
  const [adminEmailNotifications, setAdminEmailNotifications] = useState(true)
  const [newVendorAlerts, setNewVendorAlerts] = useState(true)
  const [newOrderAlerts, setNewOrderAlerts] = useState(true)
  const [reportedContentAlerts, setReportedContentAlerts] = useState(true)

  // Maintenance
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [maintenanceMessage, setMaintenanceMessage] = useState("We're currently performing maintenance. Please check back soon.")

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
      setPlatformLogo(URL.createObjectURL(file))
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Platform Settings</h1>
            <p className="text-muted-foreground">Configure platform-wide settings and preferences</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-4">
            {/* Sidebar */}
            <aside className="space-y-2">
              <Link href="/admin/dashboard">
                <Button variant="ghost" className="w-full justify-start">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
              <Link href="/admin/vendors">
                <Button variant="ghost" className="w-full justify-start">
                  <Users className="mr-2 h-4 w-4" />
                  Vendors
                </Button>
              </Link>
              <Link href="/admin/products">
                <Button variant="ghost" className="w-full justify-start">
                  <Package className="mr-2 h-4 w-4" />
                  Products
                </Button>
              </Link>
              <Link href="/admin/orders">
                <Button variant="ghost" className="w-full justify-start">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Orders
                </Button>
              </Link>
              <Link href="/admin/analytics">
                <Button variant="ghost" className="w-full justify-start">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Analytics
                </Button>
              </Link>
              <Link href="/admin/settings">
                <Button variant="default" className="w-full justify-start">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Button>
              </Link>
            </aside>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <Tabs defaultValue="general" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
                  <TabsTrigger value="general">General</TabsTrigger>
                  <TabsTrigger value="email">Email</TabsTrigger>
                  <TabsTrigger value="security">Security</TabsTrigger>
                  <TabsTrigger value="features">Features</TabsTrigger>
                </TabsList>

                {/* General Settings */}
                <TabsContent value="general" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>
                        <Globe className="inline h-5 w-5 mr-2" />
                        Platform Information
                      </CardTitle>
                      <CardDescription>Basic platform configuration</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="platformName">Platform Name *</Label>
                        <Input
                          id="platformName"
                          value={platformName}
                          onChange={(e) => setPlatformName(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="platformDescription">Platform Description</Label>
                        <Textarea
                          id="platformDescription"
                          value={platformDescription}
                          onChange={(e) => setPlatformDescription(e.target.value)}
                          rows={3}
                        />
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="platformEmail">Support Email</Label>
                          <Input
                            id="platformEmail"
                            type="email"
                            value={platformEmail}
                            onChange={(e) => setPlatformEmail(e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="platformPhone">Support Phone</Label>
                          <Input
                            id="platformPhone"
                            type="tel"
                            value={platformPhone}
                            onChange={(e) => setPlatformPhone(e.target.value)}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Platform Branding</CardTitle>
                      <CardDescription>Upload platform logo and favicon</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Platform Logo</Label>
                        <div className="flex items-center gap-4">
                          {platformLogo ? (
                            <div className="relative h-20 w-20 rounded-lg overflow-hidden border">
                              <img src={platformLogo} alt="Platform logo" className="h-full w-full object-cover" />
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute right-1 top-1 h-6 w-6"
                                onClick={() => setPlatformLogo("")}
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
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>
                        <Bell className="inline h-5 w-5 mr-2" />
                        Admin Notifications
                      </CardTitle>
                      <CardDescription>Configure admin notification preferences</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Email Notifications</Label>
                          <p className="text-sm text-muted-foreground">Receive admin notifications via email</p>
                        </div>
                        <Switch
                          checked={adminEmailNotifications}
                          onCheckedChange={setAdminEmailNotifications}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>New Vendor Alerts</Label>
                          <p className="text-sm text-muted-foreground">Get notified when vendors register</p>
                        </div>
                        <Switch
                          checked={newVendorAlerts}
                          onCheckedChange={setNewVendorAlerts}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>New Order Alerts</Label>
                          <p className="text-sm text-muted-foreground">Get notified of all new orders</p>
                        </div>
                        <Switch
                          checked={newOrderAlerts}
                          onCheckedChange={setNewOrderAlerts}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Reported Content Alerts</Label>
                          <p className="text-sm text-muted-foreground">Get notified of reported products/reviews</p>
                        </div>
                        <Switch
                          checked={reportedContentAlerts}
                          onCheckedChange={setReportedContentAlerts}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>


                {/* Email Settings */}
                <TabsContent value="email" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>
                        <Mail className="inline h-5 w-5 mr-2" />
                        SMTP Configuration
                      </CardTitle>
                      <CardDescription>Configure email server settings</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="smtpHost">SMTP Host</Label>
                          <Input
                            id="smtpHost"
                            value={smtpHost}
                            onChange={(e) => setSmtpHost(e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="smtpPort">SMTP Port</Label>
                          <Input
                            id="smtpPort"
                            value={smtpPort}
                            onChange={(e) => setSmtpPort(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="smtpUsername">SMTP Username</Label>
                        <Input
                          id="smtpUsername"
                          type="email"
                          value={smtpUsername}
                          onChange={(e) => setSmtpUsername(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="smtpPassword">SMTP Password</Label>
                        <Input
                          id="smtpPassword"
                          type="password"
                          value={smtpPassword}
                          onChange={(e) => setSmtpPassword(e.target.value)}
                        />
                      </div>

                      <Button variant="outline" className="w-full">
                        <Mail className="mr-2 h-4 w-4" />
                        Test Email Configuration
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Security Settings */}
                <TabsContent value="security" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>
                        <Shield className="inline h-5 w-5 mr-2" />
                        Security Configuration
                      </CardTitle>
                      <CardDescription>Configure platform security settings</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Two-Factor Authentication</Label>
                          <p className="text-sm text-muted-foreground">Require 2FA for all admin accounts</p>
                        </div>
                        <Switch
                          checked={twoFactorAuth}
                          onCheckedChange={setTwoFactorAuth}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="passwordMinLength">
                          <Key className="inline h-4 w-4 mr-1" />
                          Minimum Password Length
                        </Label>
                        <Input
                          id="passwordMinLength"
                          type="number"
                          value={passwordMinLength}
                          onChange={(e) => setPasswordMinLength(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                        <Input
                          id="sessionTimeout"
                          type="number"
                          value={sessionTimeout}
                          onChange={(e) => setSessionTimeout(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                        <Input
                          id="maxLoginAttempts"
                          type="number"
                          value={maxLoginAttempts}
                          onChange={(e) => setMaxLoginAttempts(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          Account locked after this many failed attempts
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Feature Toggles */}
                <TabsContent value="features" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>
                        <Database className="inline h-5 w-5 mr-2" />
                        Platform Features
                      </CardTitle>
                      <CardDescription>Enable or disable platform features</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Vendor Registration</Label>
                          <p className="text-sm text-muted-foreground">Allow new vendors to register</p>
                        </div>
                        <Switch
                          checked={vendorRegistration}
                          onCheckedChange={setVendorRegistration}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Customer Reviews</Label>
                          <p className="text-sm text-muted-foreground">Allow customers to leave product reviews</p>
                        </div>
                        <Switch
                          checked={customerReviews}
                          onCheckedChange={setCustomerReviews}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Guest Checkout</Label>
                          <p className="text-sm text-muted-foreground">Allow checkout without account</p>
                        </div>
                        <Switch
                          checked={guestCheckout}
                          onCheckedChange={setGuestCheckout}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Social Login</Label>
                          <p className="text-sm text-muted-foreground">Enable Google/Facebook login</p>
                        </div>
                        <Switch
                          checked={socialLogin}
                          onCheckedChange={setSocialLogin}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Wishlist Feature</Label>
                          <p className="text-sm text-muted-foreground">Allow customers to save favorites</p>
                        </div>
                        <Switch
                          checked={wishlist}
                          onCheckedChange={setWishlist}
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
                  {loading ? "Saving..." : "Save All Settings"}
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

export default function AdminSettingsPage() {
  return (
    <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
      <AdminSettingsContent />
    </ProtectedRoute>
  )
}

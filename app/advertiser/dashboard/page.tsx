"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/firebase/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Megaphone,
  Plus,
  TrendingUp,
  Eye,
  MousePointer,
  DollarSign,
  Calendar,
  Target,
  BarChart3,
  Upload,
  Play,
  Pause,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

export default function AdvertiserDashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("overview")
  const [showCreateCampaign, setShowCreateCampaign] = useState(false)
  const [showAddFunds, setShowAddFunds] = useState(false)
  const [checkingProfile, setCheckingProfile] = useState(true)
  const [hasAdvertiserProfile, setHasAdvertiserProfile] = useState(false)
  const [advertiserData, setAdvertiserData] = useState<any>(null)
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(true)

  // Check if user has advertiser profile
  useEffect(() => {
    async function checkAdvertiserProfile() {
      if (!user) {
        setCheckingProfile(false)
        return
      }

      try {
        const { doc, getDoc } = await import("firebase/firestore")
        const { db } = await import("@/lib/firebase/config")
        
        const advertiserRef = doc(db, "advertisers", user.uid)
        const advertiserSnap = await getDoc(advertiserRef)

        if (advertiserSnap.exists()) {
          setHasAdvertiserProfile(true)
          setAdvertiserData({ id: advertiserSnap.id, ...advertiserSnap.data() })
          
          // Fetch campaigns and transactions
          await fetchCampaigns(user.uid)
          await fetchTransactions(user.uid)
        } else {
          // No advertiser profile, redirect to signup
          router.push("/advertiser/signup")
        }
      } catch (error) {
        console.error("Error checking advertiser profile:", error)
      } finally {
        setCheckingProfile(false)
        setLoadingData(false)
      }
    }

    async function fetchCampaigns(advertiserId: string) {
      try {
        const response = await fetch(`/api/advertiser/campaigns?advertiserId=${advertiserId}`)
        const data = await response.json()
        
        if (data.campaigns) {
          setCampaigns(data.campaigns)
        }
      } catch (error) {
        console.error("Error fetching campaigns:", error)
      }
    }

    async function fetchTransactions(userId: string) {
      try {
        const { collection, query, where, orderBy, getDocs } = await import("firebase/firestore")
        const { db } = await import("@/lib/firebase/config")
        
        const transactionsRef = collection(db, "transactions")
        const q = query(
          transactionsRef,
          where("userId", "==", userId),
          orderBy("createdAt", "desc")
        )
        
        const snapshot = await getDocs(q)
        const txns = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        
        setTransactions(txns)
      } catch (error) {
        console.error("Error fetching transactions:", error)
      }
    }

    if (!loading) {
      if (!user) {
        router.push("/auth/login?returnUrl=/advertiser/dashboard")
      } else {
        checkAdvertiserProfile()
      }
    }
  }, [user, loading, router])

  // Show loading state while checking authentication or profile
  if (loading || checkingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            {loading ? "Loading..." : "Checking advertiser profile..."}
          </p>
        </div>
      </div>
    )
  }

  // Don't render dashboard if not authenticated or no advertiser profile
  if (!user || !hasAdvertiserProfile) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white dark:bg-gray-950">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Megaphone className="h-8 w-8 text-primary" />
                Advertiser Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage your ad campaigns and track performance
              </p>
            </div>
            <Button onClick={() => {
              setShowCreateCampaign(true)
              setActiveTab("campaigns")
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Create Campaign
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Impressions
                  </CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {campaigns.reduce((sum, c) => sum + (c.stats?.impressions || 0), 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Across {campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Clicks
                  </CardTitle>
                  <MousePointer className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {campaigns.reduce((sum, c) => sum + (c.stats?.clicks || 0), 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Click-through rate
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Average CTR
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(() => {
                      const totalImpressions = campaigns.reduce((sum, c) => sum + (c.stats?.impressions || 0), 0)
                      const totalClicks = campaigns.reduce((sum, c) => sum + (c.stats?.clicks || 0), 0)
                      const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions * 100) : 0
                      return ctr.toFixed(2)
                    })()}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Click-through rate
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Spent
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ₦{(advertiserData?.totalSpent || 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    ₦{(advertiserData?.accountBalance || 0).toLocaleString()} remaining
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Active Campaigns */}
            <Card>
              <CardHeader>
                <CardTitle>Active Campaigns</CardTitle>
                <CardDescription>
                  Your currently running ad campaigns
                </CardDescription>
              </CardHeader>
              <CardContent>
                {campaigns.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No campaigns yet</p>
                    <Button onClick={() => {
                      setShowCreateCampaign(true)
                      setActiveTab("campaigns")
                    }}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Your First Campaign
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {campaigns.slice(0, 5).map((campaign) => (
                      <CampaignRow
                        key={campaign.id}
                        name={campaign.campaignName}
                        status={campaign.status}
                        impressions={campaign.stats?.impressions || 0}
                        clicks={campaign.stats?.clicks || 0}
                        ctr={campaign.stats?.ctr || 0}
                        spent={campaign.budget?.spent || 0}
                        budget={campaign.budget?.total || 0}
                      />
                    ))}
                    {campaigns.length > 5 && (
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => setActiveTab("campaigns")}
                      >
                        View All {campaigns.length} Campaigns
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Campaigns Tab */}
          <TabsContent value="campaigns" className="space-y-6">
            {showCreateCampaign ? (
              <CreateCampaignForm onClose={() => setShowCreateCampaign(false)} />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>All Campaigns</CardTitle>
                  <CardDescription>
                    Manage all your advertising campaigns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {campaigns.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">No campaigns yet</p>
                      <Button onClick={() => setShowCreateCampaign(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Your First Campaign
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {campaigns.map((campaign) => (
                        <CampaignRow
                          key={campaign.id}
                          name={campaign.campaignName}
                          status={campaign.status}
                          impressions={campaign.stats?.impressions || 0}
                          clicks={campaign.stats?.clicks || 0}
                          ctr={campaign.stats?.ctr || 0}
                          spent={campaign.budget?.spent || 0}
                          budget={campaign.budget?.total || 0}
                          showActions
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Performance Analytics
                </CardTitle>
                <CardDescription>
                  Detailed insights into your campaign performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <BarChart3 className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Analytics Dashboard</h3>
                  <p className="text-muted-foreground mb-4">
                    View detailed charts and insights about your campaigns
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Coming soon: Interactive charts, conversion tracking, and more!
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Account Balance</CardTitle>
                  <CardDescription>
                    Your current advertising balance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-4">
                    ₦{(advertiserData?.accountBalance || 0).toLocaleString()}
                  </div>
                  <Button className="w-full" onClick={() => setShowAddFunds(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Funds
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Billing History</CardTitle>
                  <CardDescription>
                    Recent transactions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {transactions.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No transactions yet
                    </p>
                  ) : (
                    <div className="space-y-3 max-h-[300px] overflow-y-auto">
                      {transactions.map((txn) => (
                        <div key={txn.id} className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{txn.description || 'Transaction'}</p>
                            <p className="text-xs text-muted-foreground">
                              {txn.createdAt?.toDate ? 
                                new Date(txn.createdAt.toDate()).toLocaleDateString('en-NG', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                }) : 
                                'Recent'
                              }
                            </p>
                          </div>
                          <p className={`font-semibold ${txn.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                            {txn.type === 'credit' ? '+' : '-'}₦{txn.amount?.toLocaleString() || 0}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Add Funds Modal */}
      {showAddFunds && (
        <AddFundsModal onClose={() => setShowAddFunds(false)} />
      )}
    </div>
  )
}

/**
 * Campaign Row Component
 */
function CampaignRow({
  name,
  status,
  impressions,
  clicks,
  ctr,
  spent,
  budget,
  showActions = false
}: {
  name: string
  status: 'active' | 'paused' | 'completed'
  impressions: number
  clicks: number
  ctr: number
  spent: number
  budget: number
  showActions?: boolean
}) {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <h3 className="font-semibold">{name}</h3>
          <Badge variant={status === 'active' ? 'default' : 'secondary'}>
            {status}
          </Badge>
        </div>
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Impressions</p>
            <p className="font-medium">{impressions.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Clicks</p>
            <p className="font-medium">{clicks.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-muted-foreground">CTR</p>
            <p className="font-medium">{ctr}%</p>
          </div>
          <div>
            <p className="text-muted-foreground">Spent / Budget</p>
            <p className="font-medium">
              ₦{spent.toLocaleString()} / ₦{budget.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
      
      {showActions && (
        <div className="flex gap-2 ml-4">
          <Button variant="outline" size="sm">
            {status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button variant="outline" size="sm">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}

/**
 * Create Campaign Form
 */
function CreateCampaignForm({ onClose }: { onClose: () => void }) {
  const { user } = useAuth()
  const [campaignData, setCampaignData] = useState({
    name: "",
    budget: "",
    dailyBudget: "",
    bidAmount: "",
    bidType: "CPM",
    imageUrl: "",
    title: "",
    description: "",
    ctaText: "Learn More",
    destinationUrl: "",
    placementType: "vendor_store", // vendor_store, homepage, category, sponsored_product
    targetVendors: [] as string[],
    targetCategories: [] as string[],
  })
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>("")
  const [submitting, setSubmitting] = useState(false)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file")
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB")
      return
    }

    setImageFile(file)
    
    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload to Cloudinary
    setUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!)
      formData.append('folder', 'ad-campaigns')
      
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      )
      
      const data = await response.json()
      
      if (data.secure_url) {
        setCampaignData({ ...campaignData, imageUrl: data.secure_url })
        toast.success("Image uploaded successfully!")
      } else {
        throw new Error("Upload failed")
      }
    } catch (error) {
      console.error("Error uploading image:", error)
      toast.error("Failed to upload image")
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!campaignData.imageUrl && !imagePreview) {
      toast.error("Please upload an image or provide an image URL")
      return
    }

    if (!user) {
      toast.error("Please login to continue")
      return
    }

    // Calculate minimum required budget based on placement type
    let minBudget = 0
    let budgetMessage = ""
    
    switch (campaignData.placementType) {
      case 'homepage':
        minBudget = 50000 // ₦50,000/week
        budgetMessage = "Homepage Banner requires minimum ₦50,000 budget (1 week)"
        break
      case 'category':
        minBudget = 20000 // ₦20,000/week
        budgetMessage = "Category Page Ads require minimum ₦20,000 budget (1 week)"
        break
      case 'sponsored_product':
        minBudget = 5000 // ₦5,000/day
        budgetMessage = "Sponsored Product requires minimum ₦5,000 budget (1 day)"
        break
      case 'vendor_store':
        minBudget = 1000 // Minimum for bidding
        budgetMessage = "Vendor Store Ads require minimum ₦1,000 budget"
        break
    }

    // Validate budget
    const totalBudget = parseFloat(campaignData.budget)
    if (isNaN(totalBudget) || totalBudget < minBudget) {
      toast.error(budgetMessage)
      return
    }

    // Check if advertiser has enough balance
    if (advertiserData && advertiserData.accountBalance < minBudget) {
      toast.error(`Insufficient balance! You need at least ₦${minBudget.toLocaleString()} but only have ₦${advertiserData.accountBalance.toLocaleString()}. Please add funds first.`)
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch("/api/advertiser/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          advertiserId: user.uid,
          campaignName: campaignData.name,
          budget: campaignData.budget,
          dailyLimit: campaignData.dailyBudget,
          bidAmount: campaignData.bidAmount,
          bidType: campaignData.bidType,
          imageUrl: campaignData.imageUrl,
          title: campaignData.title,
          description: campaignData.description,
          ctaText: campaignData.ctaText,
          destinationUrl: campaignData.destinationUrl,
          placementType: campaignData.placementType,
          targetVendors: campaignData.targetVendors,
          targetCategories: campaignData.targetCategories,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Campaign created successfully! It's pending review.")
        // Reload page to refresh campaigns list
        window.location.reload()
      } else {
        toast.error(data.error || "Failed to create campaign")
      }
    } catch (error) {
      console.error("Error creating campaign:", error)
      toast.error("Failed to create campaign. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Campaign</CardTitle>
        <CardDescription>
          Set up your advertising campaign
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Campaign Details */}
          <div className="space-y-4">
            <h3 className="font-semibold">Campaign Details</h3>
            
            <div className="space-y-2">
              <Label htmlFor="name">Campaign Name</Label>
              <Input
                id="name"
                placeholder="e.g., Summer Sale 2025"
                value={campaignData.name}
                onChange={(e) => setCampaignData({ ...campaignData, name: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="budget">Total Budget (₦)</Label>
                <Input
                  id="budget"
                  type="number"
                  placeholder="50000"
                  value={campaignData.budget}
                  onChange={(e) => setCampaignData({ ...campaignData, budget: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dailyBudget">Daily Limit (₦)</Label>
                <Input
                  id="dailyBudget"
                  type="number"
                  placeholder="5000"
                  value={campaignData.dailyBudget}
                  onChange={(e) => setCampaignData({ ...campaignData, dailyBudget: e.target.value })}
                  required
                />
              </div>
            </div>

          </div>

          {/* Ad Placement */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold">Ad Placement</h3>
            
            <div className="space-y-2">
              <Label htmlFor="placementType">Where do you want your ads to appear?</Label>
              <Select 
                value={campaignData.placementType} 
                onValueChange={(value) => setCampaignData({ ...campaignData, placementType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vendor_store">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Vendor Store Ads</span>
                      <span className="text-xs text-muted-foreground">Bid for slots on specific vendor stores (Bidding System)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="homepage">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Homepage Banner</span>
                      <span className="text-xs text-muted-foreground">Rotating banner on homepage (Fixed Price)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="category">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Category Page Ads</span>
                      <span className="text-xs text-muted-foreground">Ads on category pages (Rotation System)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="sponsored_product">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Sponsored Product</span>
                      <span className="text-xs text-muted-foreground">Feature your product at top of search (Fixed Rate)</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Pricing Info based on placement */}
            <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                {campaignData.placementType === 'vendor_store' && '💰 Bidding System - Min: ₦1,000'}
                {campaignData.placementType === 'homepage' && '💵 Fixed Price: ₦50,000/week'}
                {campaignData.placementType === 'category' && '🔄 Rotation: ₦20,000/week'}
                {campaignData.placementType === 'sponsored_product' && '⭐ Featured: ₦5,000/day'}
              </p>
              <p className="text-xs text-blue-800 dark:text-blue-200">
                {campaignData.placementType === 'vendor_store' && 'Bid for ad slots on vendor stores. Highest bidder gets the placement. Minimum budget: ₦1,000'}
                {campaignData.placementType === 'homepage' && 'Your ad rotates with others on the homepage banner. Funds deducted upon approval.'}
                {campaignData.placementType === 'category' && 'Your ad appears in rotation on selected category pages. Funds deducted upon approval.'}
                {campaignData.placementType === 'sponsored_product' && 'Your product appears at the top of search results. Funds deducted upon approval.'}
              </p>
              {advertiserData && (
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-2 font-medium">
                  Your current balance: ₦{advertiserData.accountBalance?.toLocaleString() || 0}
                </p>
              )}
            </div>

            {/* Show bidding fields only for vendor_store */}
            {campaignData.placementType === 'vendor_store' && (
              <div className="grid grid-cols-2 gap-4 p-3 bg-muted rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="bidType">Bid Type</Label>
                  <Select value={campaignData.bidType} onValueChange={(value) => setCampaignData({ ...campaignData, bidType: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CPM">CPM (Per 1000 views)</SelectItem>
                      <SelectItem value="CPC">CPC (Per click)</SelectItem>
                      <SelectItem value="CPA">CPA (Per action)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bidAmount">Bid Amount (₦)</Label>
                  <Input
                    id="bidAmount"
                    type="number"
                    placeholder="500"
                    value={campaignData.bidAmount}
                    onChange={(e) => setCampaignData({ ...campaignData, bidAmount: e.target.value })}
                    required={campaignData.placementType === 'vendor_store'}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Creative */}
          <div className="space-y-4">
            <h3 className="font-semibold">Ad Creative</h3>
            
            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Ad Image</Label>
              <div className="space-y-3">
                {/* Upload Button */}
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('image-upload')?.click()}
                    disabled={uploadingImage}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {uploadingImage ? "Uploading..." : "Upload Image"}
                  </Button>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <span className="text-sm text-muted-foreground">
                    or enter URL below (Max 5MB)
                  </span>
                </div>

                {/* Image Preview */}
                {(imagePreview || campaignData.imageUrl) && (
                  <div className="relative w-full h-48 border rounded-lg overflow-hidden bg-muted">
                    <img
                      src={imagePreview || campaignData.imageUrl}
                      alt="Ad preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* URL Input */}
                <Input
                  id="imageUrl"
                  type="url"
                  placeholder="Or paste image URL: https://example.com/image.jpg"
                  value={campaignData.imageUrl}
                  onChange={(e) => {
                    setCampaignData({ ...campaignData, imageUrl: e.target.value })
                    if (e.target.value) {
                      setImagePreview("")
                      setImageFile(null)
                    }
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Ad Title</Label>
              <Input
                id="title"
                placeholder="50% Off All Products!"
                value={campaignData.title}
                onChange={(e) => setCampaignData({ ...campaignData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Limited time offer on all products..."
                value={campaignData.description}
                onChange={(e) => setCampaignData({ ...campaignData, description: e.target.value })}
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ctaText">Call-to-Action</Label>
                <Input
                  id="ctaText"
                  placeholder="Shop Now"
                  value={campaignData.ctaText}
                  onChange={(e) => setCampaignData({ ...campaignData, ctaText: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="destinationUrl">Destination URL</Label>
                <Input
                  id="destinationUrl"
                  type="url"
                  placeholder="https://yourstore.com"
                  value={campaignData.destinationUrl}
                  onChange={(e) => setCampaignData({ ...campaignData, destinationUrl: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button type="submit" className="flex-1" disabled={submitting || uploadingImage}>
              {submitting ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Creating Campaign...
                </>
              ) : (
                "Create Campaign"
              )}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

/**
 * Add Funds Modal
 */
function AddFundsModal({ onClose }: { onClose: () => void }) {
  const { user } = useAuth()
  const [amount, setAmount] = useState("")
  const [loading, setLoading] = useState(false)

  const quickAmounts = [5000, 10000, 25000, 50000, 100000]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const fundAmount = parseFloat(amount)
    if (!fundAmount || fundAmount < 1000) {
      toast.error("Minimum amount is ₦1,000")
      return
    }

    if (!user) {
      toast.error("Please login to continue")
      return
    }

    setLoading(true)

    try {
      // Generate reference
      const reference = `ADV-${Date.now()}-${user.uid.substring(0, 8)}`
      
      // Import Paystack dynamically
      const PaystackPop = (await import("@paystack/inline-js")).default
      const paystack = new PaystackPop()
      
      // Initiate Paystack payment
      paystack.newTransaction({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
        email: user.email!,
        amount: fundAmount * 100, // Convert to kobo
        currency: 'NGN',
        ref: reference,
        metadata: {
          custom_fields: [
            {
              display_name: "Type",
              variable_name: "type",
              value: "advertiser_topup"
            },
            {
              display_name: "User ID",
              variable_name: "userId",
              value: user.uid
            }
          ]
        },
        onSuccess: async (transaction: { reference: string }) => {
          // Payment successful, update balance
          try {
            const response = await fetch("/api/advertiser/add-funds", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: user.uid,
                amount: fundAmount,
                reference: transaction.reference,
              }),
            })

            const data = await response.json()

            if (data.success) {
              toast.success(`₦${fundAmount.toLocaleString()} added to your account!`)
              // Reload page to refresh data
              window.location.reload()
            } else {
              toast.error("Failed to update balance")
            }
          } catch (error) {
            console.error("Error updating balance:", error)
            toast.error("Payment successful but failed to update balance. Please contact support.")
          } finally {
            setLoading(false)
            onClose()
          }
        },
        onCancel: () => {
          // Payment cancelled
          setLoading(false)
          toast.info("Payment cancelled")
        }
      })
    } catch (error) {
      console.error("Error initiating payment:", error)
      toast.error("Failed to initiate payment. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Add Funds to Account</CardTitle>
          <CardDescription>
            Top up your advertising balance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Quick Amount Buttons */}
            <div className="space-y-2">
              <Label>Quick Select</Label>
              <div className="grid grid-cols-3 gap-2">
                {quickAmounts.map((quickAmount) => (
                  <Button
                    key={quickAmount}
                    type="button"
                    variant={amount === quickAmount.toString() ? "default" : "outline"}
                    onClick={() => setAmount(quickAmount.toString())}
                    className="w-full"
                  >
                    ₦{(quickAmount / 1000).toFixed(0)}K
                  </Button>
                ))}
              </div>
            </div>

            {/* Custom Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Custom Amount (₦)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="1000"
                step="100"
                required
              />
              <p className="text-xs text-muted-foreground">
                Minimum: ₦1,000
              </p>
            </div>

            {/* Payment Summary */}
            {amount && parseFloat(amount) >= 1000 && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-medium">₦{parseFloat(amount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Processing Fee</span>
                  <span className="font-medium">₦0</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span>Total</span>
                  <span>₦{parseFloat(amount).toLocaleString()}</span>
                </div>
              </div>
            )}

            {/* Payment Method Info */}
            <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <DollarSign className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900 dark:text-blue-100">
                <p className="font-medium mb-1">Secure Payment via Paystack</p>
                <p className="text-xs">
                  Pay with card, bank transfer, or USSD. Your payment is secure and encrypted.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                type="submit"
                className="flex-1"
                disabled={loading || !amount || parseFloat(amount) < 1000}
              >
                {loading ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Processing...
                  </>
                ) : (
                  <>
                    <DollarSign className="mr-2 h-4 w-4" />
                    Pay ₦{amount ? parseFloat(amount).toLocaleString() : "0"}
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

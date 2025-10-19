"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/firebase/auth-context"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProtectedRoute } from "@/lib/firebase/protected-route"
import { 
  Download, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Calendar,
  Package,
  Eye,
  Loader2
} from "lucide-react"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"

interface PurchasedProduct {
  id: string
  userId: string
  productId: string
  orderId: string
  product: any
  purchasedAt: Date
  accessExpiresAt?: Date
  downloadCount: number
  lastDownloadedAt?: Date
}

interface DownloadLink {
  productId: string
  productName: string
  purchaseId: string
  files: Array<{
    fileId: string
    fileName: string
    fileSize: number
    fileType: string
    downloadUrl: string
    expiresAt: Date
  }>
  downloadLimit: number
  currentDownloads: number
  accessExpiresAt?: Date
}

function MyPurchasesContent() {
  const { user } = useAuth()
  const [purchases, setPurchases] = useState<PurchasedProduct[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [downloadLinks, setDownloadLinks] = useState<{ [key: string]: DownloadLink }>({})
  const [generatingLinks, setGeneratingLinks] = useState<{ [key: string]: boolean }>({})

  useEffect(() => {
    if (user) {
      loadPurchases()
    }
  }, [user])

  const loadPurchases = async () => {
    if (!user) return

    try {
      setLoading(true)
      
      // Load purchased digital products
      const purchasesResponse = await fetch(`/api/customer/purchases?userId=${user.uid}`)
      const purchasesData = await purchasesResponse.json()
      
      if (purchasesData.success) {
        setPurchases(purchasesData.purchases || [])
      }

      // Load all orders for this user
      const ordersResponse = await fetch(`/api/customer/orders?userId=${user.uid}`)
      const ordersData = await ordersResponse.json()
      
      if (ordersData.success) {
        setOrders(ordersData.orders || [])
      }

    } catch (error) {
      console.error('Error loading purchases:', error)
      toast.error('Failed to load your purchases')
    } finally {
      setLoading(false)
    }
  }

  const generateDownloadLinks = async (orderId: string) => {
    if (!user) return

    try {
      setGeneratingLinks(prev => ({ ...prev, [orderId]: true }))
      
      const response = await fetch('/api/digital-delivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          userId: user.uid
        })
      })

      const data = await response.json()

      if (data.success && data.downloadLinks) {
        const linksMap: { [key: string]: DownloadLink } = {}
        data.downloadLinks.forEach((link: DownloadLink) => {
          linksMap[link.productId] = link
        })
        
        setDownloadLinks(prev => ({ ...prev, ...linksMap }))
        toast.success('Download links generated successfully!')
      } else {
        toast.error(data.error || 'Failed to generate download links')
      }
    } catch (error) {
      console.error('Error generating download links:', error)
      toast.error('Failed to generate download links')
    } finally {
      setGeneratingLinks(prev => ({ ...prev, [orderId]: false }))
    }
  }

  const handleDownload = async (downloadUrl: string, fileName: string, purchaseId: string, fileId: string) => {
    try {
      // Track the download
      await fetch('/api/digital-delivery', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purchaseId,
          fileId,
          userId: user?.uid
        })
      })

      // Trigger download
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = fileName
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success(`Downloading ${fileName}...`)
      
      // Refresh purchases to update download count
      loadPurchases()
    } catch (error) {
      console.error('Error downloading file:', error)
      toast.error('Failed to download file')
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return <FileText className="h-5 w-5 text-red-500" />
    if (fileType.includes('video')) return <Package className="h-5 w-5 text-blue-500" />
    if (fileType.includes('audio')) return <Package className="h-5 w-5 text-green-500" />
    return <FileText className="h-5 w-5 text-gray-500" />
  }

  const isAccessExpired = (expiresAt?: Date) => {
    if (!expiresAt) return false
    return new Date() > new Date(expiresAt)
  }

  const isDownloadLimitReached = (currentDownloads: number, limit: number) => {
    return limit > 0 && currentDownloads >= limit
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 bg-muted/30">
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading your purchases...</span>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const digitalPurchases = purchases.filter(p => p.product?.productType === 'digital')
  const completedOrders = orders.filter(o => o.status === 'completed' || o.status === 'delivered')

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">My Purchases</h1>
            <p className="text-muted-foreground">Access your digital products and order history</p>
          </div>

          <Tabs defaultValue="digital" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="digital">
                Digital Products ({digitalPurchases.length})
              </TabsTrigger>
              <TabsTrigger value="orders">
                Order History ({orders.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="digital" className="space-y-6">
              {digitalPurchases.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No Digital Products</h3>
                    <p className="text-muted-foreground">
                      You haven't purchased any digital products yet.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6">
                  {digitalPurchases.map((purchase) => {
                    const productLinks = downloadLinks[purchase.productId]
                    const expired = isAccessExpired(purchase.accessExpiresAt)
                    const limitReached = isDownloadLimitReached(
                      purchase.downloadCount, 
                      purchase.product?.downloadLimit || 0
                    )

                    return (
                      <Card key={purchase.id}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="flex items-center gap-2">
                                {purchase.product?.name}
                                {expired && (
                                  <Badge variant="destructive">
                                    <Clock className="h-3 w-3 mr-1" />
                                    Expired
                                  </Badge>
                                )}
                                {limitReached && (
                                  <Badge variant="secondary">
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    Download Limit Reached
                                  </Badge>
                                )}
                              </CardTitle>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  Purchased {formatDistanceToNow(new Date(purchase.purchasedAt))} ago
                                </span>
                                <span className="flex items-center gap-1">
                                  <Download className="h-4 w-4" />
                                  {purchase.downloadCount} downloads
                                </span>
                                {purchase.product?.downloadLimit > 0 && (
                                  <span>
                                    Limit: {purchase.product.downloadLimit}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-semibold">
                                ₦{purchase.product?.price?.toLocaleString()}
                              </div>
                              {purchase.accessExpiresAt && (
                                <div className="text-sm text-muted-foreground">
                                  {expired ? 'Expired' : `Expires ${formatDistanceToNow(new Date(purchase.accessExpiresAt))} from now`}
                                </div>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {!productLinks ? (
                            <Button 
                              onClick={() => generateDownloadLinks(purchase.orderId)}
                              disabled={generatingLinks[purchase.orderId] || expired || limitReached}
                              className="w-full"
                            >
                              {generatingLinks[purchase.orderId] ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Generating Links...
                                </>
                              ) : (
                                <>
                                  <Download className="h-4 w-4 mr-2" />
                                  Generate Download Links
                                </>
                              )}
                            </Button>
                          ) : (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium">Available Downloads</h4>
                                <Badge variant="outline">
                                  {productLinks.files.length} file(s)
                                </Badge>
                              </div>
                              {productLinks.files.map((file) => (
                                <div key={file.fileId} className="flex items-center justify-between p-3 border rounded-lg">
                                  <div className="flex items-center gap-3">
                                    {getFileIcon(file.fileType)}
                                    <div>
                                      <p className="font-medium">{file.fileName}</p>
                                      <p className="text-sm text-muted-foreground">
                                        {formatFileSize(file.fileSize)}
                                      </p>
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    onClick={() => handleDownload(
                                      file.downloadUrl, 
                                      file.fileName, 
                                      productLinks.purchaseId, 
                                      file.fileId
                                    )}
                                    disabled={expired || limitReached}
                                  >
                                    <Download className="h-4 w-4 mr-2" />
                                    Download
                                  </Button>
                                </div>
                              ))}
                              <p className="text-xs text-muted-foreground">
                                Download links expire in 1 hour. Click "Generate Download Links" to refresh.
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="orders" className="space-y-6">
              {orders.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No Orders</h3>
                    <p className="text-muted-foreground">
                      You haven't placed any orders yet.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {orders.map((order) => (
                    <Card key={order.id}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">Order #{order.id}</h3>
                            <p className="text-sm text-muted-foreground">
                              {formatDistanceToNow(new Date(order.createdAt))} ago
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-semibold">
                              ₦{order.total?.toLocaleString()}
                            </div>
                            <Badge 
                              variant={order.status === 'completed' ? 'default' : 'secondary'}
                            >
                              {order.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="mt-4">
                          <p className="text-sm text-muted-foreground">
                            {order.items?.length} item(s)
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default function MyPurchasesPage() {
  return (
    <ProtectedRoute allowedRoles={["customer", "vendor"]}>
      <MyPurchasesContent />
    </ProtectedRoute>
  )
}

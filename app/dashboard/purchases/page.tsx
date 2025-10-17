"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/lib/firebase/auth-context"
import { db } from "@/lib/firebase/config"
import { collection, query, where, getDocs, orderBy } from "firebase/firestore"
import { Download, Package, FileText, Clock, CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { formatExpirationTime } from "@/lib/digital-products/download-links"

export default function PurchasesPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push("/auth/login")
      return
    }

    fetchOrders()
  }, [user, router])

  const fetchOrders = async () => {
    if (!user) return

    try {
      setLoading(true)
      const ordersRef = collection(db, 'orders')
      const q = query(
        ordersRef,
        where('customerId', '==', user.uid),
        where('paymentStatus', '==', 'completed'),
        orderBy('createdAt', 'desc')
      )
      
      const querySnapshot = await getDocs(q)
      const ordersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        paidAt: doc.data().paidAt?.toDate()
      }))
      
      setOrders(ordersData)
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast.error('Failed to load purchases')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (fileUrl: string, fileName: string) => {
    try {
      toast.success(`Downloading ${fileName}...`)
      
      // Open download in new tab
      window.open(fileUrl, '_blank')
      
      // TODO: Track download
      // await trackDownload(purchaseId, fileId)
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Failed to download file')
    }
  }

  const getDigitalItems = (order: any) => {
    return order.items?.filter((item: any) => 
      item.product?.productType === 'digital' || 
      item.product?.digitalFiles?.length > 0
    ) || []
  }

  const getPhysicalItems = (order: any) => {
    return order.items?.filter((item: any) => 
      item.product?.productType === 'physical' ||
      item.product?.requiresShipping === true
    ) || []
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">My Purchases</h1>
            <p className="text-muted-foreground mt-2">
              View and download your purchased products
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading your purchases...</p>
            </div>
          ) : orders.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No purchases yet</h3>
                <p className="text-muted-foreground mb-6">
                  Start shopping to see your purchases here
                </p>
                <Button onClick={() => router.push("/")}>
                  Browse Products
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue="all" className="space-y-6">
              <TabsList>
                <TabsTrigger value="all">
                  All Orders ({orders.length})
                </TabsTrigger>
                <TabsTrigger value="digital">
                  Digital Products
                </TabsTrigger>
                <TabsTrigger value="physical">
                  Physical Products
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                {orders.map((order) => (
                  <Card key={order.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">
                            Order #{order.id.substring(0, 8).toUpperCase()}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            Placed on {order.paidAt?.toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Paid
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Digital Items */}
                      {getDigitalItems(order).length > 0 && (
                        <div className="space-y-3">
                          <h4 className="font-semibold flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Digital Products
                          </h4>
                          {getDigitalItems(order).map((item: any, idx: number) => (
                            <div key={idx} className="border rounded-lg p-4 space-y-3">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="font-medium">{item.productName}</p>
                                  <p className="text-sm text-muted-foreground">
                                    Quantity: {item.quantity}
                                  </p>
                                </div>
                                <p className="font-semibold">
                                  ₦{(item.productPrice * item.quantity).toLocaleString()}
                                </p>
                              </div>

                              {/* Download Files */}
                              {item.product?.digitalFiles && item.product.digitalFiles.length > 0 && (
                                <div className="space-y-2 pt-2 border-t">
                                  <p className="text-sm font-medium">Download Files:</p>
                                  {item.product.digitalFiles.map((file: any) => (
                                    <div key={file.id} className="flex items-center justify-between bg-muted p-3 rounded">
                                      <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-primary" />
                                        <span className="text-sm">{file.fileName}</span>
                                      </div>
                                      <Button
                                        size="sm"
                                        onClick={() => handleDownload(file.fileUrl, file.fileName)}
                                      >
                                        <Download className="h-4 w-4 mr-1" />
                                        Download
                                      </Button>
                                    </div>
                                  ))}
                                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    Lifetime access • Unlimited downloads
                                  </p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Physical Items */}
                      {getPhysicalItems(order).length > 0 && (
                        <div className="space-y-3">
                          <h4 className="font-semibold flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            Physical Products
                          </h4>
                          {getPhysicalItems(order).map((item: any, idx: number) => (
                            <div key={idx} className="border rounded-lg p-4">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="font-medium">{item.productName}</p>
                                  <p className="text-sm text-muted-foreground">
                                    Quantity: {item.quantity}
                                  </p>
                                  <Badge variant="outline" className="mt-2">
                                    {order.status || 'Processing'}
                                  </Badge>
                                </div>
                                <p className="font-semibold">
                                  ₦{(item.productPrice * item.quantity).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Order Total */}
                      <div className="border-t pt-4">
                        <div className="flex justify-between text-lg font-bold">
                          <span>Total Paid:</span>
                          <span>₦{order.total?.toLocaleString() || '0'}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="digital">
                {/* Filter to show only orders with digital products */}
                {orders.filter(order => getDigitalItems(order).length > 0).length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No digital products purchased yet</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {/* Same card structure as "all" but filtered */}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="physical">
                {/* Filter to show only orders with physical products */}
                {orders.filter(order => getPhysicalItems(order).length > 0).length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No physical products purchased yet</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {/* Same card structure as "all" but filtered */}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}

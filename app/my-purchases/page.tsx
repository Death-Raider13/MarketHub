"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/firebase/auth-context"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ProtectedRoute } from "@/lib/firebase/protected-route"
import { 
  Download, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Package,
  Star
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

interface PurchasedProduct {
  id: string
  userId: string
  productId: string
  orderId: string
  product: {
    id: string
    name: string
    description: string
    type: string
    digitalFiles?: any[]
    images?: string[]
    price: number
  }
  purchasedAt: string
  downloadCount: number
  accessExpiresAt?: string
  rating?: number
  review?: string
  ratedAt?: string
}

function MyPurchasesContent() {
  const { user } = useAuth()
  const [purchases, setPurchases] = useState<PurchasedProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [generatingLinks, setGeneratingLinks] = useState<{ [key: string]: boolean }>({})
  const [ratingProduct, setRatingProduct] = useState<PurchasedProduct | null>(null)
  const [rating, setRating] = useState(0)
  const [review, setReview] = useState("")
  const [submittingRating, setSubmittingRating] = useState(false)

  useEffect(() => {
    if (user) {
      loadPurchases()
    }
  }, [user])

  const loadPurchases = async () => {
    if (!user) return

    try {
      setLoading(true)
      
      const response = await fetch(`/api/customer/purchases?userId=${user.uid}`)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Purchases loaded:', data)
        setPurchases(data.purchases || [])
      } else {
        console.error('Failed to load purchases:', response.status)
        toast.error('Failed to load your purchases')
      }
    } catch (error) {
      console.error('Error loading purchases:', error)
      toast.error('Failed to load your purchases')
    } finally {
      setLoading(false)
    }
  }

  const generateDownloadLinks = async (productId: string, orderId: string) => {
    try {
      setGeneratingLinks(prev => ({ ...prev, [productId]: true }))
      
      const response = await fetch('/api/digital-delivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          userId: user?.uid
        })
      })
      
      if (!response.ok) {
        toast.error(`Failed to generate download links: ${response.status} ${response.statusText}`)
        return
      }

      const data = await response.json()

      if (data.success && data.downloadLinks && data.downloadLinks.length > 0) {
        toast.success(`Download links generated successfully! (${data.downloadLinks.length} product(s))`)
        
        // Start downloads automatically
        data.downloadLinks.forEach((link: any) => {
          if (link.files && link.files.length > 0) {
            link.files.forEach((file: any) => {
              const downloadLink = document.createElement('a')
              downloadLink.href = file.downloadUrl
              downloadLink.download = file.fileName
              downloadLink.target = '_blank'
              document.body.appendChild(downloadLink)
              downloadLink.click()
              document.body.removeChild(downloadLink)
            })
          }
        })
      } else {
        toast.error(data.error || 'No download links were generated. Please check if this order contains digital products.')
      }
    } catch (error) {
      toast.error('Failed to generate download links')
    } finally {
      setGeneratingLinks(prev => ({ ...prev, [productId]: false }))
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return 'Recently'
    }
  }

  const submitRating = async (productId: string, orderId: string) => {
    try {
      setSubmittingRating(true)
      const response = await fetch(`/api/digital-products/${productId}/rating`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating,
          review,
          customerId: user?.uid,
          orderId
        })
      })

      if (response.ok) {
        toast.success('Rating submitted successfully!')
        setRatingProduct(null)
        setRating(0)
        setReview("")
        loadPurchases() // Reload to update the purchase with rating
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to submit rating')
      }
    } catch (error) {
      console.error('Error submitting rating:', error)
      toast.error('Failed to submit rating')
    } finally {
      setSubmittingRating(false)
    }
  }

  const isAccessExpired = (expiresAt?: string) => {
    if (!expiresAt) return false
    return new Date(expiresAt) < new Date()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading your digital purchases...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Digital Purchases</h1>
          <p className="text-gray-600">Access and download your digital products</p>
        </div>

        {purchases.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold mb-2">No Digital Products</h3>
              <p className="text-gray-600 mb-6">
                You haven't purchased any digital products yet.
              </p>
              <Link href="/products?type=digital">
                <Button>Browse Digital Products</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {purchases.map((purchase) => (
              <Card key={purchase.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{purchase.product.name}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        Purchased: {formatDate(purchase.purchasedAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="mb-2">
                        Digital Product
                      </Badge>
                      <div className="text-lg font-bold">
                        ₦{purchase.product.price?.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  {/* Product Description */}
                  {purchase.product.description && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-700">{purchase.product.description}</p>
                    </div>
                  )}

                  {/* Access Status */}
                  <div className="mb-4 p-3 rounded-lg bg-gray-50">
                    <div className="flex items-center gap-2 mb-2">
                      {isAccessExpired(purchase.accessExpiresAt) ? (
                        <>
                          <AlertCircle className="w-4 h-4 text-red-500" />
                          <span className="text-sm font-medium text-red-700">Access Expired</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm font-medium text-green-700">Access Active</span>
                        </>
                      )}
                    </div>
                    
                    <div className="text-xs text-gray-600">
                      <div>Downloads: {purchase.downloadCount}</div>
                      {purchase.accessExpiresAt && (
                        <div>
                          Expires: {formatDate(purchase.accessExpiresAt)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Digital Files Info */}
                  {purchase.product.digitalFiles && purchase.product.digitalFiles.length > 0 && (
                    <div className="mb-4 p-3 rounded-lg bg-blue-50">
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Available Files ({purchase.product.digitalFiles.length})
                      </h4>
                      <div className="space-y-1">
                        {purchase.product.digitalFiles.map((file: any, index: number) => (
                          <div key={index} className="text-xs text-gray-600 flex items-center gap-2">
                            <span>📄 {file.fileName || `File ${index + 1}`}</span>
                            {file.fileSize && (
                              <span className="text-gray-500">
                                ({(file.fileSize / 1024 / 1024).toFixed(1)} MB)
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Download Actions */}
                  <div className="flex gap-3">
                    {!isAccessExpired(purchase.accessExpiresAt) ? (
                      <Button
                        onClick={() => generateDownloadLinks(purchase.productId, purchase.orderId)}
                        disabled={generatingLinks[purchase.productId]}
                        className="flex-1"
                      >
                        {generatingLinks[purchase.productId] ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Generating Links...
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4 mr-2" />
                            Download Files
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button disabled className="flex-1">
                        <Clock className="w-4 h-4 mr-2" />
                        Access Expired
                      </Button>
                    )}
                    
                    <Link href={`/my-orders`}>
                      <Button variant="outline">
                        View Order Details
                      </Button>
                    </Link>
                  </div>

                  {/* Rating Section */}
                  {purchase.rating ? (
                    <div className="mt-4 p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= purchase.rating!
                                  ? 'text-yellow-400 fill-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm font-medium">You rated this product</span>
                      </div>
                      {purchase.review && (
                        <p className="text-sm text-gray-600 mt-1">"{purchase.review}"</p>
                      )}
                    </div>
                  ) : (
                    <div className="mt-4">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setRatingProduct(purchase)}
                            className="w-full"
                          >
                            <Star className="w-4 h-4 mr-2" />
                            Rate This Product
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Rate Product</DialogTitle>
                            <DialogDescription>
                              Share your experience with this digital product.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-medium mb-2">{purchase.product.name}</h4>
                              <p className="text-sm text-gray-600">{purchase.product.description}</p>
                            </div>
                            
                            {/* Star Rating */}
                            <div>
                              <label className="block text-sm font-medium mb-2">Rating</label>
                              <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    className="focus:outline-none"
                                  >
                                    <Star
                                      className={`w-6 h-6 ${
                                        star <= rating
                                          ? 'text-yellow-400 fill-yellow-400'
                                          : 'text-gray-300'
                                      }`}
                                    />
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Review Text */}
                            <div>
                              <label className="block text-sm font-medium mb-2">Review (Optional)</label>
                              <Textarea
                                value={review}
                                onChange={(e) => setReview(e.target.value)}
                                placeholder="Share your thoughts about this digital product..."
                                rows={4}
                              />
                            </div>

                            {/* Submit Button */}
                            <div className="flex gap-2">
                              <Button
                                onClick={() => submitRating(purchase.productId, purchase.orderId)}
                                disabled={rating === 0 || submittingRating}
                                className="flex-1"
                              >
                                {submittingRating ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Submitting...
                                  </>
                                ) : (
                                  'Submit Rating'
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setRatingProduct(null)
                                  setRating(0)
                                  setReview("")
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}

                  {/* Help Text */}
                  <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                    <p className="text-xs text-yellow-800">
                      💡 <strong>Download Tips:</strong> Click "Download Files" to generate secure download links. 
                      Links are valid for 1 hour. If you have issues, try refreshing the page and generating new links.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 flex gap-4 justify-center">
          <Link href="/my-orders">
            <Button variant="outline">
              View All Orders
            </Button>
          </Link>
          <Link href="/products?type=digital">
            <Button variant="outline">
              Browse More Digital Products
            </Button>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default function MyPurchasesPage() {
  return (
    <ProtectedRoute>
      <MyPurchasesContent />
    </ProtectedRoute>
  )
}

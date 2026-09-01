"use client"

import type React from "react"

export const dynamic = 'force-dynamic'

import { useState, useEffect, Suspense } from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useCart } from "@/lib/cart-context"
import { useAuth } from "@/lib/firebase/auth-context"
import { CheckCircle2, CreditCard, Download, Calendar, Bitcoin } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { initiatePaystackPayment } from "@/lib/payment/paystack"
import { db } from "@/lib/firebase/config"
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore"
import { toast } from "sonner"
import { onOrderPlaced } from "@/lib/notifications/client-triggers"
import { logger } from "@/lib/logger"

function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value
      .filter(item => item !== undefined)
      .map(item => stripUndefined(item)) as T
  }
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, entry]) => entry !== undefined)
        .map(([key, entry]) => [key, stripUndefined(entry)])
    ) as T
  }
  return value
}

function CheckoutContent() {
  const { items, totalPrice, clearCart } = useCart()
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("card")
  const [completedOrderId, setCompletedOrderId] = useState<string | null>(null)
  const [completedOrderItems, setCompletedOrderItems] = useState<any[]>([])
  const [downloadLinks, setDownloadLinks] = useState<any[]>([])

  const tax = 0
  const total = totalPrice

  const getAffiliateAttribution = () => {
    if (typeof window === 'undefined') return null
    try {
      const raw = window.localStorage.getItem('markethub_affiliate_attribution')
      if (!raw) return null
      const attribution = JSON.parse(raw)
      if (!attribution?.code || !attribution?.expiresAt || Number(attribution.expiresAt) <= Date.now()) {
        window.localStorage.removeItem('markethub_affiliate_attribution')
        return null
      }
      return {
        code: String(attribution.code),
        productId: attribution.productId ? String(attribution.productId) : null,
      }
    } catch {
      window.localStorage.removeItem('markethub_affiliate_attribution')
      return null
    }
  }

  useEffect(() => {
    if (step === 3 && completedOrderId && user) {
      const fetchDownloads = async () => {
        try {
          const idToken = await user.getIdToken()
          const response = await fetch('/api/digital-delivery', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify({ orderId: completedOrderId })
          })
          if (response.ok) {
            const data = await response.json()
            if (data.success) {
              setDownloadLinks(data.downloadLinks)
            }
          }
        } catch (error) {
          console.error('Failed to fetch download links:', error)
        }
      }
      fetchDownloads()
    }
  }, [step, completedOrderId, user, items.length])

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (items.length === 0) {
      toast.error('Your cart is empty')
      router.push('/cart')
      return
    }

    if (!user) {
      toast.error('Please log in to complete your purchase')
      router.push('/auth/login')
      return
    }

    setLoading(true)

    try {
      const shippingMethodValue = "digital_fulfillment"
      const affiliateAttribution = getAffiliateAttribution()

      const orderData = {
        customerId: user!.uid,
        userId: user!.uid,
        userEmail: user!.email || '',
        items: items.map(item => ({
          productId: item.product.id,
          productName: item.product.name,
          productPrice: item.product.price,
          quantity: item.quantity,
          creatorId: item.product.creatorId,
          creatorName: item.product.creatorName || 'Unknown creator',
          product: stripUndefined(item.product)
        })),
        creatorIds: [...new Set(items.map(item => item.product.creatorId).filter(Boolean))],
        subtotal: totalPrice,
        tax: tax,
        shipping: 0,
        total: total,
        status: 'pending',
        paymentStatus: 'pending',
        shippingMethod: shippingMethodValue,
        paymentMethod: paymentMethod === 'crypto' ? 'coinbase' : 'paystack',
        affiliateCode: affiliateAttribution?.code || null,
        affiliateProductId: affiliateAttribution?.productId || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }

      const ordersCollection = collection(db, 'orders')
      const orderRef = await addDoc(ordersCollection, stripUndefined(orderData))
      const orderId = orderRef.id

      try {
        await onOrderPlaced(orderId, user!.uid, '', total)
        const creatorIds = [...new Set(items.map(item => item.product.creatorId))]
        for (const creatorId of creatorIds) {
          const creatorItems = items.filter(item => item.product.creatorId === creatorId)
          const creatorTotal = creatorItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
          await onOrderPlaced(orderId, user!.uid, creatorId, creatorTotal)
        }
      } catch (notificationError) {
        logger.error('Failed to send order notifications', undefined, notificationError as Error)
      }

      if (paymentMethod === 'crypto') {
        try {
          const response = await fetch('/api/payments/coinbase/create-charge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId,
              amount: total,
              customerEmail: user!.email,
              customerName: user!.displayName || 'Customer',
              metadata: {
                items: items.length,
                shipping_method: shippingMethodValue,
                user_id: user!.uid
              }
            })
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Failed to create crypto payment')
          }

          const { charge } = await response.json()
          setCompletedOrderId(orderId)
          setCompletedOrderItems([...items])
          window.open(charge.hosted_url, '_blank')
          toast.success('Redirecting to crypto payment page...')
          setLoading(false)

          const pollInterval = setInterval(async () => {
            const verifyResponse = await fetch('/api/payments/coinbase/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orderId })
            })
            if (verifyResponse.ok) {
              const { status } = await verifyResponse.json()
              if (status === 'completed') {
                clearInterval(pollInterval)
                setStep(3)
                clearCart()
                toast.success('🎉 Crypto payment confirmed!')
              }
            }
          }, 10000)
          setTimeout(() => clearInterval(pollInterval), 30 * 60 * 1000)
        } catch (error: any) {
          toast.error(error.message || 'Failed to initiate crypto payment')
          setLoading(false)
        }
      } else {
        // Paystack Path: Identify subaccount if single-creator order
        let subaccountCode: string | undefined = undefined
        const creatorIds = [...new Set(items.map(item => item.product.creatorId).filter(Boolean))]
        
        if (creatorIds.length === 1 && creatorIds[0]) {
          try {
            const userDoc = await getDoc(doc(db, 'users', creatorIds[0]))
            if (userDoc.exists() && userDoc.data().paystackSubaccountCode) {
              subaccountCode = userDoc.data().paystackSubaccountCode
            } else {
              const creatorDoc = await getDoc(doc(db, 'creators', creatorIds[0]))
              if (creatorDoc.exists() && creatorDoc.data().paystackSubaccountCode) {
                subaccountCode = creatorDoc.data().paystackSubaccountCode
              }
            }
          } catch (err) {
            console.warn('Creator Paystack subaccount unavailable; continuing without split:', err)
          }
        }

        initiatePaystackPayment(
          {
            email: user!.email!,
            amount: total,
            orderId: orderId,
            customerName: user!.displayName || 'Customer',
            subaccount: subaccountCode,
            metadata: {
              items: items.length,
              shipping_method: shippingMethodValue,
              user_id: user!.uid
            }
          },
          async (reference) => {
            try {
              const idToken = await user!.getIdToken()
              const response = await fetch('/api/payments/verify', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${idToken}`,
                },
                body: JSON.stringify({ reference, orderId })
              })

              if (response.ok) {
                setCompletedOrderId(orderId)
                setCompletedOrderItems([...items])
                setStep(3)
                clearCart()
                toast.success('🎉 Payment successful!')
              } else {
                toast.error('Payment verification failed.')
              }
            } catch (error) {
              toast.error('Payment verification failed.')
            } finally {
              setLoading(false)
            }
          },
          () => {
            setLoading(false)
            toast.error('Payment cancelled')
          }
        )
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to initiate payment'
      toast.error(message)
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!user) {
      router.push("/auth/login")
    } else if (items.length === 0 && step === 1) {
      router.push("/cart")
    }
  }, [user, items.length, step, router])

  useEffect(() => {
    const payment = searchParams.get('payment')
    const orderId = searchParams.get('orderId')

    if (payment === 'success' && orderId) {
      const verifyPayment = async () => {
        const response = await fetch('/api/payments/coinbase/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId })
        })
        if (response.ok) {
          const { status } = await response.json()
          if (status === 'completed') {
            setCompletedOrderId(orderId)
            setStep(3)
            clearCart()
            toast.success('🎉 Crypto payment confirmed!')
            router.replace('/checkout')
          }
        }
      }
      verifyPayment()
    }
  }, [searchParams, clearCart, router])

  if (!user || (items.length === 0 && step !== 3)) {
    return null
  }

  if (!user.emailVerified && step !== 3) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 bg-muted/30">
          <div className="container mx-auto px-4 py-12">
            <Card className="max-w-2xl mx-auto">
              <CardContent className="pt-6 text-center space-y-6">
                <div className="rounded-full bg-yellow-100 dark:bg-yellow-900 p-4 w-16 h-16 mx-auto flex items-center justify-center">
                  <span className="text-3xl">⚠️</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2">Email Verification Required</h2>
                  <p className="text-muted-foreground">Please verify your email address before making a purchase.</p>
                </div>
                <div className="flex gap-3 justify-center">
                  <Button onClick={() => router.push("/auth/verify-email")}>Verify Email</Button>
                  <Button variant="outline" onClick={() => router.push("/")}>Continue Browsing</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold">Checkout</h1>
            <div className="mt-3 sm:mt-4 flex items-center gap-2 sm:gap-4">
              <div className={`flex items-center gap-1.5 sm:gap-2 ${step >= 1 ? "text-primary" : "text-muted-foreground"}`}>
                <div className={`flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full text-xs sm:text-sm ${step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>1</div>
                <span className="text-xs sm:text-sm font-medium">Payment</span>
              </div>
              <div className="h-px flex-1 bg-border" />
              <div className={`flex items-center gap-1.5 sm:gap-2 ${step >= 3 ? "text-primary" : "text-muted-foreground"}`}>
                <div className={`flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full text-xs sm:text-sm ${step >= 3 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>2</div>
                <span className="text-xs sm:text-sm font-medium">Confirmation</span>
              </div>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              {step === 1 && (
                <Card>
                  <CardHeader><CardTitle>Payment Method</CardTitle></CardHeader>
                  <CardContent>
                    <form onSubmit={handlePaymentSubmit} className="space-y-6">
                      <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                        <div className="flex items-center space-x-2 rounded-lg border p-4">
                          <RadioGroupItem value="card" id="card" />
                          <Label htmlFor="card" className="flex flex-1 cursor-pointer items-center gap-2">
                            <CreditCard className="h-5 w-5" />
                            <div>
                              <div className="font-medium">Paystack</div>
                              <div className="text-sm text-muted-foreground">Card, Bank Transfer, USSD</div>
                            </div>
                          </Label>
                        </div>
                      </RadioGroup>

                      <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-4 text-sm text-blue-800 dark:text-blue-100">
                        ⚡ Your purchase will be available for instant access immediately after payment.
                      </div>

                      <Button type="submit" className="w-full" size="lg" disabled={loading}>
                        {loading ? "Processing..." : `Pay ₦${total.toLocaleString()}`}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}

              {step === 3 && (
                <Card className="border-green-100 bg-green-50/30">
                  <CardContent className="pt-8 text-center">
                    <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                      <CheckCircle2 className="h-12 w-12 text-green-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-green-900">Order Successful!</h2>
                    <p className="mt-2 text-green-700 font-medium">Welcome to the creator economy. Your assets are ready.</p>
                    <p className="mt-1 text-muted-foreground text-xs uppercase tracking-widest font-semibold">Order ID: #{completedOrderId?.substring(0, 8).toUpperCase()}</p>

                    <div className="mt-10 p-6 bg-white rounded-xl shadow-sm border border-green-100">
                      <h3 className="text-lg font-semibold mb-4 text-left">Next Steps:</h3>
                      <div className="space-y-4">
                        {completedOrderItems.some(i => i.product.type === "digital") && (
                          <div className="flex items-start gap-4 text-left">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                              <Download className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-semibold">Instant Downloads</p>
                              <p className="text-sm text-muted-foreground">Your digital files are ready. Check your email or download below.</p>
                              
                              {downloadLinks.length > 0 ? (
                                <div className="mt-4 space-y-3">
                                  {downloadLinks.map((product, idx) => (
                                    <div key={idx} className="space-y-2">
                                      <p className="text-xs font-semibold text-muted-foreground uppercase text-left">{product.productName}</p>
                                      <div className="flex flex-wrap gap-2">
                                        {product.files.map((file: any, fIdx: number) => (
                                          <Button 
                                            key={fIdx}
                                            onClick={() => window.open(file.downloadUrl, '_blank')}
                                            size="sm"
                                            className="bg-blue-600 hover:bg-blue-700 h-9"
                                          >
                                            <Download className="mr-2 h-4 w-4" />
                                            {file.fileName}
                                          </Button>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <Button onClick={() => router.push("/my-purchases")} className="mt-3 w-full sm:w-auto px-8" size="lg">
                                  Access My Files
                                </Button>
                              )}
                            </div>
                          </div>
                        )}

                        {completedOrderItems.some(i => i.product.type === "service") && (
                          <div className="flex items-start gap-4 text-left border-t pt-4">
                            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                              <Calendar className="h-4 w-4 text-purple-600" />
                            </div>
                            <div>
                              <p className="font-semibold">Service Booking</p>
                              <p className="text-sm text-muted-foreground">The creator has been notified. They will contact you shortly.</p>
                              <Button onClick={() => router.push("/my-services")} variant="outline" className="mt-3 w-full sm:w-auto" size="lg">
                                View Service Status
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-8">
                      <Button variant="ghost" onClick={() => router.push("/")} className="text-muted-foreground hover:text-primary transition-colors">
                        Continue Exploring MarketHub
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div>
              <Card>
                <CardHeader><CardTitle>Order Summary</CardTitle></CardHeader>
                <CardContent className="space-y-4 text-sm">
                  {(() => {
                    const displayItems = step === 3 && completedOrderItems.length > 0 ? completedOrderItems : items
                    const displaySubtotal = displayItems.reduce((sum, item) => sum + ((item.product?.price || 0) * (item.quantity || 1)), 0)
                    const displayTotal = displaySubtotal

                    return (
                      <>
                        {displayItems.map((item, idx) => (
                          <div key={item.product?.id || idx} className="flex items-center justify-between gap-3">
                            <span className="line-clamp-1 flex-1 pr-2">{item.product?.name || 'Digital Resource'} (x{item.quantity || 1})</span>
                            <span className="font-medium shrink-0">₦{((item.product?.price || 0) * (item.quantity || 1)).toLocaleString()}</span>
                          </div>
                        ))}
                        <div className="border-t pt-2 space-y-1">
                          <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>₦{displaySubtotal.toLocaleString()}</span></div>
                          <div className="flex justify-between font-bold text-base mt-2"><span>Total</span><span>₦{displayTotal.toLocaleString()}</span></div>
                        </div>
                      </>
                    )
                  })()}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 bg-muted/30">
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-center min-h-[400px]">
              <Card className="w-full max-w-md">
                <CardContent className="pt-6 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-4 text-muted-foreground">Loading checkout...</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  )
}

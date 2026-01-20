"use client"

import type React from "react"

export const dynamic = 'force-dynamic'

import { useState, useEffect, Suspense } from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useCart } from "@/lib/cart-context"
import { useAuth } from "@/lib/firebase/auth-context"
import { CheckCircle2, CreditCard, Truck, Download, Calendar, Package, Bitcoin } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import type { Address } from "@/lib/types"
import { initiatePaystackPayment } from "@/lib/payment/paystack"
import { db } from "@/lib/firebase/config"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { toast } from "sonner"
import { NotificationTriggers } from "@/lib/notifications/triggers"

function CheckoutContent() {
  const { items, totalPrice, clearCart } = useCart()
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  const [shippingAddress, setShippingAddress] = useState<Address>({
    fullName: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    zipCode: "",
    country: "Nigeria",
    phone: "",
  })

  const [paymentMethod, setPaymentMethod] = useState("card")
  const [completedOrderId, setCompletedOrderId] = useState<string | null>(null)
  const [completedOrderItems, setCompletedOrderItems] = useState<any[]>([])
  
  // Check if cart has physical products (shipping applies only to physical items)
  const hasPhysicalProducts = items.some(
    (item) => item.product.type === "physical" || item.product.productType === "physical"
  )

  const tax = totalPrice * 0.1

  // Shipping is derived from per-product shippingInfo for physical products
  const shippingCost = items.reduce((sum, item) => {
    const product = item.product
    const isPhysical = product.type === "physical" || product.productType === "physical"
    if (!isPhysical) return sum

    const info = product.shippingInfo
    if (info?.offerFreeShipping) return sum

    const baseFee = info?.baseShippingFee ?? 0
    return sum + baseFee * item.quantity
  }, 0)

  const total = totalPrice + tax + shippingCost

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Skip shipping validation for digital/service-only orders
    if (!hasPhysicalProducts) {
      setStep(2)
      return
    }
    
    // Validate shipping address for physical products
    if (!shippingAddress.fullName || !shippingAddress.addressLine1 || 
        !shippingAddress.city || !shippingAddress.state || !shippingAddress.phone) {
      toast.error('Please fill in all required shipping fields')
      return
    }
    
    setStep(2)
  }

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate cart is not empty
    if (items.length === 0) {
      toast.error('Your cart is empty')
      router.push('/cart')
      return
    }
    
    // Validate user is logged in
    if (!user) {
      toast.error('Please log in to complete your purchase')
      router.push('/auth/login')
      return
    }
    
    setLoading(true)

    try {
      const shippingMethodValue = hasPhysicalProducts ? "vendor_defined" : "none"

      // Create order in database first
      const orderData = {
        customerId: user!.uid,
        userId: user!.uid,
        userEmail: user!.email || '',
        items: items.map(item => ({
          productId: item.product.id,
          productName: item.product.name,
          productPrice: item.product.price,
          quantity: item.quantity,
          vendorId: item.product.vendorId,
          vendorName: item.product.vendorName || 'Unknown Vendor',
          // Include the full product object so server-side verification
          // and post-payment processing can access product.type/product.digitalFiles
          product: item.product
        })),
        vendorIds: [...new Set(items.map(item => item.product.vendorId))],
        subtotal: totalPrice,
        tax: tax,
        shipping: shippingCost,
        total: total,
        status: 'pending',
        paymentStatus: 'pending',
        shippingAddress: {
          fullName: shippingAddress.fullName || '',
          addressLine1: shippingAddress.addressLine1 || '',
          addressLine2: shippingAddress.addressLine2 || '',
          city: shippingAddress.city || '',
          state: shippingAddress.state || '',
          zipCode: shippingAddress.zipCode || '',
          country: shippingAddress.country || 'Nigeria',
          phone: shippingAddress.phone || ''
        },
        shippingMethod: shippingMethodValue,
        paymentMethod: paymentMethod === 'crypto' ? 'coinbase' : 'paystack',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }

      // Save to Firestore
      console.log('Creating order with data:', orderData)
      const ordersCollection = collection(db, 'orders')
      console.log('Orders collection:', ordersCollection)
      const orderRef = await addDoc(ordersCollection, orderData)
      console.log('Order created with ID:', orderRef.id)
      const orderId = orderRef.id

      // Trigger notifications for order placement
      try {
        // Notify customer about order placement
        await NotificationTriggers.onOrderPlaced(orderId, user!.uid, '', total)
        
        // Notify each vendor about their orders
        const vendorIds = [...new Set(items.map(item => item.product.vendorId))]
        for (const vendorId of vendorIds) {
          const vendorItems = items.filter(item => item.product.vendorId === vendorId)
          const vendorTotal = vendorItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
          await NotificationTriggers.onOrderPlaced(orderId, user!.uid, vendorId, vendorTotal)
        }
        
        console.log('✅ Order notifications sent successfully')
      } catch (notificationError) {
        console.error('Failed to send order notifications:', notificationError)
        // Don't fail the order if notifications fail
      }

      // Handle payment based on selected method
      if (paymentMethod === 'crypto') {
        // Coinbase Commerce payment
        try {
          const response = await fetch('/api/payments/coinbase/create-charge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId,
              amount: total,
              customerEmail: user!.email,
              customerName: shippingAddress.fullName || 'Customer',
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
          console.log('✅ Coinbase charge created:', charge.id)
          
          // Store order info before redirecting
          setCompletedOrderId(orderId)
          setCompletedOrderItems([...items])
          
          // Open Coinbase Commerce hosted page
          window.open(charge.hosted_url, '_blank')
          
          toast.success('Redirecting to crypto payment page...')
          
          // Show waiting state
          setLoading(false)
          toast.info('Complete your payment in the new window. We\'ll verify it automatically.')
          
          // Start polling for payment confirmation
          const pollInterval = setInterval(async () => {
            try {
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
                  toast.success('🎉 Crypto payment confirmed! Order complete.')
                } else if (status === 'expired' || status === 'cancelled') {
                  clearInterval(pollInterval)
                  toast.error('Payment expired or cancelled. Please try again.')
                }
              }
            } catch (err) {
              console.error('Payment verification poll error:', err)
            }
          }, 10000) // Poll every 10 seconds
          
          // Stop polling after 30 minutes
          setTimeout(() => clearInterval(pollInterval), 30 * 60 * 1000)
          
        } catch (error: any) {
          console.error('Crypto payment error:', error)
          toast.error(error.message || 'Failed to initiate crypto payment')
          setLoading(false)
        }
      } else {
        // Paystack payment (existing flow)
        initiatePaystackPayment(
        {
          email: user!.email!,
          amount: total,
          orderId: orderId,
          customerName: shippingAddress.fullName,
          metadata: {
            items: items.length,
            shipping_method: shippingMethodValue,
            user_id: user!.uid
          }
        },
        async (reference) => {
          // Payment successful - verify it
          try {
            const response = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ reference })
            })

            if (response.ok) {
              const data = await response.json()
              console.log('✅ Payment verified successfully:', data)
              
              // Trigger payment confirmation notifications
              try {
                await NotificationTriggers.onOrderStatusChange(orderId, user!.uid, 'confirmed')
                console.log('✅ Payment confirmation notifications sent')
              } catch (notificationError) {
                console.error('Failed to send payment confirmation notifications:', notificationError)
              }
              
              console.log('✅ Setting step to 3...')
              setCompletedOrderId(orderId) // Store order ID for display
              setCompletedOrderItems([...items]) // Store items before clearing cart
              setStep(3) // Show success page
              console.log('✅ Clearing cart...')
              clearCart()
              console.log('✅ Showing success toast...')
              toast.success('🎉 Payment successful! Order confirmed.')
            } else {
              const error = await response.json()
              console.error('Verification failed:', error)
              toast.error('Payment verification failed. Please contact support.')
            }
          } catch (error) {
            console.error('Verification error:', error)
            toast.error('Payment verification failed. Please contact support.')
          } finally {
            setLoading(false)
          }
        },
        () => {
          // Payment cancelled
          setLoading(false)
          toast.error('Payment cancelled')
        }
      )
      }
    } catch (error) {
      console.error('Payment error:', error)
      toast.error('Failed to initiate payment')
      setLoading(false)
    }
  }

  // Handle redirects in useEffect to avoid render phase updates
  useEffect(() => {
    if (!user) {
      router.push("/auth/login")
    }
    // Don't redirect to cart if we're on step 3 (success) or step 2 (payment in progress)
    else if (items.length === 0 && step === 1) {
      router.push("/cart")
    }
  }, [user, items.length, step, router])

  // Handle Coinbase payment redirect
  useEffect(() => {
    const payment = searchParams.get('payment')
    const orderId = searchParams.get('orderId')
    
    if (payment === 'success' && orderId) {
      // Verify the crypto payment
      const verifyPayment = async () => {
        try {
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
              toast.success('🎉 Crypto payment confirmed! Order complete.')
              // Clear URL params
              router.replace('/checkout')
            } else if (status === 'pending') {
              toast.info('Payment is being processed. Please wait...')
            }
          }
        } catch (err) {
          console.error('Payment verification error:', err)
        }
      }
      verifyPayment()
    } else if (payment === 'cancelled' && orderId) {
      toast.error('Payment was cancelled. You can try again.')
      router.replace('/checkout')
    }
  }, [searchParams, clearCart, router])

  // Show loading while redirecting
  if (!user || (items.length === 0 && step !== 3)) {
    return null
  }

  // Check email verification
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
                  <p className="text-muted-foreground">
                    Please verify your email address before making a purchase.
                  </p>
                </div>
                <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-4">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    We've sent a verification link to <strong>{user.email}</strong>
                  </p>
                </div>
                <div className="flex gap-3 justify-center">
                  <Button onClick={() => router.push("/auth/verify-email")}>
                    Verify Email
                  </Button>
                  <Button variant="outline" onClick={() => router.push("/")}>
                    Continue Browsing
                  </Button>
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
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Checkout</h1>
            <div className="mt-4 flex items-center gap-4">
              <div className={`flex items-center gap-2 ${step >= 1 ? "text-primary" : "text-muted-foreground"}`}>
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                >
                  1
                </div>
                <span className="text-sm font-medium">{hasPhysicalProducts ? "Shipping" : "Details"}</span>
              </div>
              <div className="h-px flex-1 bg-border" />
              <div className={`flex items-center gap-2 ${step >= 2 ? "text-primary" : "text-muted-foreground"}`}>
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                >
                  2
                </div>
                <span className="text-sm font-medium">Payment</span>
              </div>
              <div className="h-px flex-1 bg-border" />
              <div className={`flex items-center gap-2 ${step >= 3 ? "text-primary" : "text-muted-foreground"}`}>
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${step >= 3 ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                >
                  3
                </div>
                <span className="text-sm font-medium">Confirmation</span>
              </div>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              {/* Step 1: Shipping / Details */}
              {step === 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="h-5 w-5" />
                      {hasPhysicalProducts ? "Shipping Information" : "Contact Information"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {!hasPhysicalProducts && (
                      <div className="mb-4 rounded-lg bg-blue-50 dark:bg-blue-950 p-4 border border-blue-200 dark:border-blue-800">
                        <p className="text-sm text-blue-900 dark:text-blue-100">
                          📦 Your order contains only digital or service products. No shipping required!
                        </p>
                      </div>
                    )}
                    <form onSubmit={handleShippingSubmit} className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2 sm:col-span-2">
                          <Label htmlFor="fullName">Full Name</Label>
                          <Input
                            id="fullName"
                            required={hasPhysicalProducts}
                            value={shippingAddress.fullName}
                            onChange={(e) =>
                              setShippingAddress({ ...shippingAddress, fullName: e.target.value })
                            }
                          />
                        </div>

                        <div className="space-y-2 sm:col-span-2">
                          <Label htmlFor="addressLine1">Address Line 1</Label>
                          <Input
                            id="addressLine1"
                            required={hasPhysicalProducts}
                            value={shippingAddress.addressLine1}
                            onChange={(e) =>
                              setShippingAddress({ ...shippingAddress, addressLine1: e.target.value })
                            }
                          />
                        </div>

                        <div className="space-y-2 sm:col-span-2">
                          <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
                          <Input
                            id="addressLine2"
                            value={shippingAddress.addressLine2}
                            onChange={(e) =>
                              setShippingAddress({ ...shippingAddress, addressLine2: e.target.value })
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="city">City</Label>
                          <Input
                            id="city"
                            required={hasPhysicalProducts}
                            value={shippingAddress.city}
                            onChange={(e) =>
                              setShippingAddress({ ...shippingAddress, city: e.target.value })
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="state">State</Label>
                          <Input
                            id="state"
                            required={hasPhysicalProducts}
                            value={shippingAddress.state}
                            onChange={(e) =>
                              setShippingAddress({ ...shippingAddress, state: e.target.value })
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="zipCode">ZIP Code</Label>
                          <Input
                            id="zipCode"
                            required={hasPhysicalProducts}
                            value={shippingAddress.zipCode}
                            onChange={(e) =>
                              setShippingAddress({ ...shippingAddress, zipCode: e.target.value })
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone</Label>
                          <Input
                            id="phone"
                            type="tel"
                            required={hasPhysicalProducts}
                            value={shippingAddress.phone}
                            onChange={(e) =>
                              setShippingAddress({ ...shippingAddress, phone: e.target.value })
                            }
                          />
                        </div>
                      </div>

                      <Button type="submit" className="w-full" size="lg">
                        Continue to Payment
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}

              {/* Step 2: Payment */}
              {step === 2 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Payment Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handlePaymentSubmit} className="space-y-4">
                      <div className="space-y-3">
                        <Label>Payment Method</Label>
                        <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                          <div className="flex items-center space-x-2 rounded-lg border border-border p-4">
                            <RadioGroupItem value="card" id="card" />
                            <Label
                              htmlFor="card"
                              className="flex flex-1 cursor-pointer items-center gap-2"
                            >
                              <CreditCard className="h-5 w-5" />
                              <div>
                                <div className="font-medium">Pay with Paystack</div>
                                <div className="text-sm text-muted-foreground">
                                  Secure payment via card, bank transfer, or USSD
                                </div>
                              </div>
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2 rounded-lg border border-border p-4">
                            <RadioGroupItem value="crypto" id="crypto" />
                            <Label
                              htmlFor="crypto"
                              className="flex flex-1 cursor-pointer items-center gap-2"
                            >
                              <Bitcoin className="h-5 w-5 text-orange-500" />
                              <div>
                                <div className="font-medium">Pay with Crypto</div>
                                <div className="text-sm text-muted-foreground">
                                  Bitcoin, Ethereum, USDC, and more via Coinbase
                                </div>
                              </div>
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>

                      {paymentMethod === 'card' ? (
                        <div className="rounded-lg bg-muted p-4 space-y-2">
                          <p className="text-sm font-medium">💳 Payment Information</p>
                          <p className="text-sm text-muted-foreground">
                            You will be redirected to Paystack's secure payment page to complete your
                            transaction.
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Amount to pay: <span className="font-bold">₦{total.toLocaleString()}</span>
                          </p>
                        </div>
                      ) : (
                        <div className="rounded-lg bg-orange-50 dark:bg-orange-950 p-4 space-y-2 border border-orange-200 dark:border-orange-800">
                          <p className="text-sm font-medium">₿ Crypto Payment Information</p>
                          <p className="text-sm text-muted-foreground">
                            You will be redirected to Coinbase Commerce to pay with cryptocurrency.
                            Supported coins: Bitcoin, Ethereum, USDC, DAI, and more.
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Amount to pay: <span className="font-bold">₦{total.toLocaleString()}</span>
                            <span className="text-xs ml-1">(converted to USD at checkout)</span>
                          </p>
                        </div>
                      )}

                      <div className="flex gap-2 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setStep(1)}
                          className="flex-1"
                        >
                          Back
                        </Button>
                        <Button type="submit" className="flex-1" disabled={loading}>
                          {loading ? "Processing..." : "Place Order"}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              {/* Step 3: Confirmation */}
              {step === 3 && (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <CheckCircle2 className="mx-auto h-16 w-16 text-green-600" />
                    <h2 className="mt-4 text-2xl font-bold">Order Placed Successfully!</h2>
                    <p className="mt-2 text-muted-foreground">
                      Thank you for your purchase. Your order has been confirmed.
                    </p>
                    <div className="mt-6 rounded-lg bg-muted p-4">
                      <p className="text-sm text-muted-foreground">Order Number</p>
                      <p className="text-lg font-bold">
                        #{completedOrderId?.substring(0, 8).toUpperCase() || "PROCESSING"}
                      </p>
                    </div>
                    <div className="mt-6 space-y-3">
                      {/* Show different actions based on product types in the completed order */}
                      {completedOrderItems.some((item) => item.product.type === "digital") && (
                        <Button onClick={() => router.push("/my-purchases")} className="w-full">
                          <Download className="mr-2 h-4 w-4" />
                          Download Digital Products
                        </Button>
                      )}

                      {completedOrderItems.some((item) => item.product.type === "service") && (
                        <Button
                          onClick={() => router.push("/my-services")}
                          className="w-full"
                          variant="outline"
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          Manage Service Bookings
                        </Button>
                      )}

                      {completedOrderItems.some((item) => item.product.type === "physical") && (
                        <Button
                          onClick={() => router.push("/my-orders")}
                          className="w-full"
                          variant="outline"
                        >
                          <Package className="mr-2 h-4 w-4" />
                          Track Physical Orders
                        </Button>
                      )}

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => router.push("/my-orders")}
                          className="flex-1"
                        >
                          View All Orders
                        </Button>
                        <Button
                          onClick={() => {
                            clearCart()
                            router.push("/products")
                          }}
                          className="flex-1"
                        >
                          Continue Shopping
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Order Summary */}
            <div>
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div key={item.product.id} className="flex gap-3">
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                          <Image
                            src={item.product.images[0] || "/placeholder.svg"}
                            alt={item.product.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium line-clamp-1">{item.product.name}</p>
                          <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                          <p className="text-sm font-medium">
                            ₦{(item.product.price * item.quantity).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-border pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium">₦{totalPrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tax (10%)</span>
                      <span className="font-medium">₦{tax.toLocaleString()}</span>
                    </div>
                    {hasPhysicalProducts ? (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Shipping</span>
                        <span className="font-medium">
                          {shippingCost === 0
                            ? "FREE"
                            : `₦${shippingCost.toLocaleString()}`}
                        </span>
                      </div>
                    ) : (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Shipping</span>
                        <span className="font-medium text-green-600">No shipping required</span>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-border pt-4">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total (NGN)</span>
                      <span>₦{total.toLocaleString()}</span>
                    </div>
                  </div>
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

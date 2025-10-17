"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useCart } from "@/lib/cart-context"
import { useAuth } from "@/lib/firebase/auth-context"
import { CreditCard, Truck, CheckCircle2 } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import type { Address } from "@/lib/types"
import { initiatePaystackPayment } from "@/lib/payment/paystack"
import { db } from "@/lib/firebase/config"
import { collection, addDoc } from "firebase/firestore"
import { toast } from "sonner"

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart()
  const { user } = useAuth()
  const router = useRouter()
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
  const [shippingMethod, setShippingMethod] = useState("standard")
  const [completedOrderId, setCompletedOrderId] = useState<string | null>(null)

  // Check if cart has physical products that require shipping
  const requiresShipping = items.some(item => item.product.requiresShipping)
  
  // Currency conversion rate (USD to NGN)
  const USD_TO_NGN_RATE = 1650 // Update this rate as needed
  
  const tax = totalPrice * 0.1
  const shippingCost = requiresShipping 
    ? (shippingMethod === "express" ? 19.99 : totalPrice > 50 ? 0 : 9.99)
    : 0
  const total = totalPrice + tax + shippingCost
  const totalInNGN = total * USD_TO_NGN_RATE

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Skip shipping validation for digital-only orders
    if (!requiresShipping) {
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
      // Create order in database first
      const orderData = {
        customerId: user!.uid, // Changed from userId to match Firestore rules
        userId: user!.uid,
        userEmail: user!.email,
        items: items.map(item => ({
          productId: item.product.id,
          productName: item.product.name,
          productPrice: item.product.price,
          quantity: item.quantity,
          vendorId: item.product.vendorId,
          vendorName: item.product.vendorName
        })),
        vendorIds: [...new Set(items.map(item => item.product.vendorId))], // For Firestore rules
        subtotal: totalPrice,
        tax: tax,
        shipping: shippingCost,
        total: total,
        status: 'pending',
        paymentStatus: 'pending',
        shippingAddress: shippingAddress,
        shippingMethod: shippingMethod,
        paymentMethod: 'paystack',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // Save to Firestore
      const orderRef = await addDoc(collection(db, 'orders'), orderData)
      const orderId = orderRef.id

      // Initiate Paystack payment (amount in NGN)
      initiatePaystackPayment(
        {
          email: user!.email!,
          amount: totalInNGN, // Convert USD to NGN
          orderId: orderId,
          customerName: shippingAddress.fullName,
          metadata: {
            items: items.length,
            shipping_method: shippingMethod,
            user_id: user!.uid,
            amount_usd: total,
            conversion_rate: USD_TO_NGN_RATE
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
              console.log('✅ Setting step to 3...')
              setCompletedOrderId(orderId) // Store order ID for display
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
                <span className="text-sm font-medium">{requiresShipping ? 'Shipping' : 'Details'}</span>
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
            <div className="lg:col-span-2">
              {/* Step 1: Shipping */}
              {step === 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="h-5 w-5" />
                      {requiresShipping ? 'Shipping Information' : 'Contact Information'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {!requiresShipping && (
                      <div className="mb-4 rounded-lg bg-blue-50 dark:bg-blue-950 p-4 border border-blue-200 dark:border-blue-800">
                        <p className="text-sm text-blue-900 dark:text-blue-100">
                          📦 Your order contains digital products only. No shipping required!
                        </p>
                      </div>
                    )}
                    <form onSubmit={handleShippingSubmit} className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2 sm:col-span-2">
                          <Label htmlFor="fullName">Full Name</Label>
                          <Input
                            id="fullName"
                            required
                            value={shippingAddress.fullName}
                            onChange={(e) => setShippingAddress({ ...shippingAddress, fullName: e.target.value })}
                          />
                        </div>

                        <div className="space-y-2 sm:col-span-2">
                          <Label htmlFor="addressLine1">Address Line 1</Label>
                          <Input
                            id="addressLine1"
                            required
                            value={shippingAddress.addressLine1}
                            onChange={(e) => setShippingAddress({ ...shippingAddress, addressLine1: e.target.value })}
                          />
                        </div>

                        <div className="space-y-2 sm:col-span-2">
                          <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
                          <Input
                            id="addressLine2"
                            value={shippingAddress.addressLine2}
                            onChange={(e) => setShippingAddress({ ...shippingAddress, addressLine2: e.target.value })}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="city">City</Label>
                          <Input
                            id="city"
                            required
                            value={shippingAddress.city}
                            onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="state">State</Label>
                          <Input
                            id="state"
                            required
                            value={shippingAddress.state}
                            onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="zipCode">ZIP Code</Label>
                          <Input
                            id="zipCode"
                            required
                            value={shippingAddress.zipCode}
                            onChange={(e) => setShippingAddress({ ...shippingAddress, zipCode: e.target.value })}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone</Label>
                          <Input
                            id="phone"
                            type="tel"
                            required
                            value={shippingAddress.phone}
                            onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
                          />
                        </div>
                      </div>

                      {requiresShipping && (
                        <div className="space-y-3 pt-4">
                          <Label>Shipping Method</Label>
                          <RadioGroup value={shippingMethod} onValueChange={setShippingMethod}>
                            <div className="flex items-center justify-between rounded-lg border border-border p-4">
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="standard" id="standard" />
                                <Label htmlFor="standard" className="cursor-pointer">
                                  <div className="font-medium">Standard Shipping</div>
                                  <div className="text-sm text-muted-foreground">5-7 business days</div>
                                </Label>
                              </div>
                              <span className="font-medium">{totalPrice > 50 ? "FREE" : "$9.99"}</span>
                            </div>
                            <div className="flex items-center justify-between rounded-lg border border-border p-4">
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="express" id="express" />
                                <Label htmlFor="express" className="cursor-pointer">
                                  <div className="font-medium">Express Shipping</div>
                                  <div className="text-sm text-muted-foreground">2-3 business days</div>
                                </Label>
                              </div>
                              <span className="font-medium">$19.99</span>
                            </div>
                          </RadioGroup>
                        </div>
                      )}

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
                            <Label htmlFor="card" className="flex flex-1 cursor-pointer items-center gap-2">
                              <CreditCard className="h-5 w-5" />
                              <div>
                                <div className="font-medium">Pay with Paystack</div>
                                <div className="text-sm text-muted-foreground">Secure payment via card, bank transfer, or USSD</div>
                              </div>
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>

                      <div className="rounded-lg bg-muted p-4 space-y-2">
                        <p className="text-sm font-medium">💳 Payment Information</p>
                        <p className="text-sm text-muted-foreground">
                          You will be redirected to Paystack's secure payment page to complete your transaction.
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Amount to pay: <span className="font-bold">₦{totalInNGN.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span> (${total.toFixed(2)} USD)
                        </p>
                      </div>

                      <div className="flex gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
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
                      <p className="text-lg font-bold">#{completedOrderId?.substring(0, 8).toUpperCase() || 'PROCESSING'}</p>
                    </div>
                    <div className="mt-6 flex gap-2">
                      <Button variant="outline" onClick={() => router.push("/dashboard")} className="flex-1">
                        View Orders
                      </Button>
                      <Button
                        onClick={() => {
                          clearCart()
                          router.push("/")
                        }}
                        className="flex-1"
                      >
                        Continue Shopping
                      </Button>
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
                          <p className="text-sm font-medium">${(item.product.price * item.quantity).toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-border pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium">${totalPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tax (10%)</span>
                      <span className="font-medium">${tax.toFixed(2)}</span>
                    </div>
                    {requiresShipping && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Shipping</span>
                        <span className="font-medium">{shippingCost === 0 ? "FREE" : `$${shippingCost.toFixed(2)}`}</span>
                      </div>
                    )}
                    {!requiresShipping && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Shipping</span>
                        <span className="font-medium text-green-600">Digital Product - No Shipping</span>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-border pt-4 space-y-1">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total (USD)</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Total (NGN)</span>
                      <span>₦{totalInNGN.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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

"use client"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCart } from "@/lib/cart-context"
import { Minus, Plus, Trash2, ShoppingBag, Store } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

export default function CartPage() {
  const { items, updateQuantity, removeFromCart, totalPrice, totalItems } = useCart()

  // Group items by vendor
  const itemsByVendor = items.reduce((acc, item) => {
    const vendorId = item.product.vendorId
    if (!acc[vendorId]) {
      acc[vendorId] = {
        vendorId,
        vendorName: item.product.vendorName,
        items: []
      }
    }
    acc[vendorId].items.push(item)
    return acc
  }, {} as Record<string, { vendorId: string; vendorName: string; items: typeof items }>)

  const vendorGroups = Object.values(itemsByVendor)

  const tax = totalPrice * 0.1
  const shipping = totalPrice > 50000 ? 0 : 2500
  const total = totalPrice + tax + shipping

  if (items.length === 0) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          <div className="container mx-auto px-4 py-16">
            <div className="mx-auto max-w-md text-center">
              <ShoppingBag className="mx-auto h-24 w-24 text-muted-foreground" />
              <h1 className="mt-6 text-2xl font-bold">Your cart is empty</h1>
              <p className="mt-2 text-muted-foreground">Add some products to get started</p>
              <Button asChild className="mt-6">
                <Link href="/products">Continue Shopping</Link>
              </Button>
            </div>
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
          <h1 className="mb-8 text-3xl font-bold">Shopping Cart ({totalItems} items)</h1>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Cart Items Grouped by Vendor */}
            <div className="lg:col-span-2 space-y-6">
              {vendorGroups.map((vendorGroup) => {
                const vendorTotal = vendorGroup.items.reduce(
                  (sum, item) => sum + item.product.price * item.quantity,
                  0
                )
                
                return (
                  <Card key={vendorGroup.vendorId} className="overflow-hidden">
                    {/* Vendor Header */}
                    <div className="bg-muted/50 p-4 border-b">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                            {vendorGroup.vendorName?.charAt(0) || 'V'}
                          </div>
                          <div>
                            <Link 
                              href={`/store/${vendorGroup.vendorId}`}
                              className="font-semibold hover:underline flex items-center gap-2"
                            >
                              {vendorGroup.vendorName}
                              <Store className="h-4 w-4" />
                            </Link>
                            <p className="text-xs text-muted-foreground">
                              {vendorGroup.items.length} item(s) • ₦{vendorTotal.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/store/${vendorGroup.vendorId}`}>
                            Visit Store
                          </Link>
                        </Button>
                      </div>
                    </div>

                    {/* Vendor Items */}
                    <CardContent className="p-0">
                      {vendorGroup.items.map((item, index) => (
                        <div key={item.product.id}>
                          <div className="p-6">
                            <div className="flex gap-4">
                              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
                                <Image
                                  src={item.product.images[0] || "/placeholder.svg"}
                                  alt={item.product.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>

                              <div className="flex flex-1 flex-col justify-between">
                                <div>
                                  <Link href={`/products/${item.product.id}`} className="font-semibold hover:underline">
                                    {item.product.name}
                                  </Link>
                                  {item.product.stock < 10 && item.product.stock > 0 && (
                                    <Badge variant="destructive" className="ml-2 text-xs">
                                      Only {item.product.stock} left
                                    </Badge>
                                  )}
                                </div>

                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8 bg-transparent"
                                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                    >
                                      <Minus className="h-4 w-4" />
                                    </Button>
                                    <span className="w-12 text-center">{item.quantity}</span>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8 bg-transparent"
                                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                      disabled={item.quantity >= item.product.stock}
                                    >
                                      <Plus className="h-4 w-4" />
                                    </Button>
                                  </div>

                                  <div className="flex items-center gap-4">
                                    <span className="text-lg font-bold">
                                      ₦{(item.product.price * item.quantity).toLocaleString()}
                                    </span>
                                    <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.product.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          {index < vendorGroup.items.length - 1 && <Separator />}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Order Summary */}
            <div>
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">₦{totalPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax (10%)</span>
                    <span className="font-medium">₦{tax.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="font-medium">{shipping === 0 ? "FREE" : `₦${shipping.toLocaleString()}`}</span>
                  </div>

                  {shipping > 0 && (
                    <div className="rounded-lg bg-blue-500/10 p-3 text-sm text-blue-600">
                      Add ₦{(50000 - totalPrice).toLocaleString()} more for free shipping!
                    </div>
                  )}

                  <div className="border-t border-border pt-4">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span>₦{total.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Input placeholder="Enter promo code" />
                    <Button variant="outline" className="w-full bg-transparent">
                      Apply Code
                    </Button>
                  </div>

                  <Button asChild className="w-full" size="lg">
                    <Link href="/checkout">Proceed to Checkout</Link>
                  </Button>

                  <Button variant="ghost" asChild className="w-full">
                    <Link href="/products">Continue Shopping</Link>
                  </Button>
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

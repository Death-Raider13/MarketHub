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

  // Group items by creator
  const itemsBycreator = items.reduce((acc, item) => {
    const creatorId = item.product.creatorId
    if (!acc[creatorId]) {
      acc[creatorId] = {
        creatorId,
        creatorName: item.product.creatorName || 'creator Store',
        items: []
      }
    }
    acc[creatorId].items.push(item)
    return acc
  }, {} as Record<string, { creatorId: string; creatorName: string; items: typeof items }>)

  const creatorGroups = Object.values(itemsBycreator)

  const tax = totalPrice * 0.1
  const total = totalPrice + tax

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
            {/* Cart Items Grouped by creator */}
            <div className="lg:col-span-2 space-y-6">
              {creatorGroups.map((creatorGroup) => {
                const creatorTotal = creatorGroup.items.reduce(
                  (sum, item) => sum + item.product.price * item.quantity,
                  0
                )

                return (
                  <Card key={creatorGroup.creatorId} className="overflow-hidden">
                    {/* creator Header */}
                    <div className="bg-muted/50 p-4 border-b">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                            {creatorGroup.creatorName?.charAt(0) || 'V'}
                          </div>
                          <div>
                            <Link
                              href={`/hub/${creatorGroup.creatorId}`}
                              className="font-semibold hover:underline flex items-center gap-2"
                            >
                              {creatorGroup.creatorName}
                              <Store className="h-4 w-4" />
                            </Link>
                            <p className="text-xs text-muted-foreground">
                              {creatorGroup.items.length} item(s) • ₦{creatorTotal.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/hub/${creatorGroup.creatorId}`}>
                            Visit Store
                          </Link>
                        </Button>
                      </div>
                    </div>

                    {/* creator Items */}
                    <CardContent className="p-0">
                      {creatorGroup.items.map((item, index) => (
                        <div key={item.product.id}>
                          <div className="p-4 sm:p-6">
                            <div className="flex flex-col sm:flex-row gap-4">
                              <div className="flex gap-4 items-start flex-1">
                                <div className="relative h-20 w-20 sm:h-24 sm:w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
                                  <Image
                                    src={item.product.images[0] || "/placeholder.svg"}
                                    alt={item.product.name}
                                    fill
                                    className="object-cover"
                                  />
                                </div>

                                <div className="flex flex-1 flex-col justify-between min-w-0">
                                  <div>
                                    <Link href={`/products/${item.product.id}`} className="font-semibold hover:underline text-sm sm:text-base line-clamp-2">
                                      {item.product.name}
                                    </Link>
                                    {item.product.stock < 10 && item.product.stock > 0 && (
                                      <Badge variant="destructive" className="mt-1 text-[10px]">
                                        Only {item.product.stock} left
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 mt-2 sm:mt-0">
                                <div className="flex items-center gap-1 sm:gap-2">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 bg-transparent"
                                    onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                  >
                                    <Minus className="h-4 w-4" />
                                  </Button>
                                  <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
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

                                <div className="flex items-center gap-3">
                                  <span className="text-base sm:text-lg font-bold">
                                    ₦{(item.product.price * item.quantity).toLocaleString()}
                                  </span>
                                  <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.product.id)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                          {index < creatorGroup.items.length - 1 && <Separator />}
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

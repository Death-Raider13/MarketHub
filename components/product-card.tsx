"use client"

import Link from "next/link"
import Image from "next/image"
import { Star, ShoppingCart, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import type { Product } from "@/lib/types"

interface ProductCardProps {
  product: Product
  onAddToCart?: (product: Product) => void
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const discount = product.comparePrice
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0

  return (
    <Card className="group overflow-hidden transition-all hover:shadow-lg">
      <Link href={`/products/${product.id}`}>
        <div className="relative aspect-square overflow-hidden bg-muted">
          <Image
            src={product.images[0] || "/placeholder.svg?height=300&width=300"}
            alt={product.name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
          />
          {product.sponsored && <Badge className="absolute left-2 top-2 bg-blue-600">Sponsored</Badge>}
          {discount > 0 && <Badge className="absolute right-2 top-2 bg-red-600">{discount}% OFF</Badge>}
          <Button
            size="icon"
            variant="secondary"
            className="absolute right-2 bottom-2 opacity-0 transition-opacity group-hover:opacity-100"
            onClick={(e) => {
              e.preventDefault()
              // Add to wishlist logic
            }}
          >
            <Heart className="h-4 w-4" />
          </Button>
        </div>
      </Link>

      <CardContent className="p-4">
        <Link href={`/products/${product.id}`}>
          <h3 className="font-semibold line-clamp-2 hover:underline">{product.name}</h3>
        </Link>
        <Link href={`/vendors/${product.vendorId}`} className="text-sm text-muted-foreground hover:underline">
          {product.vendorName}
        </Link>
        <div className="mt-2 flex items-center gap-1">
          <div className="flex">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${i < Math.floor(product.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
              />
            ))}
          </div>
          <span className="text-sm text-muted-foreground">({product.reviewCount})</span>
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between p-4 pt-0">
        <div>
          <div className="text-2xl font-bold">${product.price.toFixed(2)}</div>
          {product.comparePrice && (
            <div className="text-sm text-muted-foreground line-through">${product.comparePrice.toFixed(2)}</div>
          )}
        </div>
        <Button size="sm" onClick={() => onAddToCart?.(product)} disabled={product.stock === 0}>
          <ShoppingCart className="mr-2 h-4 w-4" />
          {product.stock === 0 ? "Out of Stock" : "Add"}
        </Button>
      </CardFooter>
    </Card>
  )
}

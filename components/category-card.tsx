import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import type { Category } from "@/lib/types"
import { Smartphone, Shirt, Home, Dumbbell, Book, Gamepad2 } from "lucide-react"

const iconMap: Record<string, any> = {
  smartphone: Smartphone,
  shirt: Shirt,
  home: Home,
  dumbbell: Dumbbell,
  book: Book,
  gamepad: Gamepad2,
}

interface CategoryCardProps {
  category: Category
}

export function CategoryCard({ category }: CategoryCardProps) {
  const Icon = iconMap[category.icon] || Smartphone

  return (
    <Link href={`/products?category=${category.slug}`}>
      <Card className="group cursor-pointer transition-all hover:shadow-lg hover:border-primary">
        <CardContent className="flex flex-col items-center justify-center p-6 text-center">
          <div className="mb-4 rounded-full bg-primary/10 p-4 transition-colors group-hover:bg-primary/20">
            <Icon className="h-8 w-8 text-primary" />
          </div>
          <h3 className="font-semibold">{category.name}</h3>
          <p className="text-sm text-muted-foreground">{category.productCount} products</p>
        </CardContent>
      </Card>
    </Link>
  )
}

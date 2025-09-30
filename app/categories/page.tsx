import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { CategoryCard } from "@/components/category-card"
import { Card, CardContent } from "@/components/ui/card"
import type { Category } from "@/lib/types"

const categories: Category[] = [
  { id: "1", name: "Electronics", slug: "electronics", icon: "smartphone", productCount: 12345 },
  { id: "2", name: "Fashion & Apparel", slug: "fashion", icon: "shirt", productCount: 24567 },
  { id: "3", name: "Home & Garden", slug: "home", icon: "home", productCount: 9876 },
  { id: "4", name: "Sports & Outdoors", slug: "sports", icon: "dumbbell", productCount: 6543 },
  { id: "5", name: "Books & Media", slug: "books", icon: "book", productCount: 4321 },
  { id: "6", name: "Gaming", slug: "gaming", icon: "gamepad", productCount: 8765 },
  { id: "7", name: "Beauty & Personal Care", slug: "beauty", icon: "sparkles", productCount: 5432 },
  { id: "8", name: "Toys & Games", slug: "toys", icon: "puzzle", productCount: 3210 },
  { id: "9", name: "Automotive", slug: "automotive", icon: "car", productCount: 2109 },
  { id: "10", name: "Pet Supplies", slug: "pets", icon: "paw", productCount: 1987 },
  { id: "11", name: "Office Supplies", slug: "office", icon: "briefcase", productCount: 3456 },
  { id: "12", name: "Health & Wellness", slug: "health", icon: "heart", productCount: 4567 },
]

const featuredCategories = [
  {
    name: "Electronics",
    description: "Latest gadgets and tech",
    image: "/placeholder.svg",
    productCount: 12345,
    slug: "electronics",
  },
  {
    name: "Fashion",
    description: "Trending styles for everyone",
    image: "/placeholder.svg",
    productCount: 24567,
    slug: "fashion",
  },
  {
    name: "Home & Garden",
    description: "Everything for your home",
    image: "/placeholder.svg",
    productCount: 9876,
    slug: "home",
  },
]

export default function CategoriesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="border-b border-border bg-gradient-to-br from-primary/5 via-background to-background">
          <div className="container mx-auto px-4 py-16">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
                Shop by Category
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                Explore our wide range of product categories
              </p>
            </div>
          </div>
        </section>

        {/* Featured Categories */}
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold mb-8">Featured Categories</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {featuredCategories.map((category) => (
              <Card key={category.slug} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative h-48 bg-gradient-to-br from-primary/20 to-primary/5">
                  {/* Add category image here */}
                </div>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-2">{category.name}</h3>
                  <p className="text-muted-foreground mb-4">{category.description}</p>
                  <p className="text-sm text-muted-foreground">
                    {category.productCount.toLocaleString()} products
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* All Categories */}
        <section className="border-t border-border bg-muted/30 py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8">All Categories</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {categories.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

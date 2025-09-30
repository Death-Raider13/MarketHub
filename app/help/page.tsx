import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { 
  Search, 
  Package, 
  CreditCard, 
  RotateCcw, 
  Shield, 
  Truck,
  HelpCircle,
  MessageCircle,
  Mail,
  Phone
} from "lucide-react"
import Link from "next/link"

const helpCategories = [
  {
    icon: Package,
    title: "Orders & Shipping",
    description: "Track orders, shipping info, and delivery",
    articles: [
      "How to track my order",
      "Shipping methods and costs",
      "International shipping",
      "Order modifications",
    ],
  },
  {
    icon: RotateCcw,
    title: "Returns & Refunds",
    description: "Return policy, refunds, and exchanges",
    articles: [
      "How to return an item",
      "Refund processing time",
      "Exchange policy",
      "Return shipping costs",
    ],
  },
  {
    icon: CreditCard,
    title: "Payment & Billing",
    description: "Payment methods, invoices, and billing",
    articles: [
      "Accepted payment methods",
      "Payment security",
      "How to get an invoice",
      "Promo codes and discounts",
    ],
  },
  {
    icon: Shield,
    title: "Account & Security",
    description: "Account settings, security, and privacy",
    articles: [
      "Create an account",
      "Reset password",
      "Update profile information",
      "Account security tips",
    ],
  },
  {
    icon: Truck,
    title: "Vendor Information",
    description: "Selling on our platform",
    articles: [
      "How to become a vendor",
      "Vendor dashboard guide",
      "Commission structure",
      "Vendor policies",
    ],
  },
  {
    icon: HelpCircle,
    title: "General Questions",
    description: "FAQs and general information",
    articles: [
      "About MarketHub",
      "How to contact support",
      "Terms of service",
      "Privacy policy",
    ],
  },
]

const popularArticles = [
  "How do I track my order?",
  "What is your return policy?",
  "How long does shipping take?",
  "How do I reset my password?",
  "What payment methods do you accept?",
  "How do I contact a vendor?",
  "How do I cancel my order?",
  "Do you ship internationally?",
]

export default function HelpCenterPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="border-b border-border bg-gradient-to-br from-primary/5 via-background to-background">
          <div className="container mx-auto px-4 py-16 md:py-24">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
                How can we help you?
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                Search our help center or browse categories below
              </p>
              <form className="mt-8">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search for help articles..."
                    className="h-14 pl-12 pr-4 text-lg"
                  />
                  <Button 
                    type="submit" 
                    size="lg" 
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                  >
                    Search
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </section>

        {/* Help Categories */}
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold mb-8">Browse by Category</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {helpCategories.map((category) => (
              <Card key={category.title} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <category.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{category.title}</h3>
                      <p className="text-sm font-normal text-muted-foreground">
                        {category.description}
                      </p>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {category.articles.map((article) => (
                      <li key={article}>
                        <Link
                          href={`/help/article/${article.toLowerCase().replace(/\s+/g, "-")}`}
                          className="text-sm text-primary hover:underline"
                        >
                          {article}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Popular Articles */}
        <section className="border-t border-border bg-muted/30 py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8">Popular Articles</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {popularArticles.map((article) => (
                <Link
                  key={article}
                  href={`/help/article/${article.toLowerCase().replace(/\s+/g, "-")}`}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 hover:border-primary transition-colors"
                >
                  <HelpCircle className="h-5 w-5 text-primary shrink-0" />
                  <span className="font-medium">{article}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Support */}
        <section className="container mx-auto px-4 py-16">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-bold mb-4">Still need help?</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Our support team is here to assist you
            </p>
            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <MessageCircle className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Live Chat</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Chat with our support team
                  </p>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/contact">Start Chat</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Email Support</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Response within 24 hours
                  </p>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/contact">Send Email</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Phone className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Phone Support</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Mon-Fri, 9AM-6PM PST
                  </p>
                  <Button variant="outline" className="w-full">
                    1-800-MARKET
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

"use client"

import { useParams } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, 
  ThumbsUp, 
  ThumbsDown, 
  Share2, 
  Clock,
  User,
  MessageCircle
} from "lucide-react"
import Link from "next/link"
import { helpArticles } from "@/lib/help-articles"
import { useState } from "react"
import { toast } from "sonner"

export default function HelpArticlePage() {
  const params = useParams()
  const slug = params.slug as string
  const [helpful, setHelpful] = useState<boolean | null>(null)
  
  const article = helpArticles[slug]

  if (!article) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Article Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The help article you're looking for doesn't exist.
            </p>
            <Button asChild>
              <Link href="/help">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Help Center
              </Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const handleFeedback = (isHelpful: boolean) => {
    setHelpful(isHelpful)
    toast.success(isHelpful ? "Thanks for your feedback!" : "We'll work on improving this article.")
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Breadcrumb */}
        <div className="border-b border-border bg-muted/30">
          <div className="container mx-auto px-4 py-4">
            <nav className="flex items-center space-x-2 text-sm">
              <Link href="/help" className="text-primary hover:underline">
                Help Center
              </Link>
              <span className="text-muted-foreground">/</span>
              <Link href="/help" className="text-primary hover:underline">
                {article.category}
              </Link>
              <span className="text-muted-foreground">/</span>
              <span className="text-muted-foreground">{article.title}</span>
            </nav>
          </div>
        </div>

        {/* Article Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="mx-auto max-w-4xl">
            <div className="grid gap-8 lg:grid-cols-4">
              {/* Main Content */}
              <div className="lg:col-span-3">
                <Card>
                  <CardContent className="p-8">
                    {/* Article Header */}
                    <div className="mb-8">
                      <div className="flex items-center gap-2 mb-4">
                        <Badge variant="secondary">{article.category}</Badge>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {article.readTime} min read
                        </div>
                      </div>
                      <h1 className="text-3xl font-bold mb-4">{article.title}</h1>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          Updated {article.lastUpdated}
                        </div>
                      </div>
                    </div>

                    {/* Article Body */}
                    <div 
                      className="prose prose-gray max-w-none"
                      dangerouslySetInnerHTML={{ __html: article.content }}
                    />

                    {/* Article Footer */}
                    <div className="mt-12 pt-8 border-t border-border">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold mb-2">Was this article helpful?</h3>
                          <div className="flex gap-2">
                            <Button
                              variant={helpful === true ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleFeedback(true)}
                            >
                              <ThumbsUp className="mr-2 h-4 w-4" />
                              Yes
                            </Button>
                            <Button
                              variant={helpful === false ? "destructive" : "outline"}
                              size="sm"
                              onClick={() => handleFeedback(false)}
                            >
                              <ThumbsDown className="mr-2 h-4 w-4" />
                              No
                            </Button>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <Share2 className="mr-2 h-4 w-4" />
                          Share
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1">
                <div className="sticky top-8 space-y-6">
                  {/* Related Articles */}
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="font-semibold mb-4">Related Articles</h3>
                      <div className="space-y-3">
                        {article.relatedArticles?.map((relatedSlug) => {
                          const relatedArticle = helpArticles[relatedSlug]
                          return relatedArticle ? (
                            <Link
                              key={relatedSlug}
                              href={`/help/article/${relatedSlug}`}
                              className="block text-sm text-primary hover:underline"
                            >
                              {relatedArticle.title}
                            </Link>
                          ) : null
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Contact Support */}
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="font-semibold mb-4">Still need help?</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Can't find what you're looking for? Our support team is here to help.
                      </p>
                      <Button className="w-full" asChild>
                        <Link href="/contact">
                          <MessageCircle className="mr-2 h-4 w-4" />
                          Contact Support
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, CheckCircle2, Mail, FileText, HelpCircle } from "lucide-react"
import Link from "next/link"

export default function PendingApprovalPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 py-16">
          <div className="mx-auto max-w-2xl">
            <Card>
              <CardContent className="p-8 text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-yellow-500/10">
                  <Clock className="h-10 w-10 text-yellow-600" />
                </div>

                <h1 className="text-3xl font-bold mb-4">
                  Application Submitted Successfully!
                </h1>
                
                <p className="text-lg text-muted-foreground mb-8">
                  Thank you for applying to become a vendor on MarketHub. Your application is currently under review.
                </p>

                <div className="rounded-lg bg-muted p-6 text-left mb-8">
                  <h2 className="font-semibold mb-4 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    What happens next?
                  </h2>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium">
                        1
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Application Review</p>
                        <p>Our team will review your application within 1-3 business days</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium">
                        2
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Email Notification</p>
                        <p>You'll receive an email once your application is approved or if we need additional information</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium">
                        3
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Start Selling</p>
                        <p>Once approved, you can access your vendor dashboard and start adding products</p>
                      </div>
                    </li>
                  </ul>
                </div>

                <div className="grid gap-4 sm:grid-cols-3 mb-8">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Mail className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <h3 className="font-semibold text-sm mb-1">Check Your Email</h3>
                      <p className="text-xs text-muted-foreground">
                        We've sent a confirmation to your email
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4 text-center">
                      <FileText className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <h3 className="font-semibold text-sm mb-1">Review Period</h3>
                      <p className="text-xs text-muted-foreground">
                        1-3 business days
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4 text-center">
                      <HelpCircle className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <h3 className="font-semibold text-sm mb-1">Need Help?</h3>
                      <p className="text-xs text-muted-foreground">
                        Contact our support team
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button asChild>
                    <Link href="/">Return to Home</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/help">Visit Help Center</Link>
                  </Button>
                </div>

                <div className="mt-8 pt-8 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    Questions about your application?{" "}
                    <Link href="/contact" className="text-primary hover:underline">
                      Contact us
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, Clock, CheckCircle, XCircle } from "lucide-react"

export default function ReturnsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1">
        <div className="container mx-auto px-4 py-16 max-w-4xl">
          <h1 className="text-4xl font-bold mb-8">Returns & Refunds Policy</h1>
          
          <div className="prose prose-gray max-w-none">
            <p className="text-muted-foreground mb-8">
              Last updated: January 20, 2025
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Return Policy Overview</h2>
              <p className="text-muted-foreground mb-4">
                At MarketHub, we want you to be completely satisfied with your purchase. If you're not happy with your order, we offer a flexible return policy to ensure your peace of mind.
              </p>
            </section>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <Clock className="h-8 w-8 mb-2 text-primary" />
                  <CardTitle>Return Window</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    You have 7 days from the date of delivery to initiate a return for most items.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Package className="h-8 w-8 mb-2 text-primary" />
                  <CardTitle>Item Condition</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Items must be unused, in original packaging, and in the same condition as received.
                  </p>
                </CardContent>
              </Card>
            </div>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Eligible Items</h2>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-green-900 mb-2">Items that can be returned:</p>
                    <ul className="list-disc pl-6 text-green-800">
                      <li>Defective or damaged products</li>
                      <li>Wrong items received</li>
                      <li>Items not as described</li>
                      <li>Unopened electronics in original packaging</li>
                      <li>Clothing with tags attached</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-900 mb-2">Items that cannot be returned:</p>
                    <ul className="list-disc pl-6 text-red-800">
                      <li>Digital products and downloads</li>
                      <li>Perishable goods</li>
                      <li>Personal care items</li>
                      <li>Custom or personalized items</li>
                      <li>Items marked as non-returnable</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">How to Return an Item</h2>
              <ol className="list-decimal pl-6 text-muted-foreground space-y-3">
                <li>
                  <strong>Log in to your account</strong> and go to your order history
                </li>
                <li>
                  <strong>Select the order</strong> containing the item you want to return
                </li>
                <li>
                  <strong>Click "Return Item"</strong> and select the reason for return
                </li>
                <li>
                  <strong>Wait for approval</strong> from the vendor (usually within 24 hours)
                </li>
                <li>
                  <strong>Ship the item back</strong> using the provided return label
                </li>
                <li>
                  <strong>Receive your refund</strong> once the vendor confirms receipt
                </li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Refund Process</h2>
              <p className="text-muted-foreground mb-4">
                Once your return is received and inspected, we will send you an email notification. If approved:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground mb-4">
                <li>Refunds are processed within 5-7 business days</li>
                <li>The refund will be credited to your original payment method</li>
                <li>Shipping costs are non-refundable (except for defective items)</li>
                <li>You'll receive an email confirmation once the refund is processed</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Exchanges</h2>
              <p className="text-muted-foreground mb-4">
                If you need to exchange an item for a different size, color, or variant:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground mb-4">
                <li>Contact the vendor directly through the messaging system</li>
                <li>Exchanges are subject to product availability</li>
                <li>Additional shipping charges may apply</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Damaged or Defective Items</h2>
              <p className="text-muted-foreground mb-4">
                If you receive a damaged or defective item:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground mb-4">
                <li>Contact us immediately with photos of the damage</li>
                <li>We'll arrange for a replacement or full refund</li>
                <li>Return shipping will be covered by the vendor</li>
                <li>Priority processing for damaged item claims</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
              <p className="text-muted-foreground mb-4">
                If you have any questions about returns or refunds, please contact us:
              </p>
              <p className="text-muted-foreground">
                Email: returns@markethub.ng<br />
                Phone: +234 XXX XXX XXXX<br />
                Hours: Monday - Friday, 9AM - 6PM WAT
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

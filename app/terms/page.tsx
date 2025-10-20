import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1">
        <div className="container mx-auto px-4 py-16 max-w-4xl">
          <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
          
          <div className="prose prose-gray max-w-none">
            <p className="text-muted-foreground mb-8">
              Last updated: January 20, 2025
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground mb-4">
                By accessing and using MarketHub, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">2. Use License</h2>
              <p className="text-muted-foreground mb-4">
                Permission is granted to temporarily access the materials (information or software) on MarketHub for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title.
              </p>
              <p className="text-muted-foreground mb-4">
                Under this license you may not:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground mb-4">
                <li>Modify or copy the materials</li>
                <li>Use the materials for any commercial purpose</li>
                <li>Attempt to decompile or reverse engineer any software</li>
                <li>Remove any copyright or other proprietary notations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">3. Vendor Terms</h2>
              <p className="text-muted-foreground mb-4">
                Vendors using MarketHub agree to:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground mb-4">
                <li>Provide accurate product information</li>
                <li>Honor all sales and commitments</li>
                <li>Comply with all applicable laws and regulations</li>
                <li>Maintain professional conduct</li>
                <li>Pay applicable fees and commissions</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">4. Customer Terms</h2>
              <p className="text-muted-foreground mb-4">
                Customers using MarketHub agree to:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground mb-4">
                <li>Provide accurate information</li>
                <li>Make legitimate purchases</li>
                <li>Respect vendor policies</li>
                <li>Not engage in fraudulent activities</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">5. Payment Terms</h2>
              <p className="text-muted-foreground mb-4">
                All payments are processed securely through our payment partners. MarketHub does not store credit card information. Vendors receive payouts according to the payout schedule minus applicable fees.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">6. Disclaimer</h2>
              <p className="text-muted-foreground mb-4">
                The materials on MarketHub are provided on an 'as is' basis. MarketHub makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">7. Limitations</h2>
              <p className="text-muted-foreground mb-4">
                In no event shall MarketHub or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on MarketHub.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">8. Governing Law</h2>
              <p className="text-muted-foreground mb-4">
                These terms and conditions are governed by and construed in accordance with the laws of Nigeria and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">9. Contact Information</h2>
              <p className="text-muted-foreground mb-4">
                If you have any questions about these Terms, please contact us at support@markethub.ng
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

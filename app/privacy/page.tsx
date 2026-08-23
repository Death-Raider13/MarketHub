import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-16 max-w-4xl">
          <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
          <div className="prose prose-gray max-w-none dark:prose-invert">
            <p className="text-muted-foreground mb-8">Last updated: August 23, 2026</p>

            <section className="mb-8"><h2>1. Scope</h2><p>This Privacy Policy explains how Fero E-Library collects, uses, stores, shares, and protects information when you visit the platform, create an account, purchase a book, upload creator content, participate in the affiliate programme, contact support, or use any related service.</p></section>

            <section className="mb-8"><h2>2. Information we collect</h2><p>Depending on how you use the platform, we may collect your name, email address, phone number, account role, profile details, waitlist status, creator and affiliate application information, verification documents, institution information, payment and payout details, order history, product uploads, support messages, reviews, and communications.</p><p>We also collect technical and security information such as IP address, device and browser information, session identifiers, referral codes, product-link clicks, download-token activity, timestamps, approximate location derived from technical data, and records of actions taken on the platform. We do not intentionally store full card details; payment processors handle payment credentials under their own privacy terms.</p></section>

            <section className="mb-8"><h2>3. How we use information</h2><p>We use information to create and secure accounts; verify email, creator, and affiliate eligibility; administer waitlist discounts and role access; process payments, refunds, commissions, payouts, and fees; deliver books to the purchaser&apos;s email address and account; provide customer support; prevent fraud, piracy, abuse, and payment disputes; calculate referral attribution and commissions; investigate suspected infringement; improve platform reliability; communicate service notices and marketing where permitted; comply with legal obligations; and establish, exercise, or defend legal claims.</p></section>

            <section className="mb-8"><h2>4. Affiliate attribution and analytics</h2><p>When you open an affiliate product link, we may store the referral code, selected product, landing page, click identifier, browser information, and expiry time in your browser and in our platform records. Referral attribution is currently intended to last for 30 days unless it is removed, expires, or is superseded. We use this information to determine whether an eligible purchase should be credited to an approved affiliate and to detect click manipulation, self-referrals, fraud, and abuse.</p><p>Affiliate participants must not use referral tracking to collect information unlawfully, identify people without permission, spam users, or create misleading advertising. We may disclose relevant attribution and transaction records to the affected affiliate, creator, payment processor, investigators, advisers, or authorities where necessary.</p></section>

            <section className="mb-8"><h2>5. Email delivery and digital books</h2><p>When you purchase a digital book, we use your account and checkout email address to send order confirmation, delivery instructions, download links, access notices, security messages, and support communications. We may also provide the book inside your authenticated account. Delivery links and download tokens may be time-limited and associated with your user account, order, device, or transaction.</p><p>If you provide an incorrect email address or lose access to it, delivery may be delayed. You must not forward delivery messages, links, tokens, or account access to another person.</p></section>

            <section className="mb-8"><h2>6. Invisible watermarking and content protection</h2><p>To protect creator and platform rights, digital books may contain invisible or embedded watermarks, purchaser identifiers, transaction references, file metadata, hashes, access tokens, or other rights-management markers. These markers may be generated from information connected to your order or account and may remain in a file after download. We use them to verify authorised access, investigate unauthorised distribution, connect leaked copies to relevant transactions, preserve evidence, and support rights enforcement.</p><p>We may inspect, compare, preserve, and disclose watermark and download records when reasonably necessary to investigate suspected piracy, fraud, copyright infringement, unlawful resale, or a breach of the Terms and Conditions. We do not use watermarking to obtain unrelated personal information from your device.</p></section>

            <section className="mb-8"><h2>7. Who we share information with</h2><p>We may share information with payment processors, email and delivery providers, cloud hosting and storage providers, authentication and security providers, analytics and fraud-prevention providers, creators involved in fulfilling a purchase, affiliates where attribution or commission records require it, professional advisers, insurers, auditors, law-enforcement agencies, courts, regulators, and parties involved in a merger, acquisition, restructuring, or sale of assets.</p><p>We do not sell personal information as a commercial data-broker product. Service providers may process information only to provide services to us or as otherwise permitted by law.</p></section>

            <section className="mb-8"><h2>8. Retention and security</h2><p>We retain account, purchase, payment, referral, watermark, support, and enforcement records for as long as reasonably necessary for the purposes described in this Policy, including accounting, dispute resolution, fraud prevention, legal claims, and statutory obligations. We use access controls, authenticated sessions, server-side verification, signed or time-limited delivery mechanisms, monitoring, and other reasonable safeguards. No internet transmission or storage system is completely secure, and you use the platform with that understanding.</p></section>

            <section className="mb-8"><h2>9. Your choices and rights</h2><p>Subject to applicable law, you may request access to, correction of, or deletion of personal information; ask about processing; withdraw consent for optional marketing; or object to certain processing. Some records may need to be retained for security, accounting, legal, anti-fraud, copyright, or transaction purposes. To make a request, contact privacy@FeroLibrary.ng and provide enough information for us to verify your identity and respond securely.</p></section>

            <section className="mb-8"><h2>10. Cookies and local storage</h2><p>We use cookies, local storage, session technologies, and similar mechanisms for authentication, security, cart functionality, referral attribution, preferences, analytics, and delivery. Blocking these technologies may prevent login, checkout, referral attribution, or digital delivery from working correctly. You can control many browser storage settings through your browser, but deletion may remove necessary preferences or attribution information.</p></section>

            <section className="mb-8"><h2>11. Children</h2><p>The platform is not directed at children under 13, and we do not knowingly collect personal information from children under 13. If you believe a child has provided information, contact privacy@FeroLibrary.ng so we can investigate and take appropriate action.</p></section>

            <section className="mb-8"><h2>12. International processing and changes</h2><p>Our service providers may process information in Nigeria or other locations where they operate. We take reasonable steps to protect information while it is processed. We may update this Policy as the platform, law, or security practices change. The updated version will be posted with a new effective date. Material changes may also be communicated through the platform or email where appropriate.</p></section>

            <section className="mb-8"><h2>13. Contact</h2><p>Privacy questions, rights requests, data concerns, and watermark or delivery questions may be sent to <strong>privacy@FeroLibrary.ng</strong>. Our listed address is Lagos, Nigeria.</p></section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

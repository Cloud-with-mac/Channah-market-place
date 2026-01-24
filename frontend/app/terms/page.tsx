import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service - Channah-Market',
  description: 'Read the terms and conditions for using Channah-Market.',
}

export default function TermsPage() {
  return (
    <div className="container py-8 md:py-12 max-w-4xl">
      <h1 className="text-4xl font-bold font-display mb-4">Terms of Service</h1>
      <p className="text-muted-foreground mb-8">
        Last updated: January 2024
      </p>

      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Agreement to Terms</h2>
          <p className="text-muted-foreground">
            By accessing or using Channah-Market, you agree to be bound by these Terms
            of Service and all applicable laws and regulations. If you do not agree
            with any of these terms, you are prohibited from using or accessing this
            site. The materials contained in this website are protected by applicable
            copyright and trademark law.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Use License</h2>
          <p className="text-muted-foreground mb-4">
            Permission is granted to temporarily access the materials on Channah-Market
            for personal, non-commercial use only. This is the grant of a license, not
            a transfer of title, and under this license you may not:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1">
            <li>Modify or copy the materials</li>
            <li>Use the materials for any commercial purpose</li>
            <li>Attempt to decompile or reverse engineer any software</li>
            <li>Remove any copyright or proprietary notations</li>
            <li>Transfer the materials to another person</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. Account Registration</h2>
          <p className="text-muted-foreground mb-4">
            To access certain features of our platform, you may be required to register
            for an account. When you register, you agree to:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1">
            <li>Provide accurate and complete information</li>
            <li>Maintain the security of your password</li>
            <li>Accept responsibility for all activities under your account</li>
            <li>Notify us immediately of any unauthorized use</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Purchases and Payments</h2>
          <p className="text-muted-foreground mb-4">
            When making a purchase on Channah-Market:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1">
            <li>You agree to pay all charges at the prices in effect when incurred</li>
            <li>You authorize us to charge your payment method for the total amount</li>
            <li>All prices are displayed in the applicable currency</li>
            <li>We reserve the right to refuse or cancel any order</li>
            <li>Prices and availability are subject to change without notice</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Vendor Terms</h2>
          <p className="text-muted-foreground mb-4">
            If you register as a vendor on Channah-Market, you additionally agree to:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1">
            <li>Provide accurate product information and pricing</li>
            <li>Fulfill orders in a timely manner</li>
            <li>Comply with all applicable laws and regulations</li>
            <li>Not sell prohibited or restricted items</li>
            <li>Pay applicable commission fees on each sale</li>
            <li>Maintain adequate inventory levels</li>
            <li>Handle customer inquiries professionally</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Prohibited Activities</h2>
          <p className="text-muted-foreground mb-4">
            You may not use our platform to:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1">
            <li>Violate any laws or regulations</li>
            <li>Infringe on intellectual property rights</li>
            <li>Transmit malware or viruses</li>
            <li>Engage in fraudulent activities</li>
            <li>Harass or abuse other users</li>
            <li>Manipulate prices or reviews</li>
            <li>Create multiple accounts for fraudulent purposes</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Product Listings</h2>
          <p className="text-muted-foreground">
            While we strive to provide accurate product information, we do not warrant
            that product descriptions, pricing, or other content is accurate, complete,
            or error-free. Products are sold by independent vendors, and Channah-Market
            is not responsible for the quality, safety, or legality of items listed.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. Returns and Refunds</h2>
          <p className="text-muted-foreground">
            Our return and refund policies are detailed in our{' '}
            <Link href="/help#returns" className="text-primary hover:underline">
              Help Center
            </Link>
            . By making a purchase, you agree to these policies. Individual vendors may
            have additional return policies that apply to their products.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">9. Disclaimer</h2>
          <p className="text-muted-foreground">
            The materials on Channah-Market are provided on an &apos;as is&apos; basis.
            Channah-Market makes no warranties, expressed or implied, and hereby disclaims
            and negates all other warranties including, without limitation, implied
            warranties or conditions of merchantability, fitness for a particular
            purpose, or non-infringement of intellectual property.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">10. Limitation of Liability</h2>
          <p className="text-muted-foreground">
            In no event shall Channah-Market or its suppliers be liable for any damages
            (including, without limitation, damages for loss of data or profit, or due
            to business interruption) arising out of the use or inability to use the
            materials on Channah-Market, even if Channah-Market has been notified of
            the possibility of such damage.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">11. Governing Law</h2>
          <p className="text-muted-foreground">
            These terms and conditions are governed by and construed in accordance with
            the laws of Nigeria and you irrevocably submit to the exclusive jurisdiction
            of the courts in that location.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">12. Changes to Terms</h2>
          <p className="text-muted-foreground">
            We reserve the right to modify these terms at any time. We will notify users
            of any material changes by posting the new Terms of Service on this page.
            Your continued use of the platform after changes constitutes acceptance of
            the new terms.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">13. Contact Information</h2>
          <p className="text-muted-foreground">
            If you have any questions about these Terms of Service, please contact us:
          </p>
          <ul className="list-none text-muted-foreground mt-4 space-y-1">
            <li>Email: legal@channah-market.com</li>
            <li>Address: 123 Market Street, Lagos, Nigeria</li>
          </ul>
          <p className="mt-4">
            <Link href="/contact" className="text-primary hover:underline">
              Contact Us
            </Link>
          </p>
        </section>
      </div>
    </div>
  )
}

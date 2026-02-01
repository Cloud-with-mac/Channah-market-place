'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto py-12 px-4">
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/login">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Login
          </Link>
        </Button>

        <h1 className="text-3xl font-bold mb-8">Vendor Terms of Service</h1>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
          <p className="text-muted-foreground">Last updated: January 2026</p>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground">
              By registering as a vendor on the Channah Marketplace platform, you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not use the vendor platform.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">2. Vendor Account</h2>
            <p className="text-muted-foreground">
              You must provide accurate and complete information when creating your vendor account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">3. Product Listings</h2>
            <p className="text-muted-foreground">
              Vendors are responsible for ensuring that all product listings are accurate, complete, and comply with applicable laws and regulations. Products must not infringe on any intellectual property rights or violate any laws.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">4. Pricing and Payments</h2>
            <p className="text-muted-foreground">
              Vendors set their own product prices. The platform charges a commission on each sale as outlined in the vendor agreement. Payouts are processed according to the platform&apos;s payout schedule.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">5. Order Fulfillment</h2>
            <p className="text-muted-foreground">
              Vendors are responsible for fulfilling orders in a timely manner, providing accurate shipping information, and maintaining product quality standards. Failure to fulfill orders may result in account suspension.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">6. Returns and Refunds</h2>
            <p className="text-muted-foreground">
              Vendors must comply with the platform&apos;s return and refund policies. Customers may request returns within the specified return window, and vendors must process refunds promptly.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">7. Prohibited Activities</h2>
            <p className="text-muted-foreground">
              Vendors may not engage in fraudulent activities, sell counterfeit goods, manipulate reviews, or circumvent platform fees. Violation of these rules may result in immediate account termination.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">8. Termination</h2>
            <p className="text-muted-foreground">
              Either party may terminate the vendor agreement at any time. Upon termination, vendors must fulfill all pending orders and the platform will process any remaining payouts according to the standard schedule.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">9. Contact</h2>
            <p className="text-muted-foreground">
              For questions about these terms, please contact our vendor support team at vendor-support@channah.com.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}

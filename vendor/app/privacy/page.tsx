'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto py-12 px-4">
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/login">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Login
          </Link>
        </Button>

        <h1 className="text-3xl font-bold mb-8">Vendor Privacy Policy</h1>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
          <p className="text-muted-foreground">Last updated: January 2026</p>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">1. Information We Collect</h2>
            <p className="text-muted-foreground">
              We collect information you provide when registering as a vendor, including your business name, contact details, bank information for payouts, and tax identification numbers as required by law.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">2. How We Use Your Information</h2>
            <p className="text-muted-foreground">
              Your information is used to operate your vendor account, process payouts, communicate about orders and platform updates, verify your identity, and comply with legal obligations.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">3. Information Sharing</h2>
            <p className="text-muted-foreground">
              We share your business name and store information with customers. We may share your information with payment processors to facilitate payouts, and with legal authorities when required by law.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">4. Data Security</h2>
            <p className="text-muted-foreground">
              We implement industry-standard security measures to protect your data, including encryption, secure servers, and access controls. However, no method of transmission over the internet is 100% secure.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">5. Data Retention</h2>
            <p className="text-muted-foreground">
              We retain your vendor data for as long as your account is active and for a reasonable period thereafter to comply with legal obligations, resolve disputes, and enforce agreements.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">6. Your Rights</h2>
            <p className="text-muted-foreground">
              You have the right to access, update, or delete your personal information. You may request a copy of your data or ask us to remove it by contacting our support team.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">7. Cookies and Analytics</h2>
            <p className="text-muted-foreground">
              We use cookies and analytics tools to improve the vendor dashboard experience. You can manage cookie preferences through your browser settings.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">8. Contact</h2>
            <p className="text-muted-foreground">
              For privacy-related questions or requests, contact our data protection team at privacy@channah.com.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}

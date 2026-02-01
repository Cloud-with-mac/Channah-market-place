import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy - Vendora-Market',
  description: 'Learn how Vendora-Market collects, uses, and protects your personal information.',
}

export default function PrivacyPage() {
  return (
    <div className="container py-8 md:py-12 max-w-4xl">
      <h1 className="text-4xl font-bold font-display mb-4">Privacy Policy</h1>
      <p className="text-muted-foreground mb-8">
        Last updated: January 2024
      </p>

      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
          <p className="text-muted-foreground mb-4">
            Welcome to Vendora-Market. We are committed to protecting your personal
            information and your right to privacy. This Privacy Policy explains how
            we collect, use, disclose, and safeguard your information when you visit
            our website and use our services.
          </p>
          <p className="text-muted-foreground">
            Please read this privacy policy carefully. If you do not agree with the
            terms of this privacy policy, please do not access the site.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
          <h3 className="text-lg font-medium mb-2">Personal Information</h3>
          <p className="text-muted-foreground mb-4">
            We collect personal information that you voluntarily provide when you:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
            <li>Register for an account</li>
            <li>Make a purchase</li>
            <li>Subscribe to our newsletter</li>
            <li>Contact us for support</li>
            <li>Participate in promotions or surveys</li>
          </ul>
          <p className="text-muted-foreground mb-4">
            This information may include your name, email address, phone number,
            shipping address, billing information, and payment details.
          </p>

          <h3 className="text-lg font-medium mb-2">Automatically Collected Information</h3>
          <p className="text-muted-foreground">
            When you visit our website, we automatically collect certain information
            including your IP address, browser type, device information, pages visited,
            and the time spent on those pages.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
          <p className="text-muted-foreground mb-4">
            We use the information we collect to:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1">
            <li>Process and fulfill your orders</li>
            <li>Manage your account and provide customer support</li>
            <li>Send you order updates and promotional communications</li>
            <li>Improve our website and services</li>
            <li>Prevent fraudulent transactions and protect against illegal activity</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Information Sharing</h2>
          <p className="text-muted-foreground mb-4">
            We may share your information with:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1">
            <li>Vendors to fulfill your orders</li>
            <li>Payment processors to process transactions</li>
            <li>Shipping carriers to deliver your orders</li>
            <li>Service providers who assist in our operations</li>
            <li>Law enforcement when required by law</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Data Security</h2>
          <p className="text-muted-foreground">
            We implement appropriate technical and organizational security measures
            to protect your personal information. However, no electronic transmission
            over the Internet or information storage technology can be guaranteed to
            be 100% secure.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Cookies and Tracking</h2>
          <p className="text-muted-foreground">
            We use cookies and similar tracking technologies to track activity on
            our website and store certain information. You can instruct your browser
            to refuse all cookies or to indicate when a cookie is being sent.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Your Rights</h2>
          <p className="text-muted-foreground mb-4">
            Depending on your location, you may have certain rights regarding your
            personal information, including:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1">
            <li>The right to access your personal data</li>
            <li>The right to correct inaccurate data</li>
            <li>The right to request deletion of your data</li>
            <li>The right to opt-out of marketing communications</li>
            <li>The right to data portability</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. Children&apos;s Privacy</h2>
          <p className="text-muted-foreground">
            Our services are not intended for individuals under the age of 18. We do
            not knowingly collect personal information from children.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">9. Changes to This Policy</h2>
          <p className="text-muted-foreground">
            We may update this privacy policy from time to time. We will notify you
            of any changes by posting the new privacy policy on this page and updating
            the &quot;Last updated&quot; date.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">10. Contact Us</h2>
          <p className="text-muted-foreground">
            If you have any questions about this Privacy Policy, please contact us at:
          </p>
          <ul className="list-none text-muted-foreground mt-4 space-y-1">
            <li>Email: privacy@channah-market.com</li>
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

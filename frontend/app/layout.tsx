import type { Metadata, Viewport } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Toaster } from '@/components/ui/toaster'
import { CartDrawer } from '@/components/cart/cart-drawer'
import { AIChatWidget } from '@/components/ai'
import { OrganizationJsonLd, WebsiteJsonLd } from '@/components/seo/json-ld'
import { ComparisonBar } from '@/components/comparison/comparison-bar'
import { SampleCartDrawer } from '@/components/samples/sample-cart-drawer'
import { ToastListener } from '@/components/toast-listener'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://channah.com'),
  title: {
    default: 'Channah | Your Premium African Marketplace',
    template: '%s | Channah',
  },
  description: 'Discover quality products from trusted African vendors. Shop electronics, fashion, home goods, beauty, and more at competitive prices with secure payments and fast delivery.',
  keywords: ['african marketplace', 'online shopping', 'e-commerce', 'buy online', 'vendors', 'nigeria', 'africa', 'channah', 'B2B marketplace', 'wholesale', 'trade assurance'],
  authors: [{ name: 'Channah' }],
  creator: 'Channah',
  publisher: 'Channah',
  formatDetection: { email: false, address: false, telephone: false },
  openGraph: {
    title: 'Channah | Your Premium African Marketplace',
    description: 'Discover quality products from trusted African vendors. Shop with confidence.',
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'Channah',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Channah - Your Premium African Marketplace' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Channah | Your Premium African Marketplace',
    description: 'Discover quality products from trusted African vendors.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  alternates: { canonical: '/' },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${playfair.variable} font-sans antialiased`}>
        <Providers>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <Toaster />
          <ToastListener />
          <CartDrawer />
          <SampleCartDrawer />
          <AIChatWidget />
          <ComparisonBar />
        </Providers>
        <OrganizationJsonLd />
        <WebsiteJsonLd />
      </body>
    </html>
  )
}

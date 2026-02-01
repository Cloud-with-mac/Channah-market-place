import type { Metadata, Viewport } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Toaster } from '@/components/ui/toaster'
import { CartDrawer } from '@/components/cart/cart-drawer'
import { AIChatWidget } from '@/components/ai'
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
  title: {
    default: 'Vendora-Market | Your Premium African Marketplace',
    template: '%s | Vendora-Market',
  },
  description: 'Discover quality products from trusted African vendors. Shop electronics, fashion, home goods, beauty, and more at competitive prices with secure payments and fast delivery.',
  keywords: ['african marketplace', 'online shopping', 'e-commerce', 'buy online', 'vendors', 'nigeria', 'africa', 'channah'],
  authors: [{ name: 'Vendora-Market' }],
  creator: 'Vendora-Market',
  openGraph: {
    title: 'Vendora-Market | Your Premium African Marketplace',
    description: 'Discover quality products from trusted African vendors. Shop with confidence.',
    type: 'website',
    locale: 'en_US',
    siteName: 'Vendora-Market',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vendora-Market | Your Premium African Marketplace',
    description: 'Discover quality products from trusted African vendors.',
  },
  robots: {
    index: true,
    follow: true,
  },
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
      </body>
    </html>
  )
}

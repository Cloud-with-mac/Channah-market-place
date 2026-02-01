import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-muted/30">
      {/* Minimal Header */}
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
              <span className="text-lg font-display">C</span>
              <div className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-gold border-2 border-background" />
            </div>
            <span className="text-lg font-bold font-display">Vendora-Market</span>
          </Link>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-green-600" />
            <span>Secure Checkout</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>

      {/* Minimal Footer */}
      <footer className="border-t bg-background py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Vendora-Market. All rights reserved.</p>
            <div className="flex gap-4">
              <Link href="/privacy" className="hover:text-foreground">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-foreground">
                Terms of Service
              </Link>
              <Link href="/help" className="hover:text-foreground">
                Help
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

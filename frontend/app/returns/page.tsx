import { RotateCcw, Package, Clock, CreditCard, CheckCircle2, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

export default function ReturnsPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-navy-dark via-navy to-cyan-dark/30 text-white py-16">
        <div className="container text-center">
          <Badge className="bg-cyan/20 text-cyan border border-cyan/30 mb-4">
            <RotateCcw className="h-3 w-3 mr-1" />
            Easy Returns
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold font-display mb-4">Returns & Refunds</h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            Not satisfied? We make returns easy. 30-day hassle-free return policy.
          </p>
        </div>
      </section>

      {/* Return Policy */}
      <section className="py-16">
        <div className="container max-w-4xl">
          {/* 30-Day Return Window */}
          <div className="bg-cyan/10 border border-cyan/30 rounded-xl p-8 mb-12">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-full bg-cyan/20">
                <Clock className="h-6 w-6 text-cyan" />
              </div>
              <h2 className="text-2xl font-bold">30-Day Return Window</h2>
            </div>
            <p className="text-muted-foreground">
              You have 30 days from the delivery date to return most items for a full refund.
              Items must be unused, in original packaging, and with all tags attached.
            </p>
          </div>

          {/* How to Return */}
          <h2 className="text-2xl font-bold font-display mb-8">How to Return an Item</h2>
          <div className="grid md:grid-cols-4 gap-6 mb-12">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-cyan text-navy font-bold flex items-center justify-center mx-auto mb-4">1</div>
              <h3 className="font-semibold mb-2">Start Return</h3>
              <p className="text-sm text-muted-foreground">Go to your orders and select the item to return</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-cyan text-navy font-bold flex items-center justify-center mx-auto mb-4">2</div>
              <h3 className="font-semibold mb-2">Print Label</h3>
              <p className="text-sm text-muted-foreground">Download and print your prepaid return label</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-cyan text-navy font-bold flex items-center justify-center mx-auto mb-4">3</div>
              <h3 className="font-semibold mb-2">Pack & Ship</h3>
              <p className="text-sm text-muted-foreground">Pack the item securely and drop off at any courier</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-cyan text-navy font-bold flex items-center justify-center mx-auto mb-4">4</div>
              <h3 className="font-semibold mb-2">Get Refund</h3>
              <p className="text-sm text-muted-foreground">Refund processed within 5-7 business days</p>
            </div>
          </div>

          {/* Refund Methods */}
          <div className="bg-card border border-border rounded-xl p-8 mb-12">
            <h2 className="text-2xl font-bold font-display mb-6 flex items-center gap-2">
              <CreditCard className="h-6 w-6 text-cyan" />
              Refund Methods
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-cyan mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold">Original Payment Method</h3>
                  <p className="text-sm text-muted-foreground">Refunds are processed to your original payment method within 5-7 business days.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-cyan mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold">Store Credit</h3>
                  <p className="text-sm text-muted-foreground">Opt for store credit and get your refund instantly to use on your next purchase.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Non-Returnable Items */}
          <div className="bg-card border border-border rounded-xl p-8">
            <h2 className="text-2xl font-bold font-display mb-6 flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-destructive" />
              Non-Returnable Items
            </h2>
            <p className="text-muted-foreground mb-4">The following items cannot be returned:</p>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Personalized or customized items</li>
              <li>• Intimate apparel and swimwear (for hygiene reasons)</li>
              <li>• Digital products and software</li>
              <li>• Perishable goods</li>
              <li>• Items marked as "Final Sale"</li>
            </ul>
          </div>

          {/* Contact Support */}
          <div className="mt-12 text-center">
            <p className="text-muted-foreground mb-4">
              Need help with a return? Our support team is here to help.
            </p>
            <Link
              href="/contact"
              className="text-cyan hover:text-cyan-light font-medium transition-colors"
            >
              Contact Support →
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

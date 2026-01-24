import { Truck, Globe, Clock, Package, MapPin, Shield } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const shippingMethods = [
  {
    name: 'Standard Shipping',
    time: '5-7 business days',
    price: '£4.99',
    description: 'Reliable delivery for non-urgent orders',
  },
  {
    name: 'Express Shipping',
    time: '2-3 business days',
    price: '£9.99',
    description: 'Faster delivery when you need it',
  },
  {
    name: 'Next Day Delivery',
    time: '1 business day',
    price: '£14.99',
    description: 'Order before 2pm for next day delivery',
  },
  {
    name: 'International Standard',
    time: '7-14 business days',
    price: 'From £12.99',
    description: 'Worldwide delivery to 190+ countries',
  },
]

export default function ShippingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-navy-dark via-navy to-cyan-dark/30 text-white py-16">
        <div className="container text-center">
          <Badge className="bg-cyan/20 text-cyan border border-cyan/30 mb-4">
            <Truck className="h-3 w-3 mr-1" />
            Delivery
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold font-display mb-4">Shipping Information</h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            We deliver worldwide. Find out about our shipping options and delivery times.
          </p>
        </div>
      </section>

      {/* Shipping Methods */}
      <section className="py-16">
        <div className="container max-w-4xl">
          <h2 className="text-2xl font-bold font-display mb-8">Shipping Methods</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {shippingMethods.map((method) => (
              <div key={method.name} className="bg-card border border-border rounded-xl p-6 hover:border-cyan/50 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg">{method.name}</h3>
                    <p className="text-sm text-muted-foreground">{method.description}</p>
                  </div>
                  <span className="text-cyan font-bold">{method.price}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {method.time}
                </div>
              </div>
            ))}
          </div>

          {/* Free Shipping Banner */}
          <div className="mt-8 p-6 bg-cyan/10 border border-cyan/30 rounded-xl">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan/20">
                <Package className="h-6 w-6 text-cyan" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Free Shipping on Orders Over £50</h3>
                <p className="text-sm text-muted-foreground">Applies to standard UK delivery</p>
              </div>
            </div>
          </div>

          {/* International Shipping */}
          <div className="mt-16">
            <h2 className="text-2xl font-bold font-display mb-8 flex items-center gap-2">
              <Globe className="h-6 w-6 text-cyan" />
              International Shipping
            </h2>
            <div className="bg-card border border-border rounded-xl p-6">
              <p className="text-muted-foreground mb-6">
                We ship to over 190 countries worldwide. International shipping rates and delivery times vary by destination.
              </p>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Europe</h4>
                  <p className="text-sm text-muted-foreground">5-10 business days</p>
                  <p className="text-sm text-cyan">From £12.99</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">USA & Canada</h4>
                  <p className="text-sm text-muted-foreground">7-14 business days</p>
                  <p className="text-sm text-cyan">From £14.99</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Rest of World</h4>
                  <p className="text-sm text-muted-foreground">10-21 business days</p>
                  <p className="text-sm text-cyan">From £19.99</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tracking */}
          <div className="mt-16">
            <h2 className="text-2xl font-bold font-display mb-8 flex items-center gap-2">
              <MapPin className="h-6 w-6 text-cyan" />
              Order Tracking
            </h2>
            <div className="bg-card border border-border rounded-xl p-6">
              <p className="text-muted-foreground">
                All orders come with tracking. Once your order ships, you'll receive an email with your tracking number.
                You can also track your order anytime from your account dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

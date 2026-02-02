import { Metadata } from 'next'
import Link from 'next/link'
import {
  ShieldCheck,
  Truck,
  CreditCard,
  Headphones,
  Users,
  Globe,
  Award,
  Heart,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about Channah, your trusted African marketplace. Discover our story, values, and commitment to connecting buyers with quality vendors worldwide.',
  openGraph: {
    title: 'About Us | Channah',
    description: 'Learn about Channah, your trusted African marketplace.',
  },
  alternates: { canonical: '/about' },
}

const values = [
  {
    icon: ShieldCheck,
    title: 'Trust & Safety',
    description: 'We verify all sellers and protect every transaction to ensure a safe shopping experience.',
  },
  {
    icon: Users,
    title: 'Community First',
    description: 'We empower local businesses and connect them with customers worldwide.',
  },
  {
    icon: Award,
    title: 'Quality Products',
    description: 'We maintain high standards for all products listed on our marketplace.',
  },
  {
    icon: Heart,
    title: 'Customer Satisfaction',
    description: 'Your happiness is our priority. We strive to exceed expectations every time.',
  },
]


const features = [
  {
    icon: Truck,
    title: 'Fast Delivery',
    description: 'Quick and reliable shipping across the country',
  },
  {
    icon: CreditCard,
    title: 'Secure Payments',
    description: 'Multiple payment options with encryption',
  },
  {
    icon: Headphones,
    title: '24/7 Support',
    description: 'Always here to help with any questions',
  },
  {
    icon: Globe,
    title: 'Wide Selection',
    description: 'Products from vendors across the globe',
  },
]

export default function AboutPage() {
  return (
    <div className="container py-8 md:py-12">
      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h1 className="text-4xl md:text-5xl font-bold font-display mb-4">
          About Channah
        </h1>
        <p className="text-lg text-muted-foreground">
          We&apos;re building the future of online shopping by connecting buyers with
          trusted sellers from around the world. Our mission is to make quality
          products accessible to everyone.
        </p>
      </div>

      {/* Our Story */}
      <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
        <div>
          <h2 className="text-3xl font-bold font-display mb-4">Our Story</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>
              Channah was founded with a simple vision: to create a marketplace
              where quality meets affordability, and where both buyers and sellers
              can thrive together.
            </p>
            <p>
              Starting from humble beginnings, we&apos;ve grown into a trusted platform
              serving thousands of customers daily. Our commitment to excellence
              and customer satisfaction has been the cornerstone of our success.
            </p>
            <p>
              Today, we continue to innovate and improve, leveraging the latest
              technologies including AI to provide personalized shopping experiences
              and help vendors succeed in the digital marketplace.
            </p>
          </div>
        </div>
        <div className="relative aspect-video bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                <Globe className="h-10 w-10 text-primary" />
              </div>
              <p className="text-lg font-semibold">The Trusted Center for Everything</p>
              <p className="text-sm text-muted-foreground">Connecting the world</p>
            </div>
          </div>
        </div>
      </div>

      {/* Our Values */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold font-display text-center mb-8">
          Our Values
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((value) => (
            <Card key={value.title}>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <value.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{value.title}</h3>
                <p className="text-sm text-muted-foreground">{value.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Why Choose Us */}
      <div className="bg-muted/50 rounded-2xl p-8 md:p-12 mb-16">
        <h2 className="text-3xl font-bold font-display text-center mb-8">
          Why Choose Us
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => (
            <div key={feature.title} className="text-center">
              <div className="w-14 h-14 rounded-full bg-background flex items-center justify-center mx-auto mb-4 shadow-sm">
                <feature.icon className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Ready to Start Shopping?</h2>
        <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
          Join thousands of happy customers and discover amazing products from
          trusted vendors around the world.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" asChild>
            <Link href="/products">Browse Products</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/sell">Become a Seller</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

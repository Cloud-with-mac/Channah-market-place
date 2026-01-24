'use client'

import Link from 'next/link'
import { Store, Package, TrendingUp, Globe, Shield, Headphones, ArrowRight, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const benefits = [
  {
    icon: Globe,
    title: 'Global Reach',
    description: 'Access millions of customers worldwide through our marketplace platform.',
  },
  {
    icon: Package,
    title: 'Easy Management',
    description: 'Powerful tools to manage products, orders, and inventory all in one place.',
  },
  {
    icon: TrendingUp,
    title: 'Growth Analytics',
    description: 'Detailed insights and reports to help grow your business.',
  },
  {
    icon: Shield,
    title: 'Secure Payments',
    description: 'Safe and reliable payment processing with multiple options.',
  },
  {
    icon: Headphones,
    title: '24/7 Support',
    description: 'Dedicated seller support team to help you succeed.',
  },
  {
    icon: Store,
    title: 'Your Own Storefront',
    description: 'Customizable store page to showcase your brand.',
  },
]

const steps = [
  {
    step: 1,
    title: 'Create an Account',
    description: 'Sign up and verify your email to get started.',
  },
  {
    step: 2,
    title: 'Register as a Vendor',
    description: 'Provide your business details and documentation.',
  },
  {
    step: 3,
    title: 'Get Approved',
    description: 'Our team will review your application within 2-3 business days.',
  },
  {
    step: 4,
    title: 'Start Selling',
    description: 'List your products and reach customers worldwide.',
  },
]

export default function SellOnChannahPage() {
  const vendorPortalUrl = process.env.NEXT_PUBLIC_VENDOR_URL || 'http://localhost:5000'

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-cyan/5 to-background py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 text-sm font-medium text-primary">
              <Store className="h-4 w-4" />
              Join 10,000+ Sellers
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-display">
              Sell on <span className="text-gradient-premium">Channah</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Join our global marketplace and reach millions of customers worldwide.
              Start your e-commerce journey today with powerful tools and dedicated support.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button size="lg" asChild>
                <a href={`${vendorPortalUrl}/register`}>
                  Start Selling Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href={vendorPortalUrl}>
                  Sign In to Vendor Portal
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold font-display mb-4">Why Sell on Channah?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to succeed in e-commerce, all in one platform.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit) => (
              <Card key={benefit.title} className="border-border/50 hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <benefit.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{benefit.title}</CardTitle>
                  <CardDescription>{benefit.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold font-display mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Getting started is easy. Follow these simple steps to begin selling.
            </p>
          </div>
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              {steps.map((item) => (
                <div key={item.step} className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                      {item.step}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
                    <p className="text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <Card className="border-2 border-primary/50">
              <CardHeader className="text-center">
                <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-3 py-1 text-sm font-medium text-primary mb-4 mx-auto">
                  Most Popular
                </div>
                <CardTitle className="text-2xl">Standard Seller Plan</CardTitle>
                <CardDescription>Perfect for most sellers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <span className="text-4xl font-bold">10%</span>
                  <span className="text-muted-foreground ml-2">commission per sale</span>
                </div>
                <ul className="space-y-3">
                  {[
                    'Unlimited product listings',
                    'Access to all marketplace features',
                    'Dedicated seller dashboard',
                    'Real-time analytics & reports',
                    'Secure payment processing',
                    '24/7 seller support',
                    'Marketing tools & promotions',
                  ].map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button size="lg" className="w-full" asChild>
                  <a href={`${vendorPortalUrl}/register`}>
                    Start Selling Now
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary to-cyan">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center text-white space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold font-display">
              Ready to Grow Your Business?
            </h2>
            <p className="text-white/80 text-lg">
              Join thousands of successful sellers on Channah and start reaching customers worldwide today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button size="lg" variant="secondary" asChild>
                <a href={`${vendorPortalUrl}/register`}>
                  Create Seller Account
                  <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
              <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white/10" asChild>
                <Link href="/help/seller-guide">
                  Learn More
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

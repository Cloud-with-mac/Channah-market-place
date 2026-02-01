'use client'

import * as React from 'react'
import Link from 'next/link'
import { Store, Package, TrendingUp, Globe, Shield, Headphones, ArrowRight, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

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

interface SellerPlan {
  id: string
  name: string
  description: string
  commission_rate: number
  features: string[]
  is_popular: boolean
}

const fallbackPlans: SellerPlan[] = [
  {
    id: 'basic',
    name: 'Basic Seller Plan',
    description: 'Great for getting started',
    commission_rate: 15,
    features: [
      'Up to 50 product listings',
      'Basic seller dashboard',
      'Standard analytics & reports',
      'Secure payment processing',
      'Email support (48h response)',
      'Basic order management',
      'Standard product visibility',
    ],
    is_popular: false,
  },
  {
    id: 'standard',
    name: 'Standard Seller Plan',
    description: 'Perfect for growing sellers',
    commission_rate: 10,
    features: [
      'Unlimited product listings',
      'Access to all marketplace features',
      'Advanced seller dashboard',
      'Real-time analytics & reports',
      'Secure payment processing',
      '24/7 seller support',
      'Marketing tools & promotions',
      'Bulk product upload',
      'Coupon & discount management',
    ],
    is_popular: true,
  },
  {
    id: 'pro',
    name: 'Pro Seller Plan',
    description: 'For high-volume sellers',
    commission_rate: 7,
    features: [
      'Unlimited product listings',
      'Access to all marketplace features',
      'Premium seller dashboard',
      'Advanced analytics & custom reports',
      'Secure payment processing',
      'Priority 24/7 seller support',
      'Marketing tools & promotions',
      'Featured product placements',
      'Dedicated account manager',
      'Bulk product upload',
      'Coupon & discount management',
      'Early access to new features',
    ],
    is_popular: false,
  },
]

export default function SellOnVendoraPage() {
  const vendorPortalUrl = process.env.NEXT_PUBLIC_VENDOR_URL || 'http://localhost:5000'
  const [plans, setPlans] = React.useState<SellerPlan[]>(fallbackPlans)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchPlans = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
        const res = await fetch(`${apiUrl}/vendors/seller-plans`)
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data) && data.length > 0) {
            setPlans(data)
          }
        }
      } catch {
        // Use fallback plans
      } finally {
        setIsLoading(false)
      }
    }
    fetchPlans()
  }, [])

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
              Sell on <span className="text-gradient-premium">Vendora</span>
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
            <h2 className="text-3xl font-bold font-display mb-4">Why Sell on Vendora?</h2>
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

      {/* Pricing Section - Sliding Plans */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold font-display mb-4">Choose Your Plan</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Select the plan that best fits your business needs.
            </p>
          </div>

          {isLoading ? (
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-96 w-full rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {plans.map((plan) => (
                <Card
                  key={plan.id}
                  className={cn(
                    'border-2 relative flex flex-col',
                    plan.is_popular ? 'border-primary/50 shadow-lg' : 'border-border'
                  )}
                >
                  <CardHeader className="text-center">
                    {plan.is_popular && (
                      <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-3 py-1 text-sm font-medium text-primary mb-4 mx-auto">
                        Most Popular
                      </div>
                    )}
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col flex-1 space-y-6">
                    <div className="text-center">
                      <span className="text-4xl font-bold">{plan.commission_rate}%</span>
                      <span className="text-muted-foreground ml-2 text-sm">commission per sale</span>
                    </div>
                    <ul className="space-y-3 flex-1">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button size="lg" className="w-full" variant={plan.is_popular ? 'default' : 'outline'} asChild>
                      <a href={`${vendorPortalUrl}/register`}>
                        Start Selling Now
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
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
              Join thousands of successful sellers on Vendora and start reaching customers worldwide today.
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

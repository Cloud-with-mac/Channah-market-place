'use client'

import Link from 'next/link'
import {
  Store,
  UserPlus,
  Package,
  DollarSign,
  BarChart3,
  Truck,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  FileText,
  CreditCard,
  Settings,
  TrendingUp,
  Users,
  Globe,
  Headphones
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

export default function SellerGuidePage() {
  const steps = [
    {
      number: 1,
      title: 'Create Your Account',
      description: 'Sign up with your email, phone number, and create a secure password.',
      icon: UserPlus,
    },
    {
      number: 2,
      title: 'Set Up Your Store',
      description: 'Choose your store name, add a description, and select your business category.',
      icon: Store,
    },
    {
      number: 3,
      title: 'Add Business Details',
      description: 'Provide your business address, tax information, and bank details for payouts.',
      icon: FileText,
    },
    {
      number: 4,
      title: 'List Your Products',
      description: 'Add products with photos, descriptions, pricing, and inventory levels.',
      icon: Package,
    },
    {
      number: 5,
      title: 'Start Selling',
      description: 'Receive orders, manage fulfillment, and grow your business!',
      icon: TrendingUp,
    },
  ]

  const benefits = [
    {
      icon: Globe,
      title: 'Global Reach',
      description: 'Access millions of customers worldwide through our marketplace.',
    },
    {
      icon: DollarSign,
      title: 'Competitive Fees',
      description: 'Low commission rates that let you keep more of your earnings.',
    },
    {
      icon: BarChart3,
      title: 'Analytics Dashboard',
      description: 'Track sales, traffic, and performance with real-time insights.',
    },
    {
      icon: Truck,
      title: 'Easy Fulfillment',
      description: 'Streamlined shipping and order management tools.',
    },
    {
      icon: ShieldCheck,
      title: 'Secure Payments',
      description: 'Fast, secure payouts directly to your bank account.',
    },
    {
      icon: Headphones,
      title: '24/7 Support',
      description: 'Dedicated seller support team to help you succeed.',
    },
  ]

  const faqs = [
    {
      question: 'How do I sign up as a seller?',
      answer: 'Visit the seller registration page at /seller/register. You\'ll need to complete a 3-step process: 1) Create your account with personal details, 2) Set up your store information, and 3) Add your business details including address and bank information.',
    },
    {
      question: 'What documents do I need to register?',
      answer: 'You\'ll need a valid email address, phone number, and business address. For business accounts, you may need to provide a tax identification number (optional). Bank account details are required for receiving payouts.',
    },
    {
      question: 'How long does verification take?',
      answer: 'Most seller accounts are verified within 24-48 hours. You\'ll receive an email notification once your account is approved and ready to start selling.',
    },
    {
      question: 'What are the fees for selling?',
      answer: 'We charge a competitive commission rate on each sale. The exact rate depends on your product category, typically ranging from 5-15%. There are no monthly subscription fees or listing fees.',
    },
    {
      question: 'How do I get paid?',
      answer: 'Earnings are deposited directly to your bank account. You can view your balance and request payouts from the vendor dashboard. Payouts are processed within 3-5 business days.',
    },
    {
      question: 'Can I sell internationally?',
      answer: 'Yes! Channah supports international selling. You can set shipping rates for different regions and reach customers around the world.',
    },
    {
      question: 'What products can I sell?',
      answer: 'You can sell most physical products across categories like Fashion, Electronics, Home & Garden, Beauty, and more. Prohibited items include illegal goods, counterfeit products, and items that violate our terms of service.',
    },
    {
      question: 'How do I manage my inventory?',
      answer: 'Our vendor dashboard provides tools to track inventory levels, set low-stock alerts, and manage product variants. You can update quantities in real-time.',
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-4 bg-white/20 text-white border-white/30 px-4 py-1">
              <Store className="h-3 w-3 mr-1.5" />
              Seller Guide
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Start Selling on Channah
            </h1>
            <p className="text-xl text-emerald-100 mb-8">
              Join thousands of successful sellers and grow your business with our powerful e-commerce platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-white text-emerald-700 hover:bg-emerald-50"
                asChild
              >
                <Link href="/seller/login">
                  Start Selling Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10"
                asChild
              >
                <Link href="/seller/login">
                  Seller Login
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* How to Get Started */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">How to Get Started</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Follow these simple steps to set up your seller account and start reaching customers.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="relative">
            {/* Connecting line */}
            <div className="absolute left-8 top-12 bottom-12 w-0.5 bg-emerald-200 dark:bg-emerald-800 hidden md:block" />

            <div className="space-y-8">
              {steps.map((step, index) => (
                <div key={index} className="flex gap-6 items-start">
                  <div className="relative z-10 flex-shrink-0 w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center border-4 border-background">
                    <step.icon className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex-1 bg-card rounded-xl p-6 border shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant="outline" className="text-emerald-600 border-emerald-300">
                        Step {step.number}
                      </Badge>
                      <h3 className="font-semibold text-lg">{step.title}</h3>
                    </div>
                    <p className="text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700" asChild>
            <Link href="/seller/login">
              Access Seller Portal
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Benefits */}
      <div className="bg-muted/50 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Sell on Channah?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Join a thriving marketplace with tools and support designed to help your business succeed.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {benefits.map((benefit, index) => (
              <Card key={index} className="border-0 shadow-sm">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center mb-2">
                    <benefit.icon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <CardTitle className="text-lg">{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{benefit.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Registration Requirements */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">What You'll Need</h2>
            <p className="text-muted-foreground">
              Prepare these items before starting your seller registration.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-emerald-600" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Full name</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Email address</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Phone number</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Secure password</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5 text-emerald-600" />
                  Store Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Store name</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Store description</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Business type (Individual/Business)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Product category</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-600" />
                  Business Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Business address</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>City and country</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Postal code</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Tax ID (optional)</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-emerald-600" />
                  Payment Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Bank account details</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Account holder name</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Can be added later from dashboard</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-muted/50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <HelpCircle className="h-12 w-12 mx-auto text-emerald-600 mb-4" />
              <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
              <p className="text-muted-foreground">
                Find answers to common questions about selling on Channah.
              </p>
            </div>

            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-8 md:p-12 text-white">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-90" />
            <h2 className="text-3xl font-bold mb-4">Ready to Start Selling?</h2>
            <p className="text-emerald-100 mb-8 max-w-xl mx-auto">
              Join thousands of successful sellers on Channah. Create your account today and start reaching customers worldwide.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-white text-emerald-700 hover:bg-emerald-50"
                asChild
              >
                <Link href="/seller/login">
                  Access Seller Portal
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10"
                asChild
              >
                <Link href="/contact">
                  Contact Sales Team
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Back to Help */}
      <div className="container mx-auto px-4 pb-16">
        <div className="text-center">
          <Link
            href="/help"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to Help Center
          </Link>
        </div>
      </div>
    </div>
  )
}

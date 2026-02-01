'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  Search,
  ShoppingCart,
  Truck,
  CreditCard,
  RefreshCcw,
  User,
  Store,
  HelpCircle,
  ChevronDown,
  MessageSquare,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const categories = [
  {
    icon: ShoppingCart,
    title: 'Orders & Purchases',
    description: 'Track orders, view history, and more',
    href: '#orders',
  },
  {
    icon: Truck,
    title: 'Shipping & Delivery',
    description: 'Delivery times, tracking, and locations',
    href: '#shipping',
  },
  {
    icon: CreditCard,
    title: 'Payments & Pricing',
    description: 'Payment methods, refunds, and pricing',
    href: '#payments',
  },
  {
    icon: RefreshCcw,
    title: 'Returns & Refunds',
    description: 'Return policy and refund process',
    href: '#returns',
  },
  {
    icon: User,
    title: 'Account & Security',
    description: 'Account settings and security',
    href: '#account',
  },
  {
    icon: Store,
    title: 'Selling on Vendora',
    description: 'Become a vendor and start selling',
    href: '#selling',
  },
]

const faqSections = [
  {
    id: 'orders',
    title: 'Orders & Purchases',
    faqs: [
      {
        question: 'How do I track my order?',
        answer: 'You can track your order by going to "My Orders" in your account dashboard, or by using our order tracking page with your order number. You\'ll receive email updates as your order progresses.',
      },
      {
        question: 'Can I modify or cancel my order?',
        answer: 'You can modify or cancel your order within 1 hour of placing it, as long as it hasn\'t been shipped. Go to "My Orders" and click on the order you want to modify.',
      },
      {
        question: 'Why was my order cancelled?',
        answer: 'Orders may be cancelled if the payment fails, the item is out of stock, or there\'s a pricing error. You\'ll receive an email explaining the reason and any refund will be processed automatically.',
      },
    ],
  },
  {
    id: 'shipping',
    title: 'Shipping & Delivery',
    faqs: [
      {
        question: 'What are the delivery times?',
        answer: 'Delivery times vary by location and shipping method. Standard shipping typically takes 3-7 business days, while express shipping takes 1-3 business days. Exact delivery estimates are shown at checkout.',
      },
      {
        question: 'Do you ship internationally?',
        answer: 'Yes, we ship to many countries worldwide. International shipping times and costs vary by destination. Check the shipping options at checkout for your specific location.',
      },
      {
        question: 'What if my package is lost or damaged?',
        answer: 'If your package is lost or arrives damaged, please contact us within 48 hours of the expected delivery date. We\'ll investigate and arrange a replacement or refund.',
      },
    ],
  },
  {
    id: 'payments',
    title: 'Payments & Pricing',
    faqs: [
      {
        question: 'What payment methods do you accept?',
        answer: 'We accept major credit cards (Visa, Mastercard, American Express), debit cards, PayPal, and bank transfers. Payment options may vary by location.',
      },
      {
        question: 'Is my payment information secure?',
        answer: 'Yes, all payment information is encrypted using industry-standard SSL encryption. We never store your complete card details on our servers.',
      },
      {
        question: 'Why was my payment declined?',
        answer: 'Payments can be declined for various reasons including insufficient funds, incorrect card details, or bank security measures. Try a different payment method or contact your bank.',
      },
    ],
  },
  {
    id: 'returns',
    title: 'Returns & Refunds',
    faqs: [
      {
        question: 'What is your return policy?',
        answer: 'We offer a 30-day return policy for most items. Products must be unused, in original packaging, and with all tags attached. Some items like personalized products may not be eligible for return.',
      },
      {
        question: 'How do I return an item?',
        answer: 'To initiate a return, go to "My Orders", select the order, and click "Return Item". Follow the instructions to print a return label and ship the item back.',
      },
      {
        question: 'When will I receive my refund?',
        answer: 'Refunds are processed within 5-7 business days after we receive your return. The refund will be credited to your original payment method.',
      },
    ],
  },
  {
    id: 'account',
    title: 'Account & Security',
    faqs: [
      {
        question: 'How do I reset my password?',
        answer: 'Click "Forgot Password" on the login page and enter your email address. You\'ll receive a link to reset your password within a few minutes.',
      },
      {
        question: 'How do I update my account information?',
        answer: 'Go to "My Account" > "Profile" to update your personal information, email address, or phone number. Changes are saved automatically.',
      },
      {
        question: 'How do I delete my account?',
        answer: 'To delete your account, please contact our support team. Note that this action is irreversible and all your data will be permanently removed.',
      },
    ],
  },
  {
    id: 'selling',
    title: 'Selling on Vendora',
    faqs: [
      {
        question: 'How do I become a seller?',
        answer: 'Visit our "Sell on Vendora" page and complete the registration form. You\'ll need to provide business information, bank details, and agree to our seller terms. Applications are typically reviewed within 2-3 business days.',
      },
      {
        question: 'What are the seller fees?',
        answer: 'We charge a commission on each sale, which varies by product category. There are no monthly fees or listing fees. You only pay when you make a sale.',
      },
      {
        question: 'How and when do I get paid?',
        answer: 'Payments are processed weekly for all orders delivered in the previous week. You can request a payout once your balance reaches the minimum threshold.',
      },
    ],
  },
]

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = React.useState('')

  const filteredFaqs = React.useMemo(() => {
    if (!searchQuery.trim()) return faqSections

    const query = searchQuery.toLowerCase()
    return faqSections.map(section => ({
      ...section,
      faqs: section.faqs.filter(
        faq =>
          faq.question.toLowerCase().includes(query) ||
          faq.answer.toLowerCase().includes(query)
      ),
    })).filter(section => section.faqs.length > 0)
  }, [searchQuery])

  return (
    <div className="container py-8 md:py-12">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h1 className="text-4xl font-bold font-display mb-4">Help Center</h1>
        <p className="text-muted-foreground mb-6">
          Find answers to common questions or contact our support team for assistance.
        </p>
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search for help..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Categories */}
      {!searchQuery && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {categories.map((category) => (
            <a
              key={category.title}
              href={category.href}
              className="block"
            >
              <Card className="h-full hover:border-primary/50 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <category.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{category.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {category.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </a>
          ))}
        </div>
      )}

      {/* FAQ Sections */}
      <div className="space-y-8">
        {filteredFaqs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <HelpCircle className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No results found</h3>
              <p className="text-muted-foreground mb-4">
                We couldn&apos;t find any FAQs matching your search.
              </p>
              <Button variant="outline" onClick={() => setSearchQuery('')}>
                Clear Search
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredFaqs.map((section) => (
            <div key={section.id} id={section.id}>
              <h2 className="text-2xl font-bold font-display mb-4">
                {section.title}
              </h2>
              <Card>
                <CardContent className="p-0">
                  <Accordion type="single" collapsible className="w-full">
                    {section.faqs.map((faq, index) => (
                      <AccordionItem
                        key={index}
                        value={`${section.id}-${index}`}
                        className="px-6"
                      >
                        <AccordionTrigger className="text-left">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </div>
          ))
        )}
      </div>

      {/* Still Need Help */}
      <Card className="mt-12 bg-primary/5 border-primary/20">
        <CardContent className="py-8 text-center">
          <MessageSquare className="mx-auto h-12 w-12 text-primary mb-4" />
          <h3 className="text-xl font-semibold mb-2">Still Need Help?</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            Can&apos;t find what you&apos;re looking for? Our support team is ready to
            assist you with any questions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild>
              <Link href="/contact">Contact Support</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/track-order">Track Order</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

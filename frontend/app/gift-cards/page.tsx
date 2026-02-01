'use client'

import Link from 'next/link'
import { Gift, CreditCard, Mail, ShoppingBag, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const giftCardAmounts = [25, 50, 100, 200, 500]

export default function GiftCardsPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-navy-dark via-navy to-cyan-dark/30 text-white py-16">
        <div className="container text-center">
          <Badge className="bg-cyan/20 text-cyan border border-cyan/30 mb-4">
            <Gift className="h-3 w-3 mr-1" />
            Perfect Gift
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold font-display mb-4">Vendora Gift Cards</h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            Give the gift of choice. Let your loved ones shop from thousands of products worldwide.
          </p>
        </div>
      </section>

      {/* Gift Card Options */}
      <section className="py-16">
        <div className="container">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Digital Gift Card */}
            <div className="bg-card border border-border rounded-2xl p-8 hover:border-cyan/50 transition-colors">
              <div className="p-4 rounded-xl bg-cyan/10 w-fit mb-6">
                <Mail className="h-8 w-8 text-cyan" />
              </div>
              <h2 className="text-2xl font-bold mb-3">E-Gift Card</h2>
              <p className="text-muted-foreground mb-6">
                Send instantly via email. Perfect for last-minute gifts or international recipients.
              </p>
              <div className="flex flex-wrap gap-2 mb-6">
                {giftCardAmounts.map((amount) => (
                  <button
                    key={amount}
                    className="px-4 py-2 border border-border rounded-lg hover:border-cyan hover:text-cyan transition-colors"
                  >
                    £{amount}
                  </button>
                ))}
              </div>
              <Button className="w-full bg-gradient-to-r from-cyan to-cyan-light text-navy">
                Buy E-Gift Card
              </Button>
            </div>

            {/* Physical Gift Card */}
            <div className="bg-card border border-border rounded-2xl p-8 hover:border-cyan/50 transition-colors">
              <div className="p-4 rounded-xl bg-cyan/10 w-fit mb-6">
                <CreditCard className="h-8 w-8 text-cyan" />
              </div>
              <h2 className="text-2xl font-bold mb-3">Physical Gift Card</h2>
              <p className="text-muted-foreground mb-6">
                A beautiful card delivered to your door. Great for special occasions.
              </p>
              <div className="flex flex-wrap gap-2 mb-6">
                {giftCardAmounts.map((amount) => (
                  <button
                    key={amount}
                    className="px-4 py-2 border border-border rounded-lg hover:border-cyan hover:text-cyan transition-colors"
                  >
                    £{amount}
                  </button>
                ))}
              </div>
              <Button className="w-full bg-gradient-to-r from-cyan to-cyan-light text-navy">
                Buy Physical Card
              </Button>
            </div>

            {/* Custom Amount */}
            <div className="bg-card border border-border rounded-2xl p-8 hover:border-cyan/50 transition-colors">
              <div className="p-4 rounded-xl bg-cyan/10 w-fit mb-6">
                <Sparkles className="h-8 w-8 text-cyan" />
              </div>
              <h2 className="text-2xl font-bold mb-3">Custom Amount</h2>
              <p className="text-muted-foreground mb-6">
                Choose any amount from £10 to £1000. Perfect for any budget.
              </p>
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Enter amount (£)</label>
                <input
                  type="number"
                  min="10"
                  max="1000"
                  placeholder="Enter amount"
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan"
                />
              </div>
              <Button className="w-full bg-gradient-to-r from-cyan to-cyan-light text-navy">
                Buy Custom Card
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-card/50">
        <div className="container">
          <h2 className="text-3xl font-bold font-display text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-cyan text-navy font-bold flex items-center justify-center mx-auto mb-4">1</div>
              <h3 className="font-semibold mb-2">Choose Amount</h3>
              <p className="text-sm text-muted-foreground">Select from preset amounts or enter custom</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-cyan text-navy font-bold flex items-center justify-center mx-auto mb-4">2</div>
              <h3 className="font-semibold mb-2">Add Personal Touch</h3>
              <p className="text-sm text-muted-foreground">Write a personal message</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-cyan text-navy font-bold flex items-center justify-center mx-auto mb-4">3</div>
              <h3 className="font-semibold mb-2">Send or Deliver</h3>
              <p className="text-sm text-muted-foreground">Email instantly or ship physically</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-cyan text-navy font-bold flex items-center justify-center mx-auto mb-4">4</div>
              <h3 className="font-semibold mb-2">Shop & Enjoy</h3>
              <p className="text-sm text-muted-foreground">Recipient shops from worldwide products</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

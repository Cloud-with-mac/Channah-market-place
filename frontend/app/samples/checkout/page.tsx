'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSampleCartStore } from '@/store/sample-cart-store'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { PriceDisplay } from '@/components/ui/price-display'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Beaker, CheckCircle2, Info, Package, Truck } from 'lucide-react'
import Link from 'next/link'
import { toast } from '@/hooks/use-toast'

export default function SamplesCheckoutPage() {
  const router = useRouter()
  const { items, total, itemCount, clearCart } = useSampleCartStore()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    companyName: '',
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    specialInstructions: '',
  })

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.companyName || !formData.fullName || !formData.email || !formData.phone) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      })
      return
    }

    if (!formData.address || !formData.city || !formData.country) {
      toast({
        title: 'Missing address',
        description: 'Please provide complete shipping address',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)

    try {
      // TODO: Submit to backend API
      // const response = await samplesAPI.createOrder({
      //   items: items.map(item => ({ productId: item.productId, quantity: item.quantity })),
      //   shippingAddress: formData,
      // })

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      toast({
        title: 'Sample order placed!',
        description: 'Your sample order has been confirmed. Check your email for details.',
      })

      clearCart()
      router.push('/account/orders')
    } catch (error) {
      console.error('Failed to submit sample order:', error)
      toast({
        title: 'Order failed',
        description: 'Failed to place sample order. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Redirect if cart is empty
  if (items.length === 0) {
    return (
      <div className="container py-12">
        <Card className="p-12 max-w-2xl mx-auto text-center">
          <Beaker className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Your sample cart is empty</h1>
          <p className="text-muted-foreground mb-6">
            Add samples from product pages to continue
          </p>
          <Button asChild>
            <Link href="/products">Browse Products</Link>
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/products">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Continue Shopping
          </Link>
        </Button>
        <h1 className="text-3xl font-bold font-display">Sample Order Checkout</h1>
        <p className="text-muted-foreground mt-2">
          Complete your sample order to evaluate products before bulk purchase
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Info Banner */}
          <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-700 dark:text-blue-300">
                <p className="font-semibold mb-1">About Sample Orders</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Samples are shipped separately from bulk orders</li>
                  <li>Estimated delivery: 7-14 business days</li>
                  <li>Sample prices include shipping and handling</li>
                  <li>Limited to {items[0]?.maxSamples || 3} samples per product</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Shipping Form */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Shipping Information
            </h2>

            <form onSubmit={handleSubmitOrder} className="space-y-4">
              {/* Company Name */}
              <div>
                <Label htmlFor="companyName">
                  Company Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="companyName"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  placeholder="Your Company Ltd."
                  required
                />
              </div>

              {/* Full Name */}
              <div>
                <Label htmlFor="fullName">
                  Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                  required
                />
              </div>

              {/* Contact Info */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="john@company.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">
                    Phone <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+1 234 567 8900"
                    required
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <Label htmlFor="address">
                  Street Address <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="123 Business Street"
                  required
                />
              </div>

              {/* City, State, Postal Code */}
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">
                    City <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="New York"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="state">State/Province</Label>
                  <Input
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    placeholder="NY"
                  />
                </div>
                <div>
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    placeholder="10001"
                  />
                </div>
              </div>

              {/* Country */}
              <div>
                <Label htmlFor="country">
                  Country <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  placeholder="United States"
                  required
                />
              </div>

              {/* Special Instructions */}
              <div>
                <Label htmlFor="specialInstructions">Special Instructions (Optional)</Label>
                <Textarea
                  id="specialInstructions"
                  name="specialInstructions"
                  value={formData.specialInstructions}
                  onChange={handleInputChange}
                  placeholder="Any special requests or delivery instructions..."
                  rows={3}
                />
              </div>
            </form>
          </Card>
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            {/* Order Summary */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Summary
              </h2>

              <div className="space-y-3 mb-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-2">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.vendorName}</p>
                      <div className="flex items-center justify-between mt-1">
                        <Badge variant="outline" className="text-xs">
                          Qty: {item.quantity}
                        </Badge>
                        <p className="text-sm font-semibold">${item.price.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              {/* Totals */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Items ({itemCount})</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Shipping</span>
                  <span>Included</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total</span>
                  <PriceDisplay price={total} size="lg" />
                </div>
              </div>

              <Button
                onClick={handleSubmitOrder}
                disabled={isSubmitting}
                className="w-full mt-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90"
                size="lg"
              >
                {isSubmitting ? (
                  <>Processing...</>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-5 w-5" />
                    Place Sample Order
                  </>
                )}
              </Button>
            </Card>

            {/* Benefits */}
            <Card className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 border-purple-200 dark:border-purple-800">
              <h3 className="font-semibold mb-3 text-purple-900 dark:text-purple-100">
                Why Order Samples?
              </h3>
              <ul className="space-y-2 text-sm text-purple-700 dark:text-purple-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Evaluate quality before bulk orders</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Test compatibility with your needs</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Compare multiple suppliers easily</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Reduce risk on large purchases</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

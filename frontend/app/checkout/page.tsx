'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { CheckoutSteps } from '@/components/checkout/checkout-steps'
import { ShippingForm, ShippingFormData } from '@/components/checkout/shipping-form'
import { PaymentForm, PaymentMethod } from '@/components/checkout/payment-form'
import { OrderSummarySidebar } from '@/components/checkout/order-summary-sidebar'
import { CartEmpty } from '@/components/cart/cart-empty'
import { useCartStore, useAuthStore, useCurrencyStore } from '@/store'
import { ordersAPI, cartAPI } from '@/lib/api'

const steps = [
  { id: 'shipping', title: 'Shipping' },
  { id: 'payment', title: 'Payment' },
  { id: 'confirm', title: 'Confirm' },
]

export default function CheckoutPage() {
  const router = useRouter()
  const { items, subtotal, total, discountAmount, couponCode, clearCart } = useCartStore()
  const { user, isAuthenticated } = useAuthStore()
  const { currency } = useCurrencyStore()

  const [currentStep, setCurrentStep] = React.useState(0)
  const [isLoading, setIsLoading] = React.useState(false)
  const [shippingData, setShippingData] = React.useState<ShippingFormData | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [orderComplete, setOrderComplete] = React.useState(false)

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/checkout')
    }
  }, [isAuthenticated, router])

  // Show redirecting message if order was just completed
  if (orderComplete) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">Order placed successfully! Redirecting...</p>
      </div>
    )
  }

  // Redirect if cart is empty
  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <CartEmpty
          title="Your cart is empty"
          description="Add some items to your cart before checking out."
        />
      </div>
    )
  }

  // Show loading while checking auth
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">Redirecting to login...</p>
      </div>
    )
  }

  const handleShippingSubmit = (data: ShippingFormData) => {
    setShippingData(data)
    setCurrentStep(1)
  }

  const handlePaymentSubmit = async (method: PaymentMethod, paymentData: any) => {
    setIsLoading(true)
    setError(null)

    try {
      // Ensure backend cart is in sync — add all frontend items
      try {
        await cartAPI.clear()
      } catch {
        // Cart might not exist yet
      }

      for (const item of items) {
        await cartAPI.addItem(item.productId, item.quantity, item.variantId)
      }

      // Apply coupon if any
      if (couponCode) {
        try {
          await cartAPI.applyCoupon(couponCode)
        } catch {
          // Coupon might not be valid, continue anyway
        }
      }

      // Create order — backend reads items from the cart
      const orderData = {
        shipping_address: {
          first_name: shippingData?.firstName || '',
          last_name: shippingData?.lastName || '',
          email: shippingData?.email || '',
          phone: shippingData?.phone || '',
          address_line1: shippingData?.address || '',
          address_line2: shippingData?.address2 || '',
          city: shippingData?.city || '',
          state: '', // Optional field
          postal_code: shippingData?.postalCode || '',
          country: shippingData?.country || '',
        },
        payment_method: method,
        billing_same_as_shipping: true,
        currency: currency.code,
      }

      const order = await ordersAPI.create(orderData)

      // Mark order as complete BEFORE clearing cart to prevent "empty cart" flash
      setOrderComplete(true)

      // Clear frontend cart after successful order
      clearCart()

      // Redirect to success page with estimated delivery info
      const estimatedDelivery = order.estimated_delivery ? `&delivery=${encodeURIComponent(order.estimated_delivery)}` : ''
      router.push(`/checkout/success?order=${order.order_number}${estimatedDelivery}`)
    } catch (err: any) {
      console.error('Checkout error:', err)
      console.error('Error response:', err?.response?.data)

      // Extract detailed error message
      let errorMessage = 'Failed to process order. Please try again.'
      if (err?.response?.data) {
        const data = err.response.data
        if (typeof data.detail === 'string') {
          errorMessage = data.detail
        } else if (Array.isArray(data.detail)) {
          // Pydantic validation errors
          errorMessage = data.detail.map((e: any) => e.msg || e.message || JSON.stringify(e)).join(', ')
        } else if (data.message) {
          errorMessage = data.message
        }
      } else if (err?.message) {
        errorMessage = err.message
      }

      setError(errorMessage)
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    setCurrentStep(0)
  }

  // Calculate shipping from vendor-set per-product shipping costs
  const shipping = items.reduce((sum, item) => sum + (item.shippingCost || 0) * item.quantity, 0)
  const finalTotal = total + shipping

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Steps */}
      <CheckoutSteps steps={steps} currentStep={currentStep} className="mb-8" />

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <div className="bg-background rounded-lg border p-6">
            {error && (
              <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                {error}
              </div>
            )}

            {currentStep === 0 && (
              <ShippingForm
                onSubmit={handleShippingSubmit}
                defaultValues={
                  shippingData || {
                    firstName: user?.first_name,
                    lastName: user?.last_name,
                    email: user?.email,
                  }
                }
                isLoading={isLoading}
              />
            )}

            {currentStep === 1 && (
              <PaymentForm
                onSubmit={handlePaymentSubmit}
                onBack={handleBack}
                isLoading={isLoading}
                total={finalTotal}
              />
            )}
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <OrderSummarySidebar
            items={items}
            subtotal={subtotal}
            discount={discountAmount}
            shipping={shipping}
            total={finalTotal}
            couponCode={couponCode}
          />
        </div>
      </div>
    </div>
  )
}

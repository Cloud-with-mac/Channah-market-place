'use client'

import * as React from 'react'
import { CreditCard, Building } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'
import { useCurrencyStore } from '@/store'
import { paymentsAPI } from '@/lib/api'

export type PaymentMethod = string

interface PaymentFormProps {
  onSubmit: (method: PaymentMethod, data: any) => void
  onBack: () => void
  isLoading?: boolean
  total: number
}

// PayPal Icon Component
function PayPalIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.773.773 0 0 1 .762-.65h7.023c2.324 0 4.07.576 5.18 1.71.468.477.792 1.017.965 1.606.183.622.216 1.342.095 2.144-.016.106-.034.214-.055.326-.48 2.516-2.093 4.179-4.833 4.713a9.6 9.6 0 0 1-1.88.173H9.578a.95.95 0 0 0-.938.803l-.792 5.04-.233 1.474a.5.5 0 0 1-.494.425l-.045-.047z"/>
      <path d="M19.296 8.064c-.023.147-.05.3-.08.456-.68 3.454-3.034 4.752-6.042 4.752h-1.53a.738.738 0 0 0-.73.63l-.978 6.203a.39.39 0 0 0 .384.45h2.7a.648.648 0 0 0 .64-.549l.026-.136.51-3.23.033-.178a.648.648 0 0 1 .64-.549h.403c2.612 0 4.658-1.06 5.257-4.13.25-1.283.12-2.354-.542-3.108a2.597 2.597 0 0 0-.69-.61z"/>
    </svg>
  )
}

export function PaymentForm({ onSubmit, onBack, isLoading, total }: PaymentFormProps) {
  const { convertAndFormat } = useCurrencyStore()

  const [method, setMethod] = React.useState<PaymentMethod>('stripe')
  const [availableMethods, setAvailableMethods] = React.useState<any[]>([])

  // Fetch available payment methods from backend
  React.useEffect(() => {
    paymentsAPI.getPaymentMethods()
      .then((res) => {
        const methods = res?.methods || []
        if (methods.length > 0) {
          setAvailableMethods(methods)
          setMethod(methods[0].id)
        } else {
          // Fallback
          setAvailableMethods([
            { id: 'stripe', name: 'Credit/Debit Card', icon: 'credit-card', enabled: true },
            { id: 'paypal', name: 'PayPal', icon: 'paypal', enabled: true },
          ])
          setMethod('stripe')
        }
      })
      .catch(() => {
        setAvailableMethods([
          { id: 'stripe', name: 'Credit/Debit Card', icon: 'credit-card', enabled: true },
          { id: 'paypal', name: 'PayPal', icon: 'paypal', enabled: true },
        ])
        setMethod('stripe')
      })
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(method, {})
  }

  // Map backend icon names to Lucide components
  const iconComponents: Record<string, any> = {
    'credit-card': CreditCard,
    'paypal': PayPalIcon,
    'bank': Building,
  }

  const paymentMethods = availableMethods.map((m) => ({
    id: m.id as PaymentMethod,
    name: m.name,
    icon: iconComponents[m.icon] || CreditCard,
    description: m.id === 'stripe' ? 'Pay with Visa, Mastercard, or American Express'
      : m.id === 'paypal' ? 'Pay securely with your PayPal account'
      : m.id === 'flutterwave' ? 'Pay with Flutterwave (cards, bank transfer, mobile money)'
      : m.id === 'razorpay' ? 'Pay with Razorpay (UPI, cards, net banking)'
      : m.name,
  }))

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="font-semibold mb-4">Select Payment Method</h3>
        <RadioGroup
          value={method}
          onValueChange={(v) => setMethod(v as PaymentMethod)}
          className="space-y-3"
        >
          {paymentMethods.map((pm) => (
            <div key={pm.id}>
              <Label
                htmlFor={pm.id}
                className={cn(
                  'flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-colors',
                  method === pm.id
                    ? 'border-primary bg-primary/5'
                    : 'border-input hover:border-primary/50'
                )}
              >
                <RadioGroupItem value={pm.id} id={pm.id} />
                <pm.icon className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="font-medium">{pm.name}</p>
                  <p className="text-xs text-muted-foreground">{pm.description}</p>
                </div>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Secure payment notice for card-based methods */}
      {(method === 'stripe' || method === 'razorpay') && (
        <div className="p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            Payment processing is handled securely through our payment partners. You will be redirected to complete payment after placing your order.
          </p>
        </div>
      )}

      {/* Redirect-based payment info */}
      {(method === 'paypal' || method === 'flutterwave') && (
        <div className="p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            You will be redirected to {method === 'paypal' ? 'PayPal' : 'Flutterwave'} to complete your payment securely.
            After payment, you&apos;ll return to complete your order.
          </p>
        </div>
      )}

      <div className="flex gap-4">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button
          type="submit"
          className="flex-1"
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : `Pay ${convertAndFormat(total)}`}
        </Button>
      </div>
    </form>
  )
}

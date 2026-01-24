'use client'

import * as React from 'react'
import { CreditCard, Building, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'
import { useCurrencyStore } from '@/store'

export type PaymentMethod = 'card' | 'bank' | 'paypal'

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
  const { currency, convertAndFormat } = useCurrencyStore()
  const isNigeria = currency.code === 'NGN'

  const [method, setMethod] = React.useState<PaymentMethod>('card')
  const [cardNumber, setCardNumber] = React.useState('')
  const [expiryDate, setExpiryDate] = React.useState('')
  const [cvv, setCvv] = React.useState('')
  const [cardName, setCardName] = React.useState('')

  // Reset method if it's not available for current currency
  React.useEffect(() => {
    if (isNigeria && method === 'paypal') {
      setMethod('card')
    } else if (!isNigeria && method === 'bank') {
      setMethod('card')
    }
  }, [isNigeria, method])

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    const matches = v.match(/\d{4,16}/g)
    const match = (matches && matches[0]) || ''
    const parts = []
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }
    return parts.length ? parts.join(' ') : value
  }

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    if (v.length >= 2) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`
    }
    return v
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (method === 'card') {
      onSubmit(method, {
        cardNumber: cardNumber.replace(/\s/g, ''),
        expiryDate,
        cvv,
        cardName,
      })
    } else {
      onSubmit(method, {})
    }
  }

  // Payment methods based on currency
  const paymentMethods = isNigeria
    ? [
        {
          id: 'card' as PaymentMethod,
          name: 'Credit/Debit Card',
          icon: CreditCard,
          description: 'Pay with Visa, Mastercard, or Verve',
        },
        {
          id: 'bank' as PaymentMethod,
          name: 'Bank Transfer',
          icon: Building,
          description: 'Direct bank transfer to Nigerian bank account',
        },
      ]
    : [
        {
          id: 'card' as PaymentMethod,
          name: 'Credit/Debit Card',
          icon: CreditCard,
          description: 'Pay with Visa, Mastercard, or American Express',
        },
        {
          id: 'paypal' as PaymentMethod,
          name: 'PayPal',
          icon: PayPalIcon,
          description: 'Pay securely with your PayPal account',
        },
      ]

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

      {/* Card Details Form */}
      {method === 'card' && (
        <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
          <div>
            <Label htmlFor="cardName">Cardholder Name</Label>
            <Input
              id="cardName"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              placeholder="Name on card"
              className="mt-1"
              required
            />
          </div>
          <div>
            <Label htmlFor="cardNumber">Card Number</Label>
            <Input
              id="cardNumber"
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              placeholder="1234 5678 9012 3456"
              maxLength={19}
              className="mt-1"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="expiryDate">Expiry Date</Label>
              <Input
                id="expiryDate"
                value={expiryDate}
                onChange={(e) => setExpiryDate(formatExpiryDate(e.target.value))}
                placeholder="MM/YY"
                maxLength={5}
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label htmlFor="cvv">CVV</Label>
              <Input
                id="cvv"
                value={cvv}
                onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="123"
                maxLength={4}
                type="password"
                className="mt-1"
                required
              />
            </div>
          </div>
        </div>
      )}

      {/* Bank Transfer Info (Nigeria only) */}
      {method === 'bank' && (
        <div className="p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            After clicking &quot;Place Order&quot;, you will receive bank account details
            to complete your transfer. Your order will be processed once payment is confirmed.
          </p>
        </div>
      )}

      {/* PayPal Info (International only) */}
      {method === 'paypal' && (
        <div className="p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            You will be redirected to PayPal to complete your payment securely.
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

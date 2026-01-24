'use client'

import * as React from 'react'
import { Tag, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cartAPI } from '@/lib/api'

interface CouponInputProps {
  appliedCoupon?: string
  onApply: (code: string, discountAmount: number) => void
  onRemove: () => void
}

export function CouponInput({ appliedCoupon, onApply, onRemove }: CouponInputProps) {
  const [code, setCode] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handleApply = async () => {
    if (!code.trim()) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await cartAPI.applyCoupon(code.trim().toUpperCase())
      const data = response.data
      onApply(code.trim().toUpperCase(), data.discount_amount || 0)
      setCode('')
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Invalid coupon code')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemove = async () => {
    setIsLoading(true)
    try {
      await cartAPI.removeCoupon()
      onRemove()
    } catch (err) {
      // Silently fail, still remove locally
      onRemove()
    } finally {
      setIsLoading(false)
    }
  }

  if (appliedCoupon) {
    return (
      <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium text-green-700 dark:text-green-400">
            {appliedCoupon}
          </span>
          <span className="text-xs text-green-600 dark:text-green-500">
            applied
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-green-600 hover:text-green-700 hover:bg-green-100 dark:hover:bg-green-900/30"
          onClick={handleRemove}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <X className="h-3 w-3" />
          )}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          placeholder="Enter coupon code"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase())
            setError(null)
          }}
          onKeyDown={(e) => e.key === 'Enter' && handleApply()}
          className="flex-1"
          error={!!error}
        />
        <Button
          variant="outline"
          onClick={handleApply}
          disabled={!code.trim() || isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Apply'
          )}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

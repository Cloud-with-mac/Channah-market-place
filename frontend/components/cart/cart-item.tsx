'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { QuantitySelector } from '@/components/product/quantity-selector'
import { useCurrencyStore } from '@/store'

interface CartItemProps {
  item: {
    id: string
    productId: string
    name: string
    slug?: string
    price: number
    image: string
    quantity: number
    maxQuantity?: number
    vendorName?: string
    variantId?: string
  }
  onUpdateQuantity: (id: string, quantity: number) => void
  onRemove: (id: string) => void
  compact?: boolean
}

export function CartItem({
  item,
  onUpdateQuantity,
  onRemove,
  compact = false,
}: CartItemProps) {
  const { convertAndFormat } = useCurrencyStore()

  return (
    <div className={`flex gap-4 ${compact ? 'py-3' : 'py-4'}`}>
      {/* Image */}
      <Link
        href={item.slug ? `/product/${item.slug}` : '#'}
        className={`relative ${compact ? 'w-16 h-16' : 'w-20 h-20 sm:w-24 sm:h-24'} flex-shrink-0 rounded-md overflow-hidden bg-muted`}
      >
        <Image
          src={item.image || '/placeholder.png'}
          alt={item.name}
          fill
          className="object-cover"
          sizes={compact ? '64px' : '96px'}
        />
      </Link>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between gap-2">
          <div className="min-w-0">
            <Link
              href={item.slug ? `/product/${item.slug}` : '#'}
              className={`font-medium ${compact ? 'text-sm' : ''} line-clamp-2 hover:text-primary transition-colors`}
            >
              {item.name}
            </Link>
            {item.vendorName && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {item.vendorName}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className={`${compact ? 'h-7 w-7' : 'h-8 w-8'} text-muted-foreground hover:text-destructive flex-shrink-0`}
            onClick={() => onRemove(item.id)}
          >
            <Trash2 className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
          </Button>
        </div>

        <div className={`flex items-center justify-between ${compact ? 'mt-2' : 'mt-3'}`}>
          <QuantitySelector
            value={item.quantity}
            onChange={(qty) => onUpdateQuantity(item.id, qty)}
            min={1}
            max={item.maxQuantity || 99}
            size={compact ? 'sm' : 'sm'}
          />
          <div className="text-right">
            <p className={`font-semibold ${compact ? 'text-sm' : ''}`}>
              {convertAndFormat(item.price * item.quantity)}
            </p>
            {item.quantity > 1 && (
              <p className="text-xs text-muted-foreground">
                {convertAndFormat(item.price)} each
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

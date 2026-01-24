'use client'

import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CartEmptyProps {
  title?: string
  description?: string
  showButton?: boolean
}

export function CartEmpty({
  title = 'Your cart is empty',
  description = "Looks like you haven't added anything to your cart yet.",
  showButton = true,
}: CartEmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="mb-4 rounded-full bg-muted p-6">
        <ShoppingBag className="h-10 w-10 text-muted-foreground" />
      </div>
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="mb-6 max-w-sm text-sm text-muted-foreground">{description}</p>
      {showButton && (
        <Button asChild>
          <Link href="/products">Start Shopping</Link>
        </Button>
      )}
    </div>
  )
}

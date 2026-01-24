'use client'

import { Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface QuantitySelectorProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = 99,
  disabled = false,
  size = 'md',
  className,
}: QuantitySelectorProps) {
  const handleDecrement = () => {
    if (value > min) {
      onChange(value - 1)
    }
  }

  const handleIncrement = () => {
    if (value < max) {
      onChange(value + 1)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value) || min
    if (newValue >= min && newValue <= max) {
      onChange(newValue)
    }
  }

  const sizeClasses = {
    sm: {
      button: 'h-7 w-7',
      input: 'h-7 w-10 text-sm',
      icon: 'h-3 w-3',
    },
    md: {
      button: 'h-9 w-9',
      input: 'h-9 w-14 text-base',
      icon: 'h-4 w-4',
    },
    lg: {
      button: 'h-11 w-11',
      input: 'h-11 w-16 text-lg',
      icon: 'h-5 w-5',
    },
  }

  return (
    <div className={cn('flex items-center', className)}>
      <Button
        variant="outline"
        size="icon"
        className={cn(sizeClasses[size].button, 'rounded-r-none')}
        onClick={handleDecrement}
        disabled={disabled || value <= min}
        aria-label="Decrease quantity"
      >
        <Minus className={sizeClasses[size].icon} />
      </Button>
      <Input
        type="number"
        value={value}
        onChange={handleInputChange}
        min={min}
        max={max}
        disabled={disabled}
        className={cn(
          sizeClasses[size].input,
          'rounded-none border-x-0 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
        )}
        aria-label="Quantity"
      />
      <Button
        variant="outline"
        size="icon"
        className={cn(sizeClasses[size].button, 'rounded-l-none')}
        onClick={handleIncrement}
        disabled={disabled || value >= max}
        aria-label="Increase quantity"
      >
        <Plus className={sizeClasses[size].icon} />
      </Button>
    </div>
  )
}

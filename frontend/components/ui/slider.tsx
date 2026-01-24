'use client'

import * as React from 'react'
import * as SliderPrimitive from '@radix-ui/react-slider'
import { cn } from '@/lib/utils'

interface SliderProps extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  variant?: 'default' | 'range'
}

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps
>(({ className, variant = 'default', value, defaultValue, ...props }, ref) => {
  // Determine if this is a range slider (has two values)
  const isRange = Array.isArray(value) ? value.length > 1 : Array.isArray(defaultValue) ? defaultValue.length > 1 : false
  const thumbCount = Array.isArray(value) ? value.length : Array.isArray(defaultValue) ? defaultValue.length : 1

  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn(
        'relative flex w-full touch-none select-none items-center',
        className
      )}
      value={value}
      defaultValue={defaultValue}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-2.5 w-full grow overflow-hidden rounded-full bg-muted/60">
        <SliderPrimitive.Range
          className={cn(
            "absolute h-full rounded-full transition-all",
            isRange
              ? "bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-400"
              : "bg-primary"
          )}
        />
      </SliderPrimitive.Track>
      {Array.from({ length: thumbCount }).map((_, index) => (
        <SliderPrimitive.Thumb
          key={index}
          className={cn(
            "block h-5 w-5 rounded-full border-2 bg-background shadow-lg ring-offset-background transition-all",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:pointer-events-none disabled:opacity-50",
            "hover:scale-110 active:scale-95",
            isRange
              ? "border-cyan-500 focus-visible:ring-cyan-400"
              : "border-primary"
          )}
        />
      ))}
    </SliderPrimitive.Root>
  )
})
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }

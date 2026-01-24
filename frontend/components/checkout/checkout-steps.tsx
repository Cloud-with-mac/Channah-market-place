'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Step {
  id: string
  title: string
}

interface CheckoutStepsProps {
  steps: Step[]
  currentStep: number
  className?: string
}

export function CheckoutSteps({ steps, currentStep, className }: CheckoutStepsProps) {
  return (
    <nav className={cn('flex items-center justify-center', className)}>
      <ol className="flex items-center space-x-2 md:space-x-4">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep
          const isCurrent = index === currentStep
          const isUpcoming = index > currentStep

          return (
            <li key={step.id} className="flex items-center">
              <div className="flex items-center">
                {/* Step Indicator */}
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors',
                    isCompleted &&
                      'border-primary bg-primary text-primary-foreground',
                    isCurrent && 'border-primary text-primary',
                    isUpcoming && 'border-muted-foreground/30 text-muted-foreground'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>

                {/* Step Title */}
                <span
                  className={cn(
                    'ml-2 text-sm font-medium hidden sm:block',
                    isCompleted && 'text-primary',
                    isCurrent && 'text-foreground',
                    isUpcoming && 'text-muted-foreground'
                  )}
                >
                  {step.title}
                </span>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'ml-2 md:ml-4 h-0.5 w-8 md:w-16',
                    index < currentStep ? 'bg-primary' : 'bg-muted-foreground/30'
                  )}
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

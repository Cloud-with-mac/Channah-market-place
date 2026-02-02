'use client'

import * as React from 'react'
import {
  CheckCircle,
  Clock,
  Package,
  Truck,
  MapPin,
  Home,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/utils'

interface TimelineStep {
  id: string
  status: string
  label: string
  description?: string
  timestamp?: string
  completed: boolean
  current: boolean
}

interface OrderTimelineProps {
  status: string
  createdAt: string
  updatedAt?: string
  deliveredAt?: string
}

const orderSteps = [
  { id: 'pending', label: 'Order Placed', icon: Clock },
  { id: 'confirmed', label: 'Confirmed', icon: CheckCircle },
  { id: 'processing', label: 'Processing', icon: Package },
  { id: 'shipped', label: 'Shipped to Channah', icon: Truck },
  { id: 'out_for_delivery', label: 'Out for Delivery', icon: MapPin },
  { id: 'delivered', label: 'Delivered', icon: Home },
]

const statusOrder = ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered']

export function OrderTimeline({ status, createdAt, updatedAt, deliveredAt }: OrderTimelineProps) {
  const isCancelled = status === 'cancelled'
  const currentIndex = statusOrder.indexOf(status)

  const steps: TimelineStep[] = orderSteps.map((step, index) => {
    const isCompleted = !isCancelled && index < currentIndex
    const isCurrent = !isCancelled && index === currentIndex

    let timestamp: string | undefined
    if (step.id === 'pending') {
      timestamp = createdAt
    } else if (step.id === 'delivered' && deliveredAt) {
      timestamp = deliveredAt
    } else if (isCompleted || isCurrent) {
      timestamp = updatedAt
    }

    return {
      id: step.id,
      status: step.id,
      label: step.label,
      completed: isCompleted,
      current: isCurrent,
      timestamp,
    }
  })

  if (isCancelled) {
    return (
      <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
        <AlertCircle className="h-5 w-5 text-destructive" />
        <div>
          <p className="font-medium text-destructive">Order Cancelled</p>
          <p className="text-sm text-muted-foreground">
            This order was cancelled on {formatDate(updatedAt || createdAt)}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Progress Line */}
      <div className="absolute left-[15px] top-[30px] bottom-[30px] w-0.5 bg-muted" />
      <div
        className="absolute left-[15px] top-[30px] w-0.5 bg-primary transition-all duration-500"
        style={{
          height: `calc(${(currentIndex / (steps.length - 1)) * 100}% - 30px)`,
        }}
      />

      {/* Steps */}
      <div className="space-y-8">
        {steps.map((step, index) => {
          const StepIcon = orderSteps[index].icon

          return (
            <div key={step.id} className="relative flex gap-4">
              {/* Icon */}
              <div
                className={cn(
                  'relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors',
                  step.completed || step.current
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-muted bg-background text-muted-foreground'
                )}
              >
                {step.completed ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <StepIcon className="h-4 w-4" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pt-1">
                <div className="flex items-center justify-between">
                  <h4
                    className={cn(
                      'font-medium',
                      step.completed || step.current
                        ? 'text-foreground'
                        : 'text-muted-foreground'
                    )}
                  >
                    {step.label}
                  </h4>
                  {step.current && (
                    <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                      Current
                    </span>
                  )}
                </div>
                {step.timestamp && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatDate(step.timestamp)}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

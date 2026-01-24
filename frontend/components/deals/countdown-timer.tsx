'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface CountdownTimerProps {
  endDate: Date | string
  onComplete?: () => void
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

export function CountdownTimer({
  endDate,
  onComplete,
  className,
  size = 'md',
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = React.useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })
  const [isComplete, setIsComplete] = React.useState(false)

  React.useEffect(() => {
    const calculateTimeLeft = () => {
      const end = new Date(endDate).getTime()
      const now = new Date().getTime()
      const difference = end - now

      if (difference <= 0) {
        setIsComplete(true)
        onComplete?.()
        return {
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
        }
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
      }
    }

    setTimeLeft(calculateTimeLeft())

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearInterval(timer)
  }, [endDate, onComplete])

  const sizeClasses = {
    sm: {
      container: 'gap-1',
      box: 'w-8 h-8 text-xs',
      label: 'text-[10px]',
    },
    md: {
      container: 'gap-2',
      box: 'w-12 h-12 text-lg',
      label: 'text-xs',
    },
    lg: {
      container: 'gap-3',
      box: 'w-16 h-16 text-2xl',
      label: 'text-sm',
    },
  }

  const styles = sizeClasses[size]

  if (isComplete) {
    return (
      <div className={cn('text-center text-destructive font-medium', className)}>
        Deal Ended
      </div>
    )
  }

  return (
    <div className={cn('flex items-center', styles.container, className)}>
      <TimeBox value={timeLeft.days} label="Days" styles={styles} />
      <span className="text-muted-foreground font-bold">:</span>
      <TimeBox value={timeLeft.hours} label="Hrs" styles={styles} />
      <span className="text-muted-foreground font-bold">:</span>
      <TimeBox value={timeLeft.minutes} label="Min" styles={styles} />
      <span className="text-muted-foreground font-bold">:</span>
      <TimeBox value={timeLeft.seconds} label="Sec" styles={styles} />
    </div>
  )
}

function TimeBox({
  value,
  label,
  styles,
}: {
  value: number
  label: string
  styles: { box: string; label: string }
}) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={cn(
          'flex items-center justify-center rounded-md bg-primary text-primary-foreground font-bold',
          styles.box
        )}
      >
        {value.toString().padStart(2, '0')}
      </div>
      <span className={cn('text-muted-foreground mt-1', styles.label)}>
        {label}
      </span>
    </div>
  )
}

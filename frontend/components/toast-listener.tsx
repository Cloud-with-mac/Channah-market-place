'use client'

import { useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { toastEmitter } from '@/lib/toast-emitter'

export function ToastListener() {
  const { toast } = useToast()

  useEffect(() => {
    const unsubscribe = toastEmitter.subscribe((message, variant) => {
      toast({
        title: variant === 'destructive' ? 'Error' : 'Notice',
        description: message,
        variant: variant || 'destructive',
      })
    })
    return unsubscribe
  }, [toast])

  return null
}

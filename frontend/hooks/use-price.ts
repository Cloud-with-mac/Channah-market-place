'use client'

import { useCurrencyStore } from '@/store'

/**
 * Hook for price formatting with currency conversion
 * Automatically converts from base currency (GBP) to selected currency
 */
export function usePrice(priceInGBP: number): string {
  const { convertAndFormat } = useCurrencyStore()
  return convertAndFormat(priceInGBP)
}

/**
 * Hook for price formatting with compare price
 */
export function usePrices(price: number, compareAtPrice?: number): {
  formattedPrice: string
  formattedComparePrice: string | null
} {
  const { convertAndFormat } = useCurrencyStore()

  return {
    formattedPrice: convertAndFormat(price),
    formattedComparePrice: compareAtPrice ? convertAndFormat(compareAtPrice) : null,
  }
}

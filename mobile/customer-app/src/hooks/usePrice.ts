import { useCurrencyStore } from '../store/currencyStore';

export function usePrice() {
  const convertAndFormat = useCurrencyStore((s) => s.convertAndFormat);
  return { formatPrice: convertAndFormat };
}

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  flag: string;
}

export const currencies: Currency[] = [
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧' },
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', flag: '🇳🇬' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', flag: '🇨🇦' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', flag: '🇨🇳' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won', flag: '🇰🇷' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand', flag: '🇿🇦' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', flag: '🇧🇷' },
  { code: 'MXN', symbol: 'MX$', name: 'Mexican Peso', flag: '🇲🇽' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', flag: '🇦🇪' },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal', flag: '🇸🇦' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', flag: '🇸🇬' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar', flag: '🇭🇰' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', flag: '🇨🇭' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona', flag: '🇸🇪' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', flag: '🇳🇿' },
  { code: 'GHS', symbol: '₵', name: 'Ghanaian Cedi', flag: '🇬🇭' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling', flag: '🇰🇪' },
  { code: 'EGP', symbol: 'E£', name: 'Egyptian Pound', flag: '🇪🇬' },
  { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee', flag: '🇵🇰' },
];

const countryToCurrency: Record<string, string> = {
  GB: 'GBP', UK: 'GBP', US: 'USD', NG: 'NGN', CA: 'CAD', AU: 'AUD',
  IN: 'INR', JP: 'JPY', CN: 'CNY', KR: 'KRW', ZA: 'ZAR', BR: 'BRL',
  MX: 'MXN', AE: 'AED', SA: 'SAR', SG: 'SGD', HK: 'HKD', CH: 'CHF',
  SE: 'SEK', NZ: 'NZD', GH: 'GHS', KE: 'KES', EG: 'EGP', PK: 'PKR',
  DE: 'EUR', FR: 'EUR', IT: 'EUR', ES: 'EUR', NL: 'EUR', BE: 'EUR',
  AT: 'EUR', IE: 'EUR', PT: 'EUR', GR: 'EUR', FI: 'EUR',
};

// Maps country code to country name (for address pre-fill)
export const countryCodeToName: Record<string, string> = {
  NG: 'Nigeria', US: 'United States', GB: 'United Kingdom', CA: 'Canada',
  AU: 'Australia', IN: 'India', JP: 'Japan', CN: 'China', KR: 'South Korea',
  ZA: 'South Africa', BR: 'Brazil', MX: 'Mexico', AE: 'United Arab Emirates',
  SA: 'Saudi Arabia', SG: 'Singapore', HK: 'Hong Kong', CH: 'Switzerland',
  SE: 'Sweden', NZ: 'New Zealand', GH: 'Ghana', KE: 'Kenya', EG: 'Egypt',
  PK: 'Pakistan', DE: 'Germany', FR: 'France', IT: 'Italy', ES: 'Spain',
  NL: 'Netherlands', BE: 'Belgium', AT: 'Austria', IE: 'Ireland',
  PT: 'Portugal', GR: 'Greece', FI: 'Finland',
};

// Fallback rates used when live API is unreachable
const FALLBACK_RATES: Record<string, number> = {
  GBP: 1, USD: 1.27, EUR: 1.17, NGN: 1980, CAD: 1.72, AUD: 1.93,
  INR: 105.5, JPY: 189.5, CNY: 9.18, KRW: 1680, ZAR: 23.8, BRL: 6.18,
  MXN: 21.7, AED: 4.66, SAR: 4.76, SGD: 1.71, HKD: 9.92, CHF: 1.12,
  SEK: 13.2, NZD: 2.09, GHS: 15.8, KES: 163, EGP: 39.2, PKR: 354,
};

// Timezone-to-country mapping for privacy-friendly country detection
const timezoneToCountry: Record<string, string> = {
  'Europe/London': 'GB', 'America/New_York': 'US', 'America/Chicago': 'US',
  'America/Denver': 'US', 'America/Los_Angeles': 'US', 'Africa/Lagos': 'NG',
  'America/Toronto': 'CA', 'Australia/Sydney': 'AU', 'Asia/Kolkata': 'IN',
  'Asia/Calcutta': 'IN', 'Asia/Tokyo': 'JP', 'Asia/Shanghai': 'CN',
  'Asia/Seoul': 'KR', 'Africa/Johannesburg': 'ZA', 'America/Sao_Paulo': 'BR',
  'America/Mexico_City': 'MX', 'Asia/Dubai': 'AE', 'Asia/Riyadh': 'SA',
  'Asia/Singapore': 'SG', 'Asia/Hong_Kong': 'HK', 'Europe/Zurich': 'CH',
  'Europe/Stockholm': 'SE', 'Pacific/Auckland': 'NZ', 'Africa/Accra': 'GH',
  'Africa/Nairobi': 'KE', 'Africa/Cairo': 'EG', 'Asia/Karachi': 'PK',
  'Europe/Berlin': 'DE', 'Europe/Paris': 'FR', 'Europe/Rome': 'IT',
  'Europe/Madrid': 'ES', 'Europe/Amsterdam': 'NL', 'Europe/Brussels': 'BE',
  'Europe/Vienna': 'AT', 'Europe/Dublin': 'IE', 'Europe/Lisbon': 'PT',
  'Europe/Athens': 'GR', 'Europe/Helsinki': 'FI',
};

const locales: Record<string, string> = {
  GBP: 'en-GB', USD: 'en-US', EUR: 'de-DE', NGN: 'en-NG',
  CAD: 'en-CA', AUD: 'en-AU', INR: 'en-IN', JPY: 'ja-JP',
  CNY: 'zh-CN', KRW: 'ko-KR', ZAR: 'en-ZA', BRL: 'pt-BR',
  MXN: 'es-MX', AED: 'ar-AE', SAR: 'ar-SA', SGD: 'en-SG',
  HKD: 'zh-HK', CHF: 'de-CH', SEK: 'sv-SE', NZD: 'en-NZ',
  GHS: 'en-GH', KES: 'en-KE', EGP: 'ar-EG', PKR: 'en-PK',
};

interface CurrencyState {
  currency: Currency;
  country: string | null;
  exchangeRates: Record<string, number>;
  setCurrency: (currencyCode: string) => void;
  setCountry: (country: string) => void;
  detectCountry: () => Promise<void>;
  fetchExchangeRates: () => Promise<void>;
  convertAndFormat: (priceInGBP: number) => string;
}

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set, get) => ({
      currency: currencies[0], // Default GBP
      country: null,
      exchangeRates: { ...FALLBACK_RATES },

      setCurrency: (currencyCode) => {
        const c = currencies.find((x) => x.code === currencyCode);
        if (c) set({ currency: c });
      },

      setCountry: (country) => {
        set({ country });
        const currencyCode = countryToCurrency[country] || 'GBP';
        const c = currencies.find((x) => x.code === currencyCode);
        if (c) set({ currency: c });
      },

      fetchExchangeRates: async () => {
        try {
          const res = await fetch('https://api.exchangerate-api.com/v4/latest/GBP', {
            signal: AbortSignal.timeout(5000),
          });
          const data = await res.json();
          if (data?.rates) {
            const updated: Record<string, number> = { GBP: 1 };
            for (const code of Object.keys(FALLBACK_RATES)) {
              if (data.rates[code]) updated[code] = data.rates[code];
            }
            set({ exchangeRates: updated });
          }
        } catch {
          // Keep fallback rates
        }
      },

      detectCountry: async () => {
        if (get().country) return;

        // Use device timezone for privacy-friendly country detection
        // No third-party IP services - respects user privacy
        try {
          const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
          const countryFromTz = timezoneToCountry[tz];
          if (countryFromTz) {
            get().setCountry(countryFromTz);
            return;
          }
        } catch {
          // Intl not available, use default
        }

        // If timezone detection fails, default currency (GBP) will be used
        // Users can manually select their currency in settings
      },

      convertAndFormat: (priceInGBP: number) => {
        const { currency, exchangeRates } = get();
        const rate = exchangeRates[currency.code] || 1;
        const converted = priceInGBP * rate;
        const locale = locales[currency.code] || 'en-GB';
        const noDecimals = currency.code === 'JPY' || currency.code === 'KRW';
        return new Intl.NumberFormat(locale, {
          style: 'currency',
          currency: currency.code,
          minimumFractionDigits: noDecimals ? 0 : 2,
          maximumFractionDigits: noDecimals ? 0 : 2,
        }).format(converted);
      },
    }),
    {
      name: 'currency-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        currency: state.currency,
        country: state.country,
      }),
    }
  )
);

/**
 * Language Management Hook
 * Provides access to language settings and utilities
 */

import { useState, useEffect } from 'react';
import { LocaleCode, defaultLocale, getLocaleMetadata, formatCurrency, formatDate, formatNumber } from '@/lib/i18n';

interface LanguageSettings {
  locale: LocaleCode;
  autoTranslation: boolean;
  currency: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  timezone: string;
}

const defaultSettings: LanguageSettings = {
  locale: defaultLocale,
  autoTranslation: false,
  currency: 'USD',
  dateFormat: 'MM/DD/YYYY',
  timeFormat: '12h',
  timezone: 'America/New_York',
};

export function useLanguage() {
  const [settings, setSettings] = useState<LanguageSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('languageSettings');
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings(parsed);
      }
    } catch (error) {
      console.error('Failed to load language settings:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save settings to localStorage
  const updateSettings = (newSettings: Partial<LanguageSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem('languageSettings', JSON.stringify(updated));
  };

  // Get current locale metadata
  const currentLocale = getLocaleMetadata(settings.locale);

  // Formatting utilities
  const utils = {
    formatCurrency: (amount: number, currency?: string) =>
      formatCurrency(amount, settings.locale, currency || settings.currency),

    formatDate: (date: Date, format?: 'short' | 'medium' | 'long' | 'full') =>
      formatDate(date, settings.locale, format),

    formatNumber: (number: number, format?: 'decimal' | 'currency' | 'percent') =>
      formatNumber(number, settings.locale, format),

    formatTime: (date: Date) => {
      const options: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
        hour12: settings.timeFormat === '12h',
      };
      return new Intl.DateTimeFormat(settings.locale, options).format(date);
    },
  };

  return {
    settings,
    updateSettings,
    currentLocale,
    isLoading,
    ...utils,
  };
}

// Translation hook (simplified - in production would integrate with next-intl)
export function useTranslation() {
  const { settings } = useLanguage();
  const [translations, setTranslations] = useState<Record<string, any>>({});

  useEffect(() => {
    // Load translations for current locale
    const loadTranslations = async () => {
      try {
        const locale = settings.locale;
        const messages = await import(`@/locales/${locale}.json`);
        setTranslations(messages.default);
      } catch (error) {
        console.error('Failed to load translations:', error);
        // Fallback to English
        try {
          const messages = await import(`@/locales/en.json`);
          setTranslations(messages.default);
        } catch (fallbackError) {
          console.error('Failed to load fallback translations:', fallbackError);
        }
      }
    };

    loadTranslations();
  }, [settings.locale]);

  // Translation function with dot notation support
  const t = (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let value: any = translations;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key; // Return key if translation not found
      }
    }

    if (typeof value !== 'string') {
      return key;
    }

    // Replace parameters
    if (params) {
      return Object.entries(params).reduce((str, [param, val]) => {
        return str.replace(new RegExp(`{${param}}`, 'g'), String(val));
      }, value);
    }

    return value;
  };

  return { t, translations };
}

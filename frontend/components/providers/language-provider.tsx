'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { LocaleCode, defaultLocale } from '@/lib/i18n';

interface LanguageContextType {
  locale: LocaleCode;
  setLocale: (locale: LocaleCode) => void;
  translations: Record<string, any>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<LocaleCode>(defaultLocale);
  const [translations, setTranslations] = useState<Record<string, any>>({});

  // Load locale from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('languageSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        if (parsed.locale) {
          setLocaleState(parsed.locale);
        }
      } catch (error) {
        console.error('Failed to load language settings:', error);
      }
    }
  }, []);

  // Load translations when locale changes
  useEffect(() => {
    const loadTranslations = async () => {
      try {
        const messages = await import(`@/locales/${locale}.json`);
        setTranslations(messages.default);

        // Update document language and direction
        document.documentElement.lang = locale;

        // Set RTL for Arabic
        if (locale === 'ar') {
          document.documentElement.dir = 'rtl';
        } else {
          document.documentElement.dir = 'ltr';
        }
      } catch (error) {
        console.error(`Failed to load translations for ${locale}:`, error);
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
  }, [locale]);

  const setLocale = (newLocale: LocaleCode) => {
    setLocaleState(newLocale);

    // Update localStorage
    const settings = JSON.parse(localStorage.getItem('languageSettings') || '{}');
    settings.locale = newLocale;
    localStorage.setItem('languageSettings', JSON.stringify(settings));
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, translations }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguageContext() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguageContext must be used within LanguageProvider');
  }
  return context;
}

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Check, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { locales, LocaleCode, getLocaleMetadata, translationQuality } from '@/lib/i18n';
import { useLanguage } from '@/hooks/use-language';

export function LanguageSwitcher() {
  const { settings, updateSettings, currentLocale } = useLanguage();
  const [open, setOpen] = useState(false);

  const handleLanguageChange = (code: LocaleCode) => {
    const locale = getLocaleMetadata(code);
    updateSettings({
      locale: code,
      currency: locale.currency,
      dateFormat: locale.dateFormat,
    });
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">{currentLocale.flag}</span>
          <span className="hidden md:inline">{currentLocale.name}</span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[280px] max-h-[400px] overflow-y-auto">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          Select Language
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Popular Languages */}
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Popular
        </DropdownMenuLabel>
        {locales.slice(0, 7).map((locale) => {
          const isSelected = locale.code === settings.locale;
          const quality = translationQuality[locale.code];

          return (
            <DropdownMenuItem
              key={locale.code}
              onClick={() => handleLanguageChange(locale.code)}
              className="flex items-center justify-between py-3 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{locale.flag}</span>
                <div>
                  <div className="font-medium">{locale.nativeName}</div>
                  <div className="text-xs text-muted-foreground">{locale.name}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {quality.coverage === 100 && (
                  <Badge variant="secondary" className="text-xs">
                    100%
                  </Badge>
                )}
                {isSelected && (
                  <div className="h-4 w-4 bg-primary rounded-full flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
              </div>
            </DropdownMenuItem>
          );
        })}

        <DropdownMenuSeparator />

        {/* Other Languages */}
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Other Languages
        </DropdownMenuLabel>
        {locales.slice(7).map((locale) => {
          const isSelected = locale.code === settings.locale;
          const quality = translationQuality[locale.code];

          return (
            <DropdownMenuItem
              key={locale.code}
              onClick={() => handleLanguageChange(locale.code)}
              className="flex items-center justify-between py-3 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{locale.flag}</span>
                <div>
                  <div className="font-medium">{locale.nativeName}</div>
                  <div className="text-xs text-muted-foreground">{locale.name}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {quality.coverage >= 95 && (
                  <Badge variant="secondary" className="text-xs">
                    {quality.coverage}%
                  </Badge>
                )}
                {isSelected && (
                  <div className="h-4 w-4 bg-primary rounded-full flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
              </div>
            </DropdownMenuItem>
          );
        })}

        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => (window.location.href = '/settings/language')}
          className="text-xs text-muted-foreground justify-center"
        >
          View all language settings
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Compact version for mobile
export function LanguageSwitcherCompact() {
  const { settings, updateSettings, currentLocale } = useLanguage();
  const [open, setOpen] = useState(false);

  const handleLanguageChange = (code: LocaleCode) => {
    const locale = getLocaleMetadata(code);
    updateSettings({
      locale: code,
      currency: locale.currency,
      dateFormat: locale.dateFormat,
    });
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <span className="text-xl">{currentLocale.flag}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[240px] max-h-[350px] overflow-y-auto">
        <DropdownMenuLabel className="text-xs">Language</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {locales.map((locale) => {
          const isSelected = locale.code === settings.locale;

          return (
            <DropdownMenuItem
              key={locale.code}
              onClick={() => handleLanguageChange(locale.code)}
              className="flex items-center justify-between py-2.5 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{locale.flag}</span>
                <span className="font-medium text-sm">{locale.nativeName}</span>
              </div>
              {isSelected && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

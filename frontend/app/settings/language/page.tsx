'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Globe,
  Search,
  Check,
  ChevronRight,
  Calendar,
  Clock,
  DollarSign,
  MapPin,
  Settings,
  Sparkles,
  Info,
  Shield,
  Zap,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  locales,
  LocaleCode,
  getLocaleMetadata,
  getCurrencyForLocale,
  currencySymbols,
  timezones,
  translationQuality,
  defaultLocale,
} from '@/lib/i18n';

interface LanguageSettings {
  locale: LocaleCode;
  autoTranslation: boolean;
  currency: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  timezone: string;
}

export default function LanguageSettingsPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [settings, setSettings] = useState<LanguageSettings>({
    locale: defaultLocale,
    autoTranslation: false,
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    timezone: 'America/New_York',
  });
  const [isLoading, setIsLoading] = useState(false);

  // Load saved settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('languageSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(parsed);
      } catch (error) {
        console.error('Failed to parse language settings:', error);
      }
    }
  }, []);

  // Filter languages based on search
  const filteredLocales = locales.filter(
    (locale) =>
      locale.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      locale.nativeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      locale.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle language selection
  const handleLanguageSelect = (code: LocaleCode) => {
    const locale = getLocaleMetadata(code);
    setSettings((prev) => ({
      ...prev,
      locale: code,
      currency: locale.currency,
      dateFormat: locale.dateFormat,
      timezone: timezones[code] || timezones.en,
    }));
  };

  // Save settings
  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      // Save to localStorage
      localStorage.setItem('languageSettings', JSON.stringify(settings));

      // In a real app, this would also save to the backend
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast({
        title: 'Settings Saved',
        description: 'Your language preferences have been saved successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save language settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const currentLocale = getLocaleMetadata(settings.locale);
  const quality = translationQuality[settings.locale];

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-blue-600 rounded-xl">
            <Globe className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Language & Region Settings
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Customize your language preferences and regional settings
            </p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Language Selection - Left Column */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 space-y-6"
        >
          {/* Current Language Card */}
          <Card className="border-2 border-blue-100 dark:border-blue-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                Current Language
              </CardTitle>
              <CardDescription>
                Your selected language and translation quality
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg">
                <div className="flex items-center gap-4">
                  <span className="text-4xl">{currentLocale.flag}</span>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {currentLocale.nativeName}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {currentLocale.name}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={quality.verified ? 'default' : 'secondary'} className="mb-2">
                    {quality.verified ? (
                      <>
                        <Shield className="h-3 w-3 mr-1" />
                        Verified
                      </>
                    ) : (
                      'Community'
                    )}
                  </Badge>
                  <div className="flex items-center gap-2">
                    <Progress value={quality.coverage} className="w-24 h-2" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {quality.coverage}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Translation Quality Details */}
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm mb-1">
                    <TrendingUp className="h-4 w-4" />
                    Coverage
                  </div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {quality.coverage}%
                  </div>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm mb-1">
                    <Info className="h-4 w-4" />
                    Translator
                  </div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {quality.translator}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Language Selector */}
          <Card>
            <CardHeader>
              <CardTitle>Select Language</CardTitle>
              <CardDescription>
                Choose from 15+ professionally translated languages
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search languages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Languages Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-2">
                {filteredLocales.map((locale, index) => {
                  const isSelected = locale.code === settings.locale;
                  const localeQuality = translationQuality[locale.code];

                  return (
                    <motion.button
                      key={locale.code}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      onClick={() => handleLanguageSelect(locale.code)}
                      className={`
                        relative p-4 rounded-lg border-2 transition-all text-left
                        ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50 dark:bg-blue-950'
                            : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-800'
                        }
                      `}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{locale.flag}</span>
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {locale.nativeName}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              {locale.name}
                            </div>
                          </div>
                        </div>
                        {isSelected && (
                          <div className="flex-shrink-0">
                            <div className="h-6 w-6 bg-blue-600 rounded-full flex items-center justify-center">
                              <Check className="h-4 w-4 text-white" />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Quality Indicator */}
                      <div className="flex items-center gap-2 mt-2">
                        <Progress value={localeQuality.coverage} className="h-1 flex-1" />
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {localeQuality.coverage}%
                        </span>
                      </div>

                      {/* Badges */}
                      <div className="flex items-center gap-2 mt-2">
                        {localeQuality.verified && (
                          <Badge variant="secondary" className="text-xs">
                            <Shield className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                        {localeQuality.coverage === 100 && (
                          <Badge variant="default" className="text-xs">
                            <Zap className="h-3 w-3 mr-1" />
                            Complete
                          </Badge>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Regional Settings - Right Column */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          {/* Auto-Translation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Auto-Translation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label htmlFor="auto-translation" className="text-base font-medium">
                    Enable Auto-Translation
                  </Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Automatically translate content not available in your language
                  </p>
                </div>
                <Switch
                  id="auto-translation"
                  checked={settings.autoTranslation}
                  onCheckedChange={(checked) =>
                    setSettings((prev) => ({ ...prev, autoTranslation: checked }))
                  }
                />
              </div>

              {settings.autoTranslation && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg"
                >
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                    <p className="text-sm text-blue-900 dark:text-blue-100">
                      Powered by professional translation services for accurate B2B content
                    </p>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>

          {/* Regional Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Regional Preferences
              </CardTitle>
              <CardDescription>
                Customize currency, date, and time formats
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Currency */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Currency
                </Label>
                <Select
                  value={settings.currency}
                  onValueChange={(value) =>
                    setSettings((prev) => ({ ...prev, currency: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(currencySymbols).map(([code, symbol]) => (
                      <SelectItem key={code} value={code}>
                        {symbol} {code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  All prices will be displayed in this currency
                </p>
              </div>

              <Separator />

              {/* Date Format */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date Format
                </Label>
                <Select
                  value={settings.dateFormat}
                  onValueChange={(value) =>
                    setSettings((prev) => ({ ...prev, dateFormat: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (US)</SelectItem>
                    <SelectItem value="DD/MM/YYYY">DD/MM/YYYY (EU)</SelectItem>
                    <SelectItem value="YYYY/MM/DD">YYYY/MM/DD (ISO)</SelectItem>
                    <SelectItem value="DD.MM.YYYY">DD.MM.YYYY (DE)</SelectItem>
                    <SelectItem value="DD-MM-YYYY">DD-MM-YYYY (NL)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Example: {new Date().toLocaleDateString()}
                </p>
              </div>

              <Separator />

              {/* Time Format */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Time Format
                </Label>
                <Select
                  value={settings.timeFormat}
                  onValueChange={(value: '12h' | '24h') =>
                    setSettings((prev) => ({ ...prev, timeFormat: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12h">12-hour (3:45 PM)</SelectItem>
                    <SelectItem value="24h">24-hour (15:45)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Timezone */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Time Zone
                </Label>
                <Select
                  value={settings.timezone}
                  onValueChange={(value) =>
                    setSettings((prev) => ({ ...prev, timezone: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {Object.entries(timezones).map(([code, zone]) => (
                      <SelectItem key={zone} value={zone}>
                        {zone.replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Used for order timestamps and scheduling
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <Button
            onClick={handleSaveSettings}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700"
            size="lg"
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>

          {/* Info Card */}
          <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-amber-600 mt-0.5" />
                <div className="text-sm text-amber-900 dark:text-amber-100">
                  <p className="font-medium mb-1">Language Settings</p>
                  <p>
                    Changes will take effect immediately. Some content may require a page
                    refresh to display in the new language.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Translation Quality Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-8"
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              Translation Quality Standards
            </CardTitle>
            <CardDescription>
              Understanding our translation verification process
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold text-green-900 dark:text-green-100">
                    Verified Translation
                  </h3>
                </div>
                <p className="text-sm text-green-800 dark:text-green-200">
                  Professionally translated and verified by native speakers for accuracy
                  and cultural context.
                </p>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                    100% Coverage
                  </h3>
                </div>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  All interface elements, messages, and content fully translated with no
                  fallbacks.
                </p>
              </div>

              <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                  <h3 className="font-semibold text-purple-900 dark:text-purple-100">
                    Regular Updates
                  </h3>
                </div>
                <p className="text-sm text-purple-800 dark:text-purple-200">
                  Translations updated regularly to include new features and improvements.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

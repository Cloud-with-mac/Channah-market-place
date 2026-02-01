'use client';

import { motion } from 'framer-motion';
import { DollarSign, Calendar, Clock, TrendingUp, ShoppingCart, Package } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage, useTranslation } from '@/hooks/use-language';

/**
 * Demo Component - Shows real-time formatting based on language settings
 * This demonstrates how the i18n system works in practice
 */
export function LanguageDemo() {
  const { formatCurrency, formatDate, formatNumber, formatTime } = useLanguage();
  const { t } = useTranslation();

  const demoData = {
    price: 1299.99,
    discount: 0.15,
    quantity: 1250,
    date: new Date('2024-01-29T14:30:00'),
  };

  return (
    <div className="mt-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Live Formatting Demo</CardTitle>
          <CardDescription>
            See how numbers, dates, and currencies adapt to your language settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Currency Formatting */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-lg border border-green-200 dark:border-green-800"
            >
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold text-green-900 dark:text-green-100">
                  Currency Format
                </h3>
              </div>
              <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                {formatCurrency(demoData.price)}
              </div>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                Product Price
              </p>
            </motion.div>

            {/* Date Formatting */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg border border-blue-200 dark:border-blue-800"
            >
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                  Date Format
                </h3>
              </div>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {formatDate(demoData.date, 'medium')}
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Order Date
              </p>
            </motion.div>

            {/* Time Formatting */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 rounded-lg border border-purple-200 dark:border-purple-800"
            >
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-purple-600" />
                <h3 className="font-semibold text-purple-900 dark:text-purple-100">
                  Time Format
                </h3>
              </div>
              <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {formatTime(demoData.date)}
              </div>
              <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                Order Time
              </p>
            </motion.div>

            {/* Percentage Formatting */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-950 rounded-lg border border-orange-200 dark:border-orange-800"
            >
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-orange-600" />
                <h3 className="font-semibold text-orange-900 dark:text-orange-100">
                  Percent Format
                </h3>
              </div>
              <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                {formatNumber(demoData.discount, 'percent')}
              </div>
              <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                Discount Rate
              </p>
            </motion.div>

            {/* Number Formatting */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="p-4 bg-gradient-to-br from-cyan-50 to-teal-50 dark:from-cyan-950 dark:to-teal-950 rounded-lg border border-cyan-200 dark:border-cyan-800"
            >
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-5 w-5 text-cyan-600" />
                <h3 className="font-semibold text-cyan-900 dark:text-cyan-100">
                  Number Format
                </h3>
              </div>
              <div className="text-2xl font-bold text-cyan-900 dark:text-cyan-100">
                {formatNumber(demoData.quantity)}
              </div>
              <p className="text-sm text-cyan-700 dark:text-cyan-300 mt-1">
                Units in Stock
              </p>
            </motion.div>

            {/* Translation Example */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="p-4 bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-950 dark:to-red-950 rounded-lg border border-rose-200 dark:border-rose-800"
            >
              <div className="flex items-center gap-2 mb-2">
                <ShoppingCart className="h-5 w-5 text-rose-600" />
                <h3 className="font-semibold text-rose-900 dark:text-rose-100">
                  Translation
                </h3>
              </div>
              <div className="text-2xl font-bold text-rose-900 dark:text-rose-100">
                {t('products.addToCart')}
              </div>
              <p className="text-sm text-rose-700 dark:text-rose-300 mt-1">
                Localized Button Text
              </p>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

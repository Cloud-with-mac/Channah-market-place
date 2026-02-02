'use client'

import { useEffect, useState } from 'react'
import { Globe, ChevronDown, Check, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { useCurrencyStore, currencies, Currency } from '@/store'
import { cn } from '@/lib/utils'

export function CurrencySelector() {
  const { currency, isLoading, setCurrency, detectCountry, fetchExchangeRates } = useCurrencyStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    detectCountry()
    fetchExchangeRates()
  }, [detectCountry, fetchExchangeRates])

  const filteredCurrencies = currencies.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSelect = (curr: Currency) => {
    setCurrency(curr.code)
    setIsOpen(false)
    setSearchQuery('')
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-1.5 px-2 hover:bg-cyan/10"
          disabled={isLoading}
        >
          <Globe size={16} className="text-cyan" />
          <span className="text-sm font-medium">{currency.flag} {currency.code}</span>
          <ChevronDown size={14} className="text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 p-2 bg-card border-border">
        <div className="px-2 pb-2">
          <p className="text-xs font-medium text-muted-foreground mb-2">Select Currency</p>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search currency..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border bg-background py-2 pl-8 pr-3 text-sm focus:outline-none focus:border-cyan"
            />
          </div>
        </div>
        <DropdownMenuSeparator />
        <div className="max-h-[300px] overflow-y-auto">
          {filteredCurrencies.map((curr) => (
            <DropdownMenuItem
              key={curr.code}
              onClick={() => handleSelect(curr)}
              className={cn(
                'flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer',
                curr.code === currency.code && 'bg-cyan/10'
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{curr.flag}</span>
                <div>
                  <p className="font-medium text-sm">{curr.code}</p>
                  <p className="text-xs text-muted-foreground">{curr.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{curr.symbol}</span>
                {curr.code === currency.code && (
                  <Check size={16} className="text-cyan" />
                )}
              </div>
            </DropdownMenuItem>
          ))}
          {filteredCurrencies.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-4">
              No currency found
            </p>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Search, Sparkles, Loader2, X, TrendingUp } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { aiAPI } from '@/lib/api'
import { useDebounce } from '@/hooks/use-debounce'

interface AISearchBarProps {
  className?: string
  placeholder?: string
  defaultValue?: string
}

export function AISearchBar({
  className,
  placeholder = 'Search products...',
  defaultValue = '',
}: AISearchBarProps) {
  const router = useRouter()
  const [query, setQuery] = React.useState(defaultValue)
  const [suggestions, setSuggestions] = React.useState<string[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [isFocused, setIsFocused] = React.useState(false)
  const [selectedIndex, setSelectedIndex] = React.useState(-1)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const debouncedQuery = useDebounce(query, 300)

  // Fetch AI suggestions
  React.useEffect(() => {
    const fetchSuggestions = async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        setSuggestions([])
        return
      }

      setIsLoading(true)
      try {
        const response = await aiAPI.getSearchSuggestions(debouncedQuery)
        setSuggestions(response.data || [])
      } catch (error) {
        console.error('Failed to fetch suggestions:', error)
        setSuggestions([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchSuggestions()
  }, [debouncedQuery])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!suggestions.length) {
      if (e.key === 'Enter' && query) {
        handleSearch(query)
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0) {
          handleSearch(suggestions[selectedIndex])
        } else if (query) {
          handleSearch(query)
        }
        break
      case 'Escape':
        setIsFocused(false)
        inputRef.current?.blur()
        break
    }
  }

  const handleSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return
    router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    setIsFocused(false)
    setSuggestions([])
  }

  const handleClear = () => {
    setQuery('')
    setSuggestions([])
    inputRef.current?.focus()
  }

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const showDropdown = isFocused && (suggestions.length > 0 || isLoading)

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setSelectedIndex(-1)
          }}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="pl-10 pr-10"
        />
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg z-50 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">
                Getting suggestions...
              </span>
            </div>
          ) : (
            <>
              {/* AI Badge */}
              <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 border-b">
                <Sparkles className="h-3 w-3 text-primary" />
                <span className="text-xs text-muted-foreground">
                  AI-powered suggestions
                </span>
              </div>

              {/* Suggestions List */}
              <ul className="py-1">
                {suggestions.map((suggestion, index) => (
                  <li key={index}>
                    <button
                      type="button"
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2 text-left text-sm transition-colors',
                        index === selectedIndex
                          ? 'bg-accent text-accent-foreground'
                          : 'hover:bg-accent/50'
                      )}
                      onClick={() => handleSearch(suggestion)}
                      onMouseEnter={() => setSelectedIndex(index)}
                    >
                      <TrendingUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">{suggestion}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  )
}

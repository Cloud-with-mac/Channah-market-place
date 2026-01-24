'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  User,
  Package,
  ShoppingCart,
  Store,
  Tag,
  FileText,
  Loader2,
  ArrowRight,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { adminAPI } from '@/lib/api'
import { cn } from '@/lib/utils'

interface SearchResult {
  id: string
  type: 'user' | 'product' | 'order' | 'vendor' | 'category'
  title: string
  subtitle?: string
  href: string
}

const typeIcons = {
  user: User,
  product: Package,
  order: ShoppingCart,
  vendor: Store,
  category: Tag,
}

const typeLabels = {
  user: 'User',
  product: 'Product',
  order: 'Order',
  vendor: 'Vendor',
  category: 'Category',
}

interface CommandSearchProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CommandSearch({ open, onOpenChange }: CommandSearchProps) {
  const router = useRouter()
  const [query, setQuery] = React.useState('')
  const [results, setResults] = React.useState<SearchResult[]>([])
  const [loading, setLoading] = React.useState(false)
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Focus input when dialog opens
  React.useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0)
      setQuery('')
      setResults([])
      setSelectedIndex(0)
    }
  }, [open])

  // Debounced search
  React.useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const searchResults: SearchResult[] = []

        // Search users
        try {
          const usersRes = await adminAPI.getUsers({ search: query, limit: 3 })
          const users = usersRes.data?.results || usersRes.data || []
          users.forEach((user: any) => {
            searchResults.push({
              id: user.id,
              type: 'user',
              title: `${user.first_name} ${user.last_name}`,
              subtitle: user.email,
              href: `/users?search=${user.email}`,
            })
          })
        } catch (e) {}

        // Search products
        try {
          const productsRes = await adminAPI.getProducts({ search: query, limit: 3 })
          const products = productsRes.data?.results || productsRes.data || []
          products.forEach((product: any) => {
            searchResults.push({
              id: product.id,
              type: 'product',
              title: product.name,
              subtitle: `$${product.price}`,
              href: `/products?search=${product.name}`,
            })
          })
        } catch (e) {}

        // Search orders
        try {
          const ordersRes = await adminAPI.getOrders({ search: query, limit: 3 })
          const orders = ordersRes.data?.results || ordersRes.data || []
          orders.forEach((order: any) => {
            searchResults.push({
              id: order.id,
              type: 'order',
              title: `Order #${order.order_number || order.id.slice(0, 8)}`,
              subtitle: order.status,
              href: `/orders?search=${order.order_number || order.id}`,
            })
          })
        } catch (e) {}

        // Search vendors
        try {
          const vendorsRes = await adminAPI.getVendors({ search: query, limit: 3 })
          const vendors = vendorsRes.data?.results || vendorsRes.data || []
          vendors.forEach((vendor: any) => {
            searchResults.push({
              id: vendor.id,
              type: 'vendor',
              title: vendor.business_name,
              subtitle: vendor.status,
              href: `/vendors?search=${vendor.business_name}`,
            })
          })
        } catch (e) {}

        // Search categories
        try {
          const categoriesRes = await adminAPI.getCategories()
          const categories = categoriesRes.data?.results || categoriesRes.data || []
          const filtered = categories.filter((cat: any) =>
            cat.name.toLowerCase().includes(query.toLowerCase())
          ).slice(0, 3)
          filtered.forEach((category: any) => {
            searchResults.push({
              id: category.id,
              type: 'category',
              title: category.name,
              subtitle: `/${category.slug}`,
              href: `/categories`,
            })
          })
        } catch (e) {}

        setResults(searchResults)
        setSelectedIndex(0)
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault()
      router.push(results[selectedIndex].href)
      onOpenChange(false)
    }
  }

  const handleSelect = (result: SearchResult) => {
    router.push(result.href)
    onOpenChange(false)
  }

  // Group results by type
  const groupedResults = React.useMemo(() => {
    const groups: Record<string, SearchResult[]> = {}
    results.forEach((result) => {
      if (!groups[result.type]) {
        groups[result.type] = []
      }
      groups[result.type].push(result)
    })
    return groups
  }, [results])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 max-w-lg overflow-hidden">
        <div className="flex items-center border-b px-3">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search users, orders, products, vendors..."
            className="border-0 focus-visible:ring-0 h-12"
          />
          {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>

        <ScrollArea className="max-h-[400px]">
          {query && !loading && results.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>No results found for "{query}"</p>
              <p className="text-sm mt-1">Try searching with different keywords</p>
            </div>
          )}

          {!query && (
            <div className="p-6 text-center text-muted-foreground">
              <Search className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>Start typing to search</p>
              <p className="text-sm mt-1">Search across users, orders, products, and vendors</p>
            </div>
          )}

          {Object.entries(groupedResults).map(([type, items]) => {
            const Icon = typeIcons[type as keyof typeof typeIcons]
            return (
              <div key={type}>
                <div className="px-3 py-2 text-xs font-medium text-muted-foreground bg-muted/50">
                  {typeLabels[type as keyof typeof typeLabels]}s
                </div>
                {items.map((result, idx) => {
                  const globalIndex = results.indexOf(result)
                  return (
                    <button
                      key={result.id}
                      onClick={() => handleSelect(result)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-3 text-left hover:bg-muted/50 transition-colors',
                        globalIndex === selectedIndex && 'bg-muted'
                      )}
                    >
                      <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{result.title}</p>
                        {result.subtitle && (
                          <p className="text-sm text-muted-foreground truncate">
                            {result.subtitle}
                          </p>
                        )}
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </button>
                  )
                })}
              </div>
            )
          })}
        </ScrollArea>

        <div className="flex items-center justify-between px-3 py-2 border-t bg-muted/30 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono">↑↓</kbd>
            <span>Navigate</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono">Enter</kbd>
            <span>Select</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono">Esc</kbd>
            <span>Close</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

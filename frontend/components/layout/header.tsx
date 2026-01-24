'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  ShoppingCart,
  Heart,
  User,
  Menu,
  X,
  ChevronDown,
  Package,
  LogOut,
  Settings,
  Bell,
  MessageCircle,
  MapPin,
  Crown,
  Loader2,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuthStore, useCartStore, useSearchStore } from '@/store'
import { CurrencySelector } from '@/components/currency-selector'
import { categoriesAPI } from '@/lib/api'

interface Category {
  id: string
  name: string
  slug: string
  icon?: string
}

export function Header() {
  const router = useRouter()
  const { user, isAuthenticated, logout } = useAuthStore()
  const { itemCount, openCart } = useCartStore()
  const { query, setQuery, openSearch } = useSearchStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)

  // Fetch categories from database
  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await categoriesAPI.getAll()
        const cats = res.data?.results || res.data || []
        setCategories(cats)
      } catch (error) {
        console.error('Failed to fetch categories:', error)
        setCategories([])
      } finally {
        setLoadingCategories(false)
      }
    }
    fetchCategories()
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  // Show only first 8 categories in navbar (rest in dropdown)
  const navbarCategories = categories.slice(0, 8)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      {/* Top bar - SophieX Dark Theme */}
      <div className="hidden md:block bg-gradient-to-r from-cyan-dark via-primary to-cyan text-primary-foreground">
        <div className="container flex h-9 items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="animate-pulse">✨</span>
              Free worldwide shipping on orders over £50
            </span>
            <span className="text-white/30">|</span>
            <span className="text-white/90">24/7 Customer Support</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/help" className="hover:text-white/80 transition-colors">
              Help Centre
            </Link>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="container">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Mobile menu button */}
          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Logo - SophieX Dark Theme */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan to-cyan-light text-navy font-bold shadow-lg shadow-cyan/20 group-hover:shadow-xl group-hover:shadow-cyan/30 group-hover:scale-105 transition-all duration-300">
              <span className="text-2xl font-display">C</span>
              <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-background border-2 border-cyan flex items-center justify-center">
                <div className="h-2 w-2 rounded-full bg-gradient-to-br from-cyan to-cyan-light" />
              </div>
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="text-xl font-bold font-display leading-tight text-gradient-premium">
                Channah
              </span>
              <span className="text-[10px] font-semibold text-cyan uppercase tracking-wider -mt-0.5">Global Marketplace</span>
            </div>
          </Link>

          {/* Search bar - SophieX Dark Theme */}
          <form
            onSubmit={handleSearch}
            className="hidden md:flex flex-1 max-w-2xl mx-4"
          >
            <div className="relative w-full group">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground group-focus-within:text-cyan transition-colors" />
              <input
                type="search"
                placeholder="Search products, brands, sellers worldwide..."
                className="w-full rounded-2xl border-2 border-border bg-card py-3 pl-12 pr-28 text-sm focus:outline-none focus:border-cyan focus:bg-navy-light focus:shadow-lg focus:shadow-cyan/10 transition-all duration-300 placeholder:text-muted-foreground"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button
                type="submit"
                size="sm"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-xl px-5 h-9 bg-gradient-to-r from-cyan to-cyan-light text-navy hover:opacity-90 shadow-md shadow-cyan/20 hover:shadow-lg hover:shadow-cyan/30 transition-all"
              >
                Search
              </Button>
            </div>
          </form>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            {/* Mobile search */}
            <button
              className="md:hidden p-2 hover:bg-muted rounded-full"
              onClick={openSearch}
            >
              <Search size={20} />
            </button>

            {/* Currency Selector */}
            <CurrencySelector />

            {/* AI Chat */}
            <Button variant="ghost" size="icon" asChild>
              <Link href="/chat">
                <MessageCircle size={20} />
                <span className="sr-only">AI Assistant</span>
              </Link>
            </Button>

            {/* Wishlist */}
            <Button variant="ghost" size="icon" asChild>
              <Link href="/wishlist">
                <Heart size={20} />
                <span className="sr-only">Wishlist</span>
              </Link>
            </Button>

            {/* Cart */}
            <Button
              variant="ghost"
              size="icon"
              className="relative hover:bg-cyan/10"
              onClick={openCart}
            >
              <ShoppingCart size={20} />
              {itemCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-cyan to-cyan-light text-[10px] font-bold text-navy shadow-md shadow-cyan/20">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
              <span className="sr-only">Cart</span>
            </Button>

            {/* User menu */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <User size={20} />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-64 p-0 overflow-hidden">
                    {/* Customer Header - Cyan/Blue Theme */}
                    <div className="bg-gradient-to-r from-cyan-600 to-primary p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 border-2 border-white/30">
                          <AvatarImage src={user?.avatar_url || user?.avatar} />
                          <AvatarFallback className="bg-cyan-700 text-white font-semibold">
                            {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">
                            {user?.first_name} {user?.last_name}
                          </p>
                          <p className="text-xs text-cyan-100 truncate">{user?.email}</p>
                        </div>
                      </div>
                      <Badge className="mt-3 bg-white/20 hover:bg-white/30 text-white border-0">
                        <Crown className="h-3 w-3 mr-1" />
                        Customer
                      </Badge>
                    </div>

                    {/* Customer Menu Items */}
                    <div className="p-1">
                      <DropdownMenuItem asChild>
                        <Link href="/account" className="flex items-center gap-3 px-3 py-2.5">
                          <User size={16} className="text-cyan-600" />
                          <span>My Account</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/account/orders" className="flex items-center gap-3 px-3 py-2.5">
                          <Package size={16} className="text-cyan-600" />
                          <span>My Orders</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/wishlist" className="flex items-center gap-3 px-3 py-2.5">
                          <Heart size={16} className="text-cyan-600" />
                          <span>Wishlist</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/account/addresses" className="flex items-center gap-3 px-3 py-2.5">
                          <MapPin size={16} className="text-cyan-600" />
                          <span>Addresses</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/notifications" className="flex items-center gap-3 px-3 py-2.5">
                          <Bell size={16} className="text-cyan-600" />
                          <span>Notifications</span>
                        </Link>
                      </DropdownMenuItem>

                      {user?.role === 'admin' && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href="/admin" className="flex items-center gap-3 px-3 py-2.5">
                              <Settings size={16} className="text-purple-600" />
                              <span>Admin Panel</span>
                            </Link>
                          </DropdownMenuItem>
                        </>
                      )}

                    </div>

                    <DropdownMenuSeparator />
                    <div className="p-1">
                      <DropdownMenuItem onClick={handleLogout} className="text-red-600 px-3 py-2.5">
                        <LogOut size={16} className="mr-3" />
                        Sign Out
                      </DropdownMenuItem>
                    </div>
                  </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">Login</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/register">Sign Up</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Categories bar - SophieX Dark Theme */}
      <nav className="hidden lg:block border-t border-border bg-card/50">
        <div className="container">
          <ul className="flex items-center h-11 text-sm">
            {/* All Categories Dropdown */}
            <li className="shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1.5 font-medium hover:text-cyan px-3 py-1.5 rounded-lg hover:bg-cyan/10 transition-colors">
                  <Menu size={16} />
                  All Categories
                  <ChevronDown size={14} />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64 p-2 bg-card border-border max-h-[70vh] overflow-y-auto">
                  {loadingCategories ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : categories.length > 0 ? (
                    categories.map((cat) => (
                      <DropdownMenuItem key={cat.id} asChild>
                        <Link href={`/category/${cat.slug}`} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-cyan/10">
                          <span className="font-medium">{cat.name}</span>
                        </Link>
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                      No categories yet
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </li>
            <li className="text-border shrink-0 mx-1">|</li>
            <li className="shrink-0">
              <Link href="/deals" className="px-2 py-1.5 rounded-lg hover:bg-cyan/10 hover:text-cyan font-medium transition-colors flex items-center gap-1 whitespace-nowrap">
                <span className="text-cyan">🔥</span>
                Deals
              </Link>
            </li>
            {/* Categories - show up to 8 */}
            {navbarCategories.map((cat) => (
              <li key={cat.id} className="shrink-0">
                <Link href={`/category/${cat.slug}`} className="px-2 py-1.5 rounded-lg hover:bg-cyan/10 hover:text-cyan transition-colors whitespace-nowrap text-sm">
                  {cat.name}
                </Link>
              </li>
            ))}
            {/* Spacer */}
            <li className="flex-1" />
            {/* Right side links */}
            <li className="shrink-0">
              <Link href="/new-arrivals" className="px-2 py-1.5 rounded-lg hover:bg-cyan/10 hover:text-cyan transition-colors whitespace-nowrap text-sm">
                New Arrivals
              </Link>
            </li>
            <li className="shrink-0">
              <Link href="/best-sellers" className="px-2 py-1.5 rounded-lg hover:bg-cyan/10 hover:text-cyan transition-colors whitespace-nowrap text-sm">
                Best Sellers
              </Link>
            </li>
            <li className="shrink-0">
              <Link href="/vendors" className="px-2 py-1.5 rounded-lg hover:bg-cyan/10 hover:text-cyan transition-colors whitespace-nowrap text-sm">
                Sellers
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t">
          <div className="container py-4 space-y-4">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  placeholder="Search..."
                  className="w-full rounded-lg border bg-muted/50 py-2 pl-10 pr-4 text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </form>
            <nav className="space-y-2">
              {loadingCategories ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : categories.length > 0 ? (
                categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/category/${cat.slug}`}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {cat.name}
                  </Link>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No categories available
                </p>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  )
}

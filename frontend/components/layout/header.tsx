'use client'

import Link from 'next/link'
import Image from 'next/image'
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
  FileText,
  Grid3x3,
  Beaker,
  Sun,
  Moon,
} from 'lucide-react'
import { useTheme } from 'next-themes'
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
import { useAuthStore, useCartStore, useSearchStore, useSampleCartStore } from '@/store'
import { CurrencySelector } from '@/components/currency-selector'
import { categoriesAPI } from '@/lib/api'
import { MegaMenu } from './mega-menu'

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
  const { itemCount: sampleItemCount, openCart: openSampleCart } = useSampleCartStore()
  const { query, setQuery, openSearch } = useSearchStore()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [megaMenuOpen, setMegaMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)

  useEffect(() => { setMounted(true) }, [])

  // Fetch categories from database
  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await categoriesAPI.getAll()
        const cats = res.results || res || []
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
      {/* Top bar - B2B Focus */}
      <div className="hidden md:block bg-gradient-to-r from-primary via-primary to-accent text-primary-foreground">
        <div className="container flex h-9 items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-medium">
              <span>🌍</span>
              Ship to 200+ countries with trade assurance
            </span>
            <span className="text-white/30">|</span>
            <span className="text-white/90">Verified Suppliers</span>
            <span className="text-white/30">|</span>
            <span className="text-white/90">Buyer Protection</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/sell" className="hover:text-white/80 transition-colors font-medium">
              Sell on Channah
            </Link>
            <span className="text-white/30">|</span>
            <Link href="/help" className="hover:text-white/80 transition-colors">
              Help Center
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

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <Image src="/logo-icon.svg" alt="" width={38} height={38} priority className="shrink-0 group-hover:scale-105 transition-transform" />
            <div className="hidden sm:flex flex-col">
              <span className="text-xl font-bold font-display leading-tight text-foreground whitespace-nowrap">
                Channah
              </span>
              <span className="text-[8px] font-semibold text-muted-foreground uppercase tracking-[0.12em] -mt-0.5 whitespace-nowrap">The Trusted Center for Everything</span>
            </div>
          </Link>

          {/* Search bar */}
          <form
            onSubmit={handleSearch}
            className="hidden md:flex flex-1 max-w-2xl mx-4"
          >
            <div className="relative w-full group">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input
                type="search"
                placeholder="Search for products, suppliers, or categories..."
                className="w-full rounded-2xl border-2 border-border bg-card py-3 pl-12 pr-28 text-sm focus:outline-none focus:border-primary focus:shadow-lg focus:shadow-primary/10 transition-all duration-300 placeholder:text-muted-foreground"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button
                type="submit"
                size="sm"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-xl px-5 h-9 bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all"
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

            {/* Theme Toggle */}
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </Button>
            )}

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

            {/* Sample Cart */}
            <Button
              variant="ghost"
              size="icon"
              className="relative hover:bg-purple-50 dark:hover:bg-purple-950/20"
              onClick={openSampleCart}
              title="Sample Orders"
            >
              <Beaker size={20} className="text-purple-600" />
              {sampleItemCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-[10px] font-bold text-white shadow-md shadow-purple/20">
                  {sampleItemCount > 99 ? '99+' : sampleItemCount}
                </span>
              )}
              <span className="sr-only">Sample Cart</span>
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

      {/* Categories bar - Alibaba Style */}
      <nav className="hidden lg:block border-t border-border bg-card/50 relative">
        <div className="container">
          <ul className="flex items-center h-12 text-sm">
            {/* All Categories Mega Menu */}
            <li className="shrink-0">
              <button
                className="flex items-center gap-2 font-semibold hover:text-primary px-4 py-2 rounded-lg hover:bg-primary/5 transition-colors h-12 bg-primary text-primary-foreground"
                onMouseEnter={() => setMegaMenuOpen(true)}
                onMouseLeave={() => setMegaMenuOpen(false)}
                onClick={() => setMegaMenuOpen(!megaMenuOpen)}
              >
                <Grid3x3 size={16} />
                All Categories
                <ChevronDown size={14} />
              </button>
            </li>
            <li className="text-border shrink-0 mx-1">|</li>
            {/* Quick Links */}
            <li className="shrink-0">
              <Link href="/deals" className="px-3 py-2 rounded-lg hover:bg-primary/5 hover:text-primary transition-colors flex items-center gap-1.5 whitespace-nowrap font-medium">
                <span>🔥</span>
                Hot Deals
              </Link>
            </li>
            <li className="shrink-0">
              <Link href="/new-arrivals" className="px-3 py-2 rounded-lg hover:bg-primary/5 hover:text-primary transition-colors whitespace-nowrap">
                New Arrivals
              </Link>
            </li>
            <li className="shrink-0">
              <Link href="/best-sellers" className="px-3 py-2 rounded-lg hover:bg-primary/5 hover:text-primary transition-colors whitespace-nowrap">
                Best Sellers
              </Link>
            </li>
            <li className="shrink-0">
              <Link href="/vendors" className="px-3 py-2 rounded-lg hover:bg-primary/5 hover:text-primary transition-colors whitespace-nowrap">
                Find Suppliers
              </Link>
            </li>
            {/* Spacer */}
            <li className="flex-1" />
            {/* Request Quote Button - B2B Feature */}
            <li className="shrink-0">
              <Button size="sm" variant="outline" className="border-primary/30 hover:bg-primary hover:text-primary-foreground" asChild>
                <Link href="/products" className="flex items-center gap-2">
                  <FileText size={16} />
                  Request Quote
                </Link>
              </Button>
            </li>
          </ul>
        </div>

        {/* Mega Menu */}
        <div
          onMouseEnter={() => setMegaMenuOpen(true)}
          onMouseLeave={() => setMegaMenuOpen(false)}
        >
          <MegaMenu
            isOpen={megaMenuOpen}
            onClose={() => setMegaMenuOpen(false)}
          />
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

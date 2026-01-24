'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store'
import { AdminSidebar } from '@/components/admin'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Menu, Bell, User, LogOut, Shield } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, isAuthenticated, isLoading, logout } = useAuthStore()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/admin')
    }
  }, [isLoading, isAuthenticated, router])

  React.useEffect(() => {
    if (!isLoading && user && user.role !== 'admin') {
      router.push('/')
    }
  }, [isLoading, user, router])

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex h-screen">
          <div className="hidden lg:block lg:w-64 border-r bg-card">
            <div className="p-6 space-y-4">
              <Skeleton className="h-8 w-32" />
              <div className="space-y-2">
                {[...Array(8)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            </div>
          </div>
          <div className="flex-1 p-6">
            <Skeleton className="h-10 w-64 mb-6" />
            <div className="grid gap-4 md:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar for desktop */}
      <AdminSidebar />

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top header */}
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background px-4 lg:px-6">
          {/* Mobile menu */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="flex items-center gap-2 h-16 px-6 border-b">
                <Shield className="h-6 w-6 text-primary" />
                <span className="font-bold text-lg font-display">Admin Panel</span>
              </div>
              <nav className="flex flex-col gap-1 p-4">
                <Button variant="ghost" className="justify-start" asChild onClick={() => setIsMobileMenuOpen(false)}>
                  <Link href="/admin">Dashboard</Link>
                </Button>
                <Button variant="ghost" className="justify-start" asChild onClick={() => setIsMobileMenuOpen(false)}>
                  <Link href="/admin/users">Users</Link>
                </Button>
                <Button variant="ghost" className="justify-start" asChild onClick={() => setIsMobileMenuOpen(false)}>
                  <Link href="/admin/vendors">Vendors</Link>
                </Button>
                <Button variant="ghost" className="justify-start" asChild onClick={() => setIsMobileMenuOpen(false)}>
                  <Link href="/admin/products">Products</Link>
                </Button>
                <Button variant="ghost" className="justify-start" asChild onClick={() => setIsMobileMenuOpen(false)}>
                  <Link href="/admin/orders">Orders</Link>
                </Button>
                <Button variant="ghost" className="justify-start" asChild onClick={() => setIsMobileMenuOpen(false)}>
                  <Link href="/admin/reviews">Reviews</Link>
                </Button>
                <Button variant="ghost" className="justify-start" asChild onClick={() => setIsMobileMenuOpen(false)}>
                  <Link href="/admin/settings">Settings</Link>
                </Button>
              </nav>
            </SheetContent>
          </Sheet>

          <div className="flex-1" />

          {/* Notifications */}
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
            <span className="sr-only">Notifications</span>
          </Button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user?.avatar_url} alt={user?.first_name || 'Admin'} />
                  <AvatarFallback>
                    {user?.first_name?.charAt(0).toUpperCase() || 'A'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="font-medium">{user?.first_name} {user?.last_name}</span>
                  <span className="text-xs text-muted-foreground">{user?.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/account/profile">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}

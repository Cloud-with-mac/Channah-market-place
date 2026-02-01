'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Bell,
  Search,
  Menu,
  LogOut,
  Settings,
  User,
  Moon,
  Sun,
  MessageSquare,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAuthStore, useSidebarStore, useNotificationStore, useThemeStore, useMessagesStore } from '@/store'
import { getInitials, formatRelativeTime } from '@/lib/utils'
import { CommandSearch } from './command-search'

export function AdminHeader() {
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const { setMobileOpen, isCollapsed } = useSidebarStore()
  const { unreadCount, notifications, markAsRead, markAllAsRead } = useNotificationStore()
  const { theme, setTheme } = useThemeStore()
  const { unreadMessagesCount } = useMessagesStore()
  const [searchOpen, setSearchOpen] = React.useState(false)

  // Keyboard shortcut for search (Ctrl+K)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const handleNotificationClick = (notification: typeof notifications[0]) => {
    markAsRead(notification.id)
    if (notification.link) {
      router.push(notification.link)
    }
  }

  return (
    <header
      className={`fixed top-0 right-0 z-30 h-16 border-b bg-background/95 backdrop-blur transition-all duration-300 ${
        isCollapsed ? 'left-[70px]' : 'left-[260px]'
      }`}
    >
      <div className="flex h-full items-center justify-between px-4 gap-4">
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Search */}
        <div className="flex-1 max-w-md hidden sm:block">
          <button
            onClick={() => setSearchOpen(true)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 text-muted-foreground hover:bg-muted transition-colors text-sm"
          >
            <Search className="h-4 w-4" />
            <span className="flex-1 text-left">Search users, orders, products...</span>
            <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium">
              <span className="text-xs">Ctrl</span>K
            </kbd>
          </button>
        </div>

        {/* Command Search Dialog */}
        <CommandSearch open={searchOpen} onOpenChange={setSearchOpen} />

        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          {/* AI Assistant Quick Access */}
          <Button variant="ghost" size="icon" asChild className="hidden md:flex">
            <Link href="/ai-assistant">
              <Sparkles className="h-5 w-5 text-primary" />
            </Link>
          </Button>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="relative hover:bg-muted"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <div className="relative">
              {theme === 'dark' ? (
                <Sun className="h-5 w-5 text-amber-400 hover:text-amber-300 transition-all hover:rotate-90 duration-500 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
              ) : (
                <Moon className="h-5 w-5 text-slate-700 hover:text-slate-900 transition-all hover:-rotate-12 duration-300" />
              )}
            </div>
            <span className="sr-only">
              {theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            </span>
          </Button>

          {/* Notifications */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[calc(100vw-2rem)] sm:w-96 max-w-md p-0">
              <div className="flex items-center justify-between p-3 sm:p-4 border-b">
                <h4 className="text-sm sm:text-base font-semibold">Notifications</h4>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[10px] sm:text-xs h-7 sm:h-8"
                    onClick={markAllAsRead}
                  >
                    Mark all read
                  </Button>
                )}
              </div>
              <ScrollArea className="h-[250px] sm:h-[300px] md:h-[350px]">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 sm:py-12 px-4 text-center">
                    <Bell className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-3 sm:mb-4" />
                    <p className="text-xs sm:text-sm font-medium mb-1">No notifications</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      You're all caught up! Notifications will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 sm:p-4 hover:bg-muted/50 cursor-pointer transition-colors ${
                          !notification.read ? 'bg-primary/5' : ''
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex gap-2 sm:gap-3">
                          <div
                            className={`h-2 w-2 mt-1.5 sm:mt-2 rounded-full shrink-0 ${
                              !notification.read ? 'bg-primary' : 'bg-transparent'
                            }`}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-medium line-clamp-1">
                              {notification.title}
                            </p>
                            <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-2 mt-0.5">
                              {notification.message}
                            </p>
                            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                              {formatRelativeTime(notification.timestamp)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
              {notifications.length > 0 && (
                <div className="p-2 border-t">
                  <Button variant="ghost" className="w-full text-xs sm:text-sm" size="sm" asChild>
                    <Link href="/notifications">View all notifications</Link>
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>

          {/* Messages */}
          <Button variant="ghost" size="icon" className="relative" asChild>
            <Link href="/support">
              <MessageSquare className="h-5 w-5" />
              {unreadMessagesCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                </Badge>
              )}
            </Link>
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user?.avatar} alt={user?.first_name} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {user ? getInitials(`${user.first_name} ${user.last_name}`) : 'AD'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                  <Badge variant="outline" className="w-fit mt-1">
                    {user?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                  </Badge>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

'use client'

import * as React from 'react'
import { MessageCircle, Sparkles, Bot, Headphones } from 'lucide-react'
import { AIChatDrawer } from './ai-chat-drawer'
import { SupportChatWidget } from '@/components/chat/support-chat-widget'
import { cn } from '@/lib/utils'

export function AIChatWidget() {
  const [activeChat, setActiveChat] = React.useState<'none' | 'ai' | 'support'>('none')
  const [hasNewMessage, setHasNewMessage] = React.useState(false)
  const [isHovered, setIsHovered] = React.useState(false)
  const [showMenu, setShowMenu] = React.useState(false)

  const handleMainClick = () => {
    setShowMenu(prev => !prev)
    setHasNewMessage(false)
  }

  const openAI = () => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname) + '&reason=chat'
      return
    }
    setActiveChat('ai')
    setShowMenu(false)
  }

  const openSupport = () => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname) + '&reason=support'
      return
    }
    setActiveChat('support')
    setShowMenu(false)
  }

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-6 right-6 z-50 group">
        {/* Selection menu */}
        {showMenu && activeChat === 'none' && (
          <div className="absolute bottom-20 right-0 flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <button
              onClick={openSupport}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card border shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 whitespace-nowrap"
            >
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <Headphones className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium">Chat with Support</p>
                <p className="text-[10px] text-muted-foreground">Talk to a real person</p>
              </div>
            </button>
            <button
              onClick={openAI}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card border shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 whitespace-nowrap"
            >
              <div className="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-900/30">
                <Bot className="h-4 w-4 text-cyan-600 dark:text-cyan" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium">Chat with Channah</p>
                <p className="text-[10px] text-muted-foreground">AI shopping assistant</p>
              </div>
            </button>
          </div>
        )}

        <button
          onClick={handleMainClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="relative"
        >
          {/* Animated glow effect */}
          <div className={cn(
            'absolute inset-0 rounded-full bg-gradient-to-r from-cyan via-cyan-light to-cyan bg-[length:200%_100%] animate-gradient blur-xl opacity-60 transition-opacity duration-300',
            isHovered ? 'opacity-80' : 'opacity-60'
          )} />

          {/* Pulse rings */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan to-cyan-light opacity-30 animate-ping" />
          <div className="absolute inset-1 rounded-full bg-cyan/20 animate-pulse" />

          {/* Main button */}
          <div className={cn(
            'relative h-16 w-16 rounded-2xl bg-gradient-to-br from-cyan via-cyan-dark to-cyan-light flex items-center justify-center shadow-2xl shadow-cyan/30 transition-all duration-300',
            isHovered && 'scale-110 rotate-3',
            hasNewMessage && 'animate-bounce'
          )}>
            <div className="relative">
              <Bot className="h-6 w-6 text-navy" />
              <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-navy animate-pulse" />
            </div>
          </div>

          {/* New message indicator */}
          {hasNewMessage && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 border-2 border-background flex items-center justify-center text-[10px] text-white font-bold animate-pulse">
              1
            </span>
          )}

          {/* Tooltip */}
          <span className={cn(
            'absolute -top-12 left-1/2 -translate-x-1/2 bg-card text-foreground text-xs px-3 py-1.5 rounded-full whitespace-nowrap shadow-lg shadow-cyan/20 border border-cyan/30 transition-all duration-300',
            isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
          )}>
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-cyan" />
              Need help?
            </span>
            {/* Arrow */}
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-card border-r border-b border-cyan/30 rotate-45" />
          </span>
        </button>
      </div>

      {/* AI Chat Drawer */}
      <AIChatDrawer open={activeChat === 'ai'} onOpenChange={(open) => { if (!open) setActiveChat('none') }} />

      {/* Support Chat Widget */}
      <SupportChatWidget open={activeChat === 'support'} onOpenChange={(open) => { if (!open) setActiveChat('none') }} />
    </>
  )
}

'use client'

import * as React from 'react'
import { MessageCircle, Sparkles, Bot } from 'lucide-react'
import { AIChatDrawer } from './ai-chat-drawer'
import { cn } from '@/lib/utils'

export function AIChatWidget() {
  const [isOpen, setIsOpen] = React.useState(false)
  const [hasNewMessage, setHasNewMessage] = React.useState(false)
  const [isHovered, setIsHovered] = React.useState(false)

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-6 right-6 z-50 group">
        <button
          onClick={() => {
            setIsOpen(true)
            setHasNewMessage(false)
          }}
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
              Chat with Channah
            </span>
            {/* Arrow */}
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-card border-r border-b border-cyan/30 rotate-45" />
          </span>
        </button>
      </div>

      {/* Chat Drawer */}
      <AIChatDrawer open={isOpen} onOpenChange={setIsOpen} />
    </>
  )
}

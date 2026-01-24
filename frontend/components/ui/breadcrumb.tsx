'use client'

import * as React from 'react'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode
}

export function Breadcrumb({ children, className, ...props }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center', className)} {...props}>
      <ol className="flex items-center space-x-1 text-sm">
        {children}
      </ol>
    </nav>
  )
}

interface BreadcrumbItemProps extends React.HTMLAttributes<HTMLLIElement> {
  children: React.ReactNode
}

export function BreadcrumbItem({ children, className, ...props }: BreadcrumbItemProps) {
  return (
    <li className={cn('flex items-center', className)} {...props}>
      {children}
    </li>
  )
}

interface BreadcrumbLinkProps {
  href: string
  children: React.ReactNode
  active?: boolean
  className?: string
}

export function BreadcrumbLink({ href, children, active, className }: BreadcrumbLinkProps) {
  if (active) {
    return (
      <span
        className={cn('font-medium text-foreground', className)}
        aria-current="page"
      >
        {children}
      </span>
    )
  }

  return (
    <Link
      href={href}
      className={cn(
        'text-muted-foreground hover:text-foreground transition-colors',
        className
      )}
    >
      {children}
    </Link>
  )
}

interface BreadcrumbSeparatorProps {
  className?: string
}

export function BreadcrumbSeparator({ className }: BreadcrumbSeparatorProps) {
  return (
    <ChevronRight className={cn('mx-1 h-4 w-4 text-muted-foreground', className)} />
  )
}

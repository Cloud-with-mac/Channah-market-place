'use client'

import Link from 'next/link'
import { Store, MapPin, Calendar, Award, Shield, TrendingUp, MessageCircle, Building2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'

interface SupplierInfoPanelProps {
  vendor: {
    name: string
    slug: string
    logo?: string
    location?: string
    memberSince?: string
    verified?: boolean
    goldSupplier?: boolean
    rating?: number
    responseRate?: number
    responseTime?: string
  }
}

export function SupplierInfoPanel({ vendor }: SupplierInfoPanelProps) {
  // Default values for B2B demonstration
  const supplierData = {
    name: vendor.name,
    slug: vendor.slug,
    logo: vendor.logo,
    location: vendor.location || undefined,
    memberSince: vendor.memberSince || '2018',
    verified: vendor.verified ?? false,
    goldSupplier: vendor.goldSupplier ?? false,
    rating: vendor.rating || undefined,
    responseRate: vendor.responseRate || undefined,
    responseTime: vendor.responseTime || '< 24 hours',
  }

  const yearsInBusiness = new Date().getFullYear() - parseInt(supplierData.memberSince)

  return (
    <Card className="border-2 border-border overflow-hidden">
      {/* Header with Gradient */}
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 px-5 py-4 border-b border-border">
        <div className="flex items-start gap-4">
          <Avatar className="h-14 w-14 border-2 border-background shadow-md">
            <AvatarImage src={supplierData.logo} alt={supplierData.name} />
            <AvatarFallback className="bg-primary text-primary-foreground text-lg font-bold">
              {supplierData.name.charAt(0)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <Link
              href={`/vendor/${supplierData.slug}`}
              className="group flex items-center gap-2 mb-1"
            >
              <h3 className="font-bold text-lg group-hover:text-primary transition-colors truncate">
                {supplierData.name}
              </h3>
            </Link>

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              {supplierData.verified && (
                <Badge className="bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-0 text-xs">
                  <Shield className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              )}
              {supplierData.goldSupplier && (
                <Badge className="bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-900 border-0 text-xs font-semibold">
                  <Award className="h-3 w-3 mr-1" />
                  Gold Supplier
                </Badge>
              )}
            </div>

            {/* Location */}
            {supplierData.location && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                <span>{supplierData.location}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Supplier Stats */}
      <div className="p-5 space-y-4">
        {/* Performance Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-primary" />
              <p className="text-xs text-muted-foreground font-medium">Response Rate</p>
            </div>
            <p className="text-lg font-bold text-foreground">{supplierData.responseRate ? `${supplierData.responseRate}%` : 'N/A'}</p>
          </div>

          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            <div className="flex items-center gap-2 mb-1">
              <MessageCircle className="h-4 w-4 text-primary" />
              <p className="text-xs text-muted-foreground font-medium">Response Time</p>
            </div>
            <p className="text-sm font-bold text-foreground">{supplierData.responseTime}</p>
          </div>
        </div>

        {/* Business Info */}
        <div className="space-y-2">
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Member Since</span>
            </div>
            <span className="text-sm font-semibold text-foreground">{supplierData.memberSince}</span>
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <span>Years in Business</span>
            </div>
            <span className="text-sm font-semibold text-foreground">{yearsInBusiness}+ years</span>
          </div>
        </div>

        <Separator />

        {/* Action Buttons */}
        <div className="space-y-2">
          <Button className="w-full" variant="default" asChild>
            <Link href={`/vendor/${supplierData.slug}`}>
              <Store className="h-4 w-4 mr-2" />
              Visit Store
            </Link>
          </Button>

          <Button className="w-full" variant="outline" asChild>
            <Link href={`/chat?vendor=${supplierData.slug}`}>
              <MessageCircle className="h-4 w-4 mr-2" />
              Contact Supplier
            </Link>
          </Button>
        </div>

        {/* Trade Assurance */}
        <div className="mt-4 p-3 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800">
          <div className="flex items-start gap-2">
            <Shield className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-green-900 dark:text-green-100 mb-1">
                Trade Assurance
              </p>
              <p className="text-xs text-green-700 dark:text-green-300 leading-relaxed">
                Protected by Channah's buyer protection program. Your order is covered from payment to delivery.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

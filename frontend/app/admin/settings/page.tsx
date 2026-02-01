'use client'

import * as React from 'react'
import { Save, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { adminAPI } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

interface PlatformSettings {
  platform_name: string
  platform_commission: number
  min_payout: number
  allow_guest_checkout: boolean
  require_email_verification: boolean
  enable_reviews: boolean
  auto_approve_products: boolean
  currencies: string[]
  default_currency: string
}

export default function AdminSettingsPage() {
  const { toast } = useToast()
  const [settings, setSettings] = React.useState<PlatformSettings | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)

  React.useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await adminAPI.getSettings()
        setSettings(data)
      } catch (error) {
        console.error('Failed to fetch settings:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSettings()
  }, [])

  const handleSave = async () => {
    if (!settings) return

    setIsSaving(true)
    try {
      await adminAPI.updateSettings(settings)
      toast({
        title: 'Settings saved',
        description: 'Platform settings have been updated.',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.response?.data?.detail || 'Failed to save settings',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const updateSetting = <K extends keyof PlatformSettings>(
    key: K,
    value: PlatformSettings[K]
  ) => {
    setSettings(prev => prev ? { ...prev, [key]: value } : null)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Card>
          <CardContent className="p-6 space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">Platform Settings</h1>
          <p className="text-muted-foreground">
            Configure your marketplace settings.
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Changes
        </Button>
      </div>

      <div className="grid gap-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle>General</CardTitle>
            <CardDescription>Basic platform configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="platform_name">Platform Name</Label>
              <Input
                id="platform_name"
                value={settings?.platform_name || ''}
                onChange={(e) => updateSetting('platform_name', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="default_currency">Default Currency</Label>
              <Select
                value={settings?.default_currency || 'USD'}
                onValueChange={(value) => updateSetting('default_currency', value)}
              >
                <SelectTrigger id="default_currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {settings?.currencies?.map((currency) => (
                    <SelectItem key={currency} value={currency}>
                      {currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Commission & Payouts */}
        <Card>
          <CardHeader>
            <CardTitle>Commission & Payouts</CardTitle>
            <CardDescription>Revenue sharing settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="platform_commission">Platform Commission (%)</Label>
              <Input
                id="platform_commission"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={settings?.platform_commission || 0}
                onChange={(e) => updateSetting('platform_commission', parseFloat(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Percentage taken from each sale
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="min_payout">Minimum Payout Amount</Label>
              <Input
                id="min_payout"
                type="number"
                min="0"
                step="1"
                value={settings?.min_payout || 0}
                onChange={(e) => updateSetting('min_payout', parseFloat(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Minimum balance required for vendor payout requests
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <Card>
          <CardHeader>
            <CardTitle>Features</CardTitle>
            <CardDescription>Enable or disable platform features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="allow_guest_checkout">Guest Checkout</Label>
                <p className="text-sm text-muted-foreground">
                  Allow customers to checkout without creating an account
                </p>
              </div>
              <Switch
                id="allow_guest_checkout"
                checked={settings?.allow_guest_checkout || false}
                onCheckedChange={(checked: boolean) => updateSetting('allow_guest_checkout', checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="require_email_verification">Email Verification</Label>
                <p className="text-sm text-muted-foreground">
                  Require users to verify their email address
                </p>
              </div>
              <Switch
                id="require_email_verification"
                checked={settings?.require_email_verification || false}
                onCheckedChange={(checked: boolean) => updateSetting('require_email_verification', checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enable_reviews">Product Reviews</Label>
                <p className="text-sm text-muted-foreground">
                  Allow customers to leave reviews on products
                </p>
              </div>
              <Switch
                id="enable_reviews"
                checked={settings?.enable_reviews || false}
                onCheckedChange={(checked: boolean) => updateSetting('enable_reviews', checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto_approve_products">Auto-Approve Products</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically approve new products from verified vendors
                </p>
              </div>
              <Switch
                id="auto_approve_products"
                checked={settings?.auto_approve_products || false}
                onCheckedChange={(checked: boolean) => updateSetting('auto_approve_products', checked)}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

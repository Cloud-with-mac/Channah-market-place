'use client'

import * as React from 'react'
import {
  Settings,
  Store,
  CreditCard,
  Mail,
  Bell,
  Shield,
  Palette,
  Save,
  RefreshCw,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { systemAPI } from '@/lib/api'

interface PlatformSettings {
  // General
  site_name: string
  site_description: string
  support_email: string
  contact_phone: string
  // Commerce
  default_currency: string
  commission_rate: number
  min_payout_amount: number
  payout_schedule: string
  // Features
  enable_reviews: boolean
  enable_wishlist: boolean
  require_email_verification: boolean
  auto_approve_vendors: boolean
  // Notifications
  notify_new_order: boolean
  notify_new_vendor: boolean
  notify_low_stock: boolean
  low_stock_threshold: number
}

const defaultSettings: PlatformSettings = {
  site_name: 'Channah Global Marketplace',
  site_description: 'Your trusted global marketplace',
  support_email: 'support@example.com',
  contact_phone: '',
  default_currency: 'USD',
  commission_rate: 10,
  min_payout_amount: 50,
  payout_schedule: 'weekly',
  enable_reviews: true,
  enable_wishlist: true,
  require_email_verification: true,
  auto_approve_vendors: false,
  notify_new_order: true,
  notify_new_vendor: true,
  notify_low_stock: true,
  low_stock_threshold: 10,
}

export default function SettingsPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [settings, setSettings] = React.useState<PlatformSettings>(defaultSettings)
  const [hasChanges, setHasChanges] = React.useState(false)

  const fetchSettings = React.useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await systemAPI.getSettings()
      if (response.data) {
        setSettings({ ...defaultSettings, ...response.data })
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
      // Use defaults if fetch fails
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const updateSetting = <K extends keyof PlatformSettings>(
    key: K,
    value: PlatformSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      await systemAPI.updateSettings(settings)
      toast({
        title: 'Settings Saved',
        description: 'Your settings have been updated successfully.',
      })
      setHasChanges(false)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to save settings.',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    fetchSettings()
    setHasChanges(false)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full max-w-md" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display">Platform Settings</h1>
          <p className="text-muted-foreground">
            Configure your marketplace settings and preferences.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Button variant="outline" onClick={handleReset}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Reset
            </Button>
          )}
          <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">
            <Store className="mr-2 h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="commerce">
            <CreditCard className="mr-2 h-4 w-4" />
            Commerce
          </TabsTrigger>
          <TabsTrigger value="features">
            <Settings className="mr-2 h-4 w-4" />
            Features
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="mr-2 h-4 w-4" />
            Notifications
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Basic information about your marketplace.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="site_name">Site Name</Label>
                  <Input
                    id="site_name"
                    value={settings.site_name}
                    onChange={(e) => updateSetting('site_name', e.target.value)}
                    placeholder="Your Marketplace Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="support_email">Support Email</Label>
                  <Input
                    id="support_email"
                    type="email"
                    value={settings.support_email}
                    onChange={(e) => updateSetting('support_email', e.target.value)}
                    placeholder="support@example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="site_description">Site Description</Label>
                <Textarea
                  id="site_description"
                  value={settings.site_description}
                  onChange={(e) => updateSetting('site_description', e.target.value)}
                  placeholder="A brief description of your marketplace..."
                  rows={3}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contact_phone">Contact Phone</Label>
                  <Input
                    id="contact_phone"
                    value={settings.contact_phone}
                    onChange={(e) => updateSetting('contact_phone', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Commerce Settings */}
        <TabsContent value="commerce">
          <Card>
            <CardHeader>
              <CardTitle>Commerce Settings</CardTitle>
              <CardDescription>
                Configure payments, commissions, and payouts.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="default_currency">Default Currency</Label>
                  <Select
                    value={settings.default_currency}
                    onValueChange={(value) => updateSetting('default_currency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                      <SelectItem value="NGN">NGN - Nigerian Naira</SelectItem>
                      <SelectItem value="GHS">GHS - Ghanaian Cedi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="commission_rate">Commission Rate (%)</Label>
                  <Input
                    id="commission_rate"
                    type="number"
                    min="0"
                    max="100"
                    value={settings.commission_rate}
                    onChange={(e) => updateSetting('commission_rate', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="min_payout_amount">Minimum Payout Amount</Label>
                  <Input
                    id="min_payout_amount"
                    type="number"
                    min="0"
                    value={settings.min_payout_amount}
                    onChange={(e) => updateSetting('min_payout_amount', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payout_schedule">Payout Schedule</Label>
                  <Select
                    value={settings.payout_schedule}
                    onValueChange={(value) => updateSetting('payout_schedule', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Bi-weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Features Settings */}
        <TabsContent value="features">
          <Card>
            <CardHeader>
              <CardTitle>Feature Settings</CardTitle>
              <CardDescription>
                Enable or disable marketplace features.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Product Reviews</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow customers to leave reviews on products.
                  </p>
                </div>
                <Switch
                  checked={settings.enable_reviews}
                  onCheckedChange={(checked) => updateSetting('enable_reviews', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Wishlist</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow customers to save products to their wishlist.
                  </p>
                </div>
                <Switch
                  checked={settings.enable_wishlist}
                  onCheckedChange={(checked) => updateSetting('enable_wishlist', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Verification</Label>
                  <p className="text-sm text-muted-foreground">
                    Require email verification for new accounts.
                  </p>
                </div>
                <Switch
                  checked={settings.require_email_verification}
                  onCheckedChange={(checked) => updateSetting('require_email_verification', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-Approve Vendors</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically approve new vendor applications.
                  </p>
                </div>
                <Switch
                  checked={settings.auto_approve_vendors}
                  onCheckedChange={(checked) => updateSetting('auto_approve_vendors', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure admin notification preferences.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>New Order Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when a new order is placed.
                  </p>
                </div>
                <Switch
                  checked={settings.notify_new_order}
                  onCheckedChange={(checked) => updateSetting('notify_new_order', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>New Vendor Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when a new vendor applies.
                  </p>
                </div>
                <Switch
                  checked={settings.notify_new_vendor}
                  onCheckedChange={(checked) => updateSetting('notify_new_vendor', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Low Stock Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when products are running low on stock.
                  </p>
                </div>
                <Switch
                  checked={settings.notify_low_stock}
                  onCheckedChange={(checked) => updateSetting('notify_low_stock', checked)}
                />
              </div>

              {settings.notify_low_stock && (
                <div className="space-y-2 pl-6">
                  <Label htmlFor="low_stock_threshold">Low Stock Threshold</Label>
                  <Input
                    id="low_stock_threshold"
                    type="number"
                    min="1"
                    className="max-w-xs"
                    value={settings.low_stock_threshold}
                    onChange={(e) => updateSetting('low_stock_threshold', parseInt(e.target.value) || 10)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Alert when stock falls below this number.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

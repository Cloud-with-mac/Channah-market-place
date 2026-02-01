'use client'

import * as React from 'react'
import { Store, CreditCard, Bell, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { vendorSettingsAPI } from '@/lib/api'
import { useAuthStore } from '@/store'
import { useToast } from '@/hooks/use-toast'

export default function VendorSettingsPage() {
  const { user, updateUser } = useAuthStore()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [profile, setProfile] = React.useState({
    business_name: '',
    description: '',
    phone: '',
    address: '',
    city: '',
    country: '',
  })
  const [payment, setPayment] = React.useState({
    bank_name: '',
    account_number: '',
    account_name: '',
    paypal_email: '',
  })
  const [notifications, setNotifications] = React.useState({
    email_orders: true,
    email_reviews: true,
    email_payouts: true,
  })

  React.useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [profileRes, paymentRes, notifRes] = await Promise.allSettled([
          vendorSettingsAPI.getProfile(),
          vendorSettingsAPI.getPaymentSettings(),
          vendorSettingsAPI.getNotificationSettings(),
        ])

        if (profileRes.status === 'fulfilled') {
          const data = profileRes.value.data
          setProfile({
            business_name: data.business_name || '',
            description: data.description || '',
            phone: data.phone || '',
            address: data.address || '',
            city: data.city || '',
            country: data.country || '',
          })
        }
        if (paymentRes.status === 'fulfilled') {
          const data = paymentRes.value.data
          setPayment({
            bank_name: data.bank_name || '',
            account_number: data.account_number || '',
            account_name: data.account_name || '',
            paypal_email: data.paypal_email || '',
          })
        }
        if (notifRes.status === 'fulfilled') {
          const data = notifRes.value.data
          setNotifications({
            email_orders: data.email_orders ?? true,
            email_reviews: data.email_reviews ?? true,
            email_payouts: data.email_payouts ?? true,
          })
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSettings()
  }, [])

  const handleSaveProfile = async () => {
    setIsSaving(true)
    try {
      await vendorSettingsAPI.updateProfile(profile)
      toast({ title: 'Saved', description: 'Profile settings saved successfully.' })
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save profile settings.', variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSavePayment = async () => {
    setIsSaving(true)
    try {
      await vendorSettingsAPI.updatePaymentSettings(payment)
      toast({ title: 'Saved', description: 'Payment settings saved successfully.' })
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save payment settings.', variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveNotifications = async () => {
    setIsSaving(true)
    try {
      await vendorSettingsAPI.updateNotificationSettings(notifications)
      toast({ title: 'Saved', description: 'Notification settings saved successfully.' })
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save notification settings.', variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[400px] rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display">Settings</h1>
        <p className="text-muted-foreground">Manage your store settings</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile" className="gap-2">
            <Store className="h-4 w-4" />
            Store Profile
          </TabsTrigger>
          <TabsTrigger value="payment" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Payment
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Store Profile</CardTitle>
              <CardDescription>Update your store information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="business_name">Business Name</Label>
                  <Input
                    id="business_name"
                    value={profile.business_name}
                    onChange={(e) => setProfile({ ...profile, business_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={profile.description}
                  onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                  rows={4}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={profile.address}
                    onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={profile.city}
                    onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={profile.country}
                    onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                  />
                </div>
              </div>
              <Button onClick={handleSaveProfile} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment">
          <Card>
            <CardHeader>
              <CardTitle>Payment Settings</CardTitle>
              <CardDescription>Configure how you receive payouts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="bank_name">Bank Name</Label>
                  <Input
                    id="bank_name"
                    value={payment.bank_name}
                    onChange={(e) => setPayment({ ...payment, bank_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account_name">Account Name</Label>
                  <Input
                    id="account_name"
                    value={payment.account_name}
                    onChange={(e) => setPayment({ ...payment, account_name: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="account_number">Account Number</Label>
                  <Input
                    id="account_number"
                    value={payment.account_number}
                    onChange={(e) => setPayment({ ...payment, account_number: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paypal_email">PayPal Email (optional)</Label>
                  <Input
                    id="paypal_email"
                    type="email"
                    value={payment.paypal_email}
                    onChange={(e) => setPayment({ ...payment, paypal_email: e.target.value })}
                  />
                </div>
              </div>
              <Button onClick={handleSavePayment} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose what notifications you receive</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Order Notifications</p>
                  <p className="text-sm text-muted-foreground">Get notified when you receive new orders</p>
                </div>
                <Switch
                  checked={notifications.email_orders}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, email_orders: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Review Notifications</p>
                  <p className="text-sm text-muted-foreground">Get notified when customers review your products</p>
                </div>
                <Switch
                  checked={notifications.email_reviews}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, email_reviews: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Payout Notifications</p>
                  <p className="text-sm text-muted-foreground">Get notified about payout status changes</p>
                </div>
                <Switch
                  checked={notifications.email_payouts}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, email_payouts: checked })}
                />
              </div>
              <Button onClick={handleSaveNotifications} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

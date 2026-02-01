'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/hooks/use-toast'
import { vendorSettingsAPI } from '@/lib/api'
import { Save, Plus, X, Store, Globe, Users, Award, MapPin, Loader2, Truck } from 'lucide-react'

interface StoreProfileData {
  business_name: string
  description: string
  business_email: string
  business_phone: string
  business_address: string
  city: string
  state: string
  country: string
  postal_code: string
  website: string
  certifications: string[]
  main_products: string[]
  monthly_output: string
  export_percentage: string
  main_markets: string[]
  employees: string
  year_established: number | null
  response_time: string
  processing_days: number
  shipping_days: number
}

export default function StoreProfilePage() {
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [data, setData] = React.useState<StoreProfileData>({
    business_name: '',
    description: '',
    business_email: '',
    business_phone: '',
    business_address: '',
    city: '',
    state: '',
    country: '',
    postal_code: '',
    website: '',
    certifications: [],
    main_products: [],
    monthly_output: '',
    export_percentage: '',
    main_markets: [],
    employees: '',
    year_established: null,
    response_time: '',
    processing_days: 2,
    shipping_days: 5,
  })

  // Temp inputs for adding items to arrays
  const [newCertification, setNewCertification] = React.useState('')
  const [newProduct, setNewProduct] = React.useState('')
  const [newMarket, setNewMarket] = React.useState('')

  React.useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await vendorSettingsAPI.getProfile()
        setData({
          business_name: profile.business_name || '',
          description: profile.description || '',
          business_email: profile.business_email || '',
          business_phone: profile.business_phone || '',
          business_address: profile.business_address || '',
          city: profile.city || '',
          state: profile.state || '',
          country: profile.country || '',
          postal_code: profile.postal_code || '',
          website: profile.website || '',
          certifications: profile.certifications || [],
          main_products: profile.main_products || [],
          monthly_output: profile.monthly_output || '',
          export_percentage: profile.export_percentage || '',
          main_markets: profile.main_markets || [],
          employees: profile.employees || '',
          year_established: profile.year_established || null,
          response_time: profile.response_time || '',
          processing_days: profile.processing_days ?? 2,
          shipping_days: profile.shipping_days ?? 5,
        })
      } catch (error) {
        console.error('Failed to load profile:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await vendorSettingsAPI.updateProfile(data)
      toast({ title: 'Store profile updated successfully' })
    } catch (error) {
      console.error('Failed to save:', error)
      toast({ title: 'Failed to update profile', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const addToList = (field: 'certifications' | 'main_products' | 'main_markets', value: string, setter: (v: string) => void) => {
    const trimmed = value.trim()
    if (trimmed && !data[field].includes(trimmed)) {
      setData({ ...data, [field]: [...data[field], trimmed] })
      setter('')
    }
  }

  const removeFromList = (field: 'certifications' | 'main_products' | 'main_markets', index: number) => {
    setData({ ...data, [field]: data[field].filter((_, i) => i !== index) })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Store className="h-6 w-6" />
            Store Profile
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage how your store appears to buyers
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save Changes
        </Button>
      </div>

      {/* Business Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Business Information
          </CardTitle>
          <CardDescription>Basic information about your store</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="business_name">Business Name</Label>
              <Input id="business_name" value={data.business_name} onChange={e => setData({ ...data, business_name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="year_established">Year Established</Label>
              <Input id="year_established" type="number" placeholder="e.g. 2020" value={data.year_established || ''} onChange={e => setData({ ...data, year_established: e.target.value ? parseInt(e.target.value) : null })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Company Description</Label>
            <Textarea id="description" rows={4} placeholder="Tell buyers about your business..." value={data.description} onChange={e => setData({ ...data, description: e.target.value })} />
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Contact Information
          </CardTitle>
          <CardDescription>How buyers can reach you</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="business_email">Email</Label>
              <Input id="business_email" type="email" value={data.business_email} onChange={e => setData({ ...data, business_email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="business_phone">Phone</Label>
              <Input id="business_phone" value={data.business_phone} onChange={e => setData({ ...data, business_phone: e.target.value })} />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input id="website" placeholder="https://yourwebsite.com" value={data.website} onChange={e => setData({ ...data, website: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="response_time">Typical Response Time</Label>
              <Input id="response_time" placeholder="e.g. Within 24 hours" value={data.response_time} onChange={e => setData({ ...data, response_time: e.target.value })} />
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
            <Label htmlFor="business_address">Address</Label>
            <Input id="business_address" value={data.business_address} onChange={e => setData({ ...data, business_address: e.target.value })} />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" value={data.city} onChange={e => setData({ ...data, city: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input id="state" value={data.state} onChange={e => setData({ ...data, state: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input id="country" value={data.country} onChange={e => setData({ ...data, country: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postal_code">Postal Code</Label>
              <Input id="postal_code" value={data.postal_code} onChange={e => setData({ ...data, postal_code: e.target.value })} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trade Capacity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Trade Capacity
          </CardTitle>
          <CardDescription>Your production and export capabilities</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="monthly_output">Monthly Output</Label>
              <Input id="monthly_output" placeholder="e.g. 10,000 pieces" value={data.monthly_output} onChange={e => setData({ ...data, monthly_output: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="export_percentage">Export Percentage</Label>
              <Input id="export_percentage" placeholder="e.g. 80%" value={data.export_percentage} onChange={e => setData({ ...data, export_percentage: e.target.value })} />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employees">Number of Employees</Label>
              <Input id="employees" placeholder="e.g. 50-100" value={data.employees} onChange={e => setData({ ...data, employees: e.target.value })} />
            </div>
          </div>

          {/* Main Markets */}
          <div className="space-y-2">
            <Label>Main Markets</Label>
            <div className="flex gap-2">
              <Input placeholder="e.g. Europe, North America" value={newMarket} onChange={e => setNewMarket(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addToList('main_markets', newMarket, setNewMarket) } }} />
              <Button type="button" variant="outline" size="icon" onClick={() => addToList('main_markets', newMarket, setNewMarket)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {data.main_markets.map((market, i) => (
                <Badge key={i} variant="secondary" className="gap-1 pr-1">
                  {market}
                  <button onClick={() => removeFromList('main_markets', i)} className="ml-1 hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fulfillment Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Fulfillment Settings
          </CardTitle>
          <CardDescription>Set your order processing and shipping timeframes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="processing_days">Processing Time (days)</Label>
              <Input id="processing_days" type="number" min={1} max={30} value={data.processing_days} onChange={e => setData({ ...data, processing_days: parseInt(e.target.value) || 1 })} />
              <p className="text-xs text-muted-foreground">How many business days to prepare an order</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="shipping_days">Shipping Time (days)</Label>
              <Input id="shipping_days" type="number" min={1} max={60} value={data.shipping_days} onChange={e => setData({ ...data, shipping_days: parseInt(e.target.value) || 1 })} />
              <p className="text-xs text-muted-foreground">Estimated delivery time after processing</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Products */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Main Product Categories
          </CardTitle>
          <CardDescription>What types of products you sell</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input placeholder="e.g. Electronics, Clothing, Home & Garden" value={newProduct} onChange={e => setNewProduct(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addToList('main_products', newProduct, setNewProduct) } }} />
            <Button type="button" variant="outline" size="icon" onClick={() => addToList('main_products', newProduct, setNewProduct)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.main_products.map((product, i) => (
              <Badge key={i} variant="secondary" className="gap-1 pr-1">
                {product}
                <button onClick={() => removeFromList('main_products', i)} className="ml-1 hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Certifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Certifications
          </CardTitle>
          <CardDescription>Quality and industry certifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input placeholder="e.g. ISO 9001, CE, FDA" value={newCertification} onChange={e => setNewCertification(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addToList('certifications', newCertification, setNewCertification) } }} />
            <Button type="button" variant="outline" size="icon" onClick={() => addToList('certifications', newCertification, setNewCertification)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.certifications.map((cert, i) => (
              <Badge key={i} variant="secondary" className="gap-1 pr-1">
                {cert}
                <button onClick={() => removeFromList('certifications', i)} className="ml-1 hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Save Button (bottom) */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save Changes
        </Button>
      </div>
    </div>
  )
}

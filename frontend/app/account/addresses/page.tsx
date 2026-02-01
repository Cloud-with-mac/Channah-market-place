'use client'

import * as React from 'react'
import { Plus, MapPin, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { AddressCard, Address } from '@/components/account/address-card'
import { AddressForm } from '@/components/account/address-form'
import { addressesAPI } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

export default function AddressesPage() {
  const { toast } = useToast()
  const [addresses, setAddresses] = React.useState<Address[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isFormOpen, setIsFormOpen] = React.useState(false)
  const [editingAddress, setEditingAddress] = React.useState<Address | null>(null)

  const fetchAddresses = React.useCallback(async () => {
    try {
      const response = await addressesAPI.list()
      setAddresses(Array.isArray(response) ? response : (response?.results || response?.items || []))
    } catch (error) {
      console.error('Failed to fetch addresses:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchAddresses()
  }, [fetchAddresses])

  const handleAddAddress = () => {
    setEditingAddress(null)
    setIsFormOpen(true)
  }

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address)
    setIsFormOpen(true)
  }

  const handleSubmitAddress = async (data: any) => {
    try {
      if (editingAddress) {
        await addressesAPI.update(editingAddress.id, data)
        toast({
          title: 'Address updated',
          description: 'Your address has been updated successfully.',
        })
      } else {
        await addressesAPI.create(data)
        toast({
          title: 'Address added',
          description: 'Your new address has been added successfully.',
        })
      }
      fetchAddresses()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.response?.data?.message || 'Failed to save address',
        variant: 'destructive',
      })
      throw error
    }
  }

  const handleDeleteAddress = async (id: string) => {
    try {
      await addressesAPI.delete(id)
      setAddresses(prev => prev.filter(a => a.id !== id))
      toast({
        title: 'Address deleted',
        description: 'The address has been deleted.',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.response?.data?.message || 'Failed to delete address',
        variant: 'destructive',
      })
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      await addressesAPI.setDefault(id)
      setAddresses(prev =>
        prev.map(a => ({
          ...a,
          is_default: a.id === id,
        }))
      )
      toast({
        title: 'Default address updated',
        description: 'Your default address has been updated.',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.response?.data?.message || 'Failed to set default address',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display">My Addresses</h1>
          <p className="text-muted-foreground mt-1">
            Manage your delivery addresses.
          </p>
        </div>
        <Button onClick={handleAddAddress}>
          <Plus className="mr-2 h-4 w-4" />
          Add Address
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : addresses.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <MapPin className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">No addresses yet</h3>
            <p className="mt-2 text-muted-foreground">
              Add a delivery address to speed up checkout.
            </p>
            <Button onClick={handleAddAddress} className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Address
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {addresses.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              onEdit={handleEditAddress}
              onDelete={handleDeleteAddress}
              onSetDefault={handleSetDefault}
            />
          ))}
        </div>
      )}

      <AddressForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        address={editingAddress}
        onSubmit={handleSubmitAddress}
      />
    </div>
  )
}

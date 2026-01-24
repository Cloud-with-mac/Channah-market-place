'use client'

import * as React from 'react'
import { MapPin, Edit2, Trash2, CheckCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

export interface Address {
  id: string
  label?: string
  first_name: string
  last_name: string
  address_line_1: string
  address_line_2?: string
  city: string
  state: string
  postal_code: string
  country: string
  phone: string
  is_default: boolean
}

interface AddressCardProps {
  address: Address
  onEdit: (address: Address) => void
  onDelete: (id: string) => void
  onSetDefault: (id: string) => void
}

export function AddressCard({ address, onEdit, onDelete, onSetDefault }: AddressCardProps) {
  return (
    <Card className={address.is_default ? 'border-primary' : ''}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">
                {address.label || `${address.first_name} ${address.last_name}`}
              </span>
              {address.is_default && (
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Default
                </Badge>
              )}
            </div>

            <div className="text-sm text-muted-foreground space-y-0.5">
              <p>{address.first_name} {address.last_name}</p>
              <p>{address.address_line_1}</p>
              {address.address_line_2 && <p>{address.address_line_2}</p>}
              <p>{address.city}, {address.state} {address.postal_code}</p>
              <p>{address.country}</p>
              <p className="mt-1">{address.phone}</p>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(address)}
            >
              <Edit2 className="h-4 w-4" />
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Address</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this address? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(address.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {!address.is_default && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-3 w-full"
            onClick={() => onSetDefault(address.id)}
          >
            Set as Default
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Bell, TrendingDown, Package, Trash2, Edit, CheckCircle2, X } from 'lucide-react'
import { useAlertsStore } from '@/store/alerts-store'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PriceDisplay } from '@/components/ui/price-display'
import { toast } from '@/hooks/use-toast'
import { Separator } from '@/components/ui/separator'

export default function AlertsPage() {
  const {
    priceAlerts,
    restockAlerts,
    removePriceAlert,
    removeRestockAlert,
    updatePriceAlert,
    togglePriceAlert,
    toggleRestockAlert,
    clearTriggeredAlerts,
  } = useAlertsStore()

  const [editingAlert, setEditingAlert] = useState<string | null>(null)
  const [newTargetPrice, setNewTargetPrice] = useState('')

  const activePriceAlerts = priceAlerts.filter((a) => a.isActive && !a.triggeredAt)
  const triggeredPriceAlerts = priceAlerts.filter((a) => a.triggeredAt)
  const activeRestockAlerts = restockAlerts.filter((a) => a.isActive && !a.notifiedAt)
  const notifiedRestockAlerts = restockAlerts.filter((a) => a.notifiedAt)

  const handleUpdatePriceAlert = (alertId: string) => {
    const price = parseFloat(newTargetPrice)
    if (isNaN(price) || price <= 0) {
      toast({
        title: 'Invalid price',
        description: 'Please enter a valid price',
        variant: 'destructive',
      })
      return
    }

    updatePriceAlert(alertId, price)
    setEditingAlert(null)
    setNewTargetPrice('')

    toast({
      title: 'Alert updated',
      description: 'Price alert has been updated',
    })
  }

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold font-display mb-2">My Alerts</h1>
          <p className="text-muted-foreground">
            Manage price drops and restock notifications
          </p>
        </div>

        <div className="flex items-center gap-2">
          {(triggeredPriceAlerts.length > 0 || notifiedRestockAlerts.length > 0) && (
            <Button variant="outline" onClick={clearTriggeredAlerts}>
              Clear Notifications
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="price" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
          <TabsTrigger value="price">
            <TrendingDown className="h-4 w-4 mr-2" />
            Price Alerts ({activePriceAlerts.length})
          </TabsTrigger>
          <TabsTrigger value="restock">
            <Bell className="h-4 w-4 mr-2" />
            Restock Alerts ({activeRestockAlerts.length})
          </TabsTrigger>
        </TabsList>

        {/* Price Alerts Tab */}
        <TabsContent value="price" className="space-y-6">
          {/* Triggered Alerts */}
          {triggeredPriceAlerts.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Price Drop Notifications
              </h2>

              <div className="grid gap-4">
                {triggeredPriceAlerts.map((alert) => (
                  <Card key={alert.id} className="p-5 border-2 border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
                    <div className="flex items-start gap-4">
                      <div className="h-20 w-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        {alert.productImage && (
                          <img
                            src={alert.productImage}
                            alt={alert.productName}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <Badge className="bg-green-600 text-white mb-2">
                              Price Dropped!
                            </Badge>
                            <Link
                              href={`/product/${alert.productId}`}
                              className="font-semibold hover:text-primary transition-colors block mb-2"
                            >
                              {alert.productName}
                            </Link>

                            <div className="flex items-center gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">Was</p>
                                <p className="line-through">${alert.currentPrice.toFixed(2)}</p>
                              </div>
                              <div className="text-xl">→</div>
                              <div>
                                <p className="text-muted-foreground">Now</p>
                                <p className="text-green-600 font-bold text-lg">
                                  ${alert.targetPrice.toFixed(2)}
                                </p>
                              </div>
                            </div>
                          </div>

                          <Button size="sm" asChild>
                            <Link href={`/product/${alert.productId}`}>
                              View Product
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <Separator className="my-8" />
            </div>
          )}

          {/* Active Alerts */}
          <div>
            <h2 className="text-xl font-bold mb-4">Active Price Alerts</h2>

            {activePriceAlerts.length === 0 ? (
              <Card className="p-12">
                <div className="text-center">
                  <TrendingDown className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No active price alerts</h3>
                  <p className="text-muted-foreground mb-6">
                    Set price alerts on products in your wishlist to get notified when prices drop
                  </p>
                  <Button asChild>
                    <Link href="/wishlist">Go to Wishlist</Link>
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="grid gap-4">
                {activePriceAlerts.map((alert) => (
                  <Card key={alert.id} className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="h-20 w-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        {alert.productImage && (
                          <img
                            src={alert.productImage}
                            alt={alert.productName}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/product/${alert.productId}`}
                          className="font-semibold hover:text-primary transition-colors block mb-2"
                        >
                          {alert.productName}
                        </Link>

                        <div className="flex items-center gap-4 text-sm mb-3">
                          <div>
                            <p className="text-muted-foreground text-xs">Current Price</p>
                            <p className="font-semibold">${alert.currentPrice.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Target Price</p>
                            <p className="font-semibold text-primary">
                              ${alert.targetPrice.toFixed(2)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Edit className="h-3.5 w-3.5 mr-2" />
                                Edit
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Edit Price Alert</DialogTitle>
                                <DialogDescription>
                                  Update the target price for {alert.productName}
                                </DialogDescription>
                              </DialogHeader>

                              <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <Label htmlFor="targetPrice">Target Price</Label>
                                  <Input
                                    id="targetPrice"
                                    type="number"
                                    step="0.01"
                                    placeholder={alert.targetPrice.toFixed(2)}
                                    value={newTargetPrice}
                                    onChange={(e) => setNewTargetPrice(e.target.value)}
                                  />
                                  <p className="text-xs text-muted-foreground">
                                    Current price: ${alert.currentPrice.toFixed(2)}
                                  </p>
                                </div>
                              </div>

                              <DialogFooter>
                                <Button
                                  onClick={() => handleUpdatePriceAlert(alert.id)}
                                >
                                  Update Alert
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => togglePriceAlert(alert.id)}
                          >
                            Pause
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              removePriceAlert(alert.id)
                              toast({ title: 'Alert deleted' })
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Restock Alerts Tab */}
        <TabsContent value="restock" className="space-y-6">
          {/* Notified Alerts */}
          {notifiedRestockAlerts.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Back in Stock
              </h2>

              <div className="grid gap-4">
                {notifiedRestockAlerts.map((alert) => (
                  <Card key={alert.id} className="p-5 border-2 border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
                    <div className="flex items-start gap-4">
                      <div className="h-20 w-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        {alert.productImage && (
                          <img
                            src={alert.productImage}
                            alt={alert.productName}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <Badge className="bg-green-600 text-white mb-2">
                              Back in Stock!
                            </Badge>
                            <Link
                              href={`/product/${alert.productId}`}
                              className="font-semibold hover:text-primary transition-colors block"
                            >
                              {alert.productName}
                            </Link>
                          </div>

                          <Button size="sm" asChild>
                            <Link href={`/product/${alert.productId}`}>
                              View Product
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <Separator className="my-8" />
            </div>
          )}

          {/* Active Alerts */}
          <div>
            <h2 className="text-xl font-bold mb-4">Active Restock Alerts</h2>

            {activeRestockAlerts.length === 0 ? (
              <Card className="p-12">
                <div className="text-center">
                  <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No active restock alerts</h3>
                  <p className="text-muted-foreground mb-6">
                    Set restock alerts on out-of-stock products to get notified when they're available again
                  </p>
                  <Button asChild>
                    <Link href="/products">Browse Products</Link>
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="grid gap-4">
                {activeRestockAlerts.map((alert) => (
                  <Card key={alert.id} className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="h-20 w-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        {alert.productImage && (
                          <img
                            src={alert.productImage}
                            alt={alert.productName}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/product/${alert.productId}`}
                          className="font-semibold hover:text-primary transition-colors block mb-2"
                        >
                          {alert.productName}
                        </Link>

                        <Badge variant="outline" className="mb-3">
                          <Bell className="h-3 w-3 mr-1" />
                          Monitoring for restock
                        </Badge>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleRestockAlert(alert.id)}
                          >
                            Pause
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              removeRestockAlert(alert.id)
                              toast({ title: 'Alert deleted' })
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

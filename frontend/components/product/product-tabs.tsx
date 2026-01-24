'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Truck, Shield, RotateCcw } from 'lucide-react'

interface ProductTabsProps {
  description: string
  specifications?: Record<string, string>
  shippingInfo?: string
}

export function ProductTabs({
  description,
  specifications,
  shippingInfo,
}: ProductTabsProps) {
  return (
    <Tabs defaultValue="description" className="w-full">
      <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
        <TabsTrigger
          value="description"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
        >
          Description
        </TabsTrigger>
        {specifications && Object.keys(specifications).length > 0 && (
          <TabsTrigger
            value="specifications"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
          >
            Specifications
          </TabsTrigger>
        )}
        <TabsTrigger
          value="shipping"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
        >
          Shipping & Returns
        </TabsTrigger>
      </TabsList>

      <TabsContent value="description" className="mt-6">
        <div
          className="prose prose-sm max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: description }}
        />
      </TabsContent>

      {specifications && Object.keys(specifications).length > 0 && (
        <TabsContent value="specifications" className="mt-6">
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <tbody>
                {Object.entries(specifications).map(([key, value], index) => (
                  <tr
                    key={key}
                    className={index % 2 === 0 ? 'bg-muted/50' : 'bg-background'}
                  >
                    <td className="px-4 py-3 font-medium text-sm w-1/3">{key}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      )}

      <TabsContent value="shipping" className="mt-6">
        <div className="space-y-6">
          {shippingInfo && (
            <div className="prose prose-sm max-w-none dark:prose-invert mb-6">
              <p>{shippingInfo}</p>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-start gap-3 p-4 rounded-lg border">
              <div className="p-2 rounded-full bg-primary/10">
                <Truck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-medium text-sm">Free Shipping</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  On orders over $50. Standard delivery 3-7 business days.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg border">
              <div className="p-2 rounded-full bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-medium text-sm">Buyer Protection</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Money back guarantee if item not received or as described.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg border">
              <div className="p-2 rounded-full bg-primary/10">
                <RotateCcw className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-medium text-sm">Easy Returns</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  30-day return policy. Return shipping covered by seller.
                </p>
              </div>
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  )
}

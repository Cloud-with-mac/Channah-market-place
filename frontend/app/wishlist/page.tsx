'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Heart,
  Folder,
  Plus,
  MoreVertical,
  Share2,
  Edit,
  Trash2,
  ShoppingCart,
  Bell,
  TrendingDown,
  Package,
  Users,
} from 'lucide-react'
import { useWishlistStore, useCartStore, useAuthStore } from '@/store'
import { useCollectionsStore } from '@/store/collections-store'
import { useAlertsStore } from '@/store/alerts-store'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { Textarea } from '@/components/ui/textarea'
import { PriceDisplay } from '@/components/ui/price-display'
import { toast } from '@/hooks/use-toast'
import { Separator } from '@/components/ui/separator'

const COLLECTION_COLORS = [
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Green', value: '#10b981' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Red', value: '#ef4444' },
]

export default function WishlistPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const { items, removeItem } = useWishlistStore()
  const {
    collections,
    activeCollectionId,
    setActiveCollection,
    createCollection,
    deleteCollection,
    getCollectionProducts,
    shareCollection,
  } = useCollectionsStore()
  const { addItem: addToCart } = useCartStore()
  const { createPriceAlert, hasPriceAlert, createRestockAlert, hasRestockAlert } = useAlertsStore()

  const [newCollectionName, setNewCollectionName] = useState('')
  const [newCollectionDescription, setNewCollectionDescription] = useState('')
  const [newCollectionColor, setNewCollectionColor] = useState(COLLECTION_COLORS[0].value)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [shareEmails, setShareEmails] = useState('')

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/wishlist')
    }
  }, [isAuthenticated, router])

  const activeCollection = collections.find((c) => c.id === activeCollectionId)

  // Get items for active collection
  const collectionProductIds = activeCollection ? getCollectionProducts(activeCollection.id) : []
  const collectionItems = items.filter((item) =>
    collectionProductIds.includes(item.productId)
  )

  const handleCreateCollection = () => {
    if (!newCollectionName.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter a collection name',
        variant: 'destructive',
      })
      return
    }

    createCollection(newCollectionName, newCollectionDescription, newCollectionColor)
    setNewCollectionName('')
    setNewCollectionDescription('')
    setNewCollectionColor(COLLECTION_COLORS[0].value)
    setCreateDialogOpen(false)

    toast({
      title: 'Collection created',
      description: `${newCollectionName} has been created`,
    })
  }

  const handleDeleteCollection = (collectionId: string) => {
    if (collectionId === 'default') {
      toast({
        title: 'Cannot delete',
        description: 'The default wishlist cannot be deleted',
        variant: 'destructive',
      })
      return
    }

    const collection = collections.find((c) => c.id === collectionId)
    deleteCollection(collectionId)

    toast({
      title: 'Collection deleted',
      description: `${collection?.name} has been deleted`,
    })
  }

  const handleShareCollection = () => {
    if (!activeCollection) return

    const emails = shareEmails.split(',').map((e) => e.trim()).filter(Boolean)
    if (emails.length === 0) {
      toast({
        title: 'Email required',
        description: 'Please enter at least one email address',
        variant: 'destructive',
      })
      return
    }

    shareCollection(activeCollection.id, emails)
    setShareEmails('')
    setShareDialogOpen(false)

    toast({
      title: 'Collection shared',
      description: `Shared with ${emails.length} ${emails.length === 1 ? 'person' : 'people'}`,
    })
  }

  const handleRemoveFromWishlist = async (productId: string) => {
    await removeItem(productId)
    toast({
      title: 'Removed from wishlist',
    })
  }

  const handleAddToCart = async (item: any) => {
    await addToCart({
      id: item.id,
      productId: item.productId,
      name: item.name,
      price: item.price,
      image: item.image || '',
      quantity: 1,
    })

    toast({
      title: 'Added to cart',
      description: `${item.name} has been added to your cart`,
    })
  }

  const handleSetPriceAlert = (item: any) => {
    if (hasPriceAlert(item.productId)) {
      toast({
        title: 'Alert already exists',
        description: 'You already have a price alert for this product',
      })
      return
    }

    const targetPrice = item.price * 0.9 // Default to 10% off
    createPriceAlert(item.productId, item.name, item.image || '', item.price, targetPrice)

    toast({
      title: 'Price alert created',
      description: `You'll be notified when price drops below $${targetPrice.toFixed(2)}`,
    })
  }

  const handleSetRestockAlert = (item: any) => {
    if (hasRestockAlert(item.productId)) {
      toast({
        title: 'Alert already exists',
        description: 'You already have a restock alert for this product',
      })
      return
    }

    createRestockAlert(item.productId, item.name, item.image || '')

    toast({
      title: 'Restock alert created',
      description: `You'll be notified when ${item.name} is back in stock`,
    })
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold font-display mb-2">My Collections</h1>
          <p className="text-muted-foreground">
            Organize your wishlist into collections and share with your team
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Collection
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Collection</DialogTitle>
                <DialogDescription>
                  Organize your products into themed collections
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Collection Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Office Supplies, Summer Products"
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Add a description for this collection"
                    rows={3}
                    value={newCollectionDescription}
                    onChange={(e) => setNewCollectionDescription(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="flex gap-2">
                    {COLLECTION_COLORS.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => setNewCollectionColor(color.value)}
                        className={`h-10 w-10 rounded-full transition-transform ${
                          newCollectionColor === color.value ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''
                        }`}
                        style={{ backgroundColor: color.value }}
                        aria-label={color.name}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateCollection}>Create Collection</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Collections Sidebar */}
        <aside className="lg:col-span-1">
          <Card className="p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Folder className="h-4 w-4" />
              Collections
            </h3>

            <div className="space-y-1">
              {collections.map((collection) => (
                <div key={collection.id} className="group relative">
                  <button
                    onClick={() => setActiveCollection(collection.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      activeCollectionId === collection.id
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <div
                      className="h-3 w-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: collection.color }}
                    />
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-medium truncate">{collection.name}</p>
                      <p className="text-xs opacity-70">
                        {collection.productIds.length} items
                      </p>
                    </div>

                    {collection.isShared && (
                      <Users className="h-3.5 w-3.5 flex-shrink-0" />
                    )}
                  </button>

                  {collection.id !== 'default' && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 h-7 w-7 p-0"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setShareDialogOpen(true)}>
                          <Share2 className="h-4 w-4 mr-2" />
                          Share
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteCollection(collection.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Stats */}
          <Card className="p-4 mt-4">
            <h3 className="font-semibold mb-3 text-sm">Quick Stats</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total Items</span>
                <span className="font-semibold">{items.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Collections</span>
                <span className="font-semibold">{collections.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Shared</span>
                <span className="font-semibold">
                  {collections.filter((c) => c.isShared).length}
                </span>
              </div>
            </div>
          </Card>
        </aside>

        {/* Products Grid */}
        <div className="lg:col-span-3">
          {activeCollection && (
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{activeCollection.name}</h2>
                  {activeCollection.description && (
                    <p className="text-muted-foreground text-sm mt-1">
                      {activeCollection.description}
                    </p>
                  )}
                </div>

                <Button variant="outline" size="sm" asChild>
                  <Link href="/products">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Products
                  </Link>
                </Button>
              </div>

              {activeCollection.isShared && (
                <Badge variant="secondary" className="mt-3">
                  <Users className="h-3 w-3 mr-1" />
                  Shared with {activeCollection.sharedWith?.length || 0} people
                </Badge>
              )}
            </div>
          )}

          {collectionItems.length === 0 ? (
            <Card className="p-12">
              <div className="text-center">
                <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No items in this collection</h3>
                <p className="text-muted-foreground mb-6">
                  Start adding products to organize your wishlist
                </p>
                <Button asChild>
                  <Link href="/products">Browse Products</Link>
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {collectionItems.map((item) => (
                <Card key={item.id} className="overflow-hidden group">
                  <Link href={`/product/${item.slug}`}>
                    <div className="aspect-square bg-muted relative overflow-hidden">
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      )}
                    </div>
                  </Link>

                  <div className="p-4">
                    <Link href={`/product/${item.slug}`}>
                      <h3 className="font-semibold line-clamp-2 hover:text-primary transition-colors mb-2">
                        {item.name}
                      </h3>
                    </Link>

                    <PriceDisplay
                      price={item.price}
                      compareAtPrice={item.compareAtPrice}
                      size="lg"
                      showDiscount
                    />

                    <Separator className="my-4" />

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleAddToCart(item)}
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Add to Cart
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleSetPriceAlert(item)}>
                            <TrendingDown className="h-4 w-4 mr-2" />
                            Set Price Alert
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSetRestockAlert(item)}>
                            <Bell className="h-4 w-4 mr-2" />
                            Restock Alert
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleRemoveFromWishlist(item.productId)}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Share Collection Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Collection</DialogTitle>
            <DialogDescription>
              Share "{activeCollection?.name}" with your team members
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="emails">Email Addresses</Label>
              <Textarea
                id="emails"
                placeholder="Enter email addresses separated by commas"
                rows={3}
                value={shareEmails}
                onChange={(e) => setShareEmails(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Example: colleague@company.com, team@company.com
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShareDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleShareCollection}>Share Collection</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

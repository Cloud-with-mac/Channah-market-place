import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Collection {
  id: string
  name: string
  description?: string
  productIds: string[]
  isShared: boolean
  sharedWith?: string[] // User IDs or emails
  createdAt: string
  updatedAt: string
  color?: string // For UI categorization
}

interface CollectionsState {
  collections: Collection[]
  activeCollectionId: string | null

  // Collection management
  createCollection: (name: string, description?: string, color?: string) => string
  updateCollection: (id: string, updates: Partial<Collection>) => void
  deleteCollection: (id: string) => void
  setActiveCollection: (id: string | null) => void

  // Product management
  addProductToCollection: (collectionId: string, productId: string) => void
  removeProductFromCollection: (collectionId: string, productId: string) => void
  moveProduct: (productId: string, fromCollectionId: string, toCollectionId: string) => void
  isProductInCollection: (collectionId: string, productId: string) => boolean

  // Sharing
  shareCollection: (collectionId: string, userIds: string[]) => void
  unshareCollection: (collectionId: string) => void

  // Utilities
  getCollection: (id: string) => Collection | undefined
  getProductCollections: (productId: string) => Collection[]
  getCollectionProducts: (collectionId: string) => string[]
}

export const useCollectionsStore = create<CollectionsState>()(
  persist(
    (set, get) => ({
      collections: [
        {
          id: 'default',
          name: 'My Wishlist',
          description: 'Default wishlist',
          productIds: [],
          isShared: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          color: '#3b82f6',
        },
      ],
      activeCollectionId: 'default',

      createCollection: (name, description, color) => {
        const newCollection: Collection = {
          id: `collection-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name,
          description,
          productIds: [],
          isShared: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          color: color || '#3b82f6',
        }

        set((state) => ({
          collections: [...state.collections, newCollection],
        }))

        return newCollection.id
      },

      updateCollection: (id, updates) => {
        set((state) => ({
          collections: state.collections.map((collection) =>
            collection.id === id
              ? { ...collection, ...updates, updatedAt: new Date().toISOString() }
              : collection
          ),
        }))
      },

      deleteCollection: (id) => {
        // Don't allow deleting the default collection
        if (id === 'default') return

        set((state) => ({
          collections: state.collections.filter((collection) => collection.id !== id),
          activeCollectionId: state.activeCollectionId === id ? 'default' : state.activeCollectionId,
        }))
      },

      setActiveCollection: (id) => {
        set({ activeCollectionId: id })
      },

      addProductToCollection: (collectionId, productId) => {
        set((state) => ({
          collections: state.collections.map((collection) =>
            collection.id === collectionId
              ? {
                  ...collection,
                  productIds: collection.productIds.includes(productId)
                    ? collection.productIds
                    : [...collection.productIds, productId],
                  updatedAt: new Date().toISOString(),
                }
              : collection
          ),
        }))
      },

      removeProductFromCollection: (collectionId, productId) => {
        set((state) => ({
          collections: state.collections.map((collection) =>
            collection.id === collectionId
              ? {
                  ...collection,
                  productIds: collection.productIds.filter((id) => id !== productId),
                  updatedAt: new Date().toISOString(),
                }
              : collection
          ),
        }))
      },

      moveProduct: (productId, fromCollectionId, toCollectionId) => {
        const { removeProductFromCollection, addProductToCollection } = get()
        removeProductFromCollection(fromCollectionId, productId)
        addProductToCollection(toCollectionId, productId)
      },

      isProductInCollection: (collectionId, productId) => {
        const collection = get().collections.find((c) => c.id === collectionId)
        return collection?.productIds.includes(productId) || false
      },

      shareCollection: (collectionId, userIds) => {
        set((state) => ({
          collections: state.collections.map((collection) =>
            collection.id === collectionId
              ? {
                  ...collection,
                  isShared: true,
                  sharedWith: userIds,
                  updatedAt: new Date().toISOString(),
                }
              : collection
          ),
        }))
      },

      unshareCollection: (collectionId) => {
        set((state) => ({
          collections: state.collections.map((collection) =>
            collection.id === collectionId
              ? {
                  ...collection,
                  isShared: false,
                  sharedWith: undefined,
                  updatedAt: new Date().toISOString(),
                }
              : collection
          ),
        }))
      },

      getCollection: (id) => {
        return get().collections.find((collection) => collection.id === id)
      },

      getProductCollections: (productId) => {
        return get().collections.filter((collection) =>
          collection.productIds.includes(productId)
        )
      },

      getCollectionProducts: (collectionId) => {
        const collection = get().collections.find((c) => c.id === collectionId)
        return collection?.productIds || []
      },
    }),
    {
      name: 'vendora-collections',
    }
  )
)

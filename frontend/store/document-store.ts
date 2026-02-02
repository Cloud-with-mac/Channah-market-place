import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Document {
  id: string
  name: string
  type: 'invoice' | 'certificate' | 'contract' | 'spec_sheet' | 'test_report' | 'other'
  fileUrl: string
  fileSize: number
  mimeType: string
  uploadedBy: string
  uploadedAt: string
  relatedTo?: {
    type: 'order' | 'product' | 'vendor' | 'po'
    id: string
    name: string
  }
  tags: string[]
  isVerified: boolean
  expiryDate?: string
  notes?: string
}

export interface DocumentFolder {
  id: string
  name: string
  description?: string
  documentIds: string[]
  createdAt: string
  color?: string
}

interface DocumentState {
  documents: Document[]
  folders: DocumentFolder[]

  // Document Management
  uploadDocument: (doc: Omit<Document, 'id' | 'uploadedAt'>) => string
  deleteDocument: (id: string) => void
  updateDocument: (id: string, updates: Partial<Document>) => void
  getDocument: (id: string) => Document | undefined

  // Folder Management
  createFolder: (name: string, description?: string) => string
  deleteFolder: (id: string) => void
  addToFolder: (folderId: string, documentId: string) => void
  removeFromFolder: (folderId: string, documentId: string) => void

  // Search & Filter
  searchDocuments: (query: string) => Document[]
  getDocumentsByType: (type: Document['type']) => Document[]
  getExpiring: () => Document[]
}

export const useDocumentStore = create<DocumentState>()(
  persist(
    (set, get) => ({
      documents: [],
      folders: [],

      uploadDocument: (docData) => {
        const newDoc: Document = {
          ...docData,
          id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          uploadedAt: new Date().toISOString(),
        }

        set((state) => ({
          documents: [...state.documents, newDoc],
        }))

        return newDoc.id
      },

      deleteDocument: (id) => {
        set((state) => ({
          documents: state.documents.filter((doc) => doc.id !== id),
          folders: state.folders.map((folder) => ({
            ...folder,
            documentIds: folder.documentIds.filter((docId) => docId !== id),
          })),
        }))
      },

      updateDocument: (id, updates) => {
        set((state) => ({
          documents: state.documents.map((doc) =>
            doc.id === id ? { ...doc, ...updates } : doc
          ),
        }))
      },

      getDocument: (id) => {
        return get().documents.find((doc) => doc.id === id)
      },

      createFolder: (name, description) => {
        const newFolder: DocumentFolder = {
          id: `folder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name,
          description,
          documentIds: [],
          createdAt: new Date().toISOString(),
          color: ['blue', 'green', 'purple', 'orange', 'pink'][Math.floor(Math.random() * 5)],
        }

        set((state) => ({
          folders: [...state.folders, newFolder],
        }))

        return newFolder.id
      },

      deleteFolder: (id) => {
        set((state) => ({
          folders: state.folders.filter((folder) => folder.id !== id),
        }))
      },

      addToFolder: (folderId, documentId) => {
        set((state) => ({
          folders: state.folders.map((folder) =>
            folder.id === folderId && !folder.documentIds.includes(documentId)
              ? { ...folder, documentIds: [...folder.documentIds, documentId] }
              : folder
          ),
        }))
      },

      removeFromFolder: (folderId, documentId) => {
        set((state) => ({
          folders: state.folders.map((folder) =>
            folder.id === folderId
              ? { ...folder, documentIds: folder.documentIds.filter((id) => id !== documentId) }
              : folder
          ),
        }))
      },

      searchDocuments: (query) => {
        const lowerQuery = query.toLowerCase()
        return get().documents.filter(
          (doc) =>
            doc.name.toLowerCase().includes(lowerQuery) ||
            doc.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)) ||
            doc.notes?.toLowerCase().includes(lowerQuery)
        )
      },

      getDocumentsByType: (type) => {
        return get().documents.filter((doc) => doc.type === type)
      },

      getExpiring: () => {
        const thirtyDaysFromNow = new Date()
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

        return get().documents.filter((doc) => {
          if (!doc.expiryDate) return false
          return new Date(doc.expiryDate) <= thirtyDaysFromNow
        })
      },
    }),
    {
      name: 'channah-documents',
    }
  )
)

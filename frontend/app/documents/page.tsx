'use client'

import * as React from 'react'
import { Suspense } from 'react'
import {
  Upload,
  FileText,
  Search,
  Filter,
  Download,
  Eye,
  Trash2,
  FolderPlus,
  Folder,
  FolderOpen,
  File,
  AlertTriangle,
  Calendar,
  Tag,
  X,
  Plus,
  MoreVertical,
  Edit,
  CheckCircle,
  AlertCircle,
  Clock,
  Grid3X3,
  List as ListIcon,
  SortAsc,
  SortDesc,
  FileCheck,
  FileSpreadsheet,
  FileCog,
  ClipboardList,
  ShieldCheck,
  Loader2
} from 'lucide-react'
import { useDocumentStore, Document, DocumentFolder } from '@/store/document-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import { format, formatDistanceToNow, differenceInDays, isPast, isFuture } from 'date-fns'

// Document type icons and labels
const documentTypeConfig = {
  invoice: { icon: FileSpreadsheet, label: 'Invoice', color: 'text-blue-500 bg-blue-50 dark:bg-blue-950' },
  certificate: { icon: ShieldCheck, label: 'Certificate', color: 'text-green-500 bg-green-50 dark:bg-green-950' },
  contract: { icon: FileCheck, label: 'Contract', color: 'text-purple-500 bg-purple-50 dark:bg-purple-950' },
  spec_sheet: { icon: FileCog, label: 'Specification Sheet', color: 'text-orange-500 bg-orange-50 dark:bg-orange-950' },
  test_report: { icon: ClipboardList, label: 'Test Report', color: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-950' },
  other: { icon: FileText, label: 'Other', color: 'text-gray-500 bg-gray-50 dark:bg-gray-950' },
}

function DocumentManagementContent() {
  const {
    documents,
    folders,
    uploadDocument,
    deleteDocument,
    updateDocument,
    createFolder,
    deleteFolder,
    addToFolder,
    removeFromFolder,
    searchDocuments,
    getDocumentsByType,
    getExpiring
  } = useDocumentStore()

  // State
  const [searchQuery, setSearchQuery] = React.useState('')
  const [selectedType, setSelectedType] = React.useState<Document['type'] | 'all'>('all')
  const [selectedFolder, setSelectedFolder] = React.useState<string | null>(null)
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = React.useState<'name' | 'date' | 'type'>('date')
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc')
  const [isDragging, setIsDragging] = React.useState(false)
  const [uploadDialogOpen, setUploadDialogOpen] = React.useState(false)
  const [folderDialogOpen, setFolderDialogOpen] = React.useState(false)
  const [editingDocument, setEditingDocument] = React.useState<Document | null>(null)
  const [previewDocument, setPreviewDocument] = React.useState<Document | null>(null)

  // Upload form state
  const [uploadForm, setUploadForm] = React.useState({
    name: '',
    type: 'other' as Document['type'],
    file: null as File | null,
    tags: [] as string[],
    tagInput: '',
    expiryDate: '',
    notes: '',
    relatedTo: null as Document['relatedTo'] | null,
  })

  // Folder form state
  const [folderForm, setFolderForm] = React.useState({
    name: '',
    description: '',
  })

  // Filter and search documents
  const filteredDocuments = React.useMemo(() => {
    let filtered = documents

    // Search
    if (searchQuery.trim()) {
      filtered = searchDocuments(searchQuery)
    }

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(doc => doc.type === selectedType)
    }

    // Filter by folder
    if (selectedFolder) {
      const folder = folders.find(f => f.id === selectedFolder)
      if (folder) {
        filtered = filtered.filter(doc => folder.documentIds.includes(doc.id))
      }
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      let comparison = 0
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name)
      } else if (sortBy === 'date') {
        comparison = new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime()
      } else if (sortBy === 'type') {
        comparison = a.type.localeCompare(b.type)
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })

    return filtered
  }, [documents, searchQuery, selectedType, selectedFolder, sortBy, sortOrder, folders, searchDocuments])

  // Get expiring documents
  const expiringDocs = React.useMemo(() => getExpiring(), [documents, getExpiring])

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      setUploadForm({ ...uploadForm, file: files[0], name: files[0].name })
      setUploadDialogOpen(true)
    }
  }

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadForm({ ...uploadForm, file, name: file.name })
      setUploadDialogOpen(true)
    }
  }

  // Handle upload
  const handleUpload = () => {
    if (!uploadForm.file) return

    uploadDocument({
      name: uploadForm.name,
      type: uploadForm.type,
      fileUrl: URL.createObjectURL(uploadForm.file), // In production, upload to server
      fileSize: uploadForm.file.size,
      mimeType: uploadForm.file.type,
      uploadedBy: 'Current User', // Replace with actual user
      tags: uploadForm.tags,
      expiryDate: uploadForm.expiryDate || undefined,
      notes: uploadForm.notes || undefined,
      relatedTo: uploadForm.relatedTo || undefined,
      isVerified: false,
    })

    // Reset form
    setUploadForm({
      name: '',
      type: 'other',
      file: null,
      tags: [],
      tagInput: '',
      expiryDate: '',
      notes: '',
      relatedTo: null,
    })
    setUploadDialogOpen(false)
  }

  // Handle tag addition
  const handleAddTag = () => {
    if (uploadForm.tagInput.trim() && !uploadForm.tags.includes(uploadForm.tagInput.trim())) {
      setUploadForm({
        ...uploadForm,
        tags: [...uploadForm.tags, uploadForm.tagInput.trim()],
        tagInput: '',
      })
    }
  }

  // Handle tag removal
  const handleRemoveTag = (tag: string) => {
    setUploadForm({
      ...uploadForm,
      tags: uploadForm.tags.filter(t => t !== tag),
    })
  }

  // Handle folder creation
  const handleCreateFolder = () => {
    if (folderForm.name.trim()) {
      createFolder(folderForm.name, folderForm.description)
      setFolderForm({ name: '', description: '' })
      setFolderDialogOpen(false)
    }
  }

  // Handle document download
  const handleDownload = (doc: Document) => {
    // In production, this would download from the server
    const link = document.createElement('a')
    link.href = doc.fileUrl
    link.download = doc.name
    link.click()
  }

  // Get expiry status
  const getExpiryStatus = (expiryDate?: string) => {
    if (!expiryDate) return null

    const expiry = new Date(expiryDate)
    const daysUntilExpiry = differenceInDays(expiry, new Date())

    if (isPast(expiry)) {
      return { status: 'expired', color: 'text-red-500', icon: AlertCircle, label: 'Expired' }
    } else if (daysUntilExpiry <= 7) {
      return { status: 'critical', color: 'text-red-500', icon: AlertTriangle, label: `Expires in ${daysUntilExpiry} days` }
    } else if (daysUntilExpiry <= 30) {
      return { status: 'warning', color: 'text-orange-500', icon: AlertTriangle, label: `Expires in ${daysUntilExpiry} days` }
    } else {
      return { status: 'good', color: 'text-green-500', icon: CheckCircle, label: `Expires ${format(expiry, 'MMM dd, yyyy')}` }
    }
  }

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-display mb-2">Document Management Center</h1>
        <p className="text-muted-foreground">
          Manage, organize, and track all your business documents in one place
        </p>
      </div>

      {/* Expiring Documents Alert */}
      {expiringDocs.length > 0 && (
        <Alert className="mb-6 border-orange-200 bg-orange-50 dark:bg-orange-950/20">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-900 dark:text-orange-200">Document Expiry Warning</AlertTitle>
          <AlertDescription className="text-orange-800 dark:text-orange-300">
            You have {expiringDocs.length} document{expiringDocs.length > 1 ? 's' : ''} expiring soon. Please review and renew as necessary.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-64 space-y-6">
          {/* Upload Section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full" onClick={() => setUploadDialogOpen(true)}>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Document
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Upload Document</DialogTitle>
                    <DialogDescription>
                      Add a new document to your collection. Fill in the details below.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    {/* File Upload */}
                    <div className="space-y-2">
                      <Label htmlFor="file">File</Label>
                      <Input
                        id="file"
                        type="file"
                        onChange={handleFileChange}
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                      />
                      {uploadForm.file && (
                        <p className="text-sm text-muted-foreground">
                          Selected: {uploadForm.file.name} ({formatFileSize(uploadForm.file.size)})
                        </p>
                      )}
                    </div>

                    {/* Document Name */}
                    <div className="space-y-2">
                      <Label htmlFor="name">Document Name</Label>
                      <Input
                        id="name"
                        value={uploadForm.name}
                        onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                        placeholder="Enter document name"
                      />
                    </div>

                    {/* Document Type */}
                    <div className="space-y-2">
                      <Label htmlFor="type">Document Type</Label>
                      <Select
                        value={uploadForm.type}
                        onValueChange={(value: Document['type']) => setUploadForm({ ...uploadForm, type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(documentTypeConfig).map(([key, config]) => (
                            <SelectItem key={key} value={key}>
                              <div className="flex items-center gap-2">
                                <config.icon className="h-4 w-4" />
                                {config.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Tags */}
                    <div className="space-y-2">
                      <Label htmlFor="tags">Tags</Label>
                      <div className="flex gap-2">
                        <Input
                          id="tags"
                          value={uploadForm.tagInput}
                          onChange={(e) => setUploadForm({ ...uploadForm, tagInput: e.target.value })}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                          placeholder="Add tags..."
                        />
                        <Button type="button" size="sm" onClick={handleAddTag}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      {uploadForm.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {uploadForm.tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="gap-1">
                              {tag}
                              <X
                                className="h-3 w-3 cursor-pointer hover:text-destructive"
                                onClick={() => handleRemoveTag(tag)}
                              />
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Expiry Date */}
                    <div className="space-y-2">
                      <Label htmlFor="expiry">Expiry Date (Optional)</Label>
                      <Input
                        id="expiry"
                        type="date"
                        value={uploadForm.expiryDate}
                        onChange={(e) => setUploadForm({ ...uploadForm, expiryDate: e.target.value })}
                      />
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes (Optional)</Label>
                      <Textarea
                        id="notes"
                        value={uploadForm.notes}
                        onChange={(e) => setUploadForm({ ...uploadForm, notes: e.target.value })}
                        placeholder="Add any additional notes..."
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleUpload} disabled={!uploadForm.file || !uploadForm.name}>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Document
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <FolderPlus className="mr-2 h-4 w-4" />
                    New Folder
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Folder</DialogTitle>
                    <DialogDescription>
                      Organize your documents by creating folders.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="folder-name">Folder Name</Label>
                      <Input
                        id="folder-name"
                        value={folderForm.name}
                        onChange={(e) => setFolderForm({ ...folderForm, name: e.target.value })}
                        placeholder="Enter folder name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="folder-desc">Description (Optional)</Label>
                      <Textarea
                        id="folder-desc"
                        value={folderForm.description}
                        onChange={(e) => setFolderForm({ ...folderForm, description: e.target.value })}
                        placeholder="Enter folder description"
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setFolderDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateFolder} disabled={!folderForm.name}>
                      <FolderPlus className="mr-2 h-4 w-4" />
                      Create Folder
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Hidden file input for drag and drop */}
              <input
                type="file"
                id="hidden-file-input"
                className="hidden"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
              />
            </CardContent>
          </Card>

          {/* Folders */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Folder className="h-4 w-4" />
                Folders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-1">
                  <button
                    onClick={() => setSelectedFolder(null)}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors hover:bg-muted",
                      !selectedFolder && "bg-muted font-medium"
                    )}
                  >
                    <FolderOpen className="h-4 w-4" />
                    All Documents
                    <Badge variant="secondary" className="ml-auto">
                      {documents.length}
                    </Badge>
                  </button>
                  {folders.map(folder => (
                    <div key={folder.id} className="group relative">
                      <button
                        onClick={() => setSelectedFolder(folder.id)}
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors hover:bg-muted",
                          selectedFolder === folder.id && "bg-muted font-medium"
                        )}
                      >
                        <Folder className={cn("h-4 w-4", folder.color && `text-${folder.color}-500`)} />
                        <span className="truncate flex-1 text-left">{folder.name}</span>
                        <Badge variant="secondary" className="ml-auto">
                          {folder.documentIds.length}
                        </Badge>
                      </button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 opacity-0 group-hover:opacity-100"
                          >
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => deleteFolder(folder.id)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Folder
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Filters */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filter by Type
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedType('all')}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors hover:bg-muted",
                    selectedType === 'all' && "bg-muted font-medium"
                  )}
                >
                  All Types
                  <Badge variant="secondary" className="ml-auto">
                    {documents.length}
                  </Badge>
                </button>
                {Object.entries(documentTypeConfig).map(([key, config]) => {
                  const count = documents.filter(doc => doc.type === key).length
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedType(key as Document['type'])}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors hover:bg-muted",
                        selectedType === key && "bg-muted font-medium"
                      )}
                    >
                      <config.icon className="h-4 w-4" />
                      {config.label}
                      <Badge variant="secondary" className="ml-auto">
                        {count}
                      </Badge>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-4">
          {/* Search and Toolbar */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search documents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Sort by Date</SelectItem>
                      <SelectItem value="name">Sort by Name</SelectItem>
                      <SelectItem value="type">Sort by Type</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  >
                    {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                  </Button>
                  <div className="flex border rounded-md">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "rounded-none rounded-l-md",
                        viewMode === 'grid' && "bg-muted"
                      )}
                      onClick={() => setViewMode('grid')}
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "rounded-none rounded-r-md",
                        viewMode === 'list' && "bg-muted"
                      )}
                      onClick={() => setViewMode('list')}
                    >
                      <ListIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Drag and Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
              isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"
            )}
          >
            <Upload className={cn("h-12 w-12 mx-auto mb-4", isDragging ? "text-primary" : "text-muted-foreground")} />
            <p className="text-lg font-medium mb-1">
              {isDragging ? "Drop file to upload" : "Drag and drop files here"}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              or click the button below to browse
            </p>
            <Button
              variant="outline"
              onClick={() => document.getElementById('hidden-file-input')?.click()}
            >
              Browse Files
            </Button>
          </div>

          {/* Documents List/Grid */}
          {filteredDocuments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <FileText className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <h3 className="text-xl font-semibold mb-2">No documents found</h3>
                <p className="text-muted-foreground text-center mb-6 max-w-md">
                  {searchQuery
                    ? "No documents match your search criteria. Try adjusting your filters."
                    : "Upload your first document to get started."}
                </p>
                <Button onClick={() => setUploadDialogOpen(true)}>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Document
                </Button>
              </CardContent>
            </Card>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDocuments.map(doc => {
                const typeConfig = documentTypeConfig[doc.type]
                const TypeIcon = typeConfig.icon
                const expiryStatus = getExpiryStatus(doc.expiryDate)
                const ExpiryIcon = expiryStatus?.icon

                return (
                  <Card key={doc.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className={cn("p-2 rounded-lg", typeConfig.color)}>
                          <TypeIcon className="h-5 w-5" />
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setPreviewDocument(doc)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Preview
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownload(doc)}>
                              <Download className="mr-2 h-4 w-4" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setEditingDocument(doc)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {folders.map(folder => (
                              <DropdownMenuItem
                                key={folder.id}
                                onClick={() => addToFolder(folder.id, doc.id)}
                              >
                                <Folder className="mr-2 h-4 w-4" />
                                Add to {folder.name}
                              </DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => deleteDocument(doc.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <CardTitle className="text-base mt-2 line-clamp-2">{doc.name}</CardTitle>
                      <CardDescription>
                        <Badge variant="outline" className="text-xs">
                          {typeConfig.label}
                        </Badge>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* File Info */}
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div className="flex items-center justify-between">
                          <span>Size:</span>
                          <span>{formatFileSize(doc.fileSize)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Uploaded:</span>
                          <span>{formatDistanceToNow(new Date(doc.uploadedAt), { addSuffix: true })}</span>
                        </div>
                      </div>

                      {/* Expiry Warning */}
                      {expiryStatus && ExpiryIcon && (
                        <div className={cn("flex items-center gap-2 text-sm", expiryStatus.color)}>
                          <ExpiryIcon className="h-4 w-4" />
                          <span className="text-xs">{expiryStatus.label}</span>
                        </div>
                      )}

                      {/* Tags */}
                      {doc.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {doc.tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              <Tag className="h-3 w-3 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Verified Badge */}
                      {doc.isVerified && (
                        <Badge className="w-full justify-center bg-green-500">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </CardContent>
                    <CardFooter className="flex gap-2 pt-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setPreviewDocument(doc)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Preview
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleDownload(doc)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </CardFooter>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {filteredDocuments.map(doc => {
                    const typeConfig = documentTypeConfig[doc.type]
                    const TypeIcon = typeConfig.icon
                    const expiryStatus = getExpiryStatus(doc.expiryDate)
                    const ExpiryIcon = expiryStatus?.icon

                    return (
                      <div key={doc.id} className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors">
                        <div className={cn("p-3 rounded-lg", typeConfig.color)}>
                          <TypeIcon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{doc.name}</h4>
                          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                            <span>{typeConfig.label}</span>
                            <span>•</span>
                            <span>{formatFileSize(doc.fileSize)}</span>
                            <span>•</span>
                            <span>{formatDistanceToNow(new Date(doc.uploadedAt), { addSuffix: true })}</span>
                          </div>
                        </div>
                        {expiryStatus && ExpiryIcon && (
                          <div className={cn("flex items-center gap-2 text-sm", expiryStatus.color)}>
                            <ExpiryIcon className="h-4 w-4" />
                            <span className="text-xs whitespace-nowrap">{expiryStatus.label}</span>
                          </div>
                        )}
                        {doc.tags.length > 0 && (
                          <div className="flex gap-1">
                            {doc.tags.slice(0, 2).map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {doc.tags.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{doc.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setPreviewDocument(doc)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownload(doc)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setEditingDocument(doc)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Details
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {folders.map(folder => (
                                <DropdownMenuItem
                                  key={folder.id}
                                  onClick={() => addToFolder(folder.id, doc.id)}
                                >
                                  <Folder className="mr-2 h-4 w-4" />
                                  Add to {folder.name}
                                </DropdownMenuItem>
                              ))}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => deleteDocument(doc.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Preview Dialog */}
      {previewDocument && (
        <Dialog open={!!previewDocument} onOpenChange={() => setPreviewDocument(null)}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>{previewDocument.name}</DialogTitle>
              <DialogDescription>
                Document preview and details
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Preview Area */}
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Preview not available. Click download to view the document.
                  </p>
                </div>
              </div>

              {/* Document Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Type</Label>
                  <p className="mt-1">{documentTypeConfig[previewDocument.type].label}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Size</Label>
                  <p className="mt-1">{formatFileSize(previewDocument.fileSize)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Uploaded By</Label>
                  <p className="mt-1">{previewDocument.uploadedBy}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Upload Date</Label>
                  <p className="mt-1">{format(new Date(previewDocument.uploadedAt), 'MMM dd, yyyy')}</p>
                </div>
                {previewDocument.expiryDate && (
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">Expiry Date</Label>
                    <p className="mt-1">{format(new Date(previewDocument.expiryDate), 'MMM dd, yyyy')}</p>
                  </div>
                )}
              </div>

              {previewDocument.tags.length > 0 && (
                <div>
                  <Label className="text-muted-foreground">Tags</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {previewDocument.tags.map(tag => (
                      <Badge key={tag} variant="secondary">
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {previewDocument.notes && (
                <div>
                  <Label className="text-muted-foreground">Notes</Label>
                  <p className="mt-1 text-sm">{previewDocument.notes}</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPreviewDocument(null)}>
                Close
              </Button>
              <Button onClick={() => handleDownload(previewDocument)}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

export default function DocumentsPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    }>
      <DocumentManagementContent />
    </Suspense>
  )
}

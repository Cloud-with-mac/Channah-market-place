'use client'

import { useState, useRef } from 'react'
import { useBulkOrderStore } from '@/store/bulk-order-store'
import type { BulkOrderItem } from '@/store/bulk-order-store'
import { useCartStore } from '@/store'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Upload,
  Download,
  FileSpreadsheet,
  ShoppingCart,
  Trash2,
  Save,
  AlertCircle,
  CheckCircle2,
  FileText,
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function BulkOrderPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const {
    currentImport,
    templates,
    parseCSV,
    setCurrentImport,
    clearCurrentImport,
    validateImport,
    exportToCSV,
    generateTemplate,
    createTemplate,
    deleteTemplate,
    getTemplate,
  } = useBulkOrderStore()

  const { addItem } = useCartStore()

  const [isProcessing, setIsProcessing] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.csv')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a CSV file',
        variant: 'destructive',
      })
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const csvText = event.target?.result as string
      const items = parseCSV(csvText)

      if (items.length === 0) {
        toast({
          title: 'No items found',
          description: 'The CSV file appears to be empty or incorrectly formatted',
          variant: 'destructive',
        })
        return
      }

      const validatedItems = validateImport(items)
      setCurrentImport(validatedItems)

      toast({
        title: 'CSV imported successfully',
        description: `${items.length} items loaded`,
      })
    }

    reader.readAsText(file)
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDownloadTemplate = () => {
    const csvContent = generateTemplate()
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'bulk-order-template.csv'
    a.click()
    window.URL.revokeObjectURL(url)

    toast({
      title: 'Template downloaded',
      description: 'Fill in the template and upload to place bulk orders',
    })
  }

  const handleExportCurrent = () => {
    if (currentImport.length === 0) {
      toast({
        title: 'No items to export',
        description: 'Import or add items first',
        variant: 'destructive',
      })
      return
    }

    const csvContent = exportToCSV(currentImport)
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bulk-order-${Date.now()}.csv`
    a.click()
    window.URL.revokeObjectURL(url)

    toast({
      title: 'Export successful',
      description: 'Your bulk order has been exported',
    })
  }

  const handleSaveTemplate = () => {
    if (!templateName.trim()) {
      toast({
        title: 'Template name required',
        description: 'Please enter a name for this template',
        variant: 'destructive',
      })
      return
    }

    if (currentImport.length === 0) {
      toast({
        title: 'No items to save',
        description: 'Import or add items first',
        variant: 'destructive',
      })
      return
    }

    createTemplate(templateName, currentImport)
    setTemplateName('')
    setIsSaveDialogOpen(false)

    toast({
      title: 'Template saved',
      description: `"${templateName}" template has been saved`,
    })
  }

  const handleLoadTemplate = (templateId: string) => {
    const template = getTemplate(templateId)
    if (template) {
      setCurrentImport(template.items)
      toast({
        title: 'Template loaded',
        description: `"${template.name}" has been loaded`,
      })
    }
  }

  const handleAddToCart = async () => {
    const validItems = currentImport.filter((item) => !item.error)

    if (validItems.length === 0) {
      toast({
        title: 'No valid items',
        description: 'Fix errors before adding to cart',
        variant: 'destructive',
      })
      return
    }

    setIsProcessing(true)

    try {
      // Add each item to cart
      for (const item of validItems) {
        await addItem({
          id: item.sku,
          name: item.productName,
          price: item.unitPrice,
          image: '', // Would be fetched from backend
          quantity: item.quantity,
        })
      }

      toast({
        title: 'Items added to cart',
        description: `${validItems.length} items have been added to your cart`,
      })

      clearCurrentImport()
    } catch (error) {
      console.error('Failed to add items to cart:', error)
      toast({
        title: 'Error adding items',
        description: 'Some items could not be added to cart',
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const removeItem = (index: number) => {
    setCurrentImport(currentImport.filter((_, i) => i !== index))
  }

  const validItemCount = currentImport.filter((item) => !item.error).length
  const errorItemCount = currentImport.filter((item) => item.error).length

  return (
    <div className="container py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-display mb-2">Bulk Order Import</h1>
        <p className="text-muted-foreground">
          Import orders from CSV or Excel files for quick bulk purchasing
        </p>
      </div>

      {/* Action Buttons */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {/* Upload CSV */}
        <Card className="p-6 hover:border-primary/50 transition-colors">
          <div className="text-center">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Upload CSV</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Import orders from CSV file
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileUpload}
            />
            <Button onClick={() => fileInputRef.current?.click()} className="w-full">
              <Upload className="h-4 w-4 mr-2" />
              Choose File
            </Button>
          </div>
        </Card>

        {/* Download Template */}
        <Card className="p-6 hover:border-primary/50 transition-colors">
          <div className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-3">
              <FileSpreadsheet className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-semibold mb-2">Download Template</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Get CSV template with format
            </p>
            <Button onClick={handleDownloadTemplate} variant="outline" className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Get Template
            </Button>
          </div>
        </Card>

        {/* Load Template */}
        <Card className="p-6 hover:border-primary/50 transition-colors">
          <div className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-3">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-semibold mb-2">Saved Templates</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Load from {templates.length} saved templates
            </p>
            <Select value={selectedTemplate} onValueChange={handleLoadTemplate}>
              <SelectTrigger>
                <SelectValue placeholder="Select template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name} ({template.items.length} items)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>
      </div>

      {/* Imported Items */}
      {currentImport.length > 0 && (
        <>
          <Card className="p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold">Imported Items ({currentImport.length})</h2>
                <div className="flex items-center gap-4 mt-1">
                  {validItemCount > 0 && (
                    <Badge className="bg-green-600">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      {validItemCount} valid
                    </Badge>
                  )}
                  {errorItemCount > 0 && (
                    <Badge variant="destructive">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errorItemCount} errors
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleExportCurrent}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>

                <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Save className="h-4 w-4 mr-2" />
                      Save Template
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Save as Template</DialogTitle>
                      <DialogDescription>
                        Save this bulk order for quick reuse
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <Label htmlFor="templateName">Template Name</Label>
                      <Input
                        id="templateName"
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        placeholder="e.g., Monthly Inventory Restock"
                      />
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleSaveTemplate}>Save Template</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Button onClick={clearCurrentImport} variant="outline">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All
                </Button>

                <Button
                  onClick={handleAddToCart}
                  disabled={validItemCount === 0 || isProcessing}
                  size="lg"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Add to Cart ({validItemCount})
                </Button>
              </div>
            </div>

            <Separator className="mb-4" />

            {/* Items Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 text-sm font-semibold">#</th>
                    <th className="text-left p-2 text-sm font-semibold">SKU</th>
                    <th className="text-left p-2 text-sm font-semibold">Product Name</th>
                    <th className="text-left p-2 text-sm font-semibold">Quantity</th>
                    <th className="text-left p-2 text-sm font-semibold">Unit Price</th>
                    <th className="text-left p-2 text-sm font-semibold">Total</th>
                    <th className="text-left p-2 text-sm font-semibold">Status</th>
                    <th className="text-right p-2 text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentImport.map((item, index) => (
                    <tr
                      key={index}
                      className={`border-b ${item.error ? 'bg-red-50 dark:bg-red-950/10' : ''}`}
                    >
                      <td className="p-2 text-sm">{index + 1}</td>
                      <td className="p-2 text-sm font-mono">{item.sku}</td>
                      <td className="p-2 text-sm">{item.productName}</td>
                      <td className="p-2 text-sm">{item.quantity.toLocaleString()}</td>
                      <td className="p-2 text-sm">${item.unitPrice.toFixed(2)}</td>
                      <td className="p-2 text-sm font-semibold">
                        ${(item.quantity * item.unitPrice).toFixed(2)}
                      </td>
                      <td className="p-2 text-sm">
                        {item.error ? (
                          <Badge variant="destructive" className="text-xs">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {item.error}
                          </Badge>
                        ) : (
                          <Badge className="bg-green-600 text-xs">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Valid
                          </Badge>
                        )}
                      </td>
                      <td className="p-2 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 font-bold">
                    <td colSpan={3} className="p-2 text-sm">
                      Total ({validItemCount} items)
                    </td>
                    <td className="p-2 text-sm">
                      {currentImport
                        .filter((i) => !i.error)
                        .reduce((sum, item) => sum + item.quantity, 0)
                        .toLocaleString()}
                    </td>
                    <td colSpan={1}></td>
                    <td className="p-2 text-sm">
                      $
                      {currentImport
                        .filter((i) => !i.error)
                        .reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
                        .toFixed(2)}
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* Empty State */}
      {currentImport.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <FileSpreadsheet className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No items imported yet</h3>
            <p className="text-muted-foreground mb-6">
              Upload a CSV file or download our template to get started with bulk ordering
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                Upload CSV
              </Button>
              <Button variant="outline" onClick={handleDownloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Saved Templates Section */}
      {templates.length > 0 && currentImport.length === 0 && (
        <Card className="p-6 mt-6">
          <h2 className="text-xl font-bold mb-4">Saved Templates ({templates.length})</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {templates.map((template) => (
              <Card key={template.id} className="p-4 hover:border-primary/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">{template.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {template.items.length} items • Created{' '}
                      {new Date(template.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleLoadTemplate(template.id)}
                    >
                      Load
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteTemplate(template.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

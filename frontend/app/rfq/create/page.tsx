'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useRFQStore } from '@/store/rfq-store'
import type { RFQSpecification } from '@/store/rfq-store'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Plus, X, FileText, Send } from 'lucide-react'
import Link from 'next/link'
import { toast } from '@/hooks/use-toast'

export default function CreateRFQPage() {
  const router = useRouter()
  const { createRFQ, updateStatus } = useRFQStore()

  const [formData, setFormData] = useState({
    productName: '',
    category: '',
    quantity: '',
    targetPrice: '',
    description: '',
    deliveryDeadline: '',
    destination: '',
    paymentTerms: '',
  })

  const [specifications, setSpecifications] = useState<RFQSpecification[]>([])
  const [newSpec, setNewSpec] = useState({ name: '', value: '', required: false })

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const addSpecification = () => {
    if (newSpec.name && newSpec.value) {
      setSpecifications([...specifications, { ...newSpec }])
      setNewSpec({ name: '', value: '', required: false })
    }
  }

  const removeSpecification = (index: number) => {
    setSpecifications(specifications.filter((_, i) => i !== index))
  }

  const handleSaveDraft = () => {
    if (!formData.productName || !formData.category) {
      toast({
        title: 'Missing information',
        description: 'Please provide product name and category',
        variant: 'destructive',
      })
      return
    }

    const rfqId = createRFQ({
      productName: formData.productName,
      category: formData.category,
      quantity: parseInt(formData.quantity) || 0,
      targetPrice: formData.targetPrice ? parseFloat(formData.targetPrice) : undefined,
      description: formData.description,
      specifications,
      attachments: [],
      deliveryDeadline: formData.deliveryDeadline || undefined,
      destination: formData.destination,
      paymentTerms: formData.paymentTerms || undefined,
    })

    toast({
      title: 'Draft saved',
      description: 'Your RFQ has been saved as a draft',
    })

    router.push(`/rfq/${rfqId}`)
  }

  const handleSubmit = () => {
    if (
      !formData.productName ||
      !formData.category ||
      !formData.quantity ||
      !formData.description
    ) {
      toast({
        title: 'Missing required fields',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      })
      return
    }

    const rfqId = createRFQ({
      productName: formData.productName,
      category: formData.category,
      quantity: parseInt(formData.quantity),
      targetPrice: formData.targetPrice ? parseFloat(formData.targetPrice) : undefined,
      description: formData.description,
      specifications,
      attachments: [],
      deliveryDeadline: formData.deliveryDeadline || undefined,
      destination: formData.destination,
      paymentTerms: formData.paymentTerms || undefined,
    })

    // Set status to open
    updateStatus(rfqId, 'open')

    toast({
      title: 'RFQ submitted',
      description: 'Your RFQ has been published. Suppliers will start sending quotes soon.',
    })

    router.push(`/rfq/${rfqId}`)
  }

  return (
    <div className="container py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/rfq">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to RFQs
          </Link>
        </Button>
        <h1 className="text-3xl font-bold font-display mb-2">Create RFQ</h1>
        <p className="text-muted-foreground">
          Request quotes from multiple suppliers for your business needs
        </p>
      </div>

      <div className="space-y-6">
        {/* Basic Information */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Basic Information
          </h2>

          <div className="space-y-4">
            <div>
              <Label htmlFor="productName">
                Product Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="productName"
                name="productName"
                value={formData.productName}
                onChange={handleInputChange}
                placeholder="e.g., Custom T-shirts with Logo"
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">
                  Category <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleSelectChange('category', value)}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apparel">Apparel & Fashion</SelectItem>
                    <SelectItem value="electronics">Electronics</SelectItem>
                    <SelectItem value="home">Home & Garden</SelectItem>
                    <SelectItem value="machinery">Machinery & Equipment</SelectItem>
                    <SelectItem value="packaging">Packaging & Printing</SelectItem>
                    <SelectItem value="food">Food & Beverage</SelectItem>
                    <SelectItem value="automotive">Automotive</SelectItem>
                    <SelectItem value="construction">Construction Materials</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="quantity">
                  Quantity (units) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  placeholder="1000"
                  min="1"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="targetPrice">Target Price per Unit (optional)</Label>
              <Input
                id="targetPrice"
                name="targetPrice"
                type="number"
                step="0.01"
                value={formData.targetPrice}
                onChange={handleInputChange}
                placeholder="10.00"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Your budget range helps suppliers provide accurate quotes
              </p>
            </div>

            <div>
              <Label htmlFor="description">
                Detailed Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Provide detailed requirements, quality standards, and any special instructions..."
                rows={5}
                required
              />
            </div>
          </div>
        </Card>

        {/* Specifications */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Technical Specifications</h2>

          {specifications.length > 0 && (
            <div className="space-y-2 mb-4">
              {specifications.map((spec, index) => (
                <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{spec.name}:</span>
                      <span className="text-sm">{spec.value}</span>
                      {spec.required && (
                        <Badge variant="outline" className="text-xs">
                          Required
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSpecification(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                placeholder="Specification name (e.g., Material)"
                value={newSpec.name}
                onChange={(e) => setNewSpec({ ...newSpec, name: e.target.value })}
              />
              <Input
                placeholder="Value (e.g., 100% Cotton)"
                value={newSpec.value}
                onChange={(e) => setNewSpec({ ...newSpec, value: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="required"
                checked={newSpec.required}
                onChange={(e) => setNewSpec({ ...newSpec, required: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="required">This specification is required</Label>
            </div>
            <Button onClick={addSpecification} variant="outline" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Specification
            </Button>
          </div>
        </Card>

        {/* Delivery & Payment */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Delivery & Payment Terms</h2>

          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="destination">Destination Country</Label>
                <Select
                  value={formData.destination}
                  onValueChange={(value) => handleSelectChange('destination', value)}
                >
                  <SelectTrigger id="destination">
                    <SelectValue placeholder="Select destination" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="US">🇺🇸 United States</SelectItem>
                    <SelectItem value="UK">🇬🇧 United Kingdom</SelectItem>
                    <SelectItem value="CA">🇨🇦 Canada</SelectItem>
                    <SelectItem value="AU">🇦🇺 Australia</SelectItem>
                    <SelectItem value="DE">🇩🇪 Germany</SelectItem>
                    <SelectItem value="FR">🇫🇷 France</SelectItem>
                    <SelectItem value="JP">🇯🇵 Japan</SelectItem>
                    <SelectItem value="CN">🇨🇳 China</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="deliveryDeadline">Delivery Deadline</Label>
                <Input
                  id="deliveryDeadline"
                  name="deliveryDeadline"
                  type="date"
                  value={formData.deliveryDeadline}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="paymentTerms">Preferred Payment Terms</Label>
              <Select
                value={formData.paymentTerms}
                onValueChange={(value) => handleSelectChange('paymentTerms', value)}
              >
                <SelectTrigger id="paymentTerms">
                  <SelectValue placeholder="Select payment terms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="cc">Credit Card</SelectItem>
                  <SelectItem value="dc">Debit Card</SelectItem>
                  <SelectItem value="net30">Net 30 Days</SelectItem>
                  <SelectItem value="net60">Net 60 Days</SelectItem>
                  <SelectItem value="flexible">Flexible</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleSaveDraft} className="flex-1">
            Save as Draft
          </Button>
          <Button onClick={handleSubmit} className="flex-1" size="lg">
            <Send className="h-4 w-4 mr-2" />
            Submit RFQ
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          By submitting this RFQ, you agree to share these specifications with verified
          suppliers on our platform
        </p>
      </div>
    </div>
  )
}

'use client'

import * as React from 'react'
import { useState } from 'react'
import {
  FileText,
  ShieldCheck,
  ShoppingCart,
  Target,
  Plus,
  Search,
  Filter,
  Download,
  Send,
  Edit,
  Copy,
  Trash2,
  Eye,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Users,
  Calendar,
  DollarSign,
  FileSignature,
  Bell,
  X,
  ChevronDown,
  ChevronRight,
  Loader2,
  FileInput,
  Pencil,
  ArrowUpDown,
  MoreVertical,
  Mail,
  Phone,
  Building2,
  User,
  Save,
} from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  useContractStore,
  type Contract,
  type ContractTemplate,
  type ContractSignature,
} from '@/store/contract-store'

// Template Icons Map
const templateIcons: Record<string, any> = {
  ShieldCheck,
  FileText,
  ShoppingCart,
  Target,
}

// Status Badges
const statusConfig = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-800 border-gray-200' },
  pending_signatures: { label: 'Pending Signatures', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  partially_signed: { label: 'Partially Signed', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  fully_signed: { label: 'Fully Signed', color: 'bg-green-100 text-green-800 border-green-200' },
  declined: { label: 'Declined', color: 'bg-red-100 text-red-800 border-red-200' },
  expired: { label: 'Expired', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-800 border-gray-200' },
}

export default function ContractsPage() {
  const [activeTab, setActiveTab] = useState('contracts')
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [showContractDialog, setShowContractDialog] = useState(false)
  const [showSignDialog, setShowSignDialog] = useState(false)
  const [showSendDialog, setShowSendDialog] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null)
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null)
  const [contractVariables, setContractVariables] = useState<Record<string, any>>({})
  const [signatureTab, setSignatureTab] = useState<'draw' | 'type' | 'upload'>('type')
  const [typedSignature, setTypedSignature] = useState('')
  const [signers, setSigners] = useState<Array<{ name: string; email: string; role: string }>>([
    { name: '', email: '', role: '' },
  ])

  const {
    templates,
    contracts,
    isLoading,
    isSaving,
    isSending,
    statusFilter,
    searchQuery,
    sortBy,
    sortOrder,
    fetchTemplates,
    fetchContracts,
    createContract,
    updateContract,
    deleteContract,
    duplicateContract,
    sendForSignature,
    signContract,
    downloadContract,
    sendReminder,
    setStatusFilter,
    setSearchQuery,
    setSortBy,
    setSortOrder,
  } = useContractStore()

  React.useEffect(() => {
    fetchTemplates()
    fetchContracts()
  }, [fetchTemplates, fetchContracts])

  // Filter and sort contracts
  const filteredContracts = contracts
    .filter(contract => {
      const matchesStatus = statusFilter === 'all' || contract.status === statusFilter
      const matchesSearch =
        searchQuery === '' ||
        contract.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contract.templateName.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesStatus && matchesSearch
    })
    .sort((a, b) => {
      const order = sortOrder === 'asc' ? 1 : -1
      if (sortBy === 'created_at') return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * order
      if (sortBy === 'updated_at') return (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()) * order
      if (sortBy === 'title') return a.title.localeCompare(b.title) * order
      return 0
    })

  // Handle template selection
  const handleSelectTemplate = (template: ContractTemplate) => {
    setSelectedTemplate(template)
    setContractVariables({})
    setShowTemplateDialog(true)
  }

  // Handle contract creation
  const handleCreateContract = async () => {
    if (!selectedTemplate) return

    const content = selectedTemplate.content.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return contractVariables[key] || match
    })

    await createContract({
      templateId: selectedTemplate.id,
      templateName: selectedTemplate.name,
      title: contractVariables.contractTitle || `${selectedTemplate.name} - ${format(new Date(), 'MMM d, yyyy')}`,
      content,
      variables: contractVariables,
      createdBy: 'current_user',
      metadata: {
        party1: {
          name: contractVariables.party1Name || '',
          email: contractVariables.party1Email || '',
          company: contractVariables.party1Company || '',
          role: contractVariables.party1Title || '',
        },
        party2: {
          name: contractVariables.party2Name || '',
          email: contractVariables.party2Email || '',
          company: contractVariables.party2Company || '',
          role: contractVariables.party2Title || '',
        },
        effectiveDate: contractVariables.effectiveDate,
        tags: [],
      },
    })

    setShowTemplateDialog(false)
    setSelectedTemplate(null)
    setContractVariables({})
  }

  // Handle send for signature
  const handleSendForSignature = async () => {
    if (!selectedContract) return

    const validSigners = signers.filter(s => s.name && s.email)
    if (validSigners.length === 0) return

    await sendForSignature(
      selectedContract.id,
      validSigners.map(s => ({
        signerName: s.name,
        signerEmail: s.email,
        signerRole: s.role,
        signatureType: 'draw',
      }))
    )

    setShowSendDialog(false)
    setSelectedContract(null)
    setSigners([{ name: '', email: '', role: '' }])
  }

  // Handle signature
  const handleSign = async () => {
    if (!selectedContract) return

    const signature = typedSignature
    await signContract(selectedContract.id, 'sig_001', signature, signatureTab)

    setShowSignDialog(false)
    setSelectedContract(null)
    setTypedSignature('')
  }

  // Get stats
  const stats = {
    total: contracts.length,
    pending: contracts.filter(c => c.status === 'pending_signatures' || c.status === 'partially_signed').length,
    signed: contracts.filter(c => c.status === 'fully_signed').length,
    drafts: contracts.filter(c => c.status === 'draft').length,
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-900 to-blue-700 bg-clip-text text-transparent">
                Contract Management
              </h1>
              <p className="text-slate-600 mt-2">
                Create, manage, and track business contracts with e-signatures
              </p>
            </div>
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/30"
            >
              <Plus className="w-5 h-5 mr-2" />
              New Contract
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <Card className="border-slate-200 bg-white/80 backdrop-blur">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Total Contracts</p>
                    <p className="text-3xl font-bold text-slate-900 mt-1">{stats.total}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white/80 backdrop-blur">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Pending Signatures</p>
                    <p className="text-3xl font-bold text-yellow-600 mt-1">{stats.pending}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white/80 backdrop-blur">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Fully Signed</p>
                    <p className="text-3xl font-bold text-green-600 mt-1">{stats.signed}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white/80 backdrop-blur">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Drafts</p>
                    <p className="text-3xl font-bold text-slate-600 mt-1">{stats.drafts}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
                    <Edit className="w-6 h-6 text-slate-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white/80 backdrop-blur border border-slate-200 p-1">
            <TabsTrigger value="contracts" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <FileText className="w-4 h-4 mr-2" />
              My Contracts
            </TabsTrigger>
            <TabsTrigger value="templates" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <FileSignature className="w-4 h-4 mr-2" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="archive" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Signed Archive
            </TabsTrigger>
          </TabsList>

          {/* Contracts Tab */}
          <TabsContent value="contracts" className="space-y-6">
            {/* Filters */}
            <Card className="border-slate-200 bg-white/80 backdrop-blur">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        placeholder="Search contracts..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 border-slate-200"
                      />
                    </div>
                  </div>
                  <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                    <SelectTrigger className="w-full md:w-[200px] border-slate-200">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="pending_signatures">Pending Signatures</SelectItem>
                      <SelectItem value="partially_signed">Partially Signed</SelectItem>
                      <SelectItem value="fully_signed">Fully Signed</SelectItem>
                      <SelectItem value="declined">Declined</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                    <SelectTrigger className="w-full md:w-[200px] border-slate-200">
                      <ArrowUpDown className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="created_at">Created Date</SelectItem>
                      <SelectItem value="updated_at">Updated Date</SelectItem>
                      <SelectItem value="title">Title</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Contracts List */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : filteredContracts.length === 0 ? (
              <Card className="border-slate-200 bg-white/80 backdrop-blur">
                <CardContent className="p-12 text-center">
                  <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-lg font-medium text-slate-600 mb-2">No contracts found</p>
                  <p className="text-sm text-slate-500">Create your first contract from a template</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredContracts.map((contract) => (
                  <ContractCard
                    key={contract.id}
                    contract={contract}
                    onView={() => setSelectedContract(contract)}
                    onSign={() => {
                      setSelectedContract(contract)
                      setShowSignDialog(true)
                    }}
                    onSend={() => {
                      setSelectedContract(contract)
                      setShowSendDialog(true)
                    }}
                    onDownload={() => downloadContract(contract.id, 'pdf')}
                    onDuplicate={() => duplicateContract(contract.id)}
                    onDelete={() => deleteContract(contract.id)}
                    onRemind={(sigId) => sendReminder(contract.id, sigId)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onSelect={() => handleSelectTemplate(template)}
                />
              ))}
            </div>
          </TabsContent>

          {/* Archive Tab */}
          <TabsContent value="archive" className="space-y-6">
            <div className="grid gap-4">
              {contracts
                .filter(c => c.status === 'fully_signed')
                .map((contract) => (
                  <ContractCard
                    key={contract.id}
                    contract={contract}
                    onView={() => setSelectedContract(contract)}
                    onDownload={() => downloadContract(contract.id, 'pdf')}
                    onDuplicate={() => duplicateContract(contract.id)}
                    onDelete={() => deleteContract(contract.id)}
                    onRemind={() => {}}
                  />
                ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Template Dialog */}
        <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Create Contract from Template</DialogTitle>
              <DialogDescription>
                Fill in the contract variables below. Required fields are marked with *
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-6 py-4">
                {selectedTemplate && (
                  <>
                    {/* Contract Title */}
                    <div className="space-y-2">
                      <Label htmlFor="contractTitle">Contract Title *</Label>
                      <Input
                        id="contractTitle"
                        placeholder={`${selectedTemplate.name} - ${format(new Date(), 'MMM d, yyyy')}`}
                        value={contractVariables.contractTitle || ''}
                        onChange={(e) =>
                          setContractVariables({ ...contractVariables, contractTitle: e.target.value })
                        }
                      />
                    </div>

                    <Separator />

                    {/* Template Variables */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedTemplate.variables.map((variable) => (
                        <div key={variable.key} className={variable.type === 'text' && variable.key.includes('Description') ? 'md:col-span-2' : ''}>
                          <Label htmlFor={variable.key}>
                            {variable.label}
                            {variable.required && ' *'}
                          </Label>
                          {variable.description && (
                            <p className="text-xs text-slate-500 mb-1">{variable.description}</p>
                          )}
                          {variable.type === 'select' ? (
                            <Select
                              value={contractVariables[variable.key] || variable.defaultValue || ''}
                              onValueChange={(value) =>
                                setContractVariables({ ...contractVariables, [variable.key]: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={variable.placeholder} />
                              </SelectTrigger>
                              <SelectContent>
                                {variable.options?.map((option) => (
                                  <SelectItem key={option} value={option}>
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : variable.type === 'date' ? (
                            <Input
                              id={variable.key}
                              type="date"
                              value={contractVariables[variable.key] || variable.defaultValue || ''}
                              onChange={(e) =>
                                setContractVariables({ ...contractVariables, [variable.key]: e.target.value })
                              }
                            />
                          ) : variable.key.includes('Responsibilities') || variable.key.includes('Description') || variable.key.includes('Terms') || variable.key.includes('Metrics') ? (
                            <Textarea
                              id={variable.key}
                              placeholder={variable.placeholder}
                              value={contractVariables[variable.key] || variable.defaultValue || ''}
                              onChange={(e) =>
                                setContractVariables({ ...contractVariables, [variable.key]: e.target.value })
                              }
                              rows={3}
                            />
                          ) : (
                            <Input
                              id={variable.key}
                              type={variable.type === 'number' ? 'number' : variable.type === 'email' ? 'email' : 'text'}
                              placeholder={variable.placeholder}
                              value={contractVariables[variable.key] || variable.defaultValue || ''}
                              onChange={(e) =>
                                setContractVariables({ ...contractVariables, [variable.key]: e.target.value })
                              }
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateContract} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Create Contract
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Send for Signature Dialog */}
        <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Send for Signature</DialogTitle>
              <DialogDescription>
                Add signers who need to sign this contract. They will receive an email notification.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {signers.map((signer, index) => (
                <div key={index} className="p-4 border border-slate-200 rounded-lg space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm">Signer {index + 1}</h4>
                    {signers.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSigners(signers.filter((_, i) => i !== index))}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor={`name-${index}`} className="text-xs">
                        Full Name *
                      </Label>
                      <Input
                        id={`name-${index}`}
                        placeholder="John Doe"
                        value={signer.name}
                        onChange={(e) => {
                          const newSigners = [...signers]
                          newSigners[index].name = e.target.value
                          setSigners(newSigners)
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`email-${index}`} className="text-xs">
                        Email *
                      </Label>
                      <Input
                        id={`email-${index}`}
                        type="email"
                        placeholder="john@company.com"
                        value={signer.email}
                        onChange={(e) => {
                          const newSigners = [...signers]
                          newSigners[index].email = e.target.value
                          setSigners(newSigners)
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`role-${index}`} className="text-xs">
                        Role
                      </Label>
                      <Input
                        id={`role-${index}`}
                        placeholder="CEO"
                        value={signer.role}
                        onChange={(e) => {
                          const newSigners = [...signers]
                          newSigners[index].role = e.target.value
                          setSigners(newSigners)
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}

              <Button
                variant="outline"
                className="w-full"
                onClick={() => setSigners([...signers, { name: '', email: '', role: '' }])}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Another Signer
              </Button>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSendDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSendForSignature} disabled={isSending}>
                {isSending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send for Signature
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Sign Contract Dialog */}
        <Dialog open={showSignDialog} onOpenChange={setShowSignDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Sign Contract</DialogTitle>
              <DialogDescription>
                Add your signature to complete this contract
              </DialogDescription>
            </DialogHeader>

            <Tabs value={signatureTab} onValueChange={(v: any) => setSignatureTab(v)} className="py-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="type">Type</TabsTrigger>
                <TabsTrigger value="draw">Draw</TabsTrigger>
                <TabsTrigger value="upload">Upload</TabsTrigger>
              </TabsList>

              <TabsContent value="type" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="signature">Type your full name</Label>
                  <Input
                    id="signature"
                    placeholder="John Doe"
                    value={typedSignature}
                    onChange={(e) => setTypedSignature(e.target.value)}
                    className="text-2xl font-serif"
                  />
                </div>
                {typedSignature && (
                  <div className="p-8 border-2 border-slate-200 rounded-lg bg-slate-50">
                    <p className="text-4xl font-serif text-slate-700 text-center">{typedSignature}</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="draw" className="mt-4">
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-12 text-center bg-slate-50">
                  <Pencil className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600">Draw signature feature</p>
                  <p className="text-sm text-slate-500 mt-2">Canvas drawing will be implemented here</p>
                </div>
              </TabsContent>

              <TabsContent value="upload" className="mt-4">
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-12 text-center bg-slate-50">
                  <FileInput className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600">Upload signature image</p>
                  <p className="text-sm text-slate-500 mt-2">PNG, JPG up to 2MB</p>
                  <Button variant="outline" className="mt-4">
                    Choose File
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSignDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSign} disabled={!typedSignature || isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Sign Contract
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

// Template Card Component
function TemplateCard({
  template,
  onSelect,
}: {
  template: ContractTemplate
  onSelect: () => void
}) {
  const Icon = templateIcons[template.icon] || FileText

  return (
    <Card className="border-slate-200 bg-white/80 backdrop-blur hover:shadow-lg transition-all duration-200 cursor-pointer group"
      onClick={onSelect}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Icon className="w-6 h-6 text-white" />
          </div>
          <Badge variant="outline" className="text-xs">
            {template.category}
          </Badge>
        </div>
        <CardTitle className="text-lg">{template.name}</CardTitle>
        <CardDescription className="line-clamp-2">{template.description}</CardDescription>
      </CardHeader>
      <CardFooter className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Users className="w-3 h-3" />
          <span>Used {template.usageCount} times</span>
        </div>
        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
          Use Template
        </Button>
      </CardFooter>
    </Card>
  )
}

// Contract Card Component
function ContractCard({
  contract,
  onView,
  onSign,
  onSend,
  onDownload,
  onDuplicate,
  onDelete,
  onRemind,
}: {
  contract: Contract
  onView?: () => void
  onSign?: () => void
  onSend?: () => void
  onDownload: () => void
  onDuplicate: () => void
  onDelete: () => void
  onRemind: (sigId: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const status = statusConfig[contract.status]

  const signedCount = contract.signatures.filter(s => s.status === 'signed').length
  const totalSignatures = contract.signatures.length
  const progress = totalSignatures > 0 ? (signedCount / totalSignatures) * 100 : 0

  return (
    <Card className="border-slate-200 bg-white/80 backdrop-blur hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-semibold text-lg text-slate-900">{contract.title}</h3>
                <Badge className={`${status.color} border`}>
                  {status.label}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-600">
                <span className="flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  {contract.templateName}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(contract.createdAt), 'MMM d, yyyy')}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onView && (
                    <DropdownMenuItem onClick={onView}>
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                  )}
                  {contract.status === 'draft' && onSend && (
                    <DropdownMenuItem onClick={onSend}>
                      <Send className="w-4 h-4 mr-2" />
                      Send for Signature
                    </DropdownMenuItem>
                  )}
                  {contract.status !== 'draft' && contract.status !== 'fully_signed' && onSign && (
                    <DropdownMenuItem onClick={onSign}>
                      <FileSignature className="w-4 h-4 mr-2" />
                      Sign Contract
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={onDownload}>
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onDuplicate}>
                    <Copy className="w-4 h-4 mr-2" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onDelete} className="text-red-600">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Progress */}
          {totalSignatures > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Signature Progress</span>
                <span className="font-medium text-slate-900">
                  {signedCount} / {totalSignatures} signed
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Expanded Content */}
          {expanded && (
            <div className="pt-4 border-t border-slate-200 space-y-4">
              {/* Parties */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-slate-700 flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Party 1
                  </h4>
                  <div className="text-sm space-y-1">
                    <p className="font-medium">{contract.metadata.party1.name}</p>
                    <p className="text-slate-600">{contract.metadata.party1.company}</p>
                    <p className="text-slate-500 flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {contract.metadata.party1.email}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-slate-700 flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Party 2
                  </h4>
                  <div className="text-sm space-y-1">
                    <p className="font-medium">{contract.metadata.party2.name}</p>
                    <p className="text-slate-600">{contract.metadata.party2.company}</p>
                    <p className="text-slate-500 flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {contract.metadata.party2.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Signatures */}
              {contract.signatures.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-slate-700 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Signatures
                  </h4>
                  <div className="space-y-2">
                    {contract.signatures.map((sig) => (
                      <div
                        key={sig.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                            sig.status === 'signed'
                              ? 'bg-green-100 text-green-600'
                              : sig.status === 'declined'
                              ? 'bg-red-100 text-red-600'
                              : 'bg-yellow-100 text-yellow-600'
                          }`}>
                            {sig.status === 'signed' ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : sig.status === 'declined' ? (
                              <XCircle className="w-4 h-4" />
                            ) : (
                              <Clock className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{sig.signerName}</p>
                            <p className="text-xs text-slate-500">{sig.signerEmail}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {sig.signedAt ? (
                            <span className="text-xs text-slate-500">
                              {format(new Date(sig.signedAt), 'MMM d, yyyy')}
                            </span>
                          ) : sig.status === 'pending' ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onRemind(sig.id)}
                            >
                              <Bell className="w-3 h-3 mr-1" />
                              Remind
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Audit Trail */}
              {contract.audit.events.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-slate-700 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Activity Timeline
                  </h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {contract.audit.events.slice(-5).reverse().map((event) => (
                      <div key={event.id} className="flex gap-3 text-xs">
                        <div className="text-slate-500 min-w-[100px]">
                          {format(new Date(event.timestamp), 'MMM d, HH:mm')}
                        </div>
                        <div className="flex-1">
                          <span className="font-medium text-slate-700">{event.action}</span>
                          <span className="text-slate-500"> by {event.user}</span>
                          {event.details && <p className="text-slate-500 mt-1">{event.details}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

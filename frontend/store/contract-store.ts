import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Contract Template Types
export type ContractTemplateType =
  | 'nda'
  | 'moa'
  | 'purchase_agreement'
  | 'sla'
  | 'distribution_agreement'
  | 'supply_agreement'
  | 'partnership_agreement'
  | 'licensing_agreement'
  | 'consulting_agreement'
  | 'master_service_agreement'

export interface ContractTemplate {
  id: string
  type: ContractTemplateType
  name: string
  description: string
  category: string
  icon: string
  content: string
  variables: ContractVariable[]
  createdAt: string
  updatedAt: string
  usageCount: number
  isCustom: boolean
}

export interface ContractVariable {
  key: string
  label: string
  type: 'text' | 'number' | 'date' | 'currency' | 'email' | 'phone' | 'address' | 'select'
  required: boolean
  placeholder?: string
  defaultValue?: string
  options?: string[]
  description?: string
  validation?: {
    min?: number
    max?: number
    pattern?: string
    message?: string
  }
}

export interface ContractSignature {
  id: string
  signerName: string
  signerEmail: string
  signerRole: string
  signedAt: string | null
  ipAddress?: string
  signatureData?: string
  signatureType: 'draw' | 'type' | 'upload'
  status: 'pending' | 'signed' | 'declined' | 'expired'
  reminder?: {
    lastSent?: string
    count: number
  }
}

export interface Contract {
  id: string
  templateId: string
  templateName: string
  title: string
  content: string
  variables: Record<string, any>
  status: 'draft' | 'pending_signatures' | 'partially_signed' | 'fully_signed' | 'declined' | 'expired' | 'cancelled'
  createdBy: string
  createdAt: string
  updatedAt: string
  expiresAt?: string
  signatures: ContractSignature[]
  metadata: {
    party1: {
      name: string
      email: string
      company?: string
      role?: string
    }
    party2: {
      name: string
      email: string
      company?: string
      role?: string
    }
    effectiveDate?: string
    value?: number
    currency?: string
    tags?: string[]
    notes?: string
  }
  audit: {
    createdAt: string
    sentAt?: string
    firstViewedAt?: string
    firstSignedAt?: string
    fullySignedAt?: string
    declinedAt?: string
    cancelledAt?: string
    events: AuditEvent[]
  }
}

export interface AuditEvent {
  id: string
  timestamp: string
  action: string
  user: string
  details: string
  ipAddress?: string
}

interface ContractState {
  // Data
  templates: ContractTemplate[]
  contracts: Contract[]
  currentContract: Contract | null
  currentTemplate: ContractTemplate | null

  // UI State
  isLoading: boolean
  isSaving: boolean
  isSending: boolean
  error: string | null

  // Filter & Search
  statusFilter: Contract['status'] | 'all'
  searchQuery: string
  sortBy: 'created_at' | 'updated_at' | 'title' | 'status'
  sortOrder: 'asc' | 'desc'

  // Actions - Templates
  fetchTemplates: () => Promise<void>
  getTemplate: (id: string) => ContractTemplate | undefined
  createCustomTemplate: (template: Omit<ContractTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'isCustom'>) => Promise<void>
  updateTemplate: (id: string, updates: Partial<ContractTemplate>) => Promise<void>
  deleteTemplate: (id: string) => Promise<void>
  duplicateTemplate: (id: string) => Promise<void>

  // Actions - Contracts
  fetchContracts: () => Promise<void>
  getContract: (id: string) => Contract | undefined
  createContract: (contract: Omit<Contract, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'signatures' | 'audit'>) => Promise<void>
  updateContract: (id: string, updates: Partial<Contract>) => Promise<void>
  deleteContract: (id: string) => Promise<void>
  duplicateContract: (id: string) => Promise<void>

  // Actions - Contract Workflow
  saveAsDraft: (contract: Partial<Contract>) => Promise<void>
  sendForSignature: (contractId: string, signers: Omit<ContractSignature, 'id' | 'signedAt' | 'status'>[]) => Promise<void>
  signContract: (contractId: string, signatureId: string, signatureData: string, signatureType: ContractSignature['signatureType']) => Promise<void>
  declineContract: (contractId: string, signatureId: string, reason: string) => Promise<void>
  cancelContract: (contractId: string, reason: string) => Promise<void>
  sendReminder: (contractId: string, signatureId: string) => Promise<void>
  downloadContract: (contractId: string, format: 'pdf' | 'docx') => Promise<void>

  // Actions - UI
  setCurrentContract: (contract: Contract | null) => void
  setCurrentTemplate: (template: ContractTemplate | null) => void
  setStatusFilter: (status: Contract['status'] | 'all') => void
  setSearchQuery: (query: string) => void
  setSortBy: (sortBy: ContractState['sortBy']) => void
  setSortOrder: (order: 'asc' | 'desc') => void
  clearError: () => void
}

// Mock Templates Data
const mockTemplates: ContractTemplate[] = [
  {
    id: 'tpl_nda_001',
    type: 'nda',
    name: 'Non-Disclosure Agreement',
    description: 'Protect confidential information shared between parties',
    category: 'Legal',
    icon: 'FileShield',
    usageCount: 145,
    isCustom: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    content: `NON-DISCLOSURE AGREEMENT

This Non-Disclosure Agreement ("Agreement") is entered into as of {{effectiveDate}} ("Effective Date"), by and between:

DISCLOSING PARTY: {{party1Name}}, {{party1Company}}, located at {{party1Address}}
RECEIVING PARTY: {{party2Name}}, {{party2Company}}, located at {{party2Address}}

1. PURPOSE
The parties wish to explore a business opportunity of mutual interest (the "Purpose") and may disclose certain confidential information to one another.

2. CONFIDENTIAL INFORMATION
"Confidential Information" means any information disclosed by either party, whether orally or in writing, that is designated as confidential or that reasonably should be understood to be confidential.

3. OBLIGATIONS
The Receiving Party agrees to:
   a) Hold all Confidential Information in strict confidence
   b) Not disclose Confidential Information to third parties without prior written consent
   c) Use Confidential Information solely for the Purpose
   d) Protect Confidential Information with the same degree of care used for own confidential information

4. TERM
This Agreement shall remain in effect for {{termDuration}} from the Effective Date, unless terminated earlier by written notice.

5. RETURN OF MATERIALS
Upon request or termination, all Confidential Information and materials shall be returned or destroyed.

6. GOVERNING LAW
This Agreement shall be governed by the laws of {{jurisdiction}}.

IN WITNESS WHEREOF, the parties have executed this Agreement as of the Effective Date.

DISCLOSING PARTY: _____________________
Name: {{party1Name}}
Title: {{party1Title}}
Date: _____________________

RECEIVING PARTY: _____________________
Name: {{party2Name}}
Title: {{party2Title}}
Date: _____________________`,
    variables: [
      { key: 'effectiveDate', label: 'Effective Date', type: 'date', required: true, placeholder: 'Select date' },
      { key: 'party1Name', label: 'Disclosing Party Name', type: 'text', required: true, placeholder: 'John Doe' },
      { key: 'party1Company', label: 'Disclosing Party Company', type: 'text', required: true, placeholder: 'Acme Corp' },
      { key: 'party1Address', label: 'Disclosing Party Address', type: 'address', required: true, placeholder: '123 Main St, City, State ZIP' },
      { key: 'party1Title', label: 'Disclosing Party Title', type: 'text', required: true, placeholder: 'CEO' },
      { key: 'party2Name', label: 'Receiving Party Name', type: 'text', required: true, placeholder: 'Jane Smith' },
      { key: 'party2Company', label: 'Receiving Party Company', type: 'text', required: true, placeholder: 'Beta Inc' },
      { key: 'party2Address', label: 'Receiving Party Address', type: 'address', required: true, placeholder: '456 Oak Ave, City, State ZIP' },
      { key: 'party2Title', label: 'Receiving Party Title', type: 'text', required: true, placeholder: 'CTO' },
      { key: 'termDuration', label: 'Term Duration', type: 'text', required: true, placeholder: '2 years', defaultValue: '2 years' },
      { key: 'jurisdiction', label: 'Jurisdiction', type: 'text', required: true, placeholder: 'State of California' },
    ],
  },
  {
    id: 'tpl_moa_001',
    type: 'moa',
    name: 'Memorandum of Agreement',
    description: 'Document mutual understanding between parties',
    category: 'Business',
    icon: 'FileText',
    usageCount: 98,
    isCustom: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    content: `MEMORANDUM OF AGREEMENT

This Memorandum of Agreement ("MOA") is entered into on {{effectiveDate}} by and between:

PARTY A: {{party1Name}}, {{party1Company}}
PARTY B: {{party2Name}}, {{party2Company}}

1. PURPOSE
This MOA establishes the terms and understanding between the parties regarding {{purpose}}.

2. SCOPE OF COLLABORATION
The parties agree to collaborate on the following:
{{scopeOfWork}}

3. RESPONSIBILITIES
Party A Responsibilities:
{{party1Responsibilities}}

Party B Responsibilities:
{{party2Responsibilities}}

4. TERM
This MOA shall commence on {{startDate}} and continue until {{endDate}}, unless terminated earlier.

5. FINANCIAL TERMS
{{financialTerms}}

6. CONFIDENTIALITY
Both parties agree to maintain confidentiality of proprietary information.

7. TERMINATION
Either party may terminate this MOA with {{noticePeriod}} written notice.

AGREED AND ACCEPTED:

PARTY A: _____________________
Name: {{party1Name}}
Title: {{party1Title}}
Date: _____________________

PARTY B: _____________________
Name: {{party2Name}}
Title: {{party2Title}}
Date: _____________________`,
    variables: [
      { key: 'effectiveDate', label: 'Effective Date', type: 'date', required: true },
      { key: 'party1Name', label: 'Party A Name', type: 'text', required: true },
      { key: 'party1Company', label: 'Party A Company', type: 'text', required: true },
      { key: 'party1Title', label: 'Party A Title', type: 'text', required: true },
      { key: 'party2Name', label: 'Party B Name', type: 'text', required: true },
      { key: 'party2Company', label: 'Party B Company', type: 'text', required: true },
      { key: 'party2Title', label: 'Party B Title', type: 'text', required: true },
      { key: 'purpose', label: 'Purpose', type: 'text', required: true, placeholder: 'Business partnership and collaboration' },
      { key: 'scopeOfWork', label: 'Scope of Work', type: 'text', required: true, placeholder: 'Detailed description of collaboration scope' },
      { key: 'party1Responsibilities', label: 'Party A Responsibilities', type: 'text', required: true },
      { key: 'party2Responsibilities', label: 'Party B Responsibilities', type: 'text', required: true },
      { key: 'startDate', label: 'Start Date', type: 'date', required: true },
      { key: 'endDate', label: 'End Date', type: 'date', required: true },
      { key: 'financialTerms', label: 'Financial Terms', type: 'text', required: true },
      { key: 'noticePeriod', label: 'Notice Period', type: 'text', required: true, defaultValue: '30 days' },
    ],
  },
  {
    id: 'tpl_purchase_001',
    type: 'purchase_agreement',
    name: 'Purchase Agreement',
    description: 'Standard agreement for product/service purchases',
    category: 'Procurement',
    icon: 'ShoppingCart',
    usageCount: 234,
    isCustom: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    content: `PURCHASE AGREEMENT

This Purchase Agreement ("Agreement") is made on {{agreementDate}} between:

SELLER: {{sellerName}}, {{sellerCompany}}
BUYER: {{buyerName}}, {{buyerCompany}}

1. PRODUCTS/SERVICES
The Seller agrees to provide the following:
{{productDescription}}

Quantity: {{quantity}}
Unit Price: {{unitPrice}} {{currency}}
Total Amount: {{totalAmount}} {{currency}}

2. DELIVERY
Delivery Date: {{deliveryDate}}
Delivery Location: {{deliveryLocation}}
Shipping Terms: {{shippingTerms}}

3. PAYMENT TERMS
Payment Method: {{paymentMethod}}
Payment Schedule: {{paymentSchedule}}
Due Date: {{paymentDueDate}}

4. WARRANTY
{{warrantyTerms}}

5. INSPECTION AND ACCEPTANCE
The Buyer shall have {{inspectionPeriod}} to inspect and accept the products/services.

6. GOVERNING LAW
This Agreement is governed by {{jurisdiction}}.

SELLER: _____________________
Name: {{sellerName}}
Title: {{sellerTitle}}
Date: _____________________

BUYER: _____________________
Name: {{buyerName}}
Title: {{buyerTitle}}
Date: _____________________`,
    variables: [
      { key: 'agreementDate', label: 'Agreement Date', type: 'date', required: true },
      { key: 'sellerName', label: 'Seller Name', type: 'text', required: true },
      { key: 'sellerCompany', label: 'Seller Company', type: 'text', required: true },
      { key: 'sellerTitle', label: 'Seller Title', type: 'text', required: true },
      { key: 'buyerName', label: 'Buyer Name', type: 'text', required: true },
      { key: 'buyerCompany', label: 'Buyer Company', type: 'text', required: true },
      { key: 'buyerTitle', label: 'Buyer Title', type: 'text', required: true },
      { key: 'productDescription', label: 'Product/Service Description', type: 'text', required: true },
      { key: 'quantity', label: 'Quantity', type: 'number', required: true },
      { key: 'unitPrice', label: 'Unit Price', type: 'currency', required: true },
      { key: 'currency', label: 'Currency', type: 'select', required: true, options: ['USD', 'EUR', 'GBP', 'NGN'], defaultValue: 'USD' },
      { key: 'totalAmount', label: 'Total Amount', type: 'currency', required: true },
      { key: 'deliveryDate', label: 'Delivery Date', type: 'date', required: true },
      { key: 'deliveryLocation', label: 'Delivery Location', type: 'address', required: true },
      { key: 'shippingTerms', label: 'Shipping Terms', type: 'text', required: true, placeholder: 'FOB, CIF, etc.' },
      { key: 'paymentMethod', label: 'Payment Method', type: 'select', required: true, options: ['PayPal', 'Credit Card', 'Debit Card', 'Bank Transfer'] },
      { key: 'paymentSchedule', label: 'Payment Schedule', type: 'text', required: true },
      { key: 'paymentDueDate', label: 'Payment Due Date', type: 'date', required: true },
      { key: 'warrantyTerms', label: 'Warranty Terms', type: 'text', required: true },
      { key: 'inspectionPeriod', label: 'Inspection Period', type: 'text', required: true, defaultValue: '7 days' },
      { key: 'jurisdiction', label: 'Jurisdiction', type: 'text', required: true },
    ],
  },
  {
    id: 'tpl_sla_001',
    type: 'sla',
    name: 'Service Level Agreement',
    description: 'Define service standards and expectations',
    category: 'Operations',
    icon: 'Target',
    usageCount: 156,
    isCustom: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    content: `SERVICE LEVEL AGREEMENT

This Service Level Agreement ("SLA") is entered into on {{effectiveDate}} between:

SERVICE PROVIDER: {{providerName}}, {{providerCompany}}
CLIENT: {{clientName}}, {{clientCompany}}

1. SERVICES
The Provider agrees to deliver the following services:
{{serviceDescription}}

2. SERVICE LEVEL OBJECTIVES
Availability: {{availabilityTarget}}
Response Time: {{responseTime}}
Resolution Time: {{resolutionTime}}
Uptime Guarantee: {{uptimeGuarantee}}

3. PERFORMANCE METRICS
{{performanceMetrics}}

4. SUPPORT
Support Hours: {{supportHours}}
Support Channels: {{supportChannels}}
Escalation Process: {{escalationProcess}}

5. PENALTIES
If service levels are not met:
{{penaltyTerms}}

6. REPORTING
Performance reports will be provided {{reportingFrequency}}.

7. TERM
This SLA is effective from {{startDate}} to {{endDate}}.

PROVIDER: _____________________
Name: {{providerName}}
Title: {{providerTitle}}
Date: _____________________

CLIENT: _____________________
Name: {{clientName}}
Title: {{clientTitle}}
Date: _____________________`,
    variables: [
      { key: 'effectiveDate', label: 'Effective Date', type: 'date', required: true },
      { key: 'providerName', label: 'Provider Name', type: 'text', required: true },
      { key: 'providerCompany', label: 'Provider Company', type: 'text', required: true },
      { key: 'providerTitle', label: 'Provider Title', type: 'text', required: true },
      { key: 'clientName', label: 'Client Name', type: 'text', required: true },
      { key: 'clientCompany', label: 'Client Company', type: 'text', required: true },
      { key: 'clientTitle', label: 'Client Title', type: 'text', required: true },
      { key: 'serviceDescription', label: 'Service Description', type: 'text', required: true },
      { key: 'availabilityTarget', label: 'Availability Target', type: 'text', required: true, placeholder: '99.9%', defaultValue: '99.9%' },
      { key: 'responseTime', label: 'Response Time', type: 'text', required: true, placeholder: '1 hour for critical issues' },
      { key: 'resolutionTime', label: 'Resolution Time', type: 'text', required: true, placeholder: '24 hours for critical issues' },
      { key: 'uptimeGuarantee', label: 'Uptime Guarantee', type: 'text', required: true, defaultValue: '99.9%' },
      { key: 'performanceMetrics', label: 'Performance Metrics', type: 'text', required: true },
      { key: 'supportHours', label: 'Support Hours', type: 'text', required: true, placeholder: '24/7' },
      { key: 'supportChannels', label: 'Support Channels', type: 'text', required: true, placeholder: 'Email, Phone, Chat' },
      { key: 'escalationProcess', label: 'Escalation Process', type: 'text', required: true },
      { key: 'penaltyTerms', label: 'Penalty Terms', type: 'text', required: true },
      { key: 'reportingFrequency', label: 'Reporting Frequency', type: 'text', required: true, defaultValue: 'monthly' },
      { key: 'startDate', label: 'Start Date', type: 'date', required: true },
      { key: 'endDate', label: 'End Date', type: 'date', required: true },
    ],
  },
]

// Mock Contracts Data
const mockContracts: Contract[] = [
  {
    id: 'ctr_001',
    templateId: 'tpl_nda_001',
    templateName: 'Non-Disclosure Agreement',
    title: 'NDA with TechCorp Solutions',
    content: 'Generated contract content...',
    variables: {
      effectiveDate: '2024-02-01',
      party1Name: 'John Smith',
      party1Company: 'MarketHub Inc.',
    },
    status: 'fully_signed',
    createdBy: 'user_123',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T14:30:00Z',
    expiresAt: '2026-02-01T00:00:00Z',
    signatures: [
      {
        id: 'sig_001',
        signerName: 'John Smith',
        signerEmail: 'john@markethub.com',
        signerRole: 'CEO',
        signedAt: '2024-01-16T09:00:00Z',
        status: 'signed',
        signatureType: 'draw',
        ipAddress: '192.168.1.1',
      },
      {
        id: 'sig_002',
        signerName: 'Sarah Johnson',
        signerEmail: 'sarah@techcorp.com',
        signerRole: 'CTO',
        signedAt: '2024-01-20T14:30:00Z',
        status: 'signed',
        signatureType: 'type',
        ipAddress: '192.168.1.2',
      },
    ],
    metadata: {
      party1: {
        name: 'John Smith',
        email: 'john@markethub.com',
        company: 'MarketHub Inc.',
        role: 'CEO',
      },
      party2: {
        name: 'Sarah Johnson',
        email: 'sarah@techcorp.com',
        company: 'TechCorp Solutions',
        role: 'CTO',
      },
      effectiveDate: '2024-02-01',
      tags: ['confidential', 'partnership'],
      notes: 'Standard NDA for technology partnership exploration',
    },
    audit: {
      createdAt: '2024-01-15T10:00:00Z',
      sentAt: '2024-01-15T10:15:00Z',
      firstViewedAt: '2024-01-15T15:30:00Z',
      firstSignedAt: '2024-01-16T09:00:00Z',
      fullySignedAt: '2024-01-20T14:30:00Z',
      events: [
        {
          id: 'evt_001',
          timestamp: '2024-01-15T10:00:00Z',
          action: 'Contract Created',
          user: 'John Smith',
          details: 'Contract created from NDA template',
        },
        {
          id: 'evt_002',
          timestamp: '2024-01-15T10:15:00Z',
          action: 'Sent for Signature',
          user: 'John Smith',
          details: 'Contract sent to all parties',
        },
        {
          id: 'evt_003',
          timestamp: '2024-01-16T09:00:00Z',
          action: 'Signed',
          user: 'John Smith',
          details: 'Party 1 signed the contract',
        },
        {
          id: 'evt_004',
          timestamp: '2024-01-20T14:30:00Z',
          action: 'Fully Signed',
          user: 'Sarah Johnson',
          details: 'All parties have signed',
        },
      ],
    },
  },
]

export const useContractStore = create<ContractState>()(
  persist(
    (set, get) => ({
      // Initial State
      templates: mockTemplates,
      contracts: mockContracts,
      currentContract: null,
      currentTemplate: null,
      isLoading: false,
      isSaving: false,
      isSending: false,
      error: null,
      statusFilter: 'all',
      searchQuery: '',
      sortBy: 'created_at',
      sortOrder: 'desc',

      // Template Actions
      fetchTemplates: async () => {
        set({ isLoading: true, error: null })
        try {
          // In production, fetch from API
          await new Promise(resolve => setTimeout(resolve, 500))
          set({ templates: mockTemplates, isLoading: false })
        } catch (error) {
          set({ error: 'Failed to fetch templates', isLoading: false })
        }
      },

      getTemplate: (id) => {
        return get().templates.find(t => t.id === id)
      },

      createCustomTemplate: async (template) => {
        set({ isSaving: true, error: null })
        try {
          const newTemplate: ContractTemplate = {
            ...template,
            id: `tpl_custom_${Date.now()}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            usageCount: 0,
            isCustom: true,
          }
          set(state => ({
            templates: [...state.templates, newTemplate],
            isSaving: false,
          }))
        } catch (error) {
          set({ error: 'Failed to create template', isSaving: false })
        }
      },

      updateTemplate: async (id, updates) => {
        set({ isSaving: true, error: null })
        try {
          set(state => ({
            templates: state.templates.map(t =>
              t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
            ),
            isSaving: false,
          }))
        } catch (error) {
          set({ error: 'Failed to update template', isSaving: false })
        }
      },

      deleteTemplate: async (id) => {
        set({ isLoading: true, error: null })
        try {
          set(state => ({
            templates: state.templates.filter(t => t.id !== id),
            isLoading: false,
          }))
        } catch (error) {
          set({ error: 'Failed to delete template', isLoading: false })
        }
      },

      duplicateTemplate: async (id) => {
        set({ isSaving: true, error: null })
        try {
          const template = get().templates.find(t => t.id === id)
          if (template) {
            const newTemplate: ContractTemplate = {
              ...template,
              id: `tpl_${Date.now()}`,
              name: `${template.name} (Copy)`,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              usageCount: 0,
              isCustom: true,
            }
            set(state => ({
              templates: [...state.templates, newTemplate],
              isSaving: false,
            }))
          }
        } catch (error) {
          set({ error: 'Failed to duplicate template', isSaving: false })
        }
      },

      // Contract Actions
      fetchContracts: async () => {
        set({ isLoading: true, error: null })
        try {
          await new Promise(resolve => setTimeout(resolve, 500))
          set({ contracts: mockContracts, isLoading: false })
        } catch (error) {
          set({ error: 'Failed to fetch contracts', isLoading: false })
        }
      },

      getContract: (id) => {
        return get().contracts.find(c => c.id === id)
      },

      createContract: async (contract) => {
        set({ isSaving: true, error: null })
        try {
          const newContract: Contract = {
            ...contract,
            id: `ctr_${Date.now()}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'draft',
            signatures: [],
            audit: {
              createdAt: new Date().toISOString(),
              events: [{
                id: `evt_${Date.now()}`,
                timestamp: new Date().toISOString(),
                action: 'Contract Created',
                user: contract.createdBy,
                details: `Contract created from ${contract.templateName}`,
              }],
            },
          }
          set(state => ({
            contracts: [newContract, ...state.contracts],
            currentContract: newContract,
            isSaving: false,
          }))
        } catch (error) {
          set({ error: 'Failed to create contract', isSaving: false })
        }
      },

      updateContract: async (id, updates) => {
        set({ isSaving: true, error: null })
        try {
          set(state => ({
            contracts: state.contracts.map(c =>
              c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
            ),
            isSaving: false,
          }))
        } catch (error) {
          set({ error: 'Failed to update contract', isSaving: false })
        }
      },

      deleteContract: async (id) => {
        set({ isLoading: true, error: null })
        try {
          set(state => ({
            contracts: state.contracts.filter(c => c.id !== id),
            isLoading: false,
          }))
        } catch (error) {
          set({ error: 'Failed to delete contract', isLoading: false })
        }
      },

      duplicateContract: async (id) => {
        set({ isSaving: true, error: null })
        try {
          const contract = get().contracts.find(c => c.id === id)
          if (contract) {
            const newContract: Contract = {
              ...contract,
              id: `ctr_${Date.now()}`,
              title: `${contract.title} (Copy)`,
              status: 'draft',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              signatures: [],
              audit: {
                createdAt: new Date().toISOString(),
                events: [{
                  id: `evt_${Date.now()}`,
                  timestamp: new Date().toISOString(),
                  action: 'Contract Duplicated',
                  user: contract.createdBy,
                  details: `Duplicated from ${contract.id}`,
                }],
              },
            }
            set(state => ({
              contracts: [newContract, ...state.contracts],
              isSaving: false,
            }))
          }
        } catch (error) {
          set({ error: 'Failed to duplicate contract', isSaving: false })
        }
      },

      // Workflow Actions
      saveAsDraft: async (contract) => {
        get().updateContract(contract.id!, { ...contract, status: 'draft' })
      },

      sendForSignature: async (contractId, signers) => {
        set({ isSending: true, error: null })
        try {
          const signatures: ContractSignature[] = signers.map((signer, index) => ({
            ...signer,
            id: `sig_${Date.now()}_${index}`,
            signedAt: null,
            status: 'pending',
            reminder: { count: 0 },
          }))

          await get().updateContract(contractId, {
            status: 'pending_signatures',
            signatures,
          })

          const contract = get().contracts.find(c => c.id === contractId)
          if (contract) {
            const newEvent: AuditEvent = {
              id: `evt_${Date.now()}`,
              timestamp: new Date().toISOString(),
              action: 'Sent for Signature',
              user: contract.createdBy,
              details: `Sent to ${signers.length} signers`,
            }
            await get().updateContract(contractId, {
              audit: {
                ...contract.audit,
                sentAt: new Date().toISOString(),
                events: [...contract.audit.events, newEvent],
              },
            })
          }

          set({ isSending: false })
        } catch (error) {
          set({ error: 'Failed to send contract', isSending: false })
        }
      },

      signContract: async (contractId, signatureId, signatureData, signatureType) => {
        set({ isSaving: true, error: null })
        try {
          const contract = get().contracts.find(c => c.id === contractId)
          if (!contract) throw new Error('Contract not found')

          const updatedSignatures = contract.signatures.map(sig =>
            sig.id === signatureId
              ? {
                  ...sig,
                  signedAt: new Date().toISOString(),
                  status: 'signed' as const,
                  signatureData,
                  signatureType,
                  ipAddress: '192.168.1.1', // In production, get actual IP
                }
              : sig
          )

          const allSigned = updatedSignatures.every(sig => sig.status === 'signed')
          const partialSigned = updatedSignatures.some(sig => sig.status === 'signed')

          const newEvent: AuditEvent = {
            id: `evt_${Date.now()}`,
            timestamp: new Date().toISOString(),
            action: allSigned ? 'Fully Signed' : 'Signed',
            user: updatedSignatures.find(s => s.id === signatureId)?.signerName || 'Unknown',
            details: allSigned ? 'All parties have signed' : 'Party signed the contract',
          }

          await get().updateContract(contractId, {
            signatures: updatedSignatures,
            status: allSigned ? 'fully_signed' : partialSigned ? 'partially_signed' : 'pending_signatures',
            audit: {
              ...contract.audit,
              firstSignedAt: contract.audit.firstSignedAt || new Date().toISOString(),
              fullySignedAt: allSigned ? new Date().toISOString() : undefined,
              events: [...contract.audit.events, newEvent],
            },
          })

          set({ isSaving: false })
        } catch (error) {
          set({ error: 'Failed to sign contract', isSaving: false })
        }
      },

      declineContract: async (contractId, signatureId, reason) => {
        set({ isSaving: true, error: null })
        try {
          const contract = get().contracts.find(c => c.id === contractId)
          if (!contract) throw new Error('Contract not found')

          const updatedSignatures = contract.signatures.map(sig =>
            sig.id === signatureId ? { ...sig, status: 'declined' as const } : sig
          )

          const newEvent: AuditEvent = {
            id: `evt_${Date.now()}`,
            timestamp: new Date().toISOString(),
            action: 'Declined',
            user: updatedSignatures.find(s => s.id === signatureId)?.signerName || 'Unknown',
            details: `Contract declined: ${reason}`,
          }

          await get().updateContract(contractId, {
            signatures: updatedSignatures,
            status: 'declined',
            audit: {
              ...contract.audit,
              declinedAt: new Date().toISOString(),
              events: [...contract.audit.events, newEvent],
            },
          })

          set({ isSaving: false })
        } catch (error) {
          set({ error: 'Failed to decline contract', isSaving: false })
        }
      },

      cancelContract: async (contractId, reason) => {
        set({ isSaving: true, error: null })
        try {
          const contract = get().contracts.find(c => c.id === contractId)
          if (!contract) throw new Error('Contract not found')

          const newEvent: AuditEvent = {
            id: `evt_${Date.now()}`,
            timestamp: new Date().toISOString(),
            action: 'Cancelled',
            user: contract.createdBy,
            details: `Contract cancelled: ${reason}`,
          }

          await get().updateContract(contractId, {
            status: 'cancelled',
            audit: {
              ...contract.audit,
              cancelledAt: new Date().toISOString(),
              events: [...contract.audit.events, newEvent],
            },
          })

          set({ isSaving: false })
        } catch (error) {
          set({ error: 'Failed to cancel contract', isSaving: false })
        }
      },

      sendReminder: async (contractId, signatureId) => {
        set({ isSending: true, error: null })
        try {
          const contract = get().contracts.find(c => c.id === contractId)
          if (!contract) throw new Error('Contract not found')

          const updatedSignatures = contract.signatures.map(sig =>
            sig.id === signatureId
              ? {
                  ...sig,
                  reminder: {
                    lastSent: new Date().toISOString(),
                    count: (sig.reminder?.count || 0) + 1,
                  },
                }
              : sig
          )

          const newEvent: AuditEvent = {
            id: `evt_${Date.now()}`,
            timestamp: new Date().toISOString(),
            action: 'Reminder Sent',
            user: contract.createdBy,
            details: `Reminder sent to ${updatedSignatures.find(s => s.id === signatureId)?.signerName}`,
          }

          await get().updateContract(contractId, {
            signatures: updatedSignatures,
            audit: {
              ...contract.audit,
              events: [...contract.audit.events, newEvent],
            },
          })

          set({ isSending: false })
        } catch (error) {
          set({ error: 'Failed to send reminder', isSending: false })
        }
      },

      downloadContract: async (contractId, format) => {
        set({ isLoading: true, error: null })
        try {
          // In production, generate and download PDF/DOCX
          await new Promise(resolve => setTimeout(resolve, 1000))
          console.log(`Downloading contract ${contractId} as ${format}`)
          set({ isLoading: false })
        } catch (error) {
          set({ error: 'Failed to download contract', isLoading: false })
        }
      },

      // UI Actions
      setCurrentContract: (contract) => set({ currentContract: contract }),
      setCurrentTemplate: (template) => set({ currentTemplate: template }),
      setStatusFilter: (status) => set({ statusFilter: status }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setSortBy: (sortBy) => set({ sortBy }),
      setSortOrder: (order) => set({ sortOrder: order }),
      clearError: () => set({ error: null }),
    }),
    {
      name: 'contract-storage',
      partialize: (state) => ({
        contracts: state.contracts,
        templates: state.templates,
      }),
    }
  )
)

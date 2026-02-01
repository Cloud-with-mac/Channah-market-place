import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// HS Code Data
export interface HSCodeItem {
  code: string
  description: string
  category: string
  dutyRate: number
  restrictions?: string[]
  commonUses: string[]
}

// Country Requirements
export interface CountryRequirement {
  code: string
  name: string
  region: string
  hsCodePrefix: string
  importDuty: number
  vat: number
  requiredDocuments: string[]
  restrictions: string[]
  notes: string
  certifications: string[]
  leadTime: number // days
}

// Document Type
export interface DocumentType {
  id: string
  name: string
  description: string
  required: boolean
  countries: string[]
  fileTypes: string[]
  sampleUrl?: string
}

// Customs Broker
export interface CustomsBroker {
  id: string
  name: string
  country: string
  phone: string
  email: string
  specializations: string[]
  rating: number
  reviewCount: number
  website?: string
  yearsInBusiness: number
  certifications: string[]
  languages: string[]
}

// Document Checklist
export interface ChecklistItem {
  id: string
  documentId: string
  name: string
  status: 'pending' | 'submitted' | 'approved' | 'rejected'
  uploadedAt?: string
  expiryDate?: string
  notes?: string
}

// Customs Clearance Record
export interface CustomsClearanceRecord {
  id: string
  shipmentId: string
  originCountry: string
  destinationCountry: string
  hsCode: string
  itemDescription: string
  quantity: number
  declaredValue: number
  currency: string
  documents: ChecklistItem[]
  broker?: CustomsBroker
  estimatedClearanceTime: number
  status: 'pending' | 'submitted' | 'under-review' | 'cleared' | 'rejected'
  notes?: string
  createdAt: string
  updatedAt: string
}

interface CustomsStore {
  // Data
  hsCodesDatabase: HSCodeItem[]
  countriesDatabase: CountryRequirement[]
  documentsDatabase: DocumentType[]
  brokersDatabase: CustomsBroker[]
  clearanceRecords: CustomsClearanceRecord[]

  // HS Code Operations
  searchHSCodes: (query: string) => HSCodeItem[]
  getHSCodeDetails: (code: string) => HSCodeItem | undefined
  suggestHSCode: (itemDescription: string) => HSCodeItem[]

  // Country Requirements
  getCountryRequirements: (countryCode: string) => CountryRequirement | undefined
  getRequiredDocuments: (countryCode: string) => DocumentType[]
  getTradeRouteInfo: (origin: string, destination: string) => any

  // Document Checklist
  getChecklistForCountry: (countryCode: string, hsCode: string) => ChecklistItem[]
  updateDocumentStatus: (recordId: string, docId: string, status: ChecklistItem['status']) => void
  uploadDocument: (recordId: string, docId: string, uploadedAt: string) => void

  // Customs Broker Finder
  findBrokers: (country: string, specialty?: string) => CustomsBroker[]
  getBrokerDetails: (brokerId: string) => CustomsBroker | undefined
  filterBrokersByRating: (country: string, minRating: number) => CustomsBroker[]

  // Clearance Records
  createClearanceRecord: (record: Omit<CustomsClearanceRecord, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateClearanceRecord: (id: string, updates: Partial<CustomsClearanceRecord>) => void
  getClearanceRecord: (id: string) => CustomsClearanceRecord | undefined
  getClearancesByStatus: (status: CustomsClearanceRecord['status']) => CustomsClearanceRecord[]

  // Analytics
  getComplianceScore: (recordId: string) => number
  estimateClearanceTime: (originCountry: string, destinationCountry: string) => number
}

// HS Code Database (Common trade items)
const hsCodesDatabase: HSCodeItem[] = [
  {
    code: '1005',
    description: 'Maize (Corn)',
    category: 'Agricultural',
    dutyRate: 15,
    commonUses: ['Animal feed', 'Food production', 'Industrial use'],
    restrictions: ['Phytosanitary certificate required', 'GMO declaration if applicable']
  },
  {
    code: '1001',
    description: 'Wheat',
    category: 'Agricultural',
    dutyRate: 10,
    commonUses: ['Flour production', 'Bread making', 'Livestock feed'],
    restrictions: ['Phytosanitary certificate', 'Quality certificate']
  },
  {
    code: '6204',
    description: 'Women\'s suits, jackets, dresses',
    category: 'Textiles & Apparel',
    dutyRate: 25,
    commonUses: ['Retail sale', 'Wholesale distribution'],
    restrictions: ['Labeling compliance', 'Country of origin marking']
  },
  {
    code: '8517',
    description: 'Telephone sets and devices',
    category: 'Electronics',
    dutyRate: 5,
    commonUses: ['Retail sale', 'Corporate use'],
    restrictions: ['FCC/CE certification', 'Type approval']
  },
  {
    code: '2710',
    description: 'Petroleum oils and products',
    category: 'Energy',
    dutyRate: 8,
    commonUses: ['Fuel', 'Industrial use'],
    restrictions: ['Hazmat documentation', 'Environmental compliance']
  },
  {
    code: '7326',
    description: 'Iron or steel articles',
    category: 'Metal & Steel',
    dutyRate: 12,
    commonUses: ['Construction', 'Manufacturing'],
    restrictions: ['None typically']
  },
  {
    code: '3004',
    description: 'Medicinal preparations',
    category: 'Pharmaceuticals',
    dutyRate: 0,
    commonUses: ['Healthcare', 'Pharmaceutical distribution'],
    restrictions: ['Drug license', 'Import permit', 'Lab testing']
  },
  {
    code: '3906',
    description: 'Plastic products',
    category: 'Chemicals & Plastics',
    dutyRate: 18,
    commonUses: ['Manufacturing', 'Packaging'],
    restrictions: ['Environmental compliance']
  },
  {
    code: '4407',
    description: 'Wood articles',
    category: 'Raw Materials',
    dutyRate: 20,
    commonUses: ['Construction', 'Furniture', 'Paper production'],
    restrictions: ['CITES certificate if endangered species']
  },
  {
    code: '5513',
    description: 'Woven fabrics',
    category: 'Textiles & Apparel',
    dutyRate: 22,
    commonUses: ['Apparel', 'Home textiles'],
    restrictions: ['Fiber composition declaration']
  },
  {
    code: '8703',
    description: 'Motor vehicles (cars)',
    category: 'Automotive',
    dutyRate: 30,
    commonUses: ['Personal use', 'Commercial'],
    restrictions: ['Emission certificate', 'Safety testing', 'VIN verification']
  },
  {
    code: '8471',
    description: 'Automatic data processing machines',
    category: 'Electronics',
    dutyRate: 3,
    commonUses: ['Business use', 'Personal computers'],
    restrictions: ['None typically']
  },
  {
    code: '2715',
    description: 'Bituminous mixtures',
    category: 'Energy',
    dutyRate: 7,
    commonUses: ['Road construction', 'Industrial use'],
    restrictions: ['Hazmat documentation']
  },
  {
    code: '6403',
    description: 'Leather footwear',
    category: 'Textiles & Apparel',
    dutyRate: 28,
    commonUses: ['Retail sale'],
    restrictions: ['Country of origin marking']
  },
  {
    code: '9406',
    description: 'Prefabricated buildings',
    category: 'Construction',
    dutyRate: 10,
    commonUses: ['Construction', 'Temporary structures'],
    restrictions: ['Safety certification']
  }
]

// Country Requirements Database
const countriesDatabase: CountryRequirement[] = [
  {
    code: 'NG',
    name: 'Nigeria',
    region: 'West Africa',
    hsCodePrefix: '10',
    importDuty: 20,
    vat: 7.5,
    requiredDocuments: [
      'Bill of Lading',
      'Commercial Invoice',
      'Packing List',
      'Certificate of Origin',
      'Phytosanitary Certificate'
    ],
    restrictions: [
      'Restricted electronics',
      'Agricultural products need certification'
    ],
    certifications: ['NAFDAC', 'SON'],
    notes: 'Port of entry: Lagos. Processing time: 5-7 days',
    leadTime: 7
  },
  {
    code: 'ZA',
    name: 'South Africa',
    region: 'Southern Africa',
    hsCodePrefix: '87',
    importDuty: 15,
    vat: 15,
    requiredDocuments: [
      'Bill of Lading',
      'Commercial Invoice',
      'Packing List',
      'Certificate of Origin'
    ],
    restrictions: [
      'Agricultural products need health certificate'
    ],
    certifications: ['SABS', 'NRCS'],
    notes: 'Port of entry: Port Elizabeth, Durban. Processing time: 3-5 days',
    leadTime: 5
  },
  {
    code: 'GH',
    name: 'Ghana',
    region: 'West Africa',
    hsCodePrefix: '85',
    importDuty: 18,
    vat: 12.5,
    requiredDocuments: [
      'Bill of Lading',
      'Commercial Invoice',
      'Packing List',
      'Certificate of Origin',
      'Import License'
    ],
    restrictions: [
      'Some electronics restricted'
    ],
    certifications: ['GSB'],
    notes: 'Port of entry: Tema. Processing time: 4-6 days',
    leadTime: 6
  },
  {
    code: 'KE',
    name: 'Kenya',
    region: 'East Africa',
    hsCodePrefix: '62',
    importDuty: 25,
    vat: 16,
    requiredDocuments: [
      'Bill of Lading',
      'Commercial Invoice',
      'Packing List',
      'Certificate of Origin',
      'Health Certificate'
    ],
    restrictions: [
      'Agricultural products need health certification'
    ],
    certifications: ['KEBS'],
    notes: 'Port of entry: Mombasa. Processing time: 5-8 days',
    leadTime: 8
  },
  {
    code: 'ET',
    name: 'Ethiopia',
    region: 'East Africa',
    hsCodePrefix: '64',
    importDuty: 20,
    vat: 15,
    requiredDocuments: [
      'Bill of Lading',
      'Commercial Invoice',
      'Packing List',
      'Certificate of Origin'
    ],
    restrictions: [
      'Regulated items need approval'
    ],
    certifications: ['EQSA'],
    notes: 'Port of entry: Djibouti. Processing time: 6-9 days',
    leadTime: 9
  },
  {
    code: 'EG',
    name: 'Egypt',
    region: 'North Africa',
    hsCodePrefix: '27',
    importDuty: 22,
    vat: 14,
    requiredDocuments: [
      'Bill of Lading',
      'Commercial Invoice',
      'Packing List',
      'Certificate of Origin',
      'Import Permit'
    ],
    restrictions: [
      'Some chemicals restricted',
      'Agricultural products need certificate'
    ],
    certifications: ['EOS'],
    notes: 'Port of entry: Alexandria, Port Said. Processing time: 4-7 days',
    leadTime: 7
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    region: 'Europe',
    hsCodePrefix: '85',
    importDuty: 0,
    vat: 20,
    requiredDocuments: [
      'Commercial Invoice',
      'Packing List',
      'Certificate of Origin'
    ],
    restrictions: [
      'REACH compliance required for chemicals',
      'CE marking for electronics'
    ],
    certifications: ['CE', 'BSI'],
    notes: 'Direct customs clearance. Processing time: 1-2 days',
    leadTime: 2
  },
  {
    code: 'CN',
    name: 'China',
    region: 'Asia',
    hsCodePrefix: '87',
    importDuty: 12,
    vat: 13,
    requiredDocuments: [
      'Bill of Lading',
      'Commercial Invoice',
      'Packing List',
      'Certificate of Origin',
      'CIQ Inspection'
    ],
    restrictions: [
      'Some electronics need CCCB certification'
    ],
    certifications: ['CCC', 'CE'],
    notes: 'Ports: Shanghai, Shenzhen. Processing time: 3-5 days',
    leadTime: 5
  },
  {
    code: 'IN',
    name: 'India',
    region: 'South Asia',
    hsCodePrefix: '62',
    importDuty: 20,
    vat: 18,
    requiredDocuments: [
      'Bill of Lading',
      'Commercial Invoice',
      'Packing List',
      'Certificate of Origin'
    ],
    restrictions: [
      'Some agricultural products restricted'
    ],
    certifications: ['BIS'],
    notes: 'Ports: Mumbai, Delhi. Processing time: 5-7 days',
    leadTime: 7
  },
  {
    code: 'BR',
    name: 'Brazil',
    region: 'South America',
    hsCodePrefix: '85',
    importDuty: 18,
    vat: 17,
    requiredDocuments: [
      'Bill of Lading',
      'Commercial Invoice',
      'Packing List',
      'Certificate of Origin'
    ],
    restrictions: [
      'ANVISA approval for pharmaceuticals'
    ],
    certifications: ['INMETRO'],
    notes: 'Port of entry: Santos. Processing time: 4-6 days',
    leadTime: 6
  }
]

// Document Types Database
const documentsDatabase: DocumentType[] = [
  {
    id: 'bol',
    name: 'Bill of Lading',
    description: 'Official shipping document issued by carrier',
    required: true,
    countries: ['NG', 'ZA', 'GH', 'KE', 'ET', 'EG', 'CN', 'IN', 'BR', 'GB'],
    fileTypes: ['pdf', 'jpg', 'png']
  },
  {
    id: 'invoice',
    name: 'Commercial Invoice',
    description: 'Detailed invoice with seller and buyer information',
    required: true,
    countries: ['NG', 'ZA', 'GH', 'KE', 'ET', 'EG', 'CN', 'IN', 'BR', 'GB'],
    fileTypes: ['pdf', 'xlsx', 'xls']
  },
  {
    id: 'packing',
    name: 'Packing List',
    description: 'Itemized list of goods in shipment',
    required: true,
    countries: ['NG', 'ZA', 'GH', 'KE', 'ET', 'EG', 'CN', 'IN', 'BR', 'GB'],
    fileTypes: ['pdf', 'xlsx', 'xls']
  },
  {
    id: 'coo',
    name: 'Certificate of Origin',
    description: 'Certifies country of manufacture/origin',
    required: true,
    countries: ['NG', 'ZA', 'GH', 'KE', 'ET', 'EG', 'CN', 'IN', 'BR', 'GB'],
    fileTypes: ['pdf', 'jpg', 'png']
  },
  {
    id: 'phyto',
    name: 'Phytosanitary Certificate',
    description: 'Health certificate for agricultural products',
    required: false,
    countries: ['NG', 'ZA', 'GH', 'KE', 'ET', 'EG'],
    fileTypes: ['pdf', 'jpg', 'png']
  },
  {
    id: 'health',
    name: 'Health Certificate',
    description: 'Health clearance for food and agricultural items',
    required: false,
    countries: ['KE', 'ET', 'ZA', 'NG', 'GH'],
    fileTypes: ['pdf', 'jpg', 'png']
  },
  {
    id: 'import-permit',
    name: 'Import Permit',
    description: 'Government approval for import',
    required: false,
    countries: ['NG', 'GH', 'EG', 'KE'],
    fileTypes: ['pdf', 'jpg', 'png']
  },
  {
    id: 'insurance',
    name: 'Insurance Certificate',
    description: 'Proof of cargo insurance',
    required: false,
    countries: ['NG', 'ZA', 'GH', 'KE', 'ET', 'EG', 'CN', 'IN', 'BR'],
    fileTypes: ['pdf', 'jpg', 'png']
  },
  {
    id: 'certification',
    name: 'Product Certification',
    description: 'Safety/quality certification (CE, FCC, etc)',
    required: false,
    countries: ['GB', 'CN', 'IN'],
    fileTypes: ['pdf', 'jpg', 'png']
  },
  {
    id: 'chemical-declaration',
    name: 'Chemical Declaration',
    description: 'Declaration for chemical contents',
    required: false,
    countries: ['GB', 'EG'],
    fileTypes: ['pdf', 'xlsx', 'xls']
  }
]

// Customs Brokers Database
const brokersDatabase: CustomsBroker[] = [
  {
    id: 'cb-ng-001',
    name: 'Lagos Customs Brokers Ltd',
    country: 'NG',
    phone: '+234 701 234 5678',
    email: 'info@lagoscustomsbrokers.com',
    specializations: ['Agricultural', 'Electronics', 'Textiles'],
    rating: 4.8,
    reviewCount: 124,
    website: 'www.lagoscustomsbrokers.com',
    yearsInBusiness: 15,
    certifications: ['FAAN', 'SONCAP'],
    languages: ['English', 'Yoruba']
  },
  {
    id: 'cb-za-001',
    name: 'Durban Port Customs Agency',
    country: 'ZA',
    phone: '+27 31 305 6789',
    email: 'customs@durbanport.co.za',
    specializations: ['Automotive', 'Industrial', 'Agricultural'],
    rating: 4.9,
    reviewCount: 89,
    website: 'www.durbanportcustoms.co.za',
    yearsInBusiness: 20,
    certifications: ['SACS', 'CIDP'],
    languages: ['English', 'Zulu', 'Afrikaans']
  },
  {
    id: 'cb-gh-001',
    name: 'Tema Customs Clearance Services',
    country: 'GH',
    phone: '+233 302 123 456',
    email: 'services@temasbrokers.com',
    specializations: ['General Cargo', 'Textiles', 'Chemicals'],
    rating: 4.6,
    reviewCount: 67,
    website: 'www.temasbrokers.com',
    yearsInBusiness: 12,
    certifications: ['GCNET', 'GSB'],
    languages: ['English', 'Twi']
  },
  {
    id: 'cb-ke-001',
    name: 'Mombasa Port Brokers Kenya',
    country: 'KE',
    phone: '+254 701 123 456',
    email: 'info@mombasabrokers.co.ke',
    specializations: ['General Cargo', 'Textiles', 'Electronics'],
    rating: 4.7,
    reviewCount: 95,
    website: 'www.mombasabrokers.co.ke',
    yearsInBusiness: 18,
    certifications: ['KPA', 'KURA'],
    languages: ['English', 'Swahili']
  },
  {
    id: 'cb-gb-001',
    name: 'London International Customs Ltd',
    country: 'GB',
    phone: '+44 20 7123 4567',
    email: 'enquiry@londoncustoms.co.uk',
    specializations: ['EU Trade', 'General Cargo', 'Electronics'],
    rating: 4.9,
    reviewCount: 156,
    website: 'www.londoncustoms.co.uk',
    yearsInBusiness: 25,
    certifications: ['HMRC', 'BIFA'],
    languages: ['English', 'French', 'German']
  },
  {
    id: 'cb-cn-001',
    name: 'Shanghai Trade Customs Agency',
    country: 'CN',
    phone: '+86 21 5888 1234',
    email: 'info@shanghaitradebroker.com',
    specializations: ['General Cargo', 'Electronics', 'Textiles'],
    rating: 4.8,
    reviewCount: 142,
    website: 'www.shanghaitradebroker.com',
    yearsInBusiness: 22,
    certifications: ['China Customs', 'CCC'],
    languages: ['Chinese', 'English']
  },
  {
    id: 'cb-eg-001',
    name: 'Alexandria Port Customs Services',
    country: 'EG',
    phone: '+20 2 1234 5678',
    email: 'customs@alexportbroker.eg',
    specializations: ['General Cargo', 'Agricultural', 'Industrial'],
    rating: 4.5,
    reviewCount: 72,
    website: 'www.alexportbroker.eg',
    yearsInBusiness: 14,
    certifications: ['ECS', 'Egyptian Chamber'],
    languages: ['Arabic', 'English']
  },
  {
    id: 'cb-in-001',
    name: 'Mumbai Port Customs Brokers',
    country: 'IN',
    phone: '+91 22 2123 4567',
    email: 'info@mumbaiportbrokers.in',
    specializations: ['General Cargo', 'Textiles', 'Electronics'],
    rating: 4.7,
    reviewCount: 108,
    website: 'www.mumbaiportbrokers.in',
    yearsInBusiness: 19,
    certifications: ['ICCWC', 'Indian Customs'],
    languages: ['Hindi', 'English', 'Marathi']
  },
  {
    id: 'cb-br-001',
    name: 'Santos Port Customs Agency',
    country: 'BR',
    phone: '+55 13 3000 1234',
    email: 'info@santosbroker.com.br',
    specializations: ['General Cargo', 'Automotive', 'Industrial'],
    rating: 4.6,
    reviewCount: 91,
    website: 'www.santosbroker.com.br',
    yearsInBusiness: 16,
    certifications: ['ABREX', 'Brazilian Chamber'],
    languages: ['Portuguese', 'English', 'Spanish']
  },
  {
    id: 'cb-et-001',
    name: 'Djibouti Port Customs Services',
    country: 'ET',
    phone: '+253 21 123 456',
    email: 'customs@djiboutiportservices.dj',
    specializations: ['East African Trade', 'General Cargo', 'Agricultural'],
    rating: 4.4,
    reviewCount: 56,
    website: 'www.djiboutiportservices.dj',
    yearsInBusiness: 11,
    certifications: ['DPA', 'EAPPCA'],
    languages: ['French', 'Arabic', 'English']
  }
]

// Initial clearance records with sample data
const initialClearanceRecords: CustomsClearanceRecord[] = []

export const useCustomsStore = create<CustomsStore>()(
  persist(
    (set, get) => ({
      hsCodesDatabase,
      countriesDatabase,
      documentsDatabase,
      brokersDatabase,
      clearanceRecords: initialClearanceRecords,

      // HS Code Operations
      searchHSCodes: (query) => {
        const lowerQuery = query.toLowerCase()
        return get().hsCodesDatabase.filter(item =>
          item.code.includes(query) ||
          item.description.toLowerCase().includes(lowerQuery) ||
          item.category.toLowerCase().includes(lowerQuery)
        )
      },

      getHSCodeDetails: (code) => {
        return get().hsCodesDatabase.find(item => item.code === code)
      },

      suggestHSCode: (itemDescription) => {
        const lowerDesc = itemDescription.toLowerCase()
        return get().hsCodesDatabase.filter(item =>
          item.commonUses.some(use => use.toLowerCase().includes(lowerDesc)) ||
          item.description.toLowerCase().includes(lowerDesc)
        ).slice(0, 5)
      },

      // Country Requirements
      getCountryRequirements: (countryCode) => {
        return get().countriesDatabase.find(c => c.code === countryCode)
      },

      getRequiredDocuments: (countryCode) => {
        return get().documentsDatabase.filter(doc =>
          doc.countries.includes(countryCode)
        )
      },

      getTradeRouteInfo: (origin, destination) => {
        const destCountry = get().countriesDatabase.find(c => c.code === destination)
        const originCountry = get().countriesDatabase.find(c => c.code === origin)

        if (!destCountry) return null

        return {
          route: `${origin} → ${destination}`,
          destinationCountry: destCountry.name,
          originCountry: originCountry?.name || origin,
          estimatedDays: destCountry.leadTime,
          importDuty: destCountry.importDuty,
          vat: destCountry.vat,
          totalTax: destCountry.importDuty + destCountry.vat,
          requiredDocuments: destCountry.requiredDocuments,
          restrictions: destCountry.restrictions,
          certifications: destCountry.certifications,
          notes: destCountry.notes,
        }
      },

      // Document Checklist
      getChecklistForCountry: (countryCode, hsCode) => {
        const requiredDocs = get().getRequiredDocuments(countryCode)
        return requiredDocs.map((doc, index) => ({
          id: doc.id,
          documentId: doc.id,
          name: doc.name,
          status: 'pending' as const,
        }))
      },

      updateDocumentStatus: (recordId, docId, status) => {
        set((state) => ({
          clearanceRecords: state.clearanceRecords.map((record) =>
            record.id === recordId
              ? {
                  ...record,
                  documents: record.documents.map((doc) =>
                    doc.documentId === docId ? { ...doc, status } : doc
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : record
          ),
        }))
      },

      uploadDocument: (recordId, docId, uploadedAt) => {
        set((state) => ({
          clearanceRecords: state.clearanceRecords.map((record) =>
            record.id === recordId
              ? {
                  ...record,
                  documents: record.documents.map((doc) =>
                    doc.documentId === docId
                      ? { ...doc, status: 'submitted', uploadedAt }
                      : doc
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : record
          ),
        }))
      },

      // Customs Broker Finder
      findBrokers: (country, specialty) => {
        const brokers = get().brokersDatabase.filter(b => b.country === country)
        if (!specialty) return brokers
        return brokers.filter(b =>
          b.specializations.some(s =>
            s.toLowerCase().includes(specialty.toLowerCase())
          )
        )
      },

      getBrokerDetails: (brokerId) => {
        return get().brokersDatabase.find(b => b.id === brokerId)
      },

      filterBrokersByRating: (country, minRating) => {
        return get().brokersDatabase.filter(b =>
          b.country === country && b.rating >= minRating
        )
      },

      // Clearance Records
      createClearanceRecord: (recordData) => {
        const newRecord: CustomsClearanceRecord = {
          ...recordData,
          id: `clearance-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        set((state) => ({
          clearanceRecords: [...state.clearanceRecords, newRecord],
        }))

        return newRecord.id
      },

      updateClearanceRecord: (id, updates) => {
        set((state) => ({
          clearanceRecords: state.clearanceRecords.map((record) =>
            record.id === id
              ? { ...record, ...updates, updatedAt: new Date().toISOString() }
              : record
          ),
        }))
      },

      getClearanceRecord: (id) => {
        return get().clearanceRecords.find(r => r.id === id)
      },

      getClearancesByStatus: (status) => {
        return get().clearanceRecords.filter(r => r.status === status)
      },

      // Analytics
      getComplianceScore: (recordId) => {
        const record = get().getClearanceRecord(recordId)
        if (!record) return 0

        const totalDocs = record.documents.length
        if (totalDocs === 0) return 0

        const completedDocs = record.documents.filter(
          d => d.status === 'approved'
        ).length
        return Math.round((completedDocs / totalDocs) * 100)
      },

      estimateClearanceTime: (originCountry, destinationCountry) => {
        const destCountry = get().countriesDatabase.find(
          c => c.code === destinationCountry
        )
        if (!destCountry) return 5
        return destCountry.leadTime
      },
    }),
    {
      name: 'customs-clearance-store',
    }
  )
)

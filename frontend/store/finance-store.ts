import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Finance Option Types
export type FinanceTermType = 'NET_30' | 'NET_60' | 'NET_90' | 'NET_120'
export type ApplicationStatus = 'draft' | 'pending' | 'under_review' | 'approved' | 'rejected' | 'active'
export type PaymentPlanType = 'installment' | 'deferred' | 'milestone'

// Finance Partner
export interface FinancePartner {
  id: string
  name: string
  logo: string
  description: string
  minCreditAmount: number
  maxCreditAmount: number
  interestRate: number
  processingTime: string
  rating: number
  totalFinanced: number
  industries: string[]
  requirements: string[]
  contactEmail: string
  contactPhone: string
  website: string
}

// Trade Credit Application
export interface TradeCreditApplication {
  id: string
  companyName: string
  businessType: string
  taxId: string
  registrationNumber: string
  yearsInBusiness: number
  annualRevenue: number
  requestedCreditLimit: number
  paymentTerms: FinanceTermType
  industryType: string
  businessAddress: {
    street: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  contactPerson: {
    name: string
    position: string
    email: string
    phone: string
  }
  bankReferences: Array<{
    bankName: string
    accountNumber: string
    branchAddress: string
  }>
  tradeReferences: Array<{
    companyName: string
    contactName: string
    email: string
    phone: string
    creditTerms: string
  }>
  financialDocuments: Array<{
    type: string
    name: string
    url: string
    uploadedAt: string
  }>
  status: ApplicationStatus
  appliedAt: string
  reviewedAt?: string
  approvedAt?: string
  approvedLimit?: number
  approvedTerms?: FinanceTermType
  rejectionReason?: string
}

// Credit Line
export interface CreditLine {
  id: string
  applicationId: string
  totalLimit: number
  availableCredit: number
  usedCredit: number
  interestRate: number
  paymentTerms: FinanceTermType
  expiryDate: string
  isActive: boolean
  utilizationPercentage: number
}

// Payment Plan
export interface PaymentPlan {
  id: string
  orderId?: string
  amount: number
  planType: PaymentPlanType
  numberOfInstallments: number
  installmentAmount: number
  firstPaymentDate: string
  paymentFrequency: 'weekly' | 'biweekly' | 'monthly'
  interestRate: number
  totalWithInterest: number
  installments: Array<{
    number: number
    amount: number
    dueDate: string
    status: 'pending' | 'paid' | 'overdue' | 'cancelled'
    paidAt?: string
  }>
  createdAt: string
  completedAt?: string
}

// Invoice Factoring
export interface InvoiceFactoring {
  id: string
  invoiceNumber: string
  invoiceAmount: number
  invoiceDate: string
  dueDate: string
  customerName: string
  advanceRate: number // Percentage of invoice amount advanced
  advanceAmount: number
  factoringFee: number
  feePercentage: number
  netAmount: number // Amount received after fees
  status: 'pending' | 'approved' | 'funded' | 'collected' | 'rejected'
  appliedAt: string
  fundedAt?: string
  collectedAt?: string
  partnerId?: string
}

// Payment Schedule
export interface PaymentSchedule {
  orderId: string
  totalAmount: number
  dueDate: string
  earlyPaymentDiscount?: number
  latePaymentPenalty?: number
  milestones?: Array<{
    id: string
    description: string
    percentage: number
    amount: number
    dueDate: string
    status: 'pending' | 'completed' | 'overdue'
  }>
}

interface FinanceState {
  // Applications
  applications: TradeCreditApplication[]
  currentApplication: Partial<TradeCreditApplication> | null

  // Credit Lines
  creditLines: CreditLine[]
  activeCreditLine: CreditLine | null

  // Payment Plans
  paymentPlans: PaymentPlan[]

  // Invoice Factoring
  factoringRequests: InvoiceFactoring[]

  // Finance Partners
  financePartners: FinancePartner[]

  // Payment Schedules
  paymentSchedules: PaymentSchedule[]

  // Application Actions
  createApplication: (data: Partial<TradeCreditApplication>) => string
  updateApplication: (id: string, data: Partial<TradeCreditApplication>) => void
  submitApplication: (id: string) => void
  getApplication: (id: string) => TradeCreditApplication | undefined

  // Credit Line Actions
  addCreditLine: (creditLine: CreditLine) => void
  updateCreditUtilization: (id: string, usedAmount: number) => void
  getCreditLine: (id: string) => CreditLine | undefined

  // Payment Plan Actions
  createPaymentPlan: (plan: Omit<PaymentPlan, 'id' | 'createdAt'>) => string
  updatePaymentPlan: (id: string, updates: Partial<PaymentPlan>) => void
  markInstallmentPaid: (planId: string, installmentNumber: number) => void

  // Invoice Factoring Actions
  submitFactoringRequest: (request: Omit<InvoiceFactoring, 'id' | 'appliedAt' | 'status'>) => string
  updateFactoringStatus: (id: string, status: InvoiceFactoring['status']) => void

  // Finance Partners
  setFinancePartners: (partners: FinancePartner[]) => void
  getPartner: (id: string) => FinancePartner | undefined

  // Payment Schedule Actions
  createPaymentSchedule: (schedule: PaymentSchedule) => void
  updatePaymentSchedule: (orderId: string, updates: Partial<PaymentSchedule>) => void

  // Calculators
  calculateInstallments: (
    amount: number,
    numberOfInstallments: number,
    interestRate: number,
    frequency: PaymentPlan['paymentFrequency']
  ) => PaymentPlan['installments']

  calculateFactoringCost: (
    invoiceAmount: number,
    advanceRate: number,
    feePercentage: number
  ) => {
    advanceAmount: number
    factoringFee: number
    netAmount: number
  }

  calculateEarlyPaymentDiscount: (amount: number, daysEarly: number, discountRate: number) => number

  // Clear/Reset
  clearCurrentApplication: () => void
}

// Finance Partners - populated from API
const mockFinancePartners: FinancePartner[] = []

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set, get) => ({
      applications: [],
      currentApplication: null,
      creditLines: [],
      activeCreditLine: null,
      paymentPlans: [],
      factoringRequests: [],
      financePartners: mockFinancePartners,
      paymentSchedules: [],

      createApplication: (data) => {
        const newApplication: TradeCreditApplication = {
          id: `app-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          companyName: data.companyName || '',
          businessType: data.businessType || '',
          taxId: data.taxId || '',
          registrationNumber: data.registrationNumber || '',
          yearsInBusiness: data.yearsInBusiness || 0,
          annualRevenue: data.annualRevenue || 0,
          requestedCreditLimit: data.requestedCreditLimit || 0,
          paymentTerms: data.paymentTerms || 'NET_30',
          industryType: data.industryType || '',
          businessAddress: data.businessAddress || {
            street: '',
            city: '',
            state: '',
            postalCode: '',
            country: '',
          },
          contactPerson: data.contactPerson || {
            name: '',
            position: '',
            email: '',
            phone: '',
          },
          bankReferences: data.bankReferences || [],
          tradeReferences: data.tradeReferences || [],
          financialDocuments: data.financialDocuments || [],
          status: 'draft',
          appliedAt: new Date().toISOString(),
        }

        set((state) => ({
          applications: [...state.applications, newApplication],
          currentApplication: newApplication,
        }))

        return newApplication.id
      },

      updateApplication: (id, data) => {
        set((state) => ({
          applications: state.applications.map((app) =>
            app.id === id ? { ...app, ...data } : app
          ),
          currentApplication:
            state.currentApplication?.id === id
              ? { ...state.currentApplication, ...data }
              : state.currentApplication,
        }))
      },

      submitApplication: (id) => {
        set((state) => ({
          applications: state.applications.map((app) =>
            app.id === id
              ? { ...app, status: 'pending' as ApplicationStatus, appliedAt: new Date().toISOString() }
              : app
          ),
        }))
      },

      getApplication: (id) => {
        return get().applications.find((app) => app.id === id)
      },

      addCreditLine: (creditLine) => {
        set((state) => ({
          creditLines: [...state.creditLines, creditLine],
          activeCreditLine: creditLine.isActive ? creditLine : state.activeCreditLine,
        }))
      },

      updateCreditUtilization: (id, usedAmount) => {
        set((state) => ({
          creditLines: state.creditLines.map((line) => {
            if (line.id === id) {
              const usedCredit = usedAmount
              const availableCredit = line.totalLimit - usedCredit
              const utilizationPercentage = (usedCredit / line.totalLimit) * 100
              return {
                ...line,
                usedCredit,
                availableCredit,
                utilizationPercentage,
              }
            }
            return line
          }),
        }))
      },

      getCreditLine: (id) => {
        return get().creditLines.find((line) => line.id === id)
      },

      createPaymentPlan: (plan) => {
        const newPlan: PaymentPlan = {
          ...plan,
          id: `plan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString(),
        }

        set((state) => ({
          paymentPlans: [...state.paymentPlans, newPlan],
        }))

        return newPlan.id
      },

      updatePaymentPlan: (id, updates) => {
        set((state) => ({
          paymentPlans: state.paymentPlans.map((plan) =>
            plan.id === id ? { ...plan, ...updates } : plan
          ),
        }))
      },

      markInstallmentPaid: (planId, installmentNumber) => {
        set((state) => ({
          paymentPlans: state.paymentPlans.map((plan) => {
            if (plan.id === planId) {
              return {
                ...plan,
                installments: plan.installments.map((inst) =>
                  inst.number === installmentNumber
                    ? { ...inst, status: 'paid' as const, paidAt: new Date().toISOString() }
                    : inst
                ),
              }
            }
            return plan
          }),
        }))
      },

      submitFactoringRequest: (request) => {
        const newRequest: InvoiceFactoring = {
          ...request,
          id: `fact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          appliedAt: new Date().toISOString(),
          status: 'pending',
        }

        set((state) => ({
          factoringRequests: [...state.factoringRequests, newRequest],
        }))

        return newRequest.id
      },

      updateFactoringStatus: (id, status) => {
        set((state) => ({
          factoringRequests: state.factoringRequests.map((req) =>
            req.id === id
              ? {
                  ...req,
                  status,
                  fundedAt: status === 'funded' ? new Date().toISOString() : req.fundedAt,
                  collectedAt: status === 'collected' ? new Date().toISOString() : req.collectedAt,
                }
              : req
          ),
        }))
      },

      setFinancePartners: (partners) => {
        set({ financePartners: partners })
      },

      getPartner: (id) => {
        return get().financePartners.find((partner) => partner.id === id)
      },

      createPaymentSchedule: (schedule) => {
        set((state) => ({
          paymentSchedules: [...state.paymentSchedules, schedule],
        }))
      },

      updatePaymentSchedule: (orderId, updates) => {
        set((state) => ({
          paymentSchedules: state.paymentSchedules.map((schedule) =>
            schedule.orderId === orderId ? { ...schedule, ...updates } : schedule
          ),
        }))
      },

      calculateInstallments: (amount, numberOfInstallments, interestRate, frequency) => {
        const monthlyRate = interestRate / 100 / 12
        const totalWithInterest = amount * (1 + monthlyRate * numberOfInstallments)
        const installmentAmount = totalWithInterest / numberOfInstallments

        const installments: PaymentPlan['installments'] = []
        const startDate = new Date()

        for (let i = 0; i < numberOfInstallments; i++) {
          const dueDate = new Date(startDate)

          switch (frequency) {
            case 'weekly':
              dueDate.setDate(dueDate.getDate() + i * 7)
              break
            case 'biweekly':
              dueDate.setDate(dueDate.getDate() + i * 14)
              break
            case 'monthly':
              dueDate.setMonth(dueDate.getMonth() + i)
              break
          }

          installments.push({
            number: i + 1,
            amount: installmentAmount,
            dueDate: dueDate.toISOString(),
            status: 'pending',
          })
        }

        return installments
      },

      calculateFactoringCost: (invoiceAmount, advanceRate, feePercentage) => {
        const advanceAmount = invoiceAmount * (advanceRate / 100)
        const factoringFee = invoiceAmount * (feePercentage / 100)
        const netAmount = advanceAmount - factoringFee

        return {
          advanceAmount,
          factoringFee,
          netAmount,
        }
      },

      calculateEarlyPaymentDiscount: (amount, daysEarly, discountRate) => {
        return amount * (discountRate / 100) * (daysEarly / 30)
      },

      clearCurrentApplication: () => {
        set({ currentApplication: null })
      },
    }),
    {
      name: 'vendora-finance-storage',
    }
  )
)

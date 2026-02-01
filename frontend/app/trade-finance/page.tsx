'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import {
  DollarSign,
  TrendingUp,
  FileText,
  Calculator,
  Calendar,
  CreditCard,
  CheckCircle2,
  Clock,
  Building2,
  Shield,
  ArrowRight,
  Receipt,
  Briefcase,
  Target,
  AlertCircle,
  Info,
  Star,
  Users,
  Wallet,
  PieChart,
  LineChart,
  Download,
  Upload,
  Plus,
  X,
  ChevronRight,
  BanknoteIcon,
  HandshakeIcon,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Slider } from '@/components/ui/slider'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useFinanceStore } from '@/store'
import { format, addMonths, addDays, addWeeks, differenceInDays } from 'date-fns'

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

// Finance Options Component
function FinancingOptions() {
  const financeOptions = [
    {
      id: 'net30',
      title: 'Net 30',
      term: 'NET_30',
      description: 'Pay within 30 days',
      interestRate: 0,
      benefits: ['No interest', 'Improve cash flow', 'Build credit history'],
      icon: Calendar,
      color: 'text-blue-600',
    },
    {
      id: 'net60',
      title: 'Net 60',
      term: 'NET_60',
      description: 'Pay within 60 days',
      interestRate: 1.5,
      benefits: ['Low interest rate', 'Extended payment time', 'Flexible terms'],
      icon: Clock,
      color: 'text-green-600',
    },
    {
      id: 'net90',
      title: 'Net 90',
      term: 'NET_90',
      description: 'Pay within 90 days',
      interestRate: 2.5,
      benefits: ['Maximum flexibility', 'Seasonal support', 'Growth enabler'],
      icon: TrendingUp,
      color: 'text-purple-600',
    },
    {
      id: 'creditline',
      title: 'Revolving Credit',
      term: 'CREDIT_LINE',
      description: 'Ongoing credit facility',
      interestRate: 3.5,
      benefits: ['Reusable credit', 'Competitive rates', 'On-demand access'],
      icon: CreditCard,
      color: 'text-orange-600',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {financeOptions.map((option) => {
        const Icon = option.icon
        return (
          <motion.div key={option.id} variants={fadeInUp}>
            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-lg bg-primary/10`}>
                    <Icon className={`h-6 w-6 ${option.color}`} />
                  </div>
                  {option.interestRate === 0 && (
                    <Badge variant="secondary">Popular</Badge>
                  )}
                </div>
                <CardTitle className="text-xl">{option.title}</CardTitle>
                <CardDescription>{option.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Interest Rate</span>
                    <span className="font-semibold">
                      {option.interestRate === 0 ? 'Free' : `${option.interestRate}%`}
                    </span>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    {option.benefits.map((benefit, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{benefit}</span>
                      </div>
                    ))}
                  </div>
                  <Button className="w-full" variant="outline">
                    Learn More
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}

// Credit Application Form Component
function CreditApplicationForm() {
  const { createApplication, currentApplication, updateApplication } = useFinanceStore()
  const [step, setStep] = React.useState(1)
  const [formData, setFormData] = React.useState({
    companyName: '',
    businessType: '',
    taxId: '',
    registrationNumber: '',
    yearsInBusiness: 0,
    annualRevenue: 0,
    requestedCreditLimit: 0,
    paymentTerms: 'NET_30' as any,
    industryType: '',
  })

  const handleSubmit = () => {
    const appId = createApplication(formData)
    console.log('Application created:', appId)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Apply for Trade Credit</CardTitle>
        <CardDescription>
          Complete your application to access flexible payment terms
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Progress Indicator */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Application Progress</span>
              <span className="font-medium">{step} of 3</span>
            </div>
            <Progress value={(step / 3) * 100} />
          </div>

          {/* Step 1: Company Information */}
          {step === 1 && (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="space-y-4"
            >
              <motion.div variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    placeholder="ABC Trading Ltd"
                    value={formData.companyName}
                    onChange={(e) =>
                      setFormData({ ...formData, companyName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessType">Business Type *</Label>
                  <Select
                    value={formData.businessType}
                    onValueChange={(value) =>
                      setFormData({ ...formData, businessType: value })
                    }
                  >
                    <SelectTrigger id="businessType">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sole_proprietorship">Sole Proprietorship</SelectItem>
                      <SelectItem value="partnership">Partnership</SelectItem>
                      <SelectItem value="llc">Limited Liability Company</SelectItem>
                      <SelectItem value="corporation">Corporation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </motion.div>

              <motion.div variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="taxId">Tax ID / EIN *</Label>
                  <Input
                    id="taxId"
                    placeholder="XX-XXXXXXX"
                    value={formData.taxId}
                    onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registrationNumber">Registration Number</Label>
                  <Input
                    id="registrationNumber"
                    placeholder="Company registration"
                    value={formData.registrationNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, registrationNumber: e.target.value })
                    }
                  />
                </div>
              </motion.div>

              <motion.div variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="industryType">Industry *</Label>
                  <Select
                    value={formData.industryType}
                    onValueChange={(value) =>
                      setFormData({ ...formData, industryType: value })
                    }
                  >
                    <SelectTrigger id="industryType">
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manufacturing">Manufacturing</SelectItem>
                      <SelectItem value="wholesale">Wholesale</SelectItem>
                      <SelectItem value="retail">Retail</SelectItem>
                      <SelectItem value="import_export">Import/Export</SelectItem>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="services">Services</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="yearsInBusiness">Years in Business *</Label>
                  <Input
                    id="yearsInBusiness"
                    type="number"
                    placeholder="5"
                    value={formData.yearsInBusiness || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, yearsInBusiness: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Step 2: Financial Information */}
          {step === 2 && (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="space-y-4"
            >
              <motion.div variants={fadeInUp} className="space-y-2">
                <Label htmlFor="annualRevenue">Annual Revenue (GBP) *</Label>
                <Input
                  id="annualRevenue"
                  type="number"
                  placeholder="1000000"
                  value={formData.annualRevenue || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, annualRevenue: parseInt(e.target.value) || 0 })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Enter your total annual revenue from the last fiscal year
                </p>
              </motion.div>

              <motion.div variants={fadeInUp} className="space-y-2">
                <Label htmlFor="requestedCreditLimit">Requested Credit Limit (GBP) *</Label>
                <Input
                  id="requestedCreditLimit"
                  type="number"
                  placeholder="50000"
                  value={formData.requestedCreditLimit || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      requestedCreditLimit: parseInt(e.target.value) || 0,
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Typical range: £5,000 - £500,000 based on business profile
                </p>
              </motion.div>

              <motion.div variants={fadeInUp} className="space-y-2">
                <Label htmlFor="paymentTerms">Preferred Payment Terms *</Label>
                <RadioGroup
                  value={formData.paymentTerms}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, paymentTerms: value })
                  }
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="NET_30" id="net30" />
                    <Label htmlFor="net30" className="font-normal cursor-pointer">
                      Net 30 (0% interest)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="NET_60" id="net60" />
                    <Label htmlFor="net60" className="font-normal cursor-pointer">
                      Net 60 (1.5% interest)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="NET_90" id="net90" />
                    <Label htmlFor="net90" className="font-normal cursor-pointer">
                      Net 90 (2.5% interest)
                    </Label>
                  </div>
                </RadioGroup>
              </motion.div>

              <motion.div variants={fadeInUp}>
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Financial Documents Required</AlertTitle>
                  <AlertDescription>
                    You'll need to upload bank statements, tax returns, and financial statements in the
                    next step.
                  </AlertDescription>
                </Alert>
              </motion.div>
            </motion.div>
          )}

          {/* Step 3: Review & Submit */}
          {step === 3 && (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="space-y-4"
            >
              <motion.div variants={fadeInUp}>
                <h3 className="font-semibold mb-4">Review Your Application</h3>
                <div className="space-y-3 bg-muted/50 p-4 rounded-lg">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Company Name:</span>
                    <span className="font-medium">{formData.companyName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Business Type:</span>
                    <span className="font-medium capitalize">{formData.businessType.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Industry:</span>
                    <span className="font-medium capitalize">{formData.industryType.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Years in Business:</span>
                    <span className="font-medium">{formData.yearsInBusiness} years</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Annual Revenue:</span>
                    <span className="font-medium">
                      £{formData.annualRevenue.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Requested Credit Limit:</span>
                    <span className="font-medium text-primary">
                      £{formData.requestedCreditLimit.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment Terms:</span>
                    <span className="font-medium">{formData.paymentTerms.replace('_', ' ')}</span>
                  </div>
                </div>
              </motion.div>

              <motion.div variants={fadeInUp}>
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>Fast Track Approval</AlertTitle>
                  <AlertDescription>
                    Applications are typically reviewed within 2-3 business days. You'll receive email
                    updates on your application status.
                  </AlertDescription>
                </Alert>
              </motion.div>
            </motion.div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4">
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                Previous
              </Button>
            )}
            <div className="ml-auto">
              {step < 3 ? (
                <Button onClick={() => setStep(step + 1)}>
                  Next Step
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleSubmit}>
                  Submit Application
                  <CheckCircle2 className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Payment Plan Calculator Component
function PaymentPlanCalculator() {
  const { calculateInstallments } = useFinanceStore()
  const [amount, setAmount] = React.useState(10000)
  const [installments, setInstallments] = React.useState(6)
  const [interestRate, setInterestRate] = React.useState(3.5)
  const [frequency, setFrequency] = React.useState<'weekly' | 'biweekly' | 'monthly'>('monthly')

  const plan = React.useMemo(() => {
    const monthlyRate = interestRate / 100 / 12
    const totalWithInterest = amount * (1 + monthlyRate * installments)
    const installmentAmount = totalWithInterest / installments

    return {
      totalWithInterest,
      installmentAmount,
      totalInterest: totalWithInterest - amount,
      installments: calculateInstallments(amount, installments, interestRate, frequency),
    }
  }, [amount, installments, interestRate, frequency, calculateInstallments])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Payment Plan Calculator
        </CardTitle>
        <CardDescription>
          Calculate your custom payment plan with flexible terms
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="amount">Purchase Amount</Label>
              <span className="text-sm font-medium">£{amount.toLocaleString()}</span>
            </div>
            <Slider
              id="amount"
              min={1000}
              max={100000}
              step={1000}
              value={[amount]}
              onValueChange={([value]) => setAmount(value)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="installments">Number of Installments</Label>
              <span className="text-sm font-medium">{installments}</span>
            </div>
            <Slider
              id="installments"
              min={3}
              max={24}
              step={1}
              value={[installments]}
              onValueChange={([value]) => setInstallments(value)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="interestRate">Interest Rate</Label>
              <span className="text-sm font-medium">{interestRate}%</span>
            </div>
            <Slider
              id="interestRate"
              min={0}
              max={10}
              step={0.5}
              value={[interestRate]}
              onValueChange={([value]) => setInterestRate(value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Payment Frequency</Label>
            <RadioGroup value={frequency} onValueChange={(value: any) => setFrequency(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="weekly" id="weekly" />
                <Label htmlFor="weekly" className="font-normal cursor-pointer">
                  Weekly
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="biweekly" id="biweekly" />
                <Label htmlFor="biweekly" className="font-normal cursor-pointer">
                  Bi-weekly
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="monthly" id="monthly" />
                <Label htmlFor="monthly" className="font-normal cursor-pointer">
                  Monthly
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <Separator />

        {/* Calculation Results */}
        <div className="space-y-3 bg-muted/50 p-4 rounded-lg">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Principal Amount:</span>
            <span className="font-medium">£{amount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Interest:</span>
            <span className="font-medium text-orange-600">
              £{plan.totalInterest.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Repayment:</span>
            <span className="font-medium">
              £{plan.totalWithInterest.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="font-semibold">Installment Amount:</span>
            <span className="font-bold text-lg text-primary">
              £{plan.installmentAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <Button className="w-full">
          Create Payment Plan
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  )
}

// Credit Limit Tracker Component
function CreditLimitTracker() {
  const { creditLines } = useFinanceStore()

  const creditLine = creditLines[0] || null

  if (!creditLine) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Credit Limit Tracker
          </CardTitle>
          <CardDescription>Monitor your available trade credit</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">No credit lines available. Apply for trade credit to get started.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Credit Limit Tracker
        </CardTitle>
        <CardDescription>Monitor your available trade credit</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Credit Utilization</span>
            <span className="font-medium">{creditLine.utilizationPercentage}%</span>
          </div>
          <Progress value={creditLine.utilizationPercentage} className="h-3" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>£0</span>
            <span>£{creditLine.totalLimit.toLocaleString()}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-xs text-muted-foreground">Available Credit</p>
            <p className="text-2xl font-bold text-green-600">
              £{creditLine.availableCredit.toLocaleString()}
            </p>
          </div>
          <div className="space-y-1 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <p className="text-xs text-muted-foreground">Used Credit</p>
            <p className="text-2xl font-bold text-orange-600">
              £{creditLine.usedCredit.toLocaleString()}
            </p>
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Credit Limit:</span>
            <span className="font-semibold">£{creditLine.totalLimit.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Expires:</span>
            <span className="font-medium">{format(new Date(creditLine.expiryDate), 'MMM dd, yyyy')}</span>
          </div>
        </div>

        {creditLine.utilizationPercentage > 80 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>High Utilization</AlertTitle>
            <AlertDescription>
              Your credit utilization is high. Consider making a payment or requesting a limit increase.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1">
            Request Increase
          </Button>
          <Button className="flex-1">Make Payment</Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Invoice Factoring Component
function InvoiceFactoring() {
  const { calculateFactoringCost, submitFactoringRequest } = useFinanceStore()
  const [invoiceAmount, setInvoiceAmount] = React.useState(25000)
  const [advanceRate, setAdvanceRate] = React.useState(80)
  const [feePercentage, setFeePercentage] = React.useState(2.5)

  const costs = calculateFactoringCost(invoiceAmount, advanceRate, feePercentage)

  const handleSubmit = () => {
    submitFactoringRequest({
      invoiceNumber: `INV-${Date.now()}`,
      invoiceAmount,
      invoiceDate: new Date().toISOString(),
      dueDate: addDays(new Date(), 30).toISOString(),
      customerName: 'Example Customer',
      advanceRate,
      advanceAmount: costs.advanceAmount,
      factoringFee: costs.factoringFee,
      feePercentage,
      netAmount: costs.netAmount,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Invoice Factoring
        </CardTitle>
        <CardDescription>
          Convert your invoices into immediate working capital
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Get up to 90% of your invoice value upfront. Fast funding in as little as 24 hours.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="invoiceAmount">Invoice Amount</Label>
              <span className="text-sm font-medium">£{invoiceAmount.toLocaleString()}</span>
            </div>
            <Slider
              id="invoiceAmount"
              min={5000}
              max={250000}
              step={1000}
              value={[invoiceAmount]}
              onValueChange={([value]) => setInvoiceAmount(value)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="advanceRate">Advance Rate</Label>
              <span className="text-sm font-medium">{advanceRate}%</span>
            </div>
            <Slider
              id="advanceRate"
              min={50}
              max={90}
              step={5}
              value={[advanceRate]}
              onValueChange={([value]) => setAdvanceRate(value)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="feePercentage">Factoring Fee</Label>
              <span className="text-sm font-medium">{feePercentage}%</span>
            </div>
            <Slider
              id="feePercentage"
              min={1}
              max={5}
              step={0.5}
              value={[feePercentage]}
              onValueChange={([value]) => setFeePercentage(value)}
            />
          </div>
        </div>

        <Separator />

        <div className="space-y-3 bg-muted/50 p-4 rounded-lg">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Advance Amount ({advanceRate}%):</span>
            <span className="font-medium text-green-600">
              £{costs.advanceAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Factoring Fee ({feePercentage}%):</span>
            <span className="font-medium text-orange-600">
              -£{costs.factoringFee.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="font-semibold">You Receive:</span>
            <span className="font-bold text-lg text-primary">
              £{costs.netAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="invoiceUpload">Upload Invoice</Label>
          <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-muted-foreground mt-1">PDF, JPG or PNG (max. 10MB)</p>
          </div>
        </div>

        <Button className="w-full" onClick={handleSubmit}>
          Submit for Factoring
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  )
}

// Finance Partners Directory Component
function FinancePartnersDirectory() {
  const { financePartners } = useFinanceStore()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Finance Partner Directory</h2>
        <p className="text-muted-foreground">
          Connect with trusted finance providers offering competitive terms
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {financePartners.map((partner) => (
          <Card key={partner.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{partner.name}</CardTitle>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{partner.rating}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{partner.description}</p>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Interest Rate</p>
                  <p className="font-semibold text-primary">{partner.interestRate}%</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Processing Time</p>
                  <p className="font-semibold">{partner.processingTime}</p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Credit Range</p>
                <p className="font-semibold">
                  £{partner.minCreditAmount.toLocaleString()} - £
                  {partner.maxCreditAmount.toLocaleString()}
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <p className="text-xs font-medium">Industries Served</p>
                <div className="flex flex-wrap gap-1">
                  {partner.industries.slice(0, 3).map((industry) => (
                    <Badge key={industry} variant="secondary" className="text-xs">
                      {industry}
                    </Badge>
                  ))}
                  {partner.industries.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{partner.industries.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="flex-1">
                      View Details
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>{partner.name}</DialogTitle>
                      <DialogDescription>{partner.description}</DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="max-h-[500px] pr-4">
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Interest Rate</p>
                            <p className="text-2xl font-bold text-primary">
                              {partner.interestRate}%
                            </p>
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Processing Time</p>
                            <p className="text-2xl font-bold">{partner.processingTime}</p>
                          </div>
                        </div>

                        <Separator />

                        <div className="space-y-3">
                          <h4 className="font-semibold">Requirements</h4>
                          <ul className="space-y-2">
                            {partner.requirements.map((req, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                                <span className="text-sm">{req}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <Separator />

                        <div className="space-y-3">
                          <h4 className="font-semibold">Contact Information</h4>
                          <div className="space-y-2">
                            <p className="text-sm">
                              <span className="text-muted-foreground">Email:</span>{' '}
                              {partner.contactEmail}
                            </p>
                            <p className="text-sm">
                              <span className="text-muted-foreground">Phone:</span>{' '}
                              {partner.contactPhone}
                            </p>
                            <p className="text-sm">
                              <span className="text-muted-foreground">Website:</span>{' '}
                              <a
                                href={partner.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                              >
                                {partner.website}
                              </a>
                            </p>
                          </div>
                        </div>
                      </div>
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
                <Button className="flex-1">
                  Apply Now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// Application Status Tracking Component
function ApplicationStatusTracking() {
  const { applications } = useFinanceStore()

  const displayApplications = applications

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: 'Draft', variant: 'secondary' as const },
      pending: { label: 'Pending', variant: 'default' as const },
      under_review: { label: 'Under Review', variant: 'default' as const },
      approved: { label: 'Approved', variant: 'default' as const, className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' },
      rejected: { label: 'Rejected', variant: 'destructive' as const },
      active: { label: 'Active', variant: 'default' as const, className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100' },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    return <Badge variant={config.variant} className={'className' in config ? config.className : ''}>{config.label}</Badge>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Application Status
        </CardTitle>
        <CardDescription>Track your credit applications</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayApplications.map((app) => (
            <div
              key={app.id}
              className="p-4 border rounded-lg hover:border-primary transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold">{app.companyName}</h4>
                  <p className="text-sm text-muted-foreground">
                    Applied {format(new Date(app.appliedAt), 'MMM dd, yyyy')}
                  </p>
                </div>
                {getStatusBadge(app.status)}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Requested Limit</p>
                  <p className="font-semibold">
                    £{app.requestedCreditLimit.toLocaleString()}
                  </p>
                </div>
                {app.approvedLimit && (
                  <div>
                    <p className="text-muted-foreground">Approved Limit</p>
                    <p className="font-semibold text-green-600">
                      £{app.approvedLimit.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {app.status === 'under_review' && (
                <div className="mt-4">
                  <Progress value={60} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-2">
                    Your application is being reviewed by our finance team
                  </p>
                </div>
              )}

              <div className="mt-4 flex gap-2">
                <Button variant="outline" size="sm">
                  View Details
                </Button>
                {app.status === 'draft' && (
                  <Button size="sm">
                    Complete Application
                  </Button>
                )}
              </div>
            </div>
          ))}

          {displayApplications.length === 0 && (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No applications yet</p>
              <Button className="mt-4">Start New Application</Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Payment Schedule Builder Component
function PaymentScheduleBuilder() {
  const [orderAmount, setOrderAmount] = React.useState(50000)
  const [milestones, setMilestones] = React.useState([
    { id: '1', description: 'Order Confirmation', percentage: 30, dueDate: new Date() },
    { id: '2', description: 'Production Completion', percentage: 40, dueDate: addDays(new Date(), 30) },
    { id: '3', description: 'Delivery', percentage: 30, dueDate: addDays(new Date(), 60) },
  ])

  const addMilestone = () => {
    const newMilestone = {
      id: `${milestones.length + 1}`,
      description: 'New Milestone',
      percentage: 0,
      dueDate: addDays(new Date(), (milestones.length + 1) * 30),
    }
    setMilestones([...milestones, newMilestone])
  }

  const totalPercentage = milestones.reduce((sum, m) => sum + m.percentage, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Payment Schedule Builder
        </CardTitle>
        <CardDescription>
          Create custom milestone-based payment schedules
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="orderAmount">Total Order Amount</Label>
          <Input
            id="orderAmount"
            type="number"
            value={orderAmount}
            onChange={(e) => setOrderAmount(parseInt(e.target.value) || 0)}
            placeholder="50000"
          />
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Payment Milestones</h4>
            <Button variant="outline" size="sm" onClick={addMilestone}>
              <Plus className="h-4 w-4 mr-2" />
              Add Milestone
            </Button>
          </div>

          <div className="space-y-3">
            {milestones.map((milestone, index) => (
              <div
                key={milestone.id}
                className="p-4 border rounded-lg space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <Input
                      placeholder="Milestone description"
                      value={milestone.description}
                      onChange={(e) => {
                        const newMilestones = [...milestones]
                        newMilestones[index].description = e.target.value
                        setMilestones(newMilestones)
                      }}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMilestones(milestones.filter((_, i) => i !== index))}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Percentage</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={milestone.percentage}
                      onChange={(e) => {
                        const newMilestones = [...milestones]
                        newMilestones[index].percentage = parseInt(e.target.value) || 0
                        setMilestones(newMilestones)
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Amount</Label>
                    <Input
                      readOnly
                      value={`£${((orderAmount * milestone.percentage) / 100).toLocaleString()}`}
                      className="bg-muted"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Total Allocation:</span>
              <span
                className={`font-bold text-lg ${
                  totalPercentage === 100
                    ? 'text-green-600'
                    : totalPercentage > 100
                    ? 'text-red-600'
                    : 'text-orange-600'
                }`}
              >
                {totalPercentage}%
              </span>
            </div>
            {totalPercentage !== 100 && (
              <p className="text-xs text-muted-foreground mt-2">
                {totalPercentage < 100
                  ? `Add ${100 - totalPercentage}% more to reach 100%`
                  : `Reduce by ${totalPercentage - 100}% to reach 100%`}
              </p>
            )}
          </div>
        </div>

        <Button className="w-full" disabled={totalPercentage !== 100}>
          {totalPercentage === 100 ? 'Create Payment Schedule' : 'Total must equal 100%'}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  )
}

// Main Trade Finance Page
export default function TradeFinancePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Hero Section */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="text-center mb-12"
        >
          <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <HandshakeIcon className="h-8 w-8 text-primary" />
            </div>
          </motion.div>
          <motion.h1 variants={fadeInUp} className="text-4xl md:text-5xl font-bold mb-4">
            Trade Finance Solutions
          </motion.h1>
          <motion.p variants={fadeInUp} className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Flexible financing options to help your business grow. Access trade credit, payment plans,
            and invoice factoring with competitive rates.
          </motion.p>

          {/* Quick Stats */}
          <motion.div variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
            {[
              { label: 'Credit Approved', value: '£125M+', icon: DollarSign },
              { label: 'Active Businesses', value: '2,500+', icon: Users },
              { label: 'Avg. Approval Time', value: '48 hrs', icon: Clock },
              { label: 'Success Rate', value: '94%', icon: TrendingUp },
            ].map((stat, idx) => {
              const Icon = stat.icon
              return (
                <Card key={idx} className="text-center">
                  <CardContent className="pt-6">
                    <Icon className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </CardContent>
                </Card>
              )
            })}
          </motion.div>
        </motion.div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="options" className="space-y-8">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 h-auto">
            <TabsTrigger value="options" className="py-3">
              <CreditCard className="h-4 w-4 mr-2" />
              Options
            </TabsTrigger>
            <TabsTrigger value="apply" className="py-3">
              <FileText className="h-4 w-4 mr-2" />
              Apply
            </TabsTrigger>
            <TabsTrigger value="calculator" className="py-3">
              <Calculator className="h-4 w-4 mr-2" />
              Calculator
            </TabsTrigger>
            <TabsTrigger value="factoring" className="py-3">
              <Receipt className="h-4 w-4 mr-2" />
              Factoring
            </TabsTrigger>
            <TabsTrigger value="partners" className="py-3">
              <Building2 className="h-4 w-4 mr-2" />
              Partners
            </TabsTrigger>
          </TabsList>

          {/* Financing Options Tab */}
          <TabsContent value="options" className="space-y-8">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
            >
              <FinancingOptions />
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
              <CreditLimitTracker />
              <ApplicationStatusTracking />
            </div>
          </TabsContent>

          {/* Apply Tab */}
          <TabsContent value="apply">
            <CreditApplicationForm />
          </TabsContent>

          {/* Calculator Tab */}
          <TabsContent value="calculator" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PaymentPlanCalculator />
              <PaymentScheduleBuilder />
            </div>
          </TabsContent>

          {/* Factoring Tab */}
          <TabsContent value="factoring">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <InvoiceFactoring />
              <Card>
                <CardHeader>
                  <CardTitle>Why Invoice Factoring?</CardTitle>
                  <CardDescription>
                    Benefits of converting receivables to cash
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    {
                      title: 'Immediate Cash Flow',
                      description: 'Get up to 90% of invoice value within 24 hours',
                      icon: BanknoteIcon,
                    },
                    {
                      title: 'No Debt Burden',
                      description: "It's not a loan - you're selling your receivables",
                      icon: Shield,
                    },
                    {
                      title: 'Flexible Solution',
                      description: 'Factor individual invoices or all receivables',
                      icon: Target,
                    },
                    {
                      title: 'Growth Enabler',
                      description: 'Fund operations without waiting for customer payments',
                      icon: TrendingUp,
                    },
                  ].map((benefit, idx) => {
                    const Icon = benefit.icon
                    return (
                      <div key={idx} className="flex gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="p-2 rounded-lg bg-primary/10 h-fit">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold mb-1">{benefit.title}</h4>
                          <p className="text-sm text-muted-foreground">{benefit.description}</p>
                        </div>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Partners Tab */}
          <TabsContent value="partners">
            <FinancePartnersDirectory />
          </TabsContent>
        </Tabs>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12"
        >
          <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-primary/20">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold mb-2">Need Help Choosing?</h3>
              <p className="text-muted-foreground mb-6">
                Our finance specialists can help you find the right solution for your business
              </p>
              <Button size="lg">
                <Briefcase className="mr-2 h-5 w-5" />
                Schedule Consultation
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

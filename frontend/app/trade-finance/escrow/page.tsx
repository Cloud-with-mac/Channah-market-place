'use client'

import { useState } from 'react'
import { useEscrowStore } from '@/store/escrow-store'
import type { EscrowTransaction, Milestone } from '@/store/escrow-store'

export default function EscrowPaymentPage() {
  const store = useEscrowStore()
  const [tab, setTab] = useState<'dashboard' | 'create' | 'details' | 'calculator'>('dashboard')
  const [statusFilter, setStatusFilter] = useState('all')

  // Create form state
  const [formBuyer, setFormBuyer] = useState('')
  const [formSeller, setFormSeller] = useState('')
  const [formAmount, setFormAmount] = useState('')
  const [formCurrency, setFormCurrency] = useState('USD')
  const [formType, setFormType] = useState<'full' | 'milestone'>('full')
  const [formConditions, setFormConditions] = useState('')
  const [formDeadline, setFormDeadline] = useState('')
  const [formHoldPeriod, setFormHoldPeriod] = useState('14')
  const [formQualityCheck, setFormQualityCheck] = useState(false)
  const [milestones, setMilestones] = useState<{ name: string; amount: string; dueDate: string }[]>([])

  // Calculator state
  const [calcAmount, setCalcAmount] = useState('')
  const [calcType, setCalcType] = useState<'full' | 'milestone'>('full')
  const [calcMilestoneCount, setCalcMilestoneCount] = useState('3')

  // Selected transaction
  const [selectedTx, setSelectedTx] = useState<EscrowTransaction | null>(null)

  const stats = store.getTransactionStats()
  const breakdown = store.calculateEscrowBreakdown()
  const openDisputes = store.getOpenDisputes()
  const upcomingMilestones = store.getUpcomingMilestones()

  const filteredTx = statusFilter === 'all' ? store.transactions : store.transactions.filter(t => t.status === statusFilter)

  const statusBadge = (status: string) => {
    const m: Record<string, string> = { pending: 'bg-yellow-100 text-yellow-800', active: 'bg-blue-100 text-blue-800', completed: 'bg-green-100 text-green-800', cancelled: 'bg-gray-100 text-gray-600', disputed: 'bg-red-100 text-red-800' }
    return m[status] || 'bg-gray-100 text-gray-800'
  }

  const addMilestone = () => setMilestones(prev => [...prev, { name: '', amount: '', dueDate: '' }])
  const updateMilestone = (i: number, field: string, value: string) => setMilestones(prev => prev.map((m, idx) => idx === i ? { ...m, [field]: value } : m))
  const removeMilestone = (i: number) => setMilestones(prev => prev.filter((_, idx) => idx !== i))

  const submitEscrow = () => {
    if (!formBuyer || !formSeller || !formAmount || !formDeadline) { alert('Please fill all required fields'); return }
    const ms: Milestone[] = formType === 'milestone' ? milestones.map((m, i) => ({
      id: `ms-${Date.now()}-${i}`, name: m.name, description: m.name, amount: parseFloat(m.amount), percentage: (parseFloat(m.amount) / parseFloat(formAmount)) * 100,
      dueDate: m.dueDate, status: 'pending' as const,
    })) : [{ id: `ms-${Date.now()}`, name: 'Full Payment', description: 'Full payment release', amount: parseFloat(formAmount), percentage: 100, dueDate: formDeadline, status: 'pending' as const }]

    const tx: EscrowTransaction = {
      id: `ESC-${Date.now()}`, orderId: `ORD-${Date.now()}`, buyerId: 'buyer-1', sellerId: 'seller-1', vendorId: undefined,
      buyerName: formBuyer, sellerName: formSeller, totalAmount: parseFloat(formAmount), currency: formCurrency,
      status: 'pending', type: formType, milestones: ms, currentMilestoneIndex: 0, releaseConditions: formConditions,
      deliveryDeadline: formDeadline, qualityCheckRequired: formQualityCheck, holdingPeriod: parseInt(formHoldPeriod),
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), disputes: [], transactionHistory: [
        { id: `rec-${Date.now()}`, type: 'created', description: 'Escrow transaction created', timestamp: new Date().toISOString(), amount: parseFloat(formAmount) }
      ],
    }
    store.addTransaction(tx)
    alert(`Escrow created: ${tx.id}`)
    setFormBuyer(''); setFormSeller(''); setFormAmount(''); setFormConditions(''); setFormDeadline(''); setMilestones([])
    setTab('dashboard')
  }

  const escrowFee = (amount: number, type: string) => {
    const rate = type === 'milestone' ? 0.025 : 0.02
    return { rate: rate * 100, fee: amount * rate, total: amount + amount * rate }
  }

  const calcResult = calcAmount ? escrowFee(parseFloat(calcAmount), calcType) : null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Escrow Payment Service</h1>
          <p className="mt-2 text-gray-600">Secure B2B transactions with escrow protection. Create, manage, and track escrow payments with milestone support.</p>
        </div>

        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {[{ k: 'dashboard', l: 'Dashboard' }, { k: 'create', l: 'Create Escrow' }, { k: 'details', l: 'Transaction Details' }, { k: 'calculator', l: 'Fee Calculator' }].map(t => (
              <button key={t.k} onClick={() => setTab(t.k as any)} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${tab === t.k ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{t.l}</button>
            ))}
          </nav>
        </div>

        {tab === 'dashboard' && (<div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl border p-6 shadow-sm"><p className="text-sm text-gray-500">Total Transactions</p><p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p></div>
            <div className="bg-white rounded-xl border p-6 shadow-sm"><p className="text-sm text-gray-500">Active Escrows</p><p className="text-3xl font-bold text-blue-600 mt-1">{stats.active}</p></div>
            <div className="bg-white rounded-xl border p-6 shadow-sm"><p className="text-sm text-gray-500">Total Amount Held</p><p className="text-3xl font-bold text-green-600 mt-1">${stats.totalAmount.toLocaleString()}</p></div>
            <div className="bg-white rounded-xl border p-6 shadow-sm"><p className="text-sm text-gray-500">Open Disputes</p><p className="text-3xl font-bold text-red-600 mt-1">{stats.disputed}</p></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: 'Pending', value: `$${breakdown.pending.toLocaleString()}`, color: 'bg-yellow-50 border-yellow-200 text-yellow-800' },
              { label: 'Active', value: `$${breakdown.active.toLocaleString()}`, color: 'bg-blue-50 border-blue-200 text-blue-800' },
              { label: 'Released', value: `$${breakdown.released.toLocaleString()}`, color: 'bg-green-50 border-green-200 text-green-800' },
              { label: 'Disputed', value: `$${breakdown.disputed.toLocaleString()}`, color: 'bg-red-50 border-red-200 text-red-800' },
            ].map((b, i) => (<div key={i} className={`rounded-lg border p-4 ${b.color}`}><p className="text-sm font-medium">{b.label}</p><p className="text-xl font-bold mt-1">{b.value}</p></div>))}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium text-gray-700">Filter:</span>
            {['all', 'pending', 'active', 'completed', 'disputed', 'cancelled'].map(f => (
              <button key={f} onClick={() => setStatusFilter(f)} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${statusFilter === f ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}`}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Escrow Transactions ({filteredTx.length})</h3>
              <button onClick={() => setTab('create')} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">New Escrow</button>
            </div>
            {filteredTx.length === 0 ? (<div className="px-6 py-8 text-center text-gray-500">No transactions found. Create your first escrow.</div>) : (
              <div className="divide-y divide-gray-100">{filteredTx.map(tx => (
                <div key={tx.id} className="px-6 py-4 cursor-pointer hover:bg-gray-50" onClick={() => { setSelectedTx(tx); setTab('details') }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-3"><p className="text-sm font-mono font-semibold text-gray-900">{tx.id}</p><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge(tx.status)}`}>{tx.status}</span><span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">{tx.type}</span></div>
                      <p className="text-sm text-gray-500 mt-1">{tx.buyerName} &rarr; {tx.sellerName}</p>
                    </div>
                    <div className="text-right"><p className="text-lg font-bold text-gray-900">{tx.currency} {tx.totalAmount.toLocaleString()}</p><p className="text-xs text-gray-400">{new Date(tx.createdAt).toLocaleDateString()}</p></div>
                  </div>
                  {tx.type === 'milestone' && (<div className="mt-3 flex gap-1">{tx.milestones.map((m, i) => (<div key={i} className={`h-2 flex-1 rounded-full ${m.status === 'released' || m.status === 'completed' ? 'bg-green-500' : m.status === 'disputed' ? 'bg-red-500' : 'bg-gray-200'}`}></div>))}</div>)}
                </div>
              ))}</div>
            )}
          </div>
        </div>)}

        {tab === 'create' && (<div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Create Escrow Transaction</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Buyer Name *</label><input type="text" value={formBuyer} onChange={e => setFormBuyer(e.target.value)} className="w-full px-4 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Seller Name *</label><input type="text" value={formSeller} onChange={e => setFormSeller(e.target.value)} className="w-full px-4 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Total Amount *</label><input type="number" value={formAmount} onChange={e => setFormAmount(e.target.value)} className="w-full px-4 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Currency</label><select value={formCurrency} onChange={e => setFormCurrency(e.target.value)} className="w-full px-4 py-2 border rounded-lg"><option value="USD">USD</option><option value="EUR">EUR</option><option value="GBP">GBP</option><option value="NGN">NGN</option><option value="ZAR">ZAR</option></select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Escrow Type</label><select value={formType} onChange={e => setFormType(e.target.value as any)} className="w-full px-4 py-2 border rounded-lg"><option value="full">Full Payment</option><option value="milestone">Milestone-Based</option></select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Delivery Deadline *</label><input type="date" value={formDeadline} onChange={e => setFormDeadline(e.target.value)} className="w-full px-4 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Holding Period (days)</label><input type="number" value={formHoldPeriod} onChange={e => setFormHoldPeriod(e.target.value)} className="w-full px-4 py-2 border rounded-lg" /></div>
              <div className="flex items-center gap-3 pt-6"><input type="checkbox" checked={formQualityCheck} onChange={e => setFormQualityCheck(e.target.checked)} className="rounded border-gray-300 text-blue-600" /><label className="text-sm text-gray-700">Require quality check before release</label></div>
              <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Release Conditions</label><textarea value={formConditions} onChange={e => setFormConditions(e.target.value)} rows={3} className="w-full px-4 py-2 border rounded-lg" placeholder="Describe conditions for releasing funds..." /></div>
            </div>

            {formType === 'milestone' && (<div className="mt-6">
              <div className="flex items-center justify-between mb-3"><h3 className="font-semibold text-gray-900">Milestones</h3><button onClick={addMilestone} className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200">Add Milestone</button></div>
              {milestones.map((m, i) => (
                <div key={i} className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3 p-3 bg-gray-50 rounded-lg">
                  <input type="text" value={m.name} onChange={e => updateMilestone(i, 'name', e.target.value)} placeholder="Milestone name" className="px-3 py-2 border rounded-lg text-sm" />
                  <input type="number" value={m.amount} onChange={e => updateMilestone(i, 'amount', e.target.value)} placeholder="Amount" className="px-3 py-2 border rounded-lg text-sm" />
                  <input type="date" value={m.dueDate} onChange={e => updateMilestone(i, 'dueDate', e.target.value)} className="px-3 py-2 border rounded-lg text-sm" />
                  <button onClick={() => removeMilestone(i)} className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm">Remove</button>
                </div>
              ))}
            </div>)}
            <button onClick={submitEscrow} className="mt-6 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">Create Escrow</button>
          </div>
        </div>)}

        {tab === 'details' && (<div className="space-y-6">
          {!selectedTx ? (<div className="bg-white rounded-xl border p-8 text-center text-gray-500">Select a transaction from the dashboard to view details.</div>) : (<>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div><h2 className="text-lg font-semibold text-gray-900">{selectedTx.id}</h2><p className="text-sm text-gray-500">{selectedTx.buyerName} to {selectedTx.sellerName}</p></div>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusBadge(selectedTx.status)}`}>{selectedTx.status}</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500">Amount</p><p className="text-lg font-bold">{selectedTx.currency} {selectedTx.totalAmount.toLocaleString()}</p></div>
                <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500">Type</p><p className="text-lg font-bold capitalize">{selectedTx.type}</p></div>
                <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500">Holding Period</p><p className="text-lg font-bold">{selectedTx.holdingPeriod} days</p></div>
                <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500">Deadline</p><p className="text-lg font-bold">{selectedTx.deliveryDeadline}</p></div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Milestones</h3>
              <div className="space-y-4">
                {selectedTx.milestones.map((m, i) => (
                  <div key={m.id} className="flex items-center gap-4 p-4 rounded-lg border border-gray-200">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${m.status === 'released' || m.status === 'completed' ? 'bg-green-100 text-green-600' : m.status === 'disputed' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-400'}`}><span className="font-bold">{i + 1}</span></div>
                    <div className="flex-1"><p className="font-medium text-gray-900">{m.name}</p><p className="text-sm text-gray-500">{m.percentage.toFixed(0)}% - Due: {m.dueDate}</p></div>
                    <div className="text-right"><p className="font-semibold">{selectedTx.currency} {m.amount.toLocaleString()}</p><span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(m.status)}`}>{m.status}</span></div>
                    {m.status === 'pending' && selectedTx.status === 'active' && (
                      <div className="flex gap-2">
                        <button onClick={() => store.releaseMilestonePayment(selectedTx.id, m.id, 'Approved')} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700">Release</button>
                        <button className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700">Dispute</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Transaction History</h3>
              <div className="space-y-3">{selectedTx.transactionHistory.map(rec => (
                <div key={rec.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 mt-2 rounded-full bg-blue-500 flex-shrink-0"></div>
                  <div><p className="text-sm font-medium text-gray-900">{rec.description}</p><p className="text-xs text-gray-400">{new Date(rec.timestamp).toLocaleString()}</p>{rec.amount && <p className="text-xs text-gray-500">Amount: {selectedTx.currency} {rec.amount.toLocaleString()}</p>}</div>
                </div>
              ))}</div>
            </div>

            <div className="flex gap-3">
              {selectedTx.status === 'pending' && <button onClick={() => { store.updateTransaction(selectedTx.id, { status: 'active', startedAt: new Date().toISOString() }); setSelectedTx({ ...selectedTx, status: 'active' }) }} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">Fund Escrow</button>}
              {selectedTx.status === 'active' && selectedTx.type === 'full' && <button onClick={() => store.releaseFullPayment(selectedTx.id, 'Goods received satisfactorily')} className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700">Release Full Payment</button>}
              {(selectedTx.status === 'pending' || selectedTx.status === 'active') && <button onClick={() => store.cancelTransaction(selectedTx.id, 'Cancelled by user')} className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700">Cancel</button>}
              <button onClick={() => setTab('dashboard')} className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50">Back to Dashboard</button>
            </div>
          </>)}
        </div>)}

        {tab === 'calculator' && (<div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 max-w-lg mx-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Escrow Fee Calculator</h2>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Transaction Amount (USD)</label><input type="number" value={calcAmount} onChange={e => setCalcAmount(e.target.value)} className="w-full px-4 py-3 border rounded-lg text-lg" placeholder="Enter amount" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Escrow Type</label><select value={calcType} onChange={e => setCalcType(e.target.value as any)} className="w-full px-4 py-2 border rounded-lg"><option value="full">Full Payment (2.0% fee)</option><option value="milestone">Milestone-Based (2.5% fee)</option></select></div>
              {calcType === 'milestone' && (<div><label className="block text-sm font-medium text-gray-700 mb-1">Number of Milestones</label><input type="number" value={calcMilestoneCount} onChange={e => setCalcMilestoneCount(e.target.value)} className="w-full px-4 py-2 border rounded-lg" min="2" max="10" /></div>)}
            </div>
            {calcResult && (<div className="mt-6 space-y-3">
              <div className="flex justify-between py-3 border-b"><span className="text-gray-600">Transaction Amount</span><span className="font-semibold">${parseFloat(calcAmount).toLocaleString()}</span></div>
              <div className="flex justify-between py-3 border-b"><span className="text-gray-600">Escrow Fee ({calcResult.rate}%)</span><span className="font-semibold text-orange-600">${calcResult.fee.toFixed(2)}</span></div>
              <div className="flex justify-between py-3 bg-blue-50 rounded-lg px-4"><span className="font-semibold text-gray-900">Total Cost</span><span className="text-lg font-bold text-blue-700">${calcResult.total.toFixed(2)}</span></div>
              {calcType === 'milestone' && (<div className="p-3 bg-gray-50 rounded-lg"><p className="text-sm text-gray-600">Per Milestone: ${(parseFloat(calcAmount) / parseInt(calcMilestoneCount)).toFixed(2)}</p></div>)}
            </div>)}
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 max-w-lg mx-auto">
            <h3 className="font-semibold text-gray-900 mb-3">Fee Schedule</h3>
            <div className="space-y-2">
              {[
                { type: 'Full Payment Escrow', fee: '2.0%', min: '$10', max: '$5,000' },
                { type: 'Milestone Escrow', fee: '2.5%', min: '$15', max: '$7,500' },
                { type: 'Express Release', fee: '+0.5%', min: '-', max: '-' },
                { type: 'Dispute Resolution', fee: '1.0%', min: '$50', max: '$2,500' },
              ].map((row, i) => (
                <div key={i} className="grid grid-cols-4 gap-4 py-2 px-3 rounded-lg hover:bg-gray-50 text-sm">
                  <span className="font-medium text-gray-900">{row.type}</span>
                  <span className="text-blue-600 font-semibold">{row.fee}</span>
                  <span className="text-gray-500">Min: {row.min}</span>
                  <span className="text-gray-500">Max: {row.max}</span>
                </div>
              ))}
            </div>
          </div>
        </div>)}
      </div>
    </div>
  )
}

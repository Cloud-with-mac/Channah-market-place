'use client'

import { useState } from 'react'
import { useLCStore } from '@/store/lc-store'
import type { LetterOfCredit } from '@/store/lc-store'

const requiredDocTypes = [
  { type: 'commercial_invoice', name: 'Commercial Invoice', desc: 'Detailed invoice with goods description and values' },
  { type: 'packing_list', name: 'Packing List', desc: 'Itemized list of goods and packaging details' },
  { type: 'bill_of_lading', name: 'Bill of Lading', desc: 'Shipping document issued by carrier' },
  { type: 'certificate_of_origin', name: 'Certificate of Origin', desc: 'Document certifying country of manufacture' },
  { type: 'insurance', name: 'Insurance Certificate', desc: 'Marine cargo insurance document' },
  { type: 'inspection_report', name: 'Inspection Report', desc: 'Third-party quality inspection report' },
]

export default function LetterOfCreditPage() {
  const store = useLCStore()
  const [tab, setTab] = useState<'dashboard' | 'create' | 'details' | 'amendments'>('dashboard')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedLC, setSelectedLC] = useState<LetterOfCredit | null>(null)

  // Create form state
  const [supplierName, setSupplierName] = useState('')
  const [supplierCountry, setSupplierCountry] = useState('')
  const [supplierEmail, setSupplierEmail] = useState('')
  const [buyerName, setBuyerName] = useState('')
  const [buyerCountry, setBuyerCountry] = useState('')
  const [buyerEmail, setBuyerEmail] = useState('')
  const [lcValue, setLcValue] = useState('')
  const [lcCurrency, setLcCurrency] = useState('USD')
  const [expiryDate, setExpiryDate] = useState('')
  const [shipmentDate, setShipmentDate] = useState('')
  const [lastShipDate, setLastShipDate] = useState('')
  const [portLoading, setPortLoading] = useState('')
  const [portDischarge, setPortDischarge] = useState('')
  const [goodsDesc, setGoodsDesc] = useState('')
  const [bankName, setBankName] = useState('')
  const [bankSwift, setBankSwift] = useState('')
  const [bankAccount, setBankAccount] = useState('')
  const [bankAddress, setBankAddress] = useState('')

  // Amendment form
  const [amendLcId, setAmendLcId] = useState('')
  const [amendChanges, setAmendChanges] = useState('')
  const [amendReason, setAmendReason] = useState('')

  const lcStats = store.getStats()
  const filteredLCs = statusFilter === 'all' ? store.lcs : store.lcs.filter(lc => lc.status === statusFilter)
  const pendingAmendments = store.getPendingAmendments()

  const statusBadge = (status: string) => {
    const m: Record<string, string> = { draft: 'bg-gray-100 text-gray-800', submitted: 'bg-yellow-100 text-yellow-800', issued: 'bg-blue-100 text-blue-800', accepted: 'bg-green-100 text-green-800', completed: 'bg-emerald-100 text-emerald-800' }
    return m[status] || 'bg-gray-100 text-gray-800'
  }

  const createLC = () => {
    if (!supplierName || !buyerName || !lcValue || !expiryDate || !goodsDesc) { alert('Please fill all required fields'); return }
    store.createLC({
      referenceNumber: '', status: 'draft',
      supplier: { name: supplierName, country: supplierCountry, contactEmail: supplierEmail },
      buyer: { name: buyerName, country: buyerCountry, contactEmail: buyerEmail },
      issueBank: { bankName, accountHolder: buyerName, accountNumber: bankAccount, swiftCode: bankSwift, bankAddress, countryCode: buyerCountry },
      value: parseFloat(lcValue), currency: lcCurrency, expiryDate, shipmentDate, lastShipmentDate: lastShipDate,
      ports: { loading: portLoading, discharge: portDischarge }, goodsDescription: goodsDesc,
    })
    alert('Letter of Credit created successfully')
    setSupplierName(''); setBuyerName(''); setLcValue(''); setExpiryDate(''); setGoodsDesc('')
    setTab('dashboard')
  }

  const submitAmendment = () => {
    if (!amendLcId || !amendChanges || !amendReason) return
    store.requestAmendment(amendLcId, amendChanges, amendReason)
    setAmendChanges(''); setAmendReason(''); alert('Amendment request submitted')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Letters of Credit</h1>
          <p className="mt-2 text-gray-600">Manage trade finance letters of credit for secure international B2B transactions. Create, track, and manage LC documents.</p>
        </div>

        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {[{ k: 'dashboard', l: 'LC Dashboard' }, { k: 'create', l: 'Create LC' }, { k: 'details', l: 'LC Details' }, { k: 'amendments', l: 'Amendments' }].map(t => (
              <button key={t.k} onClick={() => setTab(t.k as any)} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${tab === t.k ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{t.l}</button>
            ))}
          </nav>
        </div>

        {tab === 'dashboard' && (<div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl border p-6 shadow-sm"><p className="text-sm text-gray-500">Total LCs</p><p className="text-3xl font-bold text-gray-900 mt-1">{lcStats.total}</p></div>
            <div className="bg-white rounded-xl border p-6 shadow-sm"><p className="text-sm text-gray-500">Total Value</p><p className="text-3xl font-bold text-green-600 mt-1">${lcStats.totalValue.toLocaleString()}</p></div>
            <div className="bg-white rounded-xl border p-6 shadow-sm"><p className="text-sm text-gray-500">Active (Issued + Accepted)</p><p className="text-3xl font-bold text-blue-600 mt-1">{lcStats.issued + lcStats.accepted}</p></div>
            <div className="bg-white rounded-xl border p-6 shadow-sm"><p className="text-sm text-gray-500">Pending Amendments</p><p className="text-3xl font-bold text-orange-500 mt-1">{lcStats.pendingAmendments}</p></div>
          </div>

          <div className="grid grid-cols-5 gap-3">
            {[
              { label: 'Draft', count: lcStats.draft, color: 'bg-gray-100 text-gray-700' },
              { label: 'Submitted', count: lcStats.submitted, color: 'bg-yellow-100 text-yellow-700' },
              { label: 'Issued', count: lcStats.issued, color: 'bg-blue-100 text-blue-700' },
              { label: 'Accepted', count: lcStats.accepted, color: 'bg-green-100 text-green-700' },
              { label: 'Completed', count: lcStats.completed, color: 'bg-emerald-100 text-emerald-700' },
            ].map((s, i) => (<div key={i} className={`rounded-lg p-3 text-center ${s.color}`}><p className="text-2xl font-bold">{s.count}</p><p className="text-xs font-medium">{s.label}</p></div>))}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium text-gray-700">Filter:</span>
            {['all', 'draft', 'submitted', 'issued', 'accepted', 'completed'].map(f => (
              <button key={f} onClick={() => setStatusFilter(f)} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${statusFilter === f ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}`}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Letters of Credit ({filteredLCs.length})</h3>
              <button onClick={() => setTab('create')} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">New LC</button>
            </div>
            {filteredLCs.length === 0 ? (<div className="px-6 py-8 text-center text-gray-500">No letters of credit found. Create your first LC.</div>) : (
              <div className="divide-y divide-gray-100">{filteredLCs.map(lc => (
                <div key={lc.id} className="px-6 py-4 cursor-pointer hover:bg-gray-50" onClick={() => { setSelectedLC(lc); store.selectLC(lc.id); setTab('details') }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-3"><p className="text-sm font-mono font-semibold text-gray-900">{lc.referenceNumber}</p><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge(lc.status)}`}>{lc.status}</span></div>
                      <p className="text-sm text-gray-500 mt-1">{lc.supplier.name} ({lc.supplier.country}) &rarr; {lc.buyer.name} ({lc.buyer.country})</p>
                      <p className="text-xs text-gray-400 mt-1">{lc.goodsDescription.substring(0, 80)}...</p>
                    </div>
                    <div className="text-right"><p className="text-lg font-bold text-gray-900">{lc.currency} {lc.value.toLocaleString()}</p><p className="text-xs text-gray-400">Expires: {lc.expiryDate}</p></div>
                  </div>
                </div>
              ))}</div>
            )}
          </div>
        </div>)}

        {tab === 'create' && (<div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Create Letter of Credit</h2>

            <h3 className="font-medium text-gray-900 mb-3">Supplier (Beneficiary)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label><input type="text" value={supplierName} onChange={e => setSupplierName(e.target.value)} className="w-full px-4 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Country</label><input type="text" value={supplierCountry} onChange={e => setSupplierCountry(e.target.value)} className="w-full px-4 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" value={supplierEmail} onChange={e => setSupplierEmail(e.target.value)} className="w-full px-4 py-2 border rounded-lg" /></div>
            </div>

            <h3 className="font-medium text-gray-900 mb-3">Buyer (Applicant)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label><input type="text" value={buyerName} onChange={e => setBuyerName(e.target.value)} className="w-full px-4 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Country</label><input type="text" value={buyerCountry} onChange={e => setBuyerCountry(e.target.value)} className="w-full px-4 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" value={buyerEmail} onChange={e => setBuyerEmail(e.target.value)} className="w-full px-4 py-2 border rounded-lg" /></div>
            </div>

            <h3 className="font-medium text-gray-900 mb-3">LC Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Value *</label><input type="number" value={lcValue} onChange={e => setLcValue(e.target.value)} className="w-full px-4 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Currency</label><select value={lcCurrency} onChange={e => setLcCurrency(e.target.value)} className="w-full px-4 py-2 border rounded-lg"><option value="USD">USD</option><option value="EUR">EUR</option><option value="GBP">GBP</option></select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date *</label><input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} className="w-full px-4 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Shipment Date</label><input type="date" value={shipmentDate} onChange={e => setShipmentDate(e.target.value)} className="w-full px-4 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Last Shipment Date</label><input type="date" value={lastShipDate} onChange={e => setLastShipDate(e.target.value)} className="w-full px-4 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Port of Loading</label><input type="text" value={portLoading} onChange={e => setPortLoading(e.target.value)} className="w-full px-4 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Port of Discharge</label><input type="text" value={portDischarge} onChange={e => setPortDischarge(e.target.value)} className="w-full px-4 py-2 border rounded-lg" /></div>
            </div>

            <div className="mb-6"><label className="block text-sm font-medium text-gray-700 mb-1">Goods Description *</label><textarea value={goodsDesc} onChange={e => setGoodsDesc(e.target.value)} rows={4} className="w-full px-4 py-2 border rounded-lg" placeholder="Detailed description of goods..." /></div>

            <h3 className="font-medium text-gray-900 mb-3">Issuing Bank</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label><input type="text" value={bankName} onChange={e => setBankName(e.target.value)} className="w-full px-4 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">SWIFT Code</label><input type="text" value={bankSwift} onChange={e => setBankSwift(e.target.value)} className="w-full px-4 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label><input type="text" value={bankAccount} onChange={e => setBankAccount(e.target.value)} className="w-full px-4 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Bank Address</label><input type="text" value={bankAddress} onChange={e => setBankAddress(e.target.value)} className="w-full px-4 py-2 border rounded-lg" /></div>
            </div>

            <button onClick={createLC} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">Create Letter of Credit</button>
          </div>
        </div>)}

        {tab === 'details' && (<div className="space-y-6">
          {!selectedLC ? (<div className="bg-white rounded-xl border p-8 text-center text-gray-500">Select an LC from the dashboard to view details.</div>) : (<>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div><h2 className="text-lg font-semibold text-gray-900">{selectedLC.referenceNumber}</h2><p className="text-sm text-gray-500">Created: {new Date(selectedLC.createdAt).toLocaleDateString()}</p></div>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusBadge(selectedLC.status)}`}>{selectedLC.status}</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500">Value</p><p className="text-lg font-bold">{selectedLC.currency} {selectedLC.value.toLocaleString()}</p></div>
                <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500">Expiry</p><p className="text-lg font-bold">{selectedLC.expiryDate}</p></div>
                <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500">Loading Port</p><p className="text-lg font-bold">{selectedLC.ports.loading || 'N/A'}</p></div>
                <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500">Discharge Port</p><p className="text-lg font-bold">{selectedLC.ports.discharge || 'N/A'}</p></div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border p-6 shadow-sm"><h3 className="font-semibold text-gray-900 mb-3">Supplier (Beneficiary)</h3><p className="text-sm font-medium">{selectedLC.supplier.name}</p><p className="text-sm text-gray-500">{selectedLC.supplier.country}</p><p className="text-sm text-gray-500">{selectedLC.supplier.contactEmail}</p></div>
              <div className="bg-white rounded-xl border p-6 shadow-sm"><h3 className="font-semibold text-gray-900 mb-3">Buyer (Applicant)</h3><p className="text-sm font-medium">{selectedLC.buyer.name}</p><p className="text-sm text-gray-500">{selectedLC.buyer.country}</p><p className="text-sm text-gray-500">{selectedLC.buyer.contactEmail}</p></div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Document Checklist</h3>
              <div className="space-y-3">{requiredDocTypes.map(doc => {
                const uploaded = selectedLC.documents.find(d => d.type === doc.type)
                return (<div key={doc.type} className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${uploaded ? 'bg-green-100' : 'bg-gray-100'}`}><span className={`text-sm ${uploaded ? 'text-green-600' : 'text-gray-400'}`}>{uploaded ? 'V' : '-'}</span></div>
                    <div><p className="text-sm font-medium text-gray-900">{doc.name}</p><p className="text-xs text-gray-500">{doc.desc}</p></div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${uploaded ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{uploaded ? 'Uploaded' : 'Pending'}</span>
                </div>)
              })}</div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">LC Timeline</h3>
              <div className="space-y-4">
                {[
                  { label: 'Created', date: selectedLC.createdAt, done: true },
                  { label: 'Submitted', date: selectedLC.submittedAt, done: !!selectedLC.submittedAt },
                  { label: 'Issued', date: selectedLC.issuedAt, done: !!selectedLC.issuedAt },
                  { label: 'Accepted', date: selectedLC.acceptedAt, done: !!selectedLC.acceptedAt },
                  { label: 'Completed', date: selectedLC.completedAt, done: !!selectedLC.completedAt },
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${step.done ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'}`}><span className="text-sm font-bold">{i + 1}</span></div>
                    <div className="flex-1"><p className={`text-sm font-medium ${step.done ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</p>{step.date && <p className="text-xs text-gray-500">{new Date(step.date).toLocaleString()}</p>}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              {selectedLC.status === 'draft' && <button onClick={() => { store.submitLC(selectedLC.id); setSelectedLC({ ...selectedLC, status: 'submitted' }) }} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">Submit LC</button>}
              {selectedLC.status === 'issued' && <button onClick={() => { store.acceptLC(selectedLC.id); setSelectedLC({ ...selectedLC, status: 'accepted' }) }} className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700">Accept LC</button>}
              {selectedLC.status === 'accepted' && <button onClick={() => { store.completeLC(selectedLC.id); setSelectedLC({ ...selectedLC, status: 'completed' }) }} className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700">Complete LC</button>}
              <button onClick={() => setTab('dashboard')} className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50">Back</button>
            </div>
          </>)}
        </div>)}

        {tab === 'amendments' && (<div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Request Amendment</h2>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Select LC</label><select value={amendLcId} onChange={e => setAmendLcId(e.target.value)} className="w-full px-4 py-2 border rounded-lg"><option value="">Select an LC</option>{store.lcs.map(lc => (<option key={lc.id} value={lc.id}>{lc.referenceNumber} - {lc.supplier.name}</option>))}</select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Proposed Changes</label><textarea value={amendChanges} onChange={e => setAmendChanges(e.target.value)} rows={3} className="w-full px-4 py-2 border rounded-lg" placeholder="Describe the changes..." /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Reason for Amendment</label><textarea value={amendReason} onChange={e => setAmendReason(e.target.value)} rows={2} className="w-full px-4 py-2 border rounded-lg" placeholder="Why is this amendment needed?" /></div>
            </div>
            <button onClick={submitAmendment} className="mt-4 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">Submit Amendment Request</button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200"><h3 className="font-semibold text-gray-900">Pending Amendments ({pendingAmendments.length})</h3></div>
            {pendingAmendments.length === 0 ? (<div className="px-6 py-8 text-center text-gray-500">No pending amendments.</div>) : (
              <div className="divide-y divide-gray-100">{pendingAmendments.map(amd => (
                <div key={amd.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div><p className="text-sm font-medium text-gray-900">Amendment #{amd.amendmentNumber}</p><p className="text-xs text-gray-500">{amd.reason}</p><p className="text-xs text-gray-400 mt-1">{amd.changes}</p></div>
                    <div className="flex gap-2">
                      <button onClick={() => store.approveAmendment(amd.lcId, amd.id)} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700">Approve</button>
                      <button onClick={() => store.rejectAmendment(amd.lcId, amd.id)} className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700">Reject</button>
                    </div>
                  </div>
                </div>
              ))}</div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200"><h3 className="font-semibold text-gray-900">All Amendments History</h3></div>
            {store.lcs.flatMap(lc => lc.amendments).length === 0 ? (<div className="px-6 py-8 text-center text-gray-500">No amendments recorded.</div>) : (
              <div className="divide-y divide-gray-100">{store.lcs.flatMap(lc => lc.amendments.map(a => ({ ...a, lcRef: lc.referenceNumber }))).map(amd => (
                <div key={amd.id} className="px-6 py-3 flex items-center justify-between">
                  <div><p className="text-sm text-gray-900">{amd.lcRef} - Amendment #{amd.amendmentNumber}</p><p className="text-xs text-gray-500">{amd.reason}</p></div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${amd.status === 'approved' ? 'bg-green-100 text-green-800' : amd.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>{amd.status}</span>
                </div>
              ))}</div>
            )}
          </div>
        </div>)}
      </div>
    </div>
  )
}

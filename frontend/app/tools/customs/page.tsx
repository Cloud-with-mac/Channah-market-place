'use client'

import { useState, useMemo } from 'react'
import { useCustomsStore } from '@/store/customs-store'

export default function CustomsClearancePage() {
  const store = useCustomsStore()
  const [tab, setTab] = useState<'search' | 'declaration' | 'documents' | 'tracking' | 'calculator'>('search')
  const [hsQuery, setHsQuery] = useState('')
  const [selectedCountry, setSelectedCountry] = useState('')

  // Declaration form state
  const [declOrigin, setDeclOrigin] = useState('')
  const [declDest, setDeclDest] = useState('')
  const [declHsCode, setDeclHsCode] = useState('')
  const [declDesc, setDeclDesc] = useState('')
  const [declQty, setDeclQty] = useState('')
  const [declValue, setDeclValue] = useState('')
  const [declCurrency, setDeclCurrency] = useState('USD')

  // Calculator state
  const [calcCountry, setCalcCountry] = useState('')
  const [calcValue, setCalcValue] = useState('')
  const [calcHsCode, setCalcHsCode] = useState('')

  // Tracking
  const [trackingId, setTrackingId] = useState('')

  const searchResults = useMemo(() => {
    if (!hsQuery || hsQuery.length < 2) return []
    return store.searchHSCodes(hsQuery)
  }, [hsQuery, store])

  const countryReq = useMemo(() => {
    if (!selectedCountry) return null
    return store.getCountryRequirements(selectedCountry)
  }, [selectedCountry, store])

  const countryDocs = useMemo(() => {
    if (!selectedCountry) return []
    return store.getRequiredDocuments(selectedCountry)
  }, [selectedCountry, store])

  const calcResult = useMemo(() => {
    if (!calcCountry || !calcValue) return null
    const country = store.getCountryRequirements(calcCountry)
    if (!country) return null
    const val = parseFloat(calcValue)
    const duty = val * country.importDuty / 100
    const vatAmount = (val + duty) * country.vat / 100
    const total = val + duty + vatAmount
    return { declaredValue: val, dutyRate: country.importDuty, dutyAmount: duty, vatRate: country.vat, vatAmount, totalLanded: total, country: country.name }
  }, [calcCountry, calcValue, store])

  const submitDeclaration = () => {
    if (!declOrigin || !declDest || !declHsCode || !declDesc || !declQty || !declValue) {
      alert('Please fill all required fields')
      return
    }
    const docs = store.getChecklistForCountry(declDest, declHsCode)
    const id = store.createClearanceRecord({
      shipmentId: `SHP-${Date.now()}`,
      originCountry: declOrigin,
      destinationCountry: declDest,
      hsCode: declHsCode,
      itemDescription: declDesc,
      quantity: parseInt(declQty),
      declaredValue: parseFloat(declValue),
      currency: declCurrency,
      documents: docs,
      estimatedClearanceTime: store.estimateClearanceTime(declOrigin, declDest),
      status: 'pending',
    })
    alert(`Declaration created: ${id}`)
    setDeclOrigin(''); setDeclDest(''); setDeclHsCode(''); setDeclDesc(''); setDeclQty(''); setDeclValue('')
  }

  const brokers = useMemo(() => {
    if (!selectedCountry) return []
    return store.findBrokers(selectedCountry)
  }, [selectedCountry, store])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Customs Clearance Helper</h1>
          <p className="mt-2 text-gray-600">Search HS codes, prepare declarations, track clearance status, and estimate duties for international B2B trade.</p>
        </div>

        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {[{ k: 'search', l: 'HS Code Search' }, { k: 'declaration', l: 'Declaration Form' }, { k: 'documents', l: 'Documents Checklist' }, { k: 'tracking', l: 'Declaration Tracking' }, { k: 'calculator', l: 'Duty Calculator' }].map(t => (
              <button key={t.k} onClick={() => setTab(t.k as any)} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${tab === t.k ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{t.l}</button>
            ))}
          </nav>
        </div>

        {tab === 'search' && (<div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">HS Code Search</h2>
            <p className="text-sm text-gray-600 mb-4">Search by code number, product description, or category to find the correct Harmonized System classification.</p>
            <input type="text" value={hsQuery} onChange={e => setHsQuery(e.target.value)} placeholder="Enter HS code, product name, or category..." className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-blue-500" />
          </div>
          {searchResults.length > 0 && (<div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200"><h3 className="font-semibold text-gray-900">Search Results ({searchResults.length})</h3></div>
            <div className="divide-y divide-gray-100">
              {searchResults.map(item => (
                <div key={item.code} className="px-6 py-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3"><span className="text-lg font-mono font-bold text-blue-600">{item.code}</span><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{item.category}</span></div>
                      <p className="mt-1 text-sm font-medium text-gray-900">{item.description}</p>
                      <p className="mt-1 text-sm text-gray-500">Duty Rate: {item.dutyRate}%</p>
                      <div className="mt-2 flex flex-wrap gap-2">{item.commonUses.map((u, i) => (<span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">{u}</span>))}</div>
                      {item.restrictions && item.restrictions.length > 0 && (<div className="mt-2"><p className="text-xs font-medium text-orange-600">Restrictions:</p>{item.restrictions.map((r, i) => (<p key={i} className="text-xs text-orange-500">- {r}</p>))}</div>)}
                    </div>
                    <button onClick={() => { setDeclHsCode(item.code); setTab('declaration') }} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex-shrink-0">Use Code</button>
                  </div>
                </div>
              ))}
            </div>
          </div>)}
          {hsQuery.length >= 2 && searchResults.length === 0 && (<div className="bg-white rounded-xl border border-gray-200 p-8 text-center"><p className="text-gray-500">No HS codes found matching &ldquo;{hsQuery}&rdquo;. Try different keywords.</p></div>)}

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Browse by Category</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[...new Set(store.hsCodesDatabase.map(h => h.category))].map(cat => (
                <button key={cat} onClick={() => setHsQuery(cat)} className="p-3 bg-gray-50 rounded-lg text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 border border-gray-200 text-left">{cat}<span className="block text-xs text-gray-400 mt-1">{store.hsCodesDatabase.filter(h => h.category === cat).length} codes</span></button>
              ))}
            </div>
          </div>
        </div>)}

        {tab === 'declaration' && (<div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Customs Declaration Form</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Origin Country *</label><select value={declOrigin} onChange={e => setDeclOrigin(e.target.value)} className="w-full px-4 py-2 border rounded-lg"><option value="">Select country</option>{store.countriesDatabase.map(c => (<option key={c.code} value={c.code}>{c.name}</option>))}</select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Destination Country *</label><select value={declDest} onChange={e => setDeclDest(e.target.value)} className="w-full px-4 py-2 border rounded-lg"><option value="">Select country</option>{store.countriesDatabase.map(c => (<option key={c.code} value={c.code}>{c.name}</option>))}</select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">HS Code *</label><div className="flex gap-2"><input type="text" value={declHsCode} onChange={e => setDeclHsCode(e.target.value)} className="flex-1 px-4 py-2 border rounded-lg" placeholder="e.g., 8517" /><button onClick={() => setTab('search')} className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">Search</button></div></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label><input type="number" value={declQty} onChange={e => setDeclQty(e.target.value)} className="w-full px-4 py-2 border rounded-lg" /></div>
              <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Item Description *</label><textarea value={declDesc} onChange={e => setDeclDesc(e.target.value)} rows={3} className="w-full px-4 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Declared Value *</label><input type="number" value={declValue} onChange={e => setDeclValue(e.target.value)} className="w-full px-4 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Currency</label><select value={declCurrency} onChange={e => setDeclCurrency(e.target.value)} className="w-full px-4 py-2 border rounded-lg"><option value="USD">USD</option><option value="EUR">EUR</option><option value="GBP">GBP</option></select></div>
            </div>
            <button onClick={submitDeclaration} className="mt-6 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">Submit Declaration</button>
          </div>
        </div>)}

        {tab === 'documents' && (<div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Required Documents Checklist</h2>
            <p className="text-sm text-gray-600 mb-4">Select a destination country to see required import documents.</p>
            <select value={selectedCountry} onChange={e => setSelectedCountry(e.target.value)} className="w-full max-w-sm px-4 py-2 border rounded-lg"><option value="">Select destination country</option>{store.countriesDatabase.map(c => (<option key={c.code} value={c.code}>{c.name}</option>))}</select>
          </div>
          {countryReq && (<>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{countryReq.name} - Import Requirements</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="p-4 bg-blue-50 rounded-lg"><p className="text-sm font-medium text-blue-800">Import Duty</p><p className="text-2xl font-bold text-blue-900">{countryReq.importDuty}%</p></div>
                <div className="p-4 bg-green-50 rounded-lg"><p className="text-sm font-medium text-green-800">VAT</p><p className="text-2xl font-bold text-green-900">{countryReq.vat}%</p></div>
                <div className="p-4 bg-purple-50 rounded-lg"><p className="text-sm font-medium text-purple-800">Lead Time</p><p className="text-2xl font-bold text-purple-900">{countryReq.leadTime} days</p></div>
              </div>
              <p className="mt-4 text-sm text-gray-600">{countryReq.notes}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200"><h3 className="font-semibold text-gray-900">Required Documents ({countryDocs.length})</h3></div>
              <div className="divide-y divide-gray-100">
                {countryDocs.map(doc => (
                  <div key={doc.id} className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${doc.required ? 'bg-red-100' : 'bg-gray-100'}`}><span className={`text-sm font-bold ${doc.required ? 'text-red-600' : 'text-gray-400'}`}>{doc.required ? '!' : '?'}</span></div>
                      <div><p className="text-sm font-medium text-gray-900">{doc.name}</p><p className="text-xs text-gray-500">{doc.description}</p><p className="text-xs text-gray-400 mt-1">Accepted: {doc.fileTypes.join(', ')}</p></div>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${doc.required ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'}`}>{doc.required ? 'Required' : 'Optional'}</span>
                  </div>
                ))}
              </div>
            </div>
            {brokers.length > 0 && (<div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200"><h3 className="font-semibold text-gray-900">Recommended Customs Brokers</h3></div>
              <div className="divide-y divide-gray-100">
                {brokers.map(b => (
                  <div key={b.id} className="px-6 py-4 flex items-center justify-between">
                    <div><p className="text-sm font-medium text-gray-900">{b.name}</p><p className="text-xs text-gray-500">{b.specializations.join(', ')}</p><p className="text-xs text-gray-400">{b.yearsInBusiness} years in business | {b.languages.join(', ')}</p></div>
                    <div className="text-right"><p className="text-sm font-semibold text-yellow-600">{b.rating}/5.0</p><p className="text-xs text-gray-400">{b.reviewCount} reviews</p></div>
                  </div>
                ))}
              </div>
            </div>)}
          </>)}
        </div>)}

        {tab === 'tracking' && (<div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Track Declaration</h2>
            <div className="flex gap-3"><input type="text" value={trackingId} onChange={e => setTrackingId(e.target.value)} placeholder="Enter clearance record ID..." className="flex-1 px-4 py-2 border rounded-lg" /><button className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">Track</button></div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200"><h3 className="font-semibold text-gray-900">Recent Declarations ({store.clearanceRecords.length})</h3></div>
            {store.clearanceRecords.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">No declarations yet. Submit one from the Declaration Form tab.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {store.clearanceRecords.map(rec => (
                  <div key={rec.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div><p className="text-sm font-medium text-gray-900">{rec.id}</p><p className="text-xs text-gray-500">{rec.originCountry} to {rec.destinationCountry} | HS: {rec.hsCode}</p><p className="text-xs text-gray-400">{rec.itemDescription}</p></div>
                      <div className="text-right"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${rec.status === 'cleared' ? 'bg-green-100 text-green-800' : rec.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>{rec.status}</span><p className="text-xs text-gray-400 mt-1">${rec.declaredValue.toLocaleString()} {rec.currency}</p></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>)}

        {tab === 'calculator' && (<div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Duty & Tax Estimate Calculator</h2>
            <p className="text-sm text-gray-600 mb-4">Estimate import duties and taxes for your shipments. Results are estimates based on general rates.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Destination Country</label><select value={calcCountry} onChange={e => setCalcCountry(e.target.value)} className="w-full px-4 py-2 border rounded-lg"><option value="">Select country</option>{store.countriesDatabase.map(c => (<option key={c.code} value={c.code}>{c.name}</option>))}</select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Declared Value (USD)</label><input type="number" value={calcValue} onChange={e => setCalcValue(e.target.value)} className="w-full px-4 py-2 border rounded-lg" placeholder="Enter value" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">HS Code (optional)</label><input type="text" value={calcHsCode} onChange={e => setCalcHsCode(e.target.value)} className="w-full px-4 py-2 border rounded-lg" placeholder="e.g., 8517" /></div>
            </div>
          </div>
          {calcResult && (<div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Estimated Costs for {calcResult.country}</h3>
            <div className="space-y-4">
              <div className="flex justify-between py-3 border-b border-gray-100"><span className="text-gray-600">Declared Value</span><span className="font-semibold text-gray-900">${calcResult.declaredValue.toLocaleString()}</span></div>
              <div className="flex justify-between py-3 border-b border-gray-100"><span className="text-gray-600">Import Duty ({calcResult.dutyRate}%)</span><span className="font-semibold text-orange-600">${calcResult.dutyAmount.toFixed(2)}</span></div>
              <div className="flex justify-between py-3 border-b border-gray-100"><span className="text-gray-600">VAT ({calcResult.vatRate}%)</span><span className="font-semibold text-blue-600">${calcResult.vatAmount.toFixed(2)}</span></div>
              <div className="flex justify-between py-3 bg-blue-50 rounded-lg px-4"><span className="text-lg font-semibold text-gray-900">Total Landed Cost</span><span className="text-lg font-bold text-blue-700">${calcResult.totalLanded.toFixed(2)}</span></div>
            </div>
            <p className="text-xs text-gray-400 mt-4">These are estimates only. Actual duties may vary based on specific HS codes, trade agreements, and current regulations.</p>
          </div>)}
        </div>)}
      </div>
    </div>
  )
}

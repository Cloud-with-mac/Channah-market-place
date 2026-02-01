'use client'

import { useState, useMemo } from 'react'

interface Currency { code: string; name: string; symbol: string; rate: number; change24h: number; region: string }
interface RateAlert { id: string; fromCurrency: string; toCurrency: string; targetRate: number; direction: 'above' | 'below'; active: boolean; createdAt: string }
interface HistoricalRate { date: string; rate: number }

const currencies: Currency[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', rate: 1.0, change24h: 0, region: 'Americas' },
  { code: 'EUR', name: 'Euro', symbol: '\u20AC', rate: 0.9234, change24h: -0.12, region: 'Europe' },
  { code: 'GBP', name: 'British Pound', symbol: '\u00A3', rate: 0.7892, change24h: 0.08, region: 'Europe' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '\u00A5', rate: 149.85, change24h: 0.45, region: 'Asia' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '\u00A5', rate: 7.2341, change24h: -0.03, region: 'Asia' },
  { code: 'INR', name: 'Indian Rupee', symbol: '\u20B9', rate: 83.12, change24h: 0.15, region: 'Asia' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '\u20A6', rate: 1520.45, change24h: 1.25, region: 'Africa' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', rate: 18.92, change24h: -0.32, region: 'Africa' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', rate: 153.45, change24h: 0.05, region: 'Africa' },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: 'GH\u20B5', rate: 14.85, change24h: 0.18, region: 'Africa' },
  { code: 'EGP', name: 'Egyptian Pound', symbol: 'E\u00A3', rate: 48.92, change24h: -0.08, region: 'Africa' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'AED', rate: 3.6725, change24h: 0.0, region: 'Middle East' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: 'SAR', rate: 3.75, change24h: 0.0, region: 'Middle East' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', rate: 4.97, change24h: -0.25, region: 'Americas' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$', rate: 1.3542, change24h: 0.07, region: 'Americas' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', rate: 1.5234, change24h: -0.11, region: 'Oceania' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', rate: 0.8645, change24h: 0.04, region: 'Europe' },
  { code: 'KRW', name: 'South Korean Won', symbol: '\u20A9', rate: 1342.5, change24h: 0.28, region: 'Asia' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', rate: 1.3412, change24h: -0.05, region: 'Asia' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '\u20BA', rate: 30.45, change24h: 0.65, region: 'Europe' },
  { code: 'MXN', name: 'Mexican Peso', symbol: 'MX$', rate: 17.12, change24h: -0.15, region: 'Americas' },
  { code: 'THB', name: 'Thai Baht', symbol: '\u0E3F', rate: 35.28, change24h: 0.09, region: 'Asia' },
]

const mockAlerts: RateAlert[] = []

const historicalRates: HistoricalRate[] = Array.from({ length: 30 }, (_, i) => {
  const d = new Date(2026, 0, i + 1); return { date: d.toISOString().split('T')[0], rate: 0.92 + Math.random() * 0.02 - 0.01 }
})

export default function MultiCurrencyPage() {
  const [tab, setTab] = useState<'converter' | 'rates' | 'alerts' | 'historical' | 'settings'>('converter')
  const [fromCurr, setFromCurr] = useState('USD')
  const [toCurr, setToCurr] = useState('EUR')
  const [amount, setAmount] = useState('1000')
  const [regionFilter, setRegionFilter] = useState('all')
  const [alerts, setAlerts] = useState(mockAlerts)
  const [newAlertFrom, setNewAlertFrom] = useState('USD')
  const [newAlertTo, setNewAlertTo] = useState('EUR')
  const [newAlertRate, setNewAlertRate] = useState('')
  const [newAlertDir, setNewAlertDir] = useState<'above' | 'below'>('below')
  const [autoConvert, setAutoConvert] = useState(true)
  const [baseCurrency, setBaseCurrency] = useState('USD')
  const [displayCurrencies, setDisplayCurrencies] = useState(['USD', 'EUR', 'GBP', 'NGN', 'ZAR', 'KES'])
  const [histFrom, setHistFrom] = useState('USD')
  const [histTo, setHistTo] = useState('EUR')

  const fromRate = currencies.find(c => c.code === fromCurr)?.rate || 1
  const toRate = currencies.find(c => c.code === toCurr)?.rate || 1
  const convertedAmount = (parseFloat(amount || '0') / fromRate * toRate).toFixed(2)
  const exchangeRate = (toRate / fromRate).toFixed(6)

  const filteredCurrencies = useMemo(() => {
    if (regionFilter === 'all') return currencies
    return currencies.filter(c => c.region === regionFilter)
  }, [regionFilter])

  const regions = [...new Set(currencies.map(c => c.region))]

  const addAlert = () => {
    if (!newAlertRate) return
    const newA: RateAlert = { id: `a${Date.now()}`, fromCurrency: newAlertFrom, toCurrency: newAlertTo, targetRate: parseFloat(newAlertRate), direction: newAlertDir, active: true, createdAt: new Date().toISOString().split('T')[0] }
    setAlerts(prev => [...prev, newA])
    setNewAlertRate('')
  }

  const toggleAlert = (id: string) => setAlerts(prev => prev.map(a => a.id === id ? { ...a, active: !a.active } : a))
  const removeAlert = (id: string) => setAlerts(prev => prev.filter(a => a.id !== id))

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Multi-Currency Management</h1>
          <p className="mt-2 text-gray-600">Convert currencies, monitor exchange rates, set alerts, and configure auto-conversion for your B2B transactions.</p>
        </div>

        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {[{ k: 'converter', l: 'Converter' }, { k: 'rates', l: 'Exchange Rates' }, { k: 'alerts', l: 'Rate Alerts' }, { k: 'historical', l: 'Historical Rates' }, { k: 'settings', l: 'Settings' }].map(t => (
              <button key={t.k} onClick={() => setTab(t.k as any)} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${tab === t.k ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{t.l}</button>
            ))}
          </nav>
        </div>

        {tab === 'converter' && (<div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 max-w-2xl mx-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Currency Converter</h2>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Amount</label><input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-blue-500" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">From</label><select value={fromCurr} onChange={e => setFromCurr(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">{currencies.map(c => (<option key={c.code} value={c.code}>{c.code} - {c.name}</option>))}</select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">To</label><select value={toCurr} onChange={e => setToCurr(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">{currencies.map(c => (<option key={c.code} value={c.code}>{c.code} - {c.name}</option>))}</select></div>
              </div>
              <button onClick={() => { setFromCurr(toCurr); setToCurr(fromCurr) }} className="w-full py-2 text-blue-600 hover:bg-blue-50 rounded-lg text-sm font-medium">Swap Currencies</button>
              <div className="bg-blue-50 rounded-xl p-6 text-center border border-blue-200">
                <p className="text-sm text-blue-600">Converted Amount</p>
                <p className="text-4xl font-bold text-blue-900 mt-2">{currencies.find(c => c.code === toCurr)?.symbol}{parseFloat(convertedAmount).toLocaleString()}</p>
                <p className="text-sm text-blue-500 mt-2">1 {fromCurr} = {exchangeRate} {toCurr}</p>
                <p className="text-xs text-blue-400 mt-1">Rate updated: {new Date().toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {['100', '500', '1000', '5000', '10000', '25000', '50000', '100000'].map(v => (
              <button key={v} onClick={() => setAmount(v)} className={`px-4 py-2 rounded-lg text-sm font-medium border ${amount === v ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>${parseInt(v).toLocaleString()}</button>
            ))}
          </div>
        </div>)}

        {tab === 'rates' && (<div className="space-y-6">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium text-gray-700">Region:</span>
            <button onClick={() => setRegionFilter('all')} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${regionFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}`}>All</button>
            {regions.map(r => (<button key={r} onClick={() => setRegionFilter(r)} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${regionFilter === r ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}`}>{r}</button>))}
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto"><table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50"><tr>{['Currency', 'Code', 'Rate (USD)', '24h Change', 'Region'].map(h => (<th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>))}</tr></thead>
              <tbody className="divide-y divide-gray-200">{filteredCurrencies.map(c => (<tr key={c.code} className="hover:bg-gray-50">
                <td className="px-6 py-4"><div className="flex items-center gap-3"><span className="text-lg font-bold text-gray-400">{c.symbol}</span><span className="text-sm font-medium text-gray-900">{c.name}</span></div></td>
                <td className="px-6 py-4 text-sm font-mono font-semibold text-gray-900">{c.code}</td>
                <td className="px-6 py-4 text-sm font-semibold text-gray-900">{c.rate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</td>
                <td className="px-6 py-4"><span className={`text-sm font-medium ${c.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>{c.change24h >= 0 ? '+' : ''}{c.change24h}%</span></td>
                <td className="px-6 py-4"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{c.region}</span></td>
              </tr>))}</tbody>
            </table></div>
          </div>
        </div>)}

        {tab === 'alerts' && (<div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Rate Alert</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">From</label><select value={newAlertFrom} onChange={e => setNewAlertFrom(e.target.value)} className="w-full px-3 py-2 border rounded-lg">{currencies.map(c => (<option key={c.code} value={c.code}>{c.code}</option>))}</select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">To</label><select value={newAlertTo} onChange={e => setNewAlertTo(e.target.value)} className="w-full px-3 py-2 border rounded-lg">{currencies.map(c => (<option key={c.code} value={c.code}>{c.code}</option>))}</select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Direction</label><select value={newAlertDir} onChange={e => setNewAlertDir(e.target.value as any)} className="w-full px-3 py-2 border rounded-lg"><option value="above">Goes Above</option><option value="below">Goes Below</option></select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Target Rate</label><input type="number" step="0.0001" value={newAlertRate} onChange={e => setNewAlertRate(e.target.value)} className="w-full px-3 py-2 border rounded-lg" placeholder="0.0000" /></div>
              <button onClick={addAlert} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">Create Alert</button>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200"><h3 className="text-lg font-semibold text-gray-900">Active Alerts</h3></div>
            <div className="divide-y divide-gray-100">
              {alerts.map(a => (
                <div key={a.id} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${a.active ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <div><p className="text-sm font-medium text-gray-900">{a.fromCurrency}/{a.toCurrency}</p><p className="text-xs text-gray-500">Alert when rate {a.direction} {a.targetRate}</p></div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">{a.createdAt}</span>
                    <button onClick={() => toggleAlert(a.id)} className={`px-3 py-1 rounded-lg text-xs font-medium ${a.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{a.active ? 'Active' : 'Paused'}</button>
                    <button onClick={() => removeAlert(a.id)} className="px-3 py-1 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50">Delete</button>
                  </div>
                </div>
              ))}
              {alerts.length === 0 && <div className="px-6 py-8 text-center text-gray-500">No alerts configured. Create one above.</div>}
            </div>
          </div>
        </div>)}

        {tab === 'historical' && (<div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex flex-col md:flex-row md:items-end gap-4 mb-6">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">From</label><select value={histFrom} onChange={e => setHistFrom(e.target.value)} className="px-3 py-2 border rounded-lg">{currencies.map(c => (<option key={c.code} value={c.code}>{c.code}</option>))}</select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">To</label><select value={histTo} onChange={e => setHistTo(e.target.value)} className="px-3 py-2 border rounded-lg">{currencies.map(c => (<option key={c.code} value={c.code}>{c.code}</option>))}</select></div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{histFrom}/{histTo} - Last 30 Days</h3>
            <div className="space-y-2">
              {historicalRates.map(hr => {
                const max = Math.max(...historicalRates.map(r => r.rate))
                const min = Math.min(...historicalRates.map(r => r.rate))
                const pct = ((hr.rate - min) / (max - min) * 80 + 10).toFixed(0)
                return (<div key={hr.date} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-20 flex-shrink-0">{hr.date.slice(5)}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden"><div className="bg-blue-500 h-full rounded-full" style={{ width: `${pct}%` }}></div></div>
                  <span className="text-xs font-mono text-gray-700 w-16 text-right">{hr.rate.toFixed(4)}</span>
                </div>)
              })}
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500">Low</p><p className="font-semibold text-gray-900">{Math.min(...historicalRates.map(r => r.rate)).toFixed(4)}</p></div>
              <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500">Average</p><p className="font-semibold text-gray-900">{(historicalRates.reduce((s, r) => s + r.rate, 0) / historicalRates.length).toFixed(4)}</p></div>
              <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500">High</p><p className="font-semibold text-gray-900">{Math.max(...historicalRates.map(r => r.rate)).toFixed(4)}</p></div>
            </div>
          </div>
        </div>)}

        {tab === 'settings' && (<div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Auto-Conversion Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div><p className="font-medium text-gray-900">Enable Auto-Conversion</p><p className="text-sm text-gray-500">Automatically convert prices to your preferred currency</p></div>
                <button onClick={() => setAutoConvert(!autoConvert)} className={`w-12 h-7 rounded-full relative transition-colors ${autoConvert ? 'bg-blue-600' : 'bg-gray-300'}`}><div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform ${autoConvert ? 'translate-x-6' : 'translate-x-1'}`}></div></button>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Base Currency</label><select value={baseCurrency} onChange={e => setBaseCurrency(e.target.value)} className="w-full px-4 py-2 border rounded-lg">{currencies.map(c => (<option key={c.code} value={c.code}>{c.code} - {c.name}</option>))}</select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Display Currencies</label><p className="text-xs text-gray-500 mb-2">Select currencies to show in rate tables and conversions</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">{currencies.map(c => (
                  <label key={c.code} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer ${displayCurrencies.includes(c.code) ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200'}`}>
                    <input type="checkbox" checked={displayCurrencies.includes(c.code)} onChange={() => setDisplayCurrencies(prev => prev.includes(c.code) ? prev.filter(x => x !== c.code) : [...prev, c.code])} className="rounded border-gray-300 text-blue-600" />
                    <span className="text-sm">{c.code}</span>
                  </label>
                ))}</div>
              </div>
            </div>
            <button className="mt-6 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">Save Settings</button>
          </div>
        </div>)}
      </div>
    </div>
  )
}

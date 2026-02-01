'use client'

import { useState, useMemo } from 'react'

type CommissionTier = 'bronze' | 'silver' | 'gold' | 'platinum'
interface Referral { id: string; name: string; email: string; signupDate: string; status: 'pending' | 'active' | 'converted' | 'expired'; ordersPlaced: number; totalRevenue: number; commissionEarned: number; tier: CommissionTier }
interface Payout { id: string; date: string; amount: number; currency: string; method: 'bank_transfer' | 'paypal' | 'crypto'; status: 'pending' | 'processing' | 'completed' | 'failed'; referenceNumber: string }
interface MarketingMaterial { id: string; name: string; type: 'banner' | 'email_template' | 'social_media' | 'landing_page' | 'video'; dimensions?: string; format: string; downloads: number }

const TIERS: Record<CommissionTier, { name: string; rate: number; color: string; bg: string; minRef: number; minRev: number; benefits: string[] }> = {
  bronze: { name: 'Bronze', rate: 5, color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200', minRef: 0, minRev: 0, benefits: ['5% commission on all referral sales', 'Basic marketing materials', 'Monthly payout', 'Email support', 'Referral tracking dashboard'] },
  silver: { name: 'Silver', rate: 8, color: 'text-gray-600', bg: 'bg-gray-50 border-gray-300', minRef: 10, minRev: 5000, benefits: ['8% commission on all referral sales', 'Premium marketing materials', 'Bi-weekly payout', 'Priority email support', 'Custom referral links', 'Performance analytics'] },
  gold: { name: 'Gold', rate: 12, color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-300', minRef: 50, minRev: 25000, benefits: ['12% commission on all referral sales', 'Exclusive marketing materials', 'Weekly payout', 'Dedicated account manager', 'Custom landing pages', 'Advanced analytics and reporting', 'Co-branded materials'] },
  platinum: { name: 'Platinum', rate: 15, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-300', minRef: 100, minRev: 100000, benefits: ['15% commission on all referral sales', 'White-label marketing materials', 'Daily payout option', 'VIP dedicated support', 'Custom API integration', 'Real-time analytics', 'Exclusive promotions and deals', 'Annual partner retreat invitation'] },
}

const refs: Referral[] = []

const pays: Payout[] = []

const mats: MarketingMaterial[] = []

const stats = { totalClicks: 0, totalSignups: 0, totalConversions: 0, conversionRate: 0, totalEarnings: 0, pendingEarnings: 0, availableBalance: 0, lifetimeEarnings: 0 }

export default function AffiliateProgramPage() {
  const [tab, setTab] = useState<'overview' | 'referrals' | 'payouts' | 'materials' | 'links'>('overview')
  const [tier] = useState<CommissionTier>('gold')
  const [refFilter, setRefFilter] = useState<string>('all')
  const [link, setLink] = useState('')
  const [campaign, setCampaign] = useState('')
  const [source, setSource] = useState('')
  const [payFilter, setPayFilter] = useState<string>('all')
  const [matFilter, setMatFilter] = useState<string>('all')
  const [showPayout, setShowPayout] = useState(false)
  const [payMethod, setPayMethod] = useState('bank_transfer')
  const [payAmt, setPayAmt] = useState('')

  const fRefs = useMemo(() => refFilter === 'all' ? refs : refs.filter(r => r.status === refFilter), [refFilter])
  const fPays = useMemo(() => payFilter === 'all' ? pays : pays.filter(p => p.status === payFilter), [payFilter])
  const fMats = useMemo(() => matFilter === 'all' ? mats : mats.filter(m => m.type === matFilter), [matFilter])

  const genLink = () => {
    const p = new URLSearchParams(); p.set('partner', 'AFF-2026-GOLD-0042')
    if (campaign) p.set('campaign', campaign); if (source) p.set('source', source)
    setLink(`https://marketplace.channah.com/ref?${p.toString()}`)
  }

  const badge = (s: string) => {
    const m: Record<string, string> = { pending: 'bg-yellow-100 text-yellow-800', active: 'bg-blue-100 text-blue-800', converted: 'bg-green-100 text-green-800', expired: 'bg-gray-100 text-gray-800', processing: 'bg-orange-100 text-orange-800', completed: 'bg-green-100 text-green-800', failed: 'bg-red-100 text-red-800' }
    return m[s] || 'bg-gray-100 text-gray-800'
  }

  const tabItems = [{ k: 'overview', l: 'Overview' }, { k: 'referrals', l: 'Referrals' }, { k: 'payouts', l: 'Payouts' }, { k: 'materials', l: 'Marketing Materials' }, { k: 'links', l: 'Link Generator' }]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Affiliate & Partnership Program</h1>
          <p className="mt-2 text-gray-600">Earn commissions by referring businesses to our B2B marketplace. Track your referrals, manage payouts, and access marketing materials.</p>
        </div>

        <div className={`rounded-xl border-2 p-6 mb-8 ${TIERS[tier].bg}`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <span className={`text-2xl font-bold ${TIERS[tier].color}`}>{TIERS[tier].name} Partner</span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-white shadow-sm">{TIERS[tier].rate}% Commission</span>
              </div>
              <p className="mt-1 text-sm text-gray-600">Partner ID: AFF-2026-GOLD-0042</p>
            </div>
            <div className="flex gap-6 text-center">
              <div><p className="text-2xl font-bold text-gray-900">${stats.lifetimeEarnings.toLocaleString()}</p><p className="text-xs text-gray-500">Lifetime Earnings</p></div>
              <div><p className="text-2xl font-bold text-gray-900">${stats.availableBalance.toLocaleString()}</p><p className="text-xs text-gray-500">Available Balance</p></div>
              <div><p className="text-2xl font-bold text-gray-900">{stats.totalConversions}</p><p className="text-xs text-gray-500">Total Conversions</p></div>
            </div>
          </div>
        </div>

        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {tabItems.map(t => (<button key={t.k} onClick={() => setTab(t.k as any)} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${tab === t.k ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{t.l}</button>))}
          </nav>
        </div>

        {tab === 'overview' && (<div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[{ l: 'Total Clicks', v: stats.totalClicks.toLocaleString(), c: '+12.5%' }, { l: 'Total Signups', v: stats.totalSignups.toLocaleString(), c: '+8.3%' }, { l: 'Conversion Rate', v: `${stats.conversionRate}%`, c: '+2.1%' }, { l: 'Pending Earnings', v: `$${stats.pendingEarnings.toLocaleString()}`, c: '+15.7%' }].map((s, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"><p className="text-sm font-medium text-gray-500">{s.l}</p><p className="text-3xl font-bold text-gray-900 mt-2">{s.v}</p><p className="text-sm mt-2 text-green-600">{s.c} from last month</p></div>
            ))}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Commission Tiers</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {(Object.keys(TIERS) as CommissionTier[]).map(t => { const info = TIERS[t]; const cur = t === tier; return (
                <div key={t} className={`rounded-xl border-2 p-6 hover:shadow-md transition-shadow ${cur ? info.bg + ' ring-2 ring-blue-400' : 'bg-white border-gray-200'}`}>
                  {cur && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mb-3">Current Tier</span>}
                  <h3 className={`text-lg font-bold ${info.color}`}>{info.name}</h3>
                  <p className="text-4xl font-bold text-gray-900 mt-2">{info.rate}%</p>
                  <p className="text-sm text-gray-500 mt-1">commission rate</p>
                  <div className="mt-4 text-sm text-gray-600"><p>Min. Referrals: {info.minRef}</p><p>Min. Revenue: ${info.minRev.toLocaleString()}</p></div>
                  <ul className="mt-4 space-y-2">{info.benefits.map((b, i) => (<li key={i} className="flex items-start gap-2 text-sm text-gray-700"><span className="text-green-500 flex-shrink-0">&#10003;</span>{b}</li>))}</ul>
                </div>
              )})}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200"><h2 className="text-lg font-semibold text-gray-900">Recent Referral Activity</h2></div>
            <div className="divide-y divide-gray-100">
              {refs.slice(0, 5).map(r => (<div key={r.id} className="px-6 py-4 flex items-center justify-between"><div><p className="font-medium text-gray-900">{r.name}</p><p className="text-sm text-gray-500">{r.email}</p></div><div className="flex items-center gap-4"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge(r.status)}`}>{r.status}</span><span className="text-sm font-semibold text-gray-900">${r.commissionEarned.toLocaleString()}</span></div></div>))}
            </div>
          </div>
        </div>)}

        {tab === 'referrals' && (<div className="space-y-6">
          <div className="flex items-center gap-3 flex-wrap"><span className="text-sm font-medium text-gray-700">Filter:</span>
            {['all', 'pending', 'active', 'converted', 'expired'].map(f => (<button key={f} onClick={() => setRefFilter(f)} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${refFilter === f ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}`}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>))}
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"><div className="overflow-x-auto"><table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50"><tr>{['Company', 'Signup Date', 'Status', 'Orders', 'Revenue', 'Commission', 'Tier'].map(h => (<th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>))}</tr></thead>
            <tbody className="bg-white divide-y divide-gray-200">{fRefs.map(r => (<tr key={r.id} className="hover:bg-gray-50">
              <td className="px-6 py-4"><p className="text-sm font-medium text-gray-900">{r.name}</p><p className="text-sm text-gray-500">{r.email}</p></td>
              <td className="px-6 py-4 text-sm text-gray-500">{r.signupDate}</td>
              <td className="px-6 py-4"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge(r.status)}`}>{r.status}</span></td>
              <td className="px-6 py-4 text-sm">{r.ordersPlaced}</td>
              <td className="px-6 py-4 text-sm font-medium">${r.totalRevenue.toLocaleString()}</td>
              <td className="px-6 py-4 text-sm font-semibold text-green-600">${r.commissionEarned.toLocaleString()}</td>
              <td className="px-6 py-4"><span className={`text-sm font-medium ${TIERS[r.tier].color}`}>{TIERS[r.tier].name}</span></td>
            </tr>))}</tbody>
          </table></div></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl border p-6 shadow-sm"><p className="text-sm text-gray-500">Total Referrals</p><p className="text-3xl font-bold text-gray-900 mt-1">{refs.length}</p></div>
            <div className="bg-white rounded-xl border p-6 shadow-sm"><p className="text-sm text-gray-500">Total Revenue Generated</p><p className="text-3xl font-bold text-gray-900 mt-1">${refs.reduce((s, r) => s + r.totalRevenue, 0).toLocaleString()}</p></div>
            <div className="bg-white rounded-xl border p-6 shadow-sm"><p className="text-sm text-gray-500">Total Commissions</p><p className="text-3xl font-bold text-green-600 mt-1">${refs.reduce((s, r) => s + r.commissionEarned, 0).toLocaleString()}</p></div>
          </div>
        </div>)}

        {tab === 'payouts' && (<div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl border p-6 shadow-sm"><p className="text-sm text-gray-500">Available Balance</p><p className="text-3xl font-bold text-green-600 mt-1">${stats.availableBalance.toLocaleString()}</p><button onClick={() => setShowPayout(true)} className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">Request Payout</button></div>
            <div className="bg-white rounded-xl border p-6 shadow-sm"><p className="text-sm text-gray-500">Pending Earnings</p><p className="text-3xl font-bold text-orange-500 mt-1">${stats.pendingEarnings.toLocaleString()}</p><p className="text-xs text-gray-400 mt-2">Processing within 7-14 days</p></div>
            <div className="bg-white rounded-xl border p-6 shadow-sm"><p className="text-sm text-gray-500">Lifetime Payouts</p><p className="text-3xl font-bold text-gray-900 mt-1">${stats.lifetimeEarnings.toLocaleString()}</p></div>
          </div>
          <div className="flex items-center gap-3 flex-wrap"><span className="text-sm font-medium text-gray-700">Filter:</span>
            {['all', 'completed', 'processing', 'pending'].map(f => (<button key={f} onClick={() => setPayFilter(f)} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${payFilter === f ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}`}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>))}
          </div>
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden"><div className="overflow-x-auto"><table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50"><tr>{['Reference', 'Date', 'Amount', 'Method', 'Status'].map(h => (<th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>))}</tr></thead>
            <tbody className="divide-y divide-gray-200">{fPays.map(p => (<tr key={p.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 text-sm font-mono">{p.referenceNumber}</td><td className="px-6 py-4 text-sm text-gray-500">{p.date}</td>
              <td className="px-6 py-4 text-sm font-semibold">${p.amount.toLocaleString()}</td>
              <td className="px-6 py-4 text-sm text-gray-500">{p.method === 'bank_transfer' ? 'Bank Transfer' : p.method === 'paypal' ? 'PayPal' : 'Crypto'}</td>
              <td className="px-6 py-4"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge(p.status)}`}>{p.status}</span></td>
            </tr>))}</tbody>
          </table></div></div>
        </div>)}

        {tab === 'materials' && (<div className="space-y-6">
          <div className="flex items-center gap-3 flex-wrap"><span className="text-sm font-medium text-gray-700">Type:</span>
            {['all', 'banner', 'email_template', 'social_media', 'landing_page', 'video'].map(f => (<button key={f} onClick={() => setMatFilter(f)} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${matFilter === f ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}`}>{f === 'all' ? 'All' : f.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</button>))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{fMats.map(m => (
            <div key={m.id} className="bg-white rounded-xl border shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-40 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center"><div className="text-center"><p className="text-3xl font-bold text-blue-300">{m.type.charAt(0).toUpperCase()}</p><p className="text-sm text-gray-500 mt-2">{m.format}</p></div></div>
              <div className="p-4"><h3 className="font-semibold text-gray-900">{m.name}</h3><div className="mt-2 flex items-center gap-4 text-sm text-gray-500">{m.dimensions && <span>{m.dimensions}</span>}<span>{m.downloads} downloads</span></div>
              <div className="mt-4 flex gap-2"><button className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Download</button><button className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">Preview</button></div></div>
            </div>
          ))}</div>
        </div>)}

        {tab === 'links' && (<div className="space-y-6">
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Referral Link Generator</h2>
            <p className="text-sm text-gray-600 mb-6">Generate custom referral links with campaign tracking. Share to earn commissions on every successful referral.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name</label><input type="text" value={campaign} onChange={e => setCampaign(e.target.value)} placeholder="e.g., summer-sale-2026" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Traffic Source</label><select value={source} onChange={e => setSource(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"><option value="">Select source</option><option value="email">Email</option><option value="social">Social Media</option><option value="blog">Blog</option><option value="website">Website</option><option value="paid">Paid Advertising</option></select></div>
            </div>
            <button onClick={genLink} className="mt-6 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">Generate Link</button>
            {link && (<div className="mt-6 p-4 bg-gray-50 rounded-lg border"><label className="block text-sm font-medium text-gray-700 mb-1">Your Referral Link</label><div className="flex items-center gap-2"><input type="text" readOnly value={link} className="flex-1 px-4 py-2 bg-white border rounded-lg text-sm font-mono" /><button onClick={() => navigator.clipboard.writeText(link)} className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-900">Copy</button></div></div>)}
          </div>
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Pre-built Quick Links</h2>
            <div className="space-y-3">{[
              { l: 'Homepage Referral', u: 'https://marketplace.channah.com/ref?partner=AFF-2026-GOLD-0042' },
              { l: 'New Arrivals', u: 'https://marketplace.channah.com/ref?partner=AFF-2026-GOLD-0042&page=new-arrivals' },
              { l: 'Best Sellers', u: 'https://marketplace.channah.com/ref?partner=AFF-2026-GOLD-0042&page=best-sellers' },
              { l: 'Sign Up Page', u: 'https://marketplace.channah.com/ref?partner=AFF-2026-GOLD-0042&page=register' },
              { l: 'Vendor Registration', u: 'https://marketplace.channah.com/ref?partner=AFF-2026-GOLD-0042&page=sell' },
            ].map((q, i) => (<div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"><div><p className="font-medium text-gray-900 text-sm">{q.l}</p><p className="text-xs text-gray-500 font-mono truncate max-w-md">{q.u}</p></div><button onClick={() => navigator.clipboard.writeText(q.u)} className="px-3 py-1.5 bg-white border rounded-lg text-sm hover:bg-gray-50">Copy</button></div>))}</div>
          </div>
        </div>)}

        {showPayout && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Request Payout</h2>
          <div className="space-y-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Amount (USD)</label><input type="number" value={payAmt} onChange={e => setPayAmt(e.target.value)} placeholder="Enter amount" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" /><p className="text-xs text-gray-500 mt-1">Available: ${stats.availableBalance.toLocaleString()}</p></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Payout Method</label><select value={payMethod} onChange={e => setPayMethod(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"><option value="bank_transfer">Bank Transfer</option><option value="paypal">PayPal</option><option value="crypto">Cryptocurrency</option></select></div>
          </div>
          <div className="mt-6 flex gap-3">
            <button onClick={() => setShowPayout(false)} className="flex-1 px-4 py-2 border rounded-lg font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button onClick={() => { alert(`Payout of $${payAmt} requested`); setShowPayout(false); setPayAmt('') }} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">Submit Request</button>
          </div>
        </div></div>)}
      </div>
    </div>
  )
}

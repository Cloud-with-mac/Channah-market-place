'use client'

import { useState, useMemo } from 'react'

interface SalesData { date: string; revenue: number; orders: number; avgOrderValue: number; newCustomers: number; returningCustomers: number }
interface ProductPerf { rank: number; name: string; sku: string; category: string; unitsSold: number; revenue: number; growth: number; margin: number }
interface CustomerSegment { name: string; count: number; revenue: number; avgLifetimeValue: number; retentionRate: number; color: string }

const salesData: SalesData[] = [
  { date: '2026-01-01', revenue: 145200, orders: 342, avgOrderValue: 424.56, newCustomers: 89, returningCustomers: 253 },
  { date: '2026-01-02', revenue: 132800, orders: 298, avgOrderValue: 445.64, newCustomers: 72, returningCustomers: 226 },
  { date: '2026-01-03', revenue: 168400, orders: 387, avgOrderValue: 435.14, newCustomers: 95, returningCustomers: 292 },
  { date: '2026-01-04', revenue: 121500, orders: 276, avgOrderValue: 440.22, newCustomers: 68, returningCustomers: 208 },
  { date: '2026-01-05', revenue: 189600, orders: 421, avgOrderValue: 450.36, newCustomers: 112, returningCustomers: 309 },
  { date: '2026-01-06', revenue: 156300, orders: 356, avgOrderValue: 439.04, newCustomers: 84, returningCustomers: 272 },
  { date: '2026-01-07', revenue: 174800, orders: 398, avgOrderValue: 439.20, newCustomers: 98, returningCustomers: 300 },
  { date: '2026-01-08', revenue: 142100, orders: 315, avgOrderValue: 451.11, newCustomers: 76, returningCustomers: 239 },
  { date: '2026-01-09', revenue: 198200, orders: 445, avgOrderValue: 445.39, newCustomers: 118, returningCustomers: 327 },
  { date: '2026-01-10', revenue: 163500, orders: 372, avgOrderValue: 439.52, newCustomers: 91, returningCustomers: 281 },
  { date: '2026-01-11', revenue: 155800, orders: 348, avgOrderValue: 447.70, newCustomers: 83, returningCustomers: 265 },
  { date: '2026-01-12', revenue: 182400, orders: 412, avgOrderValue: 442.72, newCustomers: 105, returningCustomers: 307 },
  { date: '2026-01-13', revenue: 171600, orders: 389, avgOrderValue: 441.13, newCustomers: 97, returningCustomers: 292 },
  { date: '2026-01-14', revenue: 148900, orders: 334, avgOrderValue: 445.81, newCustomers: 79, returningCustomers: 255 },
]

const topProducts: ProductPerf[] = [
  { rank: 1, name: 'Industrial Steel Pipe Set', sku: 'ISP-4500', category: 'Industrial', unitsSold: 1245, revenue: 248900, growth: 23.5, margin: 34.2 },
  { rank: 2, name: 'Organic Coffee Beans (Bulk)', sku: 'OCB-1200', category: 'Food & Beverage', unitsSold: 3420, revenue: 205200, growth: 18.2, margin: 42.1 },
  { rank: 3, name: 'Commercial LED Panel Light', sku: 'CLP-8800', category: 'Electronics', unitsSold: 2180, revenue: 196200, growth: 31.4, margin: 38.5 },
  { rank: 4, name: 'Wholesale Cotton Fabric', sku: 'WCF-3300', category: 'Textiles', unitsSold: 5600, revenue: 179200, growth: 12.8, margin: 29.7 },
  { rank: 5, name: 'Agricultural Fertilizer NPK', sku: 'AFN-6600', category: 'Agriculture', unitsSold: 890, revenue: 168700, growth: 45.1, margin: 25.3 },
  { rank: 6, name: 'Pharmaceutical Grade Bottles', sku: 'PGB-2200', category: 'Healthcare', unitsSold: 12400, revenue: 155000, growth: 8.9, margin: 52.4 },
  { rank: 7, name: 'Solar Panel Module 400W', sku: 'SPM-4000', category: 'Energy', unitsSold: 456, revenue: 145600, growth: 67.3, margin: 31.8 },
  { rank: 8, name: 'Office Furniture Set', sku: 'OFS-7700', category: 'Furniture', unitsSold: 234, revenue: 140400, growth: 15.6, margin: 44.2 },
  { rank: 9, name: 'Industrial Chemical Solvent', sku: 'ICS-5500', category: 'Chemicals', unitsSold: 780, revenue: 132600, growth: -3.2, margin: 36.9 },
  { rank: 10, name: 'Automotive Spare Parts Kit', sku: 'ASP-9900', category: 'Automotive', unitsSold: 1560, revenue: 124800, growth: 21.7, margin: 33.4 },
]

const customerSegments: CustomerSegment[] = [
  { name: 'Enterprise', count: 245, revenue: 4520000, avgLifetimeValue: 18449, retentionRate: 92.5, color: 'bg-blue-500' },
  { name: 'Mid-Market', count: 1240, revenue: 8680000, avgLifetimeValue: 7000, retentionRate: 85.3, color: 'bg-green-500' },
  { name: 'Small Business', count: 3450, revenue: 6210000, avgLifetimeValue: 1800, retentionRate: 72.1, color: 'bg-yellow-500' },
  { name: 'Startup', count: 2180, revenue: 1962000, avgLifetimeValue: 900, retentionRate: 58.7, color: 'bg-purple-500' },
  { name: 'Individual Buyer', count: 5670, revenue: 2835000, avgLifetimeValue: 500, retentionRate: 45.2, color: 'bg-orange-500' },
]

const execSummary = { totalRevenue: 2450800, totalOrders: 5293, totalCustomers: 12785, monthlyGrowth: 18.5, prevRevenue: 2068100, prevOrders: 4567, prevCustomers: 11240, prevGrowth: 14.2 }

export default function AnalyticsDashboardPage() {
  const [tab, setTab] = useState<'executive' | 'sales' | 'products' | 'customers'>('executive')
  const [dateRange, setDateRange] = useState('last-14-days')
  const [sortCol, setSortCol] = useState<string>('rank')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const sortedProducts = useMemo(() => {
    return [...topProducts].sort((a, b) => {
      const aVal = a[sortCol as keyof ProductPerf] as number
      const bVal = b[sortCol as keyof ProductPerf] as number
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal
    })
  }, [sortCol, sortDir])

  const toggleSort = (col: string) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
  }

  const exportCSV = () => {
    const headers = ['Date', 'Revenue', 'Orders', 'Avg Order Value', 'New Customers', 'Returning Customers']
    const rows = salesData.map(d => [d.date, d.revenue, d.orders, d.avgOrderValue, d.newCustomers, d.returningCustomers].join(','))
    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `analytics-${dateRange}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  const pctChange = (curr: number, prev: number) => {
    const change = ((curr - prev) / prev * 100).toFixed(1)
    return { change: `${Number(change) >= 0 ? '+' : ''}${change}%`, positive: Number(change) >= 0 }
  }

  const tabItems = [{ k: 'executive', l: 'Executive Summary' }, { k: 'sales', l: 'Sales Analytics' }, { k: 'products', l: 'Product Performance' }, { k: 'customers', l: 'Customer Analytics' }]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Advanced Analytics Dashboard</h1>
            <p className="mt-2 text-gray-600">Comprehensive business intelligence and performance metrics for your B2B marketplace.</p>
          </div>
          <div className="flex items-center gap-3">
            <select value={dateRange} onChange={e => setDateRange(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500">
              <option value="last-7-days">Last 7 Days</option>
              <option value="last-14-days">Last 14 Days</option>
              <option value="last-30-days">Last 30 Days</option>
              <option value="last-90-days">Last 90 Days</option>
              <option value="this-year">This Year</option>
            </select>
            <button onClick={exportCSV} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Export CSV</button>
          </div>
        </div>

        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {tabItems.map(t => (<button key={t.k} onClick={() => setTab(t.k as any)} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${tab === t.k ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{t.l}</button>))}
          </nav>
        </div>

        {tab === 'executive' && (<div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Total Revenue', value: `$${execSummary.totalRevenue.toLocaleString()}`, ...pctChange(execSummary.totalRevenue, execSummary.prevRevenue) },
              { label: 'Total Orders', value: execSummary.totalOrders.toLocaleString(), ...pctChange(execSummary.totalOrders, execSummary.prevOrders) },
              { label: 'Total Customers', value: execSummary.totalCustomers.toLocaleString(), ...pctChange(execSummary.totalCustomers, execSummary.prevCustomers) },
              { label: 'Monthly Growth', value: `${execSummary.monthlyGrowth}%`, ...pctChange(execSummary.monthlyGrowth, execSummary.prevGrowth) },
            ].map((s, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <p className="text-sm font-medium text-gray-500">{s.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{s.value}</p>
                <p className={`text-sm mt-2 ${s.positive ? 'text-green-600' : 'text-red-600'}`}>{(s as any).value as string} vs previous period</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
              <div className="space-y-3">
                {salesData.slice(0, 7).map(d => {
                  const maxRev = Math.max(...salesData.map(s => s.revenue))
                  const pct = (d.revenue / maxRev * 100).toFixed(0)
                  return (<div key={d.date} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-20">{d.date.slice(5)}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden"><div className="bg-blue-500 h-full rounded-full flex items-center justify-end pr-2" style={{ width: `${pct}%` }}><span className="text-xs text-white font-medium">${(d.revenue / 1000).toFixed(0)}k</span></div></div>
                  </div>)
                })}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Orders Trend</h3>
              <div className="space-y-3">
                {salesData.slice(0, 7).map(d => {
                  const maxOrd = Math.max(...salesData.map(s => s.orders))
                  const pct = (d.orders / maxOrd * 100).toFixed(0)
                  return (<div key={d.date} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-20">{d.date.slice(5)}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden"><div className="bg-green-500 h-full rounded-full flex items-center justify-end pr-2" style={{ width: `${pct}%` }}><span className="text-xs text-white font-medium">{d.orders}</span></div></div>
                  </div>)
                })}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Performance Indicators</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { label: 'Avg Order Value', value: '$442.18', change: '+3.2%' },
                { label: 'Customer Retention', value: '78.4%', change: '+2.1%' },
                { label: 'Repeat Purchase Rate', value: '64.2%', change: '+5.8%' },
                { label: 'Customer Lifetime Value', value: '$4,280', change: '+12.3%' },
                { label: 'Gross Margin', value: '35.6%', change: '+1.4%' },
                { label: 'Net Promoter Score', value: '72', change: '+4' },
                { label: 'Cart Abandonment', value: '23.1%', change: '-2.3%' },
                { label: 'Supplier Fill Rate', value: '96.8%', change: '+0.5%' },
              ].map((kpi, i) => (
                <div key={i} className="text-center p-4 rounded-lg bg-gray-50">
                  <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
                  <p className="text-sm text-gray-500 mt-1">{kpi.label}</p>
                  <p className={`text-xs mt-1 ${kpi.change.startsWith('+') || kpi.change.startsWith('-2') ? 'text-green-600' : 'text-red-600'}`}>{kpi.change}</p>
                </div>
              ))}
            </div>
          </div>
        </div>)}

        {tab === 'sales' && (<div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Daily Sales Data</h3>
              <button onClick={exportCSV} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">Export</button>
            </div>
            <div className="overflow-x-auto"><table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50"><tr>{['Date', 'Revenue', 'Orders', 'Avg Order Value', 'New Customers', 'Returning'].map(h => (<th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>))}</tr></thead>
              <tbody className="divide-y divide-gray-200">{salesData.map(d => (<tr key={d.date} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{d.date}</td>
                <td className="px-6 py-4 text-sm font-semibold text-gray-900">${d.revenue.toLocaleString()}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{d.orders}</td>
                <td className="px-6 py-4 text-sm text-gray-900">${d.avgOrderValue.toFixed(2)}</td>
                <td className="px-6 py-4 text-sm text-blue-600 font-medium">{d.newCustomers}</td>
                <td className="px-6 py-4 text-sm text-green-600 font-medium">{d.returningCustomers}</td>
              </tr>))}</tbody>
            </table></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl border p-6 shadow-sm"><p className="text-sm text-gray-500">Period Revenue</p><p className="text-3xl font-bold text-gray-900 mt-1">${salesData.reduce((s, d) => s + d.revenue, 0).toLocaleString()}</p></div>
            <div className="bg-white rounded-xl border p-6 shadow-sm"><p className="text-sm text-gray-500">Period Orders</p><p className="text-3xl font-bold text-gray-900 mt-1">{salesData.reduce((s, d) => s + d.orders, 0).toLocaleString()}</p></div>
            <div className="bg-white rounded-xl border p-6 shadow-sm"><p className="text-sm text-gray-500">Avg Daily Revenue</p><p className="text-3xl font-bold text-gray-900 mt-1">${Math.round(salesData.reduce((s, d) => s + d.revenue, 0) / salesData.length).toLocaleString()}</p></div>
          </div>
        </div>)}

        {tab === 'products' && (<div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200"><h3 className="text-lg font-semibold text-gray-900">Top 10 Products by Revenue</h3></div>
            <div className="overflow-x-auto"><table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50"><tr>
                {[{ k: 'rank', l: '#' }, { k: 'name', l: 'Product' }, { k: 'category', l: 'Category' }, { k: 'unitsSold', l: 'Units Sold' }, { k: 'revenue', l: 'Revenue' }, { k: 'growth', l: 'Growth' }, { k: 'margin', l: 'Margin' }].map(h => (
                  <th key={h.k} onClick={() => toggleSort(h.k)} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700">
                    {h.l} {sortCol === h.k ? (sortDir === 'asc' ? ' ^' : ' v') : ''}
                  </th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-gray-200">{sortedProducts.map(p => (<tr key={p.sku} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-bold text-gray-400">{p.rank}</td>
                <td className="px-6 py-4"><p className="text-sm font-medium text-gray-900">{p.name}</p><p className="text-xs text-gray-500">{p.sku}</p></td>
                <td className="px-6 py-4"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{p.category}</span></td>
                <td className="px-6 py-4 text-sm text-gray-900">{p.unitsSold.toLocaleString()}</td>
                <td className="px-6 py-4 text-sm font-semibold text-gray-900">${p.revenue.toLocaleString()}</td>
                <td className="px-6 py-4"><span className={`text-sm font-medium ${p.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>{p.growth >= 0 ? '+' : ''}{p.growth}%</span></td>
                <td className="px-6 py-4 text-sm text-gray-900">{p.margin}%</td>
              </tr>))}</tbody>
            </table></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { label: 'Total Products Sold', value: topProducts.reduce((s, p) => s + p.unitsSold, 0).toLocaleString() },
              { label: 'Total Product Revenue', value: `$${topProducts.reduce((s, p) => s + p.revenue, 0).toLocaleString()}` },
              { label: 'Avg Growth Rate', value: `${(topProducts.reduce((s, p) => s + p.growth, 0) / topProducts.length).toFixed(1)}%` },
              { label: 'Avg Margin', value: `${(topProducts.reduce((s, p) => s + p.margin, 0) / topProducts.length).toFixed(1)}%` },
            ].map((s, i) => (<div key={i} className="bg-white rounded-xl border p-6 shadow-sm"><p className="text-sm text-gray-500">{s.label}</p><p className="text-2xl font-bold text-gray-900 mt-1">{s.value}</p></div>))}
          </div>
        </div>)}

        {tab === 'customers' && (<div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200"><h3 className="text-lg font-semibold text-gray-900">Customer Segments</h3></div>
            <div className="overflow-x-auto"><table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50"><tr>{['Segment', 'Customers', 'Revenue', 'Avg LTV', 'Retention Rate', 'Share'].map(h => (<th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>))}</tr></thead>
              <tbody className="divide-y divide-gray-200">{customerSegments.map(seg => {
                const totalCust = customerSegments.reduce((s, c) => s + c.count, 0)
                const share = ((seg.count / totalCust) * 100).toFixed(1)
                return (<tr key={seg.name} className="hover:bg-gray-50">
                  <td className="px-6 py-4"><div className="flex items-center gap-3"><div className={`w-3 h-3 rounded-full ${seg.color}`}></div><span className="text-sm font-medium text-gray-900">{seg.name}</span></div></td>
                  <td className="px-6 py-4 text-sm text-gray-900">{seg.count.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">${seg.revenue.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">${seg.avgLifetimeValue.toLocaleString()}</td>
                  <td className="px-6 py-4"><div className="flex items-center gap-2"><div className="w-24 bg-gray-200 rounded-full h-2"><div className={`${seg.color} h-2 rounded-full`} style={{ width: `${seg.retentionRate}%` }}></div></div><span className="text-sm text-gray-600">{seg.retentionRate}%</span></div></td>
                  <td className="px-6 py-4 text-sm text-gray-600">{share}%</td>
                </tr>)
              })}</tbody>
            </table></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Distribution</h3>
              {customerSegments.map(seg => {
                const total = customerSegments.reduce((s, c) => s + c.count, 0)
                const pct = ((seg.count / total) * 100).toFixed(1)
                return (<div key={seg.name} className="mb-3"><div className="flex justify-between text-sm mb-1"><span className="text-gray-700">{seg.name}</span><span className="text-gray-500">{seg.count.toLocaleString()} ({pct}%)</span></div><div className="w-full bg-gray-200 rounded-full h-3"><div className={`${seg.color} h-3 rounded-full`} style={{ width: `${pct}%` }}></div></div></div>)
              })}
            </div>
            <div className="bg-white rounded-xl border p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Segment</h3>
              {customerSegments.map(seg => {
                const total = customerSegments.reduce((s, c) => s + c.revenue, 0)
                const pct = ((seg.revenue / total) * 100).toFixed(1)
                return (<div key={seg.name} className="mb-3"><div className="flex justify-between text-sm mb-1"><span className="text-gray-700">{seg.name}</span><span className="text-gray-500">${(seg.revenue / 1000000).toFixed(1)}M ({pct}%)</span></div><div className="w-full bg-gray-200 rounded-full h-3"><div className={`${seg.color} h-3 rounded-full`} style={{ width: `${pct}%` }}></div></div></div>)
              })}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { label: 'Total Customers', value: customerSegments.reduce((s, c) => s + c.count, 0).toLocaleString() },
              { label: 'Total Segment Revenue', value: `$${(customerSegments.reduce((s, c) => s + c.revenue, 0) / 1000000).toFixed(1)}M` },
              { label: 'Avg Retention', value: `${(customerSegments.reduce((s, c) => s + c.retentionRate, 0) / customerSegments.length).toFixed(1)}%` },
              { label: 'Avg LTV', value: `$${Math.round(customerSegments.reduce((s, c) => s + c.avgLifetimeValue, 0) / customerSegments.length).toLocaleString()}` },
            ].map((s, i) => (<div key={i} className="bg-white rounded-xl border p-6 shadow-sm"><p className="text-sm text-gray-500">{s.label}</p><p className="text-2xl font-bold text-gray-900 mt-1">{s.value}</p></div>))}
          </div>
        </div>)}
      </div>
    </div>
  )
}

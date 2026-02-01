'use client'

import { useState } from 'react'
import { useDeveloperStore } from '@/store/developer-store'

const endpoints = [
  { method: 'GET', path: '/api/v1/products', description: 'List all products with pagination and filters' },
  { method: 'GET', path: '/api/v1/products/:id', description: 'Get product details by ID' },
  { method: 'POST', path: '/api/v1/orders', description: 'Create a new order' },
  { method: 'GET', path: '/api/v1/orders', description: 'List orders with status filtering' },
  { method: 'GET', path: '/api/v1/orders/:id', description: 'Get order details' },
  { method: 'PUT', path: '/api/v1/orders/:id/status', description: 'Update order status' },
  { method: 'GET', path: '/api/v1/users/me', description: 'Get current user profile' },
  { method: 'GET', path: '/api/v1/vendors', description: 'List all vendors' },
  { method: 'POST', path: '/api/v1/webhooks', description: 'Register a webhook endpoint' },
  { method: 'GET', path: '/api/v1/analytics/sales', description: 'Get sales analytics data' },
  { method: 'POST', path: '/api/v1/rfq', description: 'Submit a Request for Quote' },
  { method: 'GET', path: '/api/v1/categories', description: 'List product categories' },
]

const webhookEvents = ['order.created', 'order.updated', 'order.completed', 'order.cancelled', 'payment.received', 'payment.failed', 'shipment.created', 'shipment.delivered', 'product.updated', 'rfq.received']

const codeSnippets = {
  curl: `curl -X GET "https://api.channah.com/v1/products?page=1&limit=20" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`,
  python: `import requests

API_KEY = "YOUR_API_KEY"
BASE_URL = "https://api.channah.com/v1"

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

# List products
response = requests.get(
    f"{BASE_URL}/products",
    headers=headers,
    params={"page": 1, "limit": 20}
)
products = response.json()
print(f"Found {len(products['data'])} products")

# Create an order
order_data = {
    "product_id": "prod_123",
    "quantity": 100,
    "shipping_address": {
        "street": "123 Business Ave",
        "city": "Lagos",
        "country": "NG"
    }
}
response = requests.post(
    f"{BASE_URL}/orders",
    headers=headers,
    json=order_data
)
print(f"Order created: {response.json()['id']}")`,
  nodejs: `const axios = require('axios');

const API_KEY = 'YOUR_API_KEY';
const BASE_URL = 'https://api.channah.com/v1';

const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Authorization': \`Bearer \${API_KEY}\`,
    'Content-Type': 'application/json'
  }
});

// List products
async function listProducts() {
  const { data } = await client.get('/products', {
    params: { page: 1, limit: 20 }
  });
  console.log(\`Found \${data.data.length} products\`);
  return data;
}

// Create an order
async function createOrder(productId, quantity) {
  const { data } = await client.post('/orders', {
    product_id: productId,
    quantity: quantity,
    shipping_address: {
      street: '123 Business Ave',
      city: 'Lagos',
      country: 'NG'
    }
  });
  console.log(\`Order created: \${data.id}\`);
  return data;
}

listProducts().then(console.log);`,
}

export default function DeveloperToolsPage() {
  const store = useDeveloperStore()
  const [tab, setTab] = useState<'keys' | 'webhooks' | 'usage' | 'snippets' | 'reference'>('keys')
  const [newKeyName, setNewKeyName] = useState('')
  const [newKeyPerms, setNewKeyPerms] = useState<string[]>(['read'])
  const [newWebhookName, setNewWebhookName] = useState('')
  const [newWebhookUrl, setNewWebhookUrl] = useState('')
  const [newWebhookEvents, setNewWebhookEvents] = useState<string[]>([])
  const [snippetLang, setSnippetLang] = useState<'curl' | 'python' | 'nodejs'>('curl')
  const [showNewKey, setShowNewKey] = useState<string | null>(null)
  const [methodFilter, setMethodFilter] = useState('all')

  const permissions = ['read', 'write', 'orders', 'products', 'users', 'analytics', 'webhooks', 'admin']

  const generateKey = () => {
    if (!newKeyName) return
    const key = store.generateAPIKey(newKeyName, newKeyPerms)
    setShowNewKey(key.key)
    setNewKeyName('')
    setNewKeyPerms(['read'])
  }

  const createWebhook = () => {
    if (!newWebhookName || !newWebhookUrl || newWebhookEvents.length === 0) return
    store.createWebhook(newWebhookName, newWebhookUrl, newWebhookEvents)
    setNewWebhookName(''); setNewWebhookUrl(''); setNewWebhookEvents([])
  }

  const metrics = store.getUsageMetrics()
  const usageData = store.getUsageData()
  const logs = store.getLogs(undefined, 20)

  const filteredEndpoints = methodFilter === 'all' ? endpoints : endpoints.filter(e => e.method === methodFilter)

  const methodColor = (m: string) => {
    const map: Record<string, string> = { GET: 'bg-green-100 text-green-800', POST: 'bg-blue-100 text-blue-800', PUT: 'bg-yellow-100 text-yellow-800', DELETE: 'bg-red-100 text-red-800' }
    return map[m] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">API & Developer Tools</h1>
          <p className="mt-2 text-gray-600">Manage API keys, configure webhooks, monitor usage, and integrate with our B2B marketplace API.</p>
        </div>

        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {[{ k: 'keys', l: 'API Keys' }, { k: 'webhooks', l: 'Webhooks' }, { k: 'usage', l: 'Usage Stats' }, { k: 'snippets', l: 'Code Snippets' }, { k: 'reference', l: 'API Reference' }].map(t => (
              <button key={t.k} onClick={() => setTab(t.k as any)} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${tab === t.k ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{t.l}</button>
            ))}
          </nav>
        </div>

        {tab === 'keys' && (<div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Generate New API Key</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Key Name</label><input type="text" value={newKeyName} onChange={e => setNewKeyName(e.target.value)} className="w-full px-4 py-2 border rounded-lg" placeholder="e.g., Production Key" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Permissions</label>
                <div className="flex flex-wrap gap-2">{permissions.map(p => (
                  <label key={p} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm cursor-pointer border ${newKeyPerms.includes(p) ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-gray-200 text-gray-600'}`}>
                    <input type="checkbox" checked={newKeyPerms.includes(p)} onChange={() => setNewKeyPerms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])} className="sr-only" />{p}
                  </label>
                ))}</div>
              </div>
            </div>
            <button onClick={generateKey} className="mt-4 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">Generate Key</button>
            {showNewKey && (<div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg"><p className="text-sm font-medium text-yellow-800">New API Key (copy now, won&apos;t be shown again):</p><div className="flex items-center gap-2 mt-2"><code className="flex-1 p-2 bg-white border rounded text-sm font-mono break-all">{showNewKey}</code><button onClick={() => { navigator.clipboard.writeText(showNewKey); setShowNewKey(null) }} className="px-3 py-2 bg-yellow-600 text-white rounded-lg text-sm">Copy</button></div></div>)}
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200"><h3 className="font-semibold text-gray-900">API Keys ({store.apiKeys.length})</h3></div>
            {store.apiKeys.length === 0 ? (<div className="px-6 py-8 text-center text-gray-500">No API keys yet. Generate one above.</div>) : (
              <div className="divide-y divide-gray-100">{store.apiKeys.map(key => (
                <div key={key.id} className="px-6 py-4 flex items-center justify-between">
                  <div><p className="text-sm font-medium text-gray-900">{key.name}</p><p className="text-xs font-mono text-gray-500">{key.maskedKey}</p><p className="text-xs text-gray-400 mt-1">Permissions: {key.permissions.join(', ')}</p></div>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${key.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>{key.isActive ? 'Active' : 'Disabled'}</span>
                    <button onClick={() => store.toggleAPIKey(key.id)} className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded">{key.isActive ? 'Disable' : 'Enable'}</button>
                    <button onClick={() => store.revokeAPIKey(key.id)} className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded">Revoke</button>
                  </div>
                </div>
              ))}</div>
            )}
          </div>
        </div>)}

        {tab === 'webhooks' && (<div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Configure Webhook</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Webhook Name</label><input type="text" value={newWebhookName} onChange={e => setNewWebhookName(e.target.value)} className="w-full px-4 py-2 border rounded-lg" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Endpoint URL</label><input type="url" value={newWebhookUrl} onChange={e => setNewWebhookUrl(e.target.value)} className="w-full px-4 py-2 border rounded-lg" placeholder="https://your-api.com/webhook" /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Events</label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">{webhookEvents.map(ev => (
                  <label key={ev} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs cursor-pointer border ${newWebhookEvents.includes(ev) ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200'}`}>
                    <input type="checkbox" checked={newWebhookEvents.includes(ev)} onChange={() => setNewWebhookEvents(prev => prev.includes(ev) ? prev.filter(x => x !== ev) : [...prev, ev])} className="sr-only" />{ev}
                  </label>
                ))}</div>
              </div>
            </div>
            <button onClick={createWebhook} className="mt-4 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">Create Webhook</button>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200"><h3 className="font-semibold text-gray-900">Registered Webhooks ({store.webhooks.length})</h3></div>
            {store.webhooks.length === 0 ? (<div className="px-6 py-8 text-center text-gray-500">No webhooks configured.</div>) : (
              <div className="divide-y divide-gray-100">{store.webhooks.map(wh => (
                <div key={wh.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div><p className="text-sm font-medium text-gray-900">{wh.name}</p><p className="text-xs font-mono text-gray-500">{wh.url}</p><p className="text-xs text-gray-400 mt-1">Events: {wh.events.join(', ')}</p></div>
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${wh.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>{wh.isActive ? 'Active' : 'Inactive'}</span>
                      <button onClick={() => store.testWebhook(wh.id)} className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded">Test</button>
                      <button onClick={() => store.toggleWebhook(wh.id)} className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-50 rounded">Toggle</button>
                      <button onClick={() => store.deleteWebhook(wh.id)} className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded">Delete</button>
                    </div>
                  </div>
                </div>
              ))}</div>
            )}
          </div>
        </div>)}

        {tab === 'usage' && (<div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { label: 'Total Requests', value: metrics.totalRequests.toLocaleString() },
              { label: 'Success Rate', value: metrics.totalRequests > 0 ? `${((metrics.successfulRequests / metrics.totalRequests) * 100).toFixed(1)}%` : 'N/A' },
              { label: 'Avg Response Time', value: `${metrics.averageResponseTime.toFixed(0)}ms` },
              { label: 'This Month', value: metrics.requestsThisMonth.toLocaleString() },
            ].map((s, i) => (<div key={i} className="bg-white rounded-xl border p-6 shadow-sm"><p className="text-sm text-gray-500">{s.label}</p><p className="text-3xl font-bold text-gray-900 mt-1">{s.value}</p></div>))}
          </div>
          {usageData.length > 0 && (<div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200"><h3 className="font-semibold text-gray-900">Endpoint Usage</h3></div>
            <div className="overflow-x-auto"><table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50"><tr>{['Endpoint', 'Method', 'Requests', 'Avg Response', 'Errors'].map(h => (<th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>))}</tr></thead>
              <tbody className="divide-y divide-gray-200">{usageData.map((d, i) => (<tr key={i} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-mono text-gray-900">{d.endpoint}</td>
                <td className="px-6 py-4"><span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${methodColor(d.method)}`}>{d.method}</span></td>
                <td className="px-6 py-4 text-sm">{d.count}</td>
                <td className="px-6 py-4 text-sm">{d.avgResponseTime.toFixed(0)}ms</td>
                <td className="px-6 py-4 text-sm text-red-600">{d.errors}</td>
              </tr>))}</tbody>
            </table></div>
          </div>)}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between"><h3 className="font-semibold text-gray-900">Integration Logs</h3><button onClick={() => store.clearLogs()} className="text-sm text-red-600 hover:text-red-700">Clear Logs</button></div>
            {logs.length === 0 ? (<div className="px-6 py-8 text-center text-gray-500">No logs yet.</div>) : (
              <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">{logs.map(log => (
                <div key={log.id} className="px-6 py-3 flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${log.type === 'error' ? 'bg-red-500' : log.type === 'webhook' ? 'bg-purple-500' : 'bg-green-500'}`}></span>
                  <div className="flex-1 min-w-0"><p className="text-sm font-medium text-gray-900 truncate">{log.title}</p><p className="text-xs text-gray-500 truncate">{log.message}</p></div>
                  <span className="text-xs text-gray-400 flex-shrink-0">{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
              ))}</div>
            )}
          </div>
        </div>)}

        {tab === 'snippets' && (<div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Code Snippets</h2>
              <div className="flex gap-2">{(['curl', 'python', 'nodejs'] as const).map(l => (
                <button key={l} onClick={() => setSnippetLang(l)} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${snippetLang === l ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}`}>{l === 'nodejs' ? 'Node.js' : l.charAt(0).toUpperCase() + l.slice(1)}</button>
              ))}</div>
            </div>
            <div className="relative">
              <pre className="bg-gray-900 text-gray-100 rounded-xl p-6 overflow-x-auto text-sm font-mono leading-relaxed"><code>{codeSnippets[snippetLang]}</code></pre>
              <button onClick={() => navigator.clipboard.writeText(codeSnippets[snippetLang])} className="absolute top-4 right-4 px-3 py-1.5 bg-gray-700 text-gray-200 rounded-lg text-xs hover:bg-gray-600">Copy</button>
            </div>
          </div>
        </div>)}

        {tab === 'reference' && (<div className="space-y-6">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium text-gray-700">Method:</span>
            {['all', 'GET', 'POST', 'PUT', 'DELETE'].map(m => (
              <button key={m} onClick={() => setMethodFilter(m)} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${methodFilter === m ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}`}>{m}</button>
            ))}
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200"><h3 className="font-semibold text-gray-900">API Endpoints</h3></div>
            <div className="divide-y divide-gray-100">{filteredEndpoints.map((ep, i) => (
              <div key={i} className="px-6 py-4 flex items-center gap-4">
                <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-bold ${methodColor(ep.method)} w-16 justify-center`}>{ep.method}</span>
                <div><p className="text-sm font-mono font-medium text-gray-900">{ep.path}</p><p className="text-xs text-gray-500">{ep.description}</p></div>
              </div>
            ))}</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Authentication</h3>
            <p className="text-sm text-gray-600">All API requests require a valid API key in the Authorization header:</p>
            <pre className="mt-3 bg-gray-900 text-gray-100 rounded-lg p-4 text-sm font-mono">Authorization: Bearer YOUR_API_KEY</pre>
            <h4 className="mt-6 font-semibold text-gray-900">Rate Limits</h4>
            <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg"><p className="font-medium text-gray-900">Free Tier</p><p className="text-sm text-gray-500">100 req/min</p></div>
              <div className="p-3 bg-blue-50 rounded-lg"><p className="font-medium text-blue-900">Pro Tier</p><p className="text-sm text-blue-600">1,000 req/min</p></div>
              <div className="p-3 bg-purple-50 rounded-lg"><p className="font-medium text-purple-900">Enterprise</p><p className="text-sm text-purple-600">10,000 req/min</p></div>
            </div>
          </div>
        </div>)}
      </div>
    </div>
  )
}

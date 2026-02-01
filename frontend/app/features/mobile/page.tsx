'use client'

import { useState } from 'react'

interface Feature { id: string; title: string; description: string; icon: string; category: 'core' | 'productivity' | 'security' | 'communication' }
interface Device { id: string; name: string; platform: 'ios' | 'android'; lastActive: string; status: 'active' | 'inactive'; appVersion: string }
interface NotificationPref { id: string; label: string; description: string; push: boolean; email: boolean; sms: boolean }

const features: Feature[] = [
  { id: 'f1', title: 'Push Notifications', description: 'Real-time alerts for orders, messages, price changes, and shipment updates. Never miss an important business event.', icon: 'N', category: 'communication' },
  { id: 'f2', title: 'Barcode Scanner', description: 'Scan product barcodes and QR codes to instantly look up inventory, check pricing, or add items to orders.', icon: 'S', category: 'productivity' },
  { id: 'f3', title: 'Offline Mode', description: 'Access product catalogs, view recent orders, and draft purchase orders even without internet connectivity.', icon: 'O', category: 'core' },
  { id: 'f4', title: 'Biometric Login', description: 'Secure access with fingerprint or face recognition. Quick and safe authentication for your business account.', icon: 'B', category: 'security' },
  { id: 'f5', title: 'Order Management', description: 'Create, track, and manage all your B2B orders on the go. Approve purchase orders and review invoices anywhere.', icon: 'M', category: 'core' },
  { id: 'f6', title: 'Real-time Chat', description: 'Message suppliers and buyers directly with instant messaging. Share files, images, and documents seamlessly.', icon: 'C', category: 'communication' },
  { id: 'f7', title: 'Document Scanner', description: 'Capture and digitize invoices, receipts, shipping labels, and certificates using your phone camera.', icon: 'D', category: 'productivity' },
  { id: 'f8', title: 'Multi-language Support', description: 'Use the app in 15+ languages including Arabic, French, Swahili, Chinese, and Hindi for global B2B trade.', icon: 'L', category: 'core' },
  { id: 'f9', title: 'Encrypted Data', description: 'End-to-end encryption for all transactions, messages, and sensitive business data stored on device.', icon: 'E', category: 'security' },
  { id: 'f10', title: 'Voice Commands', description: 'Use voice to search products, check order status, or navigate the app hands-free.', icon: 'V', category: 'productivity' },
  { id: 'f11', title: 'Location Services', description: 'Find nearby suppliers, warehouses, and logistics partners with GPS-based location services.', icon: 'G', category: 'core' },
  { id: 'f12', title: 'Two-Factor Auth', description: 'Enhanced security with SMS or authenticator app verification for sensitive operations.', icon: '2', category: 'security' },
]

const devices: Device[] = [
  { id: 'd1', name: 'iPhone 15 Pro', platform: 'ios', lastActive: '2026-01-29 08:30', status: 'active', appVersion: '3.2.1' },
  { id: 'd2', name: 'Samsung Galaxy S24', platform: 'android', lastActive: '2026-01-28 17:45', status: 'active', appVersion: '3.2.0' },
  { id: 'd3', name: 'iPad Pro 12.9"', platform: 'ios', lastActive: '2026-01-25 14:20', status: 'inactive', appVersion: '3.1.8' },
  { id: 'd4', name: 'Pixel 8', platform: 'android', lastActive: '2026-01-10 09:15', status: 'inactive', appVersion: '3.0.5' },
]

const defaultPrefs: NotificationPref[] = [
  { id: 'n1', label: 'Order Updates', description: 'New orders, status changes, and delivery confirmations', push: true, email: true, sms: false },
  { id: 'n2', label: 'Messages', description: 'New messages from suppliers and buyers', push: true, email: false, sms: false },
  { id: 'n3', label: 'Price Alerts', description: 'Price changes on watched products and categories', push: true, email: true, sms: false },
  { id: 'n4', label: 'Shipment Tracking', description: 'Shipment milestones and delivery updates', push: true, email: true, sms: true },
  { id: 'n5', label: 'Payment Notifications', description: 'Payment received, sent, and overdue alerts', push: true, email: true, sms: true },
  { id: 'n6', label: 'Promotions', description: 'Special offers, deals, and marketplace promotions', push: false, email: true, sms: false },
  { id: 'n7', label: 'Security Alerts', description: 'Login attempts, password changes, and security events', push: true, email: true, sms: true },
  { id: 'n8', label: 'Product Updates', description: 'New products in your categories and restock alerts', push: false, email: true, sms: false },
]

export default function MobileAppFeaturesPage() {
  const [tab, setTab] = useState<'download' | 'features' | 'notifications' | 'devices'>('download')
  const [featureFilter, setFeatureFilter] = useState<string>('all')
  const [prefs, setPrefs] = useState(defaultPrefs)

  const filteredFeatures = featureFilter === 'all' ? features : features.filter(f => f.category === featureFilter)

  const togglePref = (id: string, channel: 'push' | 'email' | 'sms') => {
    setPrefs(prev => prev.map(p => p.id === id ? { ...p, [channel]: !p[channel] } : p))
  }

  const catColors: Record<string, string> = { core: 'bg-blue-100 text-blue-800', productivity: 'bg-green-100 text-green-800', security: 'bg-red-100 text-red-800', communication: 'bg-purple-100 text-purple-800' }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mobile App Features</h1>
          <p className="mt-2 text-gray-600">Access the full power of the B2B marketplace from your mobile device. Download the app and manage your business anywhere.</p>
        </div>

        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {[{ k: 'download', l: 'Download' }, { k: 'features', l: 'Features' }, { k: 'notifications', l: 'Notifications' }, { k: 'devices', l: 'Devices' }].map(t => (
              <button key={t.k} onClick={() => setTab(t.k as any)} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${tab === t.k ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{t.l}</button>
            ))}
          </nav>
        </div>

        {tab === 'download' && (<div className="space-y-8">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-8 md:p-12 text-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-3xl font-bold">Channah Marketplace Mobile</h2>
                <p className="mt-4 text-blue-100 text-lg">Manage your B2B operations on the go. Available on iOS and Android.</p>
                <div className="mt-6 flex flex-col sm:flex-row gap-4">
                  <button className="px-6 py-3 bg-white text-blue-700 rounded-xl font-semibold hover:bg-blue-50 transition-colors flex items-center gap-2"><span className="text-xl">A</span> App Store</button>
                  <button className="px-6 py-3 bg-white text-blue-700 rounded-xl font-semibold hover:bg-blue-50 transition-colors flex items-center gap-2"><span className="text-xl">P</span> Google Play</button>
                </div>
                <p className="mt-4 text-blue-200 text-sm">Version 3.2.1 - Updated January 2026</p>
              </div>
              <div className="flex justify-center">
                <div className="w-48 h-80 bg-white/10 rounded-3xl border-2 border-white/20 flex items-center justify-center">
                  <div className="text-center"><p className="text-5xl font-bold">CM</p><p className="text-sm mt-2 text-blue-200">Marketplace</p></div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { label: 'Active Users', value: '45,200+', sub: 'Monthly active users' },
              { label: 'App Rating', value: '4.8/5.0', sub: 'Average store rating' },
              { label: 'Downloads', value: '125K+', sub: 'Total downloads' },
              { label: 'Languages', value: '15+', sub: 'Supported languages' },
            ].map((s, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm text-center">
                <p className="text-3xl font-bold text-gray-900">{s.value}</p>
                <p className="text-sm text-gray-500 mt-1">{s.sub}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Requirements</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-gray-50 rounded-lg"><h4 className="font-semibold text-gray-900 mb-2">iOS</h4><ul className="space-y-1 text-sm text-gray-600"><li>iOS 16.0 or later</li><li>iPhone, iPad, iPod touch</li><li>120 MB storage</li><li>Camera for barcode scanning</li></ul></div>
              <div className="p-4 bg-gray-50 rounded-lg"><h4 className="font-semibold text-gray-900 mb-2">Android</h4><ul className="space-y-1 text-sm text-gray-600"><li>Android 12.0 or later</li><li>Compatible with most devices</li><li>95 MB storage</li><li>Camera for barcode scanning</li></ul></div>
            </div>
          </div>
        </div>)}

        {tab === 'features' && (<div className="space-y-6">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium text-gray-700">Category:</span>
            {['all', 'core', 'productivity', 'security', 'communication'].map(f => (
              <button key={f} onClick={() => setFeatureFilter(f)} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${featureFilter === f ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}`}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFeatures.map(f => (
              <div key={f.id} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center"><span className="text-xl font-bold text-blue-600">{f.icon}</span></div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${catColors[f.category]}`}>{f.category}</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{f.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{f.description}</p>
              </div>
            ))}
          </div>
        </div>)}

        {tab === 'notifications' && (<div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Notification Preferences</h3>
              <p className="text-sm text-gray-500 mt-1">Choose how you want to receive notifications for different events.</p>
            </div>
            <div className="divide-y divide-gray-100">
              <div className="px-6 py-3 bg-gray-50 grid grid-cols-12 gap-4 items-center">
                <div className="col-span-6"><span className="text-xs font-medium text-gray-500 uppercase">Notification Type</span></div>
                <div className="col-span-2 text-center"><span className="text-xs font-medium text-gray-500 uppercase">Push</span></div>
                <div className="col-span-2 text-center"><span className="text-xs font-medium text-gray-500 uppercase">Email</span></div>
                <div className="col-span-2 text-center"><span className="text-xs font-medium text-gray-500 uppercase">SMS</span></div>
              </div>
              {prefs.map(p => (
                <div key={p.id} className="px-6 py-4 grid grid-cols-12 gap-4 items-center hover:bg-gray-50">
                  <div className="col-span-6"><p className="font-medium text-gray-900 text-sm">{p.label}</p><p className="text-xs text-gray-500">{p.description}</p></div>
                  {(['push', 'email', 'sms'] as const).map(ch => (
                    <div key={ch} className="col-span-2 flex justify-center">
                      <button onClick={() => togglePref(p.id, ch)} className={`w-10 h-6 rounded-full transition-colors relative ${p[ch] ? 'bg-blue-600' : 'bg-gray-300'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${p[ch] ? 'translate-x-5' : 'translate-x-1'}`}></div>
                      </button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end">
            <button className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">Save Preferences</button>
          </div>
        </div>)}

        {tab === 'devices' && (<div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div><h3 className="text-lg font-semibold text-gray-900">Registered Devices</h3><p className="text-sm text-gray-500 mt-1">Manage devices linked to your account.</p></div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">{devices.filter(d => d.status === 'active').length} Active</span>
            </div>
            <div className="divide-y divide-gray-100">
              {devices.map(d => (
                <div key={d.id} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${d.platform === 'ios' ? 'bg-gray-100' : 'bg-green-50'}`}>
                      <span className="text-lg font-bold ${d.platform === 'ios' ? 'text-gray-600' : 'text-green-600'}">{d.platform === 'ios' ? 'i' : 'A'}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{d.name}</p>
                      <p className="text-sm text-gray-500">v{d.appVersion} - Last active: {d.lastActive}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${d.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>{d.status === 'active' ? 'Active' : 'Inactive'}</span>
                    <button className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg">Remove</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Device Security</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200"><p className="font-medium text-green-800">Biometric Lock</p><p className="text-sm text-green-600 mt-1">Enabled on 2 devices</p></div>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200"><p className="font-medium text-blue-800">Auto-Lock</p><p className="text-sm text-blue-600 mt-1">5 minute timeout</p></div>
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200"><p className="font-medium text-purple-800">Remote Wipe</p><p className="text-sm text-purple-600 mt-1">Available for all devices</p></div>
            </div>
          </div>
        </div>)}
      </div>
    </div>
  )
}

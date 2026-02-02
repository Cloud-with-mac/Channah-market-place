import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface APIKey {
  id: string
  name: string
  key: string
  maskedKey: string
  createdAt: string
  lastUsed?: string
  isActive: boolean
  permissions: string[]
  expiresAt?: string
}

export interface WebhookEvent {
  id: string
  event: string
  timestamp: string
  status: 'success' | 'failed' | 'pending'
  payload: Record<string, any>
  attempts: number
}

export interface Webhook {
  id: string
  name: string
  url: string
  events: string[]
  isActive: boolean
  createdAt: string
  lastTriggered?: string
  failureReason?: string
}

export interface APIUsageMetrics {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  averageResponseTime: number
  requestsThisMonth: number
  requestsLastMonth: number
}

export interface APIUsageData {
  endpoint: string
  method: string
  count: number
  avgResponseTime: number
  lastUsed: string
  errors: number
}

export interface IntegrationLog {
  id: string
  timestamp: string
  type: 'request' | 'webhook' | 'error' | 'info'
  title: string
  message: string
  metadata?: Record<string, any>
  statusCode?: number
}

interface DeveloperState {
  // API Keys
  apiKeys: APIKey[]
  selectedApiKey?: APIKey
  generateAPIKey: (name: string, permissions: string[], expiresAt?: string) => APIKey
  revokeAPIKey: (keyId: string) => void
  toggleAPIKey: (keyId: string) => void
  getAPIKey: (keyId: string) => APIKey | undefined
  maskAPIKey: (key: string) => string
  copyAPIKey: (keyId: string) => string

  // Webhooks
  webhooks: Webhook[]
  createWebhook: (name: string, url: string, events: string[]) => Webhook
  updateWebhook: (webhookId: string, name: string, url: string, events: string[]) => void
  deleteWebhook: (webhookId: string) => void
  toggleWebhook: (webhookId: string) => void
  testWebhook: (webhookId: string) => Promise<boolean>

  // Webhook Events
  webhookEvents: WebhookEvent[]
  addWebhookEvent: (event: WebhookEvent) => void
  getWebhookEvents: (webhookId: string, limit?: number) => WebhookEvent[]

  // API Usage
  usageMetrics: APIUsageMetrics
  usageData: APIUsageData[]
  recordAPIUsage: (endpoint: string, method: string, responseTime: number, statusCode: number) => void
  getUsageMetrics: () => APIUsageMetrics
  getUsageData: () => APIUsageData[]
  getMonthlyUsageChart: () => { date: string; count: number }[]

  // Integration Logs
  integrationLogs: IntegrationLog[]
  addLog: (
    type: 'request' | 'webhook' | 'error' | 'info',
    title: string,
    message: string,
    metadata?: Record<string, any>,
    statusCode?: number
  ) => void
  getLogs: (type?: string, limit?: number) => IntegrationLog[]
  clearLogs: () => void

  // Utilities
  downloadApiKeyAsEnv: (keyId: string) => string
  exportDocumentation: () => string
}

const generateRandomKey = (): string => {
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 15)
  return `sk_live_${timestamp}${randomPart}`
}

export const useDeveloperStore = create<DeveloperState>()(
  persist(
    (set, get) => ({
      apiKeys: [],
      webhooks: [],
      webhookEvents: [],
      integrationLogs: [],
      usageMetrics: {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        requestsThisMonth: 0,
        requestsLastMonth: 0,
      },
      usageData: [],

      // API Keys
      generateAPIKey: (name, permissions, expiresAt) => {
        const newKey = generateRandomKey()
        const apiKey: APIKey = {
          id: `key-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name,
          key: newKey,
          maskedKey: `${newKey.substring(0, 7)}...${newKey.substring(newKey.length - 4)}`,
          createdAt: new Date().toISOString(),
          isActive: true,
          permissions,
          expiresAt,
        }

        set((state) => ({
          apiKeys: [...state.apiKeys, apiKey],
        }))

        get().addLog(
          'info',
          'API Key Generated',
          `Created new API key "${name}" with permissions: ${permissions.join(', ')}`
        )

        return apiKey
      },

      revokeAPIKey: (keyId) => {
        set((state) => ({
          apiKeys: state.apiKeys.filter((key) => key.id !== keyId),
        }))

        get().addLog('info', 'API Key Revoked', `API key ${keyId} has been revoked`)
      },

      toggleAPIKey: (keyId) => {
        set((state) => ({
          apiKeys: state.apiKeys.map((key) =>
            key.id === keyId ? { ...key, isActive: !key.isActive } : key
          ),
        }))
      },

      getAPIKey: (keyId) => {
        return get().apiKeys.find((key) => key.id === keyId)
      },

      maskAPIKey: (key) => {
        return `${key.substring(0, 7)}...${key.substring(key.length - 4)}`
      },

      copyAPIKey: (keyId) => {
        const apiKey = get().getAPIKey(keyId)
        if (apiKey) {
          return apiKey.key
        }
        return ''
      },

      // Webhooks
      createWebhook: (name, url, events) => {
        const newWebhook: Webhook = {
          id: `webhook-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name,
          url,
          events,
          isActive: true,
          createdAt: new Date().toISOString(),
        }

        set((state) => ({
          webhooks: [...state.webhooks, newWebhook],
        }))

        get().addLog('info', 'Webhook Created', `Created webhook "${name}" for events: ${events.join(', ')}`)

        return newWebhook
      },

      updateWebhook: (webhookId, name, url, events) => {
        set((state) => ({
          webhooks: state.webhooks.map((webhook) =>
            webhook.id === webhookId
              ? {
                  ...webhook,
                  name,
                  url,
                  events,
                }
              : webhook
          ),
        }))

        get().addLog('info', 'Webhook Updated', `Updated webhook ${webhookId}`)
      },

      deleteWebhook: (webhookId) => {
        set((state) => ({
          webhooks: state.webhooks.filter((webhook) => webhook.id !== webhookId),
        }))

        get().addLog('info', 'Webhook Deleted', `Deleted webhook ${webhookId}`)
      },

      toggleWebhook: (webhookId) => {
        set((state) => ({
          webhooks: state.webhooks.map((webhook) =>
            webhook.id === webhookId ? { ...webhook, isActive: !webhook.isActive } : webhook
          ),
        }))
      },

      testWebhook: async (webhookId) => {
        const webhook = get().webhooks.find((w) => w.id === webhookId)
        if (!webhook) return false

        try {
          const startTime = Date.now()
          const response = await fetch(webhook.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Webhook-Test': 'true',
            },
            body: JSON.stringify({
              id: `event-${Date.now()}`,
              event: 'webhook.test',
              timestamp: new Date().toISOString(),
              data: {
                message: 'This is a test webhook',
              },
            }),
          })

          const responseTime = Date.now() - startTime

          set((state) => ({
            webhooks: state.webhooks.map((w) =>
              w.id === webhookId
                ? {
                    ...w,
                    lastTriggered: new Date().toISOString(),
                    failureReason: response.ok ? undefined : `HTTP ${response.status}`,
                  }
                : w
            ),
          }))

          get().addLog(
            response.ok ? 'info' : 'error',
            'Webhook Test',
            `Test webhook ${webhook.name} - Response: ${response.status}`,
            { responseTime, statusCode: response.status }
          )

          return response.ok
        } catch (error) {
          get().addLog(
            'error',
            'Webhook Test Failed',
            `Test webhook ${webhook.name} failed: ${error instanceof Error ? error.message : String(error)}`
          )

          set((state) => ({
            webhooks: state.webhooks.map((w) =>
              w.id === webhookId
                ? {
                    ...w,
                    failureReason: 'Connection failed',
                  }
                : w
            ),
          }))

          return false
        }
      },

      // Webhook Events
      addWebhookEvent: (event) => {
        set((state) => ({
          webhookEvents: [event, ...state.webhookEvents].slice(0, 1000), // Keep last 1000 events
        }))
      },

      getWebhookEvents: (webhookId, limit = 50) => {
        return get().webhookEvents.slice(0, limit)
      },

      // API Usage
      recordAPIUsage: (endpoint, method, responseTime, statusCode) => {
        set((state) => {
          const existingData = state.usageData.find((d) => d.endpoint === endpoint && d.method === method)
          const newUsageData = existingData
            ? state.usageData.map((d) =>
                d.endpoint === endpoint && d.method === method
                  ? {
                      ...d,
                      count: d.count + 1,
                      avgResponseTime: (d.avgResponseTime + responseTime) / 2,
                      lastUsed: new Date().toISOString(),
                      errors: statusCode >= 400 ? d.errors + 1 : d.errors,
                    }
                  : d
              )
            : [
                ...state.usageData,
                {
                  endpoint,
                  method,
                  count: 1,
                  avgResponseTime: responseTime,
                  lastUsed: new Date().toISOString(),
                  errors: statusCode >= 400 ? 1 : 0,
                },
              ]

          const totalRequests = state.usageMetrics.totalRequests + 1
          const successfulRequests = statusCode < 400 ? state.usageMetrics.successfulRequests + 1 : state.usageMetrics.successfulRequests
          const failedRequests = statusCode >= 400 ? state.usageMetrics.failedRequests + 1 : state.usageMetrics.failedRequests

          return {
            usageData: newUsageData,
            usageMetrics: {
              ...state.usageMetrics,
              totalRequests,
              successfulRequests,
              failedRequests,
              averageResponseTime:
                (state.usageMetrics.averageResponseTime + responseTime) / 2,
              requestsThisMonth: state.usageMetrics.requestsThisMonth + 1,
            },
          }
        })
      },

      getUsageMetrics: () => {
        return get().usageMetrics
      },

      getUsageData: () => {
        return get().usageData
      },

      getMonthlyUsageChart: () => {
        const data = []
        const today = new Date()
        for (let i = 29; i >= 0; i--) {
          const date = new Date(today)
          date.setDate(date.getDate() - i)
          const dateStr = date.toISOString().split('T')[0]
          // Mock data - in production this would be calculated from logs
          data.push({
            date: dateStr,
            count: Math.floor(Math.random() * 100) + 10,
          })
        }
        return data
      },

      // Integration Logs
      addLog: (type, title, message, metadata, statusCode) => {
        const newLog: IntegrationLog = {
          id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
          type,
          title,
          message,
          metadata,
          statusCode,
        }

        set((state) => ({
          integrationLogs: [newLog, ...state.integrationLogs].slice(0, 1000), // Keep last 1000 logs
        }))
      },

      getLogs: (type, limit = 100) => {
        const logs = get().integrationLogs
        const filtered = type ? logs.filter((log) => log.type === type) : logs
        return filtered.slice(0, limit)
      },

      clearLogs: () => {
        set({ integrationLogs: [] })
      },

      // Utilities
      downloadApiKeyAsEnv: (keyId) => {
        const apiKey = get().getAPIKey(keyId)
        if (!apiKey) return ''

        return `MARKETPLACE_API_KEY=${apiKey.key}
MARKETPLACE_API_KEY_NAME=${apiKey.name}
MARKETPLACE_API_CREATED_AT=${apiKey.createdAt}
${apiKey.expiresAt ? `MARKETPLACE_API_EXPIRES_AT=${apiKey.expiresAt}` : ''}
`
      },

      exportDocumentation: () => {
        const state = get()
        const apiKeys = state.apiKeys
        const webhooks = state.webhooks

        return `# B2B Marketplace Developer Documentation Export
Generated: ${new Date().toISOString()}

## API Keys (${apiKeys.length})
${apiKeys
  .map(
    (key) => `
- Name: ${key.name}
  Status: ${key.isActive ? 'Active' : 'Inactive'}
  Created: ${key.createdAt}
  Permissions: ${key.permissions.join(', ')}
  Expires: ${key.expiresAt || 'Never'}
`
  )
  .join('\n')}

## Webhooks (${webhooks.length})
${webhooks
  .map(
    (hook) => `
- Name: ${hook.name}
  URL: ${hook.url}
  Status: ${hook.isActive ? 'Active' : 'Inactive'}
  Events: ${hook.events.join(', ')}
  Created: ${hook.createdAt}
  Last Triggered: ${hook.lastTriggered || 'Never'}
`
  )
  .join('\n')}

## Usage Metrics
- Total Requests: ${state.usageMetrics.totalRequests}
- Successful Requests: ${state.usageMetrics.successfulRequests}
- Failed Requests: ${state.usageMetrics.failedRequests}
- Average Response Time: ${state.usageMetrics.averageResponseTime.toFixed(2)}ms
- Requests This Month: ${state.usageMetrics.requestsThisMonth}
`
      },
    }),
    {
      name: 'channah-developer',
    }
  )
)

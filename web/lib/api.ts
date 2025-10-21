import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Dashboard APIs
export const dashboardApi = {
  getStats: async (companyId: number = 1) => {
    const response = await api.get(`/dashboard/stats?companyId=${companyId}`)
    return response.data
  },

  getImpact: async (companyId: number = 1) => {
    const response = await api.get(`/dashboard/impact?companyId=${companyId}`)
    return response.data
  },

  getOvernight: async (companyId: number = 1) => {
    const response = await api.get(`/dashboard/overnight?companyId=${companyId}`)
    return response.data
  },

  getActions: async (companyId: number = 1, limit: number = 10) => {
    const response = await api.get(`/dashboard/actions?companyId=${companyId}&limit=${limit}`)
    return response.data
  },

  getRevenueTimeline: async (companyId: number = 1, days: number = 7) => {
    const response = await api.get(`/dashboard/revenue-timeline?companyId=${companyId}&days=${days}`)
    return response.data
  },

  getAutomation: async (companyId: number = 1, days: number = 30) => {
    const response = await api.get(`/dashboard/automation?companyId=${companyId}&days=${days}`)
    return response.data
  },
}

// WhatsApp APIs
export const whatsappApi = {
  getSessions: async (companyId: number = 1) => {
    const response = await api.get(`/whatsapp/sessions?companyId=${companyId}`)
    return response.data.sessions
  },

  createSession: async (data: {
    companyId: number
    sessionName: string
    wahaUrl: string
    wahaApiKey: string
  }) => {
    const response = await api.post('/whatsapp/sessions', data)
    return response.data.session
  },

  startSession: async (sessionId: number, method: 'qr' | 'pairing') => {
    const response = await api.post(`/whatsapp/sessions/${sessionId}/start`, { method })
    return response.data
  },

  getSessionStatus: async (sessionId: number) => {
    const response = await api.get(`/whatsapp/sessions/${sessionId}/status`)
    return response.data
  },

  stopSession: async (sessionId: number) => {
    const response = await api.post(`/whatsapp/sessions/${sessionId}/stop`)
    return response.data
  },

  deleteSession: async (sessionId: number) => {
    const response = await api.delete(`/whatsapp/sessions/${sessionId}`)
    return response.data
  },

  testSession: async (sessionId: number, phoneNumber: string, message?: string) => {
    const response = await api.post(`/whatsapp/sessions/${sessionId}/test`, {
      phoneNumber,
      message,
    })
    return response.data
  },
}

// Health check
export const healthApi = {
  check: async () => {
    const response = await api.get('/health', { baseURL: API_URL.replace('/api', '') })
    return response.data
  },
}

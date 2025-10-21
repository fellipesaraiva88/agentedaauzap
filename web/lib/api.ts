import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Multitenancy interceptor - adds companyId to all requests
api.interceptors.request.use(
  (config) => {
    // Get current company ID from localStorage
    const companyId = localStorage.getItem('selectedCompanyId')

    // Add authorization token if exists
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // Add companyId to query params if exists
    if (companyId) {
      // Parse existing URL to properly handle query params
      const separator = config.url?.includes('?') ? '&' : '?'

      // Don't add companyId to auth endpoints or if already present
      const skipEndpoints = ['/auth', '/login', '/register', '/companies']
      const shouldSkip = skipEndpoints.some(endpoint => config.url?.includes(endpoint))
      const hasCompanyId = config.url?.includes('companyId=')

      if (!shouldSkip && !hasCompanyId) {
        config.url = `${config.url}${separator}companyId=${companyId}`
      }
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      // Clear auth data and redirect to login
      localStorage.removeItem('token')
      localStorage.removeItem('selectedCompanyId')

      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

// Types
export interface Company {
  id: string
  name: string
  slug: string
  createdAt?: string
  updatedAt?: string
}
export interface Appointment {
  id: number
  petNome: string
  tutorNome: string
  serviceName: string
  dataAgendamento: string
  horaAgendamento: string
  status: string
  preco: number
  tutorTelefone?: string
  observacoes?: string
  serviceId?: number
}

export interface Service {
  id: number
  companyId: number
  nome: string
  descricao: string
  categoria: string
  subcategoria: string
  duracaoMinutos: number
  precos: {
    pequeno?: number
    medio?: number
    grande?: number
    base?: number
  }
  requerAgendamento: boolean
  permiteWalkIn: boolean
  ativo: boolean
}

// Dashboard APIs - Now using interceptor, no need for manual companyId
export const dashboardApi = {
  getStats: async () => {
    const response = await api.get('/dashboard/stats')
    return response.data
  },

  getImpact: async () => {
    const response = await api.get('/dashboard/impact')
    return response.data
  },

  getOvernight: async () => {
    const response = await api.get('/dashboard/overnight')
    return response.data
  },

  getActions: async (limit: number = 10) => {
    const response = await api.get(`/dashboard/actions?limit=${limit}`)
    return response.data
  },

  getRevenueTimeline: async (days: number = 7) => {
    const response = await api.get(`/dashboard/revenue-timeline?days=${days}`)
    return response.data
  },

  getAutomation: async (days: number = 30) => {
    const response = await api.get(`/dashboard/automation?days=${days}`)
    return response.data
  },
}

// WhatsApp APIs - Now using interceptor, no need for manual companyId
export const whatsappApi = {
  getSessions: async () => {
    const response = await api.get('/whatsapp/sessions')
    return response.data.sessions
  },

  createSession: async (data: {
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

// Appointments APIs
export const appointmentsApi = {
  list: async (params?: { status?: string; serviceId?: number }) => {
    const response = await api.get('/appointments', { params })
    return response.data
  },

  get: async (id: number) => {
    const response = await api.get(`/appointments/${id}`)
    return response.data
  },

  create: async (data: Partial<Appointment>) => {
    const response = await api.post('/appointments', data)
    return response.data
  },

  update: async (id: number, data: Partial<Appointment>) => {
    const response = await api.put(`/appointments/${id}`, data)
    return response.data
  },

  delete: async (id: number) => {
    const response = await api.delete(`/appointments/${id}`)
    return response.data
  },

  updateStatus: async (id: number, status: string) => {
    const response = await api.patch(`/appointments/${id}/status`, { status })
    return response.data
  },

  cancel: async (id: number) => {
    const response = await api.patch(`/appointments/${id}/cancel`)
    return response.data
  },

  reschedule: async (id: number, dataAgendamento: string, horaAgendamento: string) => {
    const response = await api.patch(`/appointments/${id}/reschedule`, {
      dataAgendamento,
      horaAgendamento
    })
    return response.data
  },
}

// Services APIs (part of appointments API)
export const servicesApi = {
  list: async () => {
    const response = await api.get('/appointments/services')
    return response.data
  },

  get: async (id: number) => {
    const response = await api.get(`/appointments/services/${id}`)
    return response.data
  },

  create: async (data: Partial<Service>) => {
    const response = await api.post('/appointments/services', data)
    return response.data
  },

  update: async (id: number, data: Partial<Service>) => {
    const response = await api.put(`/appointments/services/${id}`, data)
    return response.data
  },

  delete: async (id: number) => {
    const response = await api.delete(`/appointments/services/${id}`)
    return response.data
  },
}

// Conversations APIs
export interface Conversation {
  id: string
  chatId: string
  companyId: number
  clientName: string
  clientPhone: string
  lastMessage: string
  lastMessageAt: string
  unreadCount: number
  status: 'new' | 'replied' | 'archived'
  createdAt: string
  updatedAt: string
}

export interface Message {
  id: string
  chatId: string
  from: string
  to: string
  body: string
  timestamp: string
  fromMe: boolean
  ack: number
  hasMedia: boolean
  mediaUrl?: string
  quotedMsgId?: string
}

export const conversationsApi = {
  list: async (params?: {
    status?: string
    search?: string
    startDate?: string
    endDate?: string
    page?: number
    limit?: number
  }) => {
    const response = await api.get('/conversations', { params })
    return response.data
  },

  get: async (chatId: string) => {
    const response = await api.get(`/conversations/${chatId}`)
    return response.data
  },

  getMessages: async (chatId: string, params?: {
    page?: number
    limit?: number
  }) => {
    const response = await api.get(`/conversations/${chatId}/messages`, { params })
    return response.data
  },

  updateStatus: async (chatId: string, status: 'new' | 'replied' | 'archived') => {
    const response = await api.patch(`/conversations/${chatId}/status`, { status })
    return response.data
  },

  markAsRead: async (chatId: string) => {
    const response = await api.patch(`/conversations/${chatId}/read`)
    return response.data
  },
}

// Settings APIs
export interface CompanySettings {
  id: number
  companyId: number
  companyName: string
  agentName: string
  openingTime: string
  closingTime: string
  maxConcurrentCapacity: number
  timezone: string
  reminders: {
    d1Active: boolean
    h12Active: boolean
    h4Active: boolean
    h1Active: boolean
  }
  createdAt: string
  updatedAt: string
}

export interface SettingsUpdateData {
  company_name?: string
  agent_name?: string
  opening_time?: string
  closing_time?: string
  max_concurrent_capacity?: number
  timezone?: string
  reminder_d1_active?: boolean
  reminder_12h_active?: boolean
  reminder_4h_active?: boolean
  reminder_1h_active?: boolean
}

export const settingsApi = {
  get: async () => {
    const response = await api.get('/settings')
    return response.data.settings as CompanySettings
  },

  update: async (data: SettingsUpdateData) => {
    const response = await api.put('/settings', data)
    return response.data.settings as CompanySettings
  },
}

// Availability APIs (stub - implementar futuramente se necessário)
export const availabilityApi = {}

// Companies API
export const companiesApi = {
  list: async () => {
    const response = await api.get('/companies')
    return response.data
  },

  get: async (id: string) => {
    const response = await api.get(`/companies/${id}`)
    return response.data
  },

  create: async (data: Partial<Company>) => {
    const response = await api.post('/companies', data)
    return response.data
  },

  update: async (id: string, data: Partial<Company>) => {
    const response = await api.put(`/companies/${id}`, data)
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

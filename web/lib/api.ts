import axios from 'axios'

// API URL configuration - defaults to local backend
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

console.log('🔗 API conectando em:', API_URL)

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false, // Altere para true se usar cookies
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

// ============================================================================
// NOTIFICATIONS API
// ============================================================================

export interface Notification {
  id: number
  company_id: number
  user_id?: number
  tipo: 'info' | 'warning' | 'error' | 'success'
  titulo: string
  mensagem: string
  nivel: 'low' | 'medium' | 'high' | 'critical'
  lida: boolean
  arquivada: boolean
  acao_url?: string
  acao_label?: string
  created_at: string
  updated_at: string
}

export interface NotificationFilters {
  lida?: boolean
  arquivada?: boolean
  tipo?: 'info' | 'warning' | 'error' | 'success'
  nivel?: 'low' | 'medium' | 'high' | 'critical'
  limit?: number
  offset?: number
}

export interface CreateNotificationData {
  tipo: 'info' | 'warning' | 'error' | 'success'
  titulo: string
  mensagem: string
  nivel?: 'low' | 'medium' | 'high' | 'critical'
  user_id?: number
  acao_url?: string
  acao_label?: string
}

export const notificationsApi = {
  // List notifications with filters
  list: async (filters?: NotificationFilters) => {
    const response = await api.get('/notifications', { params: filters })
    return response.data
  },

  // Get unread notifications only
  getUnread: async () => {
    const response = await api.get('/notifications/unread')
    return response.data
  },

  // Get unread count
  getCount: async () => {
    const response = await api.get('/notifications/count')
    return response.data
  },

  // Get single notification by ID
  get: async (id: number) => {
    const response = await api.get(`/notifications/${id}`)
    return response.data
  },

  // Create new notification
  create: async (data: CreateNotificationData) => {
    const response = await api.post('/notifications', data)
    return response.data
  },

  // Mark as read
  markAsRead: async (id: number) => {
    const response = await api.patch(`/notifications/${id}/read`)
    return response.data
  },

  // Mark as unread
  markAsUnread: async (id: number) => {
    const response = await api.patch(`/notifications/${id}/unread`)
    return response.data
  },

  // Archive notification
  archive: async (id: number) => {
    const response = await api.patch(`/notifications/${id}/archive`)
    return response.data
  },

  // Mark all as read
  markAllAsRead: async () => {
    const response = await api.post('/notifications/mark-all-read')
    return response.data
  },

  // Delete notification
  delete: async (id: number) => {
    const response = await api.delete(`/notifications/${id}`)
    return response.data
  },

  // Cleanup old notifications
  cleanup: async (days: number = 30) => {
    const response = await api.post('/notifications/cleanup', { days })
    return response.data
  },
}

// ============================================================================
// STATS API
// ============================================================================

export interface DashboardStats {
  tutors: {
    total: number
    vip: number
    vipPercentage: number
  }
  appointments: {
    total: number
    pending: number
    confirmed: number
    completed: number
  }
  revenue: {
    currentMonth: number
    lastMonth: number
    growth: number
    growthFormatted: string
  }
  conversations: {
    last24h: number
  }
  timestamp: string
}

export interface AppointmentStatsParams {
  period?: 'day' | 'week' | 'month' | 'year'
  startDate?: string
  endDate?: string
}

export interface RevenueStatsParams {
  period?: 'week' | 'month' | 'year'
  groupBy?: 'day' | 'week' | 'month'
}

export const statsApi = {
  // Dashboard overview stats
  getDashboard: async () => {
    const response = await api.get('/stats/dashboard')
    return response.data
  },

  // Detailed appointment stats
  getAppointments: async (params?: AppointmentStatsParams) => {
    const response = await api.get('/stats/appointments', { params })
    return response.data
  },

  // Revenue stats with timeline
  getRevenue: async (params?: RevenueStatsParams) => {
    const response = await api.get('/stats/revenue', { params })
    return response.data
  },

  // Client/Tutor stats
  getClients: async () => {
    const response = await api.get('/stats/clients')
    return response.data
  },

  // Service performance stats
  getServices: async () => {
    const response = await api.get('/stats/services')
    return response.data
  },

  // Conversation stats
  getConversations: async () => {
    const response = await api.get('/stats/conversations')
    return response.data
  },

  // Night activity (22h-8h)
  getNightActivity: async () => {
    const response = await api.get('/stats/night-activity')
    return response.data
  },

  // AI Impact metrics
  getImpact: async () => {
    const response = await api.get('/stats/impact')
    return response.data
  },

  // Revenue timeline by hour
  getRevenueTimeline: async () => {
    const response = await api.get('/stats/revenue-timeline')
    return response.data
  },

  // Automation stats
  getAutomation: async () => {
    const response = await api.get('/stats/automation')
    return response.data
  },
}

// ============================================================================
// PETS API
// ============================================================================

export interface Pet {
  id: number
  company_id: number
  tutor_id: number
  nome: string
  especie: string
  raca?: string
  idade?: number
  peso?: number
  porte: 'pequeno' | 'medio' | 'grande'
  sexo?: 'macho' | 'femea'
  observacoes?: string
  created_at: string
  updated_at: string
}

export interface CreatePetData {
  tutor_id: number
  nome: string
  especie: string
  raca?: string
  idade?: number
  peso?: number
  porte: 'pequeno' | 'medio' | 'grande'
  sexo?: 'macho' | 'femea'
  observacoes?: string
}

export const petsApi = {
  // List all pets
  list: async (params?: { tutor_id?: number; limit?: number; offset?: number }) => {
    const response = await api.get('/pets', { params })
    return response.data
  },

  // Get single pet
  get: async (id: number) => {
    const response = await api.get(`/pets/${id}`)
    return response.data
  },

  // Create pet
  create: async (data: CreatePetData) => {
    const response = await api.post('/pets', data)
    return response.data
  },

  // Update pet
  update: async (id: number, data: Partial<CreatePetData>) => {
    const response = await api.put(`/pets/${id}`, data)
    return response.data
  },

  // Delete pet
  delete: async (id: number) => {
    const response = await api.delete(`/pets/${id}`)
    return response.data
  },
}

// ============================================================================
// TUTORS API
// ============================================================================

export interface Tutor {
  id: number
  company_id: number
  nome: string
  telefone: string
  email?: string
  endereco?: string
  cidade?: string
  estado?: string
  cep?: string
  data_nascimento?: string
  cpf?: string
  observacoes?: string
  is_vip: boolean
  is_inativo: boolean
  preferencias?: Record<string, any>
  tags?: string[]
  created_at: string
  updated_at: string
}

export interface CreateTutorData {
  nome: string
  telefone: string
  email?: string
  endereco?: string
  cidade?: string
  estado?: string
  cep?: string
  data_nascimento?: string
  cpf?: string
  observacoes?: string
  is_vip?: boolean
  preferencias?: Record<string, any>
  tags?: string[]
}

export const tutorsApi = {
  // List tutors with filters
  list: async (params?: {
    search?: string
    is_vip?: boolean
    is_inativo?: boolean
    limit?: number
    offset?: number
  }) => {
    const response = await api.get('/tutors', { params })
    return response.data
  },

  // Get single tutor
  get: async (id: number) => {
    const response = await api.get(`/tutors/${id}`)
    return response.data
  },

  // Get tutor by phone
  getByPhone: async (telefone: string) => {
    const response = await api.get(`/tutors/phone/${telefone}`)
    return response.data
  },

  // Create tutor
  create: async (data: CreateTutorData) => {
    const response = await api.post('/tutors', data)
    return response.data
  },

  // Update tutor
  update: async (id: number, data: Partial<CreateTutorData>) => {
    const response = await api.put(`/tutors/${id}`, data)
    return response.data
  },

  // Toggle VIP status
  toggleVip: async (id: number) => {
    const response = await api.patch(`/tutors/${id}/toggle-vip`)
    return response.data
  },

  // Toggle inactive status
  toggleInactive: async (id: number) => {
    const response = await api.patch(`/tutors/${id}/toggle-inactive`)
    return response.data
  },

  // Delete tutor
  delete: async (id: number) => {
    const response = await api.delete(`/tutors/${id}`)
    return response.data
  },
}

import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export interface Appointment {
  id: number
  companyId: number
  chatId: string
  serviceId: number
  serviceName: string
  tutorNome: string
  tutorTelefone?: string
  petNome: string
  petTipo: string
  petRaca?: string
  petIdade?: number
  petPorte?: 'pequeno' | 'medio' | 'grande'
  dataAgendamento: string
  horaAgendamento: string
  status: 'pendente' | 'confirmado' | 'em_atendimento' | 'concluido' | 'cancelado' | 'nao_compareceu'
  preco: number
  observacoes?: string
  createdAt: string
  updatedAt: string
}

export interface Service {
  id: number
  companyId: number
  nome: string
  descricao: string
  categoria: string
  duracaoMinutos: number
  precos: {
    pequeno?: number
    medio?: number
    grande?: number
  }
  ativo: boolean
  upsellSuggestions?: string[]
}

export interface AppointmentStats {
  total: number
  concluidos: number
  cancelados: number
  pendentes: number
  receitaTotal: number
  valorMedio: number
}

export interface AvailabilitySlot {
  hora_inicio: string
  hora_fim: string
  disponivel: boolean
  agendamentos_existentes: number
  capacidade_maxima: number
}

export const appointmentsApi = {
  list: async (params?: {
    companyId?: number
    chatId?: string
    status?: string
    dataInicio?: string
    dataFim?: string
    serviceId?: number
  }) => {
    const { data } = await api.get<{ success: boolean; data: Appointment[]; total: number }>('/appointments', { params })
    return data
  },

  getById: async (id: number) => {
    const { data } = await api.get<{ success: boolean; data: Appointment }>(`/appointments/${id}`)
    return data
  },

  create: async (appointment: Partial<Appointment>) => {
    const { data } = await api.post<{ success: boolean; appointment: Appointment }>('/appointments', appointment)
    return data
  },

  cancel: async (id: number, motivo?: string) => {
    const { data } = await api.patch<{ success: boolean }>(`/appointments/${id}/cancel`, { motivo })
    return data
  },

  reschedule: async (id: number, dataAgendamento: string, horaAgendamento: string) => {
    const { data } = await api.patch<{ success: boolean }>(`/appointments/${id}/reschedule`, {
      dataAgendamento,
      horaAgendamento,
    })
    return data
  },

  updateStatus: async (id: number, status: Appointment['status']) => {
    const { data } = await api.patch<{ success: boolean }>(`/appointments/${id}/status`, { status })
    return data
  },

  getToday: async (companyId?: number) => {
    const { data } = await api.get<{ success: boolean; data: Appointment[] }>('/appointments/special/today', {
      params: { companyId },
    })
    return data
  },

  getStats: async (params?: { companyId?: number; dataInicio?: string; dataFim?: string }) => {
    const { data } = await api.get<{ success: boolean; data: AppointmentStats }>('/appointments/special/stats', {
      params,
    })
    return data
  },
}

export const servicesApi = {
  list: async (companyId?: number) => {
    const { data } = await api.get<{ success: boolean; data: Service[]; total: number }>('/services', {
      params: { companyId },
    })
    return data
  },
}

export const availabilityApi = {
  check: async (params: {
    companyId: number
    serviceId: number
    dataAgendamento: string
    horaAgendamento: string
  }) => {
    const { data } = await api.post<{
      success: boolean
      data: {
        disponivel: boolean
        motivo?: string
        sugestoes: string[]
      }
    }>('/availability/check', params)
    return data
  },

  getSlots: async (params: { companyId?: number; serviceId: number; data: string; intervalo?: number }) => {
    const { data } = await api.get<{ success: boolean; data: AvailabilitySlot[]; total: number; available: number }>(
      '/availability/slots',
      { params }
    )
    return data
  },
}

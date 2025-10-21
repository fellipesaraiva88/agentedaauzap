/**
 * TypeScript Types for Backend APIs
 * Generated from backend API routes
 */

// ============================================================================
// NOTIFICATIONS API TYPES
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

export interface NotificationListResponse {
  success: boolean
  data: Notification[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

export interface NotificationResponse {
  success: boolean
  data: Notification
  message?: string
}

export interface NotificationCountResponse {
  success: boolean
  count: number
}

// ============================================================================
// STATS API TYPES
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

export interface AppointmentStats {
  period: {
    start: string
    end: string
    type: 'day' | 'week' | 'month' | 'year'
  }
  summary: {
    total: number
    pendente: number
    confirmado: number
    concluido: number
    cancelado: number
    receitaTotal: number
    ticketMedio: number
    clientesUnicos: number
    taxaCancelamento: number
  }
  popularServices: {
    servico: string
    total_agendamentos: number
    receita: number
  }[]
  hourDistribution: {
    hora: number
    total: number
  }[]
}

export interface RevenueStats {
  period: {
    start: string
    end: string
    type: 'week' | 'month' | 'year'
  }
  groupBy: 'day' | 'week' | 'month'
  summary: {
    totalReceita: number
    totalAgendamentos: number
    ticketMedioGeral: number
  }
  timeline: {
    periodo: string
    receita: number
    agendamentos: number
    ticketMedio: number
  }[]
}

export interface ClientStats {
  summary: {
    total: number
    vip: number
    active: number
    inactive: number
    newThisMonth: number
    withPets: number
    avgPetsPerClient: number
    vipPercentage: number
  }
  topClients: {
    nome: string
    telefone: string
    isVip: boolean
    totalAgendamentos: number
    valorTotalGasto: number
  }[]
}

export interface ServiceStats {
  summary: {
    totalReceita: number
    totalAgendamentos: number
    servicosAtivos: number
  }
  services: {
    id: number
    nome: string
    categoria: string
    subcategoria: string
    totalAgendamentos: number
    concluidos: number
    cancelados: number
    receitaTotal: number
    precoMedio: number
    avaliacaoMedia: number
    taxaCancelamento: number
  }[]
}

export interface ConversationStats {
  total: number
  sentimento: {
    positivo: number
    neutro: number
    negativo: number
  }
  intencao: {
    agendamento: number
    cancelamento: number
    informacao: number
    reclamacao: number
  }
  qualidadeMedia: number
}

export interface NightActivityStats {
  period: {
    start: string
    end: string
  }
  clientesAtendidos: number
  agendamentosConfirmados: number
  vendasFechadas: number
  followupsEnviados: number
}

export interface ImpactStats {
  horasTrabalhadasIA: number
  valorEconomico: number
  vendasFechadas: number
  diasEconomizados: number
}

export interface RevenueTimeline {
  date: string
  totalReceita: number
  timeline: {
    hora: number
    receita: number
  }[]
}

export interface AutomationStats {
  totalAtendimentos: number
  automatico: number
  manual: number
  taxaAutomacao: number
  percentualAutomatico: number
  percentualManual: number
}

export interface StatsResponse<T> {
  success: boolean
  data: T
  cached?: boolean
}

// ============================================================================
// SERVICES API TYPES
// ============================================================================

export interface Service {
  id: number
  company_id: number
  nome: string
  descricao: string
  categoria: string
  subcategoria: string
  duracao_minutos: number
  precos: {
    pequeno?: number
    medio?: number
    grande?: number
    base?: number
  }
  requer_agendamento: boolean
  permite_walkin: boolean
  popular: boolean
  ativo: boolean
  ordem: number
  created_at: string
  updated_at: string
}

export interface ServiceFilters {
  ativo?: boolean
  categoria?: string
  popular?: boolean
  limit?: number
  offset?: number
}

export interface ServiceListResponse {
  success: boolean
  data: Service[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

export interface ServiceResponse {
  success: boolean
  data: Service
}

// ============================================================================
// PETS API TYPES
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

export interface UpdatePetData {
  nome?: string
  especie?: string
  raca?: string
  idade?: number
  peso?: number
  porte?: 'pequeno' | 'medio' | 'grande'
  sexo?: 'macho' | 'femea'
  observacoes?: string
}

// ============================================================================
// TUTORS API TYPES
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

export interface UpdateTutorData {
  nome?: string
  telefone?: string
  email?: string
  endereco?: string
  cidade?: string
  estado?: string
  cep?: string
  data_nascimento?: string
  cpf?: string
  observacoes?: string
  is_vip?: boolean
  is_inativo?: boolean
  preferencias?: Record<string, any>
  tags?: string[]
}

// ============================================================================
// COMPANIES API TYPES
// ============================================================================

export interface Company {
  id: number
  nome: string
  slug: string
  email?: string
  telefone?: string
  endereco?: string
  cidade?: string
  estado?: string
  cep?: string
  cnpj?: string
  descricao?: string
  logo_url?: string
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface CreateCompanyData {
  nome: string
  slug: string
  email?: string
  telefone?: string
  cnpj?: string
}

export interface UpdateCompanyData {
  nome?: string
  slug?: string
  email?: string
  telefone?: string
  endereco?: string
  cidade?: string
  estado?: string
  cep?: string
  cnpj?: string
  descricao?: string
  logo_url?: string
  ativo?: boolean
}

// ============================================================================
// GENERIC API RESPONSE TYPES
// ============================================================================

export interface ApiSuccessResponse<T> {
  success: true
  data: T
  message?: string
}

export interface ApiErrorResponse {
  success: false
  error: string
  message: string
  details?: any
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse

export interface PaginationParams {
  limit?: number
  offset?: number
  page?: number
}

export interface PaginationMeta {
  total: number
  limit: number
  offset: number
  hasMore: boolean
  page?: number
  totalPages?: number
}

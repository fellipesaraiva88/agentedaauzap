/**
 * API Client Extendido - Todos os Endpoints
 * Arquivo com todas as funções de API organizadas por recurso
 */

import { api } from './api';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface Product {
  id: number;
  company_id: number;
  codigo?: string;
  nome: string;
  descricao?: string;
  categoria?: string;
  marca?: string;
  preco_custo?: number;
  preco_venda: number;
  preco_promocional?: number;
  estoque_atual: number;
  estoque_minimo: number;
  estoque_maximo?: number;
  unidade_medida?: string;
  ativo: boolean;
  venda_online: boolean;
  destaque: boolean;
  imagem_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: number;
  company_id: number;
  nome: string;
  descricao?: string;
  categoria?: string;
  duracaoMinutos: number;
  precos: {
    pequeno?: number;
    medio?: number;
    grande?: number;
    gigante?: number;
  };
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Tutor {
  id: string;
  company_id: number;
  nome: string;
  telefone?: string;
  email?: string;
  cpf?: string;
  endereco?: string;
  is_vip: boolean;
  is_inativo: boolean;
  total_servicos: number;
  valor_total_gasto: number;
  taxa_conversao: number;
  ticket_medio?: number;
  cliente_desde: string;
  ultima_interacao: string;
  tags?: string[];
  observacoes?: string;
}

export interface Pet {
  id: number;
  tutor_id: string;
  nome: string;
  tipo?: string;
  raca?: string;
  porte?: string;
  idade?: number;
  foto_url?: string;
}

export interface Notification {
  id: number;
  company_id: number;
  tipo: string;
  titulo: string;
  mensagem: string;
  nivel: 'info' | 'warning' | 'error' | 'success';
  lida: boolean;
  link_acao?: string;
  created_at: string;
}

export interface Conversation {
  id: number;
  tutor_id: string;
  tutor_nome: string;
  data_inicio: string;
  duracao_minutos?: number;
  resumo?: string;
  intencao?: string;
  sentimento_predominante?: string;
  converteu: boolean;
  acoes_ia?: string[];
}

// ============================================================================
// PRODUCTS API
// ============================================================================

export const productsApi = {
  /**
   * Lista todos os produtos
   */
  list: async () => {
    const response = await api.get('/products');
    return response.data;
  },

  /**
   * Busca um produto por ID
   */
  get: async (id: number) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  /**
   * Cria um novo produto
   */
  create: async (data: Partial<Product>) => {
    const response = await api.post('/products', data);
    return response.data;
  },

  /**
   * Atualiza um produto
   */
  update: async (id: number, data: Partial<Product>) => {
    const response = await api.patch(`/products/${id}`, data);
    return response.data;
  },

  /**
   * Remove um produto
   */
  delete: async (id: number) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },

  /**
   * Lista produtos com estoque baixo
   */
  lowStock: async () => {
    const response = await api.get('/products/reports/low-stock');
    return response.data;
  }
};

// ============================================================================
// SERVICES API
// ============================================================================

export const servicesApi = {
  list: async () => {
    const response = await api.get('/services');
    return response.data;
  },

  get: async (id: number) => {
    const response = await api.get(`/services/${id}`);
    return response.data;
  },

  create: async (data: Partial<Service>) => {
    const response = await api.post('/services', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Service>) => {
    const response = await api.patch(`/services/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/services/${id}`);
    return response.data;
  }
};

// ============================================================================
// TUTORS API
// ============================================================================

export const tutorsApi = {
  list: async () => {
    const response = await api.get('/tutors');
    return response.data;
  },

  get: async (id: string) => {
    const response = await api.get(`/tutors/${id}`);
    return response.data;
  },

  update: async (id: string, data: Partial<Tutor>) => {
    const response = await api.patch(`/tutors/${id}`, data);
    return response.data;
  },

  getEmotionalContext: async (id: string) => {
    const response = await api.get(`/tutors/${id}/emotional-context`);
    return response.data;
  },

  getJourney: async (id: string) => {
    const response = await api.get(`/tutors/${id}/journey`);
    return response.data;
  }
};

// ============================================================================
// PETS API
// ============================================================================

export const petsApi = {
  list: async (tutorId: string) => {
    const response = await api.get(`/tutors/${tutorId}/pets`);
    return response.data;
  },

  get: async (tutorId: string, id: number) => {
    const response = await api.get(`/tutors/${tutorId}/pets/${id}`);
    return response.data;
  },

  create: async (tutorId: string, data: Partial<Pet>) => {
    const response = await api.post(`/tutors/${tutorId}/pets`, data);
    return response.data;
  },

  update: async (tutorId: string, id: number, data: Partial<Pet>) => {
    const response = await api.patch(`/tutors/${tutorId}/pets/${id}`, data);
    return response.data;
  },

  delete: async (tutorId: string, id: number) => {
    const response = await api.delete(`/tutors/${tutorId}/pets/${id}`);
    return response.data;
  }
};

// ============================================================================
// APPOINTMENTS API
// ============================================================================

export const appointmentsApi = {
  list: async (params?: any) => {
    const response = await api.get('/appointments', { params });
    return response.data;
  },

  get: async (id: number) => {
    const response = await api.get(`/appointments/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/appointments', data);
    return response.data;
  },

  update: async (id: number, data: any) => {
    const response = await api.patch(`/appointments/${id}`, data);
    return response.data;
  },

  cancel: async (id: number) => {
    const response = await api.patch(`/appointments/${id}/cancel`);
    return response.data;
  }
};

// ============================================================================
// CONVERSATIONS API
// ============================================================================

export const conversationsApi = {
  list: async (params?: any) => {
    const response = await api.get('/conversations', { params });
    return response.data;
  },

  get: async (id: number) => {
    const response = await api.get(`/conversations/${id}`);
    return response.data;
  },

  getMessages: async (id: number) => {
    const response = await api.get(`/conversations/${id}/messages`);
    return response.data;
  }
};

// ============================================================================
// NOTIFICATIONS API
// ============================================================================

export const notificationsApi = {
  list: async () => {
    const response = await api.get('/notifications');
    return response.data;
  },

  markAsRead: async (id: number) => {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await api.patch('/notifications/read-all');
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  }
};

// ============================================================================
// REPORTS API
// ============================================================================

export const reportsApi = {
  get: async (params: {
    type: 'revenue' | 'services' | 'clients';
    startDate: string;
    endDate: string;
  }) => {
    const response = await api.get('/reports', { params });
    return response.data;
  },

  dashboard: async (period: string = '30') => {
    const response = await api.get('/reports/dashboard', {
      params: { period }
    });
    return response.data;
  }
};

// ============================================================================
// COMPANIES API
// ============================================================================

export const companiesApi = {
  getCurrent: async () => {
    const response = await api.get('/companies/current');
    return response.data;
  },

  update: async (data: any) => {
    const response = await api.patch('/companies/current', data);
    return response.data;
  }
};

// ============================================================================
// AUTH API
// ============================================================================

export const authApi = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  me: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  updateProfile: async (data: any) => {
    const response = await api.patch('/auth/profile', data);
    return response.data;
  },

  updatePassword: async (data: { currentPassword: string; newPassword: string }) => {
    const response = await api.patch('/auth/password', data);
    return response.data;
  }
};

// ============================================================================
// STATS API
// ============================================================================

export const statsApi = {
  overview: async () => {
    const response = await api.get('/stats/overview');
    return response.data;
  },

  revenue: async (params?: any) => {
    const response = await api.get('/stats/revenue', { params });
    return response.data;
  }
};

// Export all
export default {
  products: productsApi,
  services: servicesApi,
  tutors: tutorsApi,
  pets: petsApi,
  appointments: appointmentsApi,
  conversations: conversationsApi,
  notifications: notificationsApi,
  reports: reportsApi,
  companies: companiesApi,
  auth: authApi,
  stats: statsApi
};

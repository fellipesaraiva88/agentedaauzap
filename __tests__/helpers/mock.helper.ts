/**
 * Helper para criação de mocks de dados
 */

/**
 * Mock de notificação
 */
export function mockNotification(overrides: any = {}) {
  return {
    id: 1,
    company_id: 1,
    user_id: null,
    tipo: 'info',
    titulo: 'Teste de Notificação',
    mensagem: 'Esta é uma notificação de teste',
    nivel: 'medium',
    lida: false,
    arquivada: false,
    acao_url: null,
    acao_label: null,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides
  };
}

/**
 * Mock de serviço
 */
export function mockService(overrides: any = {}) {
  return {
    id: 1,
    company_id: 1,
    codigo_servico: 'BANHO001',
    nome: 'Banho Completo',
    descricao: 'Banho completo com shampoo premium',
    categoria: 'banho',
    subcategoria: 'banho_simples',
    ativo: true,
    popular: true,
    preco_base: 50.00,
    preco_pequeno: 40.00,
    preco_medio: 50.00,
    preco_grande: 60.00,
    duracao_minutos: 60,
    ordem: 1,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides
  };
}

/**
 * Mock de agendamento
 */
export function mockAppointment(overrides: any = {}) {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return {
    id: 1,
    company_id: 1,
    tutor_id: 1,
    pet_id: 1,
    service_id: 1,
    chat_id: '551199999999@c.us',
    status: 'pendente',
    data_agendamento: tomorrow,
    hora_agendamento: '10:00',
    preco: 50.00,
    observacoes: null,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides
  };
}

/**
 * Mock de tutor/cliente
 */
export function mockTutor(overrides: any = {}) {
  return {
    id: 1,
    company_id: 1,
    nome: 'João Silva',
    telefone: '11999999999',
    email: 'joao@example.com',
    is_vip: false,
    is_inativo: false,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides
  };
}

/**
 * Mock de estatísticas do dashboard
 */
export function mockDashboardStats(overrides: any = {}) {
  return {
    tutors: {
      total: 100,
      vip: 15,
      vipPercentage: 15
    },
    appointments: {
      total: 250,
      pending: 10,
      confirmed: 20,
      completed: 200
    },
    revenue: {
      currentMonth: 12500.00,
      lastMonth: 10000.00,
      growth: 25.0,
      growthFormatted: '25.0%'
    },
    conversations: {
      last24h: 45
    },
    timestamp: new Date().toISOString(),
    ...overrides
  };
}

/**
 * Mock de conversação
 */
export function mockConversation(overrides: any = {}) {
  return {
    id: 1,
    company_id: 1,
    chat_id: '551199999999@c.us',
    mensagem_cliente: 'Olá, gostaria de agendar um banho',
    mensagem_agente: 'Olá! Claro, vou te ajudar com o agendamento.',
    intencao: 'agendamento',
    sentimento: 'positivo',
    qualidade_resposta: 0.95,
    created_at: new Date(),
    ...overrides
  };
}

/**
 * Cria lista de mocks
 */
export function mockList<T>(mockFn: (overrides?: any) => T, count: number = 5): T[] {
  return Array.from({ length: count }, (_, index) => mockFn({ id: index + 1 }));
}

/**
 * Mock de resposta paginada
 */
export function mockPaginatedResponse<T>(data: T[], total: number = 0, limit: number = 50, offset: number = 0) {
  return {
    success: true,
    data,
    pagination: {
      total: total || data.length,
      limit,
      offset,
      hasMore: offset + data.length < (total || data.length)
    }
  };
}

/**
 * Mock de resposta de sucesso simples
 */
export function mockSuccessResponse<T>(data: T, message?: string) {
  return {
    success: true,
    data,
    ...(message && { message })
  };
}

/**
 * Mock de resposta de erro
 */
export function mockErrorResponse(message: string, code: string = 'ERROR') {
  return {
    success: false,
    error: {
      message,
      code
    }
  };
}

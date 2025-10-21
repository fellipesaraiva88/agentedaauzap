/**
 * Interface para serviço
 */
export interface Service {
  id: number;
  company_id: number;

  // Informações do serviço
  codigo_servico?: string;
  nome: string;
  descricao?: string;
  categoria?: 'higiene' | 'estetica' | 'saude' | 'hospedagem' | 'outros';
  subcategoria?: string;

  // Duração
  duracao_minutos: number;

  // Preços
  preco_pequeno?: number;
  preco_medio?: number;
  preco_grande?: number;
  preco_base?: number;
  preco_promocional?: number;

  // Comissão
  comissao_percentual?: number;

  // Configurações
  requer_agendamento: boolean;
  permite_walk_in: boolean;
  capacidade_simultanea: number;
  materiais_necessarios?: string[];
  restricoes?: string[];

  // Restrições de idade
  idade_minima_meses?: number;
  idade_maxima_anos?: number;

  // Status e destaque
  ativo: boolean;
  popular: boolean;
  promocao_ativa: boolean;
  ordem: number;

  // Visual
  imagem_url?: string;

  // Metadata
  created_at: Date;
  updated_at: Date;
}

/**
 * Status possíveis de agendamento
 */
export type AppointmentStatus = 'pendente' | 'confirmado' | 'em_atendimento' | 'concluido' | 'cancelado' | 'nao_compareceu';

/**
 * Interface para agendamento
 */
export interface Appointment {
  id: number;
  company_id: number;

  // Cliente e Pet
  chat_id: string;
  tutor_id?: string;
  tutor_nome?: string;
  tutor_telefone?: string;
  pet_id?: number;
  pet_nome?: string;
  pet_tipo?: string;
  pet_porte?: 'pequeno' | 'medio' | 'grande';

  // Serviço
  service_id: number;
  service_nome: string;

  // Profissional
  profissional_id?: number;

  // Data e hora
  data_agendamento: Date;
  hora_agendamento: string; // TIME format HH:MM
  duracao_minutos: number;

  // Preço e pagamento
  preco: number;
  desconto_aplicado?: number;
  valor_pago?: number;
  forma_pagamento?: 'dinheiro' | 'cartao' | 'pix' | 'credito' | 'debito';
  pago: boolean;

  // Status
  status: AppointmentStatus;

  // Observações
  observacoes?: string;
  motivo_cancelamento?: string;

  // Confirmações e lembretes
  confirmado_cliente: boolean;
  confirmado_empresa: boolean;
  lembrete_enviado: boolean;
  lembrete_enviado_em?: Date;

  // Timestamps de atendimento
  chegou_em?: Date;
  iniciado_em?: Date;
  cancelado_at?: Date;
  concluido_at?: Date;

  // Avaliação
  avaliacao?: number; // 1-5
  avaliacao_comentario?: string;

  // Origem
  origem?: 'whatsapp' | 'telefone' | 'site' | 'presencial';

  // Metadata
  created_at: Date;
  updated_at: Date;
}

/**
 * Interface para disponibilidade
 */
export interface AvailabilitySlot {
  id: number;
  company_id: number;

  // Dia da semana (0=domingo, 6=sábado)
  dia_semana: number;

  // Horário
  hora_inicio: string; // TIME format HH:MM
  hora_fim: string; // TIME format HH:MM

  // Capacidade
  capacidade_simultanea: number;

  // Status
  ativo: boolean;

  // Metadata
  created_at: Date;
}

/**
 * Interface para datas bloqueadas
 */
export interface BlockedDate {
  id: number;
  company_id: number;

  // Data
  data: Date;

  // Motivo
  motivo?: string;

  // Bloqueio
  bloqueio_total: boolean;
  hora_inicio?: string; // TIME format HH:MM
  hora_fim?: string; // TIME format HH:MM

  // Metadata
  created_at: Date;
}

/**
 * Interface para histórico de status
 */
export interface AppointmentStatusHistory {
  id: number;
  appointment_id: number;

  // Mudança
  status_anterior?: AppointmentStatus;
  status_novo: AppointmentStatus;

  // Detalhes
  motivo?: string;
  alterado_por?: 'cliente' | 'sistema' | 'empresa' | 'profissional';

  // Metadata
  created_at: Date;
}

/**
 * DTOs para criação e atualização
 */
export interface CreateServiceDTO {
  company_id: number;
  codigo_servico?: string;
  nome: string;
  categoria?: 'higiene' | 'estetica' | 'saude' | 'hospedagem' | 'outros';
  duracao_minutos?: number;
  preco_base?: number;
  preco_pequeno?: number;
  preco_medio?: number;
  preco_grande?: number;
  requer_agendamento?: boolean;
  permite_walk_in?: boolean;
  capacidade_simultanea?: number;
  ordem?: number;
}

export interface UpdateServiceDTO extends Partial<CreateServiceDTO> {
  descricao?: string;
  ativo?: boolean;
  promocao_ativa?: boolean;
  preco_promocional?: number;
}

export interface CreateAppointmentDTO {
  company_id: number;
  chat_id: string;
  service_id: number;
  data_agendamento: Date;
  hora_agendamento: string;
  tutor_nome?: string;
  tutor_telefone?: string;
  pet_nome?: string;
  pet_tipo?: string;
  pet_porte?: 'pequeno' | 'medio' | 'grande';
  preco: number;
  observacoes?: string;
}

export interface UpdateAppointmentDTO {
  status?: AppointmentStatus;
  confirmado_cliente?: boolean;
  confirmado_empresa?: boolean;
  profissional_id?: number;
  observacoes?: string;
  motivo_cancelamento?: string;
}

export interface AvailabilityCheckDTO {
  company_id: number;
  service_id: number;
  data: Date;
  hora?: string;
}

export interface AvailabilityResult {
  disponivel: boolean;
  horarios_disponiveis?: string[];
  proxima_data_disponivel?: Date;
  motivo_indisponivel?: string;
}
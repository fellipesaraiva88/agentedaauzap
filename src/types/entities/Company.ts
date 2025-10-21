/**
 * Interface para empresa (multi-tenancy)
 */
export interface Company {
  id: number;

  // Informações básicas
  nome: string;
  slug: string;

  // Contato
  whatsapp?: string;
  email?: string;
  telefone?: string;

  // Endereço
  endereco_rua?: string;
  endereco_numero?: string;
  endereco_bairro?: string;
  endereco_cidade?: string;
  endereco_estado?: string;
  endereco_cep?: string;
  endereco_completo?: string;
  latitude?: number;
  longitude?: number;

  // Branding
  logo_url?: string;
  cor_primaria?: string;
  cor_secundaria?: string;

  // Configuração do agente
  agente_nome?: string;
  agente_persona?: string;
  agente_config?: Record<string, any>;

  // Horário de funcionamento
  horario_funcionamento?: {
    segunda?: string;
    terca?: string;
    quarta?: string;
    quinta?: string;
    sexta?: string;
    sabado?: string;
    domingo?: string;
  };

  // Configurações de agendamento
  max_agendamentos_dia?: number;
  tempo_medio_servico?: number;
  antecedencia_minima_horas?: number;
  antecedencia_maxima_dias?: number;
  permite_cancelamento?: boolean;
  horas_antecedencia_cancelamento?: number;

  // Mensagens padrão
  mensagem_boas_vindas?: string;
  mensagem_confirmacao?: string;
  mensagem_lembrete?: string;
  enviar_lembrete_horas_antes?: number;

  // API e integração
  webhook_url?: string;
  api_key?: string;

  // Status
  ativo: boolean;
  plano?: 'basic' | 'premium' | 'enterprise';

  // Metadata
  created_at: Date;
  updated_at: Date;
}

/**
 * Interface para criação de empresa
 */
export interface CreateCompanyDTO {
  nome: string;
  slug: string;
  whatsapp?: string;
  email?: string;
  agente_nome?: string;
  agente_persona?: string;
  horario_funcionamento?: Record<string, string>;
  plano?: 'basic' | 'premium' | 'enterprise';
}

/**
 * Interface para atualização de empresa
 */
export interface UpdateCompanyDTO extends Partial<CreateCompanyDTO> {
  ativo?: boolean;
  webhook_url?: string;
  api_key?: string;
  max_agendamentos_dia?: number;
  mensagem_boas_vindas?: string;
  mensagem_confirmacao?: string;
  mensagem_lembrete?: string;
}
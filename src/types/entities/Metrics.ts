/**
 * Interface para métricas da empresa
 */
export interface CompanyMetrics {
  id: number;
  company_id: number;

  // Período
  periodo: Date;
  tipo_periodo: 'dia' | 'semana' | 'mes' | 'ano';

  // Métricas de agendamento
  total_agendamentos: number;
  agendamentos_confirmados: number;
  agendamentos_cancelados: number;
  agendamentos_concluidos: number;
  taxa_cancelamento?: number;
  taxa_conclusao?: number;

  // Métricas financeiras
  receita_total: number;
  ticket_medio?: number;
  desconto_total: number;

  // Métricas de clientes
  novos_clientes: number;
  clientes_ativos: number;
  clientes_retorno: number;
  taxa_retorno?: number;

  // Métricas de satisfação
  nps_score?: number;
  avaliacao_media?: number;
  total_avaliacoes: number;

  // Performance
  tempo_resposta_medio?: number; // em minutos
  taxa_conversao_chat?: number;
  mensagens_enviadas: number;
  mensagens_recebidas: number;

  // Metadata
  created_at: Date;
  updated_at: Date;
}

/**
 * Interface para campanha de marketing
 */
export interface Campaign {
  id: number;
  company_id: number;

  // Informações da campanha
  nome: string;
  tipo?: 'promocional' | 'lembrete' | 'reativacao' | 'fidelidade' | 'sazonal';
  descricao?: string;

  // Configuração
  segmento_alvo?: {
    clientes_inativos?: boolean;
    vips?: boolean;
    aniversariantes?: boolean;
    sem_compras_30_dias?: boolean;
    custom_filters?: Record<string, any>;
  };
  mensagem_template: string;
  imagem_url?: string;

  // Período
  data_inicio: Date;
  data_fim?: Date;
  horario_envio?: string;

  // Status
  status: 'rascunho' | 'agendada' | 'em_andamento' | 'pausada' | 'concluida' | 'cancelada';

  // Métricas
  total_destinatarios: number;
  mensagens_enviadas: number;
  mensagens_lidas: number;
  respostas_recebidas: number;
  conversoes: number;
  taxa_abertura?: number;
  taxa_resposta?: number;
  taxa_conversao?: number;
  receita_gerada: number;

  // Metadata
  created_at: Date;
  updated_at: Date;
  executed_at?: Date;
}

/**
 * Interface para produto
 */
export interface Product {
  id: number;
  company_id: number;

  // Informações do produto
  codigo?: string;
  nome: string;
  descricao?: string;
  categoria?: string;
  marca?: string;

  // Preços
  preco_custo?: number;
  preco_venda: number;
  preco_promocional?: number;

  // Estoque
  estoque_atual: number;
  estoque_minimo: number;
  estoque_maximo?: number;
  unidade_medida?: string;

  // Configurações
  ativo: boolean;
  venda_online: boolean;
  destaque: boolean;

  // Visual
  imagem_url?: string;

  // Metadata
  created_at: Date;
  updated_at: Date;
}

/**
 * Interface para notificação
 */
export interface Notification {
  id: number;
  company_id: number;
  user_id?: number;

  // Notificação
  tipo: string;
  titulo: string;
  mensagem: string;
  nivel: 'info' | 'warning' | 'error' | 'success';

  // Dados adicionais
  dados?: Record<string, any>;
  link_acao?: string;

  // Status
  lida: boolean;
  lida_em?: Date;
  arquivada: boolean;

  // Metadata
  created_at: Date;
}

/**
 * Interface para usuário do sistema
 */
export interface User {
  id: number;
  company_id?: number;

  // Informações pessoais
  nome: string;
  email: string;
  phone?: string;
  avatar_url?: string;

  // Autenticação
  password_hash?: string;
  reset_token?: string;
  reset_expires?: Date;

  // Permissões
  role?: 'admin' | 'manager' | 'operator' | 'viewer';
  permissions?: Record<string, any>;

  // Status
  is_active: boolean;
  email_verified: boolean;

  // Login
  last_login?: Date;
  login_count: number;

  // Preferências
  preferences?: {
    notifications?: boolean;
    theme?: 'light' | 'dark';
    language?: string;
    timezone?: string;
  };

  // Metadata
  created_at: Date;
  updated_at: Date;
}

/**
 * Interface para sessão WhatsApp
 */
export interface WhatsAppSession {
  id: number;
  company_id: number;

  // Sessão
  session_name: string;
  qr_code?: string;
  is_connected: boolean;

  // Status
  status?: 'disconnected' | 'connecting' | 'qr_code' | 'connected';
  last_activity?: Date;
  error_message?: string;

  // Configurações
  webhook_url?: string;
  auto_reconnect: boolean;
  max_reconnect_attempts: number;

  // Metadata
  connected_at?: Date;
  disconnected_at?: Date;
  created_at: Date;
  updated_at: Date;
}

/**
 * DTOs para criação e atualização
 */
export interface CreateCampaignDTO {
  company_id: number;
  nome: string;
  tipo?: string;
  mensagem_template: string;
  data_inicio: Date;
  data_fim?: Date;
  segmento_alvo?: Record<string, any>;
}

export interface UpdateCampaignDTO extends Partial<CreateCampaignDTO> {
  status?: string;
  imagem_url?: string;
  horario_envio?: string;
}

export interface CreateProductDTO {
  company_id: number;
  nome: string;
  preco_venda: number;
  categoria?: string;
  estoque_atual?: number;
  estoque_minimo?: number;
}

export interface UpdateProductDTO extends Partial<CreateProductDTO> {
  descricao?: string;
  preco_promocional?: number;
  ativo?: boolean;
  destaque?: boolean;
}

export interface CreateNotificationDTO {
  company_id: number;
  user_id?: number;
  tipo: string;
  titulo: string;
  mensagem: string;
  nivel?: 'info' | 'warning' | 'error' | 'success';
  dados?: Record<string, any>;
}

export interface MetricsFilterDTO {
  company_id: number;
  periodo_inicio?: Date;
  periodo_fim?: Date;
  tipo_periodo?: 'dia' | 'semana' | 'mes' | 'ano';
  agrupar_por?: string;
}
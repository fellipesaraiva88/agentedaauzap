/**
 * Interface para episódio de conversa
 */
export interface ConversationEpisode {
  id: number;
  tutor_id: string;
  company_id: number;

  // Timing
  inicio_conversa?: Date;
  fim_conversa?: Date;
  duracao_minutos?: number;
  total_mensagens: number;

  // Contexto
  topico_principal?: string;
  intencao_detectada?: 'agendar_servico' | 'tirar_duvida' | 'reclamar' | 'elogiar' | 'cancelar' | 'remarcar' | 'outros';
  estagio_jornada?: 'descoberta' | 'interesse' | 'consideracao' | 'decisao' | 'pos_venda';

  // Resultado
  converteu: boolean;
  valor_convertido?: number;
  tipo_conversao?: 'agendamento' | 'compra' | 'lead_qualificado' | 'reativacao';

  // Resumo
  resumo_conversa?: string;
  proximos_passos?: string;

  // Metadata
  created_at: Date;
}

/**
 * Interface para histórico de conversas
 */
export interface ConversationHistory {
  id: number;
  company_id: number;
  chat_id: string;

  // Mensagem
  message_id?: string;
  sender?: 'client' | 'agent' | 'system';
  message?: string;
  message_type?: 'text' | 'image' | 'audio' | 'video' | 'document' | 'location';

  // Contexto
  intent?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  confidence?: number;

  // Resposta
  response_time_ms?: number;
  was_automated?: boolean;

  // Metadata
  timestamp: Date;
  created_at: Date;
}

/**
 * Interface para oportunidade de conversão
 */
export interface ConversionOpportunity {
  id: number;
  company_id: number;
  chat_id: string;

  // Scoring
  score: number; // 0-100
  urgency_level?: 'baixa' | 'media' | 'alta' | 'critica';

  // Análise
  tipo_oportunidade?: 'novo_servico' | 'retorno' | 'upsell' | 'reativacao' | 'fidelizacao';
  servicos_potenciais?: string[];
  valor_estimado?: number;

  // Sinais detectados
  sinais_positivos?: string[];
  objecoes_identificadas?: string[];

  // Ação sugerida
  suggested_action?: string;
  mensagem_sugerida?: string;
  melhor_horario_contato?: string;

  // Status
  converted: boolean;
  conversion_date?: Date;
  valor_convertido?: number;

  // Metadata
  detected_at: Date;
  expires_at?: Date;
  created_at: Date;
  updated_at: Date;
}

/**
 * Interface para follow-up agendado
 */
export interface ScheduledFollowup {
  id: number;
  company_id: number;
  chat_id: string;

  // Agendamento
  scheduled_for: Date;
  tipo?: 'lembrete' | 'confirmacao' | 'pos_venda' | 'reativacao' | 'promocional';

  // Mensagem
  message: string;
  template_usado?: string;
  personalizacoes?: Record<string, any>;

  // Controle de execução
  executed: boolean;
  executed_at?: Date;
  attempt: number;
  max_attempts: number;

  // Resultado
  sucesso?: boolean;
  erro?: string;
  resposta_recebida?: boolean;

  // Metadata
  created_at: Date;
  updated_at: Date;
}

/**
 * Interface para qualidade de resposta
 */
export interface ResponseQuality {
  id: number;
  company_id: number;
  chat_id: string;
  message_id?: string;

  // Métricas de qualidade
  clareza_score: number; // 0-10
  relevancia_score: number; // 0-10
  completude_score: number; // 0-10
  empatia_score: number; // 0-10
  profissionalismo_score: number; // 0-10

  // Score geral
  overall_score: number; // Média ponderada

  // Análise
  pontos_positivos?: string[];
  pontos_melhoria?: string[];
  sugestoes?: string[];

  // Contexto
  tipo_resposta?: 'informacao' | 'venda' | 'suporte' | 'agendamento';
  complexidade?: 'baixa' | 'media' | 'alta';

  // Feedback
  feedback_cliente?: 'positivo' | 'neutro' | 'negativo';
  comentario_cliente?: string;

  // Metadata
  avaliado_em: Date;
  created_at: Date;
}

/**
 * DTOs para criação e atualização
 */
export interface CreateConversationEpisodeDTO {
  tutor_id: string;
  company_id: number;
  inicio_conversa?: Date;
  topico_principal?: string;
  intencao_detectada?: 'agendar_servico' | 'tirar_duvida' | 'reclamar' | 'elogiar' | 'cancelar' | 'remarcar' | 'outros';
}

export interface UpdateConversationEpisodeDTO {
  fim_conversa?: Date;
  total_mensagens?: number;
  converteu?: boolean;
  valor_convertido?: number;
  resumo_conversa?: string;
  tipo_conversao?: 'agendamento' | 'compra' | 'lead_qualificado' | 'reativacao';
}

export interface CreateConversionOpportunityDTO {
  company_id: number;
  chat_id: string;
  score: number;
  tipo_oportunidade?: 'novo_servico' | 'retorno' | 'upsell' | 'reativacao' | 'fidelizacao';
  suggested_action?: string;
}

export interface CreateScheduledFollowupDTO {
  company_id: number;
  chat_id: string;
  scheduled_for: Date;
  message: string;
  tipo?: 'lembrete' | 'confirmacao' | 'pos_venda' | 'reativacao' | 'promocional';
  max_attempts?: number;
}

export interface RecordConversationDTO {
  company_id: number;
  chat_id: string;
  message_id?: string;
  sender: 'client' | 'agent' | 'system';
  message: string;
  message_type?: 'text' | 'image' | 'audio' | 'video' | 'document' | 'location';
  intent?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
}
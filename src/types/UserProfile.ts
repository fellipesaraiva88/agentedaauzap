/**
 * Tipos e interfaces para o sistema de análise comportamental
 */

export type ConversationStage = 'descoberta' | 'interesse' | 'consideracao' | 'decisao' | 'pos_venda';
export type EngagementLevel = 'baixo' | 'medio' | 'alto' | 'muito_alto';
export type SentimentType = 'positivo' | 'neutro' | 'negativo' | 'urgente' | 'frustrado' | 'animado' | 'pragmatico';

/**
 * Perfil completo do usuário/cliente
 */
export interface UserProfile {
  chatId: string;
  nome?: string;
  petNome?: string;
  petRaca?: string;
  petPorte?: 'pequeno' | 'medio' | 'grande';
  petTipo?: 'cachorro' | 'gato' | 'ave' | 'outro';

  // Timestamps
  firstContactDate: Date;
  lastMessageTimestamp: number;
  lastFollowUpDate?: Date;

  // Análise comportamental
  avgResponseTime: number; // em milissegundos
  responseTimeHistory: number[]; // últimas 10 respostas
  engagementScore: number; // 0-100
  engagementLevel: EngagementLevel;

  // Estágio da conversa
  conversationStage: ConversationStage;
  purchaseIntent: number; // 0-100

  // Interesses e objeções
  interests: string[]; // ex: ["banho", "tosa", "hotel"]
  objections: string[]; // ex: ["preço alto", "horário ruim"]
  lastSentiment: SentimentType;

  // Estatísticas
  totalMessages: number;
  totalConversations: number;

  // Histórico de compras/agendamentos
  purchaseHistory: Purchase[];

  // Preferências
  preferences: {
    preferredDay?: string;
    preferredTime?: string;
    paymentMethod?: string;
    communicationStyle?: 'formal' | 'casual';
  };

  // Notas internas
  notes: string;
}

/**
 * Histórico de compras
 */
export interface Purchase {
  date: Date;
  service: string;
  value: number;
  petName?: string;
}

/**
 * Análise de engajamento em tempo real
 */
export interface EngagementAnalysis {
  responseTime: number;
  score: number;
  level: EngagementLevel;
  pattern: 'ansioso' | 'pensativo' | 'multitarefa' | 'normal';
  buyingSignals: string[];
}

/**
 * Análise de sentimento
 */
export interface SentimentAnalysis {
  type: SentimentType;
  confidence: number; // 0-1
  keywords: string[];
  suggestedTone: 'empático' | 'direto' | 'festivo' | 'calmo' | 'objetivo';
}

/**
 * Contexto da conversa
 */
export interface ConversationContext {
  hourOfDay: number;
  dayOfWeek: number;
  isWeekend: boolean;
  greeting: string;
  energyLevel: 'alta' | 'media' | 'baixa';
}

/**
 * Oportunidade de conversão
 */
export interface ConversionOpportunity {
  score: number; // 0-100
  reason: string;
  suggestedAction: string;
  urgencyLevel: 'baixa' | 'media' | 'alta';
  closeMessage?: string;
}

/**
 * Follow-up agendado
 */
export interface ScheduledFollowUp {
  chatId: string;
  scheduledFor: Date;
  reason: string;
  message: string;
  attempt: number; // 1, 2, ou 3 (máximo)
  context: {
    lastTopic: string;
    lastStage: ConversationStage;
  };
}

/**
 * Imperfeição humana
 */
export interface HumanImperfection {
  type: 'typo' | 'autocorrect' | 'interruption' | 'emotion';
  shouldApply: boolean;
  originalText?: string;
  modifiedText?: string;
  delay?: number;
}

/**
 * Mensagem quebrada (múltiplas partes)
 */
export interface SplitMessage {
  parts: string[];
  delays: number[]; // delay antes de cada parte
}

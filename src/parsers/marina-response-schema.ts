import { z } from 'zod';

/**
 * 🎯 ZOD SCHEMAS PARA VALIDAÇÃO ESTRUTURADA
 *
 * Garante que respostas da Marina SEMPRE seguem padrões corretos:
 * - Sem formatação robótica
 * - Sem frases de IA
 * - Tamanho apropriado
 * - Tom correto
 */

/**
 * Schema principal: Resposta da Marina
 */
export const marinaResponseSchema = z.object({
  /**
   * Mensagem que será enviada
   */
  message: z.string()
    .min(5, "Mensagem muito curta - mínimo 5 caracteres")
    .max(300, "Mensagem muito longa - máximo 300 caracteres")

    // Validações anti-robótico
    .refine(
      (msg) => !msg.match(/^\s*\d+[\.\)]\s/gm),
      "❌ Não use numeração sequencial (1., 2., 3.)"
    )
    .refine(
      (msg) => !msg.includes("vamos lá"),
      "❌ Não use 'vamos lá' (frase típica de IA)"
    )
    .refine(
      (msg) => !msg.match(/^(Perfeito|Ótima pergunta|Com certeza|Claro)!/i),
      "❌ Não use frases corporativas (Perfeito!, Claro!, etc)"
    )
    .refine(
      (msg) => !msg.match(/\*[^*]+\*\s*:/g),
      "❌ Não use padrão *Título*: (muito robótico)"
    )
    .refine(
      (msg) => msg.split('\n').length <= 4,
      "❌ Máximo 4 linhas (WhatsApp natural)"
    )
    .refine(
      (msg) => !msg.match(/[-=*]{3,}/),
      "❌ Não use separadores visuais (---, ===)"
    ),

  /**
   * Tom detectado/aplicado na resposta
   */
  tone: z.enum([
    'casual',      // Conversa informal
    'empolgado',   // Cliente animado
    'empatico',    // Cliente emotivo/triste
    'direto',      // Cliente objetivo
    'urgente'      // Cliente com pressa
  ]),

  /**
   * Se a resposta contém tentativa de fechamento/conversão
   */
  containsClosing: z.boolean(),

  /**
   * Se seguiu o arquétipo psicológico detectado
   */
  followedArchetype: z.boolean(),

  /**
   * Comprimento aproximado (para calcular typing time)
   */
  characterCount: z.number().optional(),

  /**
   * Se precisa ser quebrada em múltiplas mensagens
   */
  needsSplitting: z.boolean().optional()
});

export type MarinaResponse = z.infer<typeof marinaResponseSchema>;

/**
 * Schema para contexto de entrada (usado no pipeline)
 */
export const marinaContextSchema = z.object({
  chatId: z.string(),
  message: z.string(),

  // Análise comportamental
  sentiment: z.enum(['positivo', 'negativo', 'neutro', 'urgente', 'frustrado', 'animado']).optional(),
  engagementScore: z.number().min(0).max(100).optional(),

  // Contexto psicológico
  archetype: z.enum([
    'ansioso_controlador',
    'analitico_questionador',
    'emotivo_protetor',
    'tradicional_fiel',
    'premium_exigente',
    'economico_pratico',
    'impulsivo_social',
    'profissional_direto',
    'influencer_fashion',
    'estudante_tecnico',
    'idoso_carinhoso',
    'resgate_emotivo'
  ]).optional(),

  // Dados do cliente
  userName: z.string().optional(),
  petName: z.string().optional(),
  isVip: z.boolean().optional(),
  isNewClient: z.boolean().optional(),

  // Estado de conversão
  conversionStage: z.enum([
    'descoberta',
    'qualificacao',
    'apresentacao',
    'objecao',
    'fechamento'
  ]).optional(),

  conversionScore: z.number().min(0).max(100).optional()
});

export type MarinaContext = z.infer<typeof marinaContextSchema>;

/**
 * Schema para timing (usado no TimingCallback)
 */
export const timingSchema = z.object({
  readingTime: z.number().min(0),      // ms para ler mensagem do cliente
  typingTime: z.number().min(0),       // ms para "digitar" resposta
  totalDelay: z.number().min(0),       // total ms antes de enviar
  isUrgent: z.boolean(),               // se deve ser resposta rápida
  messageLength: z.number().min(0)     // tamanho da resposta
});

export type Timing = z.infer<typeof timingSchema>;

/**
 * Schema para conversão (usado no ConversionGraph)
 */
export const conversionStateSchema = z.object({
  stage: z.enum([
    'descoberta',
    'qualificacao',
    'apresentacao',
    'objecao',
    'fechamento'
  ]),

  score: z.number().min(0).max(100),
  readyToClose: z.boolean(),
  detectedIntent: z.string().optional(),
  blockers: z.array(z.string()).optional(),
  nextAction: z.string().optional()
});

export type ConversionState = z.infer<typeof conversionStateSchema>;

/**
 * Helper: Valida resposta antes de enviar
 * @returns true se válida, lança erro se inválida
 */
export function validateMarinaResponse(response: unknown): MarinaResponse {
  try {
    return marinaResponseSchema.parse(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map(i => i.message).join(', ');
      console.error(`❌ Validação falhou: ${issues}`);
      throw new Error(`Resposta inválida: ${issues}`);
    }
    throw error;
  }
}

/**
 * Helper: Valida contexto antes de processar
 */
export function validateMarinaContext(context: unknown): MarinaContext {
  try {
    return marinaContextSchema.parse(context);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map(i => i.message).join(', ');
      console.error(`❌ Contexto inválido: ${issues}`);
      throw new Error(`Contexto inválido: ${issues}`);
    }
    throw error;
  }
}

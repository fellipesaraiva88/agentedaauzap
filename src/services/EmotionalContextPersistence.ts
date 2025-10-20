/**
 * EMOTIONAL CONTEXT PERSISTENCE
 * Salva análises emocionais e psicológicas no banco
 *
 * Responsabilidades:
 * - Persistir análises do EmotionalIntelligence
 * - Persistir análises do SentimentAnalyzer
 * - Persistir perfil do PersonalityProfiler
 * - Manter histórico emocional rastreável
 */

import { PostgreSQLClient } from './PostgreSQLClient';

export interface EmotionalAnalysis {
  tutorId: string;
  chatId: string;

  // Arquétipo e personalidade
  arquetipo?: string;
  dimensoesPersonalidade?: Record<string, number>;

  // Emoções
  emocaoPrimaria?: string;
  emocaoSecundaria?: string;
  intensidadeEmocional?: number;

  // Sentimento
  sentimentoPredominante?: string;
  tomConversacao?: string;

  // Engagement
  engagementScore?: number;
  engagementLevel?: string;
  sinaisCompra?: string[];

  // Contexto
  contextoConversa?: string;
}

/**
 * SERVIÇO DE PERSISTÊNCIA EMOCIONAL
 */
export class EmotionalContextPersistence {
  private postgres: PostgreSQLClient;

  constructor() {
    this.postgres = PostgreSQLClient.getInstance();
  }

  /**
   * Salva análise emocional completa
   */
  public async saveEmotionalAnalysis(data: EmotionalAnalysis): Promise<void> {
    try {
      await this.postgres.query(
        `INSERT INTO emotional_context (
          tutor_id,
          arquetipo,
          dimensoes_personalidade,
          emocao_primaria,
          emocao_secundaria,
          intensidade_emocional,
          sentimento_predominante,
          tom_conversacao,
          engagement_score,
          engagement_level,
          sinais_compra,
          analisado_em,
          contexto_conversa
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), $12)`,
        [
          data.tutorId,
          data.arquetipo || null,
          JSON.stringify(data.dimensoesPersonalidade || {}),
          data.emocaoPrimaria || null,
          data.emocaoSecundaria || null,
          data.intensidadeEmocional || null,
          data.sentimentoPredominante || null,
          data.tomConversacao || null,
          data.engagementScore || null,
          data.engagementLevel || null,
          JSON.stringify(data.sinaisCompra || []),
          data.contextoConversa || null
        ]
      );

      // Log apenas em desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        console.log(`📊 Análise emocional salva: ${data.emocaoPrimaria} (${data.intensidadeEmocional}%)`);
      }

    } catch (error) {
      console.error('❌ Erro ao salvar análise emocional:', error);
      // Não trava o fluxo se falhar
    }
  }

  /**
   * Obtém evolução emocional de um cliente
   */
  public async getEmotionalEvolution(
    tutorId: string,
    limit: number = 10
  ): Promise<any[]> {
    try {
      const result = await this.postgres.query<any>(
        `SELECT
          emocao_primaria,
          intensidade_emocional,
          engagement_score,
          engagement_level,
          analisado_em
        FROM emotional_context
        WHERE tutor_id = $1
        ORDER BY analisado_em DESC
        LIMIT $2`,
        [tutorId, limit]
      );

      return result.rows;

    } catch (error) {
      console.error('❌ Erro ao obter evolução emocional:', error);
      return [];
    }
  }

  /**
   * Obtém emoção predominante de um cliente
   */
  public async getPredominantEmotion(tutorId: string): Promise<string | null> {
    try {
      const result = await this.postgres.query<any>(
        `SELECT emocao_primaria, COUNT(*) as freq
        FROM emotional_context
        WHERE tutor_id = $1
          AND analisado_em >= NOW() - INTERVAL '30 days'
        GROUP BY emocao_primaria
        ORDER BY freq DESC
        LIMIT 1`,
        [tutorId]
      );

      return result.rows[0]?.emocao_primaria || null;

    } catch (error) {
      console.error('❌ Erro ao obter emoção predominante:', error);
      return null;
    }
  }

  /**
   * Verifica se houve mudança emocional significativa
   */
  public async detectEmotionalShift(
    tutorId: string
  ): Promise<{ shifted: boolean; from?: string; to?: string; reason?: string }> {
    try {
      const recent = await this.postgres.query<any>(
        `SELECT emocao_primaria, analisado_em
        FROM emotional_context
        WHERE tutor_id = $1
        ORDER BY analisado_em DESC
        LIMIT 3`,
        [tutorId]
      );

      if (recent.rows.length < 2) {
        return { shifted: false };
      }

      const latest = recent.rows[0].emocao_primaria;
      const previous = recent.rows[1].emocao_primaria;

      if (latest !== previous) {
        return {
          shifted: true,
          from: previous,
          to: latest,
          reason: this.getShiftReason(previous, latest)
        };
      }

      return { shifted: false };

    } catch (error) {
      console.error('❌ Erro ao detectar mudança emocional:', error);
      return { shifted: false };
    }
  }

  /**
   * Gera razão da mudança emocional
   */
  private getShiftReason(from: string, to: string): string {
    const shifts: Record<string, Record<string, string>> = {
      ansioso: {
        confiante: 'Cliente foi tranquilizado com informações',
        frustrado: 'Ansiedade aumentou para frustração',
        feliz: 'Preocupação foi resolvida com sucesso'
      },
      frustrado: {
        feliz: 'Problema foi resolvido satisfatoriamente',
        ansioso: 'Frustração diminuiu mas ainda preocupado',
        neutro: 'Cliente se acalmou'
      },
      neutro: {
        animado: 'Cliente se interessou pela oferta',
        ansioso: 'Surgiu preocupação nova',
        feliz: 'Atendimento agradou'
      }
    };

    return shifts[from]?.[to] || `Mudou de ${from} para ${to}`;
  }
}

// Singleton instance
let emotionalPersistence: EmotionalContextPersistence | null = null;

/**
 * Obtém instância do serviço
 */
export function getEmotionalPersistence(): EmotionalContextPersistence {
  if (!emotionalPersistence) {
    emotionalPersistence = new EmotionalContextPersistence();
  }
  return emotionalPersistence;
}

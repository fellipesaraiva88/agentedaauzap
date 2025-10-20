/**
 * RESPONSE QUALITY TRACKER
 * Sistema de Feedback Loop para aprendizado contínuo
 *
 * Responsabilidades:
 * - Salvar TODAS respostas com score de qualidade
 * - Rastrear rejeições e motivos
 * - Gerar insights para melhoria de prompts
 * - Identificar padrões de falha
 */

import { PostgreSQLClient } from './PostgreSQLClient';

export interface ResponseQualityData {
  chatId: string;
  tutorId?: string;

  // Mensagens
  userMessage: string;
  botResponse: string;

  // Qualidade
  qualityScore: number; // 0-100
  passedValidation: boolean;
  rejectionReason?: string;

  // Contexto
  modeUsed?: string;
  pipelineUsed?: string;
  sentimentDetected?: string;
  intentDetected?: string;

  // Métricas
  responseTimeMs?: number;
  tokensUsed?: number;
  usedRag?: boolean;
  ragSourcesCount?: number;

  // Validações
  validationsApplied?: string[];
  validationScores?: Record<string, number>;

  // Flags
  needsReview?: boolean;
}

export interface QualityInsight {
  metric: string;
  value: number;
  status: 'excellent' | 'good' | 'warning' | 'critical' | 'low';
}

/**
 * SERVIÇO DE RASTREAMENTO DE QUALIDADE
 */
export class ResponseQualityTracker {
  private postgres: PostgreSQLClient;

  constructor() {
    this.postgres = PostgreSQLClient.getInstance();
  }

  /**
   * Salva qualidade de uma resposta
   */
  public async trackResponse(data: ResponseQualityData): Promise<void> {
    try {
      await this.postgres.query(
        `INSERT INTO response_quality (
          chat_id,
          tutor_id,
          user_message,
          bot_response,
          quality_score,
          passed_validation,
          rejection_reason,
          mode_used,
          pipeline_used,
          sentiment_detected,
          intent_detected,
          response_time_ms,
          tokens_used,
          used_rag,
          rag_sources_count,
          validations_applied,
          validation_scores,
          needs_review
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
        [
          data.chatId,
          data.tutorId || null,
          data.userMessage,
          data.botResponse,
          data.qualityScore,
          data.passedValidation,
          data.rejectionReason || null,
          data.modeUsed || null,
          data.pipelineUsed || null,
          data.sentimentDetected || null,
          data.intentDetected || null,
          data.responseTimeMs || null,
          data.tokensUsed || null,
          data.usedRag || false,
          data.ragSourcesCount || 0,
          JSON.stringify(data.validationsApplied || []),
          JSON.stringify(data.validationScores || {}),
          data.needsReview || false
        ]
      );

      // Log apenas respostas problemáticas
      if (!data.passedValidation || data.qualityScore < 70) {
        console.warn(`⚠️ Resposta com baixa qualidade registrada:`);
        console.warn(`   Score: ${data.qualityScore}/100`);
        console.warn(`   Motivo: ${data.rejectionReason || 'Score baixo'}`);
        console.warn(`   Modo: ${data.modeUsed || 'desconhecido'}`);
      }

    } catch (error) {
      console.error('❌ Erro ao salvar qualidade de resposta:', error);
      // Não trava o fluxo se falhar
    }
  }

  /**
   * Obtém insights de qualidade dos últimos N dias
   */
  public async getQualityInsights(daysBack: number = 7): Promise<QualityInsight[]> {
    try {
      const result = await this.postgres.query<any>(
        `SELECT * FROM get_quality_insights($1)`,
        [daysBack]
      );

      return result.rows.map(row => ({
        metric: row.metric,
        value: parseFloat(row.value),
        status: row.status
      }));

    } catch (error) {
      console.error('❌ Erro ao obter insights de qualidade:', error);
      return [];
    }
  }

  /**
   * Obtém estatísticas por modo
   */
  public async getQualityByMode(): Promise<any[]> {
    try {
      const result = await this.postgres.query<any>(
        `SELECT * FROM v_quality_by_mode`
      );

      return result.rows;

    } catch (error) {
      console.error('❌ Erro ao obter qualidade por modo:', error);
      return [];
    }
  }

  /**
   * Obtém problemas mais comuns
   */
  public async getCommonIssues(limit: number = 10): Promise<any[]> {
    try {
      const result = await this.postgres.query<any>(
        `SELECT * FROM v_common_issues LIMIT $1`,
        [limit]
      );

      return result.rows;

    } catch (error) {
      console.error('❌ Erro ao obter problemas comuns:', error);
      return [];
    }
  }

  /**
   * Obtém respostas que precisam de revisão
   */
  public async getResponsesNeedingReview(limit: number = 20): Promise<any[]> {
    try {
      const result = await this.postgres.query<any>(
        `SELECT
          id,
          chat_id,
          user_message,
          bot_response,
          quality_score,
          rejection_reason,
          mode_used,
          created_at
        FROM response_quality
        WHERE needs_review = true
          OR is_rejected = true
          OR is_low_quality = true
        ORDER BY created_at DESC
        LIMIT $1`,
        [limit]
      );

      return result.rows;

    } catch (error) {
      console.error('❌ Erro ao obter respostas para revisão:', error);
      return [];
    }
  }

  /**
   * Marca resposta como revisada
   */
  public async markAsReviewed(responseId: number, reviewedBy: string): Promise<void> {
    try {
      await this.postgres.query(
        `UPDATE response_quality
        SET
          needs_review = false,
          reviewed_at = NOW(),
          reviewed_by = $2
        WHERE id = $1`,
        [responseId, reviewedBy]
      );

    } catch (error) {
      console.error('❌ Erro ao marcar como revisada:', error);
    }
  }

  /**
   * Registra feedback do usuário (futuro)
   */
  public async recordUserFeedback(
    responseId: number,
    feedback: 'thumbs_up' | 'thumbs_down',
    feedbackText?: string
  ): Promise<void> {
    try {
      await this.postgres.query(
        `UPDATE response_quality
        SET
          user_feedback = $2,
          user_feedback_text = $3
        WHERE id = $1`,
        [responseId, feedback, feedbackText || null]
      );

    } catch (error) {
      console.error('❌ Erro ao registrar feedback do usuário:', error);
    }
  }

  /**
   * Gera relatório de qualidade consolidado
   */
  public async generateQualityReport(daysBack: number = 7): Promise<string> {
    try {
      const insights = await this.getQualityInsights(daysBack);
      const byMode = await this.getQualityByMode();
      const issues = await this.getCommonIssues(5);

      let report = `📊 RELATÓRIO DE QUALIDADE - ÚLTIMOS ${daysBack} DIAS\n\n`;

      // Insights gerais
      report += `═══ MÉTRICAS GERAIS ═══\n`;
      insights.forEach(insight => {
        const emoji = insight.status === 'excellent' ? '🟢' :
                     insight.status === 'good' ? '🟡' :
                     insight.status === 'warning' ? '🟠' : '🔴';
        report += `${emoji} ${insight.metric}: ${insight.value} (${insight.status})\n`;
      });

      // Qualidade por modo
      report += `\n═══ QUALIDADE POR MODO ═══\n`;
      byMode.slice(0, 5).forEach(mode => {
        report += `• ${mode.mode_used || 'desconhecido'}: ${parseFloat(mode.avg_quality_score).toFixed(1)}/100 `;
        report += `(${mode.total_responses} respostas, ${parseFloat(mode.high_quality_percentage).toFixed(0)}% alta qualidade)\n`;
      });

      // Problemas comuns
      if (issues.length > 0) {
        report += `\n═══ TOP PROBLEMAS ═══\n`;
        issues.forEach((issue, i) => {
          report += `${i + 1}. ${issue.rejection_reason} (${issue.occurrence_count}x)\n`;
        });
      }

      return report;

    } catch (error) {
      console.error('❌ Erro ao gerar relatório:', error);
      return 'Erro ao gerar relatório de qualidade';
    }
  }
}

// Singleton instance
let qualityTracker: ResponseQualityTracker | null = null;

/**
 * Obtém instância do tracker
 */
export function getQualityTracker(): ResponseQualityTracker {
  if (!qualityTracker) {
    qualityTracker = new ResponseQualityTracker();
  }
  return qualityTracker;
}

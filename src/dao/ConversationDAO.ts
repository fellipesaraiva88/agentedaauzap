import { BaseDAO, Transaction } from './BaseDAO';
import {
  ConversationEpisode,
  ConversationHistory,
  ConversionOpportunity,
  ScheduledFollowup,
  ResponseQuality,
  CreateConversationEpisodeDTO,
  CreateConversionOpportunityDTO,
  CreateScheduledFollowupDTO,
  RecordConversationDTO
} from '../types/entities';

/**
 * DAO para gerenciamento de episódios de conversa
 */
export class ConversationEpisodeDAO extends BaseDAO<ConversationEpisode> {
  constructor() {
    super('conversation_episodes');
  }

  /**
   * Busca episódios de um tutor
   */
  public async findByTutor(tutorId: string, limit: number = 10): Promise<ConversationEpisode[]> {
    return await this.findAll({
      where: { tutor_id: tutorId },
      orderBy: 'inicio_conversa DESC',
      limit
    });
  }

  /**
   * Busca episódios que converteram
   */
  public async findConverted(companyId?: number): Promise<ConversationEpisode[]> {
    const where: any = { converteu: true };
    if (companyId || this.companyId) {
      where.company_id = companyId || this.companyId;
    }

    return await this.findAll({
      where,
      orderBy: 'inicio_conversa DESC'
    });
  }

  /**
   * Busca último episódio de um tutor
   */
  public async findLastByTutor(tutorId: string): Promise<ConversationEpisode | null> {
    return await this.findOne({
      where: { tutor_id: tutorId },
      orderBy: 'inicio_conversa DESC'
    });
  }

  /**
   * Cria novo episódio
   */
  public async createEpisode(
    data: CreateConversationEpisodeDTO,
    transaction?: Transaction
  ): Promise<ConversationEpisode> {
    const episodeData = {
      ...data,
      total_mensagens: 0,
      converteu: false,
      created_at: new Date()
    };

    return await this.create(episodeData, transaction);
  }

  /**
   * Finaliza episódio
   */
  public async finishEpisode(
    episodeId: number,
    data: {
      resumo_conversa?: string;
      proximos_passos?: string;
      converteu?: boolean;
      valor_convertido?: number;
      tipo_conversao?: 'agendamento' | 'compra' | 'lead_qualificado' | 'reativacao';
    }
  ): Promise<ConversationEpisode | null> {
    return await this.update(episodeId, {
      ...data,
      fim_conversa: new Date()
    } as any);
  }

  /**
   * Taxa de conversão por período
   */
  public async getConversionRate(
    companyId: number,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const sql = `
      SELECT
        COUNT(*) FILTER (WHERE converteu = TRUE) as convertidos,
        COUNT(*) as total
      FROM conversation_episodes
      WHERE company_id = $1
      AND inicio_conversa BETWEEN $2 AND $3
    `;

    const result = await this.postgres.getOne<{ convertidos: string; total: string }>(
      sql,
      [companyId, startDate, endDate]
    );

    const convertidos = parseInt(result?.convertidos || '0', 10);
    const total = parseInt(result?.total || '0', 10);

    return total > 0 ? (convertidos / total) * 100 : 0;
  }
}

/**
 * DAO para histórico de conversas
 */
export class ConversationHistoryDAO extends BaseDAO<ConversationHistory> {
  constructor() {
    super('conversation_history');
  }

  /**
   * Busca conversas de um chat
   */
  public async findByChatId(
    chatId: string,
    limit: number = 50,
    companyId?: number
  ): Promise<ConversationHistory[]> {
    const where: any = { chat_id: chatId };
    if (companyId || this.companyId) {
      where.company_id = companyId || this.companyId;
    }

    return await this.findAll({
      where,
      orderBy: 'timestamp DESC',
      limit
    });
  }

  /**
   * Registra mensagem
   */
  public async recordMessage(
    data: RecordConversationDTO,
    transaction?: Transaction
  ): Promise<ConversationHistory> {
    const messageData = {
      ...data,
      timestamp: new Date(),
      created_at: new Date()
    };

    return await this.create(messageData, transaction);
  }

  /**
   * Busca mensagens por sentimento
   */
  public async findBySentiment(
    sentiment: 'positive' | 'negative' | 'neutral',
    companyId?: number
  ): Promise<ConversationHistory[]> {
    const where: any = { sentiment };
    if (companyId || this.companyId) {
      where.company_id = companyId || this.companyId;
    }

    return await this.findAll({
      where,
      orderBy: 'timestamp DESC',
      limit: 100
    });
  }

  /**
   * Tempo médio de resposta
   */
  public async getAverageResponseTime(companyId: number): Promise<number> {
    const sql = `
      SELECT AVG(response_time_ms) as avg_time
      FROM conversation_history
      WHERE company_id = $1
      AND response_time_ms IS NOT NULL
      AND sender = 'agent'
    `;

    const result = await this.postgres.getOne<{ avg_time: string }>(sql, [companyId]);
    return parseFloat(result?.avg_time || '0');
  }
}

/**
 * DAO para oportunidades de conversão
 */
export class ConversionOpportunityDAO extends BaseDAO<ConversionOpportunity> {
  constructor() {
    super('conversion_opportunities');
  }

  /**
   * Busca oportunidades ativas
   */
  public async findActive(companyId?: number): Promise<ConversionOpportunity[]> {
    const where: any = { converted: false };
    if (companyId || this.companyId) {
      where.company_id = companyId || this.companyId;
    }

    return await this.findAll({
      where,
      orderBy: 'score DESC, urgency_level DESC'
    });
  }

  /**
   * Busca oportunidades por urgência
   */
  public async findByUrgency(
    urgency: 'baixa' | 'media' | 'alta' | 'critica',
    companyId?: number
  ): Promise<ConversionOpportunity[]> {
    const where: any = { urgency_level: urgency, converted: false };
    if (companyId || this.companyId) {
      where.company_id = companyId || this.companyId;
    }

    return await this.findAll({
      where,
      orderBy: 'score DESC'
    });
  }

  /**
   * Busca oportunidades de alto valor
   */
  public async findHighValue(minScore: number = 80, companyId?: number): Promise<ConversionOpportunity[]> {
    const where: any = {
      converted: false,
      score: { $gte: minScore }
    };
    if (companyId || this.companyId) {
      where.company_id = companyId || this.companyId;
    }

    return await this.findAll({
      where,
      orderBy: 'score DESC'
    });
  }

  /**
   * Cria oportunidade
   */
  public async createOpportunity(
    data: CreateConversionOpportunityDTO,
    transaction?: Transaction
  ): Promise<ConversionOpportunity> {
    const opportunityData = {
      ...data,
      converted: false,
      created_at: new Date(),
      updated_at: new Date()
    };

    return await this.create(opportunityData, transaction);
  }

  /**
   * Marca como convertida
   */
  public async markAsConverted(
    opportunityId: number,
    valorConvertido?: number
  ): Promise<ConversionOpportunity | null> {
    return await this.update(opportunityId, {
      converted: true,
      conversion_date: new Date(),
      valor_convertido: valorConvertido
    });
  }

  /**
   * Taxa de conversão de oportunidades
   */
  public async getConversionRate(companyId: number): Promise<number> {
    const sql = `
      SELECT
        COUNT(*) FILTER (WHERE converted = TRUE) as convertidas,
        COUNT(*) as total
      FROM conversion_opportunities
      WHERE company_id = $1
    `;

    const result = await this.postgres.getOne<{ convertidas: string; total: string }>(sql, [companyId]);
    const convertidas = parseInt(result?.convertidas || '0', 10);
    const total = parseInt(result?.total || '0', 10);

    return total > 0 ? (convertidas / total) * 100 : 0;
  }
}

/**
 * DAO para follow-ups agendados
 */
export class ScheduledFollowupDAO extends BaseDAO<ScheduledFollowup> {
  constructor() {
    super('scheduled_followups');
  }

  /**
   * Busca follow-ups pendentes
   */
  public async findPending(companyId?: number): Promise<ScheduledFollowup[]> {
    const where: any = { executed: false };
    if (companyId || this.companyId) {
      where.company_id = companyId || this.companyId;
    }

    return await this.findAll({
      where,
      orderBy: 'scheduled_for ASC'
    });
  }

  /**
   * Busca follow-ups para executar agora
   */
  public async findDueNow(companyId?: number): Promise<ScheduledFollowup[]> {
    const now = new Date();

    let sql = `
      SELECT * FROM scheduled_followups
      WHERE executed = FALSE
      AND scheduled_for <= $1
    `;

    const params: any[] = [now];
    let paramIndex = 2;

    if (companyId || this.companyId) {
      sql += ` AND company_id = $${paramIndex}`;
      params.push(companyId || this.companyId);
    }

    sql += ' ORDER BY scheduled_for ASC';

    return await this.executeRaw<ScheduledFollowup>(sql, params);
  }

  /**
   * Cria follow-up
   */
  public async createFollowup(
    data: CreateScheduledFollowupDTO,
    transaction?: Transaction
  ): Promise<ScheduledFollowup> {
    const followupData = {
      ...data,
      executed: false,
      attempt: 0,
      max_attempts: data.max_attempts || 3,
      created_at: new Date(),
      updated_at: new Date()
    };

    return await this.create(followupData, transaction);
  }

  /**
   * Marca como executado
   */
  public async markAsExecuted(
    followupId: number,
    success: boolean,
    error?: string
  ): Promise<ScheduledFollowup | null> {
    return await this.update(followupId, {
      executed: true,
      executed_at: new Date(),
      sucesso: success,
      erro: error
    });
  }

  /**
   * Incrementa tentativa
   */
  public async incrementAttempt(followupId: number): Promise<ScheduledFollowup | null> {
    const followup = await this.findById(followupId);
    if (!followup) return null;

    return await this.update(followupId, {
      attempt: followup.attempt + 1
    });
  }
}

/**
 * DAO para qualidade de resposta
 */
export class ResponseQualityDAO extends BaseDAO<ResponseQuality> {
  constructor() {
    super('response_quality');
  }

  /**
   * Busca avaliações de um chat
   */
  public async findByChatId(chatId: string, limit: number = 10): Promise<ResponseQuality[]> {
    return await this.findAll({
      where: { chat_id: chatId },
      orderBy: 'avaliado_em DESC',
      limit
    });
  }

  /**
   * Calcula score médio
   */
  public async getAverageScore(companyId: number): Promise<number> {
    const sql = `
      SELECT AVG(overall_score) as avg_score
      FROM response_quality
      WHERE company_id = $1
    `;

    const result = await this.postgres.getOne<{ avg_score: string }>(sql, [companyId]);
    return parseFloat(result?.avg_score || '0');
  }

  /**
   * Busca respostas de baixa qualidade
   */
  public async findLowQuality(threshold: number = 5, companyId?: number): Promise<ResponseQuality[]> {
    const where: any = {
      overall_score: { $lt: threshold }
    };
    if (companyId || this.companyId) {
      where.company_id = companyId || this.companyId;
    }

    return await this.findAll({
      where,
      orderBy: 'overall_score ASC',
      limit: 50
    });
  }
}
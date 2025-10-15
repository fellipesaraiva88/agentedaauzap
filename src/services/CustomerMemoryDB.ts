import Database from 'better-sqlite3';
import { UserProfile, Purchase, ScheduledFollowUp, ConversionOpportunity } from '../types/UserProfile';
import fs from 'fs';
import path from 'path';

/**
 * Serviço de banco de dados para memória persistente de clientes
 * Armazena perfis, histórico e análises comportamentais
 */
export class CustomerMemoryDB {
  private db: Database.Database;
  private dbPath: string;

  constructor(dbPath: string = './data/customers.db') {
    this.dbPath = dbPath;

    // Cria diretório se não existir
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Conecta ao banco
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL'); // Write-Ahead Logging para melhor performance

    // Inicializa schema
    this.initializeSchema();

    console.log(`📊 CustomerMemoryDB inicializado: ${dbPath}`);
  }

  /**
   * Inicializa o schema do banco de dados
   */
  private initializeSchema(): void {
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    // Executa o schema
    this.db.exec(schema);
  }

  /**
   * Obtém ou cria perfil de usuário
   */
  public getOrCreateProfile(chatId: string): UserProfile {
    const existing = this.db.prepare(`
      SELECT * FROM user_profiles WHERE chat_id = ?
    `).get(chatId) as any;

    if (existing) {
      return this.rowToUserProfile(existing);
    }

    // Cria novo perfil
    const now = Date.now();
    this.db.prepare(`
      INSERT INTO user_profiles (chat_id, last_message_timestamp)
      VALUES (?, ?)
    `).run(chatId, now);

    return this.getOrCreateProfile(chatId);
  }

  /**
   * Atualiza perfil de usuário
   */
  public updateProfile(profile: Partial<UserProfile> & { chatId: string }): void {
    const fields: string[] = [];
    const values: any[] = [];

    // Campos simples
    const simpleFields = [
      'nome', 'pet_nome', 'pet_raca', 'pet_porte', 'pet_tipo',
      'last_message_timestamp', 'avg_response_time', 'engagement_score',
      'engagement_level', 'conversation_stage', 'purchase_intent',
      'last_sentiment', 'total_messages', 'total_conversations', 'notes'
    ];

    Object.keys(profile).forEach(key => {
      const snakeCase = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      if (simpleFields.includes(snakeCase) && profile[key as keyof typeof profile] !== undefined) {
        fields.push(`${snakeCase} = ?`);
        values.push(profile[key as keyof typeof profile]);
      }
    });

    // Preferências (JSON)
    if (profile.preferences) {
      fields.push('preferences = ?');
      values.push(JSON.stringify(profile.preferences));
    }

    if (fields.length > 0) {
      values.push(profile.chatId);
      this.db.prepare(`
        UPDATE user_profiles
        SET ${fields.join(', ')}
        WHERE chat_id = ?
      `).run(...values);
    }
  }

  /**
   * Adiciona tempo de resposta ao histórico
   */
  public addResponseTime(chatId: string, responseTime: number): void {
    this.db.prepare(`
      INSERT INTO response_times (chat_id, response_time)
      VALUES (?, ?)
    `).run(chatId, responseTime);

    // Mantém apenas últimas 10 respostas
    this.db.prepare(`
      DELETE FROM response_times
      WHERE chat_id = ?
      AND id NOT IN (
        SELECT id FROM response_times
        WHERE chat_id = ?
        ORDER BY timestamp DESC
        LIMIT 10
      )
    `).run(chatId, chatId);
  }

  /**
   * Obtém histórico de tempos de resposta
   */
  public getResponseTimeHistory(chatId: string): number[] {
    const rows = this.db.prepare(`
      SELECT response_time
      FROM response_times
      WHERE chat_id = ?
      ORDER BY timestamp DESC
      LIMIT 10
    `).all(chatId) as { response_time: number }[];

    return rows.map(r => r.response_time);
  }

  /**
   * Adiciona interesse do usuário
   */
  public addInterest(chatId: string, interest: string): void {
    // Verifica se já existe
    const exists = this.db.prepare(`
      SELECT id FROM user_interests
      WHERE chat_id = ? AND interest = ?
    `).get(chatId, interest);

    if (!exists) {
      this.db.prepare(`
        INSERT INTO user_interests (chat_id, interest)
        VALUES (?, ?)
      `).run(chatId, interest);
    }
  }

  /**
   * Obtém interesses do usuário
   */
  public getInterests(chatId: string): string[] {
    const rows = this.db.prepare(`
      SELECT DISTINCT interest
      FROM user_interests
      WHERE chat_id = ?
      ORDER BY mentioned_at DESC
    `).all(chatId) as { interest: string }[];

    return rows.map(r => r.interest);
  }

  /**
   * Adiciona objeção do usuário
   */
  public addObjection(chatId: string, objection: string): void {
    this.db.prepare(`
      INSERT INTO user_objections (chat_id, objection)
      VALUES (?, ?)
    `).run(chatId, objection);
  }

  /**
   * Obtém objeções não resolvidas
   */
  public getObjections(chatId: string): string[] {
    const rows = this.db.prepare(`
      SELECT objection
      FROM user_objections
      WHERE chat_id = ? AND resolved = FALSE
      ORDER BY mentioned_at DESC
    `).all(chatId) as { objection: string }[];

    return rows.map(r => r.objection);
  }

  /**
   * Adiciona compra ao histórico
   */
  public addPurchase(chatId: string, purchase: Purchase): void {
    this.db.prepare(`
      INSERT INTO purchases (chat_id, service, value, pet_name)
      VALUES (?, ?, ?, ?)
    `).run(chatId, purchase.service, purchase.value, purchase.petName || null);
  }

  /**
   * Obtém histórico de compras
   */
  public getPurchaseHistory(chatId: string): Purchase[] {
    const rows = this.db.prepare(`
      SELECT service, value, pet_name, purchase_date
      FROM purchases
      WHERE chat_id = ?
      ORDER BY purchase_date DESC
    `).all(chatId) as any[];

    return rows.map(r => ({
      date: new Date(r.purchase_date),
      service: r.service,
      value: r.value,
      petName: r.pet_name
    }));
  }

  /**
   * Salva mensagem no histórico
   */
  public saveMessage(chatId: string, role: 'user' | 'assistant', content: string, sentiment?: string, engagementScore?: number, messageId?: string): void {
    this.db.prepare(`
      INSERT INTO conversation_history (chat_id, role, content, sentiment, engagement_score, message_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(chatId, role, content, sentiment || null, engagementScore || null, messageId || null);

    // Mantém apenas últimas 50 mensagens por chat
    this.db.prepare(`
      DELETE FROM conversation_history
      WHERE chat_id = ?
      AND id NOT IN (
        SELECT id FROM conversation_history
        WHERE chat_id = ?
        ORDER BY timestamp DESC
        LIMIT 50
      )
    `).run(chatId, chatId);
  }

  /**
   * Obtém mensagens recentes com IDs (para QuoteAnalyzer)
   */
  public getRecentMessagesWithIds(chatId: string, limit: number = 10): Array<{
    messageId: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
    sentiment?: string;
  }> {
    const rows = this.db.prepare(`
      SELECT message_id, role, content, timestamp, sentiment
      FROM conversation_history
      WHERE chat_id = ?
      ORDER BY timestamp DESC
      LIMIT ?
    `).all(chatId, limit) as any[];

    // Retorna em ordem cronológica (mais antiga primeiro)
    return rows.reverse().map(r => ({
      messageId: r.message_id || `fallback_${r.timestamp}`, // Fallback para msgs antigas sem ID
      role: r.role as 'user' | 'assistant',
      content: r.content,
      timestamp: new Date(r.timestamp).getTime(),
      sentiment: r.sentiment
    }));
  }

  /**
   * Agenda follow-up
   */
  public scheduleFollowUp(followUp: ScheduledFollowUp): void {
    this.db.prepare(`
      INSERT INTO scheduled_followups (chat_id, scheduled_for, reason, message, attempt, last_topic, last_stage)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      followUp.chatId,
      followUp.scheduledFor.toISOString(),
      followUp.reason,
      followUp.message,
      followUp.attempt,
      followUp.context.lastTopic,
      followUp.context.lastStage
    );
  }

  /**
   * Obtém follow-ups pendentes
   */
  public getPendingFollowUps(): ScheduledFollowUp[] {
    const rows = this.db.prepare(`
      SELECT *
      FROM scheduled_followups
      WHERE executed = FALSE
      AND datetime(scheduled_for) <= datetime('now')
      ORDER BY scheduled_for ASC
    `).all() as any[];

    return rows.map(r => ({
      chatId: r.chat_id,
      scheduledFor: new Date(r.scheduled_for),
      reason: r.reason,
      message: r.message,
      attempt: r.attempt,
      context: {
        lastTopic: r.last_topic,
        lastStage: r.last_stage
      }
    }));
  }

  /**
   * Marca follow-up como executado
   */
  public markFollowUpExecuted(chatId: string): void {
    this.db.prepare(`
      UPDATE scheduled_followups
      SET executed = TRUE, executed_at = CURRENT_TIMESTAMP
      WHERE chat_id = ? AND executed = FALSE
    `).run(chatId);
  }

  /**
   * Salva oportunidade de conversão
   */
  public saveConversionOpportunity(opportunity: ConversionOpportunity & { chatId: string }): void {
    this.db.prepare(`
      INSERT INTO conversion_opportunities (chat_id, score, reason, suggested_action, urgency_level, close_message)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      opportunity.chatId,
      opportunity.score,
      opportunity.reason,
      opportunity.suggestedAction,
      opportunity.urgencyLevel,
      opportunity.closeMessage || null
    );
  }

  /**
   * Obtém oportunidades de conversão ativas
   */
  public getActiveConversionOpportunities(chatId: string): ConversionOpportunity[] {
    const rows = this.db.prepare(`
      SELECT score, reason, suggested_action, urgency_level, close_message
      FROM conversion_opportunities
      WHERE chat_id = ? AND converted = FALSE
      ORDER BY score DESC, urgency_level DESC
      LIMIT 3
    `).all(chatId) as any[];

    return rows.map(r => ({
      score: r.score,
      reason: r.reason,
      suggestedAction: r.suggested_action,
      urgencyLevel: r.urgency_level,
      closeMessage: r.close_message
    }));
  }

  /**
   * Converte row do banco para UserProfile
   */
  private rowToUserProfile(row: any): UserProfile {
    const preferences = row.preferences ? JSON.parse(row.preferences) : {};

    return {
      chatId: row.chat_id,
      nome: row.nome,
      petNome: row.pet_nome,
      petRaca: row.pet_raca,
      petPorte: row.pet_porte,
      petTipo: row.pet_tipo,
      firstContactDate: new Date(row.first_contact_date),
      lastMessageTimestamp: row.last_message_timestamp,
      lastFollowUpDate: row.last_follow_up_date ? new Date(row.last_follow_up_date) : undefined,
      avgResponseTime: row.avg_response_time,
      responseTimeHistory: this.getResponseTimeHistory(row.chat_id),
      engagementScore: row.engagement_score,
      engagementLevel: row.engagement_level,
      conversationStage: row.conversation_stage,
      purchaseIntent: row.purchase_intent,
      interests: this.getInterests(row.chat_id),
      objections: this.getObjections(row.chat_id),
      lastSentiment: row.last_sentiment,
      totalMessages: row.total_messages,
      totalConversations: row.total_conversations,
      purchaseHistory: this.getPurchaseHistory(row.chat_id),
      preferences,
      notes: row.notes || ''
    };
  }

  /**
   * Fecha conexão com banco de dados
   */
  public close(): void {
    this.db.close();
    console.log('📊 CustomerMemoryDB fechado');
  }
}

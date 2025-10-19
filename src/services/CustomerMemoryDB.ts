import { UserProfile, Purchase, ScheduledFollowUp, ConversionOpportunity } from '../types/UserProfile';
import { PostgreSQLClient, postgresClient } from './PostgreSQLClient';
import { RedisClient, redisClient } from './RedisClient';

/**
 * Tipo de banco de dados em uso
 */
type DatabaseType = 'postgres';

/**
 * 🚀 SERVIÇO DE BANCO DE DADOS - POSTGRESQL + REDIS
 * Armazena perfis, histórico e análises comportamentais
 *
 * DATABASE: PostgreSQL (obrigatório)
 * CACHE: Redis (perfis, contextos, queries frequentes)
 * PERFORMANCE: 10-100x mais rápido com cache
 */
export class CustomerMemoryDB {
  private postgres: PostgreSQLClient;
  private redis: RedisClient;
  private dbType: DatabaseType;

  constructor() {
    // 🎯 POSTGRESQL OBRIGATÓRIO
    if (!process.env.DATABASE_URL) {
      throw new Error('❌ DATABASE_URL não configurado! PostgreSQL é obrigatório.');
    }

    this.dbType = 'postgres';
    this.postgres = PostgreSQLClient.getInstance();
    this.redis = RedisClient.getInstance();

    console.log('📊 CustomerMemoryDB: POSTGRESQL + REDIS');
    console.log('   ✅ Performance máxima com cache');
  }

  /**
   * 🚀 Obtém ou cria perfil de usuário (COM CACHE REDIS)
   *
   * Fluxo otimizado:
   * 1. Tenta cache Redis (< 1ms) ✅
   * 2. Se miss, busca do banco (50-100ms)
   * 3. Salva no cache para próximas (1h TTL)
   *
   * Performance: 10-100x mais rápido com cache hit!
   */
  public async getOrCreateProfile(chatId: string): Promise<UserProfile> {
    // 1️⃣ CACHE LAYER - Tenta Redis primeiro
    if (this.redis?.isRedisConnected()) {
      const cached = await this.redis.getCachedProfile(chatId);
      if (cached) {
        // console.log(`✅ Cache HIT: ${chatId} (< 1ms)`);
        return cached;
      }
      // console.log(`⚠️ Cache MISS: ${chatId} - buscando do banco...`);
    }

    // 2️⃣ DATABASE LAYER - Busca do PostgreSQL
    const profile = await this.getOrCreateProfileFromDB(chatId);

    // 3️⃣ CACHE UPDATE - Salva no Redis para próximas consultas
    if (this.redis?.isRedisConnected()) {
      await this.redis.cacheProfile(chatId, profile);
      // console.log(`💾 Profile cached: ${chatId} (TTL: 1h)`);
    }

    return profile;
  }

  /**
   * 🐘 Obtém ou cria perfil (POSTGRESQL)
   */
  private async getOrCreateProfileFromDB(chatId: string): Promise<UserProfile> {
    try {
      // Busca perfil existente
      const existing = await this.postgres.getOne<any>(
        `SELECT * FROM user_profiles WHERE chat_id = $1`,
        [chatId]
      );

      if (existing) {
        return this.rowToUserProfile(existing);
      }

      // Cria novo perfil
      const now = Date.now();
      const newProfile = await this.postgres.insert<any>('user_profiles', {
        chat_id: chatId,
        last_message_timestamp: now
      });

      return this.rowToUserProfile(newProfile);
    } catch (error) {
      console.error('❌ Erro ao buscar/criar perfil PostgreSQL:', error);
      throw error;
    }
  }

  /**
   * 🚀 Atualiza perfil de usuário (COM CACHE INVALIDATION)
   *
   * Fluxo:
   * 1. Atualiza no banco
   * 2. Invalida cache Redis (próxima leitura será fresh)
   */
  public async updateProfile(profile: Partial<UserProfile> & { chatId: string }): Promise<void> {
    // 1️⃣ Atualiza no banco
    await this.updateProfileInDB(profile);

    // 2️⃣ Invalida cache (próxima leitura pega dado atualizado)
    if (this.redis?.isRedisConnected()) {
      await this.redis.invalidateProfile(profile.chatId);
      // console.log(`🗑️ Cache invalidado: ${profile.chatId}`);
    }
  }

  /**
   * 🐘 Atualiza perfil (POSTGRESQL)
   */
  private async updateProfileInDB(profile: Partial<UserProfile> & { chatId: string }): Promise<void> {
    try {
      const updateData: Record<string, any> = {};

      // Campos simples
      const fieldMap: Record<string, string> = {
        nome: 'nome',
        petNome: 'pet_nome',
        petRaca: 'pet_raca',
        petPorte: 'pet_porte',
        petTipo: 'pet_tipo',
        lastMessageTimestamp: 'last_message_timestamp',
        avgResponseTime: 'avg_response_time',
        engagementScore: 'engagement_score',
        engagementLevel: 'engagement_level',
        conversationStage: 'conversation_stage',
        purchaseIntent: 'purchase_intent',
        lastSentiment: 'last_sentiment',
        totalMessages: 'total_messages',
        totalConversations: 'total_conversations',
        notes: 'notes'
      };

      Object.keys(profile).forEach(key => {
        if (key !== 'chatId' && fieldMap[key] && profile[key as keyof typeof profile] !== undefined) {
          updateData[fieldMap[key]] = profile[key as keyof typeof profile];
        }
      });

      // Preferências (JSONB no Postgres)
      if (profile.preferences) {
        updateData.preferences = JSON.stringify(profile.preferences);
      }

      if (Object.keys(updateData).length > 0) {
        await this.postgres.update('user_profiles', updateData, { chat_id: profile.chatId });
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar perfil PostgreSQL:', error);
      throw error;
    }
  }

  /**
   * Adiciona tempo de resposta ao histórico
   */
  public async addResponseTime(chatId: string, responseTime: number): Promise<void> {
    try {
      await this.postgres.insert('response_times', {
        chat_id: chatId,
        response_time: responseTime
      });

      // Mantém apenas últimas 50 respostas (TODO: implementar limpeza automática)
      // Por enquanto, deixa acumular
    } catch (error) {
      console.error('❌ Erro ao salvar response time no PostgreSQL:', error);
    }
  }

  /**
   * Obtém histórico de tempos de resposta
   */
  public async getResponseTimeHistory(chatId: string): Promise<number[]> {
    try {
      const result = await this.postgres.query<any>(
        `SELECT response_time FROM response_times
         WHERE chat_id = $1
         ORDER BY timestamp DESC
         LIMIT 50`,
        [chatId]
      );

      return result.rows?.map(r => r.response_time) || [];
    } catch (error) {
      console.error('❌ Erro ao buscar response time history:', error);
      return [];
    }
  }

  /**
   * Adiciona interesse do usuário
   */
  public async addInterest(chatId: string, interest: string): Promise<void> {
    try {
      // Verifica se já existe
      const exists = await this.postgres.getOne<any>(
        `SELECT id FROM user_interests WHERE chat_id = $1 AND interest = $2`,
        [chatId, interest]
      );

      if (!exists) {
        await this.postgres.insert('user_interests', {
          chat_id: chatId,
          interest
        });
      }
    } catch (error) {
      console.error('❌ Erro ao adicionar interesse:', error);
    }
  }

  /**
   * Obtém interesses do usuário
   */
  public async getInterests(chatId: string): Promise<string[]> {
    try {
      const result = await this.postgres.query<any>(
        `SELECT DISTINCT interest FROM user_interests
         WHERE chat_id = $1
         ORDER BY mentioned_at DESC`,
        [chatId]
      );

      return result.rows?.map(r => r.interest) || [];
    } catch (error) {
      console.error('❌ Erro ao buscar interesses:', error);
      return [];
    }
  }

  /**
   * Adiciona objeção do usuário
   */
  public async addObjection(chatId: string, objection: string): Promise<void> {
    try {
      await this.postgres.insert('user_objections', {
        chat_id: chatId,
        objection
      });
    } catch (error) {
      console.error('❌ Erro ao adicionar objeção:', error);
    }
  }

  /**
   * Obtém objeções não resolvidas
   */
  public async getObjections(chatId: string): Promise<string[]> {
    try {
      const result = await this.postgres.query<any>(
        `SELECT objection FROM user_objections
         WHERE chat_id = $1 AND resolved = FALSE
         ORDER BY mentioned_at DESC`,
        [chatId]
      );

      return result.rows?.map(r => r.objection) || [];
    } catch (error) {
      console.error('❌ Erro ao buscar objeções:', error);
      return [];
    }
  }

  /**
   * Adiciona compra ao histórico
   */
  public async addPurchase(chatId: string, purchase: Purchase): Promise<void> {
    try {
      await this.postgres.insert('purchases', {
        chat_id: chatId,
        service: purchase.service,
        value: purchase.value,
        pet_name: purchase.petName || null
      });
    } catch (error) {
      console.error('❌ Erro ao adicionar compra:', error);
    }
  }

  /**
   * Obtém histórico de compras
   */
  public async getPurchaseHistory(chatId: string): Promise<Purchase[]> {
    try {
      const result = await this.postgres.query<any>(
        `SELECT service, value, pet_name, purchase_date
         FROM purchases
         WHERE chat_id = $1
         ORDER BY purchase_date DESC`,
        [chatId]
      );

      return result.rows?.map(r => ({
        date: new Date(r.purchase_date),
        service: r.service,
        value: r.value,
        petName: r.pet_name
      })) || [];
    } catch (error) {
      console.error('❌ Erro ao buscar histórico de compras:', error);
      return [];
    }
  }

  /**
   * Salva mensagem no histórico
   */
  public async saveMessage(chatId: string, role: 'user' | 'assistant', content: string, sentiment?: string, engagementScore?: number, messageId?: string): Promise<void> {
    try {
      // Insere mensagem
      await this.postgres.insert('conversation_history', {
        chat_id: chatId,
        role,
        content,
        sentiment: sentiment || null,
        engagement_score: engagementScore || null,
        message_id: messageId || null
      });

      // Mantém apenas últimas 50 mensagens por chat (limpa mensagens antigas)
      // TODO: Implementar limpeza automática no PostgreSQL
      // Por enquanto, deixa acumular (pode criar função postgres ou cron job depois)

    } catch (error) {
      console.error('❌ Erro ao salvar mensagem no PostgreSQL:', error);
      throw error;
    }
  }

  /**
   * Obtém mensagens recentes com IDs (para QuoteAnalyzer)
   */
  public async getRecentMessagesWithIds(chatId: string, limit: number = 10): Promise<Array<{
    messageId: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
    sentiment?: string;
  }>> {
    try {
      // Busca mensagens ordenadas por timestamp DESC
      const result = await this.postgres.query<any>(
        `SELECT * FROM conversation_history
         WHERE chat_id = $1
         ORDER BY timestamp DESC
         LIMIT $2`,
        [chatId, limit]
      );

      if (!result.rows || result.rows.length === 0) {
        return [];
      }

      // Retorna em ordem cronológica (mais antiga primeiro)
      return result.rows.reverse().map((m: any) => ({
        messageId: m.message_id || `fallback_${m.timestamp}`,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        timestamp: new Date(m.timestamp).getTime(),
        sentiment: m.sentiment
      }));
    } catch (error) {
      console.error('❌ Erro ao buscar mensagens com IDs no PostgreSQL:', error);
      return []; // Retorna vazio em caso de erro
    }
  }

  /**
   * Agenda follow-up
   */
  public async scheduleFollowUp(followUp: ScheduledFollowUp): Promise<void> {
    try {
      await this.postgres.insert('scheduled_followups', {
        chat_id: followUp.chatId,
        scheduled_for: followUp.scheduledFor.toISOString(),
        reason: followUp.reason,
        message: followUp.message,
        attempt: followUp.attempt,
        last_topic: followUp.context.lastTopic,
        last_stage: followUp.context.lastStage
      });
    } catch (error) {
      console.error('❌ Erro ao agendar follow-up:', error);
    }
  }

  /**
   * Obtém follow-ups pendentes
   */
  public async getPendingFollowUps(): Promise<ScheduledFollowUp[]> {
    try {
      const result = await this.postgres.query<any>(
        `SELECT * FROM scheduled_followups
         WHERE executed = FALSE
         AND scheduled_for <= NOW()
         ORDER BY scheduled_for ASC`
      );

      return result.rows?.map(r => ({
        chatId: r.chat_id,
        scheduledFor: new Date(r.scheduled_for),
        reason: r.reason,
        message: r.message,
        attempt: r.attempt,
        context: {
          lastTopic: r.last_topic,
          lastStage: r.last_stage
        }
      })) || [];
    } catch (error) {
      console.error('❌ Erro ao buscar follow-ups pendentes:', error);
      return [];
    }
  }

  /**
   * Marca follow-up como executado
   */
  public async markFollowUpExecuted(chatId: string): Promise<void> {
    try {
      await this.postgres.query(
        `UPDATE scheduled_followups
         SET executed = TRUE, executed_at = NOW()
         WHERE chat_id = $1 AND executed = FALSE`,
        [chatId]
      );
    } catch (error) {
      console.error('❌ Erro ao marcar follow-up como executado:', error);
    }
  }

  /**
   * Salva oportunidade de conversão
   */
  public async saveConversionOpportunity(opportunity: ConversionOpportunity & { chatId: string }): Promise<void> {
    try {
      await this.postgres.insert('conversion_opportunities', {
        chat_id: opportunity.chatId,
        score: opportunity.score,
        reason: opportunity.reason,
        suggested_action: opportunity.suggestedAction,
        urgency_level: opportunity.urgencyLevel,
        close_message: opportunity.closeMessage || null
      });
    } catch (error) {
      console.error('❌ Erro ao salvar conversion opportunity no PostgreSQL:', error);
    }
  }

  /**
   * Obtém oportunidades de conversão ativas
   */
  public async getActiveConversionOpportunities(chatId: string): Promise<ConversionOpportunity[]> {
    try {
      const result = await this.postgres.query<any>(
        `SELECT score, reason, suggested_action, urgency_level, close_message
         FROM conversion_opportunities
         WHERE chat_id = $1 AND converted = FALSE
         ORDER BY score DESC, urgency_level DESC
         LIMIT 3`,
        [chatId]
      );

      return result.rows?.map(r => ({
        score: r.score,
        reason: r.reason,
        suggestedAction: r.suggested_action,
        urgencyLevel: r.urgency_level,
        closeMessage: r.close_message
      })) || [];
    } catch (error) {
      console.error('❌ Erro ao buscar oportunidades de conversão:', error);
      return [];
    }
  }

  /**
   * Converte row do banco para UserProfile
   */
  private async rowToUserProfile(row: any): Promise<UserProfile> {
    // No PostgreSQL, preferences já vem como objeto (JSONB)
    let preferences = {};
    if (row.preferences) {
      if (typeof row.preferences === 'string') {
        try {
          preferences = JSON.parse(row.preferences);
        } catch (e) {
          console.warn('⚠️  Erro ao fazer parse de preferences, usando objeto vazio');
          preferences = {};
        }
      } else if (typeof row.preferences === 'object') {
        preferences = row.preferences;
      }
    }

    // Busca dados relacionados de forma assíncrona
    const [responseTimeHistory, interests, objections, purchaseHistory] = await Promise.all([
      this.getResponseTimeHistory(row.chat_id),
      this.getInterests(row.chat_id),
      this.getObjections(row.chat_id),
      this.getPurchaseHistory(row.chat_id)
    ]);

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
      responseTimeHistory,
      engagementScore: row.engagement_score,
      engagementLevel: row.engagement_level,
      conversationStage: row.conversation_stage,
      purchaseIntent: row.purchase_intent,
      interests,
      objections,
      lastSentiment: row.last_sentiment,
      totalMessages: row.total_messages,
      totalConversations: row.total_conversations,
      purchaseHistory,
      preferences,
      notes: row.notes || ''
    };
  }

  /**
   * Salva follow-up imediato executado
   */
  public async saveImmediateFollowUp(chatId: string, level: number, message: string, attempt: number): Promise<void> {
    try {
      await this.postgres.insert('immediate_followups', {
        chat_id: chatId,
        level,
        message,
        attempt,
        executed_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Erro ao salvar immediate follow-up:', error);
    }
  }

  /**
   * Marca cliente como abandonou (não respondeu 5 follow-ups)
   */
  public async markClientAsAbandoned(chatId: string): Promise<void> {
    try {
      await this.postgres.update(
        'user_profiles',
        {
          conversation_stage: 'abandonou',
          last_updated: new Date().toISOString()
        },
        { chat_id: chatId }
      );

      console.log(`❌ Cliente ${chatId} marcado como abandonou`);
    } catch (error) {
      console.error('❌ Erro ao marcar cliente como abandonou:', error);
    }
  }

  /**
   * Busca follow-ups imediatos de um chat
   */
  public async getImmediateFollowUps(chatId: string): Promise<any[]> {
    try {
      const result = await this.postgres.query<any>(
        `SELECT * FROM immediate_followups
         WHERE chat_id = $1
         ORDER BY executed_at DESC`,
        [chatId]
      );

      return result.rows || [];
    } catch (error) {
      console.error('❌ Erro ao buscar immediate follow-ups:', error);
      return [];
    }
  }

  /**
   * Salva lembrete de agendamento
   */
  public async saveAppointmentReminder(reminder: any): Promise<void> {
    try {
      await this.postgres.insert('appointment_reminders', {
        chat_id: reminder.chatId,
        service: reminder.service,
        appointment_time: reminder.appointmentTime.toISOString(),
        reminder_time: reminder.reminderTime.toISOString(),
        minutes_before: reminder.minutesBefore,
        pet_name: reminder.petName || null,
        owner_name: reminder.ownerName || null
      });

      console.log(`📅 Lembrete salvo no banco: ${reminder.service}`);
    } catch (error) {
      console.error('❌ Erro ao salvar lembrete:', error);
    }
  }

  /**
   * Marca lembrete como enviado
   */
  public async markReminderAsSent(chatId: string, appointmentTimestamp: number): Promise<void> {
    try {
      await this.postgres.query(
        `UPDATE appointment_reminders
         SET sent = true, sent_at = NOW()
         WHERE chat_id = $1 AND EXTRACT(EPOCH FROM appointment_time) = $2`,
        [chatId, Math.floor(appointmentTimestamp / 1000)]
      );
    } catch (error) {
      console.error('❌ Erro ao marcar lembrete como enviado:', error);
    }
  }

  /**
   * Busca lembretes pendentes
   */
  public async getPendingReminders(): Promise<any[]> {
    try {
      const result = await this.postgres.query<any>(
        `SELECT * FROM appointment_reminders
         WHERE sent = false
         AND reminder_time > NOW()
         ORDER BY reminder_time ASC`
      );

      return result.rows || [];
    } catch (error) {
      console.error('❌ Erro ao buscar lembretes pendentes:', error);
      return [];
    }
  }

  /**
   * ====================================
   * MÉTODOS DE PAGAMENTO (ASAAS PIX)
   * ====================================
   */

  /**
   * Salva pagamento no banco
   */
  public async savePayment(payment: {
    chatId: string;
    paymentId: string;
    provider: string;
    amount: number;
    originalAmount?: number;
    discountAmount?: number;
    status: string;
    method: string;
    description?: string;
    paymentUrl?: string;
  }): Promise<void> {
    try {
      await this.postgres.insert('payments', {
        chat_id: payment.chatId,
        payment_id: payment.paymentId,
        provider: payment.provider,
        amount: payment.amount,
        original_amount: payment.originalAmount || payment.amount,
        discount_amount: payment.discountAmount || 0,
        status: payment.status,
        method: payment.method,
        description: payment.description || null,
        payment_url: payment.paymentUrl || null
      });

      console.log(`💳 Pagamento salvo: ${payment.paymentId} (${payment.status})`);
    } catch (error: any) {
      console.error('❌ Erro ao salvar pagamento:', error.message);
    }
  }

  /**
   * Atualiza status de pagamento
   */
  public async updatePaymentStatus(paymentId: string, status: string): Promise<void> {
    try {
      const updateData: any = { status };
      if (status === 'confirmed') {
        updateData.confirmed_at = new Date().toISOString();
      }

      await this.postgres.query(
        `UPDATE payments
         SET status = $1, confirmed_at = $2
         WHERE payment_id = $3`,
        [status, updateData.confirmed_at || null, paymentId]
      );

      console.log(`💳 Status atualizado: ${paymentId} → ${status}`);
    } catch (error: any) {
      console.error('❌ Erro ao atualizar status:', error.message);
    }
  }

  /**
   * Busca pagamento por ID
   */
  public async getPaymentById(paymentId: string): Promise<any> {
    try {
      return await this.postgres.getOne<any>(
        `SELECT * FROM payments WHERE payment_id = $1`,
        [paymentId]
      );
    } catch (error) {
      console.error('❌ Erro ao buscar pagamento por ID:', error);
      return null;
    }
  }

  /**
   * Busca pagamentos de um cliente
   */
  public async getPaymentsByCustomer(chatId: string): Promise<any[]> {
    try {
      const result = await this.postgres.query<any>(
        `SELECT * FROM payments
         WHERE chat_id = $1
         ORDER BY created_at DESC`,
        [chatId]
      );

      return result.rows || [];
    } catch (error) {
      console.error('❌ Erro ao buscar pagamentos do cliente:', error);
      return [];
    }
  }

  /**
   * Busca pagamentos pendentes (para monitoramento)
   */
  public async getPendingPayments(): Promise<any[]> {
    try {
      const result = await this.postgres.query<any>(
        `SELECT * FROM payments
         WHERE status = 'pending'
         ORDER BY created_at DESC`
      );

      return result.rows || [];
    } catch (error) {
      console.error('❌ Erro ao buscar pagamentos pendentes:', error);
      return [];
    }
  }

  /**
   * Analytics de pagamentos
   */
  public async getPaymentAnalytics(chatId?: string): Promise<any> {
    try {
      if (chatId) {
        return await this.postgres.getOne<any>(
          `SELECT * FROM payment_analytics WHERE chat_id = $1`,
          [chatId]
        );
      } else {
        return await this.postgres.getOne<any>(
          `SELECT
            COUNT(DISTINCT chat_id) as total_customers,
            SUM(total_payments) as total_payments,
            SUM(confirmed_payments) as confirmed_payments,
            SUM(total_revenue) as total_revenue,
            SUM(total_discounts_given) as total_discounts_given,
            AVG(avg_ticket) as avg_ticket
          FROM payment_analytics`
        );
      }
    } catch (error) {
      console.error('❌ Erro ao buscar analytics de pagamentos:', error);
      return null;
    }
  }

  /**
   * Fecha conexão com banco de dados
   */
  public close(): void {
    if (this.postgres) {
      this.postgres.close();
      console.log('📊 CustomerMemoryDB (PostgreSQL) desconectado');
    }
  }
}

// Re-export types for external use
export type { UserProfile, Purchase, ScheduledFollowUp, ConversionOpportunity } from '../types/UserProfile';

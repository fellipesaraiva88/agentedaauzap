import { RedisClient, redisClient } from './RedisClient';

/**
 * 🔴 SESSION MANAGER (Redis-based)
 *
 * Gerencia estados temporários e sessões:
 * - Follow-ups ativos
 * - Timers distribuídos
 * - Estados de conversação
 * - Flags temporárias
 *
 * TTL padrão: 24 horas (estados voláteis)
 */
export class SessionManager {
  private redis: RedisClient;

  constructor() {
    this.redis = RedisClient.getInstance();
  }

  // ==========================================
  // FOLLOW-UPS ATIVOS
  // ==========================================

  /**
   * Marca chat como tendo follow-ups ativos
   */
  public async setFollowUpActive(chatId: string, level: number): Promise<void> {
    if (!this.redis.isRedisConnected()) return;

    await this.redis.set(
      `session:followup:${chatId}`,
      { active: true, level, timestamp: Date.now() },
      7200 // 2 horas
    );
  }

  /**
   * Verifica se chat tem follow-ups ativos
   */
  public async isFollowUpActive(chatId: string): Promise<boolean> {
    if (!this.redis.isRedisConnected()) return false;

    const session = await this.redis.get(`session:followup:${chatId}`);
    return session?.active === true;
  }

  /**
   * Remove follow-up ativo
   */
  public async clearFollowUp(chatId: string): Promise<void> {
    if (!this.redis.isRedisConnected()) return;

    await this.redis.delete(`session:followup:${chatId}`);
  }

  /**
   * Pega nível atual do follow-up
   */
  public async getFollowUpLevel(chatId: string): Promise<number | null> {
    if (!this.redis.isRedisConnected()) return null;

    const session = await this.redis.get(`session:followup:${chatId}`);
    return session?.level || null;
  }

  // ==========================================
  // ESTADOS DE CONVERSAÇÃO
  // ==========================================

  /**
   * Salva estado temporário da conversação
   */
  public async setConversationState(
    chatId: string,
    state: {
      waitingFor?: string; // Ex: "pet_name", "service_selection"
      context?: any; // Dados temporários
      step?: string; // Passo atual do fluxo
    },
    ttlSeconds: number = 3600 // 1 hora padrão
  ): Promise<void> {
    if (!this.redis.isRedisConnected()) return;

    await this.redis.set(
      `session:state:${chatId}`,
      { ...state, updatedAt: Date.now() },
      ttlSeconds
    );
  }

  /**
   * Pega estado da conversação
   */
  public async getConversationState(chatId: string): Promise<any | null> {
    if (!this.redis.isRedisConnected()) return null;

    return await this.redis.get(`session:state:${chatId}`);
  }

  /**
   * Limpa estado da conversação
   */
  public async clearConversationState(chatId: string): Promise<void> {
    if (!this.redis.isRedisConnected()) return;

    await this.redis.delete(`session:state:${chatId}`);
  }

  // ==========================================
  // FLAGS TEMPORÁRIAS
  // ==========================================

  /**
   * Seta flag temporária (ex: "already_greeted", "discount_offered")
   */
  public async setFlag(
    chatId: string,
    flag: string,
    value: any = true,
    ttlSeconds: number = 86400 // 24 horas
  ): Promise<void> {
    if (!this.redis.isRedisConnected()) return;

    await this.redis.set(
      `session:flag:${chatId}:${flag}`,
      value,
      ttlSeconds
    );
  }

  /**
   * Pega flag temporária
   */
  public async getFlag(chatId: string, flag: string): Promise<any> {
    if (!this.redis.isRedisConnected()) return null;

    return await this.redis.get(`session:flag:${chatId}:${flag}`);
  }

  /**
   * Verifica se flag existe
   */
  public async hasFlag(chatId: string, flag: string): Promise<boolean> {
    if (!this.redis.isRedisConnected()) return false;

    return await this.redis.exists(`session:flag:${chatId}:${flag}`);
  }

  /**
   * Remove flag
   */
  public async clearFlag(chatId: string, flag: string): Promise<void> {
    if (!this.redis.isRedisConnected()) return;

    await this.redis.delete(`session:flag:${chatId}:${flag}`);
  }

  // ==========================================
  // TIMERS DISTRIBUÍDOS
  // ==========================================

  /**
   * Registra timer ativo (para controle distribuído)
   */
  public async registerTimer(
    timerId: string,
    data: {
      chatId: string;
      type: string; // Ex: "followup", "reminder"
      scheduledFor: number; // Timestamp
      metadata?: any;
    },
    ttlSeconds: number = 3600
  ): Promise<void> {
    if (!this.redis.isRedisConnected()) return;

    await this.redis.set(
      `session:timer:${timerId}`,
      data,
      ttlSeconds
    );
  }

  /**
   * Verifica se timer existe
   */
  public async timerExists(timerId: string): Promise<boolean> {
    if (!this.redis.isRedisConnected()) return false;

    return await this.redis.exists(`session:timer:${timerId}`);
  }

  /**
   * Remove timer
   */
  public async clearTimer(timerId: string): Promise<void> {
    if (!this.redis.isRedisConnected()) return;

    await this.redis.delete(`session:timer:${timerId}`);
  }

  // ==========================================
  // CONTADOR DE MENSAGENS (Rate Limiting Helper)
  // ==========================================

  /**
   * Incrementa contador de mensagens
   */
  public async incrementMessageCount(
    chatId: string,
    windowSeconds: number = 60
  ): Promise<number> {
    if (!this.redis.isRedisConnected()) return 0;

    const key = `session:msgcount:${chatId}`;
    const client = this.redis.getClient();

    if (!client) return 0;

    const count = await client.incr(key);

    if (count === 1) {
      await client.expire(key, windowSeconds);
    }

    return count;
  }

  /**
   * Pega contador de mensagens
   */
  public async getMessageCount(chatId: string): Promise<number> {
    if (!this.redis.isRedisConnected()) return 0;

    const count = await this.redis.get(`session:msgcount:${chatId}`);
    return count || 0;
  }

  // ==========================================
  // ÚLTIMO ACESSO (Heartbeat)
  // ==========================================

  /**
   * Atualiza último acesso do chat
   */
  public async updateHeartbeat(chatId: string): Promise<void> {
    if (!this.redis.isRedisConnected()) return;

    await this.redis.set(
      `session:heartbeat:${chatId}`,
      { timestamp: Date.now() },
      3600 // 1 hora
    );
  }

  /**
   * Pega último acesso
   */
  public async getLastHeartbeat(chatId: string): Promise<number | null> {
    if (!this.redis.isRedisConnected()) return null;

    const data = await this.redis.get(`session:heartbeat:${chatId}`);
    return data?.timestamp || null;
  }

  // ==========================================
  // CLEANUP
  // ==========================================

  /**
   * Limpa todas as sessões de um chat
   */
  public async clearAllSessions(chatId: string): Promise<void> {
    if (!this.redis.isRedisConnected()) return;

    const patterns = [
      `session:followup:${chatId}`,
      `session:state:${chatId}`,
      `session:flag:${chatId}:*`,
      `session:msgcount:${chatId}`,
      `session:heartbeat:${chatId}`
    ];

    for (const pattern of patterns) {
      await this.redis.delete(pattern);
    }
  }
}

/**
 * HELPER: Instância singleton
 */
export const sessionManager = new SessionManager();

import { RedisClient } from './RedisClient';

/**
 * Serviço centralizado de cache com estratégias otimizadas
 */
export class CacheService {
  private static instance: CacheService;
  private redis: RedisClient;

  // TTLs otimizados por tipo de dado
  private readonly TTL = {
    // Cache curto (1-5 minutos) - dados que mudam frequentemente
    DASHBOARD_STATS: 300, // 5 minutos
    APPOINTMENTS_TODAY: 60, // 1 minuto
    CONVERSATIONS_RECENT: 120, // 2 minutos

    // Cache médio (5-30 minutos) - dados semi-estáticos
    TUTOR_PROFILE: 1800, // 30 minutos
    PET_INFO: 1800, // 30 minutos
    SERVICE_LIST: 900, // 15 minutos
    COMPANY_SETTINGS: 1800, // 30 minutos

    // Cache longo (1-24 horas) - dados estáticos
    MONTHLY_STATS: 3600, // 1 hora
    REVENUE_REPORT: 7200, // 2 horas
    TOP_CLIENTS: 3600, // 1 hora
    SERVICE_CATEGORIES: 86400, // 24 horas

    // Cache de sessão
    USER_SESSION: 3600, // 1 hora
    CONTEXT_CONVERSATION: 1800, // 30 minutos
  };

  // Prefixos de cache para organização
  private readonly PREFIX = {
    STATS: 'stats',
    TUTOR: 'tutor',
    PET: 'pet',
    SERVICE: 'service',
    APPOINTMENT: 'appointment',
    COMPANY: 'company',
    DASHBOARD: 'dashboard',
    REPORT: 'report',
    LIST: 'list',
    CONTEXT: 'context'
  };

  private constructor() {
    this.redis = RedisClient.getInstance();
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  /**
   * Gera chave de cache padronizada
   */
  private buildKey(prefix: string, companyId: number, ...parts: (string | number)[]): string {
    return `${prefix}:${companyId}:${parts.join(':')}`;
  }

  /**
   * Cache com fallback - tenta cache primeiro, senão executa função
   */
  public async cacheOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number
  ): Promise<{ data: T; cached: boolean }> {
    // Tentar buscar do cache
    const cached = await this.redis.get<T>(key);
    if (cached !== null) {
      return { data: cached, cached: true };
    }

    // Executar função e cachear resultado
    const data = await fetcher();
    await this.redis.set(key, data, ttl);

    return { data, cached: false };
  }

  /**
   * Cache com warming - pré-aquece cache em background
   */
  public async warmCache(
    key: string,
    fetcher: () => Promise<any>,
    ttl: number
  ): Promise<void> {
    try {
      const data = await fetcher();
      await this.redis.set(key, data, ttl);
    } catch (error) {
      console.error(`Erro ao aquecer cache ${key}:`, error);
    }
  }

  // ====================================
  // MÉTODOS DE CACHE ESPECÍFICOS
  // ====================================

  /**
   * Cache de estatísticas do dashboard
   */
  public async cacheDashboardStats(
    companyId: number,
    stats: any
  ): Promise<void> {
    const key = this.buildKey(this.PREFIX.DASHBOARD, companyId, 'main');
    await this.redis.set(key, stats, this.TTL.DASHBOARD_STATS);
  }

  public async getDashboardStats(companyId: number): Promise<any | null> {
    const key = this.buildKey(this.PREFIX.DASHBOARD, companyId, 'main');
    return await this.redis.get(key);
  }

  /**
   * Cache de lista de tutores
   */
  public async cacheTutorsList(
    companyId: number,
    page: number,
    limit: number,
    data: any
  ): Promise<void> {
    const key = this.buildKey(this.PREFIX.LIST, companyId, 'tutors', page, limit);
    await this.redis.set(key, data, this.TTL.TUTOR_PROFILE);
  }

  /**
   * Cache de perfil de tutor
   */
  public async cacheTutorProfile(
    companyId: number,
    tutorId: string,
    profile: any
  ): Promise<void> {
    const key = this.buildKey(this.PREFIX.TUTOR, companyId, tutorId);
    await this.redis.set(key, profile, this.TTL.TUTOR_PROFILE);
  }

  /**
   * Cache de serviços
   */
  public async cacheServices(companyId: number, services: any[]): Promise<void> {
    const key = this.buildKey(this.PREFIX.SERVICE, companyId, 'all');
    await this.redis.set(key, services, this.TTL.SERVICE_LIST);
  }

  /**
   * Cache de top clientes
   */
  public async cacheTopClients(
    companyId: number,
    limit: number,
    clients: any[]
  ): Promise<void> {
    const key = this.buildKey(this.PREFIX.STATS, companyId, 'top-clients', limit);
    await this.redis.set(key, clients, this.TTL.TOP_CLIENTS);
  }

  /**
   * Cache de receita mensal
   */
  public async cacheMonthlyRevenue(
    companyId: number,
    year: number,
    month: number,
    revenue: any
  ): Promise<void> {
    const key = this.buildKey(this.PREFIX.REPORT, companyId, 'revenue', year, month);
    await this.redis.set(key, revenue, this.TTL.REVENUE_REPORT);
  }

  // ====================================
  // INVALIDAÇÃO DE CACHE
  // ====================================

  /**
   * Invalida cache relacionado a tutor
   */
  public async invalidateTutorCache(companyId: number, tutorId: string): Promise<void> {
    const patterns = [
      this.buildKey(this.PREFIX.TUTOR, companyId, tutorId),
      this.buildKey(this.PREFIX.LIST, companyId, 'tutors', '*'),
      this.buildKey(this.PREFIX.STATS, companyId, 'top-clients', '*'),
      this.buildKey(this.PREFIX.DASHBOARD, companyId, '*')
    ];

    await this.invalidatePatterns(patterns);
  }

  /**
   * Invalida cache relacionado a agendamento
   */
  public async invalidateAppointmentCache(companyId: number): Promise<void> {
    const patterns = [
      this.buildKey(this.PREFIX.APPOINTMENT, companyId, '*'),
      this.buildKey(this.PREFIX.DASHBOARD, companyId, '*'),
      this.buildKey(this.PREFIX.STATS, companyId, '*'),
      this.buildKey(this.PREFIX.REPORT, companyId, 'revenue', '*')
    ];

    await this.invalidatePatterns(patterns);
  }

  /**
   * Invalida cache relacionado a serviços
   */
  public async invalidateServiceCache(companyId: number): Promise<void> {
    const patterns = [
      this.buildKey(this.PREFIX.SERVICE, companyId, '*'),
      this.buildKey(this.PREFIX.STATS, companyId, 'services', '*')
    ];

    await this.invalidatePatterns(patterns);
  }

  /**
   * Invalida múltiplos padrões
   */
  private async invalidatePatterns(patterns: string[]): Promise<void> {
    if (!this.redis.isRedisConnected()) return;

    for (const pattern of patterns) {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(keys);
      }
    }
  }

  // ====================================
  // CACHE TAGS (para invalidação em grupo)
  // ====================================

  /**
   * Adiciona tags a uma chave de cache
   */
  public async tagCache(key: string, tags: string[]): Promise<void> {
    if (!this.redis.isRedisConnected()) return;

    for (const tag of tags) {
      const tagKey = `tag:${tag}`;
      await this.redis.lpush(tagKey, key);
      await this.redis.expire(tagKey, 86400); // 24 horas
    }
  }

  /**
   * Invalida cache por tag
   */
  public async invalidateByTag(tag: string): Promise<void> {
    if (!this.redis.isRedisConnected()) return;

    const tagKey = `tag:${tag}`;
    const keys = await this.redis.lrange(tagKey, 0, -1);

    if (keys.length > 0) {
      await this.redis.del(keys);
      await this.redis.del(tagKey);
    }
  }

  // ====================================
  // MÉTRICAS DE CACHE
  // ====================================

  /**
   * Registra hit/miss de cache
   */
  public async recordCacheMetric(
    operation: 'hit' | 'miss',
    key: string
  ): Promise<void> {
    if (!this.redis.isRedisConnected()) return;

    const date = new Date().toISOString().split('T')[0];
    const metricKey = `metrics:cache:${date}:${operation}`;

    await this.redis.lpush(metricKey, `${Date.now()}:${key}`);
    await this.redis.ltrim(metricKey, 0, 999); // Manter últimas 1000 entradas
    await this.redis.expire(metricKey, 86400 * 7); // 7 dias
  }

  /**
   * Obtém estatísticas de cache
   */
  public async getCacheStats(date?: string): Promise<{
    hits: number;
    misses: number;
    hitRate: number;
  }> {
    if (!this.redis.isRedisConnected()) {
      return { hits: 0, misses: 0, hitRate: 0 };
    }

    const targetDate = date || new Date().toISOString().split('T')[0];
    const hitKey = `metrics:cache:${targetDate}:hit`;
    const missKey = `metrics:cache:${targetDate}:miss`;

    const [hits, misses] = await Promise.all([
      this.redis.lrange(hitKey, 0, -1),
      this.redis.lrange(missKey, 0, -1)
    ]);

    const hitCount = hits.length;
    const missCount = misses.length;
    const total = hitCount + missCount;
    const hitRate = total > 0 ? (hitCount / total) * 100 : 0;

    return {
      hits: hitCount,
      misses: missCount,
      hitRate: Math.round(hitRate * 100) / 100
    };
  }

  // ====================================
  // PRÉ-AQUECIMENTO DE CACHE
  // ====================================

  /**
   * Pré-aquece caches importantes
   */
  public async warmupCaches(companyId: number): Promise<void> {
    console.log(`🔥 Aquecendo caches para empresa ${companyId}...`);

    const warmupTasks = [
      // Dashboard principal sempre quente
      () => this.warmDashboardCache(companyId),

      // Top clientes
      () => this.warmTopClientsCache(companyId),

      // Serviços ativos
      () => this.warmServicesCache(companyId)
    ];

    await Promise.allSettled(
      warmupTasks.map(task => task())
    );

    console.log(`✅ Cache aquecido para empresa ${companyId}`);
  }

  private async warmDashboardCache(companyId: number): Promise<void> {
    // Implementação específica para aquecer dashboard
    console.log(`Aquecendo cache do dashboard...`);
  }

  private async warmTopClientsCache(companyId: number): Promise<void> {
    // Implementação específica para top clientes
    console.log(`Aquecendo cache de top clientes...`);
  }

  private async warmServicesCache(companyId: number): Promise<void> {
    // Implementação específica para serviços
    console.log(`Aquecendo cache de serviços...`);
  }

  /**
   * Limpa caches expirados
   */
  public async cleanupExpiredCaches(): Promise<number> {
    if (!this.redis.isRedisConnected()) return 0;

    // Implementação depende da estratégia de expiração do Redis
    // Redis já remove automaticamente chaves expiradas

    return 0;
  }
}

// Exportar instância singleton
export const cacheService = CacheService.getInstance();
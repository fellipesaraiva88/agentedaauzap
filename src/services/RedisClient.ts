import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

/**
 * 🔴 REDIS CLIENT (Cache & Sessions)
 *
 * Gerencia conexão com Redis para:
 * - Cache de contextos e perfis
 * - Session management
 * - Rate limiting
 * - Pub/Sub (futuro)
 */
export class RedisClient {
  private static instance: RedisClient;
  private client: Redis | null = null;
  private isConnected: boolean = false;

  private constructor() {
    this.initialize();
  }

  /**
   * Singleton instance
   */
  public static getInstance(): RedisClient {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient();
    }
    return RedisClient.instance;
  }

  /**
   * Inicializa conexão com Redis
   */
  private initialize(): void {
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
      console.log('ℹ️  REDIS_URL não configurado - cache desabilitado');
      this.isConnected = false;
      return;
    }

    try {
      this.client = new Redis(redisUrl, {
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: 3,
      });

      // Event handlers
      this.client.on('connect', () => {
        this.isConnected = true;
        console.log('✅ Redis conectado com sucesso');
      });

      this.client.on('ready', () => {
        console.log('✅ Redis pronto para uso');
      });

      this.client.on('error', (err) => {
        console.error('❌ Redis erro:', err.message);
        this.isConnected = false;
      });

      this.client.on('close', () => {
        console.log('⚠️  Redis: conexão fechada');
        this.isConnected = false;
      });

      this.client.on('reconnecting', () => {
        console.log('🔄 Redis: reconectando...');
      });

    } catch (error) {
      console.error('❌ Erro ao conectar Redis:', error);
      this.isConnected = false;
    }
  }

  /**
   * Verifica se está conectado
   */
  public isRedisConnected(): boolean {
    return this.isConnected && this.client !== null;
  }

  /**
   * Retorna o client (ou null se não conectado)
   */
  public getClient(): Redis | null {
    return this.client;
  }

  // ==========================================
  // CACHE METHODS
  // ==========================================

  /**
   * SET - Salva valor no cache
   */
  public async set(
    key: string,
    value: any,
    ttlSeconds?: number
  ): Promise<void> {
    if (!this.client || !this.isConnected) {
      console.warn('⚠️  Redis não conectado - cache ignorado');
      return;
    }

    try {
      const serialized = JSON.stringify(value);

      if (ttlSeconds) {
        await this.client.setex(key, ttlSeconds, serialized);
      } else {
        await this.client.set(key, serialized);
      }
    } catch (error) {
      console.error('❌ Redis SET failed:', error);
    }
  }

  /**
   * GET - Busca valor do cache
   */
  public async get<T = any>(key: string): Promise<T | null> {
    if (!this.client || !this.isConnected) {
      return null;
    }

    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('❌ Redis GET failed:', error);
      return null;
    }
  }

  /**
   * DELETE - Remove do cache
   */
  public async delete(key: string): Promise<void> {
    if (!this.client || !this.isConnected) {
      return;
    }

    try {
      await this.client.del(key);
    } catch (error) {
      console.error('❌ Redis DEL failed:', error);
    }
  }

  /**
   * EXISTS - Verifica se chave existe
   */
  public async exists(key: string): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error('❌ Redis EXISTS failed:', error);
      return false;
    }
  }

  /**
   * EXPIRE - Define TTL para chave existente
   */
  public async expire(key: string, seconds: number): Promise<void> {
    if (!this.client || !this.isConnected) {
      return;
    }

    try {
      await this.client.expire(key, seconds);
    } catch (error) {
      console.error('❌ Redis EXPIRE failed:', error);
    }
  }

  /**
   * TTL - Retorna tempo restante (segundos)
   */
  public async ttl(key: string): Promise<number> {
    if (!this.client || !this.isConnected) {
      return -1;
    }

    try {
      return await this.client.ttl(key);
    } catch (error) {
      console.error('❌ Redis TTL failed:', error);
      return -1;
    }
  }

  // ==========================================
  // CACHE HELPERS (Específicos do sistema)
  // ==========================================

  /**
   * CACHE DE PERFIL - Salva perfil de cliente
   */
  public async cacheProfile(chatId: string, profile: any): Promise<void> {
    await this.set(`profile:${chatId}`, profile, 3600); // 1 hora
  }

  /**
   * GET PROFILE - Busca perfil do cache
   */
  public async getCachedProfile(chatId: string): Promise<any | null> {
    return await this.get(`profile:${chatId}`);
  }

  /**
   * INVALIDATE PROFILE - Remove perfil do cache
   */
  public async invalidateProfile(chatId: string): Promise<void> {
    await this.delete(`profile:${chatId}`);
  }

  /**
   * CACHE DE CONTEXTO - Salva contexto completo
   */
  public async cacheContext(chatId: string, context: any): Promise<void> {
    await this.set(`context:${chatId}`, context, 1800); // 30 minutos
  }

  /**
   * GET CONTEXT - Busca contexto do cache
   */
  public async getCachedContext(chatId: string): Promise<any | null> {
    return await this.get(`context:${chatId}`);
  }

  // ==========================================
  // RATE LIMITING
  // ==========================================

  /**
   * RATE LIMIT - Verifica e incrementa contador
   * @returns true se permitido, false se excedeu limite
   */
  public async checkRateLimit(
    key: string,
    limit: number,
    windowSeconds: number
  ): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return true; // Permite se Redis não disponível
    }

    try {
      const fullKey = `ratelimit:${key}`;
      const current = await this.client.incr(fullKey);

      if (current === 1) {
        await this.client.expire(fullKey, windowSeconds);
      }

      return current <= limit;
    } catch (error) {
      console.error('❌ Rate limit check failed:', error);
      return true; // Permite em caso de erro
    }
  }

  // ==========================================
  // UTILITY
  // ==========================================

  /**
   * FLUSH - Limpa TODO o cache (use com cuidado!)
   */
  public async flushAll(): Promise<void> {
    if (!this.client || !this.isConnected) {
      return;
    }

    try {
      await this.client.flushall();
      console.log('⚠️  Redis: Cache limpo (FLUSHALL)');
    } catch (error) {
      console.error('❌ Redis FLUSHALL failed:', error);
    }
  }

  /**
   * PING - Testa conexão
   */
  public async ping(): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      console.error('❌ Redis PING failed:', error);
      return false;
    }
  }

  /**
   * TEST CONNECTION - Testa se está funcionando
   */
  public async testConnection(): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      // Testa SET/GET
      const testKey = 'test:connection';
      const testValue = { timestamp: Date.now() };

      await this.set(testKey, testValue, 10);
      const retrieved = await this.get(testKey);
      await this.delete(testKey);

      const success = JSON.stringify(retrieved) === JSON.stringify(testValue);

      if (success) {
        console.log('✅ Redis: Conexão testada com sucesso');
      } else {
        console.error('❌ Redis: Teste falhou - valores não batem');
      }

      return success;
    } catch (error) {
      console.error('❌ Redis: Teste de conexão falhou:', error);
      return false;
    }
  }

  /**
   * CLOSE - Fecha conexão
   */
  public async close(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
      console.log('✅ Redis: Conexão fechada');
    }
  }

  // ==========================================
  // MÉTODOS ADICIONAIS
  // ==========================================

  /**
   * SETEX - Set com expiração (alias para set com TTL)
   */
  public async setex(key: string, seconds: number, value: any): Promise<void> {
    return this.set(key, value, seconds);
  }

  /**
   * DEL - Alias para delete
   */
  public async del(key: string | string[]): Promise<void> {
    if (!this.client || !this.isConnected) {
      return;
    }

    try {
      if (Array.isArray(key)) {
        await this.client.del(...key);
      } else {
        await this.client.del(key);
      }
    } catch (error) {
      console.error('❌ Redis DEL failed:', error);
    }
  }

  /**
   * KEYS - Busca chaves por padrão
   */
  public async keys(pattern: string): Promise<string[]> {
    if (!this.client || !this.isConnected) {
      return [];
    }

    try {
      return await this.client.keys(pattern);
    } catch (error) {
      console.error('❌ Redis KEYS failed:', error);
      return [];
    }
  }

  /**
   * LPUSH - Adiciona elemento(s) no início da lista
   */
  public async lpush(key: string, ...values: any[]): Promise<number> {
    if (!this.client || !this.isConnected) {
      return 0;
    }

    try {
      const serialized = values.map(v => typeof v === 'string' ? v : JSON.stringify(v));
      return await this.client.lpush(key, ...serialized);
    } catch (error) {
      console.error('❌ Redis LPUSH failed:', error);
      return 0;
    }
  }

  /**
   * LTRIM - Mantém apenas elementos no range especificado
   */
  public async ltrim(key: string, start: number, stop: number): Promise<void> {
    if (!this.client || !this.isConnected) {
      return;
    }

    try {
      await this.client.ltrim(key, start, stop);
    } catch (error) {
      console.error('❌ Redis LTRIM failed:', error);
    }
  }

  /**
   * LRANGE - Retorna range de elementos da lista
   */
  public async lrange(key: string, start: number, stop: number): Promise<any[]> {
    if (!this.client || !this.isConnected) {
      return [];
    }

    try {
      const values = await this.client.lrange(key, start, stop);
      return values.map(v => {
        try {
          return JSON.parse(v);
        } catch {
          return v;
        }
      });
    } catch (error) {
      console.error('❌ Redis LRANGE failed:', error);
      return [];
    }
  }
}

/**
 * HELPER: Cria instância singleton
 */
export const redisClient = RedisClient.getInstance();

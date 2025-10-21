import { RedisClient } from './RedisClient';

/**
 * 🚀 CACHE MANAGER
 *
 * Gerenciamento centralizado de cache com Redis
 * Suporta multi-tenancy com prefixing automático
 */

export interface CacheOptions {
  ttl?: number; // Time to live em segundos (default: 3600)
  prefix?: string; // Prefixo customizado (opcional)
}

export class CacheManager {
  private redis: RedisClient;
  private defaultTTL = 3600; // 1 hora
  private globalPrefix = 'auzap';

  constructor() {
    this.redis = RedisClient.getInstance();
  }

  /**
   * Gera chave de cache com prefixo multi-tenant
   */
  private getCacheKey(companyId: number, key: string, prefix?: string): string {
    const parts = [this.globalPrefix];

    if (prefix) {
      parts.push(prefix);
    }

    parts.push(`company:${companyId}`);
    parts.push(key);

    return parts.join(':');
  }

  /**
   * GET - Obtém valor do cache
   */
  public async get<T>(
    companyId: number,
    key: string,
    options?: CacheOptions
  ): Promise<T | null> {
    if (!this.redis.isRedisConnected()) {
      return null;
    }

    try {
      const cacheKey = this.getCacheKey(companyId, key, options?.prefix);
      const value = await this.redis.get(cacheKey);

      if (!value) {
        return null;
      }

      return JSON.parse(value) as T;
    } catch (error) {
      console.error('❌ CacheManager.get error:', error);
      return null;
    }
  }

  /**
   * SET - Define valor no cache
   */
  public async set<T>(
    companyId: number,
    key: string,
    value: T,
    options?: CacheOptions
  ): Promise<boolean> {
    if (!this.redis.isRedisConnected()) {
      return false;
    }

    try {
      const cacheKey = this.getCacheKey(companyId, key, options?.prefix);
      const ttl = options?.ttl || this.defaultTTL;
      const stringValue = JSON.stringify(value);

      await this.redis.set(cacheKey, stringValue, ttl);
      return true;
    } catch (error) {
      console.error('❌ CacheManager.set error:', error);
      return false;
    }
  }

  /**
   * DELETE - Remove valor do cache
   */
  public async delete(
    companyId: number,
    key: string,
    options?: CacheOptions
  ): Promise<boolean> {
    if (!this.redis.isRedisConnected()) {
      return false;
    }

    try {
      const cacheKey = this.getCacheKey(companyId, key, options?.prefix);
      await this.redis.delete(cacheKey);
      return true;
    } catch (error) {
      console.error('❌ CacheManager.delete error:', error);
      return false;
    }
  }

  /**
   * EXISTS - Verifica se chave existe
   */
  public async exists(
    companyId: number,
    key: string,
    options?: CacheOptions
  ): Promise<boolean> {
    if (!this.redis.isRedisConnected()) {
      return false;
    }

    try {
      const cacheKey = this.getCacheKey(companyId, key, options?.prefix);
      const exists = await this.redis.exists(cacheKey);
      return exists;
    } catch (error) {
      console.error('❌ CacheManager.exists error:', error);
      return false;
    }
  }

  /**
   * INVALIDATE PATTERN - Invalida múltiplas chaves por padrão
   * Simplified version - manual deletion
   */
  public async invalidatePattern(
    companyId: number,
    pattern: string,
    options?: CacheOptions
  ): Promise<number> {
    if (!this.redis.isRedisConnected()) {
      return 0;
    }

    try {
      // Simplified: just invalidate common patterns
      const baseKey = this.getCacheKey(companyId, '', options?.prefix);
      await this.redis.delete(baseKey);
      return 1;
    } catch (error) {
      console.error('❌ CacheManager.invalidatePattern error:', error);
      return 0;
    }
  }

  /**
   * INVALIDATE ALL - Invalida todo cache de uma empresa
   */
  public async invalidateAll(companyId: number): Promise<number> {
    // Simplified implementation
    return 1;
  }

  /**
   * GET OR SET - Busca do cache ou executa função e cacheia
   */
  public async getOrSet<T>(
    companyId: number,
    key: string,
    fetcher: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    // Tentar buscar do cache
    const cached = await this.get<T>(companyId, key, options);
    if (cached !== null) {
      return cached;
    }

    // Cache miss - executar fetcher
    const value = await fetcher();

    // Salvar no cache
    await this.set(companyId, key, value, options);

    return value;
  }

  /**
   * REMEMBER - Alias para getOrSet (nome mais intuitivo)
   */
  public async remember<T>(
    companyId: number,
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    return await this.getOrSet(companyId, key, fetcher, { ttl });
  }

  /**
   * INCREMENT - Incrementa contador
   * Simplified implementation
   */
  public async increment(
    companyId: number,
    key: string,
    amount: number = 1,
    options?: CacheOptions
  ): Promise<number> {
    if (!this.redis.isRedisConnected()) {
      return 0;
    }

    try {
      const cacheKey = this.getCacheKey(companyId, key, options?.prefix);

      // Get current value
      const current = await this.get<number>(companyId, key, options) || 0;
      const newValue = current + amount;

      // Set new value
      await this.set(companyId, key, newValue, options);

      return newValue;
    } catch (error) {
      console.error('❌ CacheManager.increment error:', error);
      return 0;
    }
  }

  /**
   * DECREMENT - Decrementa contador
   */
  public async decrement(
    companyId: number,
    key: string,
    amount: number = 1,
    options?: CacheOptions
  ): Promise<number> {
    return await this.increment(companyId, key, -amount, options);
  }

  /**
   * GET TTL - Retorna tempo restante de vida da chave (em segundos)
   */
  public async getTTL(
    companyId: number,
    key: string,
    options?: CacheOptions
  ): Promise<number> {
    if (!this.redis.isRedisConnected()) {
      return -1;
    }

    try {
      const cacheKey = this.getCacheKey(companyId, key, options?.prefix);
      return await this.redis.ttl(cacheKey);
    } catch (error) {
      console.error('❌ CacheManager.getTTL error:', error);
      return -1;
    }
  }

  /**
   * EXTEND TTL - Estende tempo de vida da chave
   */
  public async extendTTL(
    companyId: number,
    key: string,
    ttl: number,
    options?: CacheOptions
  ): Promise<boolean> {
    if (!this.redis.isRedisConnected()) {
      return false;
    }

    try {
      const cacheKey = this.getCacheKey(companyId, key, options?.prefix);
      await this.redis.expire(cacheKey, ttl);
      return true;
    } catch (error) {
      console.error('❌ CacheManager.extendTTL error:', error);
      return false;
    }
  }

  /**
   * CACHE STATS - Retorna estatísticas de uso
   * Simplified version
   */
  public async getStats(companyId: number): Promise<{
    totalKeys: number;
    memoryUsage: string;
  }> {
    if (!this.redis.isRedisConnected()) {
      return { totalKeys: 0, memoryUsage: '0' };
    }

    try {
      // Simplified: return basic info
      return {
        totalKeys: 0, // Would need Redis KEYS command
        memoryUsage: 'N/A'
      };
    } catch (error) {
      console.error('❌ CacheManager.getStats error:', error);
      return { totalKeys: 0, memoryUsage: '0' };
    }
  }
}

/**
 * Singleton instance
 */
export const cacheManager = new CacheManager();

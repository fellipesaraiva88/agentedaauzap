import { postgresClient } from './PostgreSQLClient';
import axios from 'axios';

const WAHA_URL = process.env.WAHA_URL || 'https://waha.devlike.pro';
const WAHA_API_KEY = process.env.WAHA_API_KEY;

interface PoolStats {
  total: number;
  available: number;
  assigned: number;
}

interface InstanceRecord {
  id: string;
  name: string;
  assigned_to_user_id?: string | null;
}

export class InstancePoolManager {
  /**
   * Garante que existam pelo menos `targetSize` instâncias disponíveis no pool
   */
  static async ensurePoolSize(targetSize: number = 10): Promise<void> {
    console.log(`[InstancePool] Verificando pool... (target: ${targetSize} disponíveis)`);

    const stats = await this.getPoolStats();
    console.log(`[InstancePool] Status atual: ${stats.available} disponíveis, ${stats.assigned} em uso`);

    const needed = targetSize - stats.available;

    if (needed <= 0) {
      console.log(`[InstancePool] ✅ Pool OK (${stats.available} disponíveis)`);
      return;
    }

    console.log(`[InstancePool] 🔄 Criando ${needed} instâncias...`);
    await this.createPoolInstances(needed);

    const newStats = await this.getPoolStats();
    console.log(`[InstancePool] ✅ Pool atualizado: ${newStats.available} disponíveis`);
  }

  /**
   * Cria N instâncias no pool
   */
  private static async createPoolInstances(count: number): Promise<void> {
    const promises = Array.from({ length: count }, (_, i) =>
      this.createSinglePoolInstance(i + 1)
    );

    const results = await Promise.allSettled(promises);

    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`[InstancePool] Criadas: ${succeeded}/${count} (${failed} falhas)`);
  }

  /**
   * Cria uma única instância no pool
   */
  private static async createSinglePoolInstance(index: number): Promise<string> {
    const instanceName = `pool-${Date.now()}-${index}`;

    try {
      // 1. Criar instância na WAHA
      const response = await axios.post(
        `${WAHA_URL}/api/sessions/start`,
        { name: instanceName },
        {
          headers: {
            'X-Api-Key': WAHA_API_KEY,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status !== 201) {
        throw new Error(`WAHA retornou status ${response.status}`);
      }

      // 2. Registrar no PostgreSQL
      const result = await postgresClient.insert<InstanceRecord>('instances', {
        name: instanceName,
        status: 'disconnected',
        is_pooled: true,
        assigned_to_user_id: null,
      });

      console.log(`[InstancePool] ✅ ${instanceName} criada (${result.id})`);
      return result.id;

    } catch (error: any) {
      console.error(`[InstancePool] ❌ Falha ao criar ${instanceName}:`, error.message);
      throw error;
    }
  }

  /**
   * Obtém uma instância disponível do pool
   */
  static async getAvailableInstance(): Promise<string | null> {
    const result = await postgresClient.getOne<InstanceRecord>(
      `SELECT id, name
       FROM instances
       WHERE is_pooled = true
         AND assigned_to_user_id IS NULL
       LIMIT 1`
    );

    if (!result) {
      console.warn('[InstancePool] ⚠️  Nenhuma instância disponível no pool');
      return null;
    }

    return result.id;
  }

  /**
   * Atribui uma instância a um usuário
   */
  static async assignToUser(instanceId: string, userId: string): Promise<boolean> {
    try {
      // Atualizar apenas se ainda não estiver atribuída (evita race condition)
      const result = await postgresClient.query(
        `UPDATE instances
         SET assigned_to_user_id = $1
         WHERE id = $2
           AND assigned_to_user_id IS NULL
         RETURNING id`,
        [userId, instanceId]
      );

      if (result.rowCount === 0) {
        console.error('[InstancePool] Instância já atribuída ou não encontrada');
        return false;
      }

      console.log(`[InstancePool] 🔗 Instância ${instanceId} → usuário ${userId}`);

      // Verificar se pool está ficando baixo
      const stats = await this.getPoolStats();
      if (stats.available < 5) {
        console.log('[InstancePool] 🚨 Pool baixo, criando mais 10 instâncias...');
        this.ensurePoolSize(10).catch(err =>
          console.error('[InstancePool] Erro ao expandir pool:', err)
        );
      }

      return true;
    } catch (error) {
      console.error('[InstancePool] Erro ao atribuir instância:', error);
      return false;
    }
  }

  /**
   * Libera uma instância de volta para o pool
   */
  static async releaseInstance(userId: string): Promise<void> {
    try {
      const result = await postgresClient.query(
        `UPDATE instances
         SET assigned_to_user_id = NULL,
             status = 'disconnected'
         WHERE assigned_to_user_id = $1
           AND is_pooled = true
         RETURNING id`,
        [userId]
      );

      if (result.rowCount && result.rowCount > 0) {
        console.log(`[InstancePool] ♻️  Instância ${result.rows[0].id} devolvida ao pool (usuário ${userId})`);
      }
    } catch (error) {
      console.error('[InstancePool] Erro ao liberar instância:', error);
    }
  }

  /**
   * Obtém estatísticas do pool
   */
  static async getPoolStats(): Promise<PoolStats> {
    try {
      const rows = await postgresClient.getMany<{ assigned_to_user_id: string | null }>(
        `SELECT assigned_to_user_id
         FROM instances
         WHERE is_pooled = true`
      );

      const total = rows.length;
      const assigned = rows.filter(row => row.assigned_to_user_id !== null).length;
      const available = total - assigned;

      return { total, available, assigned };
    } catch (error) {
      console.error('[InstancePool] Erro ao obter stats:', error);
      return { total: 0, available: 0, assigned: 0 };
    }
  }

  /**
   * Obtém a instância atribuída a um usuário
   */
  static async getUserInstance(userId: string): Promise<string | null> {
    const result = await postgresClient.getOne<InstanceRecord>(
      `SELECT id, name
       FROM instances
       WHERE assigned_to_user_id = $1
         AND is_pooled = true`,
      [userId]
    );

    return result?.name || null;
  }
}

import { Pool, PoolClient, QueryResult } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

/**
 * 🐘 POSTGRESQL CLIENT (Direct Connection)
 *
 * Gerencia conexão direta com PostgreSQL usando DATABASE_URL
 * DATABASE_URL é OBRIGATÓRIO
 */
export class PostgreSQLClient {
  private static instance: PostgreSQLClient;
  private pool: Pool | null = null;
  private isConnected: boolean = false;

  private constructor() {
    this.initialize();
  }

  /**
   * Singleton instance
   */
  public static getInstance(): PostgreSQLClient {
    if (!PostgreSQLClient.instance) {
      PostgreSQLClient.instance = new PostgreSQLClient();
    }
    return PostgreSQLClient.instance;
  }

  /**
   * Inicializa conexão com PostgreSQL
   */
  private initialize(): void {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error('❌ DATABASE_URL é OBRIGATÓRIO! Configure a variável de ambiente.');
    }

    try {
      // Detectar se SSL está desabilitado na connection string
      const sslDisabled = databaseUrl.includes('sslmode=disable');

      this.pool = new Pool({
        connectionString: databaseUrl,
        max: 5, // Reduzido de 10 para 5 para evitar sobrecarga
        min: 1, // Manter sempre 1 conexão ativa
        idleTimeoutMillis: 30000, // 30s - reduzido para liberar conexões idle mais rápido
        connectionTimeoutMillis: 10000, // 10s - timeout de conexão mais curto
        allowExitOnIdle: false, // Não permitir que o pool termine quando idle
        // SSL: desabilitar se sslmode=disable, caso contrário usar com rejectUnauthorized: false
        ssl: sslDisabled ? false : {
          rejectUnauthorized: false
        },
        // Keep-alive para manter conexões ativas
        keepAlive: true,
        keepAliveInitialDelayMillis: 10000
      });

      // Event handlers
      this.pool.on('connect', (client) => {
        console.log('✅ PostgreSQL: Nova conexão estabelecida');

        // Configurar session timeout no cliente
        client.query('SET statement_timeout = 60000').catch(err => {
          console.warn('⚠️  Não foi possível configurar statement_timeout:', err.message);
        });
      });

      this.pool.on('error', (err, client) => {
        console.error('❌ PostgreSQL: Erro inesperado no pool:', err);
        console.error('   Detalhes:', {
          message: err.message,
          code: (err as any).code,
          errno: (err as any).errno
        });

        // Se for erro de conexão, tentar reconectar
        if ((err as any).code === 'ECONNRESET' || (err as any).code === 'ETIMEDOUT') {
          console.log('🔄 Tentando reconectar ao PostgreSQL...');
          this.isConnected = false;
          // O pool vai criar novas conexões automaticamente quando necessário
        }
      });

      this.pool.on('remove', () => {
        console.log('ℹ️  PostgreSQL: Conexão removida do pool');
      });

      this.isConnected = true;
      console.log('✅ PostgreSQL conectado com sucesso (DATABASE_URL)');
      console.log(`   Host: ${this.extractHostFromUrl(databaseUrl)}`);
    } catch (error) {
      console.error('❌ Erro ao conectar PostgreSQL:', error);
      this.isConnected = false;
    }
  }

  /**
   * Extrai host da URL para log (sem senha)
   */
  private extractHostFromUrl(url: string): string {
    try {
      const match = url.match(/@([^:\/]+)/);
      return match ? match[1] : 'unknown';
    } catch {
      return 'unknown';
    }
  }

  /**
   * Verifica se está conectado
   */
  public isPostgresConnected(): boolean {
    return this.isConnected && this.pool !== null;
  }

  /**
   * Retorna o pool (ou null se não conectado)
   */
  public getPool(): Pool | null {
    return this.pool;
  }

  /**
   * QUERY - Executa query SQL com retry automático
   */
  public async query<T extends Record<string, any> = any>(
    sql: string,
    params?: any[],
    retries: number = 2
  ): Promise<QueryResult<T>> {
    if (!this.pool || !this.isConnected) {
      throw new Error('PostgreSQL não está conectado');
    }

    let lastError: any;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const result = await this.pool.query<T>(sql, params);
        return result;
      } catch (error: any) {
        lastError = error;

        // Se for erro de conexão e ainda temos retries, tentar novamente
        const isConnectionError =
          error.message?.includes('Connection terminated') ||
          error.message?.includes('ECONNRESET') ||
          error.message?.includes('ETIMEDOUT') ||
          error.code === 'ECONNRESET' ||
          error.code === 'ETIMEDOUT';

        if (isConnectionError && attempt < retries) {
          console.warn(`⚠️  PostgreSQL query falhou (tentativa ${attempt + 1}/${retries + 1}), tentando novamente...`);
          // Aguardar um pouco antes de tentar novamente
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
          continue;
        }

        // Se não for erro de conexão ou acabaram os retries, logar e lançar erro
        console.error('❌ PostgreSQL query failed:', error);
        console.error('   SQL:', sql.substring(0, 200));
        console.error('   Params:', params);
        throw error;
      }
    }

    throw lastError;
  }

  /**
   * GET ONE - Busca um único registro
   */
  public async getOne<T extends Record<string, any> = any>(
    sql: string,
    params?: any[]
  ): Promise<T | null> {
    const result = await this.query<T>(sql, params);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * GET MANY - Busca múltiplos registros
   */
  public async getMany<T extends Record<string, any> = any>(
    sql: string,
    params?: any[]
  ): Promise<T[]> {
    const result = await this.query<T>(sql, params);
    return result.rows;
  }

  /**
   * INSERT - Insere registro e retorna
   */
  public async insert<T extends Record<string, any> = any>(
    table: string,
    data: Record<string, any>
  ): Promise<T> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');

    const sql = `
      INSERT INTO ${table} (${keys.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;

    const result = await this.query<T>(sql, values);
    return result.rows[0];
  }

  /**
   * UPDATE - Atualiza registro(s)
   */
  public async update<T extends Record<string, any> = any>(
    table: string,
    data: Record<string, any>,
    where: Record<string, any>
  ): Promise<T[]> {
    const dataKeys = Object.keys(data);
    const dataValues = Object.values(data);
    const whereKeys = Object.keys(where);
    const whereValues = Object.values(where);

    const setClause = dataKeys
      .map((key, i) => `${key} = $${i + 1}`)
      .join(', ');

    const whereClause = whereKeys
      .map((key, i) => `${key} = $${dataKeys.length + i + 1}`)
      .join(' AND ');

    const sql = `
      UPDATE ${table}
      SET ${setClause}
      WHERE ${whereClause}
      RETURNING *
    `;

    const result = await this.query<T>(sql, [...dataValues, ...whereValues]);
    return result.rows;
  }

  /**
   * DELETE - Remove registro(s)
   */
  public async delete(
    table: string,
    where: Record<string, any>
  ): Promise<number> {
    const keys = Object.keys(where);
    const values = Object.values(where);

    const whereClause = keys
      .map((key, i) => `${key} = $${i + 1}`)
      .join(' AND ');

    const sql = `DELETE FROM ${table} WHERE ${whereClause}`;

    const result = await this.query(sql, values);
    return result.rowCount || 0;
  }

  /**
   * TRANSACTION - Executa múltiplas queries em transação
   */
  public async transaction<T>(
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    if (!this.pool || !this.isConnected) {
      throw new Error('PostgreSQL não está conectado');
    }

    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Transaction rollback:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * TEST CONNECTION - Testa se a conexão está funcionando
   */
  public async testConnection(): Promise<boolean> {
    if (!this.pool || !this.isConnected) {
      return false;
    }

    try {
      const result = await this.query('SELECT NOW() as now');
      console.log('✅ PostgreSQL: Conexão testada com sucesso');
      console.log(`   Server time: ${result.rows[0].now}`);
      return true;
    } catch (error) {
      console.error('❌ PostgreSQL: Teste de conexão falhou:', error);
      return false;
    }
  }

  /**
   * CLOSE - Fecha todas as conexões
   */
  public async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.isConnected = false;
      console.log('✅ PostgreSQL: Conexões fechadas');
    }
  }

  /**
   * SET TENANT CONTEXT - Define o tenant (company_id) atual para Row Level Security
   */
  public async setTenantContext(companyId: number): Promise<void> {
    if (!this.pool || !this.isConnected) {
      throw new Error('PostgreSQL não está conectado');
    }

    try {
      await this.pool.query('SELECT set_current_company($1)', [companyId]);
    } catch (error) {
      console.error('❌ PostgreSQL: Erro ao setar tenant context:', error);
      throw error;
    }
  }

  /**
   * EXECUTE WITH TENANT - Executa uma função com tenant context garantido
   * Útil para garantir isolamento de dados em operações complexas
   */
  public async executeWithTenant<T>(
    companyId: number,
    callback: () => Promise<T>
  ): Promise<T> {
    if (!this.pool || !this.isConnected) {
      throw new Error('PostgreSQL não está conectado');
    }

    try {
      // Setar contexto do tenant
      await this.setTenantContext(companyId);

      // Executar callback
      return await callback();
    } catch (error) {
      console.error('❌ PostgreSQL: Erro ao executar com tenant context:', error);
      throw error;
    }
  }

  /**
   * TRANSACTION WITH TENANT - Executa transação com tenant context garantido
   * Garante que todas as operações na transação usem o mesmo tenant
   */
  public async transactionWithTenant<T>(
    companyId: number,
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    if (!this.pool || !this.isConnected) {
      throw new Error('PostgreSQL não está conectado');
    }

    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Setar contexto do tenant na transação
      await client.query('SELECT set_current_company($1)', [companyId]);

      // Executar callback
      const result = await callback(client);

      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ PostgreSQL: Transaction with tenant rollback:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * GET TENANT CONTEXT - Retorna o tenant atual configurado na sessão
   */
  public async getTenantContext(): Promise<number | null> {
    if (!this.pool || !this.isConnected) {
      return null;
    }

    try {
      const result = await this.pool.query('SELECT get_current_company() as company_id');
      return result.rows[0]?.company_id || null;
    } catch (error) {
      console.error('❌ PostgreSQL: Erro ao obter tenant context:', error);
      return null;
    }
  }
}

/**
 * HELPER: Cria instância singleton
 */
export const postgresClient = PostgreSQLClient.getInstance();

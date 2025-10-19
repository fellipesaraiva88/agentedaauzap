import { Pool, PoolClient, QueryResult } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

/**
 * 🐘 POSTGRESQL CLIENT (Direct Connection)
 *
 * Gerencia conexão direta com PostgreSQL usando DATABASE_URL
 * Prioridade: DATABASE_URL > Supabase > SQLite
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
      console.log('ℹ️  DATABASE_URL não configurado - usando Supabase/SQLite');
      this.isConnected = false;
      return;
    }

    try {
      this.pool = new Pool({
        connectionString: databaseUrl,
        max: 20, // máximo de conexões no pool
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });

      // Event handlers
      this.pool.on('connect', () => {
        console.log('✅ PostgreSQL: Nova conexão estabelecida');
      });

      this.pool.on('error', (err) => {
        console.error('❌ PostgreSQL: Erro inesperado:', err);
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
   * QUERY - Executa query SQL
   */
  public async query<T = any>(
    sql: string,
    params?: any[]
  ): Promise<QueryResult<T>> {
    if (!this.pool || !this.isConnected) {
      throw new Error('PostgreSQL não está conectado');
    }

    try {
      const result = await this.pool.query<T>(sql, params);
      return result;
    } catch (error) {
      console.error('❌ PostgreSQL query failed:', error);
      console.error('   SQL:', sql);
      console.error('   Params:', params);
      throw error;
    }
  }

  /**
   * GET ONE - Busca um único registro
   */
  public async getOne<T = any>(
    sql: string,
    params?: any[]
  ): Promise<T | null> {
    const result = await this.query<T>(sql, params);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * GET MANY - Busca múltiplos registros
   */
  public async getMany<T = any>(
    sql: string,
    params?: any[]
  ): Promise<T[]> {
    const result = await this.query<T>(sql, params);
    return result.rows;
  }

  /**
   * INSERT - Insere registro e retorna
   */
  public async insert<T = any>(
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
  public async update<T = any>(
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
}

/**
 * HELPER: Cria instância singleton
 */
export const postgresClient = PostgreSQLClient.getInstance();

import { Pool, PoolClient, QueryResultRow } from 'pg';
import { PostgreSQLClient } from '../services/PostgreSQLClient';

/**
 * Interface base para todas as entidades
 */
export interface BaseEntity {
  id?: number | string;
  created_at?: Date;
  updated_at?: Date;
}

/**
 * Interface para filtros de busca
 */
export interface QueryFilter {
  where?: Record<string, any>;
  orderBy?: string;
  limit?: number;
  offset?: number;
  include?: string[];
}

/**
 * Interface para transações
 */
export interface Transaction {
  client: PoolClient;
  commit: () => Promise<void>;
  rollback: () => Promise<void>;
}

/**
 * Classe base para todos os DAOs
 * Fornece operações CRUD genéricas e suporte a multi-tenancy
 */
export abstract class BaseDAO<T extends BaseEntity> {
  protected tableName: string;
  protected postgres: PostgreSQLClient;
  protected companyId?: number;

  constructor(tableName: string) {
    this.tableName = tableName;
    this.postgres = PostgreSQLClient.getInstance();
  }

  /**
   * Define o contexto da empresa (multi-tenancy)
   */
  public setCompanyContext(companyId: number): this {
    this.companyId = companyId;
    return this;
  }

  /**
   * Inicia uma transação
   */
  public async beginTransaction(): Promise<Transaction> {
    const pool = this.postgres.getPool();
    if (!pool) {
      throw new Error('Pool de conexão não disponível');
    }

    const client = await pool.connect();
    await client.query('BEGIN');

    return {
      client,
      commit: async () => {
        await client.query('COMMIT');
        client.release();
      },
      rollback: async () => {
        await client.query('ROLLBACK');
        client.release();
      }
    };
  }

  /**
   * Busca por ID
   */
  public async findById(id: number | string, transaction?: Transaction): Promise<T | null> {
    const query = this.buildSelectQuery({
      where: { id }
    });

    if (transaction) {
      const result = await transaction.client.query<T>(query.sql, query.params);
      return result.rows[0] || null;
    }

    return await this.postgres.getOne<T>(query.sql, query.params);
  }

  /**
   * Busca todos os registros com filtros
   */
  public async findAll(filter?: QueryFilter, transaction?: Transaction): Promise<T[]> {
    const query = this.buildSelectQuery(filter);

    if (transaction) {
      const result = await transaction.client.query<T>(query.sql, query.params);
      return result.rows;
    }

    return await this.postgres.getMany<T>(query.sql, query.params);
  }

  /**
   * Busca um único registro
   */
  public async findOne(filter: QueryFilter, transaction?: Transaction): Promise<T | null> {
    const query = this.buildSelectQuery({ ...filter, limit: 1 });

    if (transaction) {
      const result = await transaction.client.query<T>(query.sql, query.params);
      return result.rows[0] || null;
    }

    return await this.postgres.getOne<T>(query.sql, query.params);
  }

  /**
   * Conta registros
   */
  public async count(filter?: QueryFilter, transaction?: Transaction): Promise<number> {
    const whereClause = this.buildWhereClause(filter?.where);
    const sql = `SELECT COUNT(*) as count FROM ${this.tableName} ${whereClause.sql}`;

    if (transaction) {
      const result = await transaction.client.query<{ count: string }>(sql, whereClause.params);
      return parseInt(result.rows[0]?.count || '0', 10);
    }

    const result = await this.postgres.getOne<{ count: string }>(sql, whereClause.params);
    return parseInt(result?.count || '0', 10);
  }

  /**
   * Cria um novo registro
   */
  public async create(data: Partial<T>, transaction?: Transaction): Promise<T> {
    // Adiciona company_id se estiver no contexto
    if (this.companyId && !('company_id' in data)) {
      data = { ...data, company_id: this.companyId } as any;
    }

    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');

    const sql = `
      INSERT INTO ${this.tableName} (${keys.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;

    if (transaction) {
      const result = await transaction.client.query<T>(sql, values);
      return result.rows[0];
    }

    return await this.postgres.insert<T>(this.tableName, data);
  }

  /**
   * Cria múltiplos registros
   */
  public async createMany(items: Partial<T>[], transaction?: Transaction): Promise<T[]> {
    const results: T[] = [];

    for (const item of items) {
      const result = await this.create(item, transaction);
      results.push(result);
    }

    return results;
  }

  /**
   * Atualiza um registro
   */
  public async update(id: number | string, data: Partial<T>, transaction?: Transaction): Promise<T | null> {
    // Remove campos que não devem ser atualizados
    delete data.id;
    delete data.created_at;

    // Adiciona updated_at
    data.updated_at = new Date() as any;

    const keys = Object.keys(data);
    if (keys.length === 0) {
      return this.findById(id, transaction);
    }

    const values = Object.values(data);
    const setClause = keys.map((key, i) => `${key} = $${i + 2}`).join(', ');

    let sql = `
      UPDATE ${this.tableName}
      SET ${setClause}
      WHERE id = $1
    `;

    // Adiciona filtro de company_id se estiver no contexto
    if (this.companyId) {
      sql += ` AND company_id = $${keys.length + 2}`;
      values.push(this.companyId);
    }

    sql += ' RETURNING *';

    const params = [id, ...values];

    if (transaction) {
      const result = await transaction.client.query<T>(sql, params);
      return result.rows[0] || null;
    }

    return await this.postgres.getOne<T>(sql, params);
  }

  /**
   * Atualiza múltiplos registros
   */
  public async updateMany(filter: QueryFilter, data: Partial<T>, transaction?: Transaction): Promise<number> {
    // Remove campos que não devem ser atualizados
    delete data.id;
    delete data.created_at;

    // Adiciona updated_at
    data.updated_at = new Date() as any;

    const keys = Object.keys(data);
    if (keys.length === 0) {
      return 0;
    }

    const values = Object.values(data);
    const whereClause = this.buildWhereClause(filter.where);
    const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');

    let sql = `
      UPDATE ${this.tableName}
      SET ${setClause}
      ${whereClause.sql}
    `;

    const params = [...values, ...whereClause.params];

    const result = transaction
      ? await transaction.client.query(sql, params)
      : await this.postgres.query(sql, params);

    return result.rowCount || 0;
  }

  /**
   * Deleta um registro
   */
  public async delete(id: number | string, transaction?: Transaction): Promise<boolean> {
    let sql = `DELETE FROM ${this.tableName} WHERE id = $1`;
    const params: any[] = [id];

    // Adiciona filtro de company_id se estiver no contexto
    if (this.companyId) {
      sql += ` AND company_id = $2`;
      params.push(this.companyId);
    }

    const result = transaction
      ? await transaction.client.query(sql, params)
      : await this.postgres.query(sql, params);

    return (result.rowCount || 0) > 0;
  }

  /**
   * Deleta múltiplos registros
   */
  public async deleteMany(filter: QueryFilter, transaction?: Transaction): Promise<number> {
    const whereClause = this.buildWhereClause(filter.where);
    const sql = `DELETE FROM ${this.tableName} ${whereClause.sql}`;

    const result = transaction
      ? await transaction.client.query(sql, whereClause.params)
      : await this.postgres.query(sql, whereClause.params);

    return result.rowCount || 0;
  }

  /**
   * Executa uma query SQL customizada
   */
  public async executeRaw<R extends Record<string, any> = any>(sql: string, params?: any[], transaction?: Transaction): Promise<R[]> {
    if (transaction) {
      const result = await transaction.client.query(sql, params);
      return result.rows as R[];
    }

    return await this.postgres.getMany(sql, params) as R[];
  }

  /**
   * Verifica se um registro existe
   */
  public async exists(filter: QueryFilter, transaction?: Transaction): Promise<boolean> {
    const count = await this.count(filter, transaction);
    return count > 0;
  }

  /**
   * Constrói a query SELECT
   */
  protected buildSelectQuery(filter?: QueryFilter): { sql: string; params: any[] } {
    const whereClause = this.buildWhereClause(filter?.where);

    let sql = `SELECT * FROM ${this.tableName} ${whereClause.sql}`;

    // ORDER BY
    if (filter?.orderBy) {
      sql += ` ORDER BY ${filter.orderBy}`;
    }

    // LIMIT
    if (filter?.limit) {
      sql += ` LIMIT ${filter.limit}`;
    }

    // OFFSET
    if (filter?.offset) {
      sql += ` OFFSET ${filter.offset}`;
    }

    return {
      sql,
      params: whereClause.params
    };
  }

  /**
   * Constrói a cláusula WHERE
   */
  protected buildWhereClause(where?: Record<string, any>): { sql: string; params: any[] } {
    if (!where && !this.companyId) {
      return { sql: '', params: [] };
    }

    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    // Adiciona company_id se estiver no contexto
    if (this.companyId) {
      conditions.push(`company_id = $${paramIndex}`);
      params.push(this.companyId);
      paramIndex++;
    }

    // Adiciona condições do filtro
    if (where) {
      for (const [key, value] of Object.entries(where)) {
        if (value === null) {
          conditions.push(`${key} IS NULL`);
        } else if (value === undefined) {
          continue;
        } else if (Array.isArray(value)) {
          // IN clause
          const placeholders = value.map((_, i) => `$${paramIndex + i}`).join(', ');
          conditions.push(`${key} IN (${placeholders})`);
          params.push(...value);
          paramIndex += value.length;
        } else if (typeof value === 'object' && value !== null) {
          // Operadores especiais: { $gt: 10, $lt: 20, etc }
          for (const [op, val] of Object.entries(value)) {
            switch (op) {
              case '$gt':
                conditions.push(`${key} > $${paramIndex}`);
                params.push(val);
                paramIndex++;
                break;
              case '$gte':
                conditions.push(`${key} >= $${paramIndex}`);
                params.push(val);
                paramIndex++;
                break;
              case '$lt':
                conditions.push(`${key} < $${paramIndex}`);
                params.push(val);
                paramIndex++;
                break;
              case '$lte':
                conditions.push(`${key} <= $${paramIndex}`);
                params.push(val);
                paramIndex++;
                break;
              case '$ne':
                conditions.push(`${key} != $${paramIndex}`);
                params.push(val);
                paramIndex++;
                break;
              case '$like':
                conditions.push(`${key} LIKE $${paramIndex}`);
                params.push(val);
                paramIndex++;
                break;
              case '$ilike':
                conditions.push(`${key} ILIKE $${paramIndex}`);
                params.push(val);
                paramIndex++;
                break;
            }
          }
        } else {
          conditions.push(`${key} = $${paramIndex}`);
          params.push(value);
          paramIndex++;
        }
      }
    }

    const sql = conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : '';

    return { sql, params };
  }

  /**
   * Valida dados antes de operações
   */
  protected validate(data: Partial<T>): void {
    // Implementar validações específicas nas subclasses
  }

  /**
   * Hook executado antes de criar
   */
  protected async beforeCreate(data: Partial<T>): Promise<Partial<T>> {
    return data;
  }

  /**
   * Hook executado depois de criar
   */
  protected async afterCreate(entity: T): Promise<void> {
    // Implementar nas subclasses se necessário
  }

  /**
   * Hook executado antes de atualizar
   */
  protected async beforeUpdate(id: number | string, data: Partial<T>): Promise<Partial<T>> {
    return data;
  }

  /**
   * Hook executado depois de atualizar
   */
  protected async afterUpdate(entity: T): Promise<void> {
    // Implementar nas subclasses se necessário
  }

  /**
   * Hook executado antes de deletar
   */
  protected async beforeDelete(id: number | string): Promise<void> {
    // Implementar nas subclasses se necessário
  }

  /**
   * Hook executado depois de deletar
   */
  protected async afterDelete(id: number | string): Promise<void> {
    // Implementar nas subclasses se necessário
  }
}
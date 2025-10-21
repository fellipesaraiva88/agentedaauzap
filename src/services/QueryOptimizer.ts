import { PostgreSQLClient } from './PostgreSQLClient';

interface QueryBatch {
  queries: Array<{
    sql: string;
    params: any[];
    resolver: (result: any) => void;
    rejecter: (error: any) => void;
  }>;
  timeout: NodeJS.Timeout;
}

/**
 * Serviço de otimização de queries com batching e cache de preparação
 */
export class QueryOptimizer {
  private static instance: QueryOptimizer;
  private postgres: PostgreSQLClient;
  private queryBatches: Map<string, QueryBatch> = new Map();
  private preparedStatements: Map<string, boolean> = new Map();

  // Configurações de otimização
  private readonly CONFIG = {
    BATCH_SIZE: 100, // Máximo de queries por batch
    BATCH_TIMEOUT: 10, // ms para aguardar mais queries
    PREPARED_STATEMENT_CACHE_SIZE: 100,
    CONNECTION_POOL_SIZE: 20
  };

  // Queries preparadas comuns
  private readonly PREPARED_QUERIES = {
    GET_TUTOR_BY_ID: {
      name: 'get_tutor_by_id',
      sql: 'SELECT * FROM tutors WHERE id = $1 AND company_id = $2'
    },
    GET_APPOINTMENTS_BY_DATE: {
      name: 'get_appointments_by_date',
      sql: `SELECT * FROM appointments
            WHERE company_id = $1
            AND data_agendamento = $2
            ORDER BY hora_agendamento`
    },
    GET_SERVICE_BY_ID: {
      name: 'get_service_by_id',
      sql: 'SELECT * FROM services WHERE id = $1 AND company_id = $2'
    },
    COUNT_APPOINTMENTS: {
      name: 'count_appointments',
      sql: `SELECT COUNT(*) as total
            FROM appointments
            WHERE company_id = $1
            AND status = $2
            AND data_agendamento >= $3`
    },
    GET_TOP_CLIENTS: {
      name: 'get_top_clients',
      sql: `SELECT t.*,
            COUNT(a.id) as total_appointments,
            COALESCE(SUM(a.preco), 0) as total_spent
            FROM tutors t
            LEFT JOIN appointments a ON t.id::TEXT = a.tutor_id
            WHERE t.company_id = $1
            AND t.is_inativo = FALSE
            GROUP BY t.id
            ORDER BY total_spent DESC
            LIMIT $2`
    }
  };

  private constructor() {
    this.postgres = PostgreSQLClient.getInstance();
    this.setupPreparedStatements();
  }

  public static getInstance(): QueryOptimizer {
    if (!QueryOptimizer.instance) {
      QueryOptimizer.instance = new QueryOptimizer();
    }
    return QueryOptimizer.instance;
  }

  /**
   * Prepara statements mais utilizados
   */
  private async setupPreparedStatements(): Promise<void> {
    for (const [key, query] of Object.entries(this.PREPARED_QUERIES)) {
      try {
        await this.prepareSafely(query.name, query.sql);
      } catch (error) {
        console.error(`Erro ao preparar query ${key}:`, error);
      }
    }
  }

  /**
   * Prepara statement com segurança
   */
  private async prepareSafely(name: string, sql: string): Promise<void> {
    if (this.preparedStatements.has(name)) {
      return;
    }

    try {
      // Verificar se já existe
      await this.postgres.query(
        `DEALLOCATE ${name}`,
        []
      ).catch(() => {}); // Ignorar erro se não existir

      // Preparar novo
      await this.postgres.query(
        `PREPARE ${name} AS ${sql}`,
        []
      );

      this.preparedStatements.set(name, true);
    } catch (error) {
      console.error(`Erro ao preparar statement ${name}:`, error);
    }
  }

  /**
   * Executa query preparada
   */
  public async executePrepared(
    queryName: string,
    params: any[]
  ): Promise<any> {
    const query = Object.values(this.PREPARED_QUERIES).find(
      q => q.name === queryName
    );

    if (!query) {
      throw new Error(`Query preparada não encontrada: ${queryName}`);
    }

    // Garantir que está preparada
    await this.prepareSafely(query.name, query.sql);

    // Executar
    return await this.postgres.query(
      `EXECUTE ${query.name}(${params.map((_, i) => `$${i + 1}`).join(',')})`,
      params
    );
  }

  /**
   * Batch de queries para execução otimizada
   */
  public async batchQuery<T>(
    batchKey: string,
    sql: string,
    params: any[]
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      // Adicionar à batch
      if (!this.queryBatches.has(batchKey)) {
        this.queryBatches.set(batchKey, {
          queries: [],
          timeout: setTimeout(() => {
            this.executeBatch(batchKey);
          }, this.CONFIG.BATCH_TIMEOUT)
        });
      }

      const batch = this.queryBatches.get(batchKey)!;
      batch.queries.push({
        sql,
        params,
        resolver: resolve,
        rejecter: reject
      });

      // Executar se atingiu tamanho máximo
      if (batch.queries.length >= this.CONFIG.BATCH_SIZE) {
        clearTimeout(batch.timeout);
        this.executeBatch(batchKey);
      }
    });
  }

  /**
   * Executa batch de queries
   */
  private async executeBatch(batchKey: string): Promise<void> {
    const batch = this.queryBatches.get(batchKey);
    if (!batch || batch.queries.length === 0) return;

    this.queryBatches.delete(batchKey);
    clearTimeout(batch.timeout);

    try {
      // Executar em transação para melhor performance
      await this.postgres.beginTransaction();

      const results = await Promise.all(
        batch.queries.map(q =>
          this.postgres.query(q.sql, q.params)
        )
      );

      await this.postgres.commitTransaction();

      // Resolver promises
      batch.queries.forEach((q, i) => {
        q.resolver(results[i]);
      });
    } catch (error) {
      await this.postgres.rollbackTransaction();

      // Rejeitar todas as promises
      batch.queries.forEach(q => {
        q.rejecter(error);
      });
    }
  }

  /**
   * Otimiza query de agregação usando CTEs
   */
  public buildAggregateQuery(
    companyId: number,
    options: {
      includeTutors?: boolean;
      includeAppointments?: boolean;
      includeRevenue?: boolean;
      dateRange?: { start: Date; end: Date };
    }
  ): string {
    const ctes: string[] = [];

    if (options.includeTutors) {
      ctes.push(`
        tutors_summary AS (
          SELECT
            COUNT(*) as total_tutors,
            COUNT(*) FILTER (WHERE is_vip) as vip_tutors,
            COUNT(*) FILTER (WHERE is_inativo) as inactive_tutors
          FROM tutors
          WHERE company_id = ${companyId}
        )
      `);
    }

    if (options.includeAppointments && options.dateRange) {
      ctes.push(`
        appointments_summary AS (
          SELECT
            COUNT(*) as total_appointments,
            COUNT(*) FILTER (WHERE status = 'concluido') as completed,
            COUNT(*) FILTER (WHERE status = 'cancelado') as cancelled,
            COUNT(DISTINCT tutor_id) as unique_clients
          FROM appointments
          WHERE company_id = ${companyId}
          AND data_agendamento >= '${options.dateRange.start.toISOString()}'
          AND data_agendamento <= '${options.dateRange.end.toISOString()}'
        )
      `);
    }

    if (options.includeRevenue && options.dateRange) {
      ctes.push(`
        revenue_summary AS (
          SELECT
            COALESCE(SUM(preco), 0) as total_revenue,
            COALESCE(AVG(preco), 0) as avg_ticket
          FROM appointments
          WHERE company_id = ${companyId}
          AND status = 'concluido'
          AND data_agendamento >= '${options.dateRange.start.toISOString()}'
          AND data_agendamento <= '${options.dateRange.end.toISOString()}'
        )
      `);
    }

    if (ctes.length === 0) {
      return 'SELECT 1';
    }

    const selectColumns = [];
    if (options.includeTutors) selectColumns.push('t.*');
    if (options.includeAppointments) selectColumns.push('a.*');
    if (options.includeRevenue) selectColumns.push('r.*');

    const fromClauses = [];
    if (options.includeTutors) fromClauses.push('tutors_summary t');
    if (options.includeAppointments) fromClauses.push('appointments_summary a');
    if (options.includeRevenue) fromClauses.push('revenue_summary r');

    return `
      WITH ${ctes.join(',\n')}
      SELECT ${selectColumns.join(', ')}
      FROM ${fromClauses.join(', ')}
    `;
  }

  /**
   * Otimiza queries IN com grandes listas
   */
  public optimizeInQuery(
    table: string,
    column: string,
    values: any[],
    additionalWhere?: string
  ): string {
    // Para listas muito grandes, usar VALUES ao invés de IN
    if (values.length > 100) {
      const valuesList = values
        .map((v, i) => `($${i + 1})`)
        .join(',');

      return `
        SELECT t.*
        FROM ${table} t
        JOIN (VALUES ${valuesList}) v(value) ON t.${column} = v.value
        ${additionalWhere || ''}
      `;
    }

    // Para listas pequenas, usar IN normal
    const placeholders = values.map((_, i) => `$${i + 1}`).join(',');
    return `
      SELECT *
      FROM ${table}
      WHERE ${column} IN (${placeholders})
      ${additionalWhere || ''}
    `;
  }

  /**
   * Otimiza paginação com cursor
   */
  public buildCursorPagination(
    table: string,
    orderBy: string,
    cursor?: string,
    limit: number = 20,
    where?: string
  ): { sql: string; params: any[] } {
    let sql = `SELECT * FROM ${table}`;
    const params: any[] = [];

    if (where || cursor) {
      sql += ' WHERE ';
      const conditions = [];

      if (where) {
        conditions.push(where);
      }

      if (cursor) {
        conditions.push(`${orderBy} > $${params.length + 1}`);
        params.push(cursor);
      }

      sql += conditions.join(' AND ');
    }

    sql += ` ORDER BY ${orderBy} LIMIT $${params.length + 1}`;
    params.push(limit);

    return { sql, params };
  }

  /**
   * Detecta e alerta sobre N+1 queries
   */
  public detectN1Queries(
    queries: Array<{ sql: string; timestamp: number }>
  ): boolean {
    const pattern = /SELECT .* FROM (\w+) WHERE .* = \$/;
    const tableQueries: Map<string, number> = new Map();

    for (const query of queries) {
      const match = query.sql.match(pattern);
      if (match) {
        const table = match[1];
        tableQueries.set(table, (tableQueries.get(table) || 0) + 1);
      }
    }

    // Alerta se mesma tabela foi consultada muitas vezes
    for (const [table, count] of tableQueries) {
      if (count > 10) {
        console.warn(
          `⚠️ Possível N+1 detectado: ${count} queries na tabela ${table}`
        );
        return true;
      }
    }

    return false;
  }

  /**
   * Análise de plano de execução
   */
  public async explainQuery(
    sql: string,
    params: any[]
  ): Promise<{
    plan: any;
    warnings: string[];
  }> {
    const result = await this.postgres.query(
      `EXPLAIN (FORMAT JSON, ANALYZE, BUFFERS) ${sql}`,
      params
    );

    const plan = result.rows[0]['QUERY PLAN'][0];
    const warnings: string[] = [];

    // Analisar plano para problemas
    this.analyzePlan(plan, warnings);

    return { plan, warnings };
  }

  /**
   * Analisa plano de execução para problemas
   */
  private analyzePlan(plan: any, warnings: string[]): void {
    // Verificar Seq Scans em tabelas grandes
    if (plan['Node Type'] === 'Seq Scan') {
      const rows = plan['Plan Rows'] || 0;
      if (rows > 1000) {
        warnings.push(
          `Seq Scan em tabela com ${rows} linhas - considere adicionar índice`
        );
      }
    }

    // Verificar Nested Loops com muitas iterações
    if (plan['Node Type'] === 'Nested Loop') {
      const loops = plan['Actual Loops'] || 0;
      if (loops > 100) {
        warnings.push(
          `Nested Loop com ${loops} iterações - considere otimizar JOIN`
        );
      }
    }

    // Recursivamente analisar planos filhos
    if (plan.Plans) {
      for (const childPlan of plan.Plans) {
        this.analyzePlan(childPlan, warnings);
      }
    }
  }

  /**
   * Limpa recursos
   */
  public async cleanup(): Promise<void> {
    // Limpar batches pendentes
    for (const [key, batch] of this.queryBatches) {
      clearTimeout(batch.timeout);
      batch.queries.forEach(q => {
        q.rejecter(new Error('Query optimizer cleanup'));
      });
    }
    this.queryBatches.clear();

    // Deallocar prepared statements
    for (const name of this.preparedStatements.keys()) {
      try {
        await this.postgres.query(`DEALLOCATE ${name}`, []);
      } catch (error) {
        // Ignorar erros na limpeza
      }
    }
    this.preparedStatements.clear();
  }
}

export const queryOptimizer = QueryOptimizer.getInstance();
import { BaseDAO } from './BaseDAO';

/**
 * Interface para Notificação
 */
export interface Notification {
  id?: number;
  company_id: number;
  user_id?: number;
  tipo: string;
  titulo: string;
  mensagem: string;
  nivel: 'info' | 'warning' | 'error' | 'success' | 'low' | 'medium' | 'high' | 'critical';
  dados?: Record<string, any>;
  link_acao?: string;
  acao_url?: string;
  acao_label?: string;
  lida: boolean;
  lida_em?: Date;
  arquivada: boolean;
  created_at?: Date;
  updated_at?: Date;
}

/**
 * DAO para notificações
 */
export class NotificationDAO extends BaseDAO<Notification> {
  constructor() {
    super('notifications');
  }

  /**
   * Busca notificações não lidas de uma empresa
   */
  public async findUnread(companyId: number, userId?: number): Promise<Notification[]> {
    let sql = `
      SELECT * FROM ${this.tableName}
      WHERE company_id = $1
        AND lida = FALSE
        AND arquivada = FALSE
    `;

    const params: any[] = [companyId];

    if (userId) {
      sql += ' AND (user_id = $2 OR user_id IS NULL)';
      params.push(userId);
    }

    sql += ' ORDER BY created_at DESC LIMIT 50';

    const result = await this.postgres.query(sql, params);
    return result.rows;
  }

  /**
   * Conta notificações não lidas
   */
  public async countUnread(companyId: number, userId?: number): Promise<number> {
    let sql = `
      SELECT COUNT(*) as count
      FROM ${this.tableName}
      WHERE company_id = $1
        AND lida = FALSE
        AND arquivada = FALSE
    `;

    const params: any[] = [companyId];

    if (userId) {
      sql += ' AND (user_id = $2 OR user_id IS NULL)';
      params.push(userId);
    }

    const result = await this.postgres.query(sql, params);
    return parseInt(result.rows[0]?.count || '0', 10);
  }

  /**
   * Marca notificação como lida
   */
  public async markAsRead(notificationId: number, companyId: number): Promise<void> {
    await this.postgres.query(
      `UPDATE ${this.tableName}
       SET lida = TRUE, lida_em = NOW(), updated_at = NOW()
       WHERE id = $1 AND company_id = $2`,
      [notificationId, companyId]
    );
  }

  /**
   * Marca todas as notificações como lidas
   */
  public async markAllAsRead(companyId: number, userId?: number): Promise<void> {
    let sql = `
      UPDATE ${this.tableName}
      SET lida = TRUE, lida_em = NOW(), updated_at = NOW()
      WHERE company_id = $1 AND lida = FALSE
    `;

    const params: any[] = [companyId];

    if (userId) {
      sql += ' AND (user_id = $2 OR user_id IS NULL)';
      params.push(userId);
    }

    await this.postgres.query(sql, params);
  }

  /**
   * Arquiva notificação
   */
  public async archive(notificationId: number, companyId: number): Promise<void> {
    await this.postgres.query(
      `UPDATE ${this.tableName}
       SET arquivada = TRUE, updated_at = NOW()
       WHERE id = $1 AND company_id = $2`,
      [notificationId, companyId]
    );
  }

  /**
   * Deleta notificações antigas (arquivadas ou lidas)
   */
  public async deleteOld(daysOld: number = 30): Promise<number> {
    const result = await this.postgres.query(
      `DELETE FROM ${this.tableName}
       WHERE created_at < NOW() - INTERVAL '${daysOld} days'
         AND (arquivada = TRUE OR lida = TRUE)
       RETURNING id`
    );

    return result.rowCount || 0;
  }

  /**
   * Busca notificações por tipo
   */
  public async findByType(
    companyId: number,
    tipo: string,
    options?: {
      limit?: number;
      offset?: number;
      includeRead?: boolean;
    }
  ): Promise<Notification[]> {
    const limit = options?.limit || 20;
    const offset = options?.offset || 0;
    const includeRead = options?.includeRead !== false;

    let sql = `
      SELECT * FROM ${this.tableName}
      WHERE company_id = $1
        AND tipo = $2
    `;

    const params: any[] = [companyId, tipo];

    if (!includeRead) {
      sql += ' AND lida = FALSE';
    }

    sql += ` ORDER BY created_at DESC LIMIT $3 OFFSET $4`;
    params.push(limit, offset);

    const result = await this.postgres.query(sql, params);
    return result.rows;
  }

  /**
   * Busca notificações por nível de importância
   */
  public async findByLevel(
    companyId: number,
    nivel: 'low' | 'medium' | 'high' | 'critical',
    options?: {
      limit?: number;
      includeRead?: boolean;
    }
  ): Promise<Notification[]> {
    const limit = options?.limit || 20;
    const includeRead = options?.includeRead !== false;

    let sql = `
      SELECT * FROM ${this.tableName}
      WHERE company_id = $1
        AND nivel = $2
    `;

    const params: any[] = [companyId, nivel];

    if (!includeRead) {
      sql += ' AND lida = FALSE';
    }

    sql += ` ORDER BY created_at DESC LIMIT $3`;
    params.push(limit);

    const result = await this.postgres.query(sql, params);
    return result.rows;
  }

  /**
   * Busca estatísticas de notificações
   */
  public async getStats(companyId: number): Promise<{
    total: number;
    lidas: number;
    naoLidas: number;
    arquivadas: number;
    porTipo: Record<string, number>;
    porNivel: Record<string, number>;
  }> {
    const statsQuery = `
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN lida = TRUE THEN 1 END) as lidas,
        COUNT(CASE WHEN lida = FALSE THEN 1 END) as nao_lidas,
        COUNT(CASE WHEN arquivada = TRUE THEN 1 END) as arquivadas
      FROM ${this.tableName}
      WHERE company_id = $1
    `;

    const tipoQuery = `
      SELECT tipo, COUNT(*) as count
      FROM ${this.tableName}
      WHERE company_id = $1
      GROUP BY tipo
    `;

    const nivelQuery = `
      SELECT nivel, COUNT(*) as count
      FROM ${this.tableName}
      WHERE company_id = $1
      GROUP BY nivel
    `;

    const [statsResult, tipoResult, nivelResult] = await Promise.all([
      this.postgres.query(statsQuery, [companyId]),
      this.postgres.query(tipoQuery, [companyId]),
      this.postgres.query(nivelQuery, [companyId])
    ]);

    const stats = statsResult.rows[0];
    const porTipo: Record<string, number> = {};
    const porNivel: Record<string, number> = {};

    tipoResult.rows.forEach(row => {
      porTipo[row.tipo] = parseInt(row.count, 10);
    });

    nivelResult.rows.forEach(row => {
      porNivel[row.nivel] = parseInt(row.count, 10);
    });

    return {
      total: parseInt(stats.total, 10),
      lidas: parseInt(stats.lidas, 10),
      naoLidas: parseInt(stats.nao_lidas, 10),
      arquivadas: parseInt(stats.arquivadas, 10),
      porTipo,
      porNivel
    };
  }
}

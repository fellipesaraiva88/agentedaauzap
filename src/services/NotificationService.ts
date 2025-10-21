import { PostgreSQLClient } from './PostgreSQLClient';
import { eventEmitter, SystemEvent } from './EventEmitter';
import { RedisClient } from './RedisClient';
import { NotificationDAO, Notification } from '../dao/NotificationDAO';

/**
 * Serviço de notificações
 */
export class NotificationService {
  private static instance: NotificationService;
  private postgres: PostgreSQLClient;
  private redis: RedisClient;
  private notificationDAO: NotificationDAO;

  private constructor() {
    this.postgres = PostgreSQLClient.getInstance();
    this.redis = RedisClient.getInstance();
    this.notificationDAO = new NotificationDAO();

    // Registra listeners de notificações
    this.registerNotificationListeners();
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Registra listeners de notificações para eventos do sistema
   */
  private registerNotificationListeners(): void {
    // Novo agendamento
    eventEmitter.onEvent(SystemEvent.APPOINTMENT_CREATED, async (payload) => {
      if (!payload.companyId) return;

      await this.createNotification({
        company_id: payload.companyId,
        tipo: 'novo_agendamento',
        titulo: 'Novo Agendamento',
        mensagem: `Novo agendamento criado: ${payload.data.service_nome}`,
        nivel: 'info',
        dados: { appointmentId: payload.data.id },
        link_acao: `/appointments/${payload.data.id}`,
        lida: false,
        arquivada: false
      });
    });

    // Agendamento cancelado
    eventEmitter.onEvent(SystemEvent.APPOINTMENT_CANCELLED, async (payload) => {
      if (!payload.companyId) return;

      await this.createNotification({
        company_id: payload.companyId,
        tipo: 'agendamento_cancelado',
        titulo: 'Agendamento Cancelado',
        mensagem: `Agendamento cancelado: ${payload.data.service_nome}`,
        nivel: 'warning',
        dados: { appointmentId: payload.data.id },
        link_acao: `/appointments/${payload.data.id}`,
        lida: false,
        arquivada: false
      });
    });

    // Cliente VIP
    eventEmitter.onEvent(SystemEvent.TUTOR_PROMOTED_VIP, async (payload) => {
      if (!payload.companyId) return;

      await this.createNotification({
        company_id: payload.companyId,
        tipo: 'cliente_vip',
        titulo: 'Novo Cliente VIP',
        mensagem: `${payload.data.nome} foi promovido a VIP`,
        nivel: 'success',
        dados: { tutorId: payload.data.id },
        link_acao: `/tutors/${payload.data.id}`,
        lida: false,
        arquivada: false
      });
    });

    // Conversão detectada
    eventEmitter.onEvent(SystemEvent.CONVERSION_DETECTED, async (payload) => {
      if (!payload.companyId) return;

      await this.createNotification({
        company_id: payload.companyId,
        tipo: 'conversao',
        titulo: 'Nova Conversão',
        mensagem: `Conversão detectada: R$ ${payload.data.valor}`,
        nivel: 'success',
        dados: payload.data,
        lida: false,
        arquivada: false
      });
    });

    // Pet precisa de vacina
    eventEmitter.onEvent(SystemEvent.PET_NEEDS_VACCINATION, async (payload) => {
      if (!payload.companyId) return;

      await this.createNotification({
        company_id: payload.companyId,
        tipo: 'pet_vacina',
        titulo: 'Pet Precisa de Vacinação',
        mensagem: `${payload.data.nome} precisa de vacinação`,
        nivel: 'warning',
        dados: { petId: payload.data.id },
        link_acao: `/pets/${payload.data.id}`,
        lida: false,
        arquivada: false
      });
    });

    // Erro no sistema
    eventEmitter.onEvent(SystemEvent.ERROR_OCCURRED, async (payload) => {
      if (!payload.companyId) return;

      await this.createNotification({
        company_id: payload.companyId,
        tipo: 'erro_sistema',
        titulo: 'Erro no Sistema',
        mensagem: `Erro: ${payload.data.error || 'Erro desconhecido'}`,
        nivel: 'error',
        dados: payload.data,
        lida: false,
        arquivada: false
      });
    });

    console.log('✅ Listeners de notificações registrados');
  }

  /**
   * Cria nova notificação
   */
  public async createNotification(notification: Notification): Promise<Notification> {
    try {
      const sql = `
        INSERT INTO notifications (
          company_id, user_id, tipo, titulo, mensagem,
          nivel, dados, link_acao, lida, arquivada
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;

      const result = await this.postgres.getOne<Notification>(sql, [
        notification.company_id,
        notification.user_id || null,
        notification.tipo,
        notification.titulo,
        notification.mensagem,
        notification.nivel,
        JSON.stringify(notification.dados || {}),
        notification.link_acao || null,
        notification.lida,
        notification.arquivada
      ]);

      if (result) {
        // Invalida cache
        await this.invalidateCache(notification.company_id, notification.user_id);

        // Emite evento de nova notificação (para websockets, etc)
        console.log(`🔔 Nova notificação: ${notification.titulo}`);
      }

      return result!;
    } catch (error) {
      console.error('Erro ao criar notificação:', error);
      throw error;
    }
  }

  /**
   * Busca notificações não lidas
   */
  public async getUnreadNotifications(
    companyId: number,
    userId?: number
  ): Promise<Notification[]> {
    try {
      const cacheKey = `notifications:unread:${companyId}:${userId || 'all'}`;

      // Tenta cache
      if (this.redis.isRedisConnected()) {
        const cached = await this.redis.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      }

      let sql = `
        SELECT * FROM notifications
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

      const notifications = await this.postgres.getMany<Notification>(sql, params);

      // Salva no cache
      if (this.redis.isRedisConnected()) {
        await this.redis.setex(cacheKey, 60, JSON.stringify(notifications)); // 1 min
      }

      return notifications;
    } catch (error) {
      console.error('Erro ao buscar notificações não lidas:', error);
      return [];
    }
  }

  /**
   * Busca todas as notificações
   */
  public async getAllNotifications(
    companyId: number,
    userId?: number,
    options?: {
      limit?: number;
      offset?: number;
      includeArquivadas?: boolean;
    }
  ): Promise<Notification[]> {
    try {
      const limit = options?.limit || 20;
      const offset = options?.offset || 0;

      let sql = `
        SELECT * FROM notifications
        WHERE company_id = $1
      `;

      const params: any[] = [companyId];
      let paramIndex = 2;

      if (userId) {
        sql += ` AND (user_id = $${paramIndex} OR user_id IS NULL)`;
        params.push(userId);
        paramIndex++;
      }

      if (!options?.includeArquivadas) {
        sql += ' AND arquivada = FALSE';
      }

      sql += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      return await this.postgres.getMany<Notification>(sql, params);
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
      return [];
    }
  }

  /**
   * Conta notificações não lidas
   */
  public async countUnread(companyId: number, userId?: number): Promise<number> {
    try {
      let sql = `
        SELECT COUNT(*) as count
        FROM notifications
        WHERE company_id = $1
        AND lida = FALSE
        AND arquivada = FALSE
      `;

      const params: any[] = [companyId];

      if (userId) {
        sql += ' AND (user_id = $2 OR user_id IS NULL)';
        params.push(userId);
      }

      const result = await this.postgres.getOne<{ count: string }>(sql, params);
      return parseInt(result?.count || '0', 10);
    } catch (error) {
      console.error('Erro ao contar notificações não lidas:', error);
      return 0;
    }
  }

  /**
   * Marca notificação como lida
   */
  public async markAsRead(notificationId: number, companyId: number): Promise<void> {
    try {
      await this.notificationDAO.markAsRead(notificationId, companyId);
      await this.invalidateCache(companyId);
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
      throw error;
    }
  }

  /**
   * Marca todas como lidas
   */
  public async markAllAsRead(companyId: number, userId?: number): Promise<void> {
    try {
      await this.notificationDAO.markAllAsRead(companyId, userId);
      await this.invalidateCache(companyId, userId);
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
      throw error;
    }
  }

  /**
   * Arquiva notificação
   */
  public async archiveNotification(notificationId: number, companyId: number): Promise<void> {
    try {
      await this.notificationDAO.archive(notificationId, companyId);
      await this.invalidateCache(companyId);
    } catch (error) {
      console.error('Erro ao arquivar notificação:', error);
      throw error;
    }
  }

  /**
   * Deleta notificação
   */
  public async deleteNotification(notificationId: number, companyId: number): Promise<void> {
    try {
      await this.postgres.query(
        `DELETE FROM notifications
         WHERE id = $1 AND company_id = $2`,
        [notificationId, companyId]
      );

      await this.invalidateCache(companyId);
    } catch (error) {
      console.error('Erro ao deletar notificação:', error);
      throw error;
    }
  }

  /**
   * Limpa notificações antigas
   */
  public async cleanOldNotifications(daysOld: number = 30): Promise<number> {
    try {
      const deletedCount = await this.notificationDAO.deleteOld(daysOld);
      console.log(`🧹 Limpeza: ${deletedCount} notificações antigas removidas`);
      return deletedCount;
    } catch (error) {
      console.error('Erro ao limpar notificações antigas:', error);
      return 0;
    }
  }

  /**
   * Invalida cache de notificações
   */
  private async invalidateCache(companyId: number, userId?: number): Promise<void> {
    if (!this.redis.isRedisConnected()) return;

    const keys = [
      `notifications:unread:${companyId}:all`,
      `notifications:unread:${companyId}:${userId || 'all'}`
    ];

    for (const key of keys) {
      await this.redis.del(key);
    }
  }
}

// Exporta instância singleton
export const notificationService = NotificationService.getInstance();

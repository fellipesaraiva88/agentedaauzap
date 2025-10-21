import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { AuthenticatedRequest } from '../middleware/auth';

/**
 * 💬 CONVERSATIONS ROUTES
 *
 * Rotas para gerenciar conversas e mensagens do WhatsApp:
 * - GET /api/conversations - Listar conversas únicas com último contato
 * - GET /api/conversations/:chatId - Histórico completo de mensagens
 * - GET /api/conversations/:chatId/messages - Mensagens paginadas
 *
 * Todas as rotas são isoladas por tenant (company_id) automaticamente
 */

export function createConversationsRoutes(db: Pool) {
  const router = Router();

  /**
   * GET /api/conversations
   * Lista todas as conversas únicas com informações agregadas
   *
   * Query params:
   * - page: número da página (padrão: 1)
   * - limit: itens por página (padrão: 50, máx: 100)
   * - search: busca por nome do tutor
   * - dateFrom: filtrar mensagens a partir desta data (ISO 8601)
   * - dateTo: filtrar mensagens até esta data (ISO 8601)
   * - status: filtrar por status do último agendamento (pendente, confirmado, etc)
   */
  router.get('/', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const companyId = req.user?.companyId;

      if (!companyId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Company ID not found in token'
        });
      }

      // Parâmetros de paginação
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
      const offset = (page - 1) * limit;

      // Filtros
      const search = req.query.search as string;
      const dateFrom = req.query.dateFrom as string;
      const dateTo = req.query.dateTo as string;
      const status = req.query.status as string;

      // Build dynamic WHERE clauses
      const whereConditions: string[] = ['a.company_id = $1'];
      const queryParams: any[] = [companyId];
      let paramIndex = 2;

      // Filtro de busca por nome
      if (search) {
        whereConditions.push(`LOWER(a.tutor_nome) LIKE LOWER($${paramIndex})`);
        queryParams.push(`%${search}%`);
        paramIndex++;
      }

      // Filtro de data (início)
      if (dateFrom) {
        whereConditions.push(`a.created_at >= $${paramIndex}`);
        queryParams.push(dateFrom);
        paramIndex++;
      }

      // Filtro de data (fim)
      if (dateTo) {
        whereConditions.push(`a.created_at <= $${paramIndex}`);
        queryParams.push(dateTo);
        paramIndex++;
      }

      // Filtro de status do último agendamento
      if (status) {
        whereConditions.push(`a.status = $${paramIndex}`);
        queryParams.push(status);
        paramIndex++;
      }

      const whereClause = whereConditions.join(' AND ');

      // Query principal: buscar conversas únicas com agregações
      const conversationsQuery = `
        WITH latest_appointments AS (
          SELECT DISTINCT ON (chat_id)
            chat_id,
            tutor_nome,
            tutor_telefone,
            created_at as last_interaction,
            status,
            service_nome,
            data_agendamento,
            hora_agendamento,
            id as appointment_id
          FROM appointments
          WHERE ${whereClause}
          ORDER BY chat_id, created_at DESC
        ),
        message_counts AS (
          SELECT
            chat_id,
            COUNT(*) as total_messages
          FROM appointments
          WHERE company_id = $1
          GROUP BY chat_id
        )
        SELECT
          la.chat_id,
          la.tutor_nome,
          la.tutor_telefone,
          la.last_interaction,
          la.status as last_status,
          la.service_nome as last_service,
          la.data_agendamento as last_appointment_date,
          la.hora_agendamento as last_appointment_time,
          la.appointment_id as last_appointment_id,
          COALESCE(mc.total_messages, 0) as total_messages
        FROM latest_appointments la
        LEFT JOIN message_counts mc ON la.chat_id = mc.chat_id
        ORDER BY la.last_interaction DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      queryParams.push(limit, offset);

      // Query de contagem total
      const countQuery = `
        SELECT COUNT(DISTINCT chat_id) as total
        FROM appointments a
        WHERE ${whereClause}
      `;

      // Executar ambas as queries em paralelo
      const [conversationsResult, countResult] = await Promise.all([
        db.query(conversationsQuery, queryParams),
        db.query(countQuery, queryParams.slice(0, -2)) // Remove limit e offset do count
      ]);

      const conversations = conversationsResult.rows;
      const total = parseInt(countResult.rows[0]?.total || '0');
      const totalPages = Math.ceil(total / limit);

      res.json({
        success: true,
        data: conversations,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasMore: page < totalPages
        }
      });

    } catch (error: any) {
      console.error('❌ Error in GET /conversations:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
      });
    }
  });

  /**
   * GET /api/conversations/:chatId
   * Retorna histórico completo de mensagens de uma conversa específica
   *
   * Params:
   * - chatId: ID do chat do WhatsApp (ex: 5511991143605@c.us)
   */
  router.get('/:chatId', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const companyId = req.user?.companyId;
      const chatId = req.params.chatId;

      if (!companyId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Company ID not found in token'
        });
      }

      if (!chatId) {
        return res.status(400).json({
          success: false,
          error: 'Bad request',
          message: 'chatId is required'
        });
      }

      // Buscar todos os agendamentos (mensagens) do chat
      const messagesQuery = `
        SELECT
          id,
          chat_id,
          tutor_nome,
          tutor_telefone,
          pet_nome,
          pet_tipo,
          pet_porte,
          service_id,
          service_nome,
          data_agendamento,
          hora_agendamento,
          duracao_minutos,
          preco,
          status,
          observacoes,
          motivo_cancelamento,
          confirmado_cliente,
          confirmado_empresa,
          created_at,
          updated_at,
          cancelado_at,
          concluido_at
        FROM appointments
        WHERE company_id = $1 AND chat_id = $2
        ORDER BY created_at DESC
      `;

      const result = await db.query(messagesQuery, [companyId, chatId]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'No conversation found for this chat ID'
        });
      }

      // Agregar informações da conversa
      const messages = result.rows;
      const firstMessage = messages[messages.length - 1]; // Mais antiga
      const lastMessage = messages[0]; // Mais recente

      const conversationInfo = {
        chatId: chatId,
        tutorNome: lastMessage.tutor_nome,
        tutorTelefone: lastMessage.tutor_telefone,
        firstInteraction: firstMessage.created_at,
        lastInteraction: lastMessage.created_at,
        totalMessages: messages.length,
        lastStatus: lastMessage.status,
        lastService: lastMessage.service_nome
      };

      res.json({
        success: true,
        data: {
          conversation: conversationInfo,
          messages: messages
        },
        total: messages.length
      });

    } catch (error: any) {
      console.error('❌ Error in GET /conversations/:chatId:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
      });
    }
  });

  /**
   * GET /api/conversations/:chatId/messages
   * Retorna mensagens paginadas de uma conversa específica
   *
   * Params:
   * - chatId: ID do chat do WhatsApp
   *
   * Query params:
   * - page: número da página (padrão: 1)
   * - limit: itens por página (padrão: 20, máx: 100)
   * - orderBy: ordenação - 'asc' ou 'desc' (padrão: 'desc')
   */
  router.get('/:chatId/messages', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const companyId = req.user?.companyId;
      const chatId = req.params.chatId;

      if (!companyId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Company ID not found in token'
        });
      }

      if (!chatId) {
        return res.status(400).json({
          success: false,
          error: 'Bad request',
          message: 'chatId is required'
        });
      }

      // Parâmetros de paginação
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
      const offset = (page - 1) * limit;
      const orderBy = (req.query.orderBy as string)?.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

      // Query de mensagens paginadas
      const messagesQuery = `
        SELECT
          id,
          chat_id,
          tutor_nome,
          tutor_telefone,
          pet_nome,
          pet_tipo,
          pet_porte,
          service_id,
          service_nome,
          data_agendamento,
          hora_agendamento,
          duracao_minutos,
          preco,
          status,
          observacoes,
          motivo_cancelamento,
          confirmado_cliente,
          confirmado_empresa,
          created_at,
          updated_at,
          cancelado_at,
          concluido_at
        FROM appointments
        WHERE company_id = $1 AND chat_id = $2
        ORDER BY created_at ${orderBy}
        LIMIT $3 OFFSET $4
      `;

      // Query de contagem total
      const countQuery = `
        SELECT COUNT(*) as total
        FROM appointments
        WHERE company_id = $1 AND chat_id = $2
      `;

      // Executar ambas as queries em paralelo
      const [messagesResult, countResult] = await Promise.all([
        db.query(messagesQuery, [companyId, chatId, limit, offset]),
        db.query(countQuery, [companyId, chatId])
      ]);

      const messages = messagesResult.rows;
      const total = parseInt(countResult.rows[0]?.total || '0');
      const totalPages = Math.ceil(total / limit);

      if (messages.length === 0 && page === 1) {
        return res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'No messages found for this chat ID'
        });
      }

      res.json({
        success: true,
        data: messages,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasMore: page < totalPages
        }
      });

    } catch (error: any) {
      console.error('❌ Error in GET /conversations/:chatId/messages:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
      });
    }
  });

  /**
   * GET /api/conversations/stats/summary
   * Retorna estatísticas agregadas de todas as conversas
   */
  router.get('/stats/summary', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const companyId = req.user?.companyId;

      if (!companyId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Company ID not found in token'
        });
      }

      // Query de estatísticas agregadas
      const statsQuery = `
        SELECT
          COUNT(DISTINCT chat_id) as total_conversations,
          COUNT(*) as total_messages,
          COUNT(*) FILTER (WHERE status = 'pendente') as pending_appointments,
          COUNT(*) FILTER (WHERE status = 'confirmado') as confirmed_appointments,
          COUNT(*) FILTER (WHERE status = 'concluido') as completed_appointments,
          COUNT(*) FILTER (WHERE status = 'cancelado') as cancelled_appointments,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as messages_last_24h,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as messages_last_7d,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as messages_last_30d,
          ROUND(AVG(preco), 2) as average_price,
          SUM(preco) FILTER (WHERE status = 'concluido') as total_revenue
        FROM appointments
        WHERE company_id = $1
      `;

      const result = await db.query(statsQuery, [companyId]);
      const stats = result.rows[0];

      res.json({
        success: true,
        data: {
          conversations: {
            total: parseInt(stats.total_conversations || '0'),
            totalMessages: parseInt(stats.total_messages || '0')
          },
          appointments: {
            pending: parseInt(stats.pending_appointments || '0'),
            confirmed: parseInt(stats.confirmed_appointments || '0'),
            completed: parseInt(stats.completed_appointments || '0'),
            cancelled: parseInt(stats.cancelled_appointments || '0')
          },
          activity: {
            last24Hours: parseInt(stats.messages_last_24h || '0'),
            last7Days: parseInt(stats.messages_last_7d || '0'),
            last30Days: parseInt(stats.messages_last_30d || '0')
          },
          revenue: {
            averagePrice: parseFloat(stats.average_price || '0'),
            totalRevenue: parseFloat(stats.total_revenue || '0')
          }
        }
      });

    } catch (error: any) {
      console.error('❌ Error in GET /conversations/stats/summary:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
      });
    }
  });

  return router;
}

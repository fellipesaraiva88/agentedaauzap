import express, { Request, Response } from 'express';
import { Pool } from 'pg';

export function createDashboardRoutes(db: Pool) {
  const router = express.Router();

  /**
   * GET /api/dashboard/stats
   * Retorna estatísticas gerais do dashboard
   */
  router.get('/stats', async (req: Request, res: Response) => {
    try {
      const companyId = Number(req.query.companyId) || 1;

      // Conversas de hoje (baseado em agendamentos)
      const conversationsResult = await db.query(
        `SELECT COUNT(DISTINCT chat_id) as count
         FROM appointments
         WHERE company_id = $1
           AND created_at >= CURRENT_DATE`,
        [companyId]
      );

      // Agendamentos ativos (pendentes + confirmados)
      const activeResult = await db.query(
        `SELECT COUNT(*) as count
         FROM appointments
         WHERE company_id = $1
           AND status IN ('pendente', 'confirmado')
           AND data_agendamento >= CURRENT_DATE`,
        [companyId]
      );

      // Mensagens hoje (estimado por agendamentos)
      const messagesResult = await db.query(
        `SELECT COUNT(*) * 3 as count
         FROM appointments
         WHERE company_id = $1
           AND created_at >= CURRENT_DATE`,
        [companyId]
      );

      // Follow-ups pendentes
      // TODO: Implementar quando tabela appointment_reminders_v2 existir
      const followupsResult = { rows: [{ count: 0 }] };

      // Taxa de automação (baseado em agendamentos)
      // TODO: Implementar quando coluna 'source' existir na tabela appointments
      const automationResult = { rows: [{ rate: 85 }] };

      res.json({
        stats: {
          conversationsToday: parseInt(conversationsResult.rows[0]?.count || '0'),
          activeConversations: parseInt(activeResult.rows[0]?.count || '0'),
          messagesToday: parseInt(messagesResult.rows[0]?.count || '0'),
          pendingFollowups: 0, // TODO: Implementar quando tabela existir
          escalatedConversations: 0, // TODO: Implementar
          automationRate: 85, // TODO: Implementar quando coluna 'source' existir
          whatsappStatus: 'connected', // TODO: Conectar com WAHA
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
  });

  /**
   * GET /api/dashboard/impact
   * Retorna métricas de impacto da IA
   */
  router.get('/impact', async (req: Request, res: Response) => {
    try {
      const companyId = Number(req.query.companyId) || 1;

      // Horas trabalhadas pela IA (estimativa: 5 min por agendamento)
      const hoursResult = await db.query(
        `SELECT COUNT(*) * 5.0 / 60 as hours
         FROM appointments
         WHERE company_id = $1
           AND created_at >= CURRENT_DATE - INTERVAL '30 days'`,
        [companyId]
      );

      // Valor econômico (baseado em custo de atendente)
      const hours = parseFloat(hoursResult.rows[0]?.hours || '0');
      const economicValue = hours * 25; // R$ 25/hora

      // Vendas fechadas
      const salesResult = await db.query(
        `SELECT COUNT(*) as count
         FROM appointments
         WHERE company_id = $1
           AND status IN ('confirmado', 'concluido')
           AND created_at >= CURRENT_DATE - INTERVAL '30 days'`,
        [companyId]
      );

      // Dias de trabalho poupados (8h por dia)
      const daysOfWorkSaved = Math.floor(hours / 8);

      res.json({
        impact: {
          hoursWorked: Math.round(hours),
          economicValue: Math.round(economicValue),
          salesClosed: parseInt(salesResult.rows[0]?.count || '0'),
          daysOfWorkSaved,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('Error fetching impact metrics:', error);
      res.status(500).json({ error: 'Failed to fetch impact metrics' });
    }
  });

  /**
   * GET /api/dashboard/overnight
   * Retorna atividade noturna (22h - 8h)
   */
  router.get('/overnight', async (req: Request, res: Response) => {
    try {
      const companyId = Number(req.query.companyId) || 1;

      // Clientes atendidos durante a noite
      const clientsResult = await db.query(
        `SELECT COUNT(DISTINCT chat_id) as count
         FROM appointments
         WHERE company_id = $1
           AND created_at::time >= '22:00:00'
            OR created_at::time <= '08:00:00'
           AND created_at >= CURRENT_DATE - INTERVAL '1 day'`,
        [companyId]
      );

      // Agendamentos confirmados para hoje
      const bookingsResult = await db.query(
        `SELECT COUNT(*) as count
         FROM appointments
         WHERE company_id = $1
           AND status = 'confirmado'
           AND data_agendamento = CURRENT_DATE`,
        [companyId]
      );

      // Valor de vendas
      const salesResult = await db.query(
        `SELECT COALESCE(SUM(preco), 0) as total
         FROM appointments
         WHERE company_id = $1
           AND status IN ('confirmado', 'concluido')
           AND (created_at::time >= '22:00:00' OR created_at::time <= '08:00:00')
           AND created_at >= CURRENT_DATE - INTERVAL '1 day'`,
        [companyId]
      );

      // Follow-ups enviados
      // TODO: Implementar quando tabela appointment_reminders_v2 existir
      const followupsResult = { rows: [{ count: 0 }] };

      res.json({
        overnight: {
          clientsServed: parseInt(clientsResult.rows[0]?.count || '0'),
          bookingsConfirmed: parseInt(bookingsResult.rows[0]?.count || '0'),
          salesValue: parseFloat(salesResult.rows[0]?.total || '0'),
          followupsSent: 0, // TODO: Implementar quando tabela existir
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('Error fetching overnight activity:', error);
      res.status(500).json({ error: 'Failed to fetch overnight activity' });
    }
  });

  /**
   * GET /api/dashboard/actions
   * Retorna feed de ações da IA em tempo real
   */
  router.get('/actions', async (req: Request, res: Response) => {
    try {
      const companyId = Number(req.query.companyId) || 1;
      const limit = Number(req.query.limit) || 20;

      const result = await db.query(
        `SELECT
           id,
           CASE
             WHEN status IN ('confirmado', 'concluido') THEN 'booking'
             WHEN status = 'pendente' THEN 'message'
             ELSE 'client'
           END as type,
           CASE
             WHEN status = 'confirmado' THEN 'Agendamento Confirmado'
             WHEN status = 'concluido' THEN 'Serviço Concluído'
             WHEN status = 'pendente' THEN 'Nova Solicitação'
             ELSE 'Ação Realizada'
           END as title,
           service_nome || ' - ' || pet_nome as subtitle,
           'R$ ' || preco::text as highlight,
           created_at
         FROM appointments
         WHERE company_id = $1
         ORDER BY created_at DESC
         LIMIT $2`,
        [companyId, limit]
      );

      const actions = result.rows.map(row => ({
        id: row.id.toString(),
        type: row.type,
        title: row.title,
        subtitle: row.subtitle,
        highlight: row.highlight,
        created_at: row.created_at,
      }));

      res.json({ actions });
    } catch (error) {
      console.error('Error fetching AI actions:', error);
      res.status(500).json({ error: 'Failed to fetch AI actions' });
    }
  });

  /**
   * GET /api/dashboard/revenue-timeline
   * Retorna timeline de receita ao longo do dia
   */
  router.get('/revenue-timeline', async (req: Request, res: Response) => {
    try {
      const companyId = Number(req.query.companyId) || 1;

      const result = await db.query(
        `SELECT
           TO_CHAR(created_at, 'HH24:00') as time,
           SUM(preco)::float as value
         FROM appointments
         WHERE company_id = $1
           AND created_at >= CURRENT_DATE
           AND status IN ('confirmado', 'concluido')
         GROUP BY TO_CHAR(created_at, 'HH24:00')
         ORDER BY time`,
        [companyId]
      );

      const timeline = result.rows.map(row => ({
        time: row.time,
        value: row.value || 0,
      }));

      res.json({ timeline });
    } catch (error) {
      console.error('Error fetching revenue timeline:', error);
      res.status(500).json({ error: 'Failed to fetch revenue timeline' });
    }
  });

  /**
   * GET /api/dashboard/automation
   * Retorna taxa de automação
   */
  router.get('/automation', async (req: Request, res: Response) => {
    try {
      const companyId = Number(req.query.companyId) || 1;

      const result = await db.query(
        `SELECT COUNT(*) as total
         FROM appointments
         WHERE company_id = $1
           AND created_at >= CURRENT_DATE - INTERVAL '30 days'`,
        [companyId]
      );

      const row = result.rows[0];
      const total = parseInt(row.total || '0');

      // TODO: Implementar quando coluna 'source' existir
      // Assumindo 85% automático por padrão
      const automatedPercent = 85;
      const manualPercent = 15;

      res.json({
        automated: automatedPercent,
        manual: manualPercent,
        total,
      });
    } catch (error) {
      console.error('Error fetching automation data:', error);
      res.status(500).json({ error: 'Failed to fetch automation data' });
    }
  });

  return router;
}

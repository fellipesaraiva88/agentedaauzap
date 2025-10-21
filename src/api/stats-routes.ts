import { Router, Request, Response } from 'express';
import { jwtAuth } from '../middleware/apiAuth';
import { validateRequest } from '../middleware/requestValidator';
import { asyncHandler } from '../middleware/errorHandler';
import { PostgreSQLClient } from '../services/PostgreSQLClient';
import { RedisClient } from '../services/RedisClient';
import { AppointmentDAO } from '../dao/AppointmentDAO';
import { TutorDAO } from '../dao/TutorDAO';
import { ConversationHistoryDAO } from '../dao/ConversationDAO';
import { ValidationError } from '../utils/errors';

const router = Router();
const postgres = PostgreSQLClient.getInstance();
const redis = RedisClient.getInstance();

const appointmentDAO = new AppointmentDAO();
const tutorDAO = new TutorDAO();
const conversationDAO = new ConversationHistoryDAO();

/**
 * @route   GET /api/stats/dashboard
 * @desc    Estatísticas principais do dashboard
 * @access  Private (JWT)
 */
router.get(
  '/dashboard',
  jwtAuth,
  asyncHandler(async (req: any, res: Response) => {
    const companyId = req.companyId;
    const cacheKey = `stats:dashboard:${companyId}`;

    // Tentar buscar do cache (TTL: 5 minutos)
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json({
        success: true,
        data: JSON.parse(cached),
        cached: true
      });
    }

    // Buscar estatísticas
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

    const [
      totalTutors,
      vipTutors,
      totalAppointments,
      pendingAppointments,
      confirmedAppointments,
      completedAppointments,
      monthRevenue,
      lastMonthRevenue,
      recentConversations
    ] = await Promise.all([
      // Total de tutores
      tutorDAO.count({ where: { company_id: companyId, is_inativo: false } }),

      // Tutores VIP
      tutorDAO.count({ where: { company_id: companyId, is_vip: true } }),

      // Total de agendamentos do mês
      appointmentDAO.count({
        where: {
          company_id: companyId,
          data_agendamento: { $gte: startOfMonth }
        }
      }),

      // Agendamentos pendentes
      appointmentDAO.count({
        where: {
          company_id: companyId,
          status: 'pendente',
          data_agendamento: { $gte: today }
        }
      }),

      // Agendamentos confirmados
      appointmentDAO.count({
        where: {
          company_id: companyId,
          status: 'confirmado',
          data_agendamento: { $gte: today }
        }
      }),

      // Agendamentos concluídos este mês
      appointmentDAO.count({
        where: {
          company_id: companyId,
          status: 'concluido',
          data_agendamento: { $gte: startOfMonth }
        }
      }),

      // Receita do mês
      postgres.query(
        `SELECT COALESCE(SUM(preco), 0) as total
         FROM appointments
         WHERE company_id = $1
           AND status = 'concluido'
           AND data_agendamento >= $2`,
        [companyId, startOfMonth]
      ).then(r => parseFloat(r.rows[0]?.total || 0)),

      // Receita do mês passado
      postgres.query(
        `SELECT COALESCE(SUM(preco), 0) as total
         FROM appointments
         WHERE company_id = $1
           AND status = 'concluido'
           AND data_agendamento >= $2
           AND data_agendamento <= $3`,
        [companyId, startOfLastMonth, endOfLastMonth]
      ).then(r => parseFloat(r.rows[0]?.total || 0)),

      // Conversas recentes (últimas 24h)
      conversationDAO.count({
        where: {
          company_id: companyId,
          created_at: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }
      })
    ]);

    // Calcular variações percentuais
    const revenueGrowth = lastMonthRevenue > 0
      ? ((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
      : 0;

    const stats = {
      tutors: {
        total: totalTutors,
        vip: vipTutors,
        vipPercentage: totalTutors > 0 ? (vipTutors / totalTutors) * 100 : 0
      },
      appointments: {
        total: totalAppointments,
        pending: pendingAppointments,
        confirmed: confirmedAppointments,
        completed: completedAppointments
      },
      revenue: {
        currentMonth: monthRevenue,
        lastMonth: lastMonthRevenue,
        growth: revenueGrowth,
        growthFormatted: revenueGrowth.toFixed(1) + '%'
      },
      conversations: {
        last24h: recentConversations
      },
      timestamp: new Date().toISOString()
    };

    // Cachear por 5 minutos
    await redis.set(cacheKey, JSON.stringify(stats), 300);

    res.json({
      success: true,
      data: stats,
      cached: false
    });
  })
);

/**
 * @route   GET /api/stats/appointments
 * @desc    Estatísticas detalhadas de agendamentos
 * @access  Private (JWT)
 * @query   ?period=day|week|month|year&startDate=2025-01-01&endDate=2025-12-31
 */
router.get(
  '/appointments',
  jwtAuth,
  validateRequest({
    period: { type: 'string', required: false, enum: ['day', 'week', 'month', 'year'] },
    startDate: { type: 'string', required: false },
    endDate: { type: 'string', required: false }
  }, 'query'),
  asyncHandler(async (req: any, res: Response) => {
    const companyId = req.companyId;
    const { period = 'month', startDate, endDate } = req.query;

    // Determinar datas
    let start: Date, end: Date;
    const now = new Date();

    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      switch (period) {
        case 'day':
          start = new Date(now.setHours(0, 0, 0, 0));
          end = new Date(now.setHours(23, 59, 59, 999));
          break;
        case 'week':
          start = new Date(now.setDate(now.getDate() - 7));
          end = new Date();
          break;
        case 'year':
          start = new Date(now.getFullYear(), 0, 1);
          end = new Date(now.getFullYear(), 11, 31);
          break;
        default: // month
          start = new Date(now.getFullYear(), now.getMonth(), 1);
          end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      }
    }

    // Buscar estatísticas
    const query = `
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'pendente' THEN 1 END) as pendente,
        COUNT(CASE WHEN status = 'confirmado' THEN 1 END) as confirmado,
        COUNT(CASE WHEN status = 'concluido' THEN 1 END) as concluido,
        COUNT(CASE WHEN status = 'cancelado' THEN 1 END) as cancelado,
        COALESCE(SUM(CASE WHEN status = 'concluido' THEN preco ELSE 0 END), 0) as receita_total,
        COALESCE(AVG(CASE WHEN status = 'concluido' THEN preco END), 0) as ticket_medio,
        COUNT(DISTINCT chat_id) as clientes_unicos
      FROM appointments
      WHERE company_id = $1
        AND data_agendamento >= $2
        AND data_agendamento <= $3
    `;

    const result = await postgres.query(query, [companyId, start, end]);
    const stats = result.rows[0];

    // Buscar serviços mais populares
    const popularServicesQuery = `
      SELECT
        s.nome as servico,
        COUNT(a.id) as total_agendamentos,
        COALESCE(SUM(a.preco), 0) as receita
      FROM appointments a
      JOIN services s ON a.service_id = s.id
      WHERE a.company_id = $1
        AND a.data_agendamento >= $2
        AND a.data_agendamento <= $3
        AND a.status = 'concluido'
      GROUP BY s.id, s.nome
      ORDER BY total_agendamentos DESC
      LIMIT 5
    `;

    const popularServices = await postgres.query(popularServicesQuery, [companyId, start, end]);

    // Buscar distribuição por horário
    const hourDistributionQuery = `
      SELECT
        EXTRACT(HOUR FROM hora_agendamento::time) as hora,
        COUNT(*) as total
      FROM appointments
      WHERE company_id = $1
        AND data_agendamento >= $2
        AND data_agendamento <= $3
      GROUP BY hora
      ORDER BY hora
    `;

    const hourDistribution = await postgres.query(hourDistributionQuery, [companyId, start, end]);

    res.json({
      success: true,
      data: {
        period: {
          start: start.toISOString(),
          end: end.toISOString(),
          type: period
        },
        summary: {
          total: parseInt(stats.total),
          pendente: parseInt(stats.pendente),
          confirmado: parseInt(stats.confirmado),
          concluido: parseInt(stats.concluido),
          cancelado: parseInt(stats.cancelado),
          receitaTotal: parseFloat(stats.receita_total),
          ticketMedio: parseFloat(stats.ticket_medio),
          clientesUnicos: parseInt(stats.clientes_unicos),
          taxaCancelamento: stats.total > 0 ? (stats.cancelado / stats.total) * 100 : 0
        },
        popularServices: popularServices.rows,
        hourDistribution: hourDistribution.rows
      }
    });
  })
);

/**
 * @route   GET /api/stats/revenue
 * @desc    Estatísticas de receita
 * @access  Private (JWT)
 * @query   ?period=day|week|month|year&groupBy=day|week|month
 */
router.get(
  '/revenue',
  jwtAuth,
  validateRequest({
    period: { type: 'string', required: false, enum: ['week', 'month', 'year'] },
    groupBy: { type: 'string', required: false, enum: ['day', 'week', 'month'] }
  }, 'query'),
  asyncHandler(async (req: any, res: Response) => {
    const companyId = req.companyId;
    const { period = 'month', groupBy = 'day' } = req.query;

    // Determinar período
    const now = new Date();
    let start: Date;

    switch (period) {
      case 'week':
        start = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'year':
        start = new Date(now.getFullYear(), 0, 1);
        break;
      default: // month
        start = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Determinar formato de agrupamento
    let dateFormat: string;
    switch (groupBy) {
      case 'week':
        dateFormat = 'YYYY-WW';
        break;
      case 'month':
        dateFormat = 'YYYY-MM';
        break;
      default: // day
        dateFormat = 'YYYY-MM-DD';
    }

    const query = `
      SELECT
        TO_CHAR(data_agendamento, $4) as periodo,
        COUNT(*) as total_agendamentos,
        COALESCE(SUM(preco), 0) as receita,
        COALESCE(AVG(preco), 0) as ticket_medio
      FROM appointments
      WHERE company_id = $1
        AND status = 'concluido'
        AND data_agendamento >= $2
        AND data_agendamento <= $3
      GROUP BY periodo
      ORDER BY periodo
    `;

    const result = await postgres.query(query, [companyId, start, new Date(), dateFormat]);

    // Calcular totais e médias
    const totalReceita = result.rows.reduce((sum, row) => sum + parseFloat(row.receita), 0);
    const totalAgendamentos = result.rows.reduce((sum, row) => sum + parseInt(row.total_agendamentos), 0);
    const ticketMedioGeral = totalAgendamentos > 0 ? totalReceita / totalAgendamentos : 0;

    res.json({
      success: true,
      data: {
        period: {
          start: start.toISOString(),
          end: new Date().toISOString(),
          type: period
        },
        groupBy,
        summary: {
          totalReceita,
          totalAgendamentos,
          ticketMedioGeral
        },
        timeline: result.rows.map(row => ({
          periodo: row.periodo,
          receita: parseFloat(row.receita),
          agendamentos: parseInt(row.total_agendamentos),
          ticketMedio: parseFloat(row.ticket_medio)
        }))
      }
    });
  })
);

/**
 * @route   GET /api/stats/clients
 * @desc    Estatísticas de clientes
 * @access  Private (JWT)
 */
router.get(
  '/clients',
  jwtAuth,
  asyncHandler(async (req: any, res: Response) => {
    const companyId = req.companyId;

    const [
      totalClients,
      vipClients,
      activeClients,
      inactiveClients,
      newClientsThisMonth,
      clientsWithPets,
      avgPetsPerClient
    ] = await Promise.all([
      // Total de clientes
      tutorDAO.count({ where: { company_id: companyId } }),

      // Clientes VIP
      tutorDAO.count({ where: { company_id: companyId, is_vip: true } }),

      // Clientes ativos (últimos 90 dias)
      postgres.query(
        `SELECT COUNT(DISTINCT t.id)
         FROM tutors t
         JOIN appointments a ON t.id = a.tutor_id
         WHERE t.company_id = $1
           AND a.created_at >= NOW() - INTERVAL '90 days'`,
        [companyId]
      ).then(r => parseInt(r.rows[0]?.count || 0)),

      // Clientes inativos
      tutorDAO.count({ where: { company_id: companyId, is_inativo: true } }),

      // Novos clientes este mês
      postgres.query(
        `SELECT COUNT(*)
         FROM tutors
         WHERE company_id = $1
           AND created_at >= DATE_TRUNC('month', NOW())`,
        [companyId]
      ).then(r => parseInt(r.rows[0]?.count || 0)),

      // Clientes com pets cadastrados
      postgres.query(
        `SELECT COUNT(DISTINCT tutor_id)
         FROM pets
         WHERE company_id = $1`,
        [companyId]
      ).then(r => parseInt(r.rows[0]?.count || 0)),

      // Média de pets por cliente
      postgres.query(
        `SELECT AVG(pet_count)::numeric(10,2) as avg
         FROM (
           SELECT tutor_id, COUNT(*) as pet_count
           FROM pets
           WHERE company_id = $1
           GROUP BY tutor_id
         ) subquery`,
        [companyId]
      ).then(r => parseFloat(r.rows[0]?.avg || 0))
    ]);

    // Top clientes (maior gasto)
    const topClientsQuery = `
      SELECT
        t.nome,
        t.telefone,
        t.is_vip,
        COUNT(a.id) as total_agendamentos,
        COALESCE(SUM(a.preco), 0) as valor_total_gasto
      FROM tutors t
      LEFT JOIN appointments a ON t.id = a.tutor_id AND a.status = 'concluido'
      WHERE t.company_id = $1
      GROUP BY t.id, t.nome, t.telefone, t.is_vip
      HAVING COUNT(a.id) > 0
      ORDER BY valor_total_gasto DESC
      LIMIT 10
    `;

    const topClients = await postgres.query(topClientsQuery, [companyId]);

    res.json({
      success: true,
      data: {
        summary: {
          total: totalClients,
          vip: vipClients,
          active: activeClients,
          inactive: inactiveClients,
          newThisMonth: newClientsThisMonth,
          withPets: clientsWithPets,
          avgPetsPerClient: avgPetsPerClient,
          vipPercentage: totalClients > 0 ? (vipClients / totalClients) * 100 : 0
        },
        topClients: topClients.rows.map(row => ({
          nome: row.nome,
          telefone: row.telefone,
          isVip: row.is_vip,
          totalAgendamentos: parseInt(row.total_agendamentos),
          valorTotalGasto: parseFloat(row.valor_total_gasto)
        }))
      }
    });
  })
);

/**
 * @route   GET /api/stats/services
 * @desc    Estatísticas de serviços
 * @access  Private (JWT)
 */
router.get(
  '/services',
  jwtAuth,
  asyncHandler(async (req: any, res: Response) => {
    const companyId = req.companyId;

    const query = `
      SELECT
        s.id,
        s.nome,
        s.categoria,
        s.subcategoria,
        COUNT(a.id) as total_agendamentos,
        COUNT(CASE WHEN a.status = 'concluido' THEN 1 END) as concluidos,
        COUNT(CASE WHEN a.status = 'cancelado' THEN 1 END) as cancelados,
        COALESCE(SUM(CASE WHEN a.status = 'concluido' THEN a.preco ELSE 0 END), 0) as receita_total,
        COALESCE(AVG(CASE WHEN a.status = 'concluido' THEN a.preco END), 0) as preco_medio,
        COALESCE(AVG(CASE WHEN a.avaliacao IS NOT NULL THEN a.avaliacao END), 0) as avaliacao_media
      FROM services s
      LEFT JOIN appointments a ON s.id = a.service_id
      WHERE s.company_id = $1
      GROUP BY s.id, s.nome, s.categoria, s.subcategoria
      ORDER BY total_agendamentos DESC
    `;

    const result = await postgres.query(query, [companyId]);

    const services = result.rows.map(row => ({
      id: row.id,
      nome: row.nome,
      categoria: row.categoria,
      subcategoria: row.subcategoria,
      totalAgendamentos: parseInt(row.total_agendamentos),
      concluidos: parseInt(row.concluidos),
      cancelados: parseInt(row.cancelados),
      receitaTotal: parseFloat(row.receita_total),
      precoMedio: parseFloat(row.preco_medio),
      avaliacaoMedia: parseFloat(row.avaliacao_media),
      taxaCancelamento: row.total_agendamentos > 0
        ? (row.cancelados / row.total_agendamentos) * 100
        : 0
    }));

    const totalReceita = services.reduce((sum, s) => sum + s.receitaTotal, 0);
    const totalAgendamentos = services.reduce((sum, s) => sum + s.totalAgendamentos, 0);

    res.json({
      success: true,
      data: {
        summary: {
          totalReceita,
          totalAgendamentos,
          servicosAtivos: services.length
        },
        services
      }
    });
  })
);

/**
 * @route   GET /api/stats/conversations
 * @desc    Estatísticas de conversações
 * @access  Private (JWT)
 */
router.get(
  '/conversations',
  jwtAuth,
  asyncHandler(async (req: any, res: Response) => {
    const companyId = req.companyId;

    const query = `
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN sentimento = 'positivo' THEN 1 END) as positivo,
        COUNT(CASE WHEN sentimento = 'neutro' THEN 1 END) as neutro,
        COUNT(CASE WHEN sentimento = 'negativo' THEN 1 END) as negativo,
        COUNT(CASE WHEN intencao = 'agendamento' THEN 1 END) as agendamento,
        COUNT(CASE WHEN intencao = 'cancelamento' THEN 1 END) as cancelamento,
        COUNT(CASE WHEN intencao = 'informacao' THEN 1 END) as informacao,
        COUNT(CASE WHEN intencao = 'reclamacao' THEN 1 END) as reclamacao,
        COALESCE(AVG(qualidade_resposta), 0) as qualidade_media
      FROM conversation_history
      WHERE company_id = $1
        AND created_at >= NOW() - INTERVAL '30 days'
    `;

    const result = await postgres.query(query, [companyId]);
    const stats = result.rows[0];

    res.json({
      success: true,
      data: {
        total: parseInt(stats.total),
        sentimento: {
          positivo: parseInt(stats.positivo),
          neutro: parseInt(stats.neutro),
          negativo: parseInt(stats.negativo)
        },
        intencao: {
          agendamento: parseInt(stats.agendamento),
          cancelamento: parseInt(stats.cancelamento),
          informacao: parseInt(stats.informacao),
          reclamacao: parseInt(stats.reclamacao)
        },
        qualidadeMedia: parseFloat(stats.qualidade_media)
      }
    });
  })
);

/**
 * @route   GET /api/stats/night-activity
 * @desc    Estatísticas de atividade noturna (22h às 8h)
 * @access  Private (JWT)
 */
router.get(
  '/night-activity',
  jwtAuth,
  asyncHandler(async (req: any, res: Response) => {
    const companyId = req.companyId;

    // Última noite (22h de ontem até 8h de hoje)
    const now = new Date();
    const today8am = new Date(now);
    today8am.setHours(8, 0, 0, 0);

    const yesterday10pm = new Date(now);
    yesterday10pm.setDate(yesterday10pm.getDate() - 1);
    yesterday10pm.setHours(22, 0, 0, 0);

    const query = `
      SELECT
        COUNT(DISTINCT ch.chat_id) as clientes_atendidos,
        COUNT(CASE WHEN a.id IS NOT NULL THEN 1 END) as agendamentos_confirmados,
        COALESCE(SUM(CASE WHEN a.status = 'concluido' THEN a.preco ELSE 0 END), 0) as vendas_fechadas,
        COUNT(CASE WHEN ch.intencao = 'followup' THEN 1 END) as followups_enviados
      FROM conversation_history ch
      LEFT JOIN appointments a ON ch.chat_id = a.chat_id
        AND a.created_at >= $2
        AND a.created_at <= $3
      WHERE ch.company_id = $1
        AND ch.created_at >= $2
        AND ch.created_at <= $3
    `;

    const result = await postgres.query(query, [companyId, yesterday10pm, today8am]);
    const stats = result.rows[0];

    res.json({
      success: true,
      data: {
        period: {
          start: yesterday10pm.toISOString(),
          end: today8am.toISOString()
        },
        clientesAtendidos: parseInt(stats.clientes_atendidos) || 0,
        agendamentosConfirmados: parseInt(stats.agendamentos_confirmados) || 0,
        vendasFechadas: parseFloat(stats.vendas_fechadas) || 0,
        followupsEnviados: parseInt(stats.followups_enviados) || 0
      }
    });
  })
);

/**
 * @route   GET /api/stats/impact
 * @desc    Métricas de impacto da IA
 * @access  Private (JWT)
 */
router.get(
  '/impact',
  jwtAuth,
  asyncHandler(async (req: any, res: Response) => {
    const companyId = req.companyId;

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Horas trabalhadas pela IA (estimativa: 5 min por conversa)
    const conversationsQuery = `
      SELECT COUNT(*) as total
      FROM conversation_history
      WHERE company_id = $1
        AND created_at >= $2
    `;
    const conversations = await postgres.query(conversationsQuery, [companyId, startOfMonth]);
    const totalConversations = parseInt(conversations.rows[0]?.total) || 0;
    const horasTrabalhadasIA = (totalConversations * 5) / 60; // 5 min por conversa

    // Valor econômico (R$ 25/hora estimado)
    const valorEconomico = horasTrabalhadasIA * 25;

    // Vendas fechadas pela IA
    const salesQuery = `
      SELECT COUNT(*) as total
      FROM appointments
      WHERE company_id = $1
        AND status = 'concluido'
        AND created_at >= $2
        AND origem = 'ia'
    `;
    const sales = await postgres.query(salesQuery, [companyId, startOfMonth]);
    const vendasFechadas = parseInt(sales.rows[0]?.total) || 0;

    // Dias economizados (8h por dia de trabalho)
    const diasEconomizados = horasTrabalhadasIA / 8;

    res.json({
      success: true,
      data: {
        horasTrabalhadasIA: Math.round(horasTrabalhadasIA),
        valorEconomico: Math.round(valorEconomico),
        vendasFechadas,
        diasEconomizados: Math.round(diasEconomizados * 10) / 10 // 1 casa decimal
      }
    });
  })
);

/**
 * @route   GET /api/stats/revenue-timeline
 * @desc    Timeline de receita ao longo do dia
 * @access  Private (JWT)
 */
router.get(
  '/revenue-timeline',
  jwtAuth,
  asyncHandler(async (req: any, res: Response) => {
    const companyId = req.companyId;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const query = `
      SELECT
        EXTRACT(HOUR FROM created_at) as hora,
        COALESCE(SUM(preco), 0) as receita
      FROM appointments
      WHERE company_id = $1
        AND status = 'concluido'
        AND created_at >= $2
      GROUP BY hora
      ORDER BY hora
    `;

    const result = await postgres.query(query, [companyId, today]);

    // Preencher todas as horas (0-23) mesmo sem dados
    const timeline = Array.from({ length: 24 }, (_, hora) => {
      const found = result.rows.find(r => parseInt(r.hora) === hora);
      return {
        hora,
        receita: found ? parseFloat(found.receita) : 0
      };
    });

    const totalReceita = timeline.reduce((sum, item) => sum + item.receita, 0);

    res.json({
      success: true,
      data: {
        date: today.toISOString().split('T')[0],
        totalReceita: Math.round(totalReceita),
        timeline
      }
    });
  })
);

/**
 * @route   GET /api/stats/automation
 * @desc    Estatísticas de automação
 * @access  Private (JWT)
 */
router.get(
  '/automation',
  jwtAuth,
  asyncHandler(async (req: any, res: Response) => {
    const companyId = req.companyId;

    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const query = `
      SELECT
        COUNT(*) as total_atendimentos,
        COUNT(CASE WHEN origem = 'ia' THEN 1 END) as automatico,
        COUNT(CASE WHEN origem = 'manual' OR origem IS NULL THEN 1 END) as manual
      FROM conversation_history
      WHERE company_id = $1
        AND created_at >= $2
    `;

    const result = await postgres.query(query, [companyId, last30Days]);
    const stats = result.rows[0];

    const total = parseInt(stats.total_atendimentos) || 1; // evitar divisão por zero
    const automatico = parseInt(stats.automatico) || 0;
    const manual = parseInt(stats.manual) || 0;

    const taxaAutomacao = (automatico / total) * 100;

    res.json({
      success: true,
      data: {
        totalAtendimentos: total,
        automatico,
        manual,
        taxaAutomacao: Math.round(taxaAutomacao),
        percentualAutomatico: Math.round(taxaAutomacao),
        percentualManual: Math.round((manual / total) * 100)
      }
    });
  })
);

export default router;

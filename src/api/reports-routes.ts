import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import pool from '../config/database';

const router = Router();

/**
 * GET /api/reports
 * Endpoint genérico de relatórios com filtros
 */
router.get('/', asyncHandler(async (req, res) => {
  const companyId = parseInt(req.query.companyId as string);
  const type = req.query.type as string;
  const startDate = req.query.startDate as string;
  const endDate = req.query.endDate as string;

  if (!companyId) {
    return res.status(400).json({
      success: false,
      error: 'Company ID é obrigatório'
    });
  }

  let data: any = {};
  let stats: any = {};

  // Relatório de receita
  if (type === 'revenue') {
    const revenueQuery = await pool.query(
      `SELECT
        a.data_agendamento::date as date,
        t.nome as clientName,
        s.nome as serviceName,
        a.preco as value
       FROM appointments a
       LEFT JOIN tutors t ON a.tutor_id = t.id
       LEFT JOIN services s ON a.servico_id = s.id
       WHERE a.company_id = $1
       AND a.data_agendamento BETWEEN $2 AND $3
       AND a.status = 'concluido'
       ORDER BY a.data_agendamento DESC`,
      [companyId, startDate, endDate]
    );

    const statsQuery = await pool.query(
      `SELECT
        COUNT(*) as totalServices,
        COALESCE(SUM(preco), 0) as totalRevenue,
        COALESCE(AVG(preco), 0) as avgTicket
       FROM appointments
       WHERE company_id = $1
       AND data_agendamento BETWEEN $2 AND $3
       AND status = 'concluido'`,
      [companyId, startDate, endDate]
    );

    stats = {
      totalRevenue: parseFloat(statsQuery.rows[0].totalrevenue),
      totalServices: parseInt(statsQuery.rows[0].totalservices),
      avgTicket: parseFloat(statsQuery.rows[0].avgticket),
      totalClients: 0
    };

    data = {
      details: revenueQuery.rows,
      stats
    };
  }

  // Relatório de serviços mais vendidos
  else if (type === 'services') {
    const servicesQuery = await pool.query(
      `SELECT
        s.nome as serviceName,
        COUNT(*) as quantity,
        COALESCE(SUM(a.preco), 0) as totalRevenue,
        COALESCE(AVG(a.preco), 0) as avgTicket
       FROM appointments a
       LEFT JOIN services s ON a.servico_id = s.id
       WHERE a.company_id = $1
       AND a.data_agendamento BETWEEN $2 AND $3
       AND a.status = 'concluido'
       GROUP BY s.id, s.nome
       ORDER BY quantity DESC`,
      [companyId, startDate, endDate]
    );

    const statsQuery = await pool.query(
      `SELECT
        COUNT(*) as totalServices,
        COALESCE(SUM(preco), 0) as totalRevenue,
        COALESCE(AVG(preco), 0) as avgTicket
       FROM appointments
       WHERE company_id = $1
       AND data_agendamento BETWEEN $2 AND $3
       AND status = 'concluido'`,
      [companyId, startDate, endDate]
    );

    stats = {
      totalRevenue: parseFloat(statsQuery.rows[0].totalrevenue),
      totalServices: parseInt(statsQuery.rows[0].totalservices),
      avgTicket: parseFloat(statsQuery.rows[0].avgticket),
      totalClients: 0
    };

    data = {
      details: servicesQuery.rows,
      stats
    };
  }

  // Relatório de clientes
  else if (type === 'clients') {
    const clientsQuery = await pool.query(
      `SELECT
        t.nome as clientName,
        COUNT(*) as serviceCount,
        COALESCE(SUM(a.preco), 0) as totalSpent,
        COALESCE(AVG(a.preco), 0) as avgTicket
       FROM appointments a
       LEFT JOIN tutors t ON a.tutor_id = t.id
       WHERE a.company_id = $1
       AND a.data_agendamento BETWEEN $2 AND $3
       AND a.status = 'concluido'
       GROUP BY t.id, t.nome
       ORDER BY totalSpent DESC`,
      [companyId, startDate, endDate]
    );

    const statsQuery = await pool.query(
      `SELECT
        COUNT(DISTINCT tutor_id) as totalClients,
        COUNT(*) as totalServices,
        COALESCE(SUM(preco), 0) as totalRevenue,
        COALESCE(AVG(preco), 0) as avgTicket
       FROM appointments
       WHERE company_id = $1
       AND data_agendamento BETWEEN $2 AND $3
       AND status = 'concluido'`,
      [companyId, startDate, endDate]
    );

    stats = {
      totalRevenue: parseFloat(statsQuery.rows[0].totalrevenue),
      totalServices: parseInt(statsQuery.rows[0].totalservices),
      totalClients: parseInt(statsQuery.rows[0].totalclients),
      avgTicket: parseFloat(statsQuery.rows[0].avgticket)
    };

    data = {
      details: clientsQuery.rows,
      stats
    };
  }

  else {
    return res.status(400).json({
      success: false,
      error: 'Tipo de relatório inválido. Use: revenue, services ou clients'
    });
  }

  res.json({
    success: true,
    ...data
  });
}));

/**
 * GET /api/reports/dashboard
 * Relatório consolidado para dashboard
 */
router.get('/dashboard', asyncHandler(async (req, res) => {
  const companyId = parseInt(req.query.companyId as string);
  const period = req.query.period as string || '30'; // dias

  if (!companyId) {
    return res.status(400).json({
      success: false,
      error: 'Company ID é obrigatório'
    });
  }

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(period));

  // Métricas gerais
  const metricsQuery = await pool.query(
    `SELECT
      COUNT(DISTINCT tutor_id) as total_clients,
      COUNT(*) as total_appointments,
      COALESCE(SUM(CASE WHEN status = 'concluido' THEN preco ELSE 0 END), 0) as total_revenue,
      COALESCE(AVG(CASE WHEN status = 'concluido' THEN preco ELSE NULL END), 0) as avg_ticket,
      COUNT(CASE WHEN status = 'cancelado' THEN 1 END) as cancelled_count,
      COUNT(CASE WHEN status = 'concluido' THEN 1 END) as completed_count
     FROM appointments
     WHERE company_id = $1
     AND data_agendamento >= $2`,
    [companyId, startDate]
  );

  // Receita por dia (últimos 30 dias)
  const revenueByDayQuery = await pool.query(
    `SELECT
      data_agendamento::date as date,
      COALESCE(SUM(preco), 0) as revenue
     FROM appointments
     WHERE company_id = $1
     AND data_agendamento >= $2
     AND status = 'concluido'
     GROUP BY data_agendamento::date
     ORDER BY date ASC`,
    [companyId, startDate]
  );

  // Top serviços
  const topServicesQuery = await pool.query(
    `SELECT
      s.nome as service_name,
      COUNT(*) as count,
      COALESCE(SUM(a.preco), 0) as revenue
     FROM appointments a
     LEFT JOIN services s ON a.servico_id = s.id
     WHERE a.company_id = $1
     AND a.data_agendamento >= $2
     AND a.status = 'concluido'
     GROUP BY s.id, s.nome
     ORDER BY count DESC
     LIMIT 5`,
    [companyId, startDate]
  );

  const metrics = metricsQuery.rows[0];

  res.json({
    success: true,
    data: {
      metrics: {
        totalClients: parseInt(metrics.total_clients),
        totalAppointments: parseInt(metrics.total_appointments),
        totalRevenue: parseFloat(metrics.total_revenue),
        avgTicket: parseFloat(metrics.avg_ticket),
        cancelledCount: parseInt(metrics.cancelled_count),
        completedCount: parseInt(metrics.completed_count),
        cancellationRate: parseInt(metrics.total_appointments) > 0
          ? (parseInt(metrics.cancelled_count) / parseInt(metrics.total_appointments)) * 100
          : 0
      },
      revenueByDay: revenueByDayQuery.rows,
      topServices: topServicesQuery.rows
    }
  });
}));

export default router;

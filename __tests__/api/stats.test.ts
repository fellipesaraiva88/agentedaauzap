/**
 * Testes para API de Estatísticas
 * @route /api/stats
 */

import request from 'supertest';
import express, { Express } from 'express';
import statsRouter from '../../src/api/stats-routes';
import { getAuthHeaders } from '../helpers/auth.helper';
import { mockDashboardStats } from '../helpers/mock.helper';

// Mock dos serviços
jest.mock('../../src/services/PostgreSQLClient');
jest.mock('../../src/services/RedisClient');
jest.mock('../../src/dao/AppointmentDAO');
jest.mock('../../src/dao/TutorDAO');
jest.mock('../../src/dao/ConversationDAO');
jest.mock('../../src/middleware/apiAuth');

describe('Stats API Tests', () => {
  let app: Express;
  let mockPostgres: any;
  let mockRedis: any;
  let mockAppointmentDAO: any;
  let mockTutorDAO: any;
  let mockConversationDAO: any;

  beforeAll(() => {
    // Setup Express app
    app = express();
    app.use(express.json());

    // Mock do middleware de autenticação
    app.use((req: any, res, next) => {
      req.companyId = 1;
      req.userId = 1;
      req.user = { userId: 1, companyId: 1, role: 'admin' };
      next();
    });

    app.use('/api/stats', statsRouter);

    // Mock do PostgreSQLClient
    const { PostgreSQLClient } = require('../../src/services/PostgreSQLClient');
    mockPostgres = {
      query: jest.fn()
    };
    PostgreSQLClient.getInstance = jest.fn().mockReturnValue(mockPostgres);

    // Mock do RedisClient
    const { RedisClient } = require('../../src/services/RedisClient');
    mockRedis = {
      get: jest.fn(),
      set: jest.fn()
    };
    RedisClient.getInstance = jest.fn().mockReturnValue(mockRedis);

    // Mock dos DAOs
    const { AppointmentDAO } = require('../../src/dao/AppointmentDAO');
    mockAppointmentDAO = {
      count: jest.fn()
    };
    AppointmentDAO.mockImplementation(() => mockAppointmentDAO);

    const { TutorDAO } = require('../../src/dao/TutorDAO');
    mockTutorDAO = {
      count: jest.fn()
    };
    TutorDAO.mockImplementation(() => mockTutorDAO);

    const { ConversationHistoryDAO } = require('../../src/dao/ConversationDAO');
    mockConversationDAO = {
      count: jest.fn()
    };
    ConversationHistoryDAO.mockImplementation(() => mockConversationDAO);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Por padrão, sem cache
    mockRedis.get.mockResolvedValue(null);
  });

  describe('GET /api/stats/dashboard', () => {
    it('deve retornar estatísticas do dashboard', async () => {
      // Mock dos dados
      mockTutorDAO.count
        .mockResolvedValueOnce(100) // total tutores
        .mockResolvedValueOnce(15); // tutores VIP

      mockAppointmentDAO.count
        .mockResolvedValueOnce(250) // total agendamentos
        .mockResolvedValueOnce(10)  // pendentes
        .mockResolvedValueOnce(20)  // confirmados
        .mockResolvedValueOnce(200); // concluídos

      mockPostgres.query
        .mockResolvedValueOnce({ rows: [{ total: 12500 }] }) // receita mês atual
        .mockResolvedValueOnce({ rows: [{ total: 10000 }] }); // receita mês passado

      mockConversationDAO.count.mockResolvedValue(45); // conversas 24h

      const response = await request(app)
        .get('/api/stats/dashboard')
        .set(getAuthHeaders());

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('tutors');
      expect(response.body.data).toHaveProperty('appointments');
      expect(response.body.data).toHaveProperty('revenue');
      expect(response.body.data).toHaveProperty('conversations');
      expect(response.body.data.tutors.total).toBe(100);
      expect(response.body.data.tutors.vip).toBe(15);
      expect(response.body.data.revenue.currentMonth).toBe(12500);
      expect(response.body.cached).toBe(false);
    });

    it('deve retornar dados do cache quando disponível', async () => {
      const cachedData = mockDashboardStats();
      mockRedis.get.mockResolvedValue(JSON.stringify(cachedData));

      const response = await request(app)
        .get('/api/stats/dashboard')
        .set(getAuthHeaders());

      expect(response.status).toBe(200);
      expect(response.body.cached).toBe(true);
      expect(response.body.data).toEqual(cachedData);
      expect(mockTutorDAO.count).not.toHaveBeenCalled();
    });

    it('deve calcular crescimento percentual de receita', async () => {
      mockTutorDAO.count.mockResolvedValue(0);
      mockAppointmentDAO.count.mockResolvedValue(0);
      mockConversationDAO.count.mockResolvedValue(0);

      mockPostgres.query
        .mockResolvedValueOnce({ rows: [{ total: 15000 }] }) // receita atual
        .mockResolvedValueOnce({ rows: [{ total: 10000 }] }); // receita passada

      const response = await request(app)
        .get('/api/stats/dashboard')
        .set(getAuthHeaders());

      expect(response.status).toBe(200);
      expect(response.body.data.revenue.growth).toBe(50); // 50% de crescimento
    });
  });

  describe('GET /api/stats/appointments', () => {
    it('deve retornar estatísticas de agendamentos do mês', async () => {
      const statsData = {
        total: 100,
        pendente: 10,
        confirmado: 20,
        concluido: 60,
        cancelado: 10,
        receita_total: 5000,
        ticket_medio: 83.33,
        clientes_unicos: 50
      };

      mockPostgres.query
        .mockResolvedValueOnce({ rows: [statsData] }) // stats principais
        .mockResolvedValueOnce({ rows: [] }) // serviços populares
        .mockResolvedValueOnce({ rows: [] }); // distribuição horária

      const response = await request(app)
        .get('/api/stats/appointments')
        .set(getAuthHeaders());

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.summary.total).toBe(100);
      expect(response.body.data.summary.concluido).toBe(60);
      expect(response.body.data.summary.receitaTotal).toBe(5000);
    });

    it('deve aceitar filtro por período customizado', async () => {
      mockPostgres.query.mockResolvedValue({ rows: [] });

      const response = await request(app)
        .get('/api/stats/appointments')
        .query({
          startDate: '2025-01-01',
          endDate: '2025-01-31'
        })
        .set(getAuthHeaders());

      expect(response.status).toBe(200);
      expect(response.body.data.period.start).toContain('2025-01-01');
      expect(response.body.data.period.end).toContain('2025-01-31');
    });

    it('deve retornar serviços mais populares', async () => {
      const popularServices = [
        { servico: 'Banho', total_agendamentos: 50, receita: 2500 },
        { servico: 'Tosa', total_agendamentos: 30, receita: 2100 }
      ];

      mockPostgres.query
        .mockResolvedValueOnce({ rows: [{ total: 0 }] })
        .mockResolvedValueOnce({ rows: popularServices })
        .mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get('/api/stats/appointments')
        .set(getAuthHeaders());

      expect(response.status).toBe(200);
      expect(response.body.data.popularServices).toHaveLength(2);
      expect(response.body.data.popularServices[0].servico).toBe('Banho');
    });

    it('deve retornar distribuição por horário', async () => {
      const hourDist = [
        { hora: 9, total: 15 },
        { hora: 10, total: 25 },
        { hora: 14, total: 20 }
      ];

      mockPostgres.query
        .mockResolvedValueOnce({ rows: [{ total: 0 }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: hourDist });

      const response = await request(app)
        .get('/api/stats/appointments')
        .set(getAuthHeaders());

      expect(response.status).toBe(200);
      expect(response.body.data.hourDistribution).toHaveLength(3);
    });

    it('deve calcular taxa de cancelamento', async () => {
      const statsData = {
        total: 100,
        cancelado: 15,
        pendente: 0,
        confirmado: 0,
        concluido: 85,
        receita_total: 0,
        ticket_medio: 0,
        clientes_unicos: 0
      };

      mockPostgres.query
        .mockResolvedValueOnce({ rows: [statsData] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get('/api/stats/appointments')
        .set(getAuthHeaders());

      expect(response.status).toBe(200);
      expect(response.body.data.summary.taxaCancelamento).toBe(15); // 15%
    });
  });

  describe('GET /api/stats/revenue', () => {
    it('deve retornar estatísticas de receita agrupadas por dia', async () => {
      const timelineData = [
        { periodo: '2025-01-01', total_agendamentos: 10, receita: 500, ticket_medio: 50 },
        { periodo: '2025-01-02', total_agendamentos: 15, receita: 750, ticket_medio: 50 }
      ];

      mockPostgres.query.mockResolvedValue({ rows: timelineData });

      const response = await request(app)
        .get('/api/stats/revenue')
        .query({ period: 'week', groupBy: 'day' })
        .set(getAuthHeaders());

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.timeline).toHaveLength(2);
      expect(response.body.data.summary.totalReceita).toBe(1250);
      expect(response.body.data.summary.totalAgendamentos).toBe(25);
    });

    it('deve usar valores padrão para period e groupBy', async () => {
      mockPostgres.query.mockResolvedValue({ rows: [] });

      const response = await request(app)
        .get('/api/stats/revenue')
        .set(getAuthHeaders());

      expect(response.status).toBe(200);
      expect(response.body.data.period.type).toBe('month');
      expect(response.body.data.groupBy).toBe('day');
    });
  });

  describe('GET /api/stats/clients', () => {
    it('deve retornar estatísticas de clientes', async () => {
      mockTutorDAO.count
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(15)  // vip
        .mockResolvedValueOnce(5);  // inativos

      mockPostgres.query
        .mockResolvedValueOnce({ rows: [{ count: 80 }] }) // ativos
        .mockResolvedValueOnce({ rows: [{ count: 10 }] }) // novos este mês
        .mockResolvedValueOnce({ rows: [{ count: 75 }] }) // com pets
        .mockResolvedValueOnce({ rows: [{ avg: 1.5 }] })  // média pets
        .mockResolvedValueOnce({ rows: [] }); // top clientes

      const response = await request(app)
        .get('/api/stats/clients')
        .set(getAuthHeaders());

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.summary.total).toBe(100);
      expect(response.body.data.summary.vip).toBe(15);
      expect(response.body.data.summary.avgPetsPerClient).toBe(1.5);
    });

    it('deve retornar top 10 clientes por gasto', async () => {
      const topClients = [
        { nome: 'João Silva', total_agendamentos: 20, valor_total_gasto: 1000 },
        { nome: 'Maria Santos', total_agendamentos: 15, valor_total_gasto: 800 }
      ];

      mockTutorDAO.count.mockResolvedValue(0);
      mockPostgres.query
        .mockResolvedValueOnce({ rows: [{ count: 0 }] })
        .mockResolvedValueOnce({ rows: [{ count: 0 }] })
        .mockResolvedValueOnce({ rows: [{ count: 0 }] })
        .mockResolvedValueOnce({ rows: [{ avg: 0 }] })
        .mockResolvedValueOnce({ rows: topClients });

      const response = await request(app)
        .get('/api/stats/clients')
        .set(getAuthHeaders());

      expect(response.status).toBe(200);
      expect(response.body.data.topClients).toHaveLength(2);
    });
  });

  describe('GET /api/stats/services', () => {
    it('deve retornar estatísticas de serviços', async () => {
      const servicesData = [
        {
          id: 1,
          nome: 'Banho',
          categoria: 'banho',
          subcategoria: 'banho_simples',
          total_agendamentos: 50,
          concluidos: 45,
          cancelados: 5,
          receita_total: 2500,
          preco_medio: 55.56,
          avaliacao_media: 4.8
        }
      ];

      mockPostgres.query.mockResolvedValue({ rows: servicesData });

      const response = await request(app)
        .get('/api/stats/services')
        .set(getAuthHeaders());

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.services).toHaveLength(1);
      expect(response.body.data.services[0].nome).toBe('Banho');
      expect(response.body.data.services[0].taxaCancelamento).toBe(10); // 5/50 = 10%
    });

    it('deve calcular totais corretamente', async () => {
      const servicesData = [
        { id: 1, nome: 'Banho', total_agendamentos: 50, receita_total: 2500 },
        { id: 2, nome: 'Tosa', total_agendamentos: 30, receita_total: 2100 }
      ];

      mockPostgres.query.mockResolvedValue({
        rows: servicesData.map(s => ({ ...s, concluidos: 0, cancelados: 0, preco_medio: 0, avaliacao_media: 0, categoria: '', subcategoria: '' }))
      });

      const response = await request(app)
        .get('/api/stats/services')
        .set(getAuthHeaders());

      expect(response.status).toBe(200);
      expect(response.body.data.summary.totalReceita).toBe(4600);
      expect(response.body.data.summary.totalAgendamentos).toBe(80);
      expect(response.body.data.summary.servicosAtivos).toBe(2);
    });
  });

  describe('GET /api/stats/conversations', () => {
    it('deve retornar estatísticas de conversações dos últimos 30 dias', async () => {
      const conversationStats = {
        total: 100,
        positivo: 60,
        neutro: 30,
        negativo: 10,
        agendamento: 40,
        cancelamento: 5,
        informacao: 45,
        reclamacao: 10,
        qualidade_media: 0.85
      };

      mockPostgres.query.mockResolvedValue({ rows: [conversationStats] });

      const response = await request(app)
        .get('/api/stats/conversations')
        .set(getAuthHeaders());

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.total).toBe(100);
      expect(response.body.data.sentimento.positivo).toBe(60);
      expect(response.body.data.intencao.agendamento).toBe(40);
      expect(response.body.data.qualidadeMedia).toBe(0.85);
    });
  });

  describe('GET /api/stats/night-activity', () => {
    it('deve retornar estatísticas de atividade noturna', async () => {
      const nightStats = {
        clientes_atendidos: 15,
        agendamentos_confirmados: 8,
        vendas_fechadas: 400,
        followups_enviados: 20
      };

      mockPostgres.query.mockResolvedValue({ rows: [nightStats] });

      const response = await request(app)
        .get('/api/stats/night-activity')
        .set(getAuthHeaders());

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.clientesAtendidos).toBe(15);
      expect(response.body.data.agendamentosConfirmados).toBe(8);
      expect(response.body.data.vendasFechadas).toBe(400);
    });
  });

  describe('GET /api/stats/impact', () => {
    it('deve retornar métricas de impacto da IA', async () => {
      mockPostgres.query
        .mockResolvedValueOnce({ rows: [{ total: 600 }] }) // conversas
        .mockResolvedValueOnce({ rows: [{ total: 50 }] });  // vendas

      const response = await request(app)
        .get('/api/stats/impact')
        .set(getAuthHeaders());

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.horasTrabalhadasIA).toBe(50); // 600 * 5 / 60
      expect(response.body.data.valorEconomico).toBe(1250);   // 50 * 25
      expect(response.body.data.vendasFechadas).toBe(50);
    });
  });

  describe('GET /api/stats/revenue-timeline', () => {
    it('deve retornar timeline de receita do dia', async () => {
      const timelineData = [
        { hora: 9, receita: 150 },
        { hora: 10, receita: 200 },
        { hora: 14, receita: 180 }
      ];

      mockPostgres.query.mockResolvedValue({ rows: timelineData });

      const response = await request(app)
        .get('/api/stats/revenue-timeline')
        .set(getAuthHeaders());

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.timeline).toHaveLength(24); // Todas as horas
      expect(response.body.data.totalReceita).toBe(530);
    });
  });

  describe('GET /api/stats/automation', () => {
    it('deve retornar estatísticas de automação', async () => {
      const automationStats = {
        total_atendimentos: 100,
        automatico: 75,
        manual: 25
      };

      mockPostgres.query.mockResolvedValue({ rows: [automationStats] });

      const response = await request(app)
        .get('/api/stats/automation')
        .set(getAuthHeaders());

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalAtendimentos).toBe(100);
      expect(response.body.data.automatico).toBe(75);
      expect(response.body.data.manual).toBe(25);
      expect(response.body.data.taxaAutomacao).toBe(75); // 75%
    });
  });
});

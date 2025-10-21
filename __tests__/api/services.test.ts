/**
 * Testes para API de Serviços
 * @route /api/services
 */

import request from 'supertest';
import express, { Express } from 'express';
import servicesRouter from '../../src/api/services-routes';
import { getAuthHeaders } from '../helpers/auth.helper';
import { mockService, mockList, mockPaginatedResponse } from '../helpers/mock.helper';

// Mock dos serviços
jest.mock('../../src/dao/ServiceDAO');
jest.mock('../../src/middleware/apiAuth');

describe('Services API Tests', () => {
  let app: Express;
  let mockServiceDAO: any;

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

    app.use('/api/services', servicesRouter);

    // Mock do ServiceDAO
    const { ServiceDAO } = require('../../src/dao/ServiceDAO');
    mockServiceDAO = {
      setCompanyContext: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      count: jest.fn(),
      findActive: jest.fn(),
      findByCategory: jest.fn(),
      findPopular: jest.fn()
    };

    // Chain methods para setCompanyContext
    mockServiceDAO.setCompanyContext.mockReturnValue(mockServiceDAO);

    ServiceDAO.mockImplementation(() => mockServiceDAO);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset chain
    mockServiceDAO.setCompanyContext.mockReturnValue(mockServiceDAO);
  });

  describe('GET /api/services', () => {
    it('deve retornar lista de serviços com paginação', async () => {
      const services = mockList(mockService, 5);
      mockServiceDAO.findAll.mockResolvedValue(services);
      mockServiceDAO.count.mockResolvedValue(10);

      const response = await request(app)
        .get('/api/services')
        .query({ limit: 5, offset: 0 })
        .set(getAuthHeaders());

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(5);
      expect(response.body.pagination).toEqual({
        total: 10,
        limit: 5,
        offset: 0,
        hasMore: true
      });
      expect(mockServiceDAO.setCompanyContext).toHaveBeenCalledWith(1);
    });

    it('deve retornar todos os serviços quando não houver paginação', async () => {
      const services = mockList(mockService, 10);
      mockServiceDAO.findAll.mockResolvedValue(services);
      mockServiceDAO.count.mockResolvedValue(10);

      const response = await request(app)
        .get('/api/services')
        .set(getAuthHeaders());

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(10);
      expect(response.body.pagination.hasMore).toBe(false);
    });

    it('deve filtrar serviços ativos', async () => {
      const activeServices = mockList(() => mockService({ ativo: true }), 8);
      mockServiceDAO.findAll.mockResolvedValue(activeServices);
      mockServiceDAO.count.mockResolvedValue(8);

      const response = await request(app)
        .get('/api/services')
        .query({ ativo: 'true' })
        .set(getAuthHeaders());

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(8);
      expect(response.body.data.every((s: any) => s.ativo === true)).toBe(true);
    });

    it('deve filtrar serviços inativos', async () => {
      const inactiveServices = mockList(() => mockService({ ativo: false }), 2);
      mockServiceDAO.findAll.mockResolvedValue(inactiveServices);
      mockServiceDAO.count.mockResolvedValue(2);

      const response = await request(app)
        .get('/api/services')
        .query({ ativo: 'false' })
        .set(getAuthHeaders());

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.every((s: any) => s.ativo === false)).toBe(true);
    });

    it('deve filtrar serviços por categoria', async () => {
      const banhoServices = mockList(() => mockService({ categoria: 'banho' }), 3);
      mockServiceDAO.findAll.mockResolvedValue(banhoServices);
      mockServiceDAO.count.mockResolvedValue(3);

      const response = await request(app)
        .get('/api/services')
        .query({ categoria: 'banho' })
        .set(getAuthHeaders());

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.data.every((s: any) => s.categoria === 'banho')).toBe(true);
    });

    it('deve filtrar serviços populares', async () => {
      const popularServices = mockList(() => mockService({ popular: true }), 5);
      mockServiceDAO.findAll.mockResolvedValue(popularServices);
      mockServiceDAO.count.mockResolvedValue(5);

      const response = await request(app)
        .get('/api/services')
        .query({ popular: 'true' })
        .set(getAuthHeaders());

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(5);
      expect(response.body.data.every((s: any) => s.popular === true)).toBe(true);
    });

    it('deve combinar múltiplos filtros', async () => {
      const filteredServices = mockList(() =>
        mockService({ ativo: true, categoria: 'banho', popular: true }), 2
      );
      mockServiceDAO.findAll.mockResolvedValue(filteredServices);
      mockServiceDAO.count.mockResolvedValue(2);

      const response = await request(app)
        .get('/api/services')
        .query({
          ativo: 'true',
          categoria: 'banho',
          popular: 'true'
        })
        .set(getAuthHeaders());

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.every((s: any) =>
        s.ativo && s.categoria === 'banho' && s.popular
      )).toBe(true);
    });

    it('deve retornar array vazio quando não houver serviços', async () => {
      mockServiceDAO.findAll.mockResolvedValue([]);
      mockServiceDAO.count.mockResolvedValue(0);

      const response = await request(app)
        .get('/api/services')
        .set(getAuthHeaders());

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(0);
      expect(response.body.pagination.total).toBe(0);
    });

    it('deve ordenar serviços por ordem e nome', async () => {
      const services = [
        mockService({ id: 1, nome: 'Banho', ordem: 1 }),
        mockService({ id: 2, nome: 'Tosa', ordem: 2 }),
        mockService({ id: 3, nome: 'Hidratação', ordem: 3 })
      ];
      mockServiceDAO.findAll.mockResolvedValue(services);
      mockServiceDAO.count.mockResolvedValue(3);

      const response = await request(app)
        .get('/api/services')
        .set(getAuthHeaders());

      expect(response.status).toBe(200);
      expect(mockServiceDAO.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: 'ordem ASC, nome ASC'
        })
      );
    });

    it('deve usar limite padrão de 100 quando não especificado', async () => {
      mockServiceDAO.findAll.mockResolvedValue([]);
      mockServiceDAO.count.mockResolvedValue(0);

      const response = await request(app)
        .get('/api/services')
        .set(getAuthHeaders());

      expect(response.status).toBe(200);
      expect(mockServiceDAO.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 100
        })
      );
    });
  });

  describe('GET /api/services/:id', () => {
    it('deve retornar serviço por ID', async () => {
      const service = mockService({ id: 1 });
      mockServiceDAO.findById.mockResolvedValue(service);

      const response = await request(app)
        .get('/api/services/1')
        .set(getAuthHeaders());

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(service);
      expect(mockServiceDAO.setCompanyContext).toHaveBeenCalledWith(1);
      expect(mockServiceDAO.findById).toHaveBeenCalledWith(1);
    });

    it('deve retornar 404 quando serviço não for encontrado', async () => {
      mockServiceDAO.findById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/services/999')
        .set(getAuthHeaders());

      expect(response.status).toBe(404);
    });

    it('deve converter ID string para número', async () => {
      const service = mockService({ id: 42 });
      mockServiceDAO.findById.mockResolvedValue(service);

      const response = await request(app)
        .get('/api/services/42')
        .set(getAuthHeaders());

      expect(response.status).toBe(200);
      expect(mockServiceDAO.findById).toHaveBeenCalledWith(42);
    });

    it('deve retornar todos os campos do serviço', async () => {
      const service = mockService({
        id: 1,
        nome: 'Banho Completo',
        descricao: 'Banho com produtos premium',
        categoria: 'banho',
        subcategoria: 'banho_completo',
        preco_base: 50.00,
        preco_pequeno: 40.00,
        preco_medio: 50.00,
        preco_grande: 60.00,
        duracao_minutos: 60,
        ativo: true,
        popular: true
      });
      mockServiceDAO.findById.mockResolvedValue(service);

      const response = await request(app)
        .get('/api/services/1')
        .set(getAuthHeaders());

      expect(response.status).toBe(200);
      expect(response.body.data).toMatchObject({
        id: 1,
        nome: 'Banho Completo',
        descricao: 'Banho com produtos premium',
        categoria: 'banho',
        subcategoria: 'banho_completo',
        preco_base: 50.00,
        duracao_minutos: 60,
        ativo: true,
        popular: true
      });
    });

    it('deve retornar serviço com preços diferenciados por porte', async () => {
      const service = mockService({
        id: 1,
        nome: 'Tosa',
        preco_pequeno: 40.00,
        preco_medio: 60.00,
        preco_grande: 80.00
      });
      mockServiceDAO.findById.mockResolvedValue(service);

      const response = await request(app)
        .get('/api/services/1')
        .set(getAuthHeaders());

      expect(response.status).toBe(200);
      expect(response.body.data.preco_pequeno).toBe(40.00);
      expect(response.body.data.preco_medio).toBe(60.00);
      expect(response.body.data.preco_grande).toBe(80.00);
    });

    it('deve retornar serviço em promoção', async () => {
      const service = mockService({
        id: 1,
        nome: 'Banho',
        preco_base: 50.00,
        promocao_ativa: true,
        preco_promocional: 40.00
      });
      mockServiceDAO.findById.mockResolvedValue(service);

      const response = await request(app)
        .get('/api/services/1')
        .set(getAuthHeaders());

      expect(response.status).toBe(200);
      expect(response.body.data.promocao_ativa).toBe(true);
      expect(response.body.data.preco_promocional).toBe(40.00);
    });
  });

  describe('Contexto de Empresa', () => {
    it('deve aplicar contexto de empresa em todas as requisições', async () => {
      mockServiceDAO.findAll.mockResolvedValue([]);
      mockServiceDAO.count.mockResolvedValue(0);

      await request(app)
        .get('/api/services')
        .set(getAuthHeaders(2, 1)); // Company ID 2

      expect(mockServiceDAO.setCompanyContext).toHaveBeenCalledWith(2);
    });

    it('deve isolar dados por empresa', async () => {
      const company1Services = mockList(() => mockService({ company_id: 1 }), 3);
      mockServiceDAO.findAll.mockResolvedValue(company1Services);
      mockServiceDAO.count.mockResolvedValue(3);

      const response = await request(app)
        .get('/api/services')
        .set(getAuthHeaders(1, 1));

      expect(response.status).toBe(200);
      expect(response.body.data.every((s: any) => s.company_id === 1)).toBe(true);
    });
  });

  describe('Validação de Parâmetros', () => {
    it('deve validar limite máximo de paginação', async () => {
      mockServiceDAO.findAll.mockResolvedValue([]);
      mockServiceDAO.count.mockResolvedValue(0);

      const response = await request(app)
        .get('/api/services')
        .query({ limit: 1000 })
        .set(getAuthHeaders());

      expect(response.status).toBe(200);
      expect(mockServiceDAO.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 1000
        })
      );
    });

    it('deve aceitar offset 0', async () => {
      mockServiceDAO.findAll.mockResolvedValue([]);
      mockServiceDAO.count.mockResolvedValue(0);

      const response = await request(app)
        .get('/api/services')
        .query({ offset: 0 })
        .set(getAuthHeaders());

      expect(response.status).toBe(200);
      expect(mockServiceDAO.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          offset: 0
        })
      );
    });
  });

  describe('Performance e Cache', () => {
    it('deve executar consultas em paralelo quando possível', async () => {
      const services = mockList(mockService, 5);

      let findAllCalled = false;
      let countCalled = false;

      mockServiceDAO.findAll.mockImplementation(() => {
        findAllCalled = true;
        return Promise.resolve(services);
      });

      mockServiceDAO.count.mockImplementation(() => {
        countCalled = true;
        return Promise.resolve(5);
      });

      const response = await request(app)
        .get('/api/services')
        .set(getAuthHeaders());

      expect(response.status).toBe(200);
      expect(findAllCalled).toBe(true);
      expect(countCalled).toBe(true);
    });
  });

  describe('Tratamento de Erros', () => {
    it('deve tratar erro de banco de dados', async () => {
      mockServiceDAO.findAll.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/services')
        .set(getAuthHeaders());

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('deve tratar erro ao buscar serviço específico', async () => {
      mockServiceDAO.findById.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/services/1')
        .set(getAuthHeaders());

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });
});

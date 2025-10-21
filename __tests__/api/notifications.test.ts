/**
 * Testes para API de Notificações
 * @route /api/notifications
 */

import request from 'supertest';
import express, { Express } from 'express';
import notificationsRouter from '../../src/api/notifications-routes';
import { getAuthHeaders } from '../helpers/auth.helper';
import { mockNotification, mockList, mockPaginatedResponse } from '../helpers/mock.helper';

// Mock dos serviços
jest.mock('../../src/services/NotificationService');
jest.mock('../../src/middleware/apiAuth');

describe('Notifications API Tests', () => {
  let app: Express;
  let mockNotificationService: any;
  let mockNotificationDAO: any;

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

    app.use('/api/notifications', notificationsRouter);

    // Mock do NotificationService
    const { NotificationService } = require('../../src/services/NotificationService');
    mockNotificationService = {
      notificationDAO: {
        findAll: jest.fn(),
        findById: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
      },
      createNotification: jest.fn(),
      getUnreadNotifications: jest.fn(),
      countUnread: jest.fn(),
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
      archiveNotification: jest.fn(),
      cleanOldNotifications: jest.fn()
    };

    mockNotificationDAO = mockNotificationService.notificationDAO;
    NotificationService.getInstance = jest.fn().mockReturnValue(mockNotificationService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/notifications', () => {
    it('deve retornar lista de notificações com paginação', async () => {
      const notifications = mockList(mockNotification, 5);
      mockNotificationDAO.findAll.mockResolvedValue(notifications);
      mockNotificationDAO.count.mockResolvedValue(10);

      const response = await request(app)
        .get('/api/notifications')
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
    });

    it('deve filtrar notificações não lidas', async () => {
      const unreadNotifications = mockList(() => mockNotification({ lida: false }), 3);
      mockNotificationDAO.findAll.mockResolvedValue(unreadNotifications);
      mockNotificationDAO.count.mockResolvedValue(3);

      const response = await request(app)
        .get('/api/notifications')
        .query({ lida: 'false' })
        .set(getAuthHeaders());

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.data.every((n: any) => !n.lida)).toBe(true);
    });

    it('deve filtrar notificações por tipo', async () => {
      const errorNotifications = mockList(() => mockNotification({ tipo: 'error' }), 2);
      mockNotificationDAO.findAll.mockResolvedValue(errorNotifications);
      mockNotificationDAO.count.mockResolvedValue(2);

      const response = await request(app)
        .get('/api/notifications')
        .query({ tipo: 'error' })
        .set(getAuthHeaders());

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.every((n: any) => n.tipo === 'error')).toBe(true);
    });

    it('deve filtrar notificações por nível', async () => {
      const criticalNotifications = mockList(() => mockNotification({ nivel: 'critical' }), 1);
      mockNotificationDAO.findAll.mockResolvedValue(criticalNotifications);
      mockNotificationDAO.count.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/notifications')
        .query({ nivel: 'critical' })
        .set(getAuthHeaders());

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].nivel).toBe('critical');
    });
  });

  describe('GET /api/notifications/unread', () => {
    it('deve retornar apenas notificações não lidas', async () => {
      const unreadNotifications = mockList(() => mockNotification({ lida: false }), 5);
      mockNotificationService.getUnreadNotifications.mockResolvedValue(unreadNotifications);

      const response = await request(app)
        .get('/api/notifications/unread')
        .set(getAuthHeaders());

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(5);
      expect(response.body.count).toBe(5);
      expect(mockNotificationService.getUnreadNotifications).toHaveBeenCalledWith(1, 1);
    });

    it('deve retornar array vazio se não houver notificações não lidas', async () => {
      mockNotificationService.getUnreadNotifications.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/notifications/unread')
        .set(getAuthHeaders());

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(0);
      expect(response.body.count).toBe(0);
    });
  });

  describe('GET /api/notifications/count', () => {
    it('deve retornar contagem de notificações não lidas', async () => {
      mockNotificationService.countUnread.mockResolvedValue(12);

      const response = await request(app)
        .get('/api/notifications/count')
        .set(getAuthHeaders());

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(12);
      expect(mockNotificationService.countUnread).toHaveBeenCalledWith(1, 1);
    });

    it('deve retornar 0 se não houver notificações não lidas', async () => {
      mockNotificationService.countUnread.mockResolvedValue(0);

      const response = await request(app)
        .get('/api/notifications/count')
        .set(getAuthHeaders());

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(0);
    });
  });

  describe('GET /api/notifications/:id', () => {
    it('deve retornar notificação por ID', async () => {
      const notification = mockNotification({ id: 1 });
      mockNotificationDAO.findById.mockResolvedValue(notification);

      const response = await request(app)
        .get('/api/notifications/1')
        .set(getAuthHeaders());

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(notification);
      expect(mockNotificationDAO.findById).toHaveBeenCalledWith(1);
    });

    it('deve retornar 404 se notificação não for encontrada', async () => {
      mockNotificationDAO.findById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/notifications/999')
        .set(getAuthHeaders());

      expect(response.status).toBe(404);
    });

    it('deve retornar 404 se notificação não pertencer à empresa', async () => {
      const notification = mockNotification({ id: 1, company_id: 999 });
      mockNotificationDAO.findById.mockResolvedValue(notification);

      const response = await request(app)
        .get('/api/notifications/1')
        .set(getAuthHeaders());

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/notifications', () => {
    it('deve criar nova notificação com dados válidos', async () => {
      const newNotification = mockNotification({
        tipo: 'success',
        titulo: 'Nova Notificação',
        mensagem: 'Teste de criação'
      });

      mockNotificationService.createNotification.mockResolvedValue(newNotification);

      const response = await request(app)
        .post('/api/notifications')
        .set(getAuthHeaders())
        .send({
          tipo: 'success',
          titulo: 'Nova Notificação',
          mensagem: 'Teste de criação',
          nivel: 'medium'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(newNotification);
      expect(response.body.message).toBe('Notificação criada com sucesso');
    });

    it('deve validar campos obrigatórios', async () => {
      const response = await request(app)
        .post('/api/notifications')
        .set(getAuthHeaders())
        .send({
          tipo: 'info'
          // Faltando titulo e mensagem
        });

      expect(response.status).toBe(400);
    });

    it('deve criar notificação com nível padrão medium', async () => {
      const notification = mockNotification({ nivel: 'medium' });
      mockNotificationService.createNotification.mockResolvedValue(notification);

      const response = await request(app)
        .post('/api/notifications')
        .set(getAuthHeaders())
        .send({
          tipo: 'info',
          titulo: 'Teste',
          mensagem: 'Mensagem teste'
        });

      expect(response.status).toBe(201);
      expect(mockNotificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({ nivel: 'medium' })
      );
    });
  });

  describe('PATCH /api/notifications/:id/read', () => {
    it('deve marcar notificação como lida', async () => {
      const notification = mockNotification({ id: 1, lida: false });
      mockNotificationDAO.findById.mockResolvedValue(notification);
      mockNotificationService.markAsRead.mockResolvedValue(true);

      const response = await request(app)
        .patch('/api/notifications/1/read')
        .set(getAuthHeaders());

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Notificação marcada como lida');
      expect(mockNotificationService.markAsRead).toHaveBeenCalledWith(1, 1);
    });

    it('deve retornar 404 se notificação não existir', async () => {
      mockNotificationDAO.findById.mockResolvedValue(null);

      const response = await request(app)
        .patch('/api/notifications/999/read')
        .set(getAuthHeaders());

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/notifications/mark-all-read', () => {
    it('deve marcar todas as notificações como lidas', async () => {
      mockNotificationService.markAllAsRead.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/notifications/mark-all-read')
        .set(getAuthHeaders());

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Todas as notificações foram marcadas como lidas');
      expect(mockNotificationService.markAllAsRead).toHaveBeenCalledWith(1, 1);
    });
  });

  describe('PATCH /api/notifications/:id/archive', () => {
    it('deve arquivar notificação', async () => {
      const notification = mockNotification({ id: 1 });
      mockNotificationDAO.findById.mockResolvedValue(notification);
      mockNotificationService.archiveNotification.mockResolvedValue(true);

      const response = await request(app)
        .patch('/api/notifications/1/archive')
        .set(getAuthHeaders());

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Notificação arquivada');
    });
  });

  describe('DELETE /api/notifications/:id', () => {
    it('deve deletar notificação', async () => {
      const notification = mockNotification({ id: 1 });
      mockNotificationDAO.findById.mockResolvedValue(notification);
      mockNotificationDAO.delete.mockResolvedValue(true);

      const response = await request(app)
        .delete('/api/notifications/1')
        .set(getAuthHeaders());

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Notificação deletada com sucesso');
    });
  });

  describe('POST /api/notifications/cleanup', () => {
    it('deve limpar notificações antigas', async () => {
      mockNotificationService.cleanOldNotifications.mockResolvedValue(15);

      const response = await request(app)
        .post('/api/notifications/cleanup')
        .set(getAuthHeaders())
        .send({ days: 30 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.deletedCount).toBe(15);
      expect(response.body.message).toContain('15 notificações antigas foram deletadas');
    });

    it('deve usar 30 dias como padrão', async () => {
      mockNotificationService.cleanOldNotifications.mockResolvedValue(5);

      const response = await request(app)
        .post('/api/notifications/cleanup')
        .set(getAuthHeaders())
        .send({});

      expect(response.status).toBe(200);
      expect(mockNotificationService.cleanOldNotifications).toHaveBeenCalledWith(30);
    });
  });
});

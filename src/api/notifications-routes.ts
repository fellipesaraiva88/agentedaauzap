import { Router, Request, Response } from 'express';
import { jwtAuth } from '../middleware/apiAuth';
import { validateRequest, ValidationSchemas } from '../middleware/requestValidator';
import { asyncHandler } from '../middleware/errorHandler';
import { NotificationService } from '../services/NotificationService';
import { ValidationError, NotFoundError } from '../utils/errors';

const router = Router();
const notificationService = NotificationService.getInstance();

/**
 * @route   GET /api/notifications
 * @desc    Listar notificações da empresa (com filtros opcionais)
 * @access  Private (JWT)
 * @query   ?lida=true|false&arquivada=true|false&tipo=info|warning|error|success&nivel=low|medium|high|critical&limit=50&offset=0
 */
router.get(
  '/',
  jwtAuth,
  validateRequest(ValidationSchemas.pagination, 'query'),
  asyncHandler(async (req: any, res: Response) => {
    const companyId = req.companyId;
    const userId = req.userId; // opcional
    const {
      lida,
      arquivada,
      tipo,
      nivel,
      limit = 50,
      offset = 0
    } = req.query;

    // Construir filtros
    const filters: any = { company_id: companyId };

    if (lida !== undefined) filters.lida = lida === 'true';
    if (arquivada !== undefined) filters.arquivada = arquivada === 'true';
    if (tipo) filters.tipo = tipo;
    if (nivel) filters.nivel = nivel;
    if (userId) filters.user_id = userId;

    const notificationDAO = notificationService['notificationDAO'];

    // Buscar notificações
    const [notifications, total] = await Promise.all([
      notificationDAO.findAll({
        where: filters,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        orderBy: 'created_at DESC'
      }),
      notificationDAO.count({ where: filters })
    ]);

    res.json({
      success: true,
      data: notifications,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: offset + notifications.length < total
      }
    });
  })
);

/**
 * @route   GET /api/notifications/unread
 * @desc    Listar apenas notificações não lidas
 * @access  Private (JWT)
 */
router.get(
  '/unread',
  jwtAuth,
  asyncHandler(async (req: any, res: Response) => {
    const companyId = req.companyId;
    const userId = req.userId; // opcional

    const notifications = await notificationService.getUnreadNotifications(companyId, userId);

    res.json({
      success: true,
      data: notifications,
      count: notifications.length
    });
  })
);

/**
 * @route   GET /api/notifications/count
 * @desc    Contar notificações não lidas
 * @access  Private (JWT)
 */
router.get(
  '/count',
  jwtAuth,
  asyncHandler(async (req: any, res: Response) => {
    const companyId = req.companyId;
    const userId = req.userId; // opcional

    const count = await notificationService.countUnread(companyId, userId);

    res.json({
      success: true,
      count
    });
  })
);

/**
 * @route   GET /api/notifications/:id
 * @desc    Buscar notificação por ID
 * @access  Private (JWT)
 */
router.get(
  '/:id',
  jwtAuth,
  asyncHandler(async (req: any, res: Response) => {
    const { id } = req.params;
    const companyId = req.companyId;

    const notificationDAO = notificationService['notificationDAO'];
    const notification = await notificationDAO.findById(parseInt(id));

    if (!notification) {
      throw new NotFoundError('Notificação não encontrada');
    }

    // Verificar se pertence à empresa
    if (notification.company_id !== companyId) {
      throw new NotFoundError('Notificação não encontrada');
    }

    res.json({
      success: true,
      data: notification
    });
  })
);

/**
 * @route   POST /api/notifications
 * @desc    Criar nova notificação
 * @access  Private (JWT)
 */
router.post(
  '/',
  jwtAuth,
  validateRequest({
    tipo: { type: 'string', required: true },
    titulo: { type: 'string', required: true, minLength: 3, maxLength: 200 },
    mensagem: { type: 'string', required: true, minLength: 3, maxLength: 1000 },
    nivel: { type: 'string', required: false, enum: ['low', 'medium', 'high', 'critical'] },
    user_id: { type: 'number', required: false },
    acao_url: { type: 'string', required: false },
    acao_label: { type: 'string', required: false }
  }, 'body'),
  asyncHandler(async (req: any, res: Response) => {
    const companyId = req.companyId;
    const {
      tipo,
      titulo,
      mensagem,
      nivel = 'medium',
      user_id,
      acao_url,
      acao_label
    } = req.body;

    const notification = await notificationService.createNotification({
      company_id: companyId,
      user_id,
      tipo,
      titulo,
      mensagem,
      nivel,
      acao_url,
      acao_label,
      lida: false,
      arquivada: false
    });

    res.status(201).json({
      success: true,
      data: notification,
      message: 'Notificação criada com sucesso'
    });
  })
);

/**
 * @route   PATCH /api/notifications/:id/read
 * @desc    Marcar notificação como lida
 * @access  Private (JWT)
 */
router.patch(
  '/:id/read',
  jwtAuth,
  asyncHandler(async (req: any, res: Response) => {
    const { id } = req.params;
    const companyId = req.companyId;

    const notificationDAO = notificationService['notificationDAO'];
    const notification = await notificationDAO.findById(parseInt(id));

    if (!notification || notification.company_id !== companyId) {
      throw new NotFoundError('Notificação não encontrada');
    }

    await notificationService.markAsRead(parseInt(id), companyId);

    res.json({
      success: true,
      message: 'Notificação marcada como lida'
    });
  })
);

/**
 * @route   PATCH /api/notifications/:id/unread
 * @desc    Marcar notificação como não lida
 * @access  Private (JWT)
 */
router.patch(
  '/:id/unread',
  jwtAuth,
  asyncHandler(async (req: any, res: Response) => {
    const { id } = req.params;
    const companyId = req.companyId;

    const notificationDAO = notificationService['notificationDAO'];
    const notification = await notificationDAO.findById(parseInt(id));

    if (!notification || notification.company_id !== companyId) {
      throw new NotFoundError('Notificação não encontrada');
    }

    await notificationDAO.update(parseInt(id), { lida: false });

    res.json({
      success: true,
      message: 'Notificação marcada como não lida'
    });
  })
);

/**
 * @route   PATCH /api/notifications/:id/archive
 * @desc    Arquivar notificação
 * @access  Private (JWT)
 */
router.patch(
  '/:id/archive',
  jwtAuth,
  asyncHandler(async (req: any, res: Response) => {
    const { id } = req.params;
    const companyId = req.companyId;

    const notificationDAO = notificationService['notificationDAO'];
    const notification = await notificationDAO.findById(parseInt(id));

    if (!notification || notification.company_id !== companyId) {
      throw new NotFoundError('Notificação não encontrada');
    }

    await notificationService.archiveNotification(parseInt(id), companyId);

    res.json({
      success: true,
      message: 'Notificação arquivada'
    });
  })
);

/**
 * @route   POST /api/notifications/mark-all-read
 * @desc    Marcar todas as notificações como lidas
 * @access  Private (JWT)
 */
router.post(
  '/mark-all-read',
  jwtAuth,
  asyncHandler(async (req: any, res: Response) => {
    const companyId = req.companyId;
    const userId = req.userId; // opcional

    await notificationService.markAllAsRead(companyId, userId);

    res.json({
      success: true,
      message: 'Todas as notificações foram marcadas como lidas'
    });
  })
);

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Deletar notificação
 * @access  Private (JWT)
 */
router.delete(
  '/:id',
  jwtAuth,
  asyncHandler(async (req: any, res: Response) => {
    const { id } = req.params;
    const companyId = req.companyId;

    const notificationDAO = notificationService['notificationDAO'];
    const notification = await notificationDAO.findById(parseInt(id));

    if (!notification || notification.company_id !== companyId) {
      throw new NotFoundError('Notificação não encontrada');
    }

    await notificationDAO.delete(parseInt(id));

    res.json({
      success: true,
      message: 'Notificação deletada com sucesso'
    });
  })
);

/**
 * @route   POST /api/notifications/cleanup
 * @desc    Limpar notificações antigas (arquivadas há mais de X dias)
 * @access  Private (JWT)
 */
router.post(
  '/cleanup',
  jwtAuth,
  validateRequest({
    days: { type: 'number', required: false, min: 1, max: 365 }
  }, 'body'),
  asyncHandler(async (req: any, res: Response) => {
    const { days = 30 } = req.body;

    const deletedCount = await notificationService.cleanOldNotifications(days);

    res.json({
      success: true,
      message: `${deletedCount} notificações antigas foram deletadas`,
      deletedCount
    });
  })
);

export default router;

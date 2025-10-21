import { Router } from 'express';
import { sanitizeInput } from '../middleware/requestValidator';
import { errorHandler, notFoundHandler } from '../middleware/errorHandler';
import { apiRateLimiter, createRateLimiter } from '../middleware/rateLimiter';

// Importa rotas
import appointmentsRoutes from './appointments-routes';
import conversationsRoutes from './conversations-routes';
import settingsRoutes from './settings-routes';
import whatsappRoutes from './whatsapp-routes';
import tutorsRoutes from './tutors-routes';
import petsRoutes from './pets-routes';
import companiesRoutes from './companies-routes';
import notificationsRoutes from './notifications-routes';
import statsRoutes from './stats-routes';
import servicesRoutes from './services-routes';

const router = Router();

// Rate limiters específicos para operações sensíveis
const statsRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minuto
  max: 30, // 30 requests por minuto para stats (pesadas)
  message: 'Muitas requisições de estatísticas. Aguarde 1 minuto.'
});

const writeOperationLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 operações de escrita por 15 min
  message: 'Limite de operações de escrita excedido.'
});

/**
 * Middleware global de sanitização
 */
router.use(sanitizeInput);

/**
 * Rate limiting global para APIs
 */
router.use(apiRateLimiter);

/**
 * Health check
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API rodando',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

/**
 * Rotas de API com rate limiting apropriado
 */
router.use('/appointments', writeOperationLimiter, appointmentsRoutes);
router.use('/conversations', conversationsRoutes);
router.use('/settings', writeOperationLimiter, settingsRoutes);
router.use('/whatsapp', whatsappRoutes);
router.use('/tutors', writeOperationLimiter, tutorsRoutes);
router.use('/pets', writeOperationLimiter, petsRoutes);
router.use('/companies', companiesRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/stats', statsRateLimiter, statsRoutes); // Rate limit mais restritivo para stats
router.use('/services', servicesRoutes);

/**
 * Middleware de erro 404
 */
router.use(notFoundHandler);

/**
 * Middleware de tratamento de erros
 */
router.use(errorHandler);

export default router;

import { Router } from 'express';
import { createAuthRoutes } from './auth-routes';
import { createOnboardingRoutes } from './onboarding-routes';
import { createConversationsRoutes } from './conversations-routes';
import { postgresClient } from '../services/PostgreSQLClient';

/**
 * Main API Router
 * Apenas rotas essenciais que funcionam
 */
export function createApiRoutes() {
  const router = Router();
  
  // ✅ Rotas funcionais
  const authRouter = createAuthRoutes(postgresClient.getPool()!);
  const onboardingRouter = createOnboardingRoutes();
  const conversationsRouter = createConversationsRoutes();
  
  // Montar rotas
  router.use('/auth', authRouter);
  router.use('/onboarding', onboardingRouter);
  router.use('/conversations', conversationsRouter);
  
  return router;
}

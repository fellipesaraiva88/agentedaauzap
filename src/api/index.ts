import { Router } from 'express';
import { createAuthRoutes } from './auth-routes';
import { createOnboardingRoutes } from './onboarding-routes';
import { createCompaniesRoutes } from './companies-routes';
import { createConversationsRoutes } from './conversations-routes';
import { createTutorsRoutes } from './tutors-routes';
import { postgresClient } from '../services/PostgreSQLClient';

/**
 * Main API Router
 * Registra todas as rotas da API
 */
export function createApiRoutes() {
  const router = Router();
  
  // ✅ Rotas ativas
  const authRouter = createAuthRoutes(postgresClient.getPool()!);
  const onboardingRouter = createOnboardingRoutes();
  const companiesRouter = createCompaniesRoutes();
  const conversationsRouter = createConversationsRoutes();
  const tutorsRouter = createTutorsRoutes();
  
  // Montar rotas
  router.use('/auth', authRouter);
  router.use('/onboarding', onboardingRouter);
  router.use('/companies', companiesRouter);
  router.use('/conversations', conversationsRouter);
  router.use('/tutors', tutorsRouter);
  
  return router;
}

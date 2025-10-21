import { Router, Request, Response } from 'express';
import { postgresClient } from '../services/PostgreSQLClient';
import { requireAuth } from '../middleware/auth';

const router = Router();

/**
 * GET /api/onboarding/progress
 * Busca o progresso do onboarding do usuário atual
 */
router.get('/progress', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const companyId = (req as any).user?.companyId;

    if (!userId || !companyId) {
      return res.status(400).json({
        error: 'User or company not found'
      });
    }

    // Buscar progresso
    const progress = await postgresClient.getOne<{
      id: number;
      user_id: number;
      company_id: number;
      current_step: number;
      completed: boolean;
      data: any;
      created_at: Date;
      updated_at: Date;
      completed_at: Date | null;
    }>(
      `SELECT * FROM onboarding_progress 
       WHERE user_id = $1 AND company_id = $2`,
      [userId, companyId]
    );

    // Se não existe, criar um novo
    if (!progress) {
      const newProgress = await postgresClient.insert('onboarding_progress', {
        user_id: userId,
        company_id: companyId,
        current_step: 1,
        completed: false,
        data: {}
      });

      return res.json({
        progress: {
          currentStep: newProgress.current_step,
          completed: newProgress.completed,
          data: newProgress.data,
          createdAt: newProgress.created_at,
          updatedAt: newProgress.updated_at
        }
      });
    }

    res.json({
      progress: {
        currentStep: progress.current_step,
        completed: progress.completed,
        data: progress.data,
        createdAt: progress.created_at,
        updatedAt: progress.updated_at,
        completedAt: progress.completed_at
      }
    });

  } catch (error) {
    console.error('Error fetching onboarding progress:', error);
    res.status(500).json({
      error: 'Failed to fetch onboarding progress',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * PUT /api/onboarding/progress
 * Atualiza o progresso do onboarding
 */
router.put('/progress', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const companyId = (req as any).user?.companyId;
    const { currentStep, data } = req.body;

    if (!userId || !companyId) {
      return res.status(400).json({
        error: 'User or company not found'
      });
    }

    // Validar step
    if (currentStep && (currentStep < 1 || currentStep > 9)) {
      return res.status(400).json({
        error: 'Invalid step number',
        message: 'Step must be between 1 and 9'
      });
    }

    // Buscar progresso existente
    const existing = await postgresClient.getOne(
      `SELECT id FROM onboarding_progress 
       WHERE user_id = $1 AND company_id = $2`,
      [userId, companyId]
    );

    let updated;

    if (existing) {
      // Atualizar existente
      const updateData: any = {};
      if (currentStep !== undefined) updateData.current_step = currentStep;
      if (data !== undefined) updateData.data = data;

      updated = await postgresClient.update(
        'onboarding_progress',
        updateData,
        { id: existing.id }
      );
    } else {
      // Criar novo
      updated = await postgresClient.insert('onboarding_progress', {
        user_id: userId,
        company_id: companyId,
        current_step: currentStep || 1,
        data: data || {}
      });
    }

    const result = Array.isArray(updated) ? updated[0] : updated;

    res.json({
      success: true,
      progress: {
        currentStep: result.current_step,
        completed: result.completed,
        data: result.data,
        updatedAt: result.updated_at
      }
    });

  } catch (error) {
    console.error('Error updating onboarding progress:', error);
    res.status(500).json({
      error: 'Failed to update onboarding progress',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/onboarding/complete
 * Marca o onboarding como completo
 */
router.post('/complete', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const companyId = (req as any).user?.companyId;
    const { data } = req.body;

    if (!userId || !companyId) {
      return res.status(400).json({
        error: 'User or company not found'
      });
    }

    // Buscar progresso
    const existing = await postgresClient.getOne<{ id: number }>(
      `SELECT id FROM onboarding_progress 
       WHERE user_id = $1 AND company_id = $2`,
      [userId, companyId]
    );

    if (!existing) {
      return res.status(404).json({
        error: 'Onboarding progress not found'
      });
    }

    // Marcar como completo
    const completed = await postgresClient.update(
      'onboarding_progress',
      {
        completed: true,
        current_step: 9,
        data: data || {},
        completed_at: new Date()
      },
      { id: existing.id }
    );

    const result = Array.isArray(completed) ? completed[0] : completed;

    res.json({
      success: true,
      message: 'Onboarding completed successfully',
      progress: {
        completed: result.completed,
        completedAt: result.completed_at,
        data: result.data
      }
    });

  } catch (error) {
    console.error('Error completing onboarding:', error);
    res.status(500).json({
      error: 'Failed to complete onboarding',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * DELETE /api/onboarding/progress
 * Reseta o progresso do onboarding (admin only)
 */
router.delete('/progress', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const companyId = (req as any).user?.companyId;

    if (!userId || !companyId) {
      return res.status(400).json({
        error: 'User or company not found'
      });
    }

    // Deletar progresso
    await postgresClient.delete('onboarding_progress', {
      user_id: userId,
      company_id: companyId
    });

    res.json({
      success: true,
      message: 'Onboarding progress reset successfully'
    });

  } catch (error) {
    console.error('Error resetting onboarding progress:', error);
    res.status(500).json({
      error: 'Failed to reset onboarding progress',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export const createOnboardingRoutes = () => router;

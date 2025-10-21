import { Router } from 'express';
import { TutorService } from '../services/domain/TutorService';
import { PetService } from '../services/domain/PetService';
import { asyncHandler } from '../middleware/errorHandler';
import { jwtAuth, requireRole } from '../middleware/apiAuth';
import { validateRequest, ValidationSchemas, validatePagination } from '../middleware/requestValidator';
import { NotFoundError } from '../utils/errors';

const router = Router();
const tutorService = TutorService.getInstance();
const petService = PetService.getInstance();

/**
 * GET /api/tutors
 * Lista tutores
 */
router.get(
  '/',
  jwtAuth,
  validatePagination,
  asyncHandler(async (req: any, res) => {
    const { companyId } = req;
    const { page, limit, offset } = req.pagination;

    const tutors = await tutorService.tutorDAO
      .setCompanyContext(companyId)
      .findAll({ limit, offset });

    const total = await tutorService.tutorDAO
      .setCompanyContext(companyId)
      .count();

    res.json({
      success: true,
      data: tutors,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  })
);

/**
 * GET /api/tutors/vip
 * Lista tutores VIP
 */
router.get(
  '/vip',
  jwtAuth,
  asyncHandler(async (req: any, res) => {
    const tutors = await tutorService.listVipClients(req.companyId);

    res.json({
      success: true,
      data: tutors
    });
  })
);

/**
 * GET /api/tutors/inactive
 * Lista clientes inativos
 */
router.get(
  '/inactive',
  jwtAuth,
  asyncHandler(async (req: any, res) => {
    const days = parseInt(req.query.days as string) || 30;
    const tutors = await tutorService.listInactiveClients(req.companyId, days);

    res.json({
      success: true,
      data: tutors,
      meta: { days }
    });
  })
);

/**
 * GET /api/tutors/birthdays
 * Lista aniversariantes
 */
router.get(
  '/birthdays',
  jwtAuth,
  asyncHandler(async (req: any, res) => {
    const month = req.query.month ? parseInt(req.query.month as string) : undefined;
    const tutors = await tutorService.listBirthdayClients(req.companyId, month);

    res.json({
      success: true,
      data: tutors
    });
  })
);

/**
 * GET /api/tutors/top
 * Lista top clientes
 */
router.get(
  '/top',
  jwtAuth,
  asyncHandler(async (req: any, res) => {
    const limit = parseInt(req.query.limit as string) || 10;
    const tutors = await tutorService.listTopClients(req.companyId, limit);

    res.json({
      success: true,
      data: tutors
    });
  })
);

/**
 * GET /api/tutors/:id
 * Busca tutor por ID
 */
router.get(
  '/:id',
  jwtAuth,
  asyncHandler(async (req: any, res) => {
    const tutor = await tutorService.getTutorWithDetails(
      req.params.id,
      req.companyId
    );

    if (!tutor) {
      throw new NotFoundError('Tutor');
    }

    res.json({
      success: true,
      data: tutor
    });
  })
);

/**
 * POST /api/tutors
 * Cria novo tutor
 */
router.post(
  '/',
  jwtAuth,
  validateRequest(ValidationSchemas.createTutor),
  asyncHandler(async (req: any, res) => {
    const tutor = await tutorService.createTutor({
      ...req.body,
      company_id: req.companyId
    });

    res.status(201).json({
      success: true,
      data: tutor
    });
  })
);

/**
 * PATCH /api/tutors/:id
 * Atualiza tutor
 */
router.patch(
  '/:id',
  jwtAuth,
  validateRequest(ValidationSchemas.updateTutor),
  asyncHandler(async (req: any, res) => {
    const tutor = await tutorService.updateTutor(
      req.params.id,
      req.companyId,
      req.body
    );

    res.json({
      success: true,
      data: tutor
    });
  })
);

/**
 * POST /api/tutors/:id/vip
 * Marca como VIP
 */
router.post(
  '/:id/vip',
  jwtAuth,
  requireRole('admin', 'manager'),
  asyncHandler(async (req: any, res) => {
    const tutor = await tutorService.promoteToVip(req.params.id, req.companyId);

    res.json({
      success: true,
      data: tutor,
      message: 'Cliente promovido a VIP'
    });
  })
);

/**
 * POST /api/tutors/:id/deactivate
 * Desativa tutor
 */
router.post(
  '/:id/deactivate',
  jwtAuth,
  requireRole('admin', 'manager'),
  asyncHandler(async (req: any, res) => {
    const tutor = await tutorService.deactivate(req.params.id, req.companyId);

    res.json({
      success: true,
      data: tutor,
      message: 'Cliente desativado'
    });
  })
);

/**
 * POST /api/tutors/:id/reactivate
 * Reativa tutor
 */
router.post(
  '/:id/reactivate',
  jwtAuth,
  requireRole('admin', 'manager'),
  asyncHandler(async (req: any, res) => {
    const tutor = await tutorService.reactivate(req.params.id, req.companyId);

    res.json({
      success: true,
      data: tutor,
      message: 'Cliente reativado'
    });
  })
);

/**
 * POST /api/tutors/:id/tags
 * Adiciona tag
 */
router.post(
  '/:id/tags',
  jwtAuth,
  asyncHandler(async (req: any, res) => {
    const { tag } = req.body;

    if (!tag) {
      throw new Error('Tag é obrigatória');
    }

    await tutorService.addTag(req.params.id, req.companyId, tag);

    res.json({
      success: true,
      message: 'Tag adicionada'
    });
  })
);

/**
 * DELETE /api/tutors/:id/tags/:tag
 * Remove tag
 */
router.delete(
  '/:id/tags/:tag',
  jwtAuth,
  asyncHandler(async (req: any, res) => {
    await tutorService.removeTag(
      req.params.id,
      req.companyId,
      req.params.tag
    );

    res.json({
      success: true,
      message: 'Tag removida'
    });
  })
);

/**
 * GET /api/tutors/:id/export
 * Exporta dados do tutor (LGPD)
 */
router.get(
  '/:id/export',
  jwtAuth,
  asyncHandler(async (req: any, res) => {
    const data = await tutorService.exportTutorData(
      req.params.id,
      req.companyId
    );

    res.json({
      success: true,
      data
    });
  })
);

/**
 * DELETE /api/tutors/:id
 * Deleta dados do tutor (LGPD)
 */
router.delete(
  '/:id',
  jwtAuth,
  requireRole('admin'),
  asyncHandler(async (req: any, res) => {
    await tutorService.deleteTutorData(req.params.id, req.companyId);

    res.json({
      success: true,
      message: 'Dados do tutor removidos conforme LGPD'
    });
  })
);

/**
 * GET /api/tutors/:id/pets
 * Lista pets do tutor
 */
router.get(
  '/:id/pets',
  jwtAuth,
  asyncHandler(async (req: any, res) => {
    const pets = await petService.listPetsByTutor(
      req.params.id,
      req.companyId
    );

    res.json({
      success: true,
      data: pets
    });
  })
);

export default router;

import { Router } from 'express';
import { PetService } from '../services/domain/PetService';
import { asyncHandler } from '../middleware/errorHandler';
import { jwtAuth } from '../middleware/apiAuth';
import { validateRequest, ValidationSchemas } from '../middleware/requestValidator';
import { NotFoundError } from '../utils/errors';

const router = Router();
const petService = PetService.getInstance();

/**
 * GET /api/pets
 * Lista todos os pets
 */
router.get(
  '/',
  jwtAuth,
  asyncHandler(async (req: any, res) => {
    const pets = await petService.petDAO
      .setCompanyContext(req.companyId)
      .findAll({ where: { is_active: true } });

    res.json({
      success: true,
      data: pets
    });
  })
);

/**
 * GET /api/pets/needing-bath
 * Lista pets que precisam de banho
 */
router.get(
  '/needing-bath',
  jwtAuth,
  asyncHandler(async (req: any, res) => {
    const pets = await petService.listPetsNeedingBath(req.companyId);

    res.json({
      success: true,
      data: pets
    });
  })
);

/**
 * GET /api/pets/needing-vaccination
 * Lista pets que precisam de vacinação
 */
router.get(
  '/needing-vaccination',
  jwtAuth,
  asyncHandler(async (req: any, res) => {
    const days = parseInt(req.query.days as string) || 30;
    const pets = await petService.listPetsNeedingVaccination(req.companyId, days);

    res.json({
      success: true,
      data: pets,
      meta: { days }
    });
  })
);

/**
 * GET /api/pets/birthdays
 * Lista pets aniversariantes
 */
router.get(
  '/birthdays',
  jwtAuth,
  asyncHandler(async (req: any, res) => {
    const month = req.query.month ? parseInt(req.query.month as string) : undefined;
    const pets = await petService.listBirthdayPets(req.companyId, month);

    res.json({
      success: true,
      data: pets
    });
  })
);

/**
 * GET /api/pets/stats
 * Estatísticas de pets
 */
router.get(
  '/stats',
  jwtAuth,
  asyncHandler(async (req: any, res) => {
    const stats = await petService.getPetStats(req.companyId);

    res.json({
      success: true,
      data: stats
    });
  })
);

/**
 * GET /api/pets/:id
 * Busca pet por ID
 */
router.get(
  '/:id',
  jwtAuth,
  asyncHandler(async (req: any, res) => {
    const id = parseInt(req.params.id);
    const pet = await petService.getPetWithHistory(id, req.companyId);

    if (!pet) {
      throw new NotFoundError('Pet');
    }

    // Adiciona recomendações de cuidados
    const recommendations = petService.getCareRecommendations(pet);

    res.json({
      success: true,
      data: {
        ...pet,
        care_recommendations: recommendations
      }
    });
  })
);

/**
 * POST /api/pets
 * Cria novo pet
 */
router.post(
  '/',
  jwtAuth,
  validateRequest(ValidationSchemas.createPet),
  asyncHandler(async (req: any, res) => {
    const pet = await petService.createPet({
      ...req.body,
      company_id: req.companyId
    });

    res.status(201).json({
      success: true,
      data: pet
    });
  })
);

/**
 * PATCH /api/pets/:id
 * Atualiza pet
 */
router.patch(
  '/:id',
  jwtAuth,
  asyncHandler(async (req: any, res) => {
    const id = parseInt(req.params.id);
    const pet = await petService.updatePet(id, req.companyId, req.body);

    res.json({
      success: true,
      data: pet
    });
  })
);

/**
 * POST /api/pets/:id/deactivate
 * Desativa pet
 */
router.post(
  '/:id/deactivate',
  jwtAuth,
  asyncHandler(async (req: any, res) => {
    const id = parseInt(req.params.id);
    const pet = await petService.deactivatePet(id, req.companyId);

    res.json({
      success: true,
      data: pet,
      message: 'Pet desativado'
    });
  })
);

/**
 * POST /api/pets/:id/reactivate
 * Reativa pet
 */
router.post(
  '/:id/reactivate',
  jwtAuth,
  asyncHandler(async (req: any, res) => {
    const id = parseInt(req.params.id);
    const pet = await petService.reactivatePet(id, req.companyId);

    res.json({
      success: true,
      data: pet,
      message: 'Pet reativado'
    });
  })
);

/**
 * POST /api/pets/:id/vaccines
 * Adiciona vacina
 */
router.post(
  '/:id/vaccines',
  jwtAuth,
  asyncHandler(async (req: any, res) => {
    const id = parseInt(req.params.id);
    const { nome, data, proxima_dose } = req.body;

    if (!nome || !data) {
      throw new Error('Nome e data da vacina são obrigatórios');
    }

    await petService.addVaccine(id, req.companyId, {
      nome,
      data: new Date(data),
      proxima_dose: proxima_dose ? new Date(proxima_dose) : undefined
    });

    res.json({
      success: true,
      message: 'Vacina adicionada'
    });
  })
);

/**
 * POST /api/pets/:id/schedule-bath
 * Agenda próximo banho
 */
router.post(
  '/:id/schedule-bath',
  jwtAuth,
  asyncHandler(async (req: any, res) => {
    const id = parseInt(req.params.id);
    const { date } = req.body;

    if (!date) {
      throw new Error('Data é obrigatória');
    }

    const pet = await petService.scheduleNextBath(
      id,
      req.companyId,
      new Date(date)
    );

    res.json({
      success: true,
      data: pet,
      message: 'Próximo banho agendado'
    });
  })
);

export default router;

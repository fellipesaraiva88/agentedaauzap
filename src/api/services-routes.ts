import { Router, Request, Response } from 'express';
import { jwtAuth } from '../middleware/apiAuth';
import { validateRequest } from '../middleware/requestValidator';
import { asyncHandler } from '../middleware/errorHandler';
import { ServiceDAO } from '../dao/ServiceDAO';
import { ValidationError, NotFoundError } from '../utils/errors';

const router = Router();
const serviceDAO = new ServiceDAO();

/**
 * GET /api/services - Listar serviços
 */
router.get(
  '/',
  jwtAuth,
  asyncHandler(async (req: any, res: Response) => {
    const companyId = req.companyId;
    const { ativo, categoria, popular, limit = 100, offset = 0 } = req.query;

    const filters: any = { company_id: companyId };
    if (ativo !== undefined) filters.ativo = ativo === 'true';
    if (categoria) filters.categoria = categoria;
    if (popular !== undefined) filters.popular = popular === 'true';

    const [services, total] = await Promise.all([
      serviceDAO.setCompanyContext(companyId).findAll({
        where: filters,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        orderBy: 'ordem ASC, nome ASC'
      }),
      serviceDAO.setCompanyContext(companyId).count({ where: filters })
    ]);

    res.json({
      success: true,
      data: services,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: offset + services.length < total
      }
    });
  })
);

/**
 * GET /api/services/:id - Buscar serviço por ID
 */
router.get(
  '/:id',
  jwtAuth,
  asyncHandler(async (req: any, res: Response) => {
    const { id } = req.params;
    const companyId = req.companyId;

    const service = await serviceDAO.setCompanyContext(companyId).findById(parseInt(id));

    if (!service) {
      throw new NotFoundError('Serviço não encontrado');
    }

    res.json({
      success: true,
      data: service
    });
  })
);

export default router;

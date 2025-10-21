import { Router } from 'express';
import { CompanyService } from '../services/domain/CompanyService';
import { asyncHandler } from '../middleware/errorHandler';
import { jwtAuth, requireRole } from '../middleware/apiAuth';
import { validateRequest, ValidationSchemas } from '../middleware/requestValidator';
import { NotFoundError } from '../utils/errors';

const router = Router();
const companyService = CompanyService.getInstance();

/**
 * GET /api/companies
 * Retorna a empresa do usuário autenticado (ou lista todas se admin)
 */
router.get(
  '/',
  jwtAuth,
  asyncHandler(async (req: any, res) => {
    // Se for admin, retorna todas as empresas
    if (req.user?.role === 'admin') {
      const companies = await companyService.listActiveCompanies();
      return res.json({
        success: true,
        data: companies
      });
    }

    // Para usuários normais, retorna apenas a empresa dele
    const company = await companyService.getCompanyById(req.companyId);

    if (!company) {
      return res.json({
        success: true,
        data: []
      });
    }

    res.json({
      success: true,
      data: [company]
    });
  })
);

/**
 * GET /api/companies/me
 * Busca empresa atual
 */
router.get(
  '/me',
  jwtAuth,
  asyncHandler(async (req: any, res) => {
    const company = await companyService.getCompanyById(req.companyId);

    if (!company) {
      throw new NotFoundError('Empresa');
    }

    res.json({
      success: true,
      data: company
    });
  })
);

/**
 * GET /api/companies/me/stats
 * Estatísticas da empresa
 */
router.get(
  '/me/stats',
  jwtAuth,
  asyncHandler(async (req: any, res) => {
    const stats = await companyService.getCompanyStats(req.companyId);

    res.json({
      success: true,
      data: stats
    });
  })
);

/**
 * GET /api/companies/:slug
 * Busca empresa por slug (público)
 */
router.get(
  '/slug/:slug',
  asyncHandler(async (req, res) => {
    const company = await companyService.getCompanyBySlug(req.params.slug);

    if (!company) {
      throw new NotFoundError('Empresa');
    }

    // Remove dados sensíveis
    const publicData = {
      id: company.id,
      nome: company.nome,
      slug: company.slug,
      whatsapp: company.whatsapp,
      email: company.email,
      endereco_completo: company.endereco_completo,
      logo_url: company.logo_url,
      horario_funcionamento: company.horario_funcionamento,
      agente_nome: company.agente_nome
    };

    res.json({
      success: true,
      data: publicData
    });
  })
);

/**
 * POST /api/companies
 * Cria nova empresa (apenas super admin)
 */
router.post(
  '/',
  jwtAuth,
  requireRole('admin'),
  validateRequest(ValidationSchemas.createCompany),
  asyncHandler(async (req, res) => {
    const company = await companyService.createCompany(req.body);

    res.status(201).json({
      success: true,
      data: company
    });
  })
);

/**
 * PATCH /api/companies/me
 * Atualiza empresa atual
 */
router.patch(
  '/me',
  jwtAuth,
  requireRole('admin', 'manager'),
  asyncHandler(async (req: any, res) => {
    const company = await companyService.updateCompany(
      req.companyId,
      req.body
    );

    res.json({
      success: true,
      data: company
    });
  })
);

/**
 * POST /api/companies/me/api-key/generate
 * Gera nova API key
 */
router.post(
  '/me/api-key/generate',
  jwtAuth,
  requireRole('admin'),
  asyncHandler(async (req: any, res) => {
    const apiKey = await companyService.generateApiKey(req.companyId);

    res.json({
      success: true,
      data: { api_key: apiKey },
      message: 'Nova API key gerada. Guarde em local seguro!'
    });
  })
);

/**
 * DELETE /api/companies/me/api-key
 * Revoga API key
 */
router.delete(
  '/me/api-key',
  jwtAuth,
  requireRole('admin'),
  asyncHandler(async (req: any, res) => {
    await companyService.revokeApiKey(req.companyId);

    res.json({
      success: true,
      message: 'API key revogada'
    });
  })
);

/**
 * PATCH /api/companies/me/business-hours
 * Atualiza horário de funcionamento
 */
router.patch(
  '/me/business-hours',
  jwtAuth,
  requireRole('admin', 'manager'),
  asyncHandler(async (req: any, res) => {
    const company = await companyService.updateBusinessHours(
      req.companyId,
      req.body
    );

    res.json({
      success: true,
      data: company,
      message: 'Horário de funcionamento atualizado'
    });
  })
);

/**
 * PATCH /api/companies/me/booking-settings
 * Atualiza configurações de agendamento
 */
router.patch(
  '/me/booking-settings',
  jwtAuth,
  requireRole('admin', 'manager'),
  asyncHandler(async (req: any, res) => {
    const company = await companyService.updateBookingSettings(
      req.companyId,
      req.body
    );

    res.json({
      success: true,
      data: company,
      message: 'Configurações de agendamento atualizadas'
    });
  })
);

/**
 * PATCH /api/companies/me/messages
 * Atualiza mensagens padrão
 */
router.patch(
  '/me/messages',
  jwtAuth,
  requireRole('admin', 'manager'),
  asyncHandler(async (req: any, res) => {
    const company = await companyService.updateDefaultMessages(
      req.companyId,
      req.body
    );

    res.json({
      success: true,
      data: company,
      message: 'Mensagens padrão atualizadas'
    });
  })
);

/**
 * POST /api/companies/me/upgrade
 * Atualiza plano
 */
router.post(
  '/me/upgrade',
  jwtAuth,
  requireRole('admin'),
  asyncHandler(async (req: any, res) => {
    const { plan } = req.body;

    if (!['basic', 'premium', 'enterprise'].includes(plan)) {
      throw new Error('Plano inválido');
    }

    const company = await companyService.upgradePlan(req.companyId, plan);

    res.json({
      success: true,
      data: company,
      message: `Plano atualizado para ${plan}`
    });
  })
);

/**
 * POST /api/companies/me/deactivate
 * Desativa empresa
 */
router.post(
  '/me/deactivate',
  jwtAuth,
  requireRole('admin'),
  asyncHandler(async (req: any, res) => {
    const company = await companyService.toggleCompanyStatus(
      req.companyId,
      false
    );

    res.json({
      success: true,
      data: company,
      message: 'Empresa desativada'
    });
  })
);

/**
 * POST /api/companies/me/activate
 * Ativa empresa
 */
router.post(
  '/me/activate',
  jwtAuth,
  requireRole('admin'),
  asyncHandler(async (req: any, res) => {
    const company = await companyService.toggleCompanyStatus(
      req.companyId,
      true
    );

    res.json({
      success: true,
      data: company,
      message: 'Empresa ativada'
    });
  })
);

export default router;

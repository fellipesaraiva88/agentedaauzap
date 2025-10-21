import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ProductDAO } from '../dao/ProductDAO';

const router = Router();

/**
 * GET /api/products
 * Lista todos os produtos da empresa
 */
router.get('/', asyncHandler(async (req, res) => {
  const companyId = parseInt(req.query.companyId as string);

  if (!companyId) {
    return res.status(400).json({
      success: false,
      error: 'Company ID é obrigatório'
    });
  }

  const products = await ProductDAO.findByCompany(companyId);

  res.json({
    success: true,
    data: products
  });
}));

/**
 * GET /api/products/:id
 * Busca um produto específico
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const companyId = parseInt(req.query.companyId as string);

  if (!companyId) {
    return res.status(400).json({
      success: false,
      error: 'Company ID é obrigatório'
    });
  }

  const product = await ProductDAO.findById(id);

  if (!product || product.company_id !== companyId) {
    return res.status(404).json({
      success: false,
      error: 'Produto não encontrado'
    });
  }

  res.json({
    success: true,
    data: product
  });
}));

/**
 * POST /api/products
 * Cria um novo produto
 */
router.post('/', asyncHandler(async (req, res) => {
  const companyId = parseInt(req.query.companyId as string);

  if (!companyId) {
    return res.status(400).json({
      success: false,
      error: 'Company ID é obrigatório'
    });
  }

  const productData = {
    ...req.body,
    company_id: companyId
  };

  const product = await ProductDAO.create(productData);

  res.status(201).json({
    success: true,
    data: product,
    message: 'Produto criado com sucesso'
  });
}));

/**
 * PATCH /api/products/:id
 * Atualiza um produto existente
 */
router.patch('/:id', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const companyId = parseInt(req.query.companyId as string);

  if (!companyId) {
    return res.status(400).json({
      success: false,
      error: 'Company ID é obrigatório'
    });
  }

  // Verificar se o produto pertence à empresa
  const existingProduct = await ProductDAO.findById(id);
  if (!existingProduct || existingProduct.company_id !== companyId) {
    return res.status(404).json({
      success: false,
      error: 'Produto não encontrado'
    });
  }

  const product = await ProductDAO.update(id, req.body);

  res.json({
    success: true,
    data: product,
    message: 'Produto atualizado com sucesso'
  });
}));

/**
 * DELETE /api/products/:id
 * Remove um produto
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const companyId = parseInt(req.query.companyId as string);

  if (!companyId) {
    return res.status(400).json({
      success: false,
      error: 'Company ID é obrigatório'
    });
  }

  // Verificar se o produto pertence à empresa
  const existingProduct = await ProductDAO.findById(id);
  if (!existingProduct || existingProduct.company_id !== companyId) {
    return res.status(404).json({
      success: false,
      error: 'Produto não encontrado'
    });
  }

  await ProductDAO.delete(id);

  res.json({
    success: true,
    message: 'Produto excluído com sucesso'
  });
}));

/**
 * GET /api/products/low-stock
 * Lista produtos com estoque baixo
 */
router.get('/reports/low-stock', asyncHandler(async (req, res) => {
  const companyId = parseInt(req.query.companyId as string);

  if (!companyId) {
    return res.status(400).json({
      success: false,
      error: 'Company ID é obrigatório'
    });
  }

  const products = await ProductDAO.findLowStock(companyId);

  res.json({
    success: true,
    data: products
  });
}));

export default router;

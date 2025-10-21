import { Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';

/**
 * 🏢 TENANT CONTEXT MIDDLEWARE
 *
 * Extrai o company_id do request e configura o contexto do tenant
 * para garantir isolamento de dados através de Row Level Security (RLS)
 *
 * Ordem de precedência para obter company_id:
 * 1. req.user.companyId (extraído do JWT pelo auth middleware)
 * 2. Header X-Company-ID
 * 3. Query param companyId
 * 4. Fallback para company_id = 1 (apenas em desenvolvimento)
 */

export interface TenantRequest extends Request {
  companyId?: number;
  user?: {
    id: number;
    email: string;
    companyId: number;
    role: string;
  };
}

/**
 * Cache de validação de empresas (TTL 5min)
 */
const companyCache = new Map<number, { valid: boolean; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

/**
 * Valida se a empresa existe e está ativa
 */
async function validateCompany(db: Pool, companyId: number): Promise<boolean> {
  // Verificar cache primeiro
  const cached = companyCache.get(companyId);
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    return cached.valid;
  }

  try {
    const result = await db.query(
      'SELECT id FROM companies WHERE id = $1 AND ativo = TRUE',
      [companyId]
    );

    const isValid = result.rows.length > 0;

    // Atualizar cache
    companyCache.set(companyId, {
      valid: isValid,
      timestamp: Date.now()
    });

    return isValid;
  } catch (error) {
    console.error('❌ Error validating company:', error);
    return false;
  }
}

/**
 * Limpa cache de validação de empresa (útil após updates)
 */
export function clearCompanyCache(companyId?: number): void {
  if (companyId) {
    companyCache.delete(companyId);
  } else {
    companyCache.clear();
  }
}

/**
 * Middleware para extrair e configurar contexto do tenant
 */
export function tenantContextMiddleware(db: Pool) {
  return async (req: TenantRequest, res: Response, next: NextFunction) => {
    try {
      let companyId: number | null = null;

      // 1. Tentar extrair do JWT (se usuário está autenticado)
      if (req.user?.companyId) {
        companyId = req.user.companyId;
      }

      // 2. Tentar extrair do header X-Company-ID
      if (!companyId && req.headers['x-company-id']) {
        const headerCompanyId = Number(req.headers['x-company-id']);
        if (!isNaN(headerCompanyId) && headerCompanyId > 0) {
          companyId = headerCompanyId;
        }
      }

      // 3. Tentar extrair do query param companyId
      if (!companyId && req.query.companyId) {
        const queryCompanyId = Number(req.query.companyId);
        if (!isNaN(queryCompanyId) && queryCompanyId > 0) {
          companyId = queryCompanyId;
        }
      }

      // 4. Fallback para company_id = 1 apenas em desenvolvimento
      if (!companyId) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️  No company_id found, using default (1) - DEVELOPMENT ONLY');
          companyId = 1;
        } else {
          return res.status(400).json({
            error: 'Missing company context',
            message: 'Company ID is required. Provide via JWT, X-Company-ID header, or companyId query param.'
          });
        }
      }

      // Validar se a empresa existe e está ativa
      const isValid = await validateCompany(db, companyId);
      if (!isValid) {
        return res.status(404).json({
          error: 'Invalid company',
          message: `Company ${companyId} not found or inactive`
        });
      }

      // Anexar companyId ao request para uso posterior
      req.companyId = companyId;

      // Configurar tenant context no PostgreSQL para RLS
      // IMPORTANTE: Isso precisa ser feito em CADA query/transação
      // pois o PostgreSQL não mantém configurações entre queries do pool
      await db.query('SELECT set_current_company($1)', [companyId]);

      // Log para debug (remover em produção ou usar logger apropriado)
      if (process.env.NODE_ENV === 'development') {
        console.log(`🏢 Tenant context set: company_id = ${companyId}`);
      }

      next();
    } catch (error) {
      console.error('❌ Error in tenant context middleware:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to set tenant context'
      });
    }
  };
}

/**
 * Middleware para rotas que NÃO precisam de tenant context
 * (ex: health checks, webhooks externos, etc)
 */
export function noTenantRequired() {
  return (req: TenantRequest, res: Response, next: NextFunction) => {
    // Apenas marca que tenant não é necessário
    req.companyId = undefined;
    next();
  };
}

/**
 * Middleware para validar que o usuário pertence ao tenant atual
 * Deve ser usado DEPOIS do auth middleware
 */
export function validateTenantOwnership() {
  return (req: TenantRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    if (!req.companyId) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Company context not set'
      });
    }

    // Verificar se o usuário pertence ao tenant atual
    if (req.user.companyId !== req.companyId) {
      // Apenas super_admin pode acessar outros tenants
      if (req.user.role !== 'super_admin') {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You do not have access to this company'
        });
      }
    }

    next();
  };
}

/**
 * Helper para executar query com tenant context garantido
 * Útil para usar em services
 */
export async function executeWithTenantContext<T>(
  db: Pool,
  companyId: number,
  callback: () => Promise<T>
): Promise<T> {
  // Setar contexto do tenant
  await db.query('SELECT set_current_company($1)', [companyId]);

  // Executar callback
  return await callback();
}

/**
 * Helper para executar transação com tenant context
 */
export async function transactionWithTenantContext<T>(
  db: Pool,
  companyId: number,
  callback: (client: any) => Promise<T>
): Promise<T> {
  const client = await db.connect();

  try {
    await client.query('BEGIN');

    // Setar contexto do tenant na transação
    await client.query('SELECT set_current_company($1)', [companyId]);

    // Executar callback
    const result = await callback(client);

    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

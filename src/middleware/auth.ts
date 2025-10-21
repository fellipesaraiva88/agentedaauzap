import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, extractTokenFromHeader, JWTPayload } from '../utils/jwt';
import { Pool } from 'pg';

/**
 * 🔐 AUTHENTICATION MIDDLEWARE
 *
 * Valida JWT tokens e anexa informações do usuário ao request
 */

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    companyId: number;
    role: string;
  };
  companyId?: number;
}

/**
 * Middleware de autenticação obrigatória
 * Valida JWT e anexa user ao request
 */
export function requireAuth() {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      // Extrair token do header Authorization
      const token = extractTokenFromHeader(req.headers.authorization);

      if (!token) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'No authentication token provided. Include Bearer token in Authorization header.'
        });
      }

      // Validar token
      const validation = verifyAccessToken(token);

      if (!validation.valid || !validation.payload) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: validation.error || 'Invalid authentication token'
        });
      }

      // Anexar informações do usuário ao request
      req.user = {
        id: validation.payload.userId,
        email: validation.payload.email,
        companyId: validation.payload.companyId,
        role: validation.payload.role
      };

      // Anexar companyId ao request (compatibilidade com tenant middleware)
      req.companyId = validation.payload.companyId;

      next();
    } catch (error) {
      console.error('❌ Error in auth middleware:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Authentication failed'
      });
    }
  };
}

/**
 * Middleware de autenticação opcional
 * Valida JWT se presente, mas não bloqueia se ausente
 */
export function optionalAuth() {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      // Extrair token do header Authorization
      const token = extractTokenFromHeader(req.headers.authorization);

      if (!token) {
        // Sem token - continuar sem autenticação
        return next();
      }

      // Validar token
      const validation = verifyAccessToken(token);

      if (validation.valid && validation.payload) {
        // Token válido - anexar informações do usuário
        req.user = {
          id: validation.payload.userId,
          email: validation.payload.email,
          companyId: validation.payload.companyId,
          role: validation.payload.role
        };

        req.companyId = validation.payload.companyId;
      }

      // Continuar mesmo se token inválido
      next();
    } catch (error) {
      console.error('⚠️ Error in optional auth middleware:', error);
      // Continuar mesmo em caso de erro
      next();
    }
  };
}

/**
 * Middleware para verificar se usuário ainda existe e está ativo
 * Deve ser usado DEPOIS do requireAuth()
 */
export function validateUserExists(db: Pool) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required'
        });
      }

      // Verificar se usuário ainda existe no banco
      const result = await db.query(
        'SELECT id, email, company_id, role FROM users WHERE id = $1',
        [req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'User no longer exists'
        });
      }

      const dbUser = result.rows[0];

      // Atualizar informações do usuário com dados mais recentes do banco
      req.user = {
        id: dbUser.id,
        email: dbUser.email,
        companyId: dbUser.company_id,
        role: dbUser.role
      };

      req.companyId = dbUser.company_id;

      next();
    } catch (error) {
      console.error('❌ Error validating user exists:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: 'User validation failed'
      });
    }
  };
}

/**
 * Middleware para validar papel (role) do usuário
 * Deve ser usado DEPOIS do requireAuth()
 *
 * @param allowedRoles - Array de roles permitidas
 */
export function requireRole(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
}

/**
 * Middleware para verificar se usuário é super_admin
 * Atalho para requireRole(['super_admin'])
 */
export function requireSuperAdmin() {
  return requireRole(['super_admin']);
}

/**
 * Middleware para verificar se usuário é owner ou manager
 * Útil para operações administrativas da empresa
 */
export function requireAdmin() {
  return requireRole(['super_admin', 'owner', 'manager']);
}

/**
 * Middleware para verificar se usuário pertence à empresa especificada
 * Deve ser usado DEPOIS do requireAuth()
 *
 * @param getCompanyId - Função que extrai company_id do request (params, body, etc)
 */
export function requireCompanyOwnership(getCompanyId: (req: Request) => number) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    const targetCompanyId = getCompanyId(req);

    // Super admin pode acessar qualquer empresa
    if (req.user.role === 'super_admin') {
      return next();
    }

    // Verificar se o usuário pertence à empresa
    if (req.user.companyId !== targetCompanyId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have access to this company'
      });
    }

    next();
  };
}

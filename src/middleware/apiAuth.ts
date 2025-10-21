import { Request, Response, NextFunction } from 'express';
import { CompanyService } from '../services/domain/CompanyService';
import { AuthenticationError, AuthorizationError } from '../utils/errors';
import { verifyToken } from '../utils/jwt';

/**
 * Interface para requisição autenticada
 */
export interface AuthRequest extends Request {
  company?: any;
  user?: any;
  companyId?: number;
  userId?: number;
}

/**
 * Middleware de autenticação via API Key
 */
export async function apiKeyAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Busca API key do header
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      throw new AuthenticationError('API Key não fornecida');
    }

    // Valida API key
    const companyService = CompanyService.getInstance();
    const company = await companyService.validateApiKey(apiKey);

    if (!company) {
      throw new AuthenticationError('API Key inválida');
    }

    // Adiciona company ao request
    req.company = company;
    req.companyId = company.id;

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware de autenticação via JWT
 */
export async function jwtAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Busca token do header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new AuthenticationError('Token não fornecido');
    }

    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new AuthenticationError('Formato de token inválido');
    }

    const token = parts[1];

    // Verifica token
    const decoded = verifyToken(token);

    if (!decoded.valid || !decoded.payload) {
      throw new AuthenticationError('Token inválido ou expirado');
    }

    // Adiciona user e company ao request
    req.user = decoded.payload;
    req.userId = decoded.payload.userId;
    req.companyId = decoded.payload.companyId;

    // Busca company
    const companyService = CompanyService.getInstance();
    const company = await companyService.getCompanyById(decoded.payload.companyId);

    if (!company || !company.ativo) {
      throw new AuthenticationError('Empresa inativa ou não encontrada');
    }

    req.company = company;

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware de autorização por role
 */
export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Usuário não autenticado');
      }

      if (!roles.includes(req.user.role)) {
        throw new AuthorizationError(
          `Acesso negado. Roles necessárias: ${roles.join(', ')}`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware de autorização por permissão
 */
export function requirePermission(...permissions: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Usuário não autenticado');
      }

      const userPermissions = req.user.permissions || {};

      const hasPermission = permissions.some(permission =>
        userPermissions[permission] === true
      );

      if (!hasPermission) {
        throw new AuthorizationError(
          `Permissão negada. Permissões necessárias: ${permissions.join(', ')}`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware de autorização por company
 */
export function requireCompany(companyId: number) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      if (!req.companyId) {
        throw new AuthenticationError('Empresa não identificada');
      }

      if (req.companyId !== companyId) {
        throw new AuthorizationError('Acesso negado a esta empresa');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware opcional de autenticação (não bloqueia se não autenticado)
 */
export async function optionalAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const apiKey = req.headers['x-api-key'] as string;

    if (authHeader) {
      // Tenta JWT
      await jwtAuth(req, res, next);
    } else if (apiKey) {
      // Tenta API Key
      await apiKeyAuth(req, res, next);
    } else {
      // Sem autenticação, mas não bloqueia
      next();
    }
  } catch (error) {
    // Ignora erros de autenticação no modo opcional
    next();
  }
}

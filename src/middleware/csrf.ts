import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { AuthenticationError } from '../utils/errors';

/**
 * 🛡️ CSRF Protection Middleware
 *
 * Implementa proteção contra Cross-Site Request Forgery
 * usando Double Submit Cookie pattern
 *
 * OWASP: A01:2021 – Broken Access Control
 */

interface CSRFRequest extends Request {
  csrfToken?: string;
}

/**
 * Gera token CSRF seguro
 */
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Middleware de proteção CSRF
 */
export function csrfProtection(
  req: CSRFRequest,
  res: Response,
  next: NextFunction
): void {
  // Skip para métodos seguros (GET, HEAD, OPTIONS)
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    return next();
  }

  // Skip para rotas públicas específicas
  const publicRoutes = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/refresh',
    '/webhook' // Webhook do WhatsApp não pode ter CSRF
  ];

  if (publicRoutes.some(route => req.path.startsWith(route))) {
    return next();
  }

  // Busca token do header ou body
  const tokenFromHeader = req.headers['x-csrf-token'] as string;
  const tokenFromBody = req.body?._csrf;
  const tokenFromCookie = req.cookies?.['csrf-token'];

  const providedToken = tokenFromHeader || tokenFromBody;

  // Valida se token foi fornecido
  if (!providedToken) {
    throw new AuthenticationError('CSRF token não fornecido');
  }

  // Valida se cookie existe
  if (!tokenFromCookie) {
    throw new AuthenticationError('CSRF cookie não encontrado');
  }

  // Compara tokens (timing-safe)
  const tokensMatch = crypto.timingSafeEqual(
    Buffer.from(providedToken),
    Buffer.from(tokenFromCookie)
  );

  if (!tokensMatch) {
    throw new AuthenticationError('CSRF token inválido');
  }

  next();
}

/**
 * Middleware para gerar e enviar CSRF token
 */
export function csrfTokenGenerator(
  req: CSRFRequest,
  res: Response,
  next: NextFunction
): void {
  // Gera novo token se não existir
  if (!req.csrfToken) {
    req.csrfToken = generateCSRFToken();

    // Define cookie seguro
    res.cookie('csrf-token', req.csrfToken, {
      httpOnly: false, // Precisa ser acessível pelo JS
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 horas
    });
  }

  // Adiciona método helper ao response
  (res as any).csrfToken = () => req.csrfToken;

  next();
}

/**
 * Endpoint para obter CSRF token
 */
export function csrfTokenEndpoint(
  req: CSRFRequest,
  res: Response
): void {
  const token = generateCSRFToken();

  // Define cookie
  res.cookie('csrf-token', token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000
  });

  // Retorna token
  res.json({
    success: true,
    csrfToken: token
  });
}

/**
 * Validação CSRF para APIs
 * Mais flexível que o middleware padrão
 */
export function validateCSRFToken(token: string, sessionToken: string): boolean {
  if (!token || !sessionToken) {
    return false;
  }

  try {
    return crypto.timingSafeEqual(
      Buffer.from(token),
      Buffer.from(sessionToken)
    );
  } catch {
    return false;
  }
}

/**
 * Configuração CSRF para diferentes ambientes
 */
export const csrfConfig = {
  development: {
    secure: false,
    sameSite: 'lax' as const
  },
  production: {
    secure: true,
    sameSite: 'strict' as const
  }
};

export default {
  csrfProtection,
  csrfTokenGenerator,
  csrfTokenEndpoint,
  generateCSRFToken,
  validateCSRFToken
};
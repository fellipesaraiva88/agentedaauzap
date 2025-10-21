import rateLimit from 'express-rate-limit';
import { RedisClient } from '../services/RedisClient';

/**
 * ⚡ RATE LIMITING MIDDLEWARE
 *
 * Protege contra brute force, DDoS e abuso de API
 * Usa Redis para coordenar rate limits entre múltiplas instâncias
 */

/**
 * Rate limiter global - 100 requests por 15 minutos
 * Aplicado a todas as rotas
 */
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por janela
  message: {
    error: 'Too many requests',
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  // Skip successful requests to static assets
  skip: (req) => {
    const url = req.url;
    return url.startsWith('/static') ||
           url.startsWith('/assets') ||
           url.startsWith('/images');
  }
});

/**
 * Rate limiter para login - 5 tentativas por 15 minutos
 * Protege contra brute force de senhas
 */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 tentativas por janela
  message: {
    error: 'Too many login attempts',
    message: 'Too many login attempts from this IP. Please try again after 15 minutes.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Key por IP + email (para bloquear tentativas no mesmo email)
  keyGenerator: (req) => {
    const email = req.body?.email || 'unknown';
    return `${req.ip}-${email}`;
  }
});

/**
 * Rate limiter para registro - 3 registros por hora
 * Previne criação massiva de contas fake
 */
export const registerRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // 3 registros por janela
  message: {
    error: 'Too many registration attempts',
    message: 'Too many accounts created from this IP. Please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate limiter para API - 1000 requests por 15 minutos
 * Para usuários autenticados (mais permissivo que global)
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // 1000 requests por janela
  message: {
    error: 'API rate limit exceeded',
    message: 'Too many API requests. Please slow down.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Key por userId se autenticado, senão por IP
  keyGenerator: (req: any) => {
    if (req.user?.id) {
      return `user-${req.user.id}`;
    }
    return req.ip;
  }
});

/**
 * Rate limiter para webhook WhatsApp - 500 requests por minuto
 * Alta taxa para não perder mensagens
 */
export const webhookRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 500, // 500 requests por minuto
  message: {
    error: 'Webhook rate limit exceeded',
    message: 'Too many webhook requests. Please contact support.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Não bloquear por IP (webhook vem do mesmo servidor WAHA)
  skip: (req) => {
    // Skip rate limiting se vem de IPs confiáveis (WAHA)
    const trustedIPsEnv = process.env.WAHA_TRUSTED_IPS;
    if (!trustedIPsEnv) return false;
    const trustedIPs = trustedIPsEnv.split(',');
    return trustedIPs.includes(req.ip || '');
  }
});

/**
 * Rate limiter para password reset - 3 tentativas por hora
 */
export const passwordResetRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3,
  message: {
    error: 'Too many password reset attempts',
    message: 'Too many password reset requests. Please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const email = req.body?.email || 'unknown';
    return `${req.ip}-${email}`;
  }
});

/**
 * Rate limiter customizável
 * Use para criar rate limiters específicos
 */
export function createRateLimiter(options: {
  windowMs: number;
  max: number;
  message?: string;
  keyGenerator?: (req: any) => string;
}) {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: {
      error: 'Rate limit exceeded',
      message: options.message || 'Too many requests. Please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: options.keyGenerator
  });
}

/**
 * Rate limiter com Redis Store (para múltiplas instâncias)
 * TODO: Implementar quando tiver cluster
 */
export async function createRedisRateLimiter(redisClient: RedisClient, options: {
  windowMs: number;
  max: number;
  message?: string;
}) {
  // Placeholder para implementação futura com Redis
  // Permite coordenar rate limits entre múltiplas instâncias do app
  console.warn('⚠️  Redis rate limiter não implementado ainda. Usando in-memory.');

  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: {
      error: 'Rate limit exceeded',
      message: options.message || 'Too many requests.'
    },
    standardHeaders: true,
    legacyHeaders: false
  });
}

import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';

/**
 * 🛡️ Security Headers Middleware
 *
 * Implementa todos os headers de segurança recomendados pela OWASP
 * Protege contra XSS, clickjacking, MIME sniffing, etc.
 */

/**
 * Configuração completa de headers de segurança
 */
export function securityHeaders() {
  return helmet({
    // Content Security Policy
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'", // Necessário para alguns frameworks
          "https://cdn.jsdelivr.net", // CDNs confiáveis
          "https://unpkg.com"
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'", // Necessário para estilos inline
          "https://fonts.googleapis.com",
          "https://cdn.jsdelivr.net"
        ],
        fontSrc: [
          "'self'",
          "https://fonts.gstatic.com",
          "data:"
        ],
        imgSrc: [
          "'self'",
          "data:",
          "blob:",
          "https://*.whatsapp.net", // Imagens do WhatsApp
          "https://*.wa.business"
        ],
        connectSrc: [
          "'self'",
          "wss://*.whatsapp.net", // WebSocket WhatsApp
          "https://api.whatsapp.com"
        ],
        mediaSrc: [
          "'self'",
          "https://*.whatsapp.net" // Áudios/vídeos WhatsApp
        ],
        objectSrc: ["'none'"],
        frameSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"]
        // frameAncestors: ["'none'"], // Removido - conflito com helmet types
        // upgradeInsecureRequests removido - não compatível com development
      } as any
    },

    // Cross Origin Embedder Policy
    crossOriginEmbedderPolicy: false, // Permite embeds do WhatsApp

    // Cross Origin Opener Policy
    crossOriginOpenerPolicy: { policy: "same-origin" },

    // Cross Origin Resource Policy
    crossOriginResourcePolicy: { policy: "cross-origin" },

    // DNS Prefetch Control
    dnsPrefetchControl: { allow: false },

    // Frameguard (X-Frame-Options)
    frameguard: { action: 'deny' },

    // Hide Powered By
    hidePoweredBy: true,

    // HSTS (HTTP Strict Transport Security)
    hsts: {
      maxAge: 31536000, // 1 ano
      includeSubDomains: true,
      preload: true
    },

    // IE No Open
    ieNoOpen: true,

    // No Sniff (X-Content-Type-Options)
    noSniff: true,

    // Origin Agent Cluster
    originAgentCluster: true,

    // Permissions Policy (substitui Feature Policy)
    permittedCrossDomainPolicies: false,

    // Referrer Policy
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },

    // XSS Filter
    xssFilter: true
  });
}

/**
 * Adiciona headers de segurança customizados
 */
export function customSecurityHeaders(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Permissions Policy (Feature Policy successor)
  res.setHeader('Permissions-Policy',
    'camera=(), ' +
    'microphone=(), ' +
    'geolocation=(), ' +
    'payment=(), ' +
    'usb=(), ' +
    'magnetometer=(), ' +
    'gyroscope=(), ' +
    'accelerometer=()'
  );

  // Cache Control para dados sensíveis
  if (req.path.includes('/api/')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }

  // X-Permitted-Cross-Domain-Policies
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');

  // Clear Site Data (logout)
  if (req.path === '/api/auth/logout') {
    res.setHeader('Clear-Site-Data', '"cache", "cookies", "storage"');
  }

  next();
}

/**
 * Previne ataques de timing em rotas sensíveis
 */
export function timingAttackPrevention(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Adiciona delay randômico em rotas de autenticação
  const sensitiveRoutes = ['/api/auth/login', '/api/auth/register'];

  if (sensitiveRoutes.includes(req.path)) {
    const delay = Math.random() * 100 + 50; // 50-150ms
    setTimeout(next, delay);
  } else {
    next();
  }
}

/**
 * Valida Content-Type em requisições
 */
export function contentTypeValidation(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Skip para GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Verifica Content-Type
  const contentType = req.headers['content-type'];

  if (!contentType) {
    res.status(400).json({
      success: false,
      error: 'Content-Type header is required'
    });
    return void 0;
  }

  // Aceita apenas JSON para APIs
  if (req.path.startsWith('/api/') && !contentType.includes('application/json')) {
    res.status(415).json({
      success: false,
      error: 'Unsupported Media Type. Use application/json'
    });
    return void 0;
  }

  next();
}

/**
 * Previne HTTP Parameter Pollution
 */
export function preventHPP(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Remove arrays de query params (mantém apenas o primeiro)
  for (const [key, value] of Object.entries(req.query)) {
    if (Array.isArray(value)) {
      req.query[key] = value[0];
    }
  }

  next();
}

/**
 * Security monitoring e logging
 */
export function securityMonitoring(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log tentativas suspeitas
  const suspiciousPatterns = [
    /\.\.\//g, // Path traversal
    /<script/gi, // XSS attempt
    /union.*select/gi, // SQL injection
    /eval\(/gi, // Code injection
    /javascript:/gi, // XSS via protocol
    /on\w+\s*=/gi // Event handler injection
  ];

  const url = req.url + JSON.stringify(req.body || {});

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(url)) {
      console.warn('[SECURITY] Suspicious request detected:', {
        ip: req.ip,
        method: req.method,
        path: req.path,
        pattern: pattern.toString(),
        userAgent: req.headers['user-agent']
      });

      // Opcional: bloquear requisição suspeita
      if (process.env.BLOCK_SUSPICIOUS_REQUESTS === 'true') {
        res.status(400).json({
          success: false,
          error: 'Invalid request'
        });
        return void 0;
      }
    }
  }

  next();
}

/**
 * Configuração completa de segurança
 */
export function setupSecurity() {
  return [
    securityHeaders(),
    customSecurityHeaders,
    contentTypeValidation,
    preventHPP,
    securityMonitoring,
    timingAttackPrevention
  ];
}

export default {
  securityHeaders,
  customSecurityHeaders,
  contentTypeValidation,
  preventHPP,
  securityMonitoring,
  timingAttackPrevention,
  setupSecurity
};
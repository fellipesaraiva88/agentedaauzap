import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';

/**
 * Security Headers Middleware
 *
 * Implementa todos os headers de segurança recomendados pelo OWASP
 * Protege contra diversos tipos de ataques
 */

/**
 * Content Security Policy configuration
 * Previne XSS e injeção de conteúdo malicioso
 */
const contentSecurityPolicy = {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: [
      "'self'",
      "'unsafe-inline'", // Remover em produção se possível
      "https://cdn.jsdelivr.net", // Para bibliotecas CDN
      "https://unpkg.com"
    ],
    styleSrc: [
      "'self'",
      "'unsafe-inline'", // Necessário para alguns frameworks CSS
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
      "https:",
      "blob:"
    ],
    connectSrc: [
      "'self'",
      "https://api.whatsapp.com",
      "wss://", // Para WebSocket
      process.env.WAHA_API_URL || ""
    ],
    mediaSrc: ["'self'", "https:", "blob:"],
    objectSrc: ["'none'"],
    frameSrc: ["'none'"],
    baseUri: ["'self'"],
    formAction: ["'self'"],
    frameAncestors: ["'none'"],
    upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : undefined
  }
};

/**
 * Configuração completa do Helmet
 */
export function setupSecurityHeaders() {
  const isProduction = process.env.NODE_ENV === 'production';

  return helmet({
    // Content Security Policy
    contentSecurityPolicy: isProduction ? contentSecurityPolicy : false,

    // X-DNS-Prefetch-Control
    dnsPrefetchControl: {
      allow: false
    },

    // X-Frame-Options - Previne clickjacking
    frameguard: {
      action: 'deny'
    },

    // X-Content-Type-Options - Previne MIME sniffing
    noSniff: true,

    // X-XSS-Protection - Proteção XSS para browsers antigos
    xssFilter: true,

    // Strict-Transport-Security - Força HTTPS
    hsts: isProduction ? {
      maxAge: 31536000, // 1 ano
      includeSubDomains: true,
      preload: true
    } : false,

    // X-Permitted-Cross-Domain-Policies
    permittedCrossDomainPolicies: {
      permittedPolicies: 'none'
    },

    // Referrer-Policy
    referrerPolicy: {
      policy: 'strict-origin-when-cross-origin'
    },

    // X-Download-Options para IE
    ieNoOpen: true,

    // Hide X-Powered-By
    hidePoweredBy: true,

    // Origin-Agent-Cluster header
    originAgentCluster: true,

    // Cross-Origin-Embedder-Policy
    crossOriginEmbedderPolicy: false, // Pode quebrar embeds do WhatsApp

    // Cross-Origin-Opener-Policy
    crossOriginOpenerPolicy: {
      policy: 'same-origin'
    },

    // Cross-Origin-Resource-Policy
    crossOriginResourcePolicy: {
      policy: 'cross-origin' // Permite recursos de outros domínios
    }
  });
}

/**
 * Headers de segurança customizados adicionais
 */
export function customSecurityHeaders() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Permissions Policy (antiga Feature Policy)
    res.setHeader('Permissions-Policy',
      'accelerometer=(), ' +
      'camera=(), ' +
      'geolocation=(), ' +
      'gyroscope=(), ' +
      'magnetometer=(), ' +
      'microphone=(), ' +
      'payment=(), ' +
      'usb=(), ' +
      'interest-cohort=()' // Opt-out do FLoC do Google
    );

    // Cache Control para dados sensíveis
    if (req.path.startsWith('/api/')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Surrogate-Control', 'no-store');
    }

    // X-Request-ID para tracking
    const requestId = req.headers['x-request-id'] || generateRequestId();
    res.setHeader('X-Request-ID', requestId);

    // Security headers para APIs
    if (req.path.startsWith('/api/')) {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');
    }

    // CORS headers seguros (complementar ao cors middleware)
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 horas

    // Prevenir information disclosure
    res.removeHeader('X-Powered-By');
    res.removeHeader('Server');

    next();
  };
}

/**
 * Middleware para prevenir Clickjacking em rotas específicas
 */
export function preventClickjacking(action: 'DENY' | 'SAMEORIGIN' = 'DENY') {
  return (req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Frame-Options', action);
    res.setHeader('Content-Security-Policy', `frame-ancestors ${action === 'DENY' ? "'none'" : "'self'"}`);
    next();
  };
}

/**
 * Middleware para forçar HTTPS em produção
 */
export function enforceHTTPS() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (process.env.NODE_ENV === 'production') {
      // Check if request is not HTTPS
      if (req.header('x-forwarded-proto') !== 'https') {
        return res.redirect(301, `https://${req.header('host')}${req.url}`);
      }

      // Set HSTS header
      res.setHeader('Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload');
    }
    next();
  };
}

/**
 * Gera ID único para request
 */
function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Configuração de CORS segura
 */
export const secureCorsOptions = {
  origin: function(origin: string | undefined, callback: Function) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'http://localhost:3001'
    ];

    // Permitir requests sem origin (ex: Postman, mobile apps)
    if (!origin && process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-CSRF-Token',
    'X-Request-ID',
    'X-Requested-With'
  ],
  exposedHeaders: [
    'X-Request-ID',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset'
  ],
  maxAge: 86400, // 24 horas
  optionsSuccessStatus: 200
};

/**
 * Middleware de segurança para uploads de arquivo
 */
export function secureFileUpload() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Prevenir upload de arquivos perigosos
    const dangerousExtensions = [
      '.exe', '.dll', '.bat', '.cmd', '.sh',
      '.ps1', '.vbs', '.js', '.jar', '.com',
      '.scr', '.app', '.pif', '.msi', '.deb', '.rpm'
    ];

    if (req.files) {
      const files = Array.isArray(req.files) ? req.files : [req.files];

      for (const file of files as any[]) {
        const fileName = file.name?.toLowerCase() || '';

        // Check dangerous extensions
        for (const ext of dangerousExtensions) {
          if (fileName.endsWith(ext)) {
            return res.status(400).json({
              error: 'Bad Request',
              message: `Tipo de arquivo não permitido: ${ext}`
            });
          }
        }

        // Check double extensions
        if (fileName.match(/\.[a-z]+\.[a-z]+$/)) {
          return res.status(400).json({
            error: 'Bad Request',
            message: 'Arquivos com dupla extensão não são permitidos'
          });
        }
      }
    }

    next();
  };
}

export default {
  setupSecurityHeaders,
  customSecurityHeaders,
  preventClickjacking,
  enforceHTTPS,
  secureCorsOptions,
  secureFileUpload
};
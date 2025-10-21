import jwt from 'jsonwebtoken';

/**
 * 🔐 JWT UTILITIES
 *
 * Gerencia geração, validação e refresh de tokens JWT
 * para autenticação de usuários
 */

// Secrets (OBRIGATÓRIOS em produção)
const ACCESS_TOKEN_SECRET = (() => {
  const secret = process.env.JWT_ACCESS_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CRITICAL SECURITY ERROR: JWT_ACCESS_SECRET must be set in production environment');
    }
    // Em desenvolvimento, gera um secret aleatório na inicialização
    console.warn('⚠️  JWT_ACCESS_SECRET not set - generating random secret for development');
    return require('crypto').randomBytes(64).toString('hex');
  }

  // Validar força do secret
  if (secret.length < 32) {
    throw new Error('JWT_ACCESS_SECRET must be at least 32 characters long');
  }

  return secret;
})();

const REFRESH_TOKEN_SECRET = (() => {
  const secret = process.env.JWT_REFRESH_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CRITICAL SECURITY ERROR: JWT_REFRESH_SECRET must be set in production environment');
    }
    // Em desenvolvimento, gera um secret aleatório na inicialização
    console.warn('⚠️  JWT_REFRESH_SECRET not set - generating random secret for development');
    return require('crypto').randomBytes(64).toString('hex');
  }

  // Validar força do secret
  if (secret.length < 32) {
    throw new Error('JWT_REFRESH_SECRET must be at least 32 characters long');
  }

  return secret;
})();

// Expiração dos tokens
const ACCESS_TOKEN_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m'; // 15 minutos
const REFRESH_TOKEN_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d'; // 7 dias

/**
 * Payload do token JWT
 */
export interface JWTPayload {
  userId: number;
  email: string;
  companyId: number;
  role: string;
}

/**
 * Resultado da geração de tokens
 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // em segundos
}

/**
 * Resultado da validação de token
 */
export interface TokenValidation {
  valid: boolean;
  payload?: JWTPayload;
  error?: string;
}

/**
 * Gera par de tokens (access + refresh)
 */
export function generateTokenPair(payload: JWTPayload): TokenPair {
  // Gerar access token (curta duração)
  const accessToken = jwt.sign(
    payload,
    ACCESS_TOKEN_SECRET,
    {
      expiresIn: ACCESS_TOKEN_EXPIRY as string,
      issuer: 'auzap-api',
      audience: 'auzap-client'
    } as jwt.SignOptions
  );

  // Gerar refresh token (longa duração)
  const refreshToken = jwt.sign(
    {
      userId: payload.userId,
      email: payload.email,
      companyId: payload.companyId
    },
    REFRESH_TOKEN_SECRET,
    {
      expiresIn: REFRESH_TOKEN_EXPIRY as string,
      issuer: 'auzap-api',
      audience: 'auzap-client'
    } as jwt.SignOptions
  );

  // Calcular expiresIn em segundos
  let expiresIn = 900; // 15min default
  if (typeof ACCESS_TOKEN_EXPIRY === 'string') {
    if (ACCESS_TOKEN_EXPIRY.endsWith('m')) {
      expiresIn = parseInt(ACCESS_TOKEN_EXPIRY) * 60;
    } else if (ACCESS_TOKEN_EXPIRY.endsWith('h')) {
      expiresIn = parseInt(ACCESS_TOKEN_EXPIRY) * 3600;
    } else if (ACCESS_TOKEN_EXPIRY.endsWith('d')) {
      expiresIn = parseInt(ACCESS_TOKEN_EXPIRY) * 86400;
    }
  }

  return {
    accessToken,
    refreshToken,
    expiresIn
  };
}

/**
 * Valida access token
 */
export function verifyAccessToken(token: string): TokenValidation {
  try {
    const payload = jwt.verify(token, ACCESS_TOKEN_SECRET, {
      issuer: 'auzap-api',
      audience: 'auzap-client'
    }) as JWTPayload;

    return {
      valid: true,
      payload
    };
  } catch (error: any) {
    let errorMessage = 'Invalid token';

    if (error.name === 'TokenExpiredError') {
      errorMessage = 'Token expired';
    } else if (error.name === 'JsonWebTokenError') {
      errorMessage = 'Malformed token';
    } else if (error.name === 'NotBeforeError') {
      errorMessage = 'Token not yet valid';
    }

    return {
      valid: false,
      error: errorMessage
    };
  }
}

/**
 * Valida refresh token
 */
export function verifyRefreshToken(token: string): TokenValidation {
  try {
    const payload = jwt.verify(token, REFRESH_TOKEN_SECRET, {
      issuer: 'auzap-api',
      audience: 'auzap-client'
    }) as Partial<JWTPayload>;

    return {
      valid: true,
      payload: payload as JWTPayload
    };
  } catch (error: any) {
    let errorMessage = 'Invalid refresh token';

    if (error.name === 'TokenExpiredError') {
      errorMessage = 'Refresh token expired';
    } else if (error.name === 'JsonWebTokenError') {
      errorMessage = 'Malformed refresh token';
    }

    return {
      valid: false,
      error: errorMessage
    };
  }
}

/**
 * Gera novo access token a partir de um refresh token válido
 */
export function refreshAccessToken(refreshToken: string, role: string): { accessToken: string; expiresIn: number } | null {
  const validation = verifyRefreshToken(refreshToken);

  if (!validation.valid || !validation.payload) {
    return null;
  }

  // Gerar novo access token
  const accessToken = jwt.sign(
    {
      userId: validation.payload.userId,
      email: validation.payload.email,
      companyId: validation.payload.companyId,
      role: role
    },
    ACCESS_TOKEN_SECRET,
    {
      expiresIn: ACCESS_TOKEN_EXPIRY as string,
      issuer: 'auzap-api',
      audience: 'auzap-client'
    } as jwt.SignOptions
  );

  // Calcular expiresIn em segundos
  let expiresIn = 900; // 15min default
  if (typeof ACCESS_TOKEN_EXPIRY === 'string') {
    if (ACCESS_TOKEN_EXPIRY.endsWith('m')) {
      expiresIn = parseInt(ACCESS_TOKEN_EXPIRY) * 60;
    } else if (ACCESS_TOKEN_EXPIRY.endsWith('h')) {
      expiresIn = parseInt(ACCESS_TOKEN_EXPIRY) * 3600;
    } else if (ACCESS_TOKEN_EXPIRY.endsWith('d')) {
      expiresIn = parseInt(ACCESS_TOKEN_EXPIRY) * 86400;
    }
  }

  return {
    accessToken,
    expiresIn
  };
}

/**
 * Decodifica token sem validar (útil para debug)
 * ⚠️ NÃO USE PARA AUTENTICAÇÃO - apenas para inspeção
 */
export function decodeToken(token: string): any {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
}

/**
 * Extrai token do header Authorization
 * Suporta formato: "Bearer <token>"
 */
export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}

/**
 * Alias para verifyAccessToken (compatibilidade)
 */
export const verifyToken = verifyAccessToken;

/**
 * Helper JWT para testes (standalone para evitar dependências)
 */

import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';

export interface JWTPayload {
  userId: number;
  companyId: number;
  email?: string;
  role?: string;
  permissions?: Record<string, boolean>;
}

/**
 * Gera um token JWT para testes
 */
export function signTestToken(payload: JWTPayload, expiresIn: string = '1h'): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn } as jwt.SignOptions);
}

/**
 * Verifica um token JWT
 */
export function verifyTestToken(token: string): { valid: boolean; payload?: any } {
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return { valid: true, payload };
  } catch (error) {
    return { valid: false };
  }
}

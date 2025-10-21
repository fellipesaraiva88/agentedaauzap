/**
 * Helper para autenticação em testes
 */

import { signTestToken } from './jwt.helper';

export interface MockAuthPayload {
  userId: number;
  companyId: number;
  email?: string;
  role?: string;
  permissions?: Record<string, boolean>;
}

/**
 * Gera um token JWT válido para testes
 */
export function generateTestToken(payload: MockAuthPayload): string {
  return signTestToken(payload);
}

/**
 * Gera uma API Key fake para testes
 */
export function generateTestApiKey(companyId: number): string {
  return `test_api_key_${companyId}_${Date.now()}`;
}

/**
 * Retorna headers de autenticação com JWT
 */
export function getAuthHeaders(companyId: number = 1, userId: number = 1): Record<string, string> {
  const token = generateTestToken({ userId, companyId });
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

/**
 * Retorna headers de autenticação com API Key
 */
export function getApiKeyHeaders(companyId: number = 1): Record<string, string> {
  return {
    'x-api-key': generateTestApiKey(companyId),
    'Content-Type': 'application/json'
  };
}

/**
 * Mock do payload decodificado do JWT
 */
export function mockAuthRequest(companyId: number = 1, userId: number = 1) {
  return {
    companyId,
    userId,
    user: {
      userId,
      companyId,
      email: 'test@example.com',
      role: 'admin'
    },
    company: {
      id: companyId,
      nome: 'Test Company',
      ativo: true
    }
  };
}

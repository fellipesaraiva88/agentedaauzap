/**
 * Configuração global para todos os testes
 */

import dotenv from 'dotenv';

// Carrega variáveis de ambiente de teste
dotenv.config({ path: '.env.test' });

// Configuração de timeout global
jest.setTimeout(30000);

// Mock console para evitar poluição nos logs durante testes
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  // Mantém error para debugging
  error: console.error,
};

// Configurações globais
beforeAll(() => {
  // Setup global antes de todos os testes
});

afterAll(() => {
  // Cleanup global após todos os testes
});

beforeEach(() => {
  // Setup antes de cada teste
  jest.clearAllMocks();
});

afterEach(() => {
  // Cleanup após cada teste
});

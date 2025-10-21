/**
 * EXEMPLO DE TESTE DE INTEGRAÇÃO
 *
 * Este arquivo demonstra como criar testes de integração mais complexos
 * que testam múltiplos componentes trabalhando juntos.
 *
 * Para executar: npm test -- example-integration.test.ts
 */

// Mock do localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    }
  }
})()

// Setup
beforeAll(() => {
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
  })
})

beforeEach(() => {
  localStorageMock.clear()
})

describe('Exemplo: Fluxo de Autenticação Completo', () => {
  /**
   * Este teste demonstra um fluxo completo de autenticação:
   * 1. Login
   * 2. Fazer request autenticado
   * 3. Token expira (refresh automático)
   * 4. Logout
   */

  it('deve executar fluxo completo de autenticação com refresh automático', async () => {
    // ========================================
    // FASE 1: LOGIN
    // ========================================
    const loginService = {
      login: async (email: string, password: string) => {
        if (email === 'test@example.com' && password === 'password123') {
          const tokens = {
            accessToken: 'initial-access-token',
            refreshToken: 'valid-refresh-token',
            expiresIn: 3600
          }

          localStorageMock.setItem('token', tokens.accessToken)
          localStorageMock.setItem('refreshToken', tokens.refreshToken)
          localStorageMock.setItem('selectedCompanyId', '123')

          return { success: true, tokens }
        }

        throw new Error('Invalid credentials')
      }
    }

    const loginResult = await loginService.login('test@example.com', 'password123')

    expect(loginResult.success).toBe(true)
    expect(localStorageMock.getItem('token')).toBe('initial-access-token')
    expect(localStorageMock.getItem('selectedCompanyId')).toBe('123')

    // ========================================
    // FASE 2: REQUEST AUTENTICADO
    // ========================================
    const apiService = {
      makeAuthenticatedRequest: async (endpoint: string) => {
        const token = localStorageMock.getItem('token')

        if (!token) {
          throw new Error('Not authenticated')
        }

        // Simula request com token
        return {
          status: 200,
          data: { message: 'Success', token }
        }
      }
    }

    const response = await apiService.makeAuthenticatedRequest('/api/dashboard/stats')

    expect(response.status).toBe(200)
    expect(response.data.token).toBe('initial-access-token')

    // ========================================
    // FASE 3: TOKEN EXPIRA E REFRESH AUTOMÁTICO
    // ========================================

    // Simula expiração do token (backend retorna 401)
    const apiServiceWithRefresh = {
      makeRequest: async (endpoint: string) => {
        const token = localStorageMock.getItem('token')

        // Simula token expirado
        if (token === 'initial-access-token') {
          // Tenta refresh automático
          const refreshToken = localStorageMock.getItem('refreshToken')

          if (refreshToken === 'valid-refresh-token') {
            // Refresh bem-sucedido
            const newToken = 'refreshed-access-token'
            localStorageMock.setItem('token', newToken)

            return {
              status: 200,
              data: { message: 'Success after refresh', token: newToken }
            }
          }

          throw new Error('Unauthorized')
        }

        return {
          status: 200,
          data: { message: 'Success', token }
        }
      }
    }

    const refreshedResponse = await apiServiceWithRefresh.makeRequest('/api/appointments')

    expect(refreshedResponse.status).toBe(200)
    expect(localStorageMock.getItem('token')).toBe('refreshed-access-token')

    // ========================================
    // FASE 4: LOGOUT
    // ========================================
    const logoutService = {
      logout: async () => {
        localStorageMock.removeItem('token')
        localStorageMock.removeItem('refreshToken')
        localStorageMock.removeItem('selectedCompanyId')
      }
    }

    await logoutService.logout()

    expect(localStorageMock.getItem('token')).toBeNull()
    expect(localStorageMock.getItem('refreshToken')).toBeNull()
    expect(localStorageMock.getItem('selectedCompanyId')).toBeNull()
  })
})

describe('Exemplo: Multi-Tenancy com Troca de Empresa', () => {
  /**
   * Este teste demonstra o comportamento de multi-tenancy:
   * 1. Login na empresa A
   * 2. Fazer requests (company A)
   * 3. Trocar para empresa B
   * 4. Fazer requests (company B)
   */

  it('deve isolar dados entre empresas diferentes', async () => {
    // Login inicial (empresa 123)
    localStorageMock.setItem('token', 'valid-token')
    localStorageMock.setItem('selectedCompanyId', '123')

    const apiWithTenancy = {
      getAppointments: async () => {
        const companyId = localStorageMock.getItem('selectedCompanyId')
        const token = localStorageMock.getItem('token')

        if (!token) {
          throw new Error('Not authenticated')
        }

        // Simula retorno de dados da empresa
        return {
          companyId: companyId,
          appointments: [
            { id: 1, companyId, petName: 'Rex' },
            { id: 2, companyId, petName: 'Bella' }
          ]
        }
      }
    }

    // Request para empresa 123
    const company123Data = await apiWithTenancy.getAppointments()

    expect(company123Data.companyId).toBe('123')
    expect(company123Data.appointments[0].companyId).toBe('123')

    // Troca para empresa 456
    localStorageMock.setItem('selectedCompanyId', '456')

    // Request para empresa 456
    const company456Data = await apiWithTenancy.getAppointments()

    expect(company456Data.companyId).toBe('456')
    expect(company456Data.appointments[0].companyId).toBe('456')

    // Dados são diferentes entre empresas
    expect(company123Data.companyId).not.toBe(company456Data.companyId)
  })
})

describe('Exemplo: Tratamento de Erros', () => {
  /**
   * Este teste demonstra como lidar com diferentes tipos de erros
   */

  it('deve lidar com erro de rede', async () => {
    const apiWithErrors = {
      makeRequest: async () => {
        // Simula erro de rede
        throw new Error('Network error')
      }
    }

    await expect(apiWithErrors.makeRequest()).rejects.toThrow('Network error')
  })

  it('deve lidar com 401 Unauthorized', async () => {
    localStorageMock.setItem('token', 'expired-token')

    const apiWith401 = {
      makeRequest: async () => {
        const token = localStorageMock.getItem('token')

        if (token === 'expired-token') {
          // Simula 401
          localStorageMock.removeItem('token')
          localStorageMock.removeItem('refreshToken')
          localStorageMock.removeItem('selectedCompanyId')

          throw new Error('Unauthorized')
        }

        return { status: 200 }
      }
    }

    await expect(apiWith401.makeRequest()).rejects.toThrow('Unauthorized')

    // Verifica que tokens foram limpos
    expect(localStorageMock.getItem('token')).toBeNull()
  })

  it('deve lidar com 403 Forbidden (sem permissão)', async () => {
    localStorageMock.setItem('token', 'valid-token')
    localStorageMock.setItem('userRole', 'user')

    const apiWith403 = {
      deleteAppointment: async () => {
        const role = localStorageMock.getItem('userRole')

        // Apenas admin pode deletar
        if (role !== 'admin') {
          throw new Error('Forbidden: Insufficient permissions')
        }

        return { status: 200 }
      }
    }

    await expect(apiWith403.deleteAppointment()).rejects.toThrow('Forbidden')
  })

  it('deve lidar com 500 Internal Server Error', async () => {
    const apiWith500 = {
      makeRequest: async () => {
        // Simula erro do servidor
        throw new Error('Internal Server Error')
      }
    }

    await expect(apiWith500.makeRequest()).rejects.toThrow('Internal Server Error')
  })
})

describe('Exemplo: Rate Limiting', () => {
  /**
   * Este teste demonstra como testar rate limiting
   */

  it('deve respeitar rate limit', async () => {
    let requestCount = 0
    const MAX_REQUESTS = 5

    const apiWithRateLimit = {
      makeRequest: async () => {
        requestCount++

        if (requestCount > MAX_REQUESTS) {
          throw new Error('Too Many Requests (429)')
        }

        return { status: 200, requestCount }
      }
    }

    // Primeiras 5 requests devem passar
    for (let i = 0; i < MAX_REQUESTS; i++) {
      const response = await apiWithRateLimit.makeRequest()
      expect(response.status).toBe(200)
    }

    // 6ª request deve falhar
    await expect(apiWithRateLimit.makeRequest()).rejects.toThrow('Too Many Requests')
  })
})

describe('Exemplo: Cache de Dados', () => {
  /**
   * Este teste demonstra como testar cache de dados
   */

  it('deve cachear dados e reutilizar em próximas requests', async () => {
    const cache: Record<string, any> = {}
    let apiCallCount = 0

    const apiWithCache = {
      getAppointments: async (useCache: boolean = true) => {
        const cacheKey = 'appointments'

        // Verifica cache
        if (useCache && cache[cacheKey]) {
          return {
            fromCache: true,
            data: cache[cacheKey]
          }
        }

        // Simula chamada à API (incrementa contador)
        apiCallCount++

        const data = {
          appointments: [
            { id: 1, petName: 'Rex' },
            { id: 2, petName: 'Bella' }
          ]
        }

        // Salva no cache
        cache[cacheKey] = data

        return {
          fromCache: false,
          data
        }
      }
    }

    // Primeira chamada: faz request real
    const firstCall = await apiWithCache.getAppointments()
    expect(firstCall.fromCache).toBe(false)
    expect(apiCallCount).toBe(1)

    // Segunda chamada: usa cache
    const secondCall = await apiWithCache.getAppointments()
    expect(secondCall.fromCache).toBe(true)
    expect(apiCallCount).toBe(1) // Não incrementa (cache hit)

    // Terceira chamada sem cache: faz request real
    const thirdCall = await apiWithCache.getAppointments(false)
    expect(thirdCall.fromCache).toBe(false)
    expect(apiCallCount).toBe(2) // Incrementa (cache bypass)
  })
})

/**
 * DICAS PARA CRIAR BONS TESTES:
 *
 * 1. Use nomes descritivos: "deve fazer X quando Y"
 * 2. Siga o padrão AAA (Arrange-Act-Assert)
 * 3. Teste happy path + error cases + edge cases
 * 4. Mantenha testes independentes (cada teste deve poder rodar sozinho)
 * 5. Use mocks apropriados (localStorage, fetch, etc)
 * 6. Teste comportamento, não implementação
 * 7. Mantenha testes simples e focados
 *
 * EXEMPLOS DE BONS NOMES DE TESTE:
 * ✅ "deve adicionar Authorization header quando token existe"
 * ✅ "deve redirecionar para /login em 401 Unauthorized"
 * ✅ "deve isolar dados entre empresas diferentes"
 *
 * EXEMPLOS DE NOMES RUINS:
 * ❌ "test1"
 * ❌ "funciona"
 * ❌ "api test"
 */

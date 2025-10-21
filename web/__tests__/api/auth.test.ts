/**
 * TESTES DE AUTENTICAÇÃO
 *
 * Testa:
 * - Função de login
 * - Refresh token
 * - Logout
 * - Armazenamento de tokens
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

// Setup global mocks
beforeAll(() => {
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
  })
})

beforeEach(() => {
  localStorageMock.clear()
})

// Simula funções de autenticação do frontend
const authService = {
  login: async (email: string, password: string) => {
    // Simula chamada à API
    if (!email || !password) {
      throw new Error('Email and password are required')
    }

    if (email === 'test@example.com' && password === 'password123') {
      const tokens = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiresIn: 3600
      }

      const user = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        companyId: 123
      }

      // Salva no localStorage
      localStorageMock.setItem('token', tokens.accessToken)
      localStorageMock.setItem('refreshToken', tokens.refreshToken)
      localStorageMock.setItem('selectedCompanyId', user.companyId.toString())

      return { user, tokens }
    }

    throw new Error('Invalid credentials')
  },

  logout: async () => {
    // Limpa localStorage
    localStorageMock.removeItem('token')
    localStorageMock.removeItem('refreshToken')
    localStorageMock.removeItem('selectedCompanyId')
  },

  refreshToken: async (refreshToken: string) => {
    if (!refreshToken) {
      throw new Error('Refresh token is required')
    }

    if (refreshToken === 'mock-refresh-token') {
      const newAccessToken = 'new-mock-access-token'

      // Atualiza token no localStorage
      localStorageMock.setItem('token', newAccessToken)

      return {
        accessToken: newAccessToken,
        expiresIn: 3600
      }
    }

    throw new Error('Invalid refresh token')
  },

  isAuthenticated: () => {
    return !!localStorageMock.getItem('token')
  },

  getToken: () => {
    return localStorageMock.getItem('token')
  },

  getCompanyId: () => {
    return localStorageMock.getItem('selectedCompanyId')
  }
}

describe('Auth Service - Login', () => {
  it('deve fazer login com credenciais válidas', async () => {
    const result = await authService.login('test@example.com', 'password123')

    expect(result.user).toBeDefined()
    expect(result.user.email).toBe('test@example.com')
    expect(result.tokens.accessToken).toBe('mock-access-token')
  })

  it('deve salvar tokens no localStorage após login', async () => {
    await authService.login('test@example.com', 'password123')

    expect(localStorageMock.getItem('token')).toBe('mock-access-token')
    expect(localStorageMock.getItem('refreshToken')).toBe('mock-refresh-token')
  })

  it('deve salvar companyId no localStorage após login', async () => {
    await authService.login('test@example.com', 'password123')

    expect(localStorageMock.getItem('selectedCompanyId')).toBe('123')
  })

  it('deve rejeitar login com credenciais inválidas', async () => {
    await expect(
      authService.login('wrong@example.com', 'wrongpassword')
    ).rejects.toThrow('Invalid credentials')
  })

  it('deve rejeitar login sem email', async () => {
    await expect(
      authService.login('', 'password123')
    ).rejects.toThrow('Email and password are required')
  })

  it('deve rejeitar login sem password', async () => {
    await expect(
      authService.login('test@example.com', '')
    ).rejects.toThrow('Email and password are required')
  })
})

describe('Auth Service - Logout', () => {
  it('deve limpar todos os tokens no logout', async () => {
    // Primeiro faz login
    await authService.login('test@example.com', 'password123')

    expect(localStorageMock.getItem('token')).toBeTruthy()

    // Depois faz logout
    await authService.logout()

    expect(localStorageMock.getItem('token')).toBeNull()
    expect(localStorageMock.getItem('refreshToken')).toBeNull()
    expect(localStorageMock.getItem('selectedCompanyId')).toBeNull()
  })

  it('deve marcar usuário como não autenticado após logout', async () => {
    await authService.login('test@example.com', 'password123')
    expect(authService.isAuthenticated()).toBe(true)

    await authService.logout()
    expect(authService.isAuthenticated()).toBe(false)
  })
})

describe('Auth Service - Refresh Token', () => {
  it('deve renovar access token com refresh token válido', async () => {
    const result = await authService.refreshToken('mock-refresh-token')

    expect(result.accessToken).toBe('new-mock-access-token')
    expect(result.expiresIn).toBe(3600)
  })

  it('deve atualizar access token no localStorage', async () => {
    localStorageMock.setItem('token', 'old-token')

    await authService.refreshToken('mock-refresh-token')

    expect(localStorageMock.getItem('token')).toBe('new-mock-access-token')
  })

  it('deve rejeitar refresh com token inválido', async () => {
    await expect(
      authService.refreshToken('invalid-token')
    ).rejects.toThrow('Invalid refresh token')
  })

  it('deve rejeitar refresh sem token', async () => {
    await expect(
      authService.refreshToken('')
    ).rejects.toThrow('Refresh token is required')
  })
})

describe('Auth Service - Estado de Autenticação', () => {
  it('deve retornar false quando não autenticado', () => {
    expect(authService.isAuthenticated()).toBe(false)
  })

  it('deve retornar true quando autenticado', async () => {
    await authService.login('test@example.com', 'password123')

    expect(authService.isAuthenticated()).toBe(true)
  })

  it('deve retornar token correto', async () => {
    await authService.login('test@example.com', 'password123')

    expect(authService.getToken()).toBe('mock-access-token')
  })

  it('deve retornar companyId correto', async () => {
    await authService.login('test@example.com', 'password123')

    expect(authService.getCompanyId()).toBe('123')
  })

  it('deve retornar null quando não há token', () => {
    expect(authService.getToken()).toBeNull()
  })

  it('deve retornar null quando não há companyId', () => {
    expect(authService.getCompanyId()).toBeNull()
  })
})

describe('Auth Service - Fluxo Completo', () => {
  it('deve executar fluxo completo: login -> refresh -> logout', async () => {
    // 1. Login
    const loginResult = await authService.login('test@example.com', 'password123')
    expect(loginResult.user.email).toBe('test@example.com')
    expect(authService.isAuthenticated()).toBe(true)

    // 2. Refresh token
    const oldToken = authService.getToken()
    const refreshToken = localStorageMock.getItem('refreshToken')!
    await authService.refreshToken(refreshToken)

    const newToken = authService.getToken()
    expect(newToken).not.toBe(oldToken)
    expect(newToken).toBe('new-mock-access-token')
    expect(authService.isAuthenticated()).toBe(true)

    // 3. Logout
    await authService.logout()
    expect(authService.isAuthenticated()).toBe(false)
    expect(authService.getToken()).toBeNull()
  })

  it('deve manter companyId durante refresh', async () => {
    await authService.login('test@example.com', 'password123')

    const companyIdBefore = authService.getCompanyId()

    const refreshToken = localStorageMock.getItem('refreshToken')!
    await authService.refreshToken(refreshToken)

    const companyIdAfter = authService.getCompanyId()

    expect(companyIdBefore).toBe(companyIdAfter)
    expect(companyIdAfter).toBe('123')
  })
})

describe('Auth Service - Cenários de Erro', () => {
  it('deve lidar com falha de rede no login', async () => {
    // Simula falha de rede
    const networkErrorService = {
      login: async () => {
        throw new Error('Network error')
      }
    }

    await expect(networkErrorService.login()).rejects.toThrow('Network error')
  })

  it('deve lidar com token expirado no refresh', async () => {
    await expect(
      authService.refreshToken('expired-token')
    ).rejects.toThrow('Invalid refresh token')
  })

  it('deve limpar localStorage se refresh falhar', async () => {
    localStorageMock.setItem('token', 'old-token')
    localStorageMock.setItem('refreshToken', 'old-refresh-token')

    try {
      await authService.refreshToken('invalid-token')
    } catch (error) {
      // Em caso de falha, limpa tokens
      await authService.logout()
    }

    expect(localStorageMock.getItem('token')).toBeNull()
    expect(localStorageMock.getItem('refreshToken')).toBeNull()
  })
})

describe('Auth Service - Multi-Tenancy', () => {
  it('deve alternar entre empresas', async () => {
    await authService.login('test@example.com', 'password123')

    expect(authService.getCompanyId()).toBe('123')

    // Simula troca de empresa
    localStorageMock.setItem('selectedCompanyId', '456')

    expect(authService.getCompanyId()).toBe('456')
  })

  it('deve manter token ao trocar de empresa', async () => {
    await authService.login('test@example.com', 'password123')

    const token = authService.getToken()

    // Troca empresa
    localStorageMock.setItem('selectedCompanyId', '789')

    // Token permanece o mesmo
    expect(authService.getToken()).toBe(token)
    expect(authService.isAuthenticated()).toBe(true)
  })

  it('deve limpar companyId no logout', async () => {
    await authService.login('test@example.com', 'password123')

    localStorageMock.setItem('selectedCompanyId', '999')

    await authService.logout()

    expect(authService.getCompanyId()).toBeNull()
  })
})

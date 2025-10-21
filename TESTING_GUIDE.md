# GUIA DE TESTES - Agente Petshop WhatsApp

Este guia documenta todos os testes do sistema, incluindo testes de integração frontend-backend, testes unitários e de integração.

## Índice

1. [Visão Geral](#visao-geral)
2. [Configuração do Ambiente](#configuracao-do-ambiente)
3. [Testes de Integração Frontend-Backend](#testes-frontend-backend)
4. [Testes Unitários (Jest)](#testes-unitarios)
5. [Como Adicionar Novos Testes](#como-adicionar-novos-testes)
6. [Troubleshooting](#troubleshooting)

---

## Visão Geral

O sistema possui 3 níveis de testes:

### 1. Testes de Integração E2E (Bash Script)
- **Arquivo**: `/test-frontend-backend.sh`
- **Objetivo**: Validar comunicação real entre frontend e backend
- **Tecnologia**: Bash + curl
- **Execução**: Manual via terminal

### 2. Testes Unitários Frontend (Jest)
- **Diretório**: `/web/__tests__/`
- **Objetivo**: Testar lógica do frontend (interceptors, auth, etc)
- **Tecnologia**: Jest + TypeScript
- **Execução**: `npm test` no diretório `/web`

### 3. Testes de API Backend (Jest + Supertest)
- **Diretório**: `/__tests__/`
- **Objetivo**: Testar endpoints da API
- **Tecnologia**: Jest + Supertest
- **Execução**: `npm test` no diretório raiz

---

## Configuração do Ambiente

### Pré-requisitos

1. **Node.js** 18+ instalado
2. **PostgreSQL** rodando (para testes de integração)
3. **Backend** rodando na porta 3000
4. **Frontend** rodando na porta 3001

### Instalação de Dependências

```bash
# Backend
npm install

# Frontend
cd web
npm install
```

### Variáveis de Ambiente

Crie um arquivo `.env.test` na raiz do projeto:

```bash
# Database (test)
DATABASE_URL=postgresql://user:password@localhost:5432/agente_petshop_test

# API
PORT=3000
NODE_ENV=test

# JWT
JWT_SECRET=test-secret-key
JWT_REFRESH_SECRET=test-refresh-secret-key

# CORS
ALLOWED_ORIGINS=http://localhost:3001,http://localhost:3000
```

---

## Testes de Integração Frontend-Backend

### Executar Todos os Testes

```bash
# Dar permissão de execução (apenas primeira vez)
chmod +x test-frontend-backend.sh

# Executar
./test-frontend-backend.sh
```

### O que é Testado

#### Fase 1: Conectividade
- ✓ Backend está rodando (porta 3000)
- ✓ Frontend está rodando (porta 3001)
- ✓ Headers CORS configurados corretamente

#### Fase 2: Autenticação
- ✓ Login com credenciais válidas
- ✓ Login com credenciais inválidas (deve retornar 401)
- ✓ Obter usuário autenticado (GET /api/auth/me)
- ✓ Renovar token (POST /api/auth/refresh)

#### Fase 3: Endpoints Protegidos
- ✓ Acesso sem token (deve retornar 401)
- ✓ Acesso com token válido (deve retornar 200)
- ✓ Acesso com token inválido (deve retornar 401)

#### Fase 4: Multi-Tenancy
- ✓ CompanyId no contexto do JWT
- ✓ Isolamento de dados entre empresas
- ✓ CompanyId adicionado automaticamente aos endpoints

#### Fase 5: Integração Frontend-Backend
- ✓ Axios interceptors (Authorization header)
- ✓ Redirect em 401 Unauthorized

#### Fase 6: APIs Específicas
- ✓ GET /api/appointments
- ✓ GET /api/appointments/services
- ✓ GET /api/conversations
- ✓ GET /api/settings

### Credenciais de Teste

As credenciais padrão estão configuradas no script:

```bash
TEST_EMAIL="feee@saraiva.ai"
TEST_PASSWORD="Sucesso2025$"
```

Para usar credenciais diferentes, edite o arquivo `test-frontend-backend.sh`.

### Exemplo de Saída

```
========================================
TESTE DE CONEXÃO FRONTEND-BACKEND
========================================

Backend URL: http://localhost:3000
Frontend URL: http://localhost:3001
API URL: http://localhost:3000/api

========================================
FASE 1: Conectividade
========================================

[TEST 1] Backend Health Check (porta 3000)
✓ PASS Backend está rodando na porta 3000

[TEST 2] Frontend Health Check (porta 3001)
✓ PASS Frontend está rodando na porta 3001

...

========================================
RELATÓRIO FINAL
========================================

Total de testes executados: 18
Testes passados: 18
Testes falhos: 0

✓ TODOS OS TESTES PASSARAM!
```

---

## Testes Unitários

### Frontend (Jest)

#### Executar Testes

```bash
cd web

# Executar todos os testes
npm test

# Executar em modo watch
npm test -- --watch

# Executar com coverage
npm test -- --coverage

# Executar teste específico
npm test -- interceptors.test.ts
```

#### Estrutura dos Testes

```
web/
├── __tests__/
│   └── api/
│       ├── interceptors.test.ts    # Testes dos interceptors Axios
│       └── auth.test.ts             # Testes de autenticação
├── __mocks__/
│   └── fileMock.js                  # Mock de arquivos estáticos
├── jest.config.js                   # Configuração do Jest
└── jest.setup.js                    # Setup global dos testes
```

#### Casos de Teste Cobertos

##### `interceptors.test.ts`

**Request Interceptor:**
- ✓ Adiciona Authorization header quando token existe
- ✓ Adiciona companyId ao query params
- ✓ NÃO adiciona companyId em endpoints de auth
- ✓ Adiciona companyId com & se URL já tiver query params
- ✓ NÃO adiciona companyId se já existir na URL

**Response Interceptor:**
- ✓ Limpa localStorage em 401 Unauthorized
- ✓ Redireciona para /login em 401
- ✓ NÃO redireciona se já estiver em /login
- ✓ Passa responses 200 sem modificação
- ✓ Rejeita errors que não sejam 401

**Integração:**
- ✓ Combina token + companyId em request autenticado
- ✓ Funciona sem token nem companyId (público)

##### `auth.test.ts`

**Login:**
- ✓ Faz login com credenciais válidas
- ✓ Salva tokens no localStorage
- ✓ Salva companyId no localStorage
- ✓ Rejeita login com credenciais inválidas
- ✓ Valida campos obrigatórios

**Logout:**
- ✓ Limpa todos os tokens
- ✓ Marca usuário como não autenticado

**Refresh Token:**
- ✓ Renova access token
- ✓ Atualiza token no localStorage
- ✓ Rejeita refresh com token inválido

**Multi-Tenancy:**
- ✓ Alterna entre empresas
- ✓ Mantém token ao trocar de empresa
- ✓ Limpa companyId no logout

#### Coverage Esperado

O objetivo é manter **70%+ de coverage** em:
- Branches
- Functions
- Lines
- Statements

### Backend (Jest + Supertest)

#### Executar Testes

```bash
# Executar todos os testes
npm test

# Executar com coverage
npm test -- --coverage

# Executar teste específico
npm test -- notifications.test.ts
```

#### Casos de Teste Existentes

- `__tests__/api/notifications.test.ts` - API de notificações
- `__tests__/api/stats.test.ts` - API de estatísticas
- `__tests__/api/services.test.ts` - API de serviços

---

## Como Adicionar Novos Testes

### 1. Teste de Integração E2E (Bash)

Adicione nova função ao `test-frontend-backend.sh`:

```bash
test_meu_novo_endpoint() {
    start_test "GET /api/meu-endpoint"

    if [ -z "$ACCESS_TOKEN" ]; then
        print_fail "Sem token de acesso"
        return 1
    fi

    response=$(curl -s -w "\n%{http_code}" -X GET "${API_URL}/meu-endpoint" \
        -H "Authorization: Bearer ${ACCESS_TOKEN}")

    http_code=$(echo "$response" | tail -n1)

    if [ "$http_code" = "200" ]; then
        print_success "Endpoint funcionando"
        return 0
    else
        print_fail "Falha no endpoint (HTTP $http_code)"
        return 1
    fi
}
```

Adicione a chamada no `main()`:

```bash
main() {
    # ... outros testes ...

    print_header "FASE X: Meus Testes"
    test_meu_novo_endpoint

    print_summary
}
```

### 2. Teste Unitário Frontend (Jest)

Crie arquivo em `/web/__tests__/`:

```typescript
// web/__tests__/meu-modulo.test.ts

describe('Meu Módulo', () => {
  it('deve fazer X', () => {
    // Arrange
    const input = 'test'

    // Act
    const result = minhaFuncao(input)

    // Assert
    expect(result).toBe('esperado')
  })

  it('deve lidar com erro Y', () => {
    expect(() => minhaFuncao(null)).toThrow('Error message')
  })
})
```

### 3. Teste de API Backend (Jest)

Crie arquivo em `/__tests__/api/`:

```typescript
// __tests__/api/minha-api.test.ts
import request from 'supertest'
import app from '../../src/index'

describe('GET /api/minha-rota', () => {
  it('deve retornar dados', async () => {
    const response = await request(app)
      .get('/api/minha-rota')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    expect(response.body).toHaveProperty('data')
  })

  it('deve retornar 401 sem auth', async () => {
    await request(app)
      .get('/api/minha-rota')
      .expect(401)
  })
})
```

---

## Estrutura de um Bom Teste

### Padrão AAA (Arrange-Act-Assert)

```typescript
it('deve fazer algo específico', () => {
  // Arrange (Preparar)
  const input = 'valor de entrada'
  const expected = 'resultado esperado'

  // Act (Agir)
  const result = minhaFuncao(input)

  // Assert (Verificar)
  expect(result).toBe(expected)
})
```

### Nomenclatura

- **Descritiva**: `deve adicionar Authorization header quando token existe`
- **Evite**: `test1`, `funciona`, `ok`

### Cobertura

Teste os casos:
1. **Happy Path** - Caminho feliz (tudo funciona)
2. **Error Cases** - Casos de erro
3. **Edge Cases** - Casos extremos
4. **Null/Undefined** - Valores nulos

Exemplo:

```typescript
describe('Função de validação de email', () => {
  // Happy path
  it('deve validar email válido', () => {
    expect(isValidEmail('test@example.com')).toBe(true)
  })

  // Error cases
  it('deve rejeitar email sem @', () => {
    expect(isValidEmail('invalid-email')).toBe(false)
  })

  // Edge cases
  it('deve lidar com email vazio', () => {
    expect(isValidEmail('')).toBe(false)
  })

  // Null/Undefined
  it('deve lidar com null', () => {
    expect(isValidEmail(null)).toBe(false)
  })
})
```

---

## Troubleshooting

### Problema: Backend não está rodando

**Erro**: `Backend não está respondendo (HTTP 000)`

**Solução**:
```bash
# Verificar se backend está rodando
curl http://localhost:3000/health

# Iniciar backend
npm run dev
```

### Problema: Frontend não está rodando

**Erro**: `Frontend não está respondendo (HTTP 000)`

**Solução**:
```bash
# Verificar se frontend está rodando
curl http://localhost:3001

# Iniciar frontend
cd web
npm run dev
```

### Problema: Login falha (401)

**Erro**: `Login falhou ou tokens não retornados`

**Causas possíveis**:
1. Credenciais incorretas
2. Usuário não existe no banco
3. Banco de dados não está rodando

**Solução**:
```bash
# Verificar se banco está rodando
psql -U postgres -c "SELECT 1"

# Verificar se usuário existe
psql -U postgres -d agente_petshop -c "SELECT * FROM users WHERE email = 'feee@saraiva.ai'"

# Criar usuário manualmente se necessário
```

### Problema: CORS Error

**Erro**: `CORS headers ausentes ou incorretos`

**Solução**: Verificar configuração CORS no backend (`src/index.ts`):

```typescript
app.use(cors({
  origin: ['http://localhost:3001', 'http://localhost:3000'],
  credentials: true,
  // ...
}))
```

### Problema: Jest tests failing

**Erro**: `Cannot find module '@/lib/api'`

**Solução**: Verificar `jest.config.js`:

```javascript
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/$1',
  // ...
}
```

### Problema: TypeError: Cannot read property of undefined

**Erro em testes**: `TypeError: Cannot read property 'getItem' of undefined`

**Solução**: Verificar se `jest.setup.js` está configurado corretamente e incluído no `jest.config.js`:

```javascript
// jest.config.js
setupFilesAfterEnv: ['<rootDir>/jest.setup.js']
```

---

## Métricas de Qualidade

### Objetivos de Coverage

| Métrica | Meta | Atual |
|---------|------|-------|
| Branches | 70% | - |
| Functions | 70% | - |
| Lines | 70% | - |
| Statements | 70% | - |

### Checklist de Qualidade

Antes de fazer commit:

- [ ] Todos os testes passam (`npm test`)
- [ ] Coverage está acima de 70% (`npm test -- --coverage`)
- [ ] Testes E2E passam (`./test-frontend-backend.sh`)
- [ ] Sem warnings no build (`npm run build`)
- [ ] Linter passou (`npm run lint`)

---

## Comandos Rápidos

```bash
# Executar TODOS os testes (E2E + Unit + Integration)
./test-frontend-backend.sh && npm test && cd web && npm test

# Apenas testes E2E
./test-frontend-backend.sh

# Apenas testes unitários frontend
cd web && npm test

# Apenas testes unitários backend
npm test

# Coverage report completo
npm test -- --coverage && cd web && npm test -- --coverage

# Watch mode (desenvolvimento)
npm test -- --watch
```

---

## Recursos Adicionais

### Documentação

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/docs/)
- [Supertest](https://github.com/visionmedia/supertest)

### Padrões de Teste

- [AAA Pattern](https://medium.com/@pjbgf/title-testing-code-ocd-and-the-aaa-pattern-df453975ab80)
- [Test Doubles](https://martinfowler.com/bliki/TestDouble.html)
- [Test Pyramid](https://martinfowler.com/articles/practical-test-pyramid.html)

---

## Contribuindo

Ao adicionar novos testes:

1. Siga o padrão AAA (Arrange-Act-Assert)
2. Nomeie testes de forma descritiva
3. Teste happy path + error cases + edge cases
4. Mantenha coverage acima de 70%
5. Documente casos de teste complexos
6. Atualize este guia se adicionar nova categoria de testes

---

**Última atualização**: 2025-10-21
**Versão**: 1.0.0
**Autor**: Agente Petshop WhatsApp Team

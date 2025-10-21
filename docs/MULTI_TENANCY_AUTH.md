# 🏢 Multi-Tenancy & Authentication System

Este documento descreve o sistema completo de multi-tenancy e autenticação implementado no AuZap.

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Autenticação JWT](#autenticação-jwt)
4. [Multi-Tenancy](#multi-tenancy)
5. [RBAC](#rbac-role-based-access-control)
6. [Guia de Uso](#guia-de-uso)
7. [Segurança](#segurança)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

O sistema AuZap agora suporta **múltiplas empresas (tenants)** com **isolamento completo de dados** e **autenticação baseada em JWT**.

### Principais Características

- ✅ **Multi-Tenancy Completo**: Cada empresa tem seus próprios dados isolados
- ✅ **Row Level Security (RLS)**: Isolamento automático no PostgreSQL
- ✅ **JWT Authentication**: Access + Refresh tokens
- ✅ **RBAC**: 4 níveis de permissão (super_admin, owner, manager, operator)
- ✅ **Seguro por Design**: Validações em múltiplas camadas

---

## 🏗️ Arquitetura

### Fluxo de Request

```
1. Cliente → Request com Bearer Token
2. auth middleware → Valida JWT
3. tenantContext middleware → Extrai company_id e seta RLS
4. Controller → Processa request
5. PostgreSQL RLS → Filtra dados automaticamente por company_id
6. Response ← Dados isolados do tenant
```

### Camadas de Segurança

```
┌─────────────────────────────────────────┐
│  1. JWT Validation (auth middleware)   │
├─────────────────────────────────────────┤
│  2. RBAC (role validation)              │
├─────────────────────────────────────────┤
│  3. Tenant Context (company_id)         │
├─────────────────────────────────────────┤
│  4. Row Level Security (PostgreSQL)     │
├─────────────────────────────────────────┤
│  5. Application Logic                   │
└─────────────────────────────────────────┘
```

---

## 🔐 Autenticação JWT

### Tokens

O sistema usa **dois tipos de tokens**:

1. **Access Token** (curta duração - 15min)
   - Usado em todas as requisições
   - Contém: userId, email, companyId, role
   - Renovado via refresh token

2. **Refresh Token** (longa duração - 7 dias)
   - Usado apenas para renovar access token
   - Armazenado no client (localStorage/cookie)
   - Revogável no servidor (futuro: Redis blacklist)

### Fluxo de Autenticação

```
┌────────┐                      ┌────────┐
│ Client │                      │ Server │
└───┬────┘                      └───┬────┘
    │                               │
    │  POST /api/auth/login         │
    │  { email, password }          │
    ├──────────────────────────────>│
    │                               │
    │  { accessToken,               │
    │    refreshToken,              │
    │    user }                     │
    │<──────────────────────────────┤
    │                               │
    │  GET /api/dashboard           │
    │  Authorization: Bearer token  │
    ├──────────────────────────────>│
    │                               │
    │  { data }                     │
    │<──────────────────────────────┤
    │                               │
    │  (access token expirou)       │
    │  POST /api/auth/refresh       │
    │  { refreshToken }             │
    ├──────────────────────────────>│
    │                               │
    │  { accessToken }              │
    │<──────────────────────────────┤
    │                               │
```

### Endpoints de Autenticação

#### 1. Register (Criar Conta)

```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "usuario@exemplo.com",
  "password": "senhaSegura123",
  "name": "Nome do Usuário",
  "companyName": "Minha Pet Shop",  # opcional
  "phone": "+5511999999999"          # opcional
}

# Response
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "email": "usuario@exemplo.com",
    "name": "Nome do Usuário",
    "companyId": 2,
    "role": "owner"
  },
  "tokens": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "expiresIn": 900  # segundos
  }
}
```

#### 2. Login

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "usuario@exemplo.com",
  "password": "senhaSegura123"
}

# Response
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "email": "usuario@exemplo.com",
    "name": "Nome do Usuário",
    "companyId": 2,
    "companyName": "Minha Pet Shop",
    "role": "owner"
  },
  "tokens": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "expiresIn": 900
  }
}
```

#### 3. Refresh Token

```bash
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGc..."
}

# Response
{
  "message": "Token refreshed successfully",
  "tokens": {
    "accessToken": "eyJhbGc...",
    "expiresIn": 900
  }
}
```

#### 4. Me (Usuário Atual)

```bash
GET /api/auth/me
Authorization: Bearer eyJhbGc...

# Response
{
  "user": {
    "id": 1,
    "email": "usuario@exemplo.com",
    "name": "Nome do Usuário",
    "phone": "+5511999999999",
    "role": "owner",
    "companyId": 2,
    "companyName": "Minha Pet Shop",
    "createdAt": "2024-10-21T00:00:00.000Z"
  }
}
```

#### 5. Logout

```bash
POST /api/auth/logout
Authorization: Bearer eyJhbGc...

# Response
{
  "message": "Logout successful"
}
```

---

## 🏢 Multi-Tenancy

### Como Funciona

Cada empresa (tenant) tem um `company_id` único. Todas as tabelas do banco têm uma coluna `company_id` que identifica a qual empresa aquele registro pertence.

O **Row Level Security (RLS)** do PostgreSQL garante que:
- Usuários só vejam dados da própria empresa
- Queries automáticas filtram por `company_id`
- Impossível acessar dados de outra empresa (mesmo com SQL injection)

### Tabelas Multi-Tenant

**Principais:**
- `users` - Usuários do sistema
- `companies` - Empresas/Tenants
- `whatsapp_sessions` - Sessões WhatsApp
- `services` - Serviços oferecidos
- `appointments` - Agendamentos
- `user_profiles` - Perfis de clientes
- `conversation_history` - Histórico de conversas
- `purchases` - Compras/vendas
- E mais 15+ tabelas...

### Configuração de Tenant Context

O tenant context é configurado automaticamente pelo middleware:

```typescript
// 1. JWT contém companyId do usuário
const token = verifyAccessToken(req.headers.authorization);
req.user.companyId = token.payload.companyId;

// 2. Middleware seta context no PostgreSQL
await db.query('SELECT set_current_company($1)', [req.user.companyId]);

// 3. RLS filtra queries automaticamente
// SELECT * FROM appointments
// → retorna apenas appointments WHERE company_id = current_company_id
```

### Uso em Services

```typescript
// Opção 1: Automático via middleware (recomendado)
router.get('/appointments', requireAuth(), tenantContext(db), async (req, res) => {
  // company_id já está setado no PostgreSQL
  const appointments = await db.query('SELECT * FROM appointments');
  // RLS filtra automaticamente por company_id
});

// Opção 2: Manual com executeWithTenant
await postgresClient.executeWithTenant(companyId, async () => {
  const result = await db.query('SELECT * FROM appointments');
  return result.rows;
});

// Opção 3: Transação com tenant
await postgresClient.transactionWithTenant(companyId, async (client) => {
  await client.query('INSERT INTO appointments ...');
  await client.query('UPDATE services ...');
  // Todas queries na transação usam mesmo company_id
});
```

---

## 👥 RBAC (Role-Based Access Control)

### Roles Disponíveis

| Role | Descrição | Permissões |
|------|-----------|------------|
| `super_admin` | Admin global | Acesso a todas empresas, todas operações |
| `owner` | Dono da empresa | Acesso total à própria empresa |
| `manager` | Gerente | Leitura/escrita na empresa, sem configurações críticas |
| `operator` | Operador | Apenas leitura (visualizar dashboard) |

### Uso de RBAC

```typescript
// Exemplo 1: Apenas authenticated users
router.get('/dashboard',
  requireAuth(),
  async (req, res) => { ... }
);

// Exemplo 2: Apenas admins (owner/manager/super_admin)
router.post('/services',
  requireAuth(),
  requireAdmin(),
  async (req, res) => { ... }
);

// Exemplo 3: Apenas super_admin
router.delete('/companies/:id',
  requireAuth(),
  requireSuperAdmin(),
  async (req, res) => { ... }
);

// Exemplo 4: Roles específicas
router.put('/settings',
  requireAuth(),
  requireRole(['owner', 'super_admin']),
  async (req, res) => { ... }
);

// Exemplo 5: Validar acesso à empresa
router.get('/companies/:id',
  requireAuth(),
  requireCompanyOwnership((req) => Number(req.params.id)),
  async (req, res) => { ... }
);
```

---

## 📖 Guia de Uso

### 1. Setup Inicial

#### Instalar Dependências
```bash
npm install
```

#### Configurar Variáveis de Ambiente
```bash
cp .env.example .env

# Editar .env e configurar:
# - JWT_ACCESS_SECRET (gere com: openssl rand -base64 32)
# - JWT_REFRESH_SECRET (gere com: openssl rand -base64 32)
# - DATABASE_URL
```

#### Executar Migrations
```bash
# Migration 008: Multi-tenancy
psql $DATABASE_URL < migrations/008_complete_multitenancy.sql

# Migration 009: Users company_id
psql $DATABASE_URL < migrations/009_add_company_to_users.sql
```

### 2. Registrar Nova Empresa

```typescript
// Frontend (React/Next.js)
const response = await fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'usuario@empresa.com',
    password: 'senhaSegura123',
    name: 'João Silva',
    companyName: 'Pet Shop do João',
    phone: '+5511999999999'
  })
});

const data = await response.json();
localStorage.setItem('accessToken', data.tokens.accessToken);
localStorage.setItem('refreshToken', data.tokens.refreshToken);
```

### 3. Login

```typescript
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'usuario@empresa.com',
    password: 'senhaSegura123'
  })
});

const data = await response.json();
localStorage.setItem('accessToken', data.tokens.accessToken);
localStorage.setItem('refreshToken', data.tokens.refreshToken);
```

### 4. Fazer Request Autenticado

```typescript
const accessToken = localStorage.getItem('accessToken');

const response = await fetch('/api/dashboard/appointments', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

// Se retornar 401 (token expirado), renovar
if (response.status === 401) {
  const refreshToken = localStorage.getItem('refreshToken');
  const refreshResponse = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });

  const newTokens = await refreshResponse.json();
  localStorage.setItem('accessToken', newTokens.tokens.accessToken);

  // Retry request com novo token
  return fetch('/api/dashboard/appointments', {
    headers: { 'Authorization': `Bearer ${newTokens.tokens.accessToken}` }
  });
}
```

### 5. Proteger Rota no Backend

```typescript
import { requireAuth, requireAdmin } from './middleware/auth';
import { tenantContextMiddleware } from './middleware/tenantContext';

// Aplicar middlewares na ordem correta
app.use('/api/auth', createAuthRoutes(db));  // Público

app.use('/api/*',
  requireAuth(),                    // 1. Validar JWT
  tenantContextMiddleware(db)       // 2. Setar tenant context
);

app.use('/api/admin/*',
  requireAuth(),                    // 1. Validar JWT
  requireAdmin(),                   // 2. Validar role
  tenantContextMiddleware(db)       // 3. Setar tenant context
);
```

---

## 🔒 Segurança

### Boas Práticas Implementadas

✅ **Senhas**
- Bcrypt com 10 rounds
- Mínimo 6 caracteres
- Nunca armazenadas em plain text

✅ **JWT**
- Secrets fortes (256 bits recomendado)
- Access token curto (15min)
- Refresh token rotação (futuro)
- issuer/audience validation

✅ **Database**
- Row Level Security (RLS)
- Prepared statements (proteção SQL injection)
- Foreign keys com ON DELETE CASCADE
- Índices para performance

✅ **HTTPS**
- Obrigatório em produção
- Helmet headers configurados

### Ameaças Mitigadas

| Ameaça | Mitigação |
|--------|-----------|
| SQL Injection | Prepared statements + RLS |
| XSS | Input sanitization (Joi) |
| CSRF | SameSite cookies (futuro) |
| Brute Force | Rate limiting (futuro) |
| Token Theft | HTTPS + httpOnly cookies |
| Data Leak | RLS + tenant validation |

### Variáveis Sensíveis

**NUNCA commitar:**
- `.env`
- JWT secrets
- Database passwords
- API keys

**Usar em produção:**
- AWS Secrets Manager
- HashiCorp Vault
- Environment variables (Docker/K8s)

---

## 🔧 Troubleshooting

### Erro: "Invalid token" / 401

**Causa:** Token expirado ou inválido

**Solução:**
```typescript
// Renovar token
const refreshResponse = await fetch('/api/auth/refresh', {
  method: 'POST',
  body: JSON.stringify({ refreshToken })
});
```

### Erro: "Company not found" / 404

**Causa:** Empresa não existe ou está inativa

**Solução:**
- Verificar se empresa existe: `SELECT * FROM companies WHERE id = X`
- Verificar se está ativa: `ativo = TRUE`
- Verificar se usuário pertence a empresa

### Erro: "Forbidden" / 403

**Causa:** Role insuficiente para operação

**Solução:**
- Verificar role do usuário: `SELECT role FROM users WHERE id = X`
- Verificar se rota requer admin: `requireAdmin()`
- Verificar se usuário pertence à empresa

### Dados de outra empresa aparecem

**Causa:** RLS não configurado ou tenant context não setado

**Solução:**
```typescript
// 1. Verificar se RLS está habilitado
SELECT tablename FROM pg_tables WHERE rowsecurity = true;

// 2. Verificar se policy existe
SELECT * FROM pg_policies WHERE tablename = 'appointments';

// 3. Setar tenant context manualmente
SELECT set_current_company(1);
SELECT * FROM appointments;  # deve retornar apenas da empresa 1
```

### Performance lenta

**Causa:** Índices faltando ou queries sem otimização

**Solução:**
```sql
-- Verificar índices
\d+ appointments

-- Adicionar índice composto se necessário
CREATE INDEX idx_appointments_company_date
ON appointments(company_id, scheduled_for);

-- Analisar query plan
EXPLAIN ANALYZE SELECT * FROM appointments WHERE company_id = 1;
```

---

## 📚 Referências

- [JWT.io](https://jwt.io/)
- [PostgreSQL RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [OWASP Authentication Cheatsheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [Multi-Tenancy Best Practices](https://docs.microsoft.com/en-us/azure/architecture/guide/multitenant/considerations/tenancy-models)

---

**Última atualização:** 21/10/2024
**Versão:** 1.0.0
**Autor:** AuZap Team

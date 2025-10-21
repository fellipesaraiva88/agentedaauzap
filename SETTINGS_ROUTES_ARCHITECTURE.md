# Settings Routes - Arquitetura e Fluxo

## Estrutura do Arquivo
```
settings-routes.ts (537 linhas)
├── Interfaces TypeScript
│   └── SettingsData (campos de configuração)
│
├── Funções de Validação
│   ├── isValidTime(time: string)
│   ├── isValidTimezone(tz: string)
│   └── validateSettings(data, isUpdate)
│
└── createSettingsRoutes(db: Pool)
    ├── GET /:companyId (linhas 140-210)
    ├── PUT /:companyId (linhas 226-370)
    └── POST / (linhas 401-530)
```

---

## Fluxo de Autenticação e Autorização

```
Cliente HTTP Request
       ↓
┌──────────────────────────────────────┐
│   Express App (src/index.ts)         │
│   /api/settings/*                    │
└──────────────────────────────────────┘
       ↓
┌──────────────────────────────────────┐
│   requireAuth()                      │
│   - Valida JWT do header             │
│   - Extrai userId, companyId, role   │
│   - Anexa req.user                   │
└──────────────────────────────────────┘
       ↓
┌──────────────────────────────────────┐
│   tenantContextMiddleware(db)        │
│   - Define tenant context no PG      │
│   - Row Level Security (RLS)         │
└──────────────────────────────────────┘
       ↓
┌──────────────────────────────────────┐
│   Settings Routes                    │
│   - Validação de companyId           │
│   - Verificação de ownership         │
│   - Validação de dados               │
│   - Query ao PostgreSQL              │
└──────────────────────────────────────┘
       ↓
┌──────────────────────────────────────┐
│   PostgreSQL                         │
│   - company_settings table           │
│   - Row Level Security ativo         │
└──────────────────────────────────────┘
       ↓
   JSON Response
```

---

## Fluxo de Validação (PUT/POST)

```
Request Body
     ↓
┌─────────────────────────────────┐
│  validateSettings()             │
│                                 │
│  Valida cada campo:             │
│  ├─ company_name (obrig)        │
│  ├─ agent_name (obrig)          │
│  ├─ opening_time (HH:MM)        │
│  ├─ closing_time (HH:MM)        │
│  ├─ max_concurrent (1-20)       │
│  ├─ timezone (IANA)             │
│  └─ reminder_*_active (bool)    │
│                                 │
│  Retorna:                       │
│  { valid: boolean,              │
│    errors: string[] }           │
└─────────────────────────────────┘
     ↓
Valid? ────┬─── NO ──→ 400 Bad Request + errors[]
           │
          YES
           ↓
   Execute SQL Query
           ↓
   Return Success (200/201)
```

---

## Segurança em Camadas

### Camada 1: Network
```
HTTPS (TLS 1.3)
Rate Limiting (100 req/15min global)
Helmet security headers
```

### Camada 2: Autenticação
```
JWT Token (RS256/HS256)
Token expiration (1h access, 7d refresh)
Header: Authorization: Bearer <token>
```

### Camada 3: Autorização
```
Role-Based Access Control (RBAC)
Company ownership validation
req.user.companyId === targetCompanyId
```

### Camada 4: Tenant Isolation
```
PostgreSQL Row Level Security (RLS)
set_current_company(company_id)
Queries automaticamente filtradas por tenant
```

### Camada 5: Validação de Dados
```
Input sanitization (trim)
Type validation (TypeScript)
Range validation (1-20)
Format validation (regex)
```

---

## Endpoints e Casos de Uso

### GET /api/settings/:companyId
**Caso de uso**: Dashboard carregar configurações na tela de settings

```typescript
// Frontend
const response = await fetch('/api/settings/1', {
  headers: { Authorization: `Bearer ${token}` }
});
const { settings } = await response.json();

// Usar settings.openingTime, settings.agentName, etc
```

**Validações**:
- Token JWT válido
- companyId é número positivo
- Usuário pertence à empresa

---

### PUT /api/settings/:companyId
**Caso de uso**: Usuário atualiza horário de funcionamento

```typescript
// Frontend
await fetch('/api/settings/1', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    opening_time: '09:00',
    closing_time: '19:00'
  })
});
```

**Validações**:
- Token JWT válido
- companyId é número positivo
- Usuário pertence à empresa
- Horários no formato HH:MM
- Ao menos um campo para atualizar

---

### POST /api/settings
**Caso de uso**: Setup inicial após criar empresa

```typescript
// Frontend (onboarding)
await fetch('/api/settings', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    companyId: newCompany.id,
    company_name: 'Pet Shop Saraiva',
    agent_name: 'Marina',
    max_concurrent_capacity: 8
  })
});
```

**Validações**:
- Token JWT válido
- companyId é número positivo
- Usuário pertence à empresa
- Empresa existe no banco
- Configurações ainda não existem
- company_name e agent_name obrigatórios

---

## Tratamento de Erros

### Erro de Validação (400)
```json
{
  "error": "Validation error",
  "message": "Invalid settings data",
  "errors": [
    "opening_time must be in format HH:MM or HH:MM:SS (e.g., 08:00)",
    "max_concurrent_capacity must be an integer between 1 and 20"
  ]
}
```

### Erro de Autorização (403)
```json
{
  "error": "Forbidden",
  "message": "You do not have access to this company settings"
}
```

### Erro Not Found (404)
```json
{
  "error": "Not found",
  "message": "Settings not found for this company"
}
```

### Erro de Conflito (409)
```json
{
  "error": "Conflict",
  "message": "Settings already exist for this company. Use PUT to update."
}
```

### Erro Interno (500)
```json
{
  "error": "Internal server error",
  "message": "Failed to fetch settings"
}
```

---

## Performance

### Query Optimization
- Índice único em `company_id` (UNIQUE constraint)
- Queries simples com prepared statements
- Connection pooling (max 20 conexões)

### Caching Strategy (futuro)
```typescript
// Redis cache para settings
GET /api/settings/:id
  → Check Redis cache
    → If hit: return cached
    → If miss: query DB → cache → return
```

### Response Size
- Settings típico: ~500 bytes JSON
- Pequeno o suficiente para não precisar paginação

---

## Testing Checklist

### Unit Tests
- [ ] Validação de horário válido/inválido
- [ ] Validação de timezone válido/inválido
- [ ] Validação de capacidade válida/inválida
- [ ] Validação de campos obrigatórios

### Integration Tests
- [ ] GET settings com token válido
- [ ] GET settings com token inválido (401)
- [ ] GET settings de outra empresa (403)
- [ ] PUT update parcial (apenas 1 campo)
- [ ] PUT update múltiplos campos
- [ ] PUT com validação falha (400)
- [ ] POST criar configurações
- [ ] POST configurações duplicadas (409)
- [ ] POST empresa inexistente (404)

### Security Tests
- [ ] Acesso sem token (401)
- [ ] Acesso com token expirado (401)
- [ ] Acesso a settings de outra empresa (403)
- [ ] SQL injection em campos de texto
- [ ] XSS em campos de texto

---

## Métricas e Observabilidade

### Logs Estruturados
```typescript
console.log('✅ Settings fetched for company 1');
console.log('✅ Settings updated for company 1');
console.log('✅ Settings created for company 1');
console.error('❌ Error fetching settings:', error);
```

### Métricas Sugeridas
- Tempo médio de resposta por endpoint
- Taxa de erro por tipo (400, 403, 404, 500)
- Número de updates por dia por empresa
- Campos mais atualizados

---

## Compatibilidade

### Frontend Frameworks
```typescript
// React/Next.js
const { data } = useSWR('/api/settings/1', fetcher);

// Vue/Nuxt
const { data } = await useFetch('/api/settings/1');

// Angular
http.get('/api/settings/1').subscribe(...);
```

### Mobile Apps
```typescript
// React Native
fetch('/api/settings/1', {
  headers: { Authorization: `Bearer ${token}` }
});

// Flutter
http.get(Uri.parse('/api/settings/1'),
  headers: {'Authorization': 'Bearer $token'}
);
```

---

**Arquitetura**: RESTful, Stateless, Multi-tenant  
**Padrões**: MVC (Model-View-Controller), Repository Pattern  
**Segurança**: Defense in Depth (5 camadas)  
**Escalabilidade**: Horizontal scaling ready

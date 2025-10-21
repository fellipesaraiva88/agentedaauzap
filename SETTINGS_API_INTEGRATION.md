# Settings API - Guia de Integração

## Arquivo Criado
**`/Users/saraiva/agentedaauzap/src/api/settings-routes.ts`**

Rotas completas de configurações da empresa com validações robustas.

---

## Endpoints Implementados

### 1. GET /api/settings/:companyId
**Buscar configurações da empresa**

**Headers:**
```
Authorization: Bearer <access_token>
```

**Resposta (200):**
```json
{
  "settings": {
    "id": 1,
    "companyId": 1,
    "companyName": "Pet Shop Saraiva",
    "agentName": "Marina",
    "openingTime": "08:00:00",
    "closingTime": "18:00:00",
    "maxConcurrentCapacity": 5,
    "timezone": "America/Sao_Paulo",
    "reminders": {
      "d1Active": true,
      "h12Active": true,
      "h4Active": true,
      "h1Active": true
    },
    "createdAt": "2025-10-21T10:00:00Z",
    "updatedAt": "2025-10-21T10:00:00Z"
  }
}
```

**Erros:**
- `400` - companyId inválido
- `403` - Sem acesso a essa empresa
- `404` - Configurações não encontradas

---

### 2. PUT /api/settings/:companyId
**Atualizar configurações da empresa**

**Headers:**
```
Authorization: Bearer <access_token>
```

**Body (todos opcionais):**
```json
{
  "company_name": "Pet Shop Saraiva Premium",
  "agent_name": "Marina Silva",
  "opening_time": "09:00",
  "closing_time": "17:00",
  "max_concurrent_capacity": 10,
  "timezone": "America/Sao_Paulo",
  "reminder_d1_active": true,
  "reminder_12h_active": false,
  "reminder_4h_active": true,
  "reminder_1h_active": true
}
```

**Resposta (200):**
```json
{
  "message": "Settings updated successfully",
  "settings": {
    "id": 1,
    "companyId": 1,
    "companyName": "Pet Shop Saraiva Premium",
    "agentName": "Marina Silva",
    "openingTime": "09:00:00",
    "closingTime": "17:00:00",
    "maxConcurrentCapacity": 10,
    "timezone": "America/Sao_Paulo",
    "reminders": {
      "d1Active": true,
      "h12Active": false,
      "h4Active": true,
      "h1Active": true
    },
    "createdAt": "2025-10-21T10:00:00Z",
    "updatedAt": "2025-10-21T11:30:00Z"
  }
}
```

**Erros:**
- `400` - Validação falhou
- `403` - Sem acesso a essa empresa
- `404` - Configurações não encontradas

---

### 3. POST /api/settings
**Criar configurações iniciais**

**Headers:**
```
Authorization: Bearer <access_token>
```

**Body:**
```json
{
  "companyId": 1,
  "company_name": "Pet Shop Saraiva",
  "agent_name": "Marina",
  "opening_time": "08:00",
  "closing_time": "18:00",
  "max_concurrent_capacity": 5,
  "timezone": "America/Sao_Paulo",
  "reminder_d1_active": true,
  "reminder_12h_active": true,
  "reminder_4h_active": true,
  "reminder_1h_active": true
}
```

**Campos com valores padrão (opcionais):**
- `opening_time`: "08:00:00"
- `closing_time`: "18:00:00"
- `max_concurrent_capacity`: 5
- `timezone`: "America/Sao_Paulo"
- `reminder_*_active`: true (todos)

**Resposta (201):**
```json
{
  "message": "Settings created successfully",
  "settings": { ... }
}
```

**Erros:**
- `400` - Validação falhou
- `403` - Sem acesso a essa empresa
- `404` - Empresa não encontrada
- `409` - Configurações já existem

---

## Validações Implementadas

### 1. Nomes
- **company_name**: Obrigatório, não vazio, máx 255 chars
- **agent_name**: Obrigatório, não vazio, máx 255 chars

### 2. Horários
- **Formato aceito**: `HH:MM` ou `HH:MM:SS`
- **Exemplos válidos**: "08:00", "18:30:00"
- **Regex**: `/^([0-1][0-9]|2[0-3]):([0-5][0-9])(:([0-5][0-9]))?$/`

### 3. Capacidade
- **Tipo**: Integer
- **Range**: 1 a 20
- **Padrão**: 5

### 4. Timezone
- **Validação**: IANA timezone válido usando `Intl.DateTimeFormat`
- **Exemplo**: "America/Sao_Paulo", "America/New_York"
- **Padrão**: "America/Sao_Paulo"

### 5. Lembretes (Booleans)
- `reminder_d1_active` - Lembrete D-1 (dia anterior)
- `reminder_12h_active` - Lembrete 12h antes
- `reminder_4h_active` - Lembrete 4h antes
- `reminder_1h_active` - Lembrete 1h antes

---

## Registro no Express

### Adicionar ao `src/index.ts`:

```typescript
// Após as outras rotas protegidas (por volta da linha 319)

if (postgresClient.isPostgresConnected()) {
  const db = postgresClient.getPool()!;

  /**
   * Settings API Routes
   * Requires: Authentication + Tenant Context
   */
  const { createSettingsRoutes } = require('./api/settings-routes');
  const settingsRouter = createSettingsRoutes(db);

  app.use('/api/settings',
    requireAuth(),                    // 1. Validate JWT
    tenantContextMiddleware(db),      // 2. Set tenant context
    settingsRouter
  );
  console.log('✅ Settings API routes registered (protected)');
}
```

---

## Segurança

### Autenticação
- Todas as rotas requerem **JWT válido**
- Token enviado via header: `Authorization: Bearer <token>`

### Autorização
- Usuário só pode acessar configurações da **própria empresa**
- Validação via `req.user.companyId === companyId`
- Super admins (se implementado) podem ter acesso global

### Tenant Isolation
- `tenantContextMiddleware` garante isolamento entre empresas
- PostgreSQL Row Level Security (RLS) aplicado automaticamente

---

## Dependências

### Tabela PostgreSQL
**Aguardando criação:** `company_settings`

**Schema esperado:**
```sql
CREATE TABLE company_settings (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES companies(id),
  company_name VARCHAR(255) NOT NULL,
  agent_name VARCHAR(255) NOT NULL,
  opening_time TIME NOT NULL DEFAULT '08:00:00',
  closing_time TIME NOT NULL DEFAULT '18:00:00',
  max_concurrent_capacity INTEGER NOT NULL DEFAULT 5,
  timezone VARCHAR(100) NOT NULL DEFAULT 'America/Sao_Paulo',
  reminder_d1_active BOOLEAN NOT NULL DEFAULT TRUE,
  reminder_12h_active BOOLEAN NOT NULL DEFAULT TRUE,
  reminder_4h_active BOOLEAN NOT NULL DEFAULT TRUE,
  reminder_1h_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(company_id)
);
```

---

## Exemplos de Uso

### 1. Buscar configurações
```bash
curl -X GET http://localhost:3000/api/settings/1 \
  -H "Authorization: Bearer eyJhbGc..."
```

### 2. Atualizar horário de funcionamento
```bash
curl -X PUT http://localhost:3000/api/settings/1 \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "opening_time": "09:00",
    "closing_time": "19:00"
  }'
```

### 3. Desabilitar lembretes de 12h
```bash
curl -X PUT http://localhost:3000/api/settings/1 \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "reminder_12h_active": false
  }'
```

### 4. Criar configurações iniciais
```bash
curl -X POST http://localhost:3000/api/settings \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "companyId": 1,
    "company_name": "Pet Shop Saraiva",
    "agent_name": "Marina",
    "max_concurrent_capacity": 8
  }'
```

---

## Mensagens de Erro

### Validação
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

### Autorização
```json
{
  "error": "Forbidden",
  "message": "You do not have access to this company settings"
}
```

### Not Found
```json
{
  "error": "Not found",
  "message": "Settings not found for this company"
}
```

---

## Checklist de Deploy

- [ ] Criar tabela `company_settings` no banco
- [ ] Adicionar rotas ao `src/index.ts`
- [ ] Testar autenticação JWT
- [ ] Testar validações de campos
- [ ] Testar isolamento multi-tenant
- [ ] Criar configurações padrão para empresas existentes

---

## Notas Técnicas

1. **Atualização Parcial**: PUT aceita atualização parcial (apenas campos enviados)
2. **Timestamps**: `created_at` e `updated_at` gerenciados automaticamente
3. **Normalização**: Strings são trimadas antes de salvar
4. **Type Safety**: TypeScript com interfaces tipadas
5. **Error Handling**: Try/catch em todas as rotas com logs detalhados

---

**Status**: ✅ Implementado e pronto para integração
**Próximo passo**: Outro agente criará a migration da tabela `company_settings`

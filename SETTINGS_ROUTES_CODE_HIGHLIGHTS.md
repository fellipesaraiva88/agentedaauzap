# Settings Routes - Code Highlights

Principais trechos de código com explicações técnicas.

---

## 1. Interface TypeScript para Validação

```typescript
interface SettingsData {
  company_name?: string;
  agent_name?: string;
  opening_time?: string;
  closing_time?: string;
  max_concurrent_capacity?: number;
  timezone?: string;
  reminder_d1_active?: boolean;
  reminder_12h_active?: boolean;
  reminder_4h_active?: boolean;
  reminder_1h_active?: boolean;
}
```

**Por que todos os campos são opcionais (`?`)?**
- PUT aceita atualização parcial (apenas campos enviados)
- POST usa valores padrão para campos não fornecidos
- Validação dinâmica decide quais campos são obrigatórios

---

## 2. Validação de Horário com Regex

```typescript
function isValidTime(time: string): boolean {
  // Aceita HH:MM ou HH:MM:SS
  const timeRegex = /^([0-1][0-9]|2[0-3]):([0-5][0-9])(:([0-5][0-9]))?$/;
  return timeRegex.test(time);
}
```

**Breakdown do Regex:**
- `([0-1][0-9]|2[0-3])` → Horas: 00-23
  - `[0-1][0-9]` → 00-19
  - `2[0-3]` → 20-23
- `([0-5][0-9])` → Minutos: 00-59
- `(:([0-5][0-9]))?` → Segundos opcionais: 00-59

**Exemplos válidos:**
- "08:00" ✅
- "18:30:00" ✅
- "23:59" ✅

**Exemplos inválidos:**
- "24:00" ❌ (hora inválida)
- "8:00" ❌ (falta zero à esquerda)
- "08:60" ❌ (minuto inválido)

---

## 3. Validação de Timezone

```typescript
function isValidTimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}
```

**Como funciona:**
- `Intl.DateTimeFormat` é API nativa JavaScript
- Lança exceção se timezone inválido
- Lista completa: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones

**Exemplos válidos:**
- "America/Sao_Paulo" ✅
- "America/New_York" ✅
- "Europe/London" ✅

**Exemplos inválidos:**
- "Brazil/East" ❌ (deprecated)
- "UTC-3" ❌ (não é IANA)
- "Sao Paulo" ❌ (formato errado)

---

## 4. Função de Validação Completa

```typescript
function validateSettings(data: SettingsData, isUpdate: boolean = false) {
  const errors: string[] = [];

  // Campos obrigatórios apenas na criação (POST)
  if (!isUpdate) {
    if (!data.company_name || data.company_name.trim().length === 0) {
      errors.push('company_name is required and cannot be empty');
    }
  }

  // Validação condicional (se campo foi enviado)
  if (data.opening_time !== undefined && !isValidTime(data.opening_time)) {
    errors.push('opening_time must be in format HH:MM or HH:MM:SS');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
```

**Estratégia de Validação:**
1. **Strict no POST**: Campos obrigatórios devem existir
2. **Lenient no PUT**: Apenas valida campos enviados
3. **Erros acumulados**: Retorna TODOS os erros de uma vez

**Vantagem para UX:**
```json
// Ruim: retornar apenas 1 erro por vez
{ "error": "company_name is required" }
// Usuário corrige, submete novamente
{ "error": "opening_time is invalid" }
// Usuário corrige, submete novamente...

// Bom: retornar todos os erros
{
  "errors": [
    "company_name is required",
    "opening_time must be in format HH:MM",
    "max_concurrent_capacity must be between 1 and 20"
  ]
}
// Usuário corrige tudo de uma vez!
```

---

## 5. GET Endpoint - Autenticação e Autorização

```typescript
router.get('/:companyId', async (req: AuthenticatedRequest, res: Response) => {
  const companyId = parseInt(req.params.companyId, 10);

  // Validação de companyId
  if (isNaN(companyId) || companyId <= 0) {
    return res.status(400).json({
      error: 'Validation error',
      message: 'Invalid companyId. Must be a positive integer.'
    });
  }

  // Verificação de ownership (usuário só acessa própria empresa)
  if (req.user && req.user.companyId !== companyId) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'You do not have access to this company settings'
    });
  }

  // Query segura com prepared statement
  const result = await db.query(
    'SELECT * FROM company_settings WHERE company_id = $1',
    [companyId]
  );
});
```

**Níveis de Segurança:**
1. **JWT Middleware**: Valida token antes de chegar aqui
2. **Input Validation**: `parseInt` + validação de range
3. **Authorization Check**: `req.user.companyId === companyId`
4. **SQL Injection Protection**: Prepared statements (`$1`)
5. **Row Level Security**: PostgreSQL RLS filtra automaticamente

---

## 6. PUT Endpoint - Atualização Dinâmica

```typescript
router.put('/:companyId', async (req: AuthenticatedRequest, res: Response) => {
  const data: SettingsData = req.body;

  // Preparar campos para atualização (apenas campos enviados)
  const updateFields: string[] = [];
  const updateValues: any[] = [];
  let paramIndex = 1;

  if (data.company_name !== undefined) {
    updateFields.push(`company_name = $${paramIndex++}`);
    updateValues.push(data.company_name.trim());
  }

  if (data.opening_time !== undefined) {
    updateFields.push(`opening_time = $${paramIndex++}`);
    updateValues.push(data.opening_time);
  }

  // ... outros campos

  // Adicionar updated_at automaticamente
  updateFields.push(`updated_at = NOW()`);

  // Adicionar WHERE clause
  updateValues.push(companyId);

  // Executar UPDATE dinâmico
  const result = await db.query(
    `UPDATE company_settings
     SET ${updateFields.join(', ')}
     WHERE company_id = $${paramIndex}
     RETURNING *`,
    updateValues
  );
});
```

**Por que UPDATE dinâmico?**

**Ruim (update todos os campos):**
```sql
UPDATE company_settings
SET company_name = $1,
    agent_name = $2,
    opening_time = $3,
    closing_time = $4,
    ...
WHERE company_id = $10
```
Problema: Precisa enviar TODOS os campos, mesmo os não alterados.

**Bom (update apenas campos enviados):**
```sql
-- Cliente enviou apenas { opening_time: "09:00" }
UPDATE company_settings
SET opening_time = $1,
    updated_at = NOW()
WHERE company_id = $2
```
Vantagem: Cliente envia apenas o que mudou.

---

## 7. POST Endpoint - Valores Padrão

```typescript
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  const data: SettingsData & { companyId: number } = req.body;

  // Criar com valores padrão para campos opcionais
  const result = await db.query(
    `INSERT INTO company_settings (
      company_id,
      company_name,
      agent_name,
      opening_time,
      closing_time,
      max_concurrent_capacity,
      timezone,
      reminder_d1_active,
      reminder_12h_active,
      reminder_4h_active,
      reminder_1h_active
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *`,
    [
      data.companyId,
      data.company_name.trim(),
      data.agent_name.trim(),
      data.opening_time || '08:00:00',        // Padrão: 8h
      data.closing_time || '18:00:00',        // Padrão: 18h
      data.max_concurrent_capacity || 5,      // Padrão: 5
      data.timezone || 'America/Sao_Paulo',   // Padrão: SP
      data.reminder_d1_active !== undefined ? data.reminder_d1_active : true,
      data.reminder_12h_active !== undefined ? data.reminder_12h_active : true,
      data.reminder_4h_active !== undefined ? data.reminder_4h_active : true,
      data.reminder_1h_active !== undefined ? data.reminder_1h_active : true
    ]
  );
});
```

**Operator `||` vs `!== undefined ? ... : default`**

```typescript
// Para valores que podem ser 0, false, ''
data.max_concurrent_capacity || 5
// Problema: se enviar 0, usa 5 (errado!)

// Correto para booleans
data.reminder_d1_active !== undefined ? data.reminder_d1_active : true
// Se enviar false, usa false
// Se não enviar, usa true
```

---

## 8. Response Formatting (snake_case → camelCase)

```typescript
const settings = result.rows[0];

res.json({
  settings: {
    id: settings.id,
    companyId: settings.company_id,        // snake → camel
    companyName: settings.company_name,    // snake → camel
    agentName: settings.agent_name,        // snake → camel
    openingTime: settings.opening_time,    // snake → camel
    closingTime: settings.closing_time,    // snake → camel
    maxConcurrentCapacity: settings.max_concurrent_capacity,
    timezone: settings.timezone,
    reminders: {
      d1Active: settings.reminder_d1_active,
      h12Active: settings.reminder_12h_active,
      h4Active: settings.reminder_4h_active,
      h1Active: settings.reminder_1h_active
    },
    createdAt: settings.created_at,
    updatedAt: settings.updated_at
  }
});
```

**Por que converter?**
- **Banco de dados**: Convenção PostgreSQL usa `snake_case`
- **JavaScript/TypeScript**: Convenção usa `camelCase`
- **Consistência de API**: Todas as APIs RESTful usam camelCase

**Alternativa (não usada aqui):**
```typescript
// Usar biblioteca como camelcase-keys
import camelcaseKeys from 'camelcase-keys';

const settings = camelcaseKeys(result.rows[0]);
// Automático, mas menos explícito
```

---

## 9. Error Handling Pattern

```typescript
try {
  // ... lógica da rota
} catch (error) {
  console.error('❌ Error fetching settings:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: 'Failed to fetch settings'
  });
}
```

**Por que não retornar detalhes do erro?**

```typescript
// NUNCA FAZER ISSO:
catch (error) {
  res.status(500).json({
    error: error.message,  // ❌ Pode vazar info do banco!
    stack: error.stack     // ❌ Expõe estrutura interna!
  });
}

// FAZER ISSO:
catch (error) {
  console.error('Error:', error);  // ✅ Log interno
  res.status(500).json({
    error: 'Internal server error', // ✅ Mensagem genérica
    message: 'Failed to ...'        // ✅ Contexto genérico
  });
}
```

**Benefícios:**
1. **Segurança**: Não vaza informações sensíveis
2. **UX**: Mensagem amigável ao usuário
3. **Debugging**: Log completo para desenvolvedores

---

## 10. TypeScript Type Safety

```typescript
// Request é tipado
router.get('/:companyId', async (req: AuthenticatedRequest, res: Response) => {
  // req.user é tipado com:
  // { id: number, email: string, companyId: number, role: string }
  
  const userCompanyId = req.user?.companyId;  // TypeScript sabe o tipo!
  //    ^? number | undefined

  // Autocomplete funciona!
  if (req.user) {
    req.user.  // IDE sugere: id, email, companyId, role
  }
});
```

**Vantagens do TypeScript:**
1. Autocomplete no VS Code
2. Erros de tipo em tempo de desenvolvimento
3. Refactoring seguro
4. Documentação inline

---

## Performance Tips

### 1. Evitar N+1 Queries
```typescript
// Ruim ❌
for (const setting of settings) {
  const company = await db.query('SELECT * FROM companies WHERE id = $1', [setting.company_id]);
}

// Bom ✅
const result = await db.query(`
  SELECT s.*, c.nome as company_name
  FROM company_settings s
  LEFT JOIN companies c ON s.company_id = c.id
  WHERE s.company_id = $1
`, [companyId]);
```

### 2. Usar Prepared Statements
```typescript
// Ruim ❌ (SQL injection + sem cache)
await db.query(`SELECT * FROM settings WHERE id = ${id}`);

// Bom ✅ (seguro + query plan cache)
await db.query('SELECT * FROM settings WHERE id = $1', [id]);
```

### 3. Limitar Campos no SELECT
```typescript
// Ruim ❌ (retorna campos desnecessários)
SELECT * FROM company_settings

// Bom ✅ (apenas campos usados)
SELECT id, company_name, opening_time, closing_time
FROM company_settings
```

---

**Arquivo completo:** `/Users/saraiva/agentedaauzap/src/api/settings-routes.ts`  
**Total de linhas:** 537  
**Cobertura:** Validações, Segurança, Error Handling, Type Safety

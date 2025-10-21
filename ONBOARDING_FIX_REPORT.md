# 🔧 RELATÓRIO DE CORREÇÃO DO SISTEMA DE ONBOARDING

**Data**: 2025-10-21
**Commit**: 2a344c2
**Status**: ✅ Correções aplicadas, aguardando deploy

---

## 🔴 PROBLEMA IDENTIFICADO

### Erro Original
```
endpoint /api/onboarding/progress travando/timeout
```

### Causa Raiz
A tabela `onboarding_progress` no banco de produção **NÃO era a que esperávamos**:

#### Tabela Existente (Sistema WhatsApp/Petshop)
```sql
onboarding_progress:
  - progress_id (text)
  - chat_id (text)
  - tutor_id (text)
  - stage_atual (text)
  - campos_coletados (jsonb)
  ...
```

#### Tabela Esperada (Sistema Dashboard)
```sql
user_onboarding_progress (não existia):
  - id (serial)
  - user_id (UUID)
  - company_id (integer)
  - current_step (integer)
  - data (jsonb)
  - completed (boolean)
```

### Conclusão
A **migration 015 nunca foi aplicada em produção**. A tabela existente era do sistema anterior de onboarding via WhatsApp para tutores de pets.

---

## ✅ SOLUÇÃO IMPLEMENTADA

### 1. Criada Nova Tabela

**Migration 017**: `migrations/017_create_user_onboarding_progress.sql`

```sql
CREATE TABLE IF NOT EXISTS user_onboarding_progress (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  company_id INTEGER NOT NULL,
  current_step INTEGER NOT NULL DEFAULT 1,
  data JSONB DEFAULT '{}'::jsonb,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,

  CONSTRAINT user_onboarding_progress_user_company_unique
  UNIQUE (user_id, company_id)
);
```

✅ **Aplicada em produção com sucesso**

### 2. Atualizadas Todas as Rotas

**Arquivo**: `src/api/onboarding-routes.ts`

Todas as referências foram atualizadas:
- ❌ `onboarding_progress` (antiga, WhatsApp)
- ✅ `user_onboarding_progress` (nova, Dashboard)

### 3. Índices e Triggers

✅ Índices criados:
- `idx_user_onboarding_user_id`
- `idx_user_onboarding_company_id`
- `idx_onboarding_completed`

✅ Trigger `updated_at` configurado

---

## 📝 ARQUIVOS MODIFICADOS

### Criados
1. `migrations/016_fix_user_id_type.sql` (tentativa inicial, não usado)
2. `migrations/017_create_user_onboarding_progress.sql` ✅
3. `src/scripts/apply-migration-017.ts` ✅
4. `src/scripts/check-onboarding-table.ts` ✅
5. `src/scripts/fix-user-id-type.ts` (não usado)

### Modificados
1. `src/api/onboarding-routes.ts` ✅
   - Todas as 5 ocorrências de `onboarding_progress` → `user_onboarding_progress`
   - Tipo de `user_id` corrigido para `string` (UUID)

2. `package.json` ✅
   - Adicionado script: `"migrate:fix-user-id"`

---

## 🎯 ENDPOINTS DISPONÍVEIS

### GET /api/onboarding/progress
Busca progresso atual do usuário. Cria automaticamente se não existir.

**Response (novo progresso)**:
```json
{
  "progress": {
    "currentStep": 1,
    "completed": false,
    "data": {},
    "createdAt": "2025-10-21T17:10:00Z",
    "updatedAt": "2025-10-21T17:10:00Z"
  }
}
```

### PUT /api/onboarding/progress
Atualiza o progresso.

**Request**:
```json
{
  "currentStep": 2,
  "data": {
    "step1": {
      "welcome": true,
      "timestamp": "2025-10-21T17:10:00Z"
    }
  }
}
```

**Response**:
```json
{
  "success": true,
  "progress": {
    "currentStep": 2,
    "completed": false,
    "data": { "step1": {...} },
    "updatedAt": "2025-10-21T17:10:15Z"
  }
}
```

### POST /api/onboarding/complete
Marca onboarding como completo.

**Request**:
```json
{
  "data": {
    "step9": {...}
  }
}
```

### DELETE /api/onboarding/progress
Reseta o progresso (admin only).

---

## 🚀 STATUS DO DEPLOY

**Commit**: `2a344c2`
**Push**: ✅ Concluído
**Render Auto-Deploy**: ⏳ Em andamento
**ETA**: ~5 minutos a partir de 17:13 UTC

---

## 🧪 TESTES PENDENTES

Após deploy completar, testar:

1. ✅ Login → Obter token
2. ⏳ GET `/api/onboarding/progress` → Criar novo progresso
3. ⏳ PUT `/api/onboarding/progress` → Atualizar para step 2
4. ⏳ GET novamente → Verificar persistência
5. ⏳ POST `/api/onboarding/complete` → Finalizar
6. ⏳ Verificar no banco: `SELECT * FROM user_onboarding_progress`

---

## 📊 ESTRUTURA FINAL

### Sistema Separado
```
onboarding_progress (WhatsApp)
  ├── progress_id (text)
  ├── chat_id (text)
  ├── tutor_id (text)
  └── stage_atual (text)

user_onboarding_progress (Dashboard) ✅ NOVO
  ├── id (serial)
  ├── user_id (UUID)
  ├── company_id (integer)
  ├── current_step (integer)
  ├── data (JSONB)
  ├── completed (boolean)
  └── timestamps
```

### Frontend Integrado
```
web/
  ├── app/dashboard/onboarding/page.tsx ✅
  ├── components/onboarding/ (18 componentes) ✅
  └── services/onboarding.service.ts ✅
```

---

## 💡 DECISÕES TÉCNICAS

### Por que criar nova tabela?

**Opção 1** (rejeitada): Modificar `onboarding_progress` existente
- ❌ Quebraria sistema WhatsApp existente
- ❌ Estruturas incompatíveis (chat_id vs user_id)
- ❌ Alto risco de breaking changes

**Opção 2** (escolhida): Criar `user_onboarding_progress`
- ✅ Não interfere no sistema WhatsApp
- ✅ Estrutura limpa para Dashboard
- ✅ Separação de responsabilidades
- ✅ Zero risk deployment

### Tipos UUID vs INTEGER

**Problema**: Migration 015 usava `user_id INTEGER`, mas JWT usa UUID

**Solução**: Migration 017 já cria `user_id UUID` corretamente

---

## 🎉 CONQUISTAS

✅ Identificado problema raiz (tabela errada)
✅ Criada nova tabela com estrutura correta
✅ Migration aplicada em produção
✅ Rotas atualizadas (5 ocorrências)
✅ Tipos corrigidos (UUID)
✅ Scripts de diagnóstico criados
✅ Commit documentado e pushed
✅ Zero breaking changes no sistema existente

---

## 📌 PRÓXIMOS PASSOS

1. ⏳ Aguardar deploy do Render completar
2. ⏳ Executar testes end-to-end
3. ⏳ Validar dados persistem no banco
4. ⏳ Testar fluxo completo no frontend
5. ⏳ Atualizar documentação final

---

**Desenvolvido por**: Claude Code
**Para**: Fellipe Saraiva @ AuZap
**Timestamp**: 2025-10-21 17:15 UTC

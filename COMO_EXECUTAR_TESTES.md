# COMO EXECUTAR OS TESTES - GUIA PRÁTICO

Este guia mostra exatamente o que fazer para executar os testes do sistema.

---

## PASSO 1: Testes Unitários (Já Funcionando ✅)

### Executar Agora

```bash
cd /Users/saraiva/agentedaauzap/web
npm test
```

### Resultado Esperado

```
PASS __tests__/api/auth.test.ts
PASS __tests__/api/interceptors.test.ts
PASS __tests__/example-integration.test.ts

Test Suites: 3 passed, 3 total
Tests:       46 passed, 46 total
Snapshots:   0 total
Time:        2.566 s
Ran all test suites.
```

✅ **STATUS**: Funcionando (46/46 testes passando)

---

## PASSO 2: Testes E2E (Requer Backend Rodando)

### Pré-requisito: Iniciar Serviços

Você precisa de **3 terminais**:

#### Terminal 1: Backend

```bash
cd /Users/saraiva/agentedaauzap
npm run dev
```

**Aguarde até ver**:
```
✅ Servidor rodando na porta 3000
✅ PostgreSQL: Conexão verificada e funcionando!
```

#### Terminal 2: Frontend

```bash
cd /Users/saraiva/agentedaauzap/web
npm run dev
```

**Aguarde até ver**:
```
✓ Ready in 3.5s
○ Local:   http://localhost:3001
```

#### Terminal 3: Executar Testes E2E

```bash
cd /Users/saraiva/agentedaauzap
./test-frontend-backend.sh
```

### Resultado Esperado

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

[TEST 3] CORS Headers
✓ PASS CORS headers configurados corretamente

========================================
FASE 2: Autenticação
========================================

[TEST 4] POST /api/auth/login
✓ PASS Login realizado com sucesso
ℹ INFO Access Token: eyJhbGciOiJIUzI1NiI...
ℹ INFO Company ID: 1
ℹ INFO User ID: 1

[TEST 5] POST /api/auth/login com credenciais inválidas
✓ PASS Login bloqueado corretamente (HTTP 401)

[TEST 6] GET /api/auth/me (usuário autenticado)
✓ PASS Usuário autenticado retornado com sucesso
ℹ INFO Email validado: feee@saraiva.ai

[TEST 7] POST /api/auth/refresh (renovar token)
✓ PASS Token renovado com sucesso
ℹ INFO Novo Access Token: eyJhbGciOiJIUzI1NiI...

========================================
FASE 3: Endpoints Protegidos
========================================

[TEST 8] GET /api/dashboard/stats sem autenticação
✓ PASS Endpoint protegido bloqueou acesso não autenticado (HTTP 401)

[TEST 9] GET /api/dashboard/stats com autenticação
✓ PASS Endpoint protegido acessado com sucesso

[TEST 10] GET /api/dashboard/stats com token inválido
✓ PASS Token inválido bloqueado corretamente (HTTP 401)

========================================
FASE 4: Multi-Tenancy
========================================

[TEST 11] Verificar companyId em endpoints multi-tenant
✓ PASS Endpoint multi-tenant acessado com sucesso
ℹ INFO Company ID no contexto: 1

[TEST 12] Isolamento de dados entre empresas
✓ PASS Isolamento multi-tenant funcionando corretamente
ℹ INFO Dados retornados apenas da empresa 1

========================================
FASE 5: Integração Frontend-Backend
========================================

[TEST 13] Axios interceptors (token e companyId)
✓ PASS Interceptors funcionando (Authorization + CORS)

[TEST 14] Redirect em 401 (Unauthorized)
✓ PASS Endpoint retorna 401 corretamente (frontend deve redirecionar)
ℹ INFO Frontend deve limpar localStorage e redirecionar para /login

========================================
FASE 6: APIs Específicas
========================================

[TEST 15] GET /api/appointments (lista de agendamentos)
✓ PASS API de appointments funcionando

[TEST 16] GET /api/appointments/services (lista de serviços)
✓ PASS API de serviços funcionando

[TEST 17] GET /api/conversations (lista de conversas)
✓ PASS API de conversas funcionando

[TEST 18] GET /api/settings (configurações da empresa)
✓ PASS API de settings funcionando

========================================
RELATÓRIO FINAL
========================================

Total de testes executados: 18
Testes passados: 18
Testes falhos: 0

✓ TODOS OS TESTES PASSARAM!
```

---

## TROUBLESHOOTING

### Problema 1: Backend não está rodando

**Erro**:
```
[TEST 1] Backend Health Check (porta 3000)
✗ FAIL Backend não está respondendo (HTTP 000)
```

**Solução**:
```bash
# Terminal 1
cd /Users/saraiva/agentedaauzap
npm run dev
```

### Problema 2: Frontend não está rodando

**Erro**:
```
[TEST 2] Frontend Health Check (porta 3001)
✗ FAIL Frontend não está respondendo (HTTP 000)
```

**Solução**:
```bash
# Terminal 2
cd /Users/saraiva/agentedaauzap/web
npm run dev
```

### Problema 3: Login falha (401)

**Erro**:
```
[TEST 4] POST /api/auth/login
✗ FAIL Login falhou ou tokens não retornados
```

**Causa**: Usuário não existe no banco

**Solução**: Criar usuário pela API de registro:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "feee@saraiva.ai",
    "password": "Sucesso2025$",
    "name": "Teste User",
    "companyName": "Saraiva Pets"
  }'
```

### Problema 4: PostgreSQL não está conectado

**Erro no backend**:
```
❌ PostgreSQL: Teste falhou - verifique configuração
```

**Solução**:

1. Verificar se PostgreSQL está rodando:
```bash
pg_isready
```

2. Verificar variáveis de ambiente no `.env`:
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/agente_petshop
```

3. Testar conexão:
```bash
psql $DATABASE_URL -c "SELECT 1"
```

### Problema 5: Script não tem permissão de execução

**Erro**:
```bash
bash: ./test-frontend-backend.sh: Permission denied
```

**Solução**:
```bash
chmod +x /Users/saraiva/agentedaauzap/test-frontend-backend.sh
```

---

## COMANDOS RÁPIDOS

### Executar Tudo

```bash
# Terminal 1: Backend
cd /Users/saraiva/agentedaauzap && npm run dev

# Terminal 2: Frontend
cd /Users/saraiva/agentedaauzap/web && npm run dev

# Terminal 3: Testes
cd /Users/saraiva/agentedaauzap && ./test-frontend-backend.sh
```

### Apenas Testes Unitários

```bash
cd /Users/saraiva/agentedaauzap/web
npm test
```

### Watch Mode (Desenvolvimento)

```bash
cd /Users/saraiva/agentedaauzap/web
npm test -- --watch
```

### Coverage Report

```bash
cd /Users/saraiva/agentedaauzap/web
npm test -- --coverage
```

### Teste Específico

```bash
cd /Users/saraiva/agentedaauzap/web
npm test -- interceptors.test.ts
```

---

## CHECKLIST

Antes de executar os testes E2E, verifique:

- [ ] PostgreSQL está rodando
- [ ] Backend está rodando (porta 3000)
- [ ] Frontend está rodando (porta 3001)
- [ ] Usuário `feee@saraiva.ai` existe no banco
- [ ] Script tem permissão de execução (`chmod +x`)

---

## ARQUIVOS DE REFERÊNCIA

### Documentação

1. **TESTING_GUIDE.md** - Guia completo (200+ linhas)
2. **TEST_REPORT.md** - Relatório detalhado
3. **FINAL_TEST_RESULTS.md** - Resultados finais
4. **QUICK_TEST_SUMMARY.md** - Resumo rápido
5. **COMO_EXECUTAR_TESTES.md** - Este arquivo

### Testes

1. **test-frontend-backend.sh** - Script E2E (18 testes)
2. **web/__tests__/api/interceptors.test.ts** - Testes de interceptors (20 testes)
3. **web/__tests__/api/auth.test.ts** - Testes de autenticação (18 testes)
4. **web/__tests__/example-integration.test.ts** - Exemplos (8 testes)

---

## RESUMO

### O Que Você Tem Agora

✅ **46 testes unitários** funcionando (frontend)
✅ **18 testes E2E** prontos (backend+frontend)
✅ **Script automatizado** para testes de integração
✅ **Documentação completa** com exemplos

### O Que Fazer Agora

1. **Executar testes unitários**: `cd web && npm test` ✅
2. **Iniciar backend**: `npm run dev`
3. **Iniciar frontend**: `cd web && npm run dev`
4. **Executar testes E2E**: `./test-frontend-backend.sh`

### Resultado Esperado

- ✅ 46/46 testes unitários passando
- ✅ 18/18 testes E2E passando
- ✅ **Total: 64 testes validando o sistema**

---

**Pronto para uso!** 🚀

Execute os comandos acima e veja os testes em ação.

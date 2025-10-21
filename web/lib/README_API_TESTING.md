# API Testing Guide

Guia completo para testar a conexão do frontend com o backend.

---

## 🚀 Quick Start

### 1. Teste Rápido de Conectividade

```typescript
import { testConnectivity } from '@/lib/api-test'

// Em qualquer componente ou página
const isConnected = await testConnectivity()
```

**Resultado:**
- ✅ Mostra toast de sucesso se conectado
- ❌ Mostra toast de erro se não conectado
- Console log com detalhes

---

### 2. Testar Todos os Endpoints

```typescript
import { testAllEndpoints } from '@/lib/api-test'

const summary = await testAllEndpoints()

console.log(`
  Total: ${summary.total}
  Passou: ${summary.passed}
  Falhou: ${summary.failed}
  Duração: ${summary.duration}ms
`)
```

---

### 3. Testar Endpoint Específico

```typescript
import { testEndpoint } from '@/lib/api-test'

const result = await testEndpoint('health')

if (result.status === 'success') {
  console.log('✅ OK!', result.responseTime + 'ms')
} else {
  console.error('❌ Erro:', result.error)
}
```

---

## 📦 Endpoints Disponíveis

| Endpoint | Descrição | Requer Auth |
|----------|-----------|-------------|
| `health` | Health check do backend | Não |
| `dashboard/stats` | Estatísticas do dashboard | Sim |
| `dashboard/impact` | Métricas de impacto | Sim |
| `companies` | Lista de empresas | Sim |
| `settings` | Configurações da empresa | Sim |
| `conversations` | Conversas WhatsApp | Sim |
| `appointments` | Agendamentos | Sim |
| `services` | Serviços oferecidos | Sim |
| `stats/dashboard` | Dashboard de stats | Sim |
| `notifications` | Notificações | Sim |
| `pets` | Pets cadastrados | Sim |
| `tutors` | Tutores/clientes | Sim |
| `whatsapp/sessions` | Sessões WhatsApp | Sim |

---

## 🎨 Componente Visual

### Criar Página de Dev Tools

**1. Criar arquivo `/app/dashboard/dev/page.tsx`:**

```tsx
import ApiTester from '@/components/dev/ApiTester'

export default function DevToolsPage() {
  return (
    <div className="container mx-auto py-8">
      <ApiTester />
    </div>
  )
}
```

**2. Acessar:** `http://localhost:3001/dashboard/dev`

**Funcionalidades:**
- ✅ Status da configuração do backend
- ✅ Teste de conectividade com um clique
- ✅ Teste todos os endpoints
- ✅ Teste endpoint específico
- ✅ Histórico de resultados com tempo de resposta
- ✅ Visualização de erros detalhados

---

## 🔧 Validação de Configuração

### Verificar se .env.local está correto

```typescript
import { logConfigValidation, checkBackendConfig } from '@/lib/config-validator'

// Log completo no console
logConfigValidation()

// Apenas verificar
const config = checkBackendConfig()

if (!config.valid) {
  console.error('Problemas de configuração:', config.issues)
}

console.log('API URL:', config.url)
```

**Validações:**
- ✅ NEXT_PUBLIC_API_URL está definida
- ✅ URL tem formato válido
- ✅ Protocolo é HTTP ou HTTPS
- ⚠️ Aviso se usar localhost em produção
- ⚠️ Aviso se usar HTTP em produção

---

## 📊 Resultados dos Testes

### Estrutura do TestResult

```typescript
interface TestResult {
  endpoint: string        // Nome do endpoint testado
  method: string          // HTTP method (GET, POST, etc)
  status: 'success' | 'error' | 'warning'
  message: string         // Mensagem de status
  responseTime?: number   // Tempo em ms
  data?: any             // Dados da resposta (se sucesso)
  error?: string         // Mensagem de erro (se falha)
}
```

### Estrutura do TestSummary

```typescript
interface TestSummary {
  total: number          // Total de testes executados
  passed: number         // Testes que passaram
  failed: number         // Testes que falharam
  warnings: number       // Testes com warnings
  duration: number       // Duração total em ms
  results: TestResult[]  // Array com todos os resultados
}
```

---

## 🎯 Exemplos de Uso

### Exemplo 1: Verificar Backend ao Iniciar App

```tsx
// app/layout.tsx
'use client'

import { useEffect } from 'react'
import { testConnectivity } from '@/lib/api-test'

export default function RootLayout({ children }) {
  useEffect(() => {
    // Verificar conectividade ao carregar app
    testConnectivity()
  }, [])

  return (
    <html>
      <body>{children}</body>
    </html>
  )
}
```

---

### Exemplo 2: Dashboard com Status de API

```tsx
// app/dashboard/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { testConnectivity } from '@/lib/api-test'

export default function Dashboard() {
  const [apiStatus, setApiStatus] = useState<'loading' | 'connected' | 'error'>('loading')

  useEffect(() => {
    const checkApi = async () => {
      const connected = await testConnectivity()
      setApiStatus(connected ? 'connected' : 'error')
    }

    checkApi()
  }, [])

  return (
    <div>
      <h1>Dashboard</h1>

      {/* Status Badge */}
      <div className="flex items-center space-x-2">
        <span>API Status:</span>
        {apiStatus === 'loading' && <span>🔄 Checking...</span>}
        {apiStatus === 'connected' && <span className="text-green-600">✅ Connected</span>}
        {apiStatus === 'error' && <span className="text-red-600">❌ Disconnected</span>}
      </div>
    </div>
  )
}
```

---

### Exemplo 3: Testes Automatizados no CI/CD

```typescript
// scripts/test-api.ts
import { testAllEndpoints } from '@/lib/api-test'

async function runTests() {
  console.log('Running API tests...')

  const summary = await testAllEndpoints({
    showToast: false,
    skipAuth: true  // Skip auth tests in CI
  })

  console.log(`
    ✅ Passed: ${summary.passed}
    ❌ Failed: ${summary.failed}
    ⏱️  Duration: ${summary.duration}ms
  `)

  // Exit with error if tests failed
  if (summary.failed > 0) {
    process.exit(1)
  }
}

runTests()
```

---

### Exemplo 4: Monitorar Tempo de Resposta

```typescript
import { testEndpoint } from '@/lib/api-test'

async function monitorApiPerformance() {
  const endpoints = ['health', 'dashboard/stats', 'appointments']

  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint, { showToast: false })

    if (result.responseTime && result.responseTime > 1000) {
      console.warn(`⚠️ Slow response: ${endpoint} took ${result.responseTime}ms`)
    }
  }
}

// Rodar a cada 5 minutos
setInterval(monitorApiPerformance, 5 * 60 * 1000)
```

---

## 🐛 Troubleshooting

### Problema: "Network error"

**Causas:**
- Backend não está rodando
- URL errada no .env.local
- Problemas de CORS

**Solução:**
```bash
# 1. Verificar se backend está rodando
curl http://localhost:3000/health

# 2. Verificar .env.local
cat .env.local | grep API_URL

# 3. Ver logs de erro
npm run dev
# Abrir console do browser (F12)
```

---

### Problema: "401 Unauthorized"

**Causas:**
- Token expirado
- Token não está sendo enviado
- Usuário não está autenticado

**Solução:**
```typescript
// 1. Verificar se há token
const token = localStorage.getItem('token')
console.log('Token:', token)

// 2. Fazer login novamente
// 3. Testar endpoints que não requerem auth
await testEndpoint('health')
```

---

### Problema: "403 Forbidden"

**Causas:**
- Usuário não tem permissão
- Company ID incorreto

**Solução:**
```typescript
// Verificar company ID
const companyId = localStorage.getItem('selectedCompanyId')
console.log('Company ID:', companyId)

// Verificar role do usuário
import { useAuth } from '@/hooks/useAuth'
const { user } = useAuth()
console.log('User role:', user?.role)
```

---

## 📝 Checklist de Troubleshooting

- [ ] Backend está rodando? (`curl http://localhost:3000/health`)
- [ ] .env.local está correto? (`NEXT_PUBLIC_API_URL=http://localhost:3000/api`)
- [ ] Token está presente? (`localStorage.getItem('token')`)
- [ ] Company ID está definido? (`localStorage.getItem('selectedCompanyId')`)
- [ ] Usuário está autenticado? (Fazer login)
- [ ] Console do browser tem erros? (Abrir F12)
- [ ] CORS está configurado no backend?

---

## 🔗 Links Úteis

- **Relatório completo:** `/FRONTEND_API_OPTIMIZATION_REPORT.md`
- **Sumário:** `/FRONTEND_SUMMARY.md`
- **Código-fonte:**
  - `/web/lib/api-test.ts`
  - `/web/lib/config-validator.ts`
  - `/web/components/dev/ApiTester.tsx`

---

## 💡 Dicas

1. **Use o componente ApiTester** durante desenvolvimento para testar rapidamente
2. **Configure monitoramento** de performance em produção
3. **Rode os testes** antes de cada deploy
4. **Verifique logs** do backend em caso de erros
5. **Use testConnectivity()** para verificar conexão antes de operações críticas

---

**Última atualização:** 21 de Outubro de 2025

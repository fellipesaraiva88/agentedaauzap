# Conexão Frontend ↔ Backend

## 🔗 Configuração da Conexão

### Backend (Express - Porta 3000)

**Localização:** `/src/index.ts`

Todas as rotas da API estão prefixadas com `/api`:

```typescript
app.use('/api/auth', authRouter)
app.use('/api/dashboard', dashboardRouter)
app.use('/api/whatsapp', whatsappRouter)
app.use('/api/appointments', appointmentsRouter)
app.use('/api/services', servicesRouter)
app.use('/api/conversations', conversationsRouter)
app.use('/api/settings', settingsRouter)
app.use('/api/companies', companiesRouter)
app.use('/api/stats', statsRouter)
app.use('/api/ai', aiRouter)
```

**CORS configurado para:**
- `http://localhost:3001` (Frontend Next.js)
- `http://localhost:3000` (Backend)

### Frontend (Next.js - Porta 3001)

**Localização:** `/web/lib/api.ts`

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
})
```

**Variáveis de Ambiente:** `/web/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_APP_NAME=Agente Pet Shop
NEXT_PUBLIC_COMPANY_ID=1
```

## 🔐 Sistema de Autenticação

O frontend usa **interceptors** do Axios para:

1. **Adicionar token JWT automaticamente:**
   ```typescript
   const token = localStorage.getItem('token')
   if (token) {
     config.headers.Authorization = `Bearer ${token}`
   }
   ```

2. **Adicionar companyId para multi-tenancy:**
   ```typescript
   const companyId = localStorage.getItem('selectedCompanyId')
   if (companyId) {
     config.url = `${config.url}?companyId=${companyId}`
   }
   ```

3. **Redirecionar para login em caso de 401:**
   ```typescript
   if (error.response?.status === 401) {
     localStorage.removeItem('token')
     localStorage.removeItem('selectedCompanyId')
     window.location.href = '/login'
   }
   ```

## 📡 Fluxo de Requisição

```
┌─────────────────┐
│  Frontend       │
│  (Next.js)      │
│  Port: 3001     │
└────────┬────────┘
         │
         │ HTTP Request
         │ GET /api/dashboard
         │ Authorization: Bearer <token>
         │ ?companyId=1
         │
         ▼
┌─────────────────┐
│  CORS           │
│  Middleware     │
└────────┬────────┘
         │ ✅ Allowed
         ▼
┌─────────────────┐
│  JWT Auth       │
│  Middleware     │
└────────┬────────┘
         │ ✅ Valid Token
         ▼
┌─────────────────┐
│  Backend        │
│  (Express)      │
│  Port: 3000     │
└────────┬────────┘
         │
         │ JSON Response
         ▼
┌─────────────────┐
│  Frontend       │
│  Updates UI     │
└─────────────────┘
```

## 🚀 Como Iniciar

### 1. Backend
```bash
cd /Users/saraiva/agentedaauzap
npm install
npm start
# Rodando em http://localhost:3000
```

### 2. Frontend
```bash
cd /Users/saraiva/agentedaauzap/web
npm install
npm run dev
# Rodando em http://localhost:3001
```

### 3. Acessar Aplicação
```
http://localhost:3001
```

Login padrão:
- **Email:** feee@saraiva.ai
- **Senha:** Sucesso2025$

## 🌐 Deploy em Produção

### Backend (Render)

Variável de ambiente necessária:
```env
# No Render, configurar:
CORS_ORIGIN=https://seu-frontend.vercel.app
```

Atualizar CORS em `/src/index.ts`:
```typescript
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
  credentials: true,
  // ...
}))
```

### Frontend (Vercel/Render)

Variável de ambiente:
```env
NEXT_PUBLIC_API_URL=https://seu-backend.render.com/api
```

## 🧪 Testando a Conexão

### 1. Teste Manual

Abra o console do navegador em `http://localhost:3001` e execute:

```javascript
// Deve mostrar: "🔗 API conectando em: http://localhost:3000/api"
```

### 2. Teste de API

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"feee@saraiva.ai","password":"Sucesso2025$"}'

# Dashboard (com token)
curl http://localhost:3000/api/dashboard \
  -H "Authorization: Bearer <seu-token>"
```

### 3. Verificar Network Tab

1. Abra DevTools → Network
2. Faça login no frontend
3. Verifique:
   - ✅ Request URL: `http://localhost:3000/api/auth/login`
   - ✅ Status: 200
   - ✅ Headers: `Authorization: Bearer ...`

## 🔧 Troubleshooting

### Erro: "Network Error" / "ERR_CONNECTION_REFUSED"

**Causa:** Backend não está rodando

**Solução:**
```bash
cd /Users/saraiva/agentedaauzap
npm start
```

### Erro: "CORS policy"

**Causa:** URL do frontend não está na whitelist do CORS

**Solução:** Adicionar em `/src/index.ts`:
```typescript
origin: ['http://localhost:3001', 'http://localhost:3000', 'https://seu-dominio.com']
```

### Erro: 401 Unauthorized

**Causa:** Token inválido ou expirado

**Solução:**
1. Fazer logout
2. Limpar localStorage
3. Fazer login novamente

### Erro: "companyId" undefined

**Causa:** selectedCompanyId não está no localStorage

**Solução:**
```javascript
localStorage.setItem('selectedCompanyId', '1')
```

## 📋 Checklist de Conexão

- [ ] Backend rodando em `http://localhost:3000`
- [ ] Frontend rodando em `http://localhost:3001`
- [ ] `.env.local` configurado em `/web`
- [ ] CORS permitindo `localhost:3001`
- [ ] Console mostra: `🔗 API conectando em: http://localhost:3000/api`
- [ ] Login funciona e retorna token
- [ ] Dashboard carrega dados
- [ ] Network tab mostra requisições com status 200

## 🎯 Endpoints Disponíveis

| Endpoint | Método | Autenticação | Descrição |
|----------|--------|--------------|-----------|
| `/api/auth/login` | POST | ❌ Não | Login de usuário |
| `/api/auth/register` | POST | ❌ Não | Registro de usuário |
| `/api/dashboard` | GET | ✅ Sim | Stats do dashboard |
| `/api/appointments` | GET/POST | ✅ Sim | Agendamentos |
| `/api/services` | GET/POST | ✅ Sim | Serviços |
| `/api/conversations` | GET | ✅ Sim | Conversas WhatsApp |
| `/api/whatsapp/sessions` | GET | ✅ Sim | Sessões WhatsApp |
| `/api/companies` | GET | ✅ Sim | Empresas (multi-tenancy) |
| `/api/stats/*` | GET | ✅ Sim | Estatísticas diversas |
| `/api/ai/actions` | GET | ✅ Sim | Ações da IA |

---

**Status:** ✅ Conexão configurada e funcionando

**Última atualização:** 2025-01-21

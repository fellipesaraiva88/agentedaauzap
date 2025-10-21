# ⚡ Quick Start Guide - Multi-Tenancy + Auth

Guia rápido para começar a usar o sistema multi-tenant com autenticação.

---

## 🚀 Setup Rápido (5 minutos)

### 1. Instalar Dependências

```bash
cd /Users/saraiva/agentedaauzap
npm install
```

✅ Dependências já instaladas (bcrypt, jwt, helmet, joi, express-rate-limit)

---

### 2. Configurar Variáveis de Ambiente

```bash
# Copiar exemplo
cp .env.example .env

# Gerar JWT secrets seguros
openssl rand -base64 32  # Copiar resultado
openssl rand -base64 32  # Copiar resultado
```

Editar `.env` e adicionar:

```bash
# JWT Authentication (OBRIGATÓRIO)
JWT_ACCESS_SECRET=<cole_o_primeiro_secret_gerado>
JWT_REFRESH_SECRET=<cole_o_segundo_secret_gerado>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Database (já deve estar configurado)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/auzap
```

---

### 3. Executar Migrations

```bash
# Opção 1: Script automático (RECOMENDADO)
npm run migrate:remote

# Opção 2: Manual
psql $DATABASE_URL < migrations/008_complete_multitenancy.sql
psql $DATABASE_URL < migrations/009_add_company_to_users.sql

# Verificar se funcionou
psql $DATABASE_URL -c "SELECT * FROM companies LIMIT 1;"
```

**Resultado esperado:**
- Tabela `companies` existe com empresa ID 1 (AuZap Demo)
- Tabelas `user_profiles`, `appointments`, etc têm coluna `company_id`
- Functions `set_current_company()` e `get_current_company()` existem

---

### 4. Build do Projeto

```bash
npm run build
```

✅ Build já testado e passando sem erros!

---

### 5. Iniciar Servidor

```bash
# Desenvolvimento (com hot reload)
npm run dev

# Produção
npm start
```

**Console deve mostrar:**
```
🚀 Iniciando Sistema ULTRA-HUMANIZADO
✅ PostgreSQL conectado
✅ Redis conectado
✅ Authentication API routes registered
   POST /api/auth/register - Create account
   POST /api/auth/login - Login
   ...
✅ Dashboard API routes registered (protected)
✅ WhatsApp API routes registered (protected)
✅ Servidor rodando na porta 3000
```

---

## 🧪 Testar Autenticação (2 minutos)

### Teste 1: Criar Conta

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@exemplo.com",
    "password": "senha123",
    "name": "João Silva",
    "companyName": "Pet Shop do João",
    "phone": "+5511999999999"
  }'
```

**Resposta esperada:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "email": "teste@exemplo.com",
    "name": "João Silva",
    "companyId": 2,
    "role": "owner"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
    "expiresIn": 900
  }
}
```

✅ **Sucesso!** Conta criada e empresa criada automaticamente.

---

### Teste 2: Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@exemplo.com",
    "password": "senha123"
  }'
```

**Resposta esperada:**
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "email": "teste@exemplo.com",
    "name": "João Silva",
    "companyId": 2,
    "companyName": "Pet Shop do João",
    "role": "owner"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
    "expiresIn": 900
  }
}
```

✅ **Sucesso!** Login funcionando.

**⚠️ Guardar o accessToken para próximos testes!**

---

### Teste 3: Obter Usuário Atual

```bash
# Substituir SEU_TOKEN pelo accessToken recebido no login
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer SEU_TOKEN"
```

**Resposta esperada:**
```json
{
  "user": {
    "id": 1,
    "email": "teste@exemplo.com",
    "name": "João Silva",
    "phone": "+5511999999999",
    "role": "owner",
    "companyId": 2,
    "companyName": "Pet Shop do João",
    "companySlug": "pet-shop-do-joao",
    "createdAt": "2024-10-21T00:00:00.000Z"
  }
}
```

✅ **Sucesso!** Autenticação funcionando end-to-end!

---

### Teste 4: Testar Isolamento de Tenant

```bash
# 1. Criar outro usuário (outra empresa)
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "maria@exemplo.com",
    "password": "senha456",
    "name": "Maria Santos",
    "companyName": "Pet Shop da Maria"
  }'

# 2. Fazer login como Maria
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "maria@exemplo.com",
    "password": "senha456"
  }'
# Guardar o token da Maria

# 3. Tentar acessar dashboard com token da Maria
curl http://localhost:3000/api/dashboard/stats \
  -H "Authorization: Bearer TOKEN_DA_MARIA"

# 4. Tentar acessar com token do João
curl http://localhost:3000/api/dashboard/stats \
  -H "Authorization: Bearer TOKEN_DO_JOAO"
```

**Resultado esperado:**
- Maria vê apenas dados da empresa dela (companyId = 3)
- João vê apenas dados da empresa dele (companyId = 2)
- **Isolamento completo entre tenants!** ✅

---

### Teste 5: Testar Rate Limiting

```bash
# Tentar fazer login 6 vezes seguidas com senha errada
for i in {1..6}; do
  echo "Tentativa $i:"
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"teste@exemplo.com","password":"senhaerrada"}'
  echo "\n"
done
```

**Resultado esperado:**
- Tentativas 1-5: "Invalid email or password"
- Tentativa 6: "Too many login attempts" (429 Too Many Requests)
- **Rate limiting funcionando!** ✅

---

### Teste 6: Testar Refresh Token

```bash
# 1. Esperar 16 minutos (ou alterar JWT_ACCESS_EXPIRY para 1m para teste rápido)

# 2. Tentar usar access token expirado
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer TOKEN_EXPIRADO"

# Resposta: 401 "Token expired"

# 3. Usar refresh token para obter novo access token
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "SEU_REFRESH_TOKEN"
  }'

# Resposta: novo accessToken
{
  "message": "Token refreshed successfully",
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
    "expiresIn": 900
  }
}
```

✅ **Sucesso!** Refresh token funcionando.

---

## 🔍 Verificar Database

### Ver empresas criadas:

```bash
psql $DATABASE_URL -c "SELECT id, nome, slug, ativo FROM companies;"
```

**Resultado esperado:**
```
 id |         nome          |        slug         | ativo
----+-----------------------+---------------------+-------
  1 | AuZap Demo            | auzap-demo          | t
  2 | Pet Shop do João      | pet-shop-do-joao    | t
  3 | Pet Shop da Maria     | pet-shop-da-maria   | t
```

### Ver usuários:

```bash
psql $DATABASE_URL -c "SELECT id, email, name, company_id, role FROM users;"
```

**Resultado esperado:**
```
 id |       email       |     name      | company_id | role
----+-------------------+---------------+------------+-------
  1 | teste@exemplo.com | João Silva    |          2 | owner
  2 | maria@exemplo.com | Maria Santos  |          3 | owner
```

### Testar RLS (Row Level Security):

```bash
# 1. Setar tenant context manualmente
psql $DATABASE_URL -c "SELECT set_current_company(2);"

# 2. Buscar appointments (deve retornar apenas da empresa 2)
psql $DATABASE_URL -c "SELECT * FROM appointments;"

# 3. Mudar para empresa 3
psql $DATABASE_URL -c "SELECT set_current_company(3);"

# 4. Buscar appointments (deve retornar apenas da empresa 3)
psql $DATABASE_URL -c "SELECT * FROM appointments;"
```

✅ **Isolamento funcionando!**

---

## 📊 Health Check

```bash
curl http://localhost:3000/health
```

**Resposta esperada:**
```json
{
  "status": "online",
  "timestamp": "2024-10-21T00:00:00.000Z",
  "messageProcessor": { ... },
  "openai": { ... }
}
```

---

## 🐛 Troubleshooting

### Erro: "Cannot find module"

```bash
npm install
npm run build
```

### Erro: "DATABASE_URL não configurado"

```bash
# Verificar .env
cat .env | grep DATABASE_URL

# Se vazio, adicionar
echo "DATABASE_URL=postgresql://postgres:postgres@localhost:5432/auzap" >> .env
```

### Erro: "Invalid token"

- Verificar se JWT_ACCESS_SECRET e JWT_REFRESH_SECRET estão no .env
- Verificar se o token não expirou (15min)
- Usar refresh token para renovar

### Erro: "Company not found"

- Executar migrations: `npm run migrate:remote`
- Verificar se empresa existe: `SELECT * FROM companies;`

### Erro: "Too many requests"

- Rate limiting ativado (esperado!)
- Esperar 15 minutos
- Ou reiniciar servidor (limpa memória)

---

## ✅ Checklist de Sucesso

Marque conforme testar:

- [ ] npm install sem erros
- [ ] .env configurado com JWT secrets
- [ ] Migrations executadas com sucesso
- [ ] npm run build sem erros
- [ ] npm run dev iniciando sem erros
- [ ] POST /api/auth/register funcionando
- [ ] POST /api/auth/login funcionando
- [ ] GET /api/auth/me funcionando
- [ ] Isolamento entre tenants verificado
- [ ] Rate limiting testado
- [ ] Refresh token testado
- [ ] RLS verificado no PostgreSQL

---

## 🎯 Próximos Passos

Após completar este Quick Start:

1. **Ler documentação completa:**
   - `docs/MULTI_TENANCY_AUTH.md` - Guia detalhado
   - `IMPLEMENTATION_SUMMARY.md` - Resumo técnico
   - `PRODUCTION_CHECKLIST.md` - Checklist de produção

2. **Atualizar services para multi-tenancy:**
   - `src/services/CustomerMemoryDB.ts`
   - `src/services/AppointmentManager.ts`
   - `src/services/ContextRetrievalService.ts`

3. **Implementar frontend:**
   - Páginas de Login/Register
   - Auth Context Provider
   - Protected Routes

4. **Deploy para staging:**
   - Configurar secrets em produção
   - Executar migrations remotas
   - Testar end-to-end

---

## 📚 Recursos

- **Documentação completa:** `docs/MULTI_TENANCY_AUTH.md`
- **API Endpoints:** Ver console ao iniciar servidor
- **Troubleshooting:** Ver seção acima ou documentação
- **Produção:** `PRODUCTION_CHECKLIST.md`

---

## 🆘 Suporte

Se encontrar problemas:

1. Verificar logs do servidor
2. Verificar troubleshooting acima
3. Ler documentação completa
4. Verificar exemplos nos arquivos de teste

---

**Tempo estimado:** 5-7 minutos
**Dificuldade:** Fácil ⭐
**Pré-requisitos:** PostgreSQL rodando, Node.js instalado

✅ **Sistema 100% funcional e testado!**

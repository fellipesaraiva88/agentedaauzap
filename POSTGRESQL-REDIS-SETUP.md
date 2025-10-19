# 🐘🔴 SETUP POSTGRESQL + REDIS

## ⚠️ PROBLEMA ATUAL

O servidor está conectando no **Supabase** ao invés do **PostgreSQL direto** porque:

```
DATABASE_URL=postgres://postgres:***@pange_pangeia_post:5432/pange
```

O hostname `pange_pangeia_post` **não está acessível** localmente (precisa de Docker network).

---

## ✅ SOLUÇÃO 1: Rodar dentro do Docker (RECOMENDADO)

Se `pange_pangeia_post` é um container Docker, você precisa rodar este app **dentro da mesma rede Docker**:

### 1. Criar Dockerfile:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

### 2. docker-compose.yml:

```yaml
version: '3.8'

services:
  agenteauzap:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgres://postgres:b434ebf056660d52c6ac@pange_pangeia_post:5432/pange?sslmode=disable
      - REDIS_URL=redis://default:9ed186549c48a450e1f2@pange_pangeia_redis:6379
    networks:
      - pange_network
    depends_on:
      - pange_pangeia_post
      - pange_pangeia_redis

  pange_pangeia_post:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: b434ebf056660d52c6ac
      POSTGRES_DB: pange
    networks:
      - pange_network

  pange_pangeia_redis:
    image: redis:7-alpine
    command: redis-server --requirepass 9ed186549c48a450e1f2
    networks:
      - pange_network

networks:
  pange_network:
    driver: bridge
```

### 3. Rodar:

```bash
docker-compose up -d
```

---

## ✅ SOLUÇÃO 2: Usar IP/localhost (Desenvolvimento Local)

Se o PostgreSQL e Redis estão rodando **localmente** (não no Docker), altere o .env:

### Opção A: PostgreSQL e Redis locais

```bash
# .env
DATABASE_URL=postgres://postgres:b434ebf056660d52c6ac@localhost:5432/pange
REDIS_URL=redis://default:9ed186549c48a450e1f2@localhost:6379
```

### Opção B: PostgreSQL no servidor remoto

```bash
# .env
DATABASE_URL=postgres://postgres:b434ebf056660d52c6ac@IP_DO_SERVIDOR:5432/pange
REDIS_URL=redis://default:9ed186549c48a450e1f2@IP_DO_SERVIDOR:6379
```

---

## ✅ SOLUÇÃO 3: Usar Supabase (ATUAL - FUNCIONA)

Se você quer usar o Supabase por enquanto, **REMOVA** o DATABASE_URL do .env:

```bash
# .env
# DATABASE_URL=... (comentar ou deletar esta linha)

# Usar Supabase
SUPABASE_URL=https://cdndnwglcieylfgzbwts.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_KEY=...
```

O sistema usará Supabase com cache Redis automaticamente!

---

## 🧪 COMO TESTAR CONEXÕES

### Test PostgreSQL:

```bash
# Dentro do Docker:
docker exec -it pange_pangeia_post psql -U postgres -d pange

# Local:
psql "postgres://postgres:b434ebf056660d52c6ac@localhost:5432/pange"
```

### Test Redis:

```bash
# Dentro do Docker:
docker exec -it pange_pangeia_redis redis-cli -a 9ed186549c48a450e1f2

# Local:
redis-cli -h localhost -p 6379 -a 9ed186549c48a450e1f2
```

---

## 📊 STATUS ESPERADO NO STARTUP

### ✅ Com PostgreSQL direto:

```
✅ PostgreSQL conectado com sucesso (DATABASE_URL)
   Host: pange_pangeia_post (ou localhost)
🐘 Testando conexão PostgreSQL...
✅ PostgreSQL: Conexão verificada e funcionando!
   Server time: 2025-01-18 18:33:45.123

✅ Redis conectado com sucesso
✅ Redis pronto para uso
🔴 Testando conexão Redis...
✅ Redis: Conexão testada com sucesso

📊 CustomerMemoryDB: POSTGRESQL DIRETO + REDIS CACHE
   ✅ Performance máxima com cache
```

### ⚠️ Fallback para Supabase (ATUAL):

```
✅ Supabase conectado com sucesso
   URL: https://cdndnwglcieylfgzbwts.supabase.co

📊 CustomerMemoryDB: SUPABASE (fallback) + REDIS
   ⚠️  Configure DATABASE_URL para melhor performance
```

### ❌ Sem Redis:

```
ℹ️  REDIS_URL não configurado - cache desabilitado

📊 CustomerMemoryDB: SUPABASE (fallback)
   💡 Configure DATABASE_URL para produção
```

---

## 🚀 RECOMENDAÇÃO PARA PRODUÇÃO

**OPÇÃO 1**: Deploy tudo no Docker (mais fácil)
- Use docker-compose.yml acima
- Todos os serviços na mesma rede
- Hostnames funcionam automaticamente

**OPÇÃO 2**: Usar serviços gerenciados
- PostgreSQL: Supabase, Railway, Render
- Redis: Upstash, Redis Cloud
- App: Vercel, Railway, Render

**OPÇÃO 3**: Servidor dedicado
- Instalar PostgreSQL e Redis no servidor
- Usar IP público ou localhost
- Configurar firewall

---

## 💡 PRÓXIMOS PASSOS

1. **Escolha uma solução** (Docker, localhost, ou manter Supabase)
2. **Teste as conexões** usando os comandos acima
3. **Reinicie o servidor** `npm start`
4. **Verifique os logs** - deve aparecer `PostgreSQL direto` ou `Supabase fallback`

---

## 🆘 TROUBLESHOOTING

### "Cannot find name pange_pangeia_post"
→ Hostname não existe. Use `localhost` ou IP do servidor.

### "Connection refused"
→ PostgreSQL/Redis não está rodando. Inicie os serviços.

### "Password authentication failed"
→ Senha incorreta no DATABASE_URL.

### "CustomerMemoryDB: SUPABASE (fallback)"
→ DATABASE_URL não configurado ou conexão falhou.
→ Sistema usa Supabase como fallback (funciona, mas mais lento)

---

**Criado**: Janeiro 2025
**Status**: Sistema funcionando com Supabase (fallback)
**Necessário**: Configurar DATABASE_URL para PostgreSQL direto

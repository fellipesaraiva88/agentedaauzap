# 🚀 SETUP WAHA - INTEGRAÇÃO COMPLETA

> **Configurar PostgreSQL + Redis no ambiente WAHA**

---

## 🎯 OBJETIVO

Integrar o sistema de memória de clientes (PostgreSQL + Redis + SQLite fallback) com seu serviço WAHA em produção.

**Arquitetura:**
```
WAHA (WhatsApp API)
    ↓
Agente Bot (Node.js + TypeScript)
    ↓
PostgreSQL (Database) + Redis (Cache) + SQLite (Fallback)
```

---

## 📋 PRÉ-REQUISITOS

Antes de começar, você precisa ter:

1. ✅ Serviço WAHA rodando (Render, Easypanel, Docker, etc.)
2. ✅ PostgreSQL configurado (gerenciado ou Docker)
3. ✅ Redis configurado (opcional, mas recomendado)
4. ✅ Credenciais PostgreSQL e Redis

---

## 🚀 MÉTODO 1: SCRIPT AUTOMÁTICO (Recomendado)

Execute o script de configuração:

```bash
node setup-waha.js
```

O script oferece 4 opções:

### **1️⃣ Render (Automático via API)**
- Configura via API do Render
- Deploy automático
- Mais rápido e seguro

### **2️⃣ Easypanel (Instruções Manuais)**
- Guia passo a passo
- Variáveis formatadas
- Instruções específicas

### **3️⃣ Docker (Gera docker-compose.yml)**
- Arquivo pronto para usar
- Inclui PostgreSQL + Redis
- Para ambiente local/VPS

### **4️⃣ Manual (Copiar Variáveis)**
- Exibe todas as variáveis
- Você copia manualmente
- Funciona em qualquer plataforma

---

## 🔧 MÉTODO 2: CONFIGURAÇÃO MANUAL

### **Variáveis de Ambiente Necessárias**

Configure no painel do seu serviço WAHA:

```bash
# PostgreSQL (OBRIGATÓRIO para produção)
DATABASE_URL=postgres://user:password@host:5432/database

# Redis (OPCIONAL - mas melhora performance 10-100x)
REDIS_URL=redis://default:password@host:6379

# OpenAI (para IA)
OPENAI_API_KEY=sk-proj-...

# Porta (se necessário)
PORT=3000
```

### **Onde Configurar:**

#### **Render:**
1. Acesse: https://dashboard.render.com/web/[SEU_SERVICE_ID]/env
2. Adicione cada variável
3. Salve - Deploy automático

#### **Easypanel:**
1. Login: https://pange-waha.u5qiqp.easypanel.host
2. Acesse seu serviço
3. Procure "Environment Variables" ou "Config"
4. Adicione as variáveis
5. Salve e reinicie

#### **Docker:**
```yaml
# docker-compose.yml
services:
  waha:
    image: seu-waha-image
    environment:
      - DATABASE_URL=postgres://user:pass@postgres:5432/db
      - REDIS_URL=redis://default:pass@redis:6379
      - OPENAI_API_KEY=sk-proj-...
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: sua_senha
      POSTGRES_DB: auzap
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass sua_senha
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

---

## ✅ OPÇÕES DE DATABASE

### **Opção 1: PostgreSQL Gerenciado (Recomendado)**

**Serviços recomendados:**
- **Railway** - Fácil, free tier generoso
- **Render** - Integrado, $7/mês
- **Neon** - Serverless, free tier
- **DigitalOcean** - VPS managed, $15/mês

**Vantagens:**
- ✅ Backups automáticos
- ✅ SSL/TLS automático
- ✅ Escalabilidade
- ✅ Dashboard visual

### **Opção 2: PostgreSQL + Redis via Docker**

Use o `docker-compose.yml` do projeto:

```bash
docker-compose up -d postgres redis
```

### **Opção 3: SQLite Fallback (Apenas Dev)**

Sem configurar DATABASE_URL, o sistema usa SQLite local:

**⚠️ IMPORTANTE:** SQLite é apenas para desenvolvimento local. Em produção:
- Dados não são persistidos entre deploys
- Sem cache Redis
- Performance limitada

---

## 🔍 VERIFICAÇÃO

### **1. Ver Logs do Serviço:**

#### Render:
```
https://dashboard.render.com/web/[SERVICE_ID]/logs
```

#### Easypanel:
Acesse o painel → Logs

#### Docker:
```bash
docker-compose logs -f waha
```

### **2. Procurar por:**

**✅ Com PostgreSQL + Redis (Ideal):**
```
🚀 Iniciando Agente Pet Shop WhatsApp...

✅ PostgreSQL conectado com sucesso (DATABASE_URL)
   Host: [seu-host]
🐘 Testando conexão PostgreSQL...
✅ PostgreSQL: Conexão verificada e funcionando!

✅ Redis conectado com sucesso
✅ Redis pronto para uso
🔴 Testando conexão Redis...
✅ Redis: Conexão testada com sucesso

📊 CustomerMemoryDB: POSTGRESQL + REDIS CACHE
   ✅ Performance máxima com cache
```

**⚠️ Apenas PostgreSQL (Bom):**
```
✅ PostgreSQL conectado com sucesso
ℹ️  REDIS_URL não configurado - cache desabilitado

📊 CustomerMemoryDB: POSTGRESQL (sem cache)
   💡 Configure REDIS_URL para melhor performance
```

**ℹ️ SQLite Fallback (Apenas Dev):**
```
ℹ️  DATABASE_URL não configurado - usando SQLite local

📊 CustomerMemoryDB: SQLITE (fallback local)
   💡 Configure DATABASE_URL para produção
```

---

## 🧪 TESTAR INTEGRAÇÃO

### **1. Enviar Mensagem no WhatsApp:**

Envie uma mensagem para o número conectado ao WAHA.

### **2. Verificar Logs:**

Deve aparecer:
```
💬 Mensagem recebida de: 5511999999999
👤 Buscando perfil do cliente...
✅ Cliente encontrado/criado no banco
🤖 Processando resposta...
📤 Enviando resposta...
```

### **3. Verificar Database:**

**PostgreSQL:**
```sql
SELECT * FROM user_profiles ORDER BY updated_at DESC LIMIT 5;
```

**SQLite:**
```bash
sqlite3 data/customers.db "SELECT * FROM user_profiles LIMIT 5;"
```

### **4. Verificar Cache Redis:**

```bash
redis-cli -a sua_senha
KEYS "customer:*"
GET "customer:5511999999999"
```

---

## 📊 PROVIDERS RECOMENDADOS

### **PostgreSQL:**

| Provider | Free Tier | Preço | Recomendação |
|----------|-----------|-------|--------------|
| **Railway** | Sim (500h) | $5/mês | ⭐ Melhor para começar |
| **Render** | Não | $7/mês | ⭐ Integrado com Render |
| **Neon** | Sim (1GB) | $0-19/mês | ⭐ Serverless moderno |
| **Supabase** | Sim (500MB) | $0-25/mês | Dashboard visual |
| **DigitalOcean** | Não | $15/mês | Performance garantida |

### **Redis:**

| Provider | Free Tier | Preço | Recomendação |
|----------|-----------|-------|--------------|
| **Upstash** | Sim (10k) | $0-10/mês | ⭐ Melhor free tier |
| **Redis Cloud** | Sim (30MB) | $0-5/mês | Oficial Redis |
| **Railway** | Não | $5/mês | Se já usa Railway |
| **Docker** | - | Grátis | VPS próprio |

---

## ⚠️ TROUBLESHOOTING

### **❌ "DATABASE_URL não configurado"**

**Solução:**
1. Adicione DATABASE_URL nas variáveis de ambiente
2. Use formato: `postgres://user:pass@host:5432/database`
3. Reinicie o serviço

### **❌ "Connection refused"**

**Solução:**
1. Verifique se PostgreSQL/Redis está rodando
2. Verifique firewall/network
3. Teste conexão manual: `psql "DATABASE_URL"`

### **❌ "Password authentication failed"**

**Solução:**
1. Verifique senha no DATABASE_URL
2. Verifique usuário tem permissões
3. Verifique se database existe

### **❌ "Usando SQLite fallback em produção"**

**Solução:**
1. Configure DATABASE_URL
2. SQLite não persiste em deploys
3. Dados serão perdidos no próximo deploy

### **⚠️ Performance lenta**

**Solução:**
1. Configure REDIS_URL para cache
2. Performance melhora 10-100x com Redis
3. Verifique índices PostgreSQL

---

## 💡 BOAS PRÁTICAS

### **Segurança:**
- ✅ Use variáveis de ambiente (NUNCA hardcode)
- ✅ Use SSL/TLS para PostgreSQL em produção
- ✅ Use senhas fortes (Redis)
- ✅ Limite conexões (pg_pool)

### **Performance:**
- ✅ Use Redis para cache
- ✅ Configure connection pooling
- ✅ Monitore queries lentas
- ✅ Crie índices necessários

### **Backup:**
- ✅ Use managed database (backup automático)
- ✅ Ou configure backup manual
- ✅ Teste restore periodicamente

### **Monitoramento:**
- ✅ Configure alertas de erro
- ✅ Monitore uso de memória Redis
- ✅ Monitore conexões PostgreSQL
- ✅ Log de erros estruturado

---

## 📚 DOCUMENTAÇÃO RELACIONADA

- **POSTGRESQL-REDIS-SETUP.md** - Setup detalhado PostgreSQL + Redis
- **CONFIGURAR_RENDER_AGORA.md** - Deploy específico no Render
- **docker-compose.yml** - Configuração Docker completa
- **src/services/customerMemoryDB.ts** - Implementação do código

---

## ⏱️ TEMPO ESTIMADO

- **Script automático (Render):** 2-3 minutos
- **Manual (qualquer plataforma):** 5-10 minutos
- **Docker local:** 3-5 minutos
- **Setup PostgreSQL gerenciado:** 5-10 minutos

---

## 🎉 RESULTADO

Após configurar corretamente:

✅ Bot salvando dados em PostgreSQL
✅ Cache Redis para performance máxima
✅ SQLite como fallback local (dev)
✅ Sistema escalável e profissional
✅ Backups automáticos
✅ Dados persistentes entre deploys

**WAHA integrado com database de produção! 🚀**

---

**Atualizado**: Janeiro 2025
**Arquitetura**: PostgreSQL + Redis + SQLite (fallback)
**Status**: Sistema em produção

# Arquitetura do Sistema

## Visão Geral

Sistema de automação de atendimento via WhatsApp com IA, construído para alta performance e escalabilidade.

---

## Stack de Dados

### PostgreSQL (Database Principal - Production)
- **Propósito**: Armazenamento persistente de dados relacionais
- **Conexão**: `DATABASE_URL`
- **Host**: `31.97.255.95:3004`
- **Tabelas**: 16 tabelas principais
  - `user_profiles` - Perfis de usuários
  - `tutors` - Dados dos tutores
  - `pets` - Informações dos pets
  - `appointments` - Agendamentos
  - `appointment_reminders` - Lembretes de consultas
  - `services` - Serviços oferecidos
  - `products` - Catálogo de produtos
  - `orders` - Pedidos
  - `order_items` - Itens dos pedidos
  - `payments` - Pagamentos
  - `conversations` - Conversas
  - `messages` - Mensagens
  - `context_data` - Contexto das conversas
  - `ai_memory` - Memória da IA
  - `campaigns` - Campanhas de marketing
  - `campaign_recipients` - Destinatários das campanhas

### Redis (Cache e Sessions)
- **Propósito**: Cache de alta performance e gerenciamento de sessões
- **Conexão**: `REDIS_URL`
- **Host**: `31.97.255.95:3005`
- **Dados em Cache**:
  - Perfis de usuários
  - Mensagens recentes
  - Contexto de conversas
  - Dados de sessão
  - Resultados de queries frequentes

### SQLite (Fallback - Development)
- **Propósito**: Desenvolvimento local e fallback
- **Usado quando**: PostgreSQL não está disponível
- **Path**: `./data/customers.db`
- **Nota**: Apenas para ambiente de desenvolvimento

---

## Fluxo de Dados

### Leitura (Read Flow)
```
1. REQUEST → Aplicação
2. CHECK → Redis (cache lookup)
3a. CACHE HIT → Return from Redis (rápido)
3b. CACHE MISS → Query PostgreSQL
4. CACHE MISS → Store in Redis (TTL configurável)
5. RESPONSE → Cliente
```

### Escrita (Write Flow)
```
1. REQUEST → Aplicação
2. VALIDATE → Validação de dados
3. WRITE → PostgreSQL (transaction)
4. INVALIDATE → Redis cache (chaves relacionadas)
5. RESPONSE → Cliente
```

### Performance Gains
- **Cache Hit**: ~1-5ms (Redis)
- **Cache Miss**: ~50-200ms (PostgreSQL + Redis store)
- **Improvement**: 10-100x mais rápido em operações repetidas

---

## Prioridade de Conexão

### Database Connection Priority
```
1. DATABASE_URL (PostgreSQL) - PRODUCTION
   ↓ (se falhar)
2. SQLite (./data/customers.db) - FALLBACK
```

### Cache Connection Priority
```
1. REDIS_URL (Redis) - PRODUCTION
   ↓ (se falhar)
2. Memory Cache - FALLBACK (limitado)
```

---

## Arquitetura de Serviços

### Service Boundaries

```
┌─────────────────────────────────────────────────────┐
│                   API Gateway                        │
│              (Express.js Server)                     │
└──────────────────┬──────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
┌───────▼────────┐   ┌────────▼──────┐
│  WhatsApp API  │   │  Admin API    │
│   (Baileys)    │   │  (REST)       │
└───────┬────────┘   └────────┬──────┘
        │                     │
        └──────────┬──────────┘
                   │
        ┌──────────▼──────────┐
        │   Business Logic    │
        │   (Services Layer)  │
        └──────────┬──────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
┌───────▼────────┐   ┌────────▼──────┐
│  Cache Layer   │   │  Data Layer   │
│    (Redis)     │   │ (PostgreSQL)  │
└────────────────┘   └───────────────┘
```

### Service Components

#### 1. WhatsApp Service
- **Responsabilidade**: Gerenciar conexão e mensagens WhatsApp
- **Tecnologia**: Baileys (WhatsApp Web API)
- **Endpoints**: Internos (event-driven)

#### 2. AI Service
- **Responsabilidade**: Processamento de linguagem natural
- **Tecnologia**: OpenAI API / LLM
- **Endpoints**: `/api/ai/*`

#### 3. Customer Service
- **Responsabilidade**: Gerenciar dados de clientes/tutores
- **Endpoints**: `/api/customers/*`, `/api/tutors/*`

#### 4. Appointment Service
- **Responsabilidade**: Agendamentos e lembretes
- **Endpoints**: `/api/appointments/*`

#### 5. Order Service
- **Responsabilidade**: Pedidos e pagamentos
- **Endpoints**: `/api/orders/*`, `/api/payments/*`

#### 6. Campaign Service
- **Responsabilidade**: Campanhas de marketing
- **Endpoints**: `/api/campaigns/*`

---

## Database Schema (Simplified)

### Core Relationships

```
user_profiles
    ├─→ tutors (1:1)
    │     └─→ pets (1:N)
    │           └─→ appointments (1:N)
    │
    ├─→ conversations (1:N)
    │     ├─→ messages (1:N)
    │     └─→ context_data (1:1)
    │
    └─→ orders (1:N)
          └─→ order_items (1:N)
                └─→ products (N:1)
```

### Key Indexes
- `user_profiles.phone_number` (UNIQUE)
- `conversations.user_id, created_at`
- `messages.conversation_id, timestamp`
- `appointments.tutor_id, appointment_date`
- `orders.user_id, created_at`

---

## Caching Strategy

### Cache Keys Pattern
```typescript
// User profile
`user:${userId}:profile`

// Conversation context
`conversation:${conversationId}:context`

// Recent messages
`conversation:${conversationId}:messages:recent`

// Appointments by tutor
`tutor:${tutorId}:appointments:${date}`
```

### TTL (Time To Live)
- **User Profiles**: 1 hour
- **Conversation Context**: 30 minutes
- **Messages**: 15 minutes
- **Appointments**: 5 minutes (frequent updates)

### Cache Invalidation
- **On Update**: Invalidate specific keys
- **On Delete**: Invalidate related keys
- **On Create**: Pre-populate cache (write-through)

---

## Security Patterns

### Authentication
- **API Keys**: Para integração externa
- **Session Management**: Redis-based sessions
- **Rate Limiting**: Por IP e por usuário

### Data Protection
- **Environment Variables**: Secrets em `.env`
- **Database**: Conexões SSL/TLS
- **API**: HTTPS only em production

---

## Scaling Considerations

### Horizontal Scaling
- **Stateless API**: Permite múltiplas instâncias
- **Shared Redis**: Cache centralizado
- **Database Connection Pool**: Gerenciado por instância

### Performance Optimization
- **Database Indexes**: Em campos de busca frequente
- **Query Optimization**: Evitar N+1 queries
- **Caching**: Reduzir carga no database
- **Pagination**: Limitar resultados de queries

### Bottlenecks Identificados
1. **WhatsApp Connection**: Single instance (limitação do Baileys)
2. **Database Writes**: Pode escalar verticalmente ou sharding
3. **AI API Calls**: Rate limits da OpenAI

### Soluções Futuras
- **Queue System**: RabbitMQ/SQS para processamento assíncrono
- **Read Replicas**: PostgreSQL replicas para leitura
- **CDN**: Para assets estáticos
- **Microservices**: Separar serviços críticos

---

## Technology Stack

### Backend
- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database ORM**: Custom SQL (performance)
- **Cache Client**: ioredis
- **WhatsApp**: Baileys

### Database
- **Primary**: PostgreSQL 14+
- **Cache**: Redis 7+
- **Fallback**: SQLite 3

### Infrastructure
- **Deployment**: Render (containerized)
- **Monitoring**: Logs + Health checks
- **Backup**: Automated PostgreSQL backups

---

## Removido da Arquitetura

### Supabase
- **Razão**: Substituído por PostgreSQL direto
- **Impacto**: Maior controle e performance
- **Removido**: RLS Policies, auth.role() dependencies

### Row Level Security (RLS)
- **Razão**: Gerenciamento de acesso na aplicação
- **Impacto**: Maior flexibilidade

### Built-in Authentication
- **Razão**: Sistema próprio mais simples
- **Impacto**: Menos overhead

---

## Monitoring & Observability

### Health Checks
```
GET /health
- PostgreSQL connection
- Redis connection
- WhatsApp session status
```

### Logs
- **Application Logs**: console (stdout/stderr)
- **Database Logs**: PostgreSQL logs
- **Cache Logs**: Redis logs

### Metrics (Future)
- Request rate
- Response time
- Cache hit ratio
- Database query time
- Error rate

---

## Environment Configuration

### Required Variables
```bash
# Database
DATABASE_URL=postgresql://user:pass@host:port/db

# Cache
REDIS_URL=redis://host:port

# API Keys
OPENAI_API_KEY=sk-...

# Application
PORT=3000
NODE_ENV=production
```

### Optional Variables
```bash
# Fallback SQLite
SQLITE_PATH=./data/customers.db

# Cache TTL (seconds)
CACHE_TTL_PROFILES=3600
CACHE_TTL_MESSAGES=900
```

---

## Deployment Architecture

### Production (Render)
```
Internet
   ↓
Render Load Balancer
   ↓
App Instance(s)
   ├─→ PostgreSQL (31.97.255.95:3004)
   └─→ Redis (31.97.255.95:3005)
```

### Development (Local)
```
localhost:3000
   ├─→ PostgreSQL (remote) or SQLite (local)
   └─→ Redis (remote) or Memory Cache
```

---

## API Design Principles

### RESTful Endpoints
- **GET**: Buscar dados (idempotente)
- **POST**: Criar recursos
- **PUT/PATCH**: Atualizar recursos
- **DELETE**: Remover recursos

### Error Handling
```json
{
  "error": true,
  "message": "Human readable message",
  "code": "ERROR_CODE",
  "details": {}
}
```

### Response Format
```json
{
  "success": true,
  "data": {},
  "meta": {
    "timestamp": "ISO 8601",
    "version": "1.0.0"
  }
}
```

---

## Próximos Passos

### Performance
- [ ] Implementar APM (Application Performance Monitoring)
- [ ] Otimizar queries mais lentas
- [ ] Adicionar índices baseado em uso real

### Escalabilidade
- [ ] Queue system para tarefas assíncronas
- [ ] Database sharding se necessário
- [ ] CDN para assets

### Confiabilidade
- [ ] Automated backups
- [ ] Disaster recovery plan
- [ ] Circuit breakers para APIs externas

---

**Última atualização**: 2025-10-19
**Versão**: 1.0.0

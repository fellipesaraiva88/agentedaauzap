# Backend Architecture Diagram
## Agente da Auzap - System Architecture

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│                    (Next.js - Port 3001)                         │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP/HTTPS
                             │ Authorization: Bearer <JWT>
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                     API GATEWAY LAYER                            │
│                   (Express.js - Port 3000)                       │
├──────────────────────────────────────────────────────────────────┤
│  CORS ✓ │ Helmet ✓ │ Rate Limiting ✓ │ Body Parser ✓           │
└────────────────────────────┬────────────────────────────────────┘
                             │
              ┌──────────────┴──────────────┐
              │                              │
    ┌─────────▼────────┐         ┌──────────▼─────────┐
    │  PUBLIC ROUTES   │         │  PROTECTED ROUTES  │
    │  /api/auth/*     │         │  /api/*            │
    │  (No Auth)       │         │  (JWT Required)    │
    └─────────┬────────┘         └──────────┬─────────┘
              │                              │
              │                   ┌──────────▼─────────┐
              │                   │  Auth Middleware   │
              │                   │  Tenant Context    │
              │                   └──────────┬─────────┘
              │                              │
    ┌─────────▼──────────────────────────────▼─────────┐
    │              BUSINESS LOGIC LAYER                 │
    ├───────────────────────────────────────────────────┤
    │  • Domain Services                                │
    │  • MessageProcessor (V1/V2)                       │
    │  • OpenAI Service                                 │
    │  • WAHA Service (WhatsApp)                        │
    │  • Payment Service (Asaas)                        │
    │  • Notification Service                           │
    └─────────┬─────────────────────────────────────────┘
              │
    ┌─────────▼─────────────────────────────────────────┐
    │            DATA ACCESS LAYER (DAO)                 │
    ├───────────────────────────────────────────────────┤
    │  • AppointmentsDAO                                │
    │  • ServicesDAO                                    │
    │  • TutorsDAO                                      │
    │  • ConversationsDAO                               │
    │  • QueryOptimizer                                 │
    └─────────┬─────────────────────────────────────────┘
              │
    ┌─────────▼─────────┐         ┌─────────────────────┐
    │   PostgreSQL      │         │      Redis          │
    │   (Port 5432)     │         │    (Port 6379)      │
    │                   │         │                     │
    │  • Companies      │         │  • Sessions         │
    │  • Users          │         │  • Cache            │
    │  • Appointments   │         │  • Rate Limits      │
    │  • Services       │         │  • Queue            │
    │  • Tutors/Pets    │         │                     │
    └───────────────────┘         └─────────────────────┘
```

---

## 2. Request Flow - Protected Endpoint

```
┌──────────┐
│  Client  │
└────┬─────┘
     │ GET /api/dashboard/stats
     │ Authorization: Bearer eyJhbGc...
     │
┌────▼──────────────────────────────────────────────────┐
│ Step 1: CORS Middleware                               │
│ ✓ Check Origin: localhost:3001                        │
│ ✓ Set Access-Control-Allow-* headers                  │
└────┬──────────────────────────────────────────────────┘
     │
┌────▼──────────────────────────────────────────────────┐
│ Step 2: Security Middleware (Helmet)                  │
│ ✓ Content-Security-Policy                             │
│ ✓ X-Frame-Options: DENY                               │
│ ✓ HSTS, XSS Protection, etc.                          │
└────┬──────────────────────────────────────────────────┘
     │
┌────▼──────────────────────────────────────────────────┐
│ Step 3: Rate Limiter                                  │
│ ✓ Check: 100 requests / 15 min                        │
│ ✗ Reject if exceeded → 429 Too Many Requests          │
└────┬──────────────────────────────────────────────────┘
     │
┌────▼──────────────────────────────────────────────────┐
│ Step 4: requireAuth() Middleware                      │
│ ✓ Extract JWT from Authorization header               │
│ ✓ Verify signature (JWT_SECRET)                       │
│ ✓ Check expiration                                    │
│ ✗ Reject if invalid → 401 Unauthorized                │
│ ✓ Attach user to request: req.user = {...}            │
└────┬──────────────────────────────────────────────────┘
     │
┌────▼──────────────────────────────────────────────────┐
│ Step 5: tenantContextMiddleware()                     │
│ ✓ Extract company_id from req.user                    │
│ ✓ Set PostgreSQL session context:                     │
│   SELECT set_current_company(company_id)              │
│ ✓ Row Level Security now active                       │
└────┬──────────────────────────────────────────────────┘
     │
┌────▼──────────────────────────────────────────────────┐
│ Step 6: Route Handler (dashboardRouter)               │
│ • Query database (automatically filtered by RLS)      │
│ • Aggregate stats                                     │
│ • Return JSON response                                │
└────┬──────────────────────────────────────────────────┘
     │
┌────▼─────┐
│ Response │
│ 200 OK   │
└──────────┘
```

---

## 3. Authentication Flow

```
┌──────────────────────────────────────────────────────────┐
│                  REGISTRATION FLOW                        │
└──────────────────────────────────────────────────────────┘

Client                API                 Database
  │                    │                      │
  │ POST /api/auth/register                  │
  │ { email, password, company_name }        │
  ├───────────────────►│                      │
  │                    │ 1. Validate input    │
  │                    │ 2. Hash password     │
  │                    │    (bcrypt)          │
  │                    │                      │
  │                    │ 3. BEGIN TRANSACTION │
  │                    ├─────────────────────►│
  │                    │ 4. INSERT company    │
  │                    ├─────────────────────►│
  │                    │ 5. INSERT user       │
  │                    ├─────────────────────►│
  │                    │ 6. COMMIT            │
  │                    ├─────────────────────►│
  │                    │                      │
  │                    │ 7. Generate JWT      │
  │                    │    - accessToken     │
  │                    │    - refreshToken    │
  │                    │                      │
  │ 200 OK            │                      │
  │ { user, tokens }  │                      │
  │◄───────────────────│                      │
  │                    │                      │

┌──────────────────────────────────────────────────────────┐
│                     LOGIN FLOW                            │
└──────────────────────────────────────────────────────────┘

Client                API                 Database
  │                    │                      │
  │ POST /api/auth/login                     │
  │ { email, password }                      │
  ├───────────────────►│                      │
  │                    │ 1. Find user         │
  │                    ├─────────────────────►│
  │                    │    WHERE email = ?   │
  │                    │◄─────────────────────┤
  │                    │                      │
  │                    │ 2. Compare password  │
  │                    │    bcrypt.compare()  │
  │                    │                      │
  │                    │ 3. Generate JWT      │
  │                    │    - accessToken     │
  │                    │      (15 min)        │
  │                    │    - refreshToken    │
  │                    │      (7 days)        │
  │                    │                      │
  │ 200 OK            │                      │
  │ { user, tokens }  │                      │
  │◄───────────────────│                      │
  │                    │                      │

┌──────────────────────────────────────────────────────────┐
│                  REFRESH TOKEN FLOW                       │
└──────────────────────────────────────────────────────────┘

Client                API                 Redis
  │                    │                      │
  │ POST /api/auth/refresh                   │
  │ { refreshToken }                          │
  ├───────────────────►│                      │
  │                    │ 1. Verify refresh    │
  │                    │    token signature   │
  │                    │                      │
  │                    │ 2. Check blacklist   │
  │                    ├─────────────────────►│
  │                    │    EXISTS token?     │
  │                    │◄─────────────────────┤
  │                    │                      │
  │                    │ 3. Generate new      │
  │                    │    accessToken       │
  │                    │                      │
  │ 200 OK            │                      │
  │ { accessToken }   │                      │
  │◄───────────────────│                      │
  │                    │                      │
```

---

## 4. Tenant Isolation (Row Level Security)

```
┌────────────────────────────────────────────────────────┐
│              POSTGRESQL SESSION CONTEXT                 │
└────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Connection 1 (User from Company A)                     │
├─────────────────────────────────────────────────────────┤
│  SELECT set_current_company(1);                         │
│                                                         │
│  SELECT * FROM appointments;                            │
│  ↓                                                      │
│  (RLS Policy Applied)                                   │
│  ↓                                                      │
│  WHERE company_id = get_current_company()               │
│  ↓                                                      │
│  RETURNS: Only appointments from Company A              │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Connection 2 (User from Company B)                     │
├─────────────────────────────────────────────────────────┤
│  SELECT set_current_company(2);                         │
│                                                         │
│  SELECT * FROM appointments;                            │
│  ↓                                                      │
│  (RLS Policy Applied)                                   │
│  ↓                                                      │
│  WHERE company_id = get_current_company()               │
│  ↓                                                      │
│  RETURNS: Only appointments from Company B              │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Database Level Protection                              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  CREATE POLICY appointments_isolation_policy            │
│    ON appointments                                      │
│    FOR ALL                                              │
│    USING (company_id = get_current_company());          │
│                                                         │
│  ✓ Automatic filtering on SELECT                        │
│  ✓ Prevents INSERT to other companies                   │
│  ✓ Prevents UPDATE/DELETE cross-company                 │
│  ✓ Works even with SQL injection                        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 5. Query Optimization Architecture

```
┌────────────────────────────────────────────────────────┐
│                  QUERY OPTIMIZER                        │
└────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  1. PREPARED STATEMENTS CACHE                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  PREPARE get_tutor_by_id AS                             │
│    SELECT * FROM tutors WHERE id = $1 AND company_id = $2│
│                                                         │
│  EXECUTE get_tutor_by_id(123, 1)  ← Fast! (no parsing) │
│                                                         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  2. QUERY BATCHING                                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Request 1: SELECT * FROM services WHERE id = 1         │
│  Request 2: SELECT * FROM services WHERE id = 2         │
│  Request 3: SELECT * FROM services WHERE id = 3         │
│             ↓                                           │
│       (Wait 10ms or 100 queries)                        │
│             ↓                                           │
│  BEGIN TRANSACTION;                                     │
│    SELECT * FROM services WHERE id = 1;                 │
│    SELECT * FROM services WHERE id = 2;                 │
│    SELECT * FROM services WHERE id = 3;                 │
│  COMMIT;                                                │
│  ↓                                                      │
│  1 round trip instead of 3! ← 3x faster                 │
│                                                         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  3. N+1 QUERY DETECTION                                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  SELECT * FROM tutors LIMIT 10                          │
│  SELECT * FROM pets WHERE tutor_id = 1                  │
│  SELECT * FROM pets WHERE tutor_id = 2                  │
│  SELECT * FROM pets WHERE tutor_id = 3                  │
│  ...                                                    │
│  ⚠️  ALERT: 10+ queries on same table detected!         │
│  💡 Suggestion: Use JOIN or IN clause                   │
│                                                         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  4. EXPLAIN ANALYZE INTEGRATION                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Query: SELECT * FROM appointments WHERE status = 'pending'│
│  ↓                                                      │
│  EXPLAIN (ANALYZE, BUFFERS) ...                         │
│  ↓                                                      │
│  Seq Scan on appointments (cost=0..1500 rows=5000)     │
│  ⚠️  WARNING: Seq Scan on 5000+ rows!                   │
│  💡 Recommendation: CREATE INDEX idx_status ON appointments(status)│
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 6. WhatsApp Message Processing Flow

```
┌────────────────────────────────────────────────────────┐
│              MESSAGE PROCESSING PIPELINE                │
└────────────────────────────────────────────────────────┘

WAHA Server           Backend API         Services
     │                     │                   │
     │ POST /webhook      │                   │
     │ { event: "message" }                   │
     ├────────────────────►│                   │
     │                     │                   │
     │ 200 OK (immediate)  │                   │
     │◄────────────────────┤                   │
     │                     │                   │
     │                     │ [ASYNC]           │
     │                     │ 1. Extract chatId │
     │                     │ 2. Get/Create     │
     │                     │    customer       │
     │                     │    profile        │
     │                     ├──────────────────►│
     │                     │ CustomerMemoryDB  │
     │                     │◄──────────────────┤
     │                     │                   │
     │                     │ 3. Intent         │
     │                     │    Analysis       │
     │                     ├──────────────────►│
     │                     │ IntentAnalyzer    │
     │                     │◄──────────────────┤
     │                     │                   │
     │                     │ 4. Context        │
     │                     │    Retrieval      │
     │                     ├──────────────────►│
     │                     │ ContextRetrieval  │
     │                     │ (RAG + Vector DB) │
     │                     │◄──────────────────┤
     │                     │                   │
     │                     │ 5. Generate       │
     │                     │    Response       │
     │                     ├──────────────────►│
     │                     │ OpenAI GPT-4      │
     │                     │◄──────────────────┤
     │                     │                   │
     │                     │ 6. Human Delay    │
     │                     │    (simulate      │
     │                     │     typing)       │
     │                     │                   │
     │                     │ 7. Send Message   │
     │                     ├──────────────────►│
     │◄────────────────────┤ WahaService       │
     │ POST /send          │                   │
     │                     │                   │
```

---

## 7. Caching Strategy

```
┌────────────────────────────────────────────────────────┐
│                   CACHE LAYERS                          │
└────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Layer 1: In-Memory Cache (CustomerMemoryDB)            │
├─────────────────────────────────────────────────────────┤
│  • Customer profiles (last 1000)                        │
│  • Conversation history (last 50 messages/chat)         │
│  • TTL: 1 hour                                          │
│  • Speed: <1ms                                          │
│  • Use: Hot data, frequent access                       │
└─────────────────────────────────────────────────────────┘
                        ↓ Miss
┌─────────────────────────────────────────────────────────┐
│  Layer 2: Redis Cache                                   │
├─────────────────────────────────────────────────────────┤
│  • Query results (paginated lists)                      │
│  • JWT blacklist (logout)                               │
│  • Rate limiting counters                               │
│  • TTL: 5 minutes                                       │
│  • Speed: ~5ms                                          │
│  • Use: Shared cache across instances                   │
└─────────────────────────────────────────────────────────┘
                        ↓ Miss
┌─────────────────────────────────────────────────────────┐
│  Layer 3: PostgreSQL                                    │
├─────────────────────────────────────────────────────────┤
│  • Source of truth                                      │
│  • Permanent storage                                    │
│  • Speed: ~20-50ms                                      │
│  • Use: Always for writes, fallback for reads           │
└─────────────────────────────────────────────────────────┘

Cache-Aside Pattern Example:

async function getStats(companyId: number) {
  // 1. Try in-memory
  let stats = memoryCache.get(`stats:${companyId}`);
  if (stats) return stats;

  // 2. Try Redis
  stats = await redis.get(`stats:${companyId}`);
  if (stats) {
    memoryCache.set(`stats:${companyId}`, stats);
    return JSON.parse(stats);
  }

  // 3. Query database
  stats = await db.query('SELECT ...');

  // 4. Backfill caches
  await redis.setex(`stats:${companyId}`, 300, JSON.stringify(stats));
  memoryCache.set(`stats:${companyId}`, stats);

  return stats;
}
```

---

## 8. Error Handling Flow

```
┌────────────────────────────────────────────────────────┐
│               ERROR HANDLING MIDDLEWARE                 │
└────────────────────────────────────────────────────────┘

Request → Route Handler → Error Thrown
                              │
                              ↓
                    ┌─────────────────────┐
                    │  Error Handler      │
                    │  Middleware         │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
         ┌────▼─────┐    ┌────▼─────┐    ┌────▼─────┐
         │Validation│    │ Database │    │  Unknown │
         │  Error   │    │  Error   │    │  Error   │
         └────┬─────┘    └────┬─────┘    └────┬─────┘
              │                │                │
         ┌────▼─────┐    ┌────▼─────┐    ┌────▼─────┐
         │ 400 Bad  │    │ 500      │    │ 500      │
         │ Request  │    │ Internal │    │ Internal │
         └────┬─────┘    └────┬─────┘    └────┬─────┘
              │                │                │
              └────────────────┼────────────────┘
                               │
                               ↓
                    ┌─────────────────────┐
                    │  Log to Console     │
                    │  (Production:       │
                    │   Log to Sentry)    │
                    └─────────────────────┘
                               │
                               ↓
                         Return JSON:
                         {
                           error: "Error type",
                           message: "User-friendly message",
                           ...(dev ? { stack } : {})
                         }
```

---

## 9. Deployment Architecture (Recommended)

```
┌────────────────────────────────────────────────────────┐
│                    PRODUCTION SETUP                     │
└────────────────────────────────────────────────────────┘

Internet
   │
   ↓
┌──────────────────────────────────────┐
│         Load Balancer / CDN          │
│         (Cloudflare / AWS)           │
└──────────────┬───────────────────────┘
               │
        ┌──────┴──────┐
        │             │
┌───────▼──────┐  ┌──▼───────────┐
│  Static      │  │  API Server  │
│  Files       │  │  (Render /   │
│  (Vercel)    │  │   Railway)   │
└──────────────┘  └──┬───────────┘
                     │
            ┌────────┴────────┐
            │                 │
   ┌────────▼────────┐  ┌────▼─────────┐
   │   PostgreSQL    │  │    Redis     │
   │   (Managed)     │  │  (Managed)   │
   │   - Supabase    │  │  - Redis     │
   │   - Railway     │  │    Cloud     │
   │   - AWS RDS     │  │  - Upstash   │
   └─────────────────┘  └──────────────┘

Horizontal Scaling with PM2:

┌────────────────────────────────────┐
│       PM2 Cluster Mode             │
├────────────────────────────────────┤
│  Instance 1 (Port 3000) ─┐         │
│  Instance 2 (Port 3001)  ├─ Nginx  │
│  Instance 3 (Port 3002)  │  Proxy  │
│  Instance 4 (Port 3003) ─┘         │
└────────────────────────────────────┘
         │
         ↓
   Shared PostgreSQL
   Shared Redis
```

---

## 10. Database Schema Overview

```
┌────────────────────────────────────────────────────────┐
│                  DATABASE TABLES                        │
└────────────────────────────────────────────────────────┘

companies
├── id (PK)
├── name
├── created_at
└── settings (JSONB)

users
├── id (PK)
├── email (UNIQUE)
├── password_hash
├── company_id (FK → companies.id)
├── role (enum: super_admin, owner, manager, staff)
└── created_at

appointments
├── id (PK)
├── company_id (FK → companies.id) ← RLS Policy
├── tutor_id (FK → tutors.id)
├── pet_id (FK → pets.id)
├── service_id (FK → services.id)
├── data_agendamento
├── hora_agendamento
├── status (enum: pendente, confirmado, concluido, cancelado)
├── preco
└── created_at

services
├── id (PK)
├── company_id (FK → companies.id) ← RLS Policy
├── nome
├── descricao
├── preco
├── duracao_minutos
└── ativo

tutors (clients)
├── id (PK)
├── company_id (FK → companies.id) ← RLS Policy
├── nome
├── telefone
├── whatsapp_id
├── is_vip
└── created_at

pets
├── id (PK)
├── company_id (FK → companies.id) ← RLS Policy
├── tutor_id (FK → tutors.id)
├── nome
├── especie
├── raca
└── idade

conversations
├── id (PK)
├── company_id (FK → companies.id) ← RLS Policy
├── chat_id (WhatsApp number)
├── messages (JSONB array)
├── last_message_at
└── status

whatsapp_sessions
├── id (PK)
├── company_id (FK → companies.id) ← RLS Policy
├── session_name
├── status (enum: disconnected, connecting, connected)
├── qr_code
└── updated_at
```

---

## Summary

This architecture provides:

✅ **Scalability** - Horizontal scaling ready (PM2 cluster, stateless API)
✅ **Security** - Multi-layer (JWT, RLS, rate limiting, Helmet)
✅ **Performance** - 3-layer caching, query optimization, connection pooling
✅ **Maintainability** - Clear separation of concerns, typed interfaces
✅ **Reliability** - Transaction support, error handling, graceful degradation

**Key Design Patterns:**
- Layered Architecture (API → Service → DAO → DB)
- Repository Pattern (DAO layer)
- Singleton Pattern (Services)
- Middleware Chain (Express)
- Row Level Security (PostgreSQL)
- Cache-Aside Pattern (Multi-layer cache)

**Technology Decisions Rationale:**
- **PostgreSQL** - ACID compliance, RLS for multi-tenancy, rich query capabilities
- **Redis** - Fast in-memory cache, pub/sub for future real-time features
- **Express.js** - Battle-tested, large ecosystem, middleware pattern
- **TypeScript** - Type safety, better DX, catches errors at compile-time
- **JWT** - Stateless authentication, scalable across instances

# 🚀 Production Ready Checklist - AuZap

> Checklist completo para garantir que o sistema está pronto para produção

---

## 🔐 Segurança

### Variáveis de Ambiente
- [ ] **Todas as variáveis sensíveis em `.env.production`**
  - 📝 Usar serviço de secrets (AWS Secrets Manager, Vault)
  - 📝 Nunca commitar `.env` no git
  - 🔗 [Documentação Variables](./docs/environment-variables.md)

- [ ] **JWT Secrets fortes e únicos**
  - 📝 Gerar com: `openssl rand -base64 64`
  - 📝 Rotacionar periodicamente (90 dias)
  - ✅ Mínimo 256 bits de entropia

- [ ] **API Keys seguras**
  - 📝 Asaas production keys configuradas
  - 📝 WAHA production tokens
  - 📝 Supabase production keys

### Proteção de Aplicação
- [ ] **HTTPS configurado e forçado**
  - 📝 Certificado SSL/TLS válido
  - 📝 HSTS headers configurados
  - 📝 Redirect HTTP → HTTPS
  ```typescript
  // middleware/security.ts
  app.use(helmet({
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  }));
  ```

- [ ] **CORS configurado restritivamente**
  - 📝 Apenas origins autorizadas
  - 📝 Credentials configurado corretamente
  ```typescript
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(','),
    credentials: true
  })
  ```

- [ ] **Rate Limiting implementado**
  - 📝 API endpoints: 100 req/min
  - 📝 Auth endpoints: 5 req/min
  - 📝 WhatsApp: 30 msg/min
  ```typescript
  // Já implementado em src/middleware/rateLimiter.ts
  ```

- [ ] **Proteção contra SQL Injection**
  - ✅ Parameterized queries (já implementado)
  - ✅ Input validation com Zod
  - 📝 Escapar caracteres especiais

- [ ] **Proteção XSS/CSRF**
  - 📝 Content Security Policy headers
  - 📝 CSRF tokens em formulários
  - 📝 Sanitização de inputs
  ```typescript
  app.use(helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"]
    }
  }));
  ```

- [ ] **Autenticação Multi-fator (MFA)**
  - 📝 TOTP implementado
  - 📝 Backup codes
  - 📝 SMS como fallback

### Auditoria e Logs
- [ ] **Logs de segurança estruturados**
  - 📝 Login attempts
  - 📝 Permission changes
  - 📝 Data access logs
  - 📝 API key usage

- [ ] **Monitoramento de vulnerabilidades**
  - 📝 `npm audit` sem vulnerabilidades críticas
  - 📝 Dependabot configurado
  - 📝 OWASP dependency check

---

## 🗄️ Banco de Dados

### Setup e Configuração
- [ ] **Todas as migrations executadas**
  ```bash
  # Verificar status
  npx supabase migration list

  # Executar pendentes
  npx supabase migration up
  ```

- [ ] **Connection pooling otimizado**
  - 📝 Pool size: 20-30 conexões
  - 📝 Timeout: 10 segundos
  - 📝 Idle timeout: 30 segundos
  ```typescript
  // src/services/PostgreSQLClient.ts
  connectionTimeoutMillis: 10000,
  max: 30,
  idleTimeoutMillis: 30000
  ```

- [ ] **Índices criados e otimizados**
  ```sql
  -- Verificar índices ausentes
  SELECT schemaname, tablename, attname, n_distinct, correlation
  FROM pg_stats
  WHERE schemaname = 'public'
  AND n_distinct > 100
  AND correlation < 0.1
  ORDER BY n_distinct DESC;

  -- Índices essenciais
  CREATE INDEX idx_appointments_company_date ON appointments(company_id, appointment_date);
  CREATE INDEX idx_messages_conversation_created ON messages(conversation_id, created_at);
  CREATE INDEX idx_customers_company_phone ON customers(company_id, phone);
  ```

### Segurança de Dados
- [ ] **Row Level Security (RLS) ativo**
  ```sql
  -- Verificar RLS
  SELECT tablename, rowsecurity
  FROM pg_tables
  WHERE schemaname = 'public';

  -- Ativar em todas as tabelas
  ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
  ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
  -- etc...
  ```

- [ ] **Backup automatizado configurado**
  - 📝 Backup diário às 2:00 AM
  - 📝 Retenção: 30 dias
  - 📝 Point-in-time recovery: 7 dias
  - 📝 Teste de restore mensal

- [ ] **Replicação configurada**
  - 📝 Read replicas para queries pesadas
  - 📝 Failover automático
  - 📝 Lag monitoring < 1 segundo

### Performance
- [ ] **Queries otimizadas**
  - 📝 EXPLAIN ANALYZE em queries críticas
  - 📝 Sem N+1 queries
  - 📝 Batch operations implementadas
  ```sql
  -- Identificar queries lentas
  SELECT query, calls, mean_exec_time, total_exec_time
  FROM pg_stat_statements
  ORDER BY mean_exec_time DESC
  LIMIT 20;
  ```

- [ ] **Vacuum e Analyze automatizados**
  ```sql
  -- Configurar autovacuum
  ALTER TABLE appointments SET (autovacuum_vacuum_scale_factor = 0.1);
  ALTER TABLE messages SET (autovacuum_analyze_scale_factor = 0.05);
  ```

---

## 🚀 Performance

### Otimização de Assets
- [ ] **Build de produção otimizado**
  ```bash
  # Next.js production build
  npm run build

  # Verificar bundle size
  npm run analyze
  ```

- [ ] **Assets minificados e comprimidos**
  - ✅ JavaScript minificado (automático Next.js)
  - ✅ CSS minificado (automático Next.js)
  - 📝 Imagens otimizadas (WebP/AVIF)
  - 📝 Gzip/Brotli habilitado

- [ ] **Code splitting implementado**
  - ✅ Route-based splitting (automático Next.js)
  - 📝 Component lazy loading
  ```typescript
  const DashboardCharts = dynamic(
    () => import('@/components/DashboardCharts'),
    { loading: () => <Skeleton /> }
  );
  ```

### Cache Strategy
- [ ] **Cache Manager configurado**
  - ✅ Redis implementado (CacheManager.ts)
  - 📝 TTL apropriado por tipo de dado
  - 📝 Cache invalidation strategy
  ```typescript
  // Configurações de TTL
  CUSTOMER_CACHE: 3600,      // 1 hora
  APPOINTMENT_CACHE: 1800,    // 30 minutos
  ANALYTICS_CACHE: 300,       // 5 minutos
  ```

- [ ] **HTTP Cache headers**
  ```typescript
  // API responses
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');

  // Static assets
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  ```

- [ ] **CDN configurado (Cloudflare/Fastly)**
  - 📝 Assets estáticos na CDN
  - 📝 API cache quando apropriado
  - 📝 Geographic distribution

### Database Performance
- [ ] **Query result caching**
  - ✅ Redis cache implementado
  - 📝 Materialized views para relatórios
  ```sql
  CREATE MATERIALIZED VIEW daily_analytics AS
  SELECT
    company_id,
    DATE(created_at) as date,
    COUNT(*) as total_appointments
  FROM appointments
  GROUP BY company_id, DATE(created_at);

  -- Refresh diário
  REFRESH MATERIALIZED VIEW CONCURRENTLY daily_analytics;
  ```

- [ ] **Database connection optimization**
  - ✅ Connection pooling configurado
  - 📝 Prepared statements
  - 📝 Batch inserts/updates

---

## 📊 Monitoramento

### Logging
- [ ] **Logs estruturados com Winston**
  ```typescript
  // src/utils/logger.ts
  const logger = winston.createLogger({
    format: winston.format.json(),
    transports: [
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error'
      }),
      new winston.transports.File({
        filename: 'logs/combined.log'
      })
    ]
  });
  ```

- [ ] **Log aggregation (ELK/Datadog)**
  - 📝 Elasticsearch para busca
  - 📝 Kibana dashboards
  - 📝 Alertas configurados

### Error Tracking
- [ ] **Sentry configurado**
  ```typescript
  // src/index.ts
  import * as Sentry from "@sentry/node";

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,
  });
  ```

- [ ] **Error boundaries (React)**
  ```tsx
  // web/app/error.tsx
  export default function ErrorBoundary({
    error,
    reset,
  }: {
    error: Error;
    reset: () => void;
  }) {
    useEffect(() => {
      Sentry.captureException(error);
    }, [error]);

    return <ErrorFallback error={error} reset={reset} />;
  }
  ```

### APM (Application Performance Monitoring)
- [ ] **DataDog/New Relic APM**
  - 📝 Transaction tracing
  - 📝 Database query monitoring
  - 📝 API endpoint performance
  - 📝 Custom metrics

- [ ] **Custom metrics implementados**
  ```typescript
  // Métricas de negócio
  metrics.increment('appointments.created', { company_id });
  metrics.histogram('api.response_time', responseTime);
  metrics.gauge('whatsapp.queue_size', queueSize);
  ```

### Uptime & Health
- [ ] **Health check endpoints**
  ```typescript
  // GET /health
  {
    status: "healthy",
    version: "1.0.0",
    services: {
      database: "connected",
      redis: "connected",
      whatsapp: "active"
    }
  }

  // GET /health/ready
  // GET /health/live
  ```

- [ ] **Uptime monitoring (UptimeRobot/Pingdom)**
  - 📝 Check a cada 1 minuto
  - 📝 Multiple geographic locations
  - 📝 SSL certificate monitoring

### Alertas
- [ ] **Alertas configurados para:**
  - 📝 Error rate > 1%
  - 📝 Response time > 1s (P95)
  - 📝 CPU usage > 80%
  - 📝 Memory usage > 90%
  - 📝 Database connections > 80%
  - 📝 WhatsApp disconnection
  - 📝 Payment failures

---

## 🧪 Testes

### Testes Automatizados
- [ ] **Unit tests (Backend)**
  ```bash
  # Coverage mínimo: 80%
  npm run test:coverage

  # Continuous testing
  npm run test:watch
  ```

- [ ] **Integration tests**
  ```typescript
  // __tests__/api/appointments.test.ts
  describe('Appointments API', () => {
    test('should create appointment', async () => {
      const response = await request(app)
        .post('/api/appointments')
        .send(appointmentData)
        .expect(201);
    });
  });
  ```

- [ ] **E2E tests (Frontend)**
  ```typescript
  // cypress/e2e/booking-flow.cy.ts
  describe('Booking Flow', () => {
    it('completes appointment booking', () => {
      cy.visit('/booking');
      cy.fillCustomerForm();
      cy.selectService();
      cy.selectDateTime();
      cy.confirmBooking();
      cy.verifyConfirmation();
    });
  });
  ```

### Performance Testing
- [ ] **Load testing com K6**
  ```javascript
  // k6/load-test.js
  export let options = {
    stages: [
      { duration: '5m', target: 100 },
      { duration: '10m', target: 100 },
      { duration: '5m', target: 0 },
    ],
    thresholds: {
      http_req_duration: ['p(95)<1000'],
      http_req_failed: ['rate<0.1'],
    },
  };
  ```

- [ ] **Stress testing**
  - 📝 Identificar breaking point
  - 📝 Memory leak detection
  - 📝 Connection pool exhaustion

### Security Testing
- [ ] **OWASP ZAP scan**
  ```bash
  # Automated security scan
  docker run -t owasp/zap2docker-stable zap-baseline.py \
    -t https://api.auzap.com
  ```

- [ ] **Penetration testing**
  - 📝 Authentication bypass attempts
  - 📝 SQL injection testing
  - 📝 XSS vulnerability scan
  - 📝 API rate limit testing

---

## 📱 WhatsApp Integration (WAHA)

### Configuração
- [ ] **WAHA em produção**
  - 📝 Docker container dedicado
  - 📝 Volume persistente para sessão
  - 📝 Auto-restart configurado
  ```yaml
  # docker-compose.prod.yml
  waha:
    image: devlikeapro/waha:latest
    restart: always
    volumes:
      - waha-data:/app/.sessions
    environment:
      - WHATSAPP_RESTART_ALL_SESSIONS=true
      - WHATSAPP_SESSIONS_FOLDER=/app/.sessions
  ```

- [ ] **Sessão WhatsApp configurada**
  - 📝 QR Code scan completed
  - 📝 Número business verificado
  - 📝 Profile picture e status configurados

### Webhooks & Events
- [ ] **Webhooks configurados e testados**
  ```typescript
  // Endpoints verificados:
  POST /api/webhooks/whatsapp/message
  POST /api/webhooks/whatsapp/status
  POST /api/webhooks/whatsapp/presence
  ```

- [ ] **Retry mechanism para webhooks**
  - 📝 Exponential backoff
  - 📝 Dead letter queue
  - 📝 Maximum 3 retries

### Rate Limiting & Compliance
- [ ] **Rate limits WhatsApp Business**
  - 📝 1000 msgs/day (unverified)
  - 📝 Unlimited (verified business)
  - 📝 Queue management implementado

- [ ] **Compliance com políticas WhatsApp**
  - 📝 Opt-in explícito documentado
  - 📝 Template messages aprovados
  - 📝 24h window respeitado
  - 📝 Spam prevention

### Monitoramento
- [ ] **Métricas WhatsApp**
  ```typescript
  // Monitorar:
  - Messages sent/received per hour
  - Delivery rate
  - Read rate
  - Response time
  - Session health
  ```

- [ ] **Fallback para SMS configurado**
  - 📝 Twilio/AWS SNS como backup
  - 📝 Automatic failover
  - 📝 Cost monitoring

---

## 💳 Pagamentos (Asaas)

### Configuração Produção
- [ ] **Ambiente production Asaas**
  - 📝 API Key production
  - 📝 Conta verificada
  - 📝 Dados bancários configurados
  ```env
  ASAAS_API_KEY=production_key_here
  ASAAS_ENVIRONMENT=production
  ASAAS_WEBHOOK_TOKEN=webhook_token_here
  ```

- [ ] **Webhooks Asaas configurados**
  ```typescript
  // Webhooks essenciais:
  PAYMENT_CREATED
  PAYMENT_UPDATED
  PAYMENT_CONFIRMED
  PAYMENT_RECEIVED
  PAYMENT_OVERDUE
  PAYMENT_REFUNDED
  PAYMENT_CHARGEBACK_REQUESTED
  ```

### Testes
- [ ] **Testes de transação completos**
  - 📝 Boleto generation
  - 📝 PIX payment
  - 📝 Credit card (com 3DS)
  - 📝 Refund process
  - 📝 Chargeback handling

- [ ] **Reconciliação implementada**
  ```typescript
  // Verificação diária
  async function reconcilePayments() {
    const asaasPayments = await fetchAsaasPayments();
    const dbPayments = await fetchDatabasePayments();
    const discrepancies = findDiscrepancies(asaasPayments, dbPayments);
    if (discrepancies.length > 0) {
      alertFinanceTeam(discrepancies);
    }
  }
  ```

### Segurança Financeira
- [ ] **PCI Compliance**
  - 📝 Não armazenar dados de cartão
  - 📝 Tokenização implementada
  - 📝 HTTPS em todas transações

- [ ] **Fraud prevention**
  - 📝 Velocity checks
  - 📝 Address verification
  - 📝 3D Secure habilitado
  - 📝 Monitoring unusual patterns

---

## 🔄 DevOps

### CI/CD Pipeline
- [ ] **GitHub Actions configurado**
  ```yaml
  # .github/workflows/deploy.yml
  name: Deploy to Production
  on:
    push:
      branches: [main]
  jobs:
    test:
      runs-on: ubuntu-latest
      steps:
        - run: npm test
        - run: npm run lint
        - run: npm run type-check

    deploy:
      needs: test
      if: success()
      steps:
        - run: npm run build
        - run: npm run deploy
  ```

- [ ] **Deployment strategy**
  - 📝 Blue-green deployment
  - 📝 Canary releases (10% → 50% → 100%)
  - 📝 Feature flags (LaunchDarkly)

### Ambientes
- [ ] **Staging environment**
  - 📝 Espelho de produção
  - 📝 Dados anonimizados
  - 📝 Mesmo stack tecnológico
  - 📝 Testes de aceitação

- [ ] **Environment parity**
  ```yaml
  # Verificar:
  - Node.js version
  - NPM packages versions
  - Database version
  - Redis version
  - Environment variables
  ```

### Rollback & Recovery
- [ ] **Rollback strategy**
  ```bash
  # Rollback automático em caso de falha
  - Health check failure → rollback
  - Error rate > 5% → rollback
  - Response time > 2s → alert → manual decision
  ```

- [ ] **Database migration rollback**
  ```sql
  -- Toda migration deve ter DOWN
  -- migrations/xxx_feature.up.sql
  -- migrations/xxx_feature.down.sql
  ```

- [ ] **Disaster recovery plan**
  - 📝 RTO: 1 hora
  - 📝 RPO: 1 hora
  - 📝 Backup restore tested
  - 📝 Runbook documentado

### Infraestrutura
- [ ] **Auto-scaling configurado**
  - 📝 CPU > 70% → scale up
  - 📝 Memory > 80% → scale up
  - 📝 Request queue > 100 → scale up
  - 📝 Minimum: 2 instances
  - 📝 Maximum: 10 instances

- [ ] **Load balancer configurado**
  - 📝 Health checks every 30s
  - 📝 Sticky sessions for WebSocket
  - 📝 SSL termination
  - 📝 Geographic distribution

- [ ] **Container orchestration**
  ```yaml
  # kubernetes/deployment.yaml
  apiVersion: apps/v1
  kind: Deployment
  spec:
    replicas: 3
    strategy:
      type: RollingUpdate
      rollingUpdate:
        maxSurge: 1
        maxUnavailable: 0
  ```

---

## 📋 Checklist de Lançamento

### 24 horas antes
- [ ] Feature freeze
- [ ] Final testing em staging
- [ ] Team briefing
- [ ] Rollback plan reviewed
- [ ] Support team alerted

### 1 hora antes
- [ ] Database backup
- [ ] Monitoring dashboards open
- [ ] Team on standby
- [ ] Communication channels open

### Durante deploy
- [ ] Run migrations
- [ ] Deploy backend
- [ ] Deploy frontend
- [ ] Smoke tests
- [ ] Monitor metrics

### Após deploy
- [ ] Verify all services
- [ ] Check error rates
- [ ] Monitor performance
- [ ] Customer communications
- [ ] Team retrospective

---

## 🎯 Métricas de Sucesso

### KPIs Técnicos
- **Uptime**: > 99.9%
- **Response time**: P95 < 1s
- **Error rate**: < 0.1%
- **Apdex score**: > 0.95

### KPIs de Negócio
- **Appointment completion rate**: > 85%
- **Payment success rate**: > 95%
- **Customer satisfaction**: > 4.5/5
- **Message delivery rate**: > 99%

---

## 📚 Documentação Essencial

- [ ] **README.md atualizado**
- [ ] **API documentation (Swagger)**
- [ ] **Deployment guide**
- [ ] **Troubleshooting guide**
- [ ] **Runbook for incidents**
- [ ] **Architecture diagram**
- [ ] **Database schema**
- [ ] **Security policies**

---

## ✅ Sign-off

### Technical Lead
- [ ] Code review completed
- [ ] Architecture approved
- [ ] Performance validated
- [ ] Security reviewed

### Product Owner
- [ ] Features validated
- [ ] UAT completed
- [ ] Business metrics defined
- [ ] Go-live approved

### DevOps
- [ ] Infrastructure ready
- [ ] Monitoring configured
- [ ] Backup tested
- [ ] Deployment automated

### Legal/Compliance
- [ ] LGPD compliance
- [ ] Terms of service
- [ ] Privacy policy
- [ ] SLA defined

---

**Última atualização**: 2025-10-21

**Status Geral**: 🟡 Em Preparação

> **Nota**: Este checklist deve ser revisado e atualizado regularmente conforme o projeto evolui.
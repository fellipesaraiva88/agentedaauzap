# ✅ Production Deployment Checklist

Este checklist garante que o sistema está pronto para produção com segurança e performance.

---

## 🔐 SEGURANÇA

### Secrets & Credentials

- [ ] **JWT Secrets gerados com segurança**
  ```bash
  # Gerar secrets fortes
  openssl rand -base64 32 > jwt_access_secret.txt
  openssl rand -base64 32 > jwt_refresh_secret.txt
  ```

- [ ] **Secrets em ambiente seguro**
  - [ ] AWS Secrets Manager / Vault configurado
  - [ ] Nunca commitar .env
  - [ ] .env no .gitignore
  - [ ] Secrets diferentes por ambiente (dev/staging/prod)

- [ ] **Database credentials seguros**
  - [ ] Password forte do PostgreSQL
  - [ ] User específico para app (não usar postgres root)
  - [ ] Conexão via SSL/TLS

- [ ] **API Keys protegidas**
  - [ ] WAHA_API_KEY em secret manager
  - [ ] OPENAI_API_KEY em secret manager
  - [ ] GROQ_API_KEY em secret manager
  - [ ] ASAAS_API_KEY em secret manager

### Authentication & Authorization

- [ ] **JWT configurado corretamente**
  - [ ] Access token: 15min (máx 1h)
  - [ ] Refresh token: 7d (máx 30d)
  - [ ] issuer/audience configurados
  - [ ] Algoritmo: RS256 (produção) ou HS256 (mínimo)

- [ ] **Password policies**
  - [ ] Mínimo 8 caracteres (atualmente 6)
  - [ ] Bcrypt rounds: 10-12
  - [ ] Password reset implementado
  - [ ] Account lockout após N tentativas

- [ ] **RBAC testado**
  - [ ] Roles funcionando corretamente
  - [ ] Testes de permissão por role
  - [ ] Super admin não deve existir em produção (ou muito limitado)

### Network & Infrastructure

- [ ] **HTTPS obrigatório**
  - [ ] SSL/TLS certificate válido
  - [ ] Redirect HTTP → HTTPS
  - [ ] HSTS header configurado
  - [ ] Certificate auto-renewal (Let's Encrypt)

- [ ] **Firewall configurado**
  - [ ] PostgreSQL: apenas app server
  - [ ] Redis: apenas app server
  - [ ] API: apenas via load balancer
  - [ ] SSH: apenas IPs autorizados

- [ ] **Headers de segurança (Helmet)**
  ```typescript
  helmet({
    contentSecurityPolicy: true,
    xssFilter: true,
    noSniff: true,
    frameguard: { action: 'deny' },
    hsts: { maxAge: 31536000 }
  })
  ```

### Input Validation

- [ ] **Joi schemas implementados**
  - [ ] Validação em todas rotas
  - [ ] Sanitização de inputs
  - [ ] Rejeitar campos desconhecidos
  - [ ] Validação de tipos

- [ ] **SQL Injection protection**
  - [ ] Usar apenas prepared statements
  - [ ] Row Level Security habilitado
  - [ ] Nunca concatenar strings SQL

- [ ] **XSS Protection**
  - [ ] Sanitizar outputs HTML
  - [ ] CSP headers configurados
  - [ ] HTTPOnly cookies

### Rate Limiting

- [ ] **Rate limiting global**
  - [ ] 100 req/15min por IP
  - [ ] 1000 req/15min por usuário

- [ ] **Rate limiting por rota**
  - [ ] Login: 5 tentativas/15min
  - [ ] Register: 3 registros/hora por IP
  - [ ] Password reset: 3 tentativas/hora

- [ ] **DDoS protection**
  - [ ] CloudFlare ou similar
  - [ ] WAF configurado

---

## 🗄️ DATABASE

### PostgreSQL Production

- [ ] **Configurações otimizadas**
  - [ ] shared_buffers: 25% RAM
  - [ ] effective_cache_size: 50% RAM
  - [ ] max_connections: calculado
  - [ ] Connection pooling configurado

- [ ] **Backups automáticos**
  - [ ] Backup diário (mínimo)
  - [ ] Point-in-time recovery habilitado
  - [ ] Retenção: 30 dias
  - [ ] Backups em região diferente
  - [ ] Testes de restore mensais

- [ ] **Monitoring**
  - [ ] Slow query log habilitado
  - [ ] Connection monitoring
  - [ ] Disk usage alerts
  - [ ] Replication lag (se aplicável)

- [ ] **Migrations**
  - [ ] Todas migrations executadas
  - [ ] Versão do schema documentada
  - [ ] Rollback plan para cada migration
  - [ ] Migrations testadas em staging

### Redis Production

- [ ] **Persistência configurada**
  - [ ] RDB snapshots a cada 6h
  - [ ] AOF habilitado
  - [ ] Backups regulares

- [ ] **High Availability**
  - [ ] Redis Sentinel ou Cluster
  - [ ] Failover automático
  - [ ] Replicas read-only

- [ ] **Memory management**
  - [ ] maxmemory configurado
  - [ ] eviction policy: allkeys-lru
  - [ ] Memory alerts

---

## ⚡ PERFORMANCE

### Application

- [ ] **Node.js otimizado**
  - [ ] NODE_ENV=production
  - [ ] Cluster mode (PM2/K8s)
  - [ ] Graceful shutdown
  - [ ] Memory leaks verificados

- [ ] **Caching implementado**
  - [ ] Redis para sessions
  - [ ] Cache de queries frequentes
  - [ ] CDN para assets estáticos
  - [ ] Cache headers configurados

- [ ] **Connection pooling**
  - [ ] PostgreSQL pool: 20-50 connections
  - [ ] Redis pool configurado
  - [ ] Timeouts configurados

### Database Optimization

- [ ] **Índices criados**
  - [ ] Índices compostos (company_id, ...)
  - [ ] Índices analisados com EXPLAIN
  - [ ] Sem índices desnecessários

- [ ] **Queries otimizadas**
  - [ ] Sem N+1 queries
  - [ ] Paginação implementada
  - [ ] LIMIT em todas queries de lista
  - [ ] Slow queries identificadas e otimizadas

### Frontend

- [ ] **Build otimizado**
  - [ ] Minification habilitada
  - [ ] Tree shaking
  - [ ] Code splitting
  - [ ] Lazy loading de componentes

- [ ] **Assets otimizados**
  - [ ] Imagens comprimidas
  - [ ] SVG otimizados
  - [ ] Fonts subsetting
  - [ ] Gzip/Brotli compression

---

## 📊 MONITORING & OBSERVABILITY

### Logging

- [ ] **Logs estruturados (JSON)**
  - [ ] Winston ou similar
  - [ ] Níveis: error, warn, info, debug
  - [ ] Contexto: userId, companyId, requestId
  - [ ] Rotação diária

- [ ] **Log aggregation**
  - [ ] CloudWatch / Datadog / ELK
  - [ ] Retention policy
  - [ ] Log search configurado

### Metrics

- [ ] **APM implementado**
  - [ ] New Relic / Datadog / Elastic APM
  - [ ] Response time tracking
  - [ ] Error rate tracking
  - [ ] Database query performance

- [ ] **Custom metrics**
  - [ ] Active users
  - [ ] Requests por tenant
  - [ ] WhatsApp messages sent
  - [ ] Appointments created

### Error Tracking

- [ ] **Sentry configurado**
  - [ ] Source maps uploaded
  - [ ] Environment tags
  - [ ] User context
  - [ ] Release tracking

### Alerts

- [ ] **Critical alerts**
  - [ ] API down (health check fail)
  - [ ] Database down
  - [ ] Redis down
  - [ ] Error rate spike
  - [ ] Disk space < 20%

- [ ] **Warning alerts**
  - [ ] Response time > 1s
  - [ ] Memory usage > 80%
  - [ ] CPU usage > 80%
  - [ ] Failed login attempts spike

---

## 🚀 DEPLOYMENT

### CI/CD Pipeline

- [ ] **GitHub Actions / GitLab CI**
  - [ ] Automated tests on PR
  - [ ] Automated build on merge
  - [ ] Automated deploy to staging
  - [ ] Manual approval for production

- [ ] **Build process**
  - [ ] TypeScript compilation
  - [ ] Linting (ESLint)
  - [ ] Type checking
  - [ ] Tests passing (unit + integration)

### Docker

- [ ] **Production Dockerfile**
  - [ ] Multi-stage build
  - [ ] Non-root user
  - [ ] Health check
  - [ ] Minimal image size

- [ ] **docker-compose.yml**
  - [ ] Production-ready
  - [ ] Volumes configurados
  - [ ] Networks isoladas
  - [ ] Resource limits

### Infrastructure

- [ ] **Load Balancer**
  - [ ] Health checks configurados
  - [ ] SSL termination
  - [ ] Sticky sessions (se necessário)
  - [ ] Rate limiting

- [ ] **Auto-scaling**
  - [ ] Horizontal scaling configurado
  - [ ] CPU/Memory thresholds
  - [ ] Min/Max instances
  - [ ] Cool-down periods

- [ ] **CDN**
  - [ ] CloudFront / CloudFlare
  - [ ] Cache configurado
  - [ ] Purge strategy

---

## ✅ TESTING

### Automated Tests

- [ ] **Unit tests**
  - [ ] Coverage > 70%
  - [ ] Critical paths testados
  - [ ] Edge cases cobertos

- [ ] **Integration tests**
  - [ ] Auth flow completo
  - [ ] Multi-tenancy isolation
  - [ ] CRUD operations

- [ ] **E2E tests**
  - [ ] User registration
  - [ ] Login flow
  - [ ] Create appointment
  - [ ] WhatsApp integration

### Manual Testing

- [ ] **Security testing**
  - [ ] OWASP Top 10 verificado
  - [ ] Penetration test
  - [ ] SQL injection attempts
  - [ ] XSS attempts

- [ ] **Performance testing**
  - [ ] Load testing (JMeter/k6)
  - [ ] Stress testing
  - [ ] Spike testing
  - [ ] Database performance under load

---

## 📚 DOCUMENTATION

### Technical Documentation

- [ ] **API Documentation**
  - [ ] Swagger/OpenAPI
  - [ ] All endpoints documented
  - [ ] Request/Response examples
  - [ ] Error codes documented

- [ ] **Architecture docs**
  - [ ] System diagram
  - [ ] Database ER diagram
  - [ ] Deployment diagram
  - [ ] Security architecture

### Operational Documentation

- [ ] **Runbooks**
  - [ ] Deployment procedure
  - [ ] Rollback procedure
  - [ ] Incident response
  - [ ] Disaster recovery

- [ ] **Troubleshooting guides**
  - [ ] Common errors
  - [ ] Performance issues
  - [ ] Database issues
  - [ ] Network issues

---

## 🔄 DISASTER RECOVERY

### Backup & Restore

- [ ] **Backup strategy**
  - [ ] Daily automated backups
  - [ ] Backup verification
  - [ ] Offsite backups
  - [ ] Backup encryption

- [ ] **Restore procedures**
  - [ ] Documented step-by-step
  - [ ] Tested monthly
  - [ ] RTO: < 4 horas
  - [ ] RPO: < 24 horas

### High Availability

- [ ] **Multi-AZ deployment**
  - [ ] App servers em múltiplas AZs
  - [ ] Database multi-AZ
  - [ ] Load balancer multi-AZ

- [ ] **Failover testing**
  - [ ] Database failover testado
  - [ ] App failover testado
  - [ ] DNS failover configurado

---

## 📋 COMPLIANCE & LEGAL

### LGPD / GDPR

- [ ] **Data privacy**
  - [ ] Política de privacidade publicada
  - [ ] Termos de uso publicados
  - [ ] Consentimento de dados
  - [ ] Right to erasure implementado

- [ ] **Data retention**
  - [ ] Política definida
  - [ ] Automatic deletion implementado
  - [ ] Logs retention policy

### Audit

- [ ] **Audit logging**
  - [ ] User actions logged
  - [ ] Admin actions logged
  - [ ] Data changes tracked
  - [ ] Immutable audit log

---

## 🎯 FINAL CHECKS

### Pre-Launch

- [ ] **Smoke tests em produção**
  - [ ] Health endpoints
  - [ ] Login flow
  - [ ] Critical paths
  - [ ] Webhook integration

- [ ] **Performance baseline**
  - [ ] Response time médio
  - [ ] Throughput
  - [ ] Error rate baseline
  - [ ] Resource usage baseline

### Post-Launch

- [ ] **Monitoring ativo**
  - [ ] Dashboards abertos
  - [ ] Team on-call
  - [ ] Alerts funcionando

- [ ] **Communication**
  - [ ] Status page atualizado
  - [ ] Clientes notificados
  - [ ] Suporte preparado

---

## 📊 SUMMARY

**Total items:** 150+
**Critical items:** 50+
**Estimated time:** 2-3 semanas

**Ordem de prioridade:**
1. Segurança (JWT, HTTPS, Secrets)
2. Database (Backups, RLS, Migrations)
3. Monitoring (Logs, Alerts, APM)
4. Performance (Caching, Indexing)
5. Documentation (API, Runbooks)

---

**Última atualização:** 21/10/2024
**Versão:** 1.0.0
**Status:** 📋 Checklist completo

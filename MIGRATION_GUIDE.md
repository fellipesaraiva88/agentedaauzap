# PostgreSQL + Redis Migration Guide

## Overview

Este guia explica como aplicar o schema PostgreSQL no banco de dados de produção (Render) ou em qualquer ambiente PostgreSQL.

## Quick Start

### 1. **Aplicar Migration**

```bash
# Aplicar schema completo no PostgreSQL
npm run migrate:postgres
```

### 2. **Validar Schema**

```bash
# Verificar se todas as tabelas foram criadas
npm run validate:schema
```

### 3. **Deploy**

```bash
# Build e commit
npm run build
git add .
git commit -m "fix: PostgreSQL schema aplicado - resolver erro user_profiles"
git push

# Render fará rebuild automático
```

---

## Comandos Disponíveis

### `npm run migrate:postgres`
Aplica o schema completo do PostgreSQL no banco configurado em `DATABASE_URL`.

**O que faz**:
- Lê `supabase_migration.sql`
- Cria 16 tabelas
- Cria 10 indexes
- Cria 3 triggers
- Cria 1 view
- Valida schema criado

**Quando usar**:
- Primeira vez configurando o banco
- Após reset do banco de dados

---

### `npm run migrate:check`
Verifica o estado atual do schema SEM fazer modificações.

**O que faz**:
- Lista todas as tabelas existentes
- Verifica quais tabelas estão faltando
- Não modifica nada

**Quando usar**:
- Antes de aplicar migration
- Para debug

---

### `npm run migrate:force`
**CUIDADO**: Dropa TODAS as tabelas e recria do zero.

**O que faz**:
- DROP SCHEMA public CASCADE
- CREATE SCHEMA public
- Aplica migration completa

**Quando usar**:
- Apenas em desenvolvimento
- NUNCA em produção (perde todos os dados!)

---

### `npm run validate:schema`
Valida se o schema está completo e funcional.

**O que verifica**:
- 16 tabelas criadas
- 10 indexes criados
- 3 triggers funcionando
- 1 view criada
- Foreign keys corretas
- Primary keys corretas
- INSERT/SELECT/DELETE funcionando

**Quando usar**:
- Após migration
- Para troubleshooting
- Em CI/CD pipelines

---

## Schema Criado

### **Tabelas Core (8)**
1. `user_profiles` - Perfil completo do usuário/cliente
2. `response_times` - Histórico de tempos de resposta
3. `user_interests` - Interesses mencionados
4. `user_objections` - Objeções levantadas
5. `purchases` - Histórico de compras/agendamentos
6. `conversation_history` - Mensagens armazenadas
7. `scheduled_followups` - Follow-ups agendados
8. `conversion_opportunities` - Oportunidades de conversão

### **Knowledge Graph (8)**
9. `tutors` - Dados dos tutores (donos)
10. `pets` - Dados dos pets
11. `service_history` - Histórico de serviços prestados
12. `conversation_episodes` - Episódios de conversação
13. `emotional_context` - Contexto emocional
14. `learned_preferences` - Preferências aprendidas
15. `onboarding_progress` - Progresso de onboarding
16. `payments` - Pagamentos (PIX, cartão, etc)

### **Indexes (10)**
- `idx_response_times_chat_timestamp`
- `idx_conversation_history_chat_timestamp`
- `idx_followups_pending`
- `idx_pets_tutor`
- `idx_pets_ativo`
- `idx_service_pet`
- `idx_service_tutor`
- `idx_episodes_chat`
- `idx_payments_chat`
- `idx_payments_status`

### **Triggers (3)**
- `trigger_update_user_profiles_timestamp` - Auto-update timestamp
- `trigger_update_tutors_timestamp` - Auto-update timestamp
- `trigger_update_pets_timestamp` - Auto-update timestamp

### **Views (1)**
- `tutor_profile_complete` - Visão completa do perfil do tutor com pets e histórico

---

## Troubleshooting

### Erro: `relation "user_profiles" does not exist`

**Causa**: Schema não foi aplicado no PostgreSQL

**Solução**:
```bash
npm run migrate:postgres
```

---


### Erro: `connection timeout`

**Causa**: DATABASE_URL incorreto ou banco inacessível

**Solução**:
```bash
# Verifique .env
cat .env | grep DATABASE_URL

# Teste conexão manual
# Exemplo: DATABASE_URL=postgresql://user:password@host:5432/database
psql $DATABASE_URL -c "SELECT NOW();"
```

---

### Migration falha parcialmente

**Causa**: Alguma tabela já existe ou erro de sintaxe

**Solução**:
```bash
# 1. Verifique estado atual
npm run migrate:check

# 2. Se em DEV, pode fazer force reset
npm run migrate:force

# 3. Se em PROD, contacte DBA antes de dropar dados
```

---

## Segurança

### Acesso ao Banco
**IMPORTANTE**:

- Aplicação tem acesso total via `DATABASE_URL`
- NÃO exponha `DATABASE_URL` publicamente
- Use variáveis de ambiente seguras
- Render gerencia secrets automaticamente

---

## Performance

### Connection Pooling
Configurado em `PostgreSQLClient.ts`:
```typescript
max: 20          // Máximo de conexões
idleTimeout: 30s  // Timeout de conexões idle
connectionTimeout: 10s // Timeout de novas conexões
```

### Indexes Otimizados
Todos os queries principais têm indexes:
- Busca por `chat_id`
- Ordenação por `timestamp DESC`
- Filtros por status (`executed`, `ativo`)

### Redis Cache
O sistema usa Redis + PostgreSQL:
1. **Cache hit** → Redis (< 10ms)
2. **Cache miss** → PostgreSQL (50-100ms)
3. **Update** → PostgreSQL + invalidate cache

---

## Workflow de Deploy

### Development → Production

```bash
# 1. Testar localmente (conectado ao banco Render)
# Exemplo: DATABASE_URL=postgresql://user:password@host.render.com:5432/database
export DATABASE_URL="postgresql://user:password@host:5432/database"
npm run migrate:check
npm run migrate:postgres
npm run validate:schema

# 2. Build e test
npm run build
npm run dev  # Testa localmente

# 3. Commit
git add .
git commit -m "fix: PostgreSQL schema aplicado"
git push

# 4. Render auto-deploy
# Aguardar ~2min

# 5. Validar produção
curl https://agente-petshop-whatsapp.onrender.com/webhook
# Enviar mensagem teste no WhatsApp
```

---

## Manutenção

### Backup Manual
```bash
# Dump completo
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Apenas schema
pg_dump $DATABASE_URL --schema-only > schema_backup.sql

# Apenas dados
pg_dump $DATABASE_URL --data-only > data_backup.sql
```

### Restore
```bash
# Restaurar completo
psql $DATABASE_URL < backup_20250119.sql

# Restaurar apenas dados
psql $DATABASE_URL < data_backup.sql
```

### Limpar Dados Antigos
```sql
-- Limpar mensagens antigas (> 30 dias)
DELETE FROM conversation_history
WHERE timestamp < NOW() - INTERVAL '30 days';

-- Limpar follow-ups executados (> 7 dias)
DELETE FROM scheduled_followups
WHERE executed = TRUE
  AND executed_at < NOW() - INTERVAL '7 days';
```

---

## Checklist de Migration

- [ ] DATABASE_URL configurado no .env
- [ ] Conexão PostgreSQL testada
- [ ] Migration aplicada (`npm run migrate:postgres`)
- [ ] Schema validado (`npm run validate:schema`)
- [ ] Build sem erros (`npm run build`)
- [ ] App testado localmente (`npm run dev`)
- [ ] Commit e push
- [ ] Deploy verificado no Render
- [ ] Mensagem teste no WhatsApp funcionando
- [ ] Logs sem erros `user_profiles does not exist`

---

## Suporte

### Logs de Migration
Os logs mostram:
- Conexão estabelecida
- Tabelas criadas (16)
- Indexes criados (10)
- Triggers criados (3)
- Views criadas (1)
- Erros (se houver)

### Validação Passou
Se `validate:schema` passar com 7/7 OK, o schema está **100% funcional**.

### Em Caso de Dúvidas
1. Verifique logs: `npm run migrate:check`
2. Valide schema: `npm run validate:schema`
3. Teste conexão: `psql $DATABASE_URL -c "SELECT COUNT(*) FROM user_profiles;"`

---

## Status

**Versão**: 1.0.0
**Última atualização**: 2025-01-19
**Status**: Testado e funcionando
**Compatibilidade**: PostgreSQL 12+, Render

---

**Migration completa! O sistema agora está rodando com PostgreSQL + Redis para máxima performance.**

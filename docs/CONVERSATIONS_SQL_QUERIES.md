# SQL Queries - Conversations API

Documentação das queries SQL utilizadas pela API de conversas.

## Índices Utilizados

As queries dependem dos seguintes índices (já criados nas migrations):

```sql
-- appointments table indexes
CREATE INDEX idx_appointments_company ON appointments(company_id);
CREATE INDEX idx_appointments_chat ON appointments(chat_id);
CREATE INDEX idx_appointments_data ON appointments(data_agendamento);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_service ON appointments(service_id);

-- Composite index for better performance
CREATE INDEX idx_appointments_company_data
    ON appointments(company_id, data_agendamento, hora_agendamento);
```

---

## Query 1: Listar Conversas Únicas

**Endpoint:** `GET /api/conversations`

**Query SQL:**
```sql
WITH latest_appointments AS (
  SELECT DISTINCT ON (chat_id)
    chat_id,
    tutor_nome,
    tutor_telefone,
    created_at as last_interaction,
    status,
    service_nome,
    data_agendamento,
    hora_agendamento,
    id as appointment_id
  FROM appointments
  WHERE company_id = $1
    AND LOWER(tutor_nome) LIKE LOWER($2)  -- opcional: filtro de busca
    AND created_at >= $3                    -- opcional: dateFrom
    AND created_at <= $4                    -- opcional: dateTo
    AND status = $5                         -- opcional: status
  ORDER BY chat_id, created_at DESC
),
message_counts AS (
  SELECT
    chat_id,
    COUNT(*) as total_messages
  FROM appointments
  WHERE company_id = $1
  GROUP BY chat_id
)
SELECT
  la.chat_id,
  la.tutor_nome,
  la.tutor_telefone,
  la.last_interaction,
  la.status as last_status,
  la.service_nome as last_service,
  la.data_agendamento as last_appointment_date,
  la.hora_agendamento as last_appointment_time,
  la.appointment_id as last_appointment_id,
  COALESCE(mc.total_messages, 0) as total_messages
FROM latest_appointments la
LEFT JOIN message_counts mc ON la.chat_id = mc.chat_id
ORDER BY la.last_interaction DESC
LIMIT $6 OFFSET $7;
```

**Explicação:**
- `DISTINCT ON (chat_id)` garante apenas 1 registro por conversa (o mais recente)
- CTE `message_counts` agrega total de mensagens por chat
- Filtros dinâmicos são aplicados no WHERE
- COALESCE garante que conversas sem mensagens retornem 0

**Performance:**
- Usa índice `idx_appointments_company` para filtro principal
- Usa índice `idx_appointments_chat` para agregação
- ORDER BY na CTE usa índice `idx_appointments_company_data`

---

## Query 2: Contar Total de Conversas

**Endpoint:** `GET /api/conversations` (paginação)

**Query SQL:**
```sql
SELECT COUNT(DISTINCT chat_id) as total
FROM appointments
WHERE company_id = $1
  AND LOWER(tutor_nome) LIKE LOWER($2)  -- opcional
  AND created_at >= $3                    -- opcional
  AND created_at <= $4                    -- opcional
  AND status = $5;                        -- opcional
```

**Performance:**
- COUNT(DISTINCT) é otimizado pelo índice `idx_appointments_chat`
- Filtros usam índices específicos

---

## Query 3: Histórico Completo de Conversa

**Endpoint:** `GET /api/conversations/:chatId`

**Query SQL:**
```sql
SELECT
  id,
  chat_id,
  tutor_nome,
  tutor_telefone,
  pet_nome,
  pet_tipo,
  pet_porte,
  service_id,
  service_nome,
  data_agendamento,
  hora_agendamento,
  duracao_minutos,
  preco,
  status,
  observacoes,
  motivo_cancelamento,
  confirmado_cliente,
  confirmado_empresa,
  created_at,
  updated_at,
  cancelado_at,
  concluido_at
FROM appointments
WHERE company_id = $1
  AND chat_id = $2
ORDER BY created_at DESC;
```

**Performance:**
- Usa índice composto `idx_appointments_company_chat` (se existir)
- Alternativa: usa `idx_appointments_company` + `idx_appointments_chat`
- ORDER BY usa índice implícito em created_at

---

## Query 4: Mensagens Paginadas

**Endpoint:** `GET /api/conversations/:chatId/messages`

**Query SQL:**
```sql
-- Query de mensagens
SELECT
  id,
  chat_id,
  tutor_nome,
  tutor_telefone,
  pet_nome,
  pet_tipo,
  pet_porte,
  service_id,
  service_nome,
  data_agendamento,
  hora_agendamento,
  duracao_minutos,
  preco,
  status,
  observacoes,
  motivo_cancelamento,
  confirmado_cliente,
  confirmado_empresa,
  created_at,
  updated_at,
  cancelado_at,
  concluido_at
FROM appointments
WHERE company_id = $1 AND chat_id = $2
ORDER BY created_at DESC  -- ou ASC
LIMIT $3 OFFSET $4;

-- Query de contagem
SELECT COUNT(*) as total
FROM appointments
WHERE company_id = $1 AND chat_id = $2;
```

**Performance:**
- Paginação eficiente com LIMIT/OFFSET
- COUNT separado evita processar todos os registros
- Ambas as queries executam em paralelo (Promise.all)

---

## Query 5: Estatísticas Agregadas

**Endpoint:** `GET /api/conversations/stats/summary`

**Query SQL:**
```sql
SELECT
  COUNT(DISTINCT chat_id) as total_conversations,
  COUNT(*) as total_messages,
  COUNT(*) FILTER (WHERE status = 'pendente') as pending_appointments,
  COUNT(*) FILTER (WHERE status = 'confirmado') as confirmed_appointments,
  COUNT(*) FILTER (WHERE status = 'concluido') as completed_appointments,
  COUNT(*) FILTER (WHERE status = 'cancelado') as cancelled_appointments,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as messages_last_24h,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as messages_last_7d,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as messages_last_30d,
  ROUND(AVG(preco), 2) as average_price,
  SUM(preco) FILTER (WHERE status = 'concluido') as total_revenue
FROM appointments
WHERE company_id = $1;
```

**Explicação:**
- `COUNT(*) FILTER (WHERE ...)` é uma agregação condicional do PostgreSQL
- Mais eficiente que múltiplos SELECTs com WHERE
- Uma única passada na tabela para todas as estatísticas
- NOW() - INTERVAL calcula datas dinâmicas

**Performance:**
- Usa índice `idx_appointments_company`
- Filtros por data usam created_at (deve ter índice)
- Agregações são otimizadas pelo PostgreSQL

---

## Otimizações Adicionais

### 1. Índice Composto Sugerido

Para melhorar ainda mais a performance da Query 1:

```sql
-- Otimização para listar conversas com filtros
CREATE INDEX idx_appointments_company_chat_created
    ON appointments(company_id, chat_id, created_at DESC);
```

**Benefício:**
- Melhora performance de DISTINCT ON (chat_id)
- Evita sort externo no ORDER BY

### 2. Índice Parcial para Conversas Ativas

Se a maioria das consultas é para conversas recentes:

```sql
-- Índice parcial para últimos 90 dias
CREATE INDEX idx_appointments_recent
    ON appointments(company_id, chat_id, created_at DESC)
    WHERE created_at >= NOW() - INTERVAL '90 days';
```

**Benefício:**
- Índice menor (mais rápido)
- Ideal para dashboards que focam em conversas recentes

### 3. Índice para Busca de Nome

Se busca por nome for frequente:

```sql
-- Índice GIN para busca case-insensitive
CREATE INDEX idx_appointments_tutor_nome_gin
    ON appointments
    USING gin(LOWER(tutor_nome) gin_trgm_ops);
```

**Requer extensão:**
```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

**Benefício:**
- Busca por LIKE '%termo%' muito mais rápida
- Suporta busca case-insensitive
- Ideal para autocomplete

### 4. Materialized View para Estatísticas

Para dashboards com muitos acessos:

```sql
CREATE MATERIALIZED VIEW conversations_stats AS
SELECT
  company_id,
  COUNT(DISTINCT chat_id) as total_conversations,
  COUNT(*) as total_messages,
  COUNT(*) FILTER (WHERE status = 'pendente') as pending_appointments,
  COUNT(*) FILTER (WHERE status = 'confirmado') as confirmed_appointments,
  COUNT(*) FILTER (WHERE status = 'concluido') as completed_appointments,
  COUNT(*) FILTER (WHERE status = 'cancelado') as cancelled_appointments,
  ROUND(AVG(preco), 2) as average_price,
  SUM(preco) FILTER (WHERE status = 'concluido') as total_revenue,
  MAX(created_at) as last_updated
FROM appointments
GROUP BY company_id;

-- Índice na materialized view
CREATE UNIQUE INDEX idx_conversations_stats_company
    ON conversations_stats(company_id);

-- Refresh periódico (via cron ou trigger)
REFRESH MATERIALIZED VIEW CONCURRENTLY conversations_stats;
```

**Benefício:**
- Consulta instantânea de estatísticas
- Pode ser atualizada a cada 5-15 minutos
- Não impacta performance de escritas

---

## Análise de Performance

### EXPLAIN ANALYZE

Para verificar performance real das queries:

```sql
-- Analisar Query 1 (listar conversas)
EXPLAIN (ANALYZE, BUFFERS)
WITH latest_appointments AS (
  SELECT DISTINCT ON (chat_id)
    chat_id,
    tutor_nome,
    created_at as last_interaction,
    status
  FROM appointments
  WHERE company_id = 1
  ORDER BY chat_id, created_at DESC
)
SELECT * FROM latest_appointments
ORDER BY last_interaction DESC
LIMIT 50;
```

**O que procurar:**
- `Index Scan` (bom) vs `Seq Scan` (ruim)
- `Planning Time` < 1ms
- `Execution Time` < 50ms (para datasets pequenos)
- `Buffers: shared hit` > `shared read` (dados em cache)

### Monitoramento de Queries Lentas

```sql
-- Habilitar log de queries lentas
ALTER DATABASE seu_banco SET log_min_duration_statement = 100; -- 100ms

-- Visualizar queries lentas
SELECT
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
WHERE query LIKE '%appointments%'
  AND mean_time > 50
ORDER BY mean_time DESC
LIMIT 10;
```

---

## Exemplo de Uso das Queries

### Caso de Uso 1: Dashboard de Atendimento

```sql
-- Conversas ativas hoje
WITH recent_conversations AS (
  SELECT DISTINCT ON (chat_id)
    chat_id,
    tutor_nome,
    status,
    created_at
  FROM appointments
  WHERE company_id = 1
    AND created_at >= CURRENT_DATE
  ORDER BY chat_id, created_at DESC
)
SELECT
  COUNT(*) as total_today,
  COUNT(*) FILTER (WHERE status = 'pendente') as awaiting_response
FROM recent_conversations;
```

### Caso de Uso 2: Clientes Inativos

```sql
-- Clientes sem interação há mais de 30 dias
WITH last_contact AS (
  SELECT DISTINCT ON (chat_id)
    chat_id,
    tutor_nome,
    created_at as last_interaction
  FROM appointments
  WHERE company_id = 1
  ORDER BY chat_id, created_at DESC
)
SELECT *
FROM last_contact
WHERE last_interaction < NOW() - INTERVAL '30 days'
ORDER BY last_interaction ASC;
```

### Caso de Uso 3: Top Clientes por Volume

```sql
-- Clientes com mais agendamentos
SELECT
  chat_id,
  tutor_nome,
  COUNT(*) as total_appointments,
  SUM(preco) FILTER (WHERE status = 'concluido') as total_spent,
  MAX(created_at) as last_interaction
FROM appointments
WHERE company_id = 1
GROUP BY chat_id, tutor_nome
HAVING COUNT(*) >= 3
ORDER BY total_appointments DESC
LIMIT 20;
```

---

## Considerações de Segurança

### 1. Row Level Security (RLS)

As queries sempre incluem `company_id` no WHERE para garantir isolamento:

```sql
-- Sempre usar
WHERE company_id = $1

-- NUNCA fazer
WHERE 1=1  -- permite acesso cross-tenant
```

### 2. SQL Injection Protection

Sempre usar parâmetros preparados ($1, $2, etc):

```typescript
// ✅ CORRETO
await db.query('SELECT * FROM appointments WHERE chat_id = $1', [chatId]);

// ❌ ERRADO
await db.query(`SELECT * FROM appointments WHERE chat_id = '${chatId}'`);
```

### 3. Limitação de Resultados

Sempre usar LIMIT para evitar sobrecarga:

```typescript
// Limitar máximo
const limit = Math.min(100, requestedLimit);
```

---

## Próximos Passos

1. ✅ Implementar cache de estatísticas (Redis)
2. ✅ Criar materialized views para queries pesadas
3. ✅ Adicionar índices compostos sugeridos
4. ✅ Configurar pg_stat_statements para monitoramento
5. ✅ Implementar particionamento por data (se necessário)

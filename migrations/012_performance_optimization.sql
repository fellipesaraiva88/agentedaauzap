-- ================================================================
-- MIGRATION 012: OTIMIZAÇÕES DE PERFORMANCE
-- ================================================================
-- Índices otimizados, particionamento e melhorias de query
-- ================================================================

-- ================================================================
-- PARTE 1: ANÁLISE DE ÍNDICES FALTANTES
-- ================================================================

-- Índices compostos para queries frequentes em stats-routes.ts
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_company_date_status
    ON appointments(company_id, data_agendamento, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_company_status_date
    ON appointments(company_id, status, data_agendamento);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_tutor_status
    ON appointments(tutor_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_service_status_date
    ON appointments(service_id, status, data_agendamento);

-- Índices para JOINs frequentes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tutors_company_vip_inactive
    ON tutors(company_id, is_vip, is_inativo)
    WHERE is_inativo = FALSE;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tutors_company_score
    ON tutors(company_id, score_fidelidade DESC)
    WHERE is_inativo = FALSE;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tutors_company_ultima_interacao
    ON tutors(company_id, ultima_interacao DESC);

-- Índices para conversation_history
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversation_company_created
    ON conversation_history(company_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversation_company_sentimento
    ON conversation_history(company_id, sentimento, created_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversation_company_intencao
    ON conversation_history(company_id, intencao, created_at);

-- Índices para pets
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pets_tutor_active
    ON pets(tutor_id, is_active)
    WHERE is_active = TRUE;

-- Índices para services
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_services_company_ativo
    ON services(company_id, ativo)
    WHERE ativo = TRUE;

-- ================================================================
-- PARTE 2: ÍNDICES PARCIAIS PARA QUERIES ESPECÍFICAS
-- ================================================================

-- Índice parcial para agendamentos não lembrados
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_lembrete_pendente
    ON appointments(company_id, data_agendamento, hora_agendamento)
    WHERE lembrete_enviado = FALSE
    AND status IN ('pendente', 'confirmado')
    AND data_agendamento >= CURRENT_DATE;

-- Índice parcial para agendamentos concluídos (receita)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_receita
    ON appointments(company_id, data_agendamento, preco)
    WHERE status = 'concluido';

-- Índice parcial para tutores com marketing ativo
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tutors_marketing
    ON tutors(company_id, ultima_compra, aceita_marketing)
    WHERE aceita_marketing = TRUE
    AND is_inativo = FALSE;

-- ================================================================
-- PARTE 3: ÍNDICES GIN PARA JSONB
-- ================================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tutors_tags_gin
    ON tutors USING GIN (tags);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tutors_preferencias_gin
    ON tutors USING GIN (preferencias);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pets_vacinas_gin
    ON pets USING GIN (vacinas);

-- ================================================================
-- PARTE 4: VIEWS MATERIALIZADAS PARA DASHBOARDS
-- ================================================================

-- View materializada para estatísticas diárias
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_daily_stats AS
SELECT
    company_id,
    date_trunc('day', data_agendamento) as dia,
    COUNT(*) as total_agendamentos,
    COUNT(*) FILTER (WHERE status = 'concluido') as concluidos,
    COUNT(*) FILTER (WHERE status = 'cancelado') as cancelados,
    COUNT(DISTINCT tutor_id) as clientes_unicos,
    COALESCE(SUM(preco) FILTER (WHERE status = 'concluido'), 0) as receita,
    COALESCE(AVG(preco) FILTER (WHERE status = 'concluido'), 0) as ticket_medio
FROM appointments
WHERE data_agendamento >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY company_id, date_trunc('day', data_agendamento)
WITH DATA;

CREATE UNIQUE INDEX ON mv_daily_stats (company_id, dia);
CREATE INDEX ON mv_daily_stats (dia DESC);

-- View materializada para top serviços
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_top_services AS
SELECT
    s.company_id,
    s.id as service_id,
    s.nome,
    s.categoria,
    COUNT(a.id) as total_agendamentos,
    COALESCE(SUM(a.preco) FILTER (WHERE a.status = 'concluido'), 0) as receita_total,
    COALESCE(AVG(a.preco), 0) as preco_medio,
    COUNT(*) FILTER (WHERE a.status = 'cancelado') as cancelamentos
FROM services s
LEFT JOIN appointments a ON s.id = a.service_id
    AND a.data_agendamento >= CURRENT_DATE - INTERVAL '30 days'
WHERE s.ativo = TRUE
GROUP BY s.company_id, s.id, s.nome, s.categoria
WITH DATA;

CREATE UNIQUE INDEX ON mv_top_services (company_id, service_id);
CREATE INDEX ON mv_top_services (company_id, receita_total DESC);

-- ================================================================
-- PARTE 5: FUNÇÕES OTIMIZADAS
-- ================================================================

-- Função otimizada para estatísticas do dashboard
CREATE OR REPLACE FUNCTION get_dashboard_stats(p_company_id INTEGER)
RETURNS TABLE (
    total_tutors BIGINT,
    vip_tutors BIGINT,
    total_appointments BIGINT,
    pending_appointments BIGINT,
    month_revenue NUMERIC,
    recent_conversations BIGINT
)
LANGUAGE sql
STABLE
PARALLEL SAFE
AS $$
    SELECT
        (SELECT COUNT(*) FROM tutors
         WHERE company_id = p_company_id AND is_inativo = FALSE),
        (SELECT COUNT(*) FROM tutors
         WHERE company_id = p_company_id AND is_vip = TRUE AND is_inativo = FALSE),
        (SELECT COUNT(*) FROM appointments
         WHERE company_id = p_company_id
         AND data_agendamento >= date_trunc('month', CURRENT_DATE)),
        (SELECT COUNT(*) FROM appointments
         WHERE company_id = p_company_id
         AND status = 'pendente'
         AND data_agendamento >= CURRENT_DATE),
        (SELECT COALESCE(SUM(preco), 0) FROM appointments
         WHERE company_id = p_company_id
         AND status = 'concluido'
         AND data_agendamento >= date_trunc('month', CURRENT_DATE)),
        (SELECT COUNT(*) FROM conversation_history
         WHERE company_id = p_company_id
         AND created_at >= NOW() - INTERVAL '24 hours')
$$;

-- ================================================================
-- PARTE 6: TABELA DE CACHE PARA AGREGAÇÕES
-- ================================================================

-- Tabela para cache de estatísticas agregadas
CREATE TABLE IF NOT EXISTS cache_stats (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    cache_key VARCHAR(100) NOT NULL,
    cache_value JSONB NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(company_id, cache_key)
);

CREATE INDEX idx_cache_stats_expires ON cache_stats(expires_at) WHERE expires_at > NOW();

-- Função para limpar cache expirado
CREATE OR REPLACE FUNCTION clean_expired_cache()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM cache_stats WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- PARTE 7: OTIMIZAÇÃO DE QUERIES ESPECÍFICAS
-- ================================================================

-- Função otimizada para buscar top clientes
CREATE OR REPLACE FUNCTION get_top_clients(
    p_company_id INTEGER,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    tutor_id TEXT,
    nome VARCHAR,
    telefone VARCHAR,
    is_vip BOOLEAN,
    total_agendamentos BIGINT,
    valor_total NUMERIC
)
LANGUAGE sql
STABLE
PARALLEL SAFE
AS $$
    SELECT
        t.id::TEXT,
        t.nome,
        t.telefone,
        t.is_vip,
        COUNT(a.id) as total_agendamentos,
        COALESCE(SUM(a.preco), 0) as valor_total
    FROM tutors t
    LEFT JOIN appointments a ON t.id::TEXT = a.tutor_id
        AND a.status = 'concluido'
    WHERE t.company_id = p_company_id
        AND t.is_inativo = FALSE
    GROUP BY t.id, t.nome, t.telefone, t.is_vip
    ORDER BY valor_total DESC
    LIMIT p_limit
$$;

-- ================================================================
-- PARTE 8: CONFIGURAÇÕES DE AUTOVACUUM
-- ================================================================

-- Configurar autovacuum mais agressivo para tabelas de alto volume
ALTER TABLE appointments SET (
    autovacuum_vacuum_scale_factor = 0.05,
    autovacuum_analyze_scale_factor = 0.05,
    autovacuum_vacuum_threshold = 50,
    autovacuum_analyze_threshold = 50
);

ALTER TABLE conversation_history SET (
    autovacuum_vacuum_scale_factor = 0.05,
    autovacuum_analyze_scale_factor = 0.05,
    autovacuum_vacuum_threshold = 50,
    autovacuum_analyze_threshold = 50
);

ALTER TABLE tutors SET (
    autovacuum_vacuum_scale_factor = 0.1,
    autovacuum_analyze_scale_factor = 0.1
);

-- ================================================================
-- PARTE 9: ESTATÍSTICAS PERSONALIZADAS
-- ================================================================

-- Criar estatísticas estendidas para queries com múltiplas colunas
CREATE STATISTICS IF NOT EXISTS stats_appointments_company_status
    ON company_id, status FROM appointments;

CREATE STATISTICS IF NOT EXISTS stats_appointments_company_date
    ON company_id, data_agendamento FROM appointments;

CREATE STATISTICS IF NOT EXISTS stats_tutors_company_vip
    ON company_id, is_vip, is_inativo FROM tutors;

-- ================================================================
-- PARTE 10: REFRESH DE VIEWS MATERIALIZADAS
-- ================================================================

-- Função para refresh das views materializadas
CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_stats;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_top_services;
    RAISE NOTICE 'Views materializadas atualizadas com sucesso';
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- ANÁLISE E REINDEXAÇÃO
-- ================================================================

-- Analisar tabelas principais para atualizar estatísticas
ANALYZE appointments;
ANALYZE tutors;
ANALYZE pets;
ANALYZE services;
ANALYZE conversation_history;
ANALYZE companies;

-- ================================================================
-- MONITORAMENTO DE PERFORMANCE
-- ================================================================

-- View para monitorar queries lentas
CREATE OR REPLACE VIEW v_slow_queries AS
SELECT
    query,
    calls,
    total_time,
    mean_time,
    max_time,
    stddev_time,
    rows
FROM pg_stat_statements
WHERE mean_time > 100 -- queries com mais de 100ms em média
ORDER BY mean_time DESC
LIMIT 50;

-- View para monitorar índices não utilizados
CREATE OR REPLACE VIEW v_unused_indexes AS
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
    AND idx_scan = 0
    AND indexrelname NOT LIKE 'pg_toast%'
ORDER BY pg_relation_size(indexrelid) DESC;

-- View para monitorar cache hit ratio
CREATE OR REPLACE VIEW v_cache_hit_ratio AS
SELECT
    schemaname,
    tablename,
    heap_blks_read,
    heap_blks_hit,
    CASE
        WHEN (heap_blks_read + heap_blks_hit) > 0
        THEN round((heap_blks_hit::numeric / (heap_blks_read + heap_blks_hit)) * 100, 2)
        ELSE 0
    END as cache_hit_ratio
FROM pg_statio_user_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY heap_blks_read + heap_blks_hit DESC;

-- ================================================================
-- COMENTÁRIOS
-- ================================================================

COMMENT ON MATERIALIZED VIEW mv_daily_stats IS
    'Estatísticas diárias agregadas para dashboards - refresh a cada hora';

COMMENT ON MATERIALIZED VIEW mv_top_services IS
    'Top serviços por receita - refresh a cada 30 minutos';

COMMENT ON FUNCTION get_dashboard_stats IS
    'Função otimizada para buscar estatísticas do dashboard com cache';

COMMENT ON VIEW v_slow_queries IS
    'Monitoramento de queries lentas (requer pg_stat_statements)';

-- ================================================================
-- LOG DE SUCESSO
-- ================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Migration 012: Otimizações de Performance aplicadas!';
    RAISE NOTICE '   ✅ Índices compostos criados';
    RAISE NOTICE '   ✅ Índices parciais otimizados';
    RAISE NOTICE '   ✅ Views materializadas para dashboards';
    RAISE NOTICE '   ✅ Funções otimizadas';
    RAISE NOTICE '   ✅ Configurações de autovacuum';
    RAISE NOTICE '   ✅ Views de monitoramento criadas';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  PRÓXIMOS PASSOS:';
    RAISE NOTICE '   1. Execute VACUUM ANALYZE nas tabelas principais';
    RAISE NOTICE '   2. Configure job para refresh das views materializadas';
    RAISE NOTICE '   3. Monitore v_slow_queries regularmente';
    RAISE NOTICE '   4. Revise v_unused_indexes após 1 semana';
END $$;
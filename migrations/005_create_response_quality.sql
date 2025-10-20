-- Migration: Sistema de Feedback Loop e Qualidade de Respostas
-- Data: 2025-10-20
-- Objetivo: Rastrear qualidade, aprender com erros, melhorar prompts

-- =====================================================
-- TABELA: response_quality (auditoria de respostas)
-- =====================================================
CREATE TABLE IF NOT EXISTS response_quality (
    id SERIAL PRIMARY KEY,

    -- Identificação
    chat_id TEXT NOT NULL,
    tutor_id TEXT REFERENCES tutors(tutor_id) ON DELETE SET NULL,

    -- Mensagens
    user_message TEXT NOT NULL,
    bot_response TEXT NOT NULL,

    -- Qualidade
    quality_score INTEGER CHECK (quality_score BETWEEN 0 AND 100),
    passed_validation BOOLEAN DEFAULT true,
    rejection_reason TEXT,

    -- Contexto da resposta
    mode_used VARCHAR(50),
    pipeline_used VARCHAR(50),
    sentiment_detected VARCHAR(50),
    intent_detected VARCHAR(50),

    -- Métricas
    response_time_ms INTEGER,
    tokens_used INTEGER,
    used_rag BOOLEAN DEFAULT false,
    rag_sources_count INTEGER DEFAULT 0,

    -- Validações aplicadas
    validations_applied JSONB DEFAULT '[]',
    validation_scores JSONB DEFAULT '{}',

    -- Flags de alerta
    is_low_quality BOOLEAN GENERATED ALWAYS AS (quality_score < 70) STORED,
    is_rejected BOOLEAN GENERATED ALWAYS AS (NOT passed_validation) STORED,
    needs_review BOOLEAN DEFAULT false,

    -- Feedback (futuro)
    user_feedback VARCHAR(20), -- thumbs_up, thumbs_down, etc
    user_feedback_text TEXT,

    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    reviewed_at TIMESTAMP,
    reviewed_by VARCHAR(100)
);

-- Índices para performance
CREATE INDEX idx_quality_chat ON response_quality(chat_id);
CREATE INDEX idx_quality_tutor ON response_quality(tutor_id);
CREATE INDEX idx_quality_score ON response_quality(quality_score);
CREATE INDEX idx_quality_low ON response_quality(is_low_quality) WHERE is_low_quality = true;
CREATE INDEX idx_quality_rejected ON response_quality(is_rejected) WHERE is_rejected = true;
CREATE INDEX idx_quality_mode ON response_quality(mode_used);
CREATE INDEX idx_quality_date ON response_quality(created_at DESC);

-- =====================================================
-- VIEW: Estatísticas de Qualidade por Modo
-- =====================================================
CREATE OR REPLACE VIEW v_quality_by_mode AS
SELECT
    mode_used,
    COUNT(*) as total_responses,
    AVG(quality_score) as avg_quality_score,
    COUNT(*) FILTER (WHERE is_low_quality) as low_quality_count,
    COUNT(*) FILTER (WHERE is_rejected) as rejected_count,
    (COUNT(*) FILTER (WHERE quality_score >= 80)::FLOAT / COUNT(*)) * 100 as high_quality_percentage,
    AVG(response_time_ms) as avg_response_time_ms
FROM response_quality
GROUP BY mode_used
ORDER BY avg_quality_score DESC;

-- =====================================================
-- VIEW: Problemas Comuns (Top Rejection Reasons)
-- =====================================================
CREATE OR REPLACE VIEW v_common_issues AS
SELECT
    rejection_reason,
    COUNT(*) as occurrence_count,
    mode_used,
    AVG(quality_score) as avg_quality_when_rejected
FROM response_quality
WHERE is_rejected = true
GROUP BY rejection_reason, mode_used
ORDER BY occurrence_count DESC
LIMIT 20;

-- =====================================================
-- VIEW: Qualidade por Horário
-- =====================================================
CREATE OR REPLACE VIEW v_quality_by_hour AS
SELECT
    EXTRACT(HOUR FROM created_at) as hour_of_day,
    COUNT(*) as total_responses,
    AVG(quality_score) as avg_quality_score,
    COUNT(*) FILTER (WHERE is_low_quality) as low_quality_count
FROM response_quality
GROUP BY EXTRACT(HOUR FROM created_at)
ORDER BY hour_of_day;

-- =====================================================
-- FUNÇÃO: Obter insights de qualidade
-- =====================================================
CREATE OR REPLACE FUNCTION get_quality_insights(
    days_back INTEGER DEFAULT 7
)
RETURNS TABLE (
    metric VARCHAR,
    value NUMERIC,
    status VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    WITH stats AS (
        SELECT
            COUNT(*) as total,
            AVG(quality_score) as avg_score,
            COUNT(*) FILTER (WHERE is_low_quality) as low_quality,
            COUNT(*) FILTER (WHERE is_rejected) as rejected
        FROM response_quality
        WHERE created_at >= NOW() - (days_back || ' days')::INTERVAL
    )
    SELECT 'total_responses'::VARCHAR, total::NUMERIC,
           CASE WHEN total > 100 THEN 'good' ELSE 'low' END::VARCHAR
    FROM stats
    UNION ALL
    SELECT 'avg_quality_score'::VARCHAR, ROUND(avg_score, 2),
           CASE WHEN avg_score >= 80 THEN 'excellent'
                WHEN avg_score >= 70 THEN 'good'
                ELSE 'needs_improvement' END::VARCHAR
    FROM stats
    UNION ALL
    SELECT 'low_quality_rate'::VARCHAR, ROUND((low_quality::FLOAT / NULLIF(total, 0)) * 100, 2),
           CASE WHEN (low_quality::FLOAT / NULLIF(total, 0)) < 0.1 THEN 'good'
                WHEN (low_quality::FLOAT / NULLIF(total, 0)) < 0.2 THEN 'warning'
                ELSE 'critical' END::VARCHAR
    FROM stats
    UNION ALL
    SELECT 'rejection_rate'::VARCHAR, ROUND((rejected::FLOAT / NULLIF(total, 0)) * 100, 2),
           CASE WHEN (rejected::FLOAT / NULLIF(total, 0)) < 0.05 THEN 'good'
                WHEN (rejected::FLOAT / NULLIF(total, 0)) < 0.15 THEN 'warning'
                ELSE 'critical' END::VARCHAR
    FROM stats;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE response_quality IS 'Auditoria completa de qualidade de respostas do bot';
COMMENT ON VIEW v_quality_by_mode IS 'Estatísticas de qualidade agrupadas por modo Marina';
COMMENT ON VIEW v_common_issues IS 'Problemas mais comuns que causam rejeição de respostas';
COMMENT ON FUNCTION get_quality_insights IS 'Retorna insights rápidos sobre qualidade das respostas';

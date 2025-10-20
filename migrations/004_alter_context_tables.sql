-- Migration: Adicionar colunas faltantes para ContextRetrievalService
-- Data: 2025-10-20

-- =====================================================
-- ALTER TABLE: tutors
-- =====================================================
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS is_vip BOOLEAN DEFAULT false;
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS is_inativo BOOLEAN DEFAULT false;
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS cliente_desde TIMESTAMP DEFAULT NOW();
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS total_servicos INTEGER DEFAULT 0;
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS valor_total_gasto DECIMAL(10,2) DEFAULT 0;
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS conversoes INTEGER DEFAULT 0;
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS taxa_conversao DECIMAL(5,2) DEFAULT 0;
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS preferencias JSONB DEFAULT '{}';
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS observacoes TEXT;
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS endereco TEXT;

-- Criar índices se não existirem
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tutors_is_vip') THEN
        CREATE INDEX idx_tutors_is_vip ON tutors(is_vip);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tutors_is_inativo') THEN
        CREATE INDEX idx_tutors_is_inativo ON tutors(is_inativo);
    END IF;
END $$;

-- =====================================================
-- ALTER TABLE: pets
-- =====================================================
ALTER TABLE pets ADD COLUMN IF NOT EXISTS tipo VARCHAR(50);
ALTER TABLE pets ADD COLUMN IF NOT EXISTS idade INTEGER;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS servicos_preferidos JSONB DEFAULT '[]';
ALTER TABLE pets ADD COLUMN IF NOT EXISTS produtos_favoritos JSONB DEFAULT '[]';

-- Migrar especie para tipo se tipo estiver vazio
UPDATE pets SET tipo = especie WHERE tipo IS NULL;

-- Criar índice se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_pets_tipo') THEN
        CREATE INDEX idx_pets_tipo ON pets(tipo);
    END IF;
END $$;

-- =====================================================
-- ALTER TABLE: emotional_context
-- =====================================================
ALTER TABLE emotional_context ADD COLUMN IF NOT EXISTS tutor_id TEXT REFERENCES tutors(tutor_id) ON DELETE CASCADE;
ALTER TABLE emotional_context ADD COLUMN IF NOT EXISTS arquetipo VARCHAR(50);
ALTER TABLE emotional_context ADD COLUMN IF NOT EXISTS dimensoes_personalidade JSONB;
ALTER TABLE emotional_context ADD COLUMN IF NOT EXISTS emocao_primaria VARCHAR(50);
ALTER TABLE emotional_context ADD COLUMN IF NOT EXISTS emocao_secundaria VARCHAR(50);
ALTER TABLE emotional_context ADD COLUMN IF NOT EXISTS intensidade_emocional INTEGER;
ALTER TABLE emotional_context ADD COLUMN IF NOT EXISTS sentimento_predominante VARCHAR(50);
ALTER TABLE emotional_context ADD COLUMN IF NOT EXISTS tom_conversacao VARCHAR(50);
ALTER TABLE emotional_context ADD COLUMN IF NOT EXISTS engagement_score INTEGER;
ALTER TABLE emotional_context ADD COLUMN IF NOT EXISTS engagement_level VARCHAR(20);
ALTER TABLE emotional_context ADD COLUMN IF NOT EXISTS sinais_compra JSONB DEFAULT '[]';
ALTER TABLE emotional_context ADD COLUMN IF NOT EXISTS analisado_em TIMESTAMP DEFAULT NOW();
ALTER TABLE emotional_context ADD COLUMN IF NOT EXISTS contexto_conversa TEXT;

-- Criar índices se não existirem
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_emotional_tutor') THEN
        CREATE INDEX idx_emotional_tutor ON emotional_context(tutor_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_emotional_arquetipo') THEN
        CREATE INDEX idx_emotional_arquetipo ON emotional_context(arquetipo);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_emotional_data') THEN
        CREATE INDEX idx_emotional_data ON emotional_context(analisado_em DESC);
    END IF;
END $$;

-- =====================================================
-- ALTER TABLE: service_history
-- =====================================================
ALTER TABLE service_history ADD COLUMN IF NOT EXISTS tipo_servico VARCHAR(50);
ALTER TABLE service_history ADD COLUMN IF NOT EXISTS data_servico TIMESTAMP;
ALTER TABLE service_history ADD COLUMN IF NOT EXISTS valor DECIMAL(10,2);
ALTER TABLE service_history ADD COLUMN IF NOT EXISTS status VARCHAR(50);
ALTER TABLE service_history ADD COLUMN IF NOT EXISTS descricao TEXT;
ALTER TABLE service_history ADD COLUMN IF NOT EXISTS profissional VARCHAR(100);
ALTER TABLE service_history ADD COLUMN IF NOT EXISTS observacoes TEXT;
ALTER TABLE service_history ADD COLUMN IF NOT EXISTS avaliacao INTEGER;
ALTER TABLE service_history ADD COLUMN IF NOT EXISTS feedback TEXT;

-- Criar índices se não existirem
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_service_tipo') THEN
        CREATE INDEX idx_service_tipo ON service_history(tipo_servico);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_service_data') THEN
        CREATE INDEX idx_service_data ON service_history(data_servico DESC);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_service_status') THEN
        CREATE INDEX idx_service_status ON service_history(status);
    END IF;
END $$;

-- =====================================================
-- ALTER TABLE: learned_preferences
-- =====================================================
ALTER TABLE learned_preferences ADD COLUMN IF NOT EXISTS horario_preferido VARCHAR(50);
ALTER TABLE learned_preferences ADD COLUMN IF NOT EXISTS dias_preferidos JSONB DEFAULT '[]';
ALTER TABLE learned_preferences ADD COLUMN IF NOT EXISTS estilo_comunicacao VARCHAR(50);
ALTER TABLE learned_preferences ADD COLUMN IF NOT EXISTS servicos_interesse JSONB DEFAULT '[]';
ALTER TABLE learned_preferences ADD COLUMN IF NOT EXISTS faixa_preco VARCHAR(50);
ALTER TABLE learned_preferences ADD COLUMN IF NOT EXISTS frequencia_servico VARCHAR(50);
ALTER TABLE learned_preferences ADD COLUMN IF NOT EXISTS sensivel_preco BOOLEAN DEFAULT false;
ALTER TABLE learned_preferences ADD COLUMN IF NOT EXISTS sensivel_tempo BOOLEAN DEFAULT false;
ALTER TABLE learned_preferences ADD COLUMN IF NOT EXISTS valoriza_qualidade BOOLEAN DEFAULT true;
ALTER TABLE learned_preferences ADD COLUMN IF NOT EXISTS palavras_chave_positivas JSONB DEFAULT '[]';
ALTER TABLE learned_preferences ADD COLUMN IF NOT EXISTS objecoes_comuns JSONB DEFAULT '[]';
ALTER TABLE learned_preferences ADD COLUMN IF NOT EXISTS velocidade_resposta_media INTEGER;
ALTER TABLE learned_preferences ADD COLUMN IF NOT EXISTS tamanho_msg_preferido VARCHAR(20);
ALTER TABLE learned_preferences ADD COLUMN IF NOT EXISTS usa_audio BOOLEAN DEFAULT false;
ALTER TABLE learned_preferences ADD COLUMN IF NOT EXISTS usa_fotos BOOLEAN DEFAULT false;
ALTER TABLE learned_preferences ADD COLUMN IF NOT EXISTS aprendido_em TIMESTAMP DEFAULT NOW();

-- =====================================================
-- ALTER TABLE: conversation_episodes
-- =====================================================
ALTER TABLE conversation_episodes ADD COLUMN IF NOT EXISTS converteu BOOLEAN DEFAULT false;
ALTER TABLE conversation_episodes ADD COLUMN IF NOT EXISTS valor_convertido DECIMAL(10,2);
ALTER TABLE conversation_episodes ADD COLUMN IF NOT EXISTS tipo_conversao VARCHAR(50);
ALTER TABLE conversation_episodes ADD COLUMN IF NOT EXISTS resumo_conversa TEXT;
ALTER TABLE conversation_episodes ADD COLUMN IF NOT EXISTS proximos_passos TEXT;
ALTER TABLE conversation_episodes ADD COLUMN IF NOT EXISTS duracao_minutos INTEGER;
ALTER TABLE conversation_episodes ADD COLUMN IF NOT EXISTS total_mensagens INTEGER DEFAULT 0;
ALTER TABLE conversation_episodes ADD COLUMN IF NOT EXISTS topico_principal VARCHAR(100);
ALTER TABLE conversation_episodes ADD COLUMN IF NOT EXISTS intencao_detectada VARCHAR(50);
ALTER TABLE conversation_episodes ADD COLUMN IF NOT EXISTS estagio_jornada VARCHAR(50);

-- Criar índice se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_episodes_converteu') THEN
        CREATE INDEX idx_episodes_converteu ON conversation_episodes(converteu);
    END IF;
END $$;

-- =====================================================
-- CREATE TABLE: journey_tracking (nova tabela)
-- =====================================================
CREATE TABLE IF NOT EXISTS journey_tracking (
    id SERIAL PRIMARY KEY,
    tutor_id TEXT REFERENCES tutors(tutor_id) ON DELETE CASCADE,

    -- Estágio atual
    estagio_atual VARCHAR(50),
    estagio_anterior VARCHAR(50),

    -- Transição
    mudou_em TIMESTAMP DEFAULT NOW(),
    motivo_transicao TEXT,

    -- Próximos passos
    proximo_estagio_esperado VARCHAR(50),
    acao_recomendada TEXT,
    pronto_avancar BOOLEAN DEFAULT false,

    -- Metadata
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_journey_tutor ON journey_tracking(tutor_id);
CREATE INDEX IF NOT EXISTS idx_journey_estagio ON journey_tracking(estagio_atual);
CREATE INDEX IF NOT EXISTS idx_journey_data ON journey_tracking(mudou_em DESC);

-- =====================================================
-- VIEW: Cliente Completo (para facilitar queries)
-- =====================================================
DROP VIEW IF EXISTS v_cliente_completo;

CREATE VIEW v_cliente_completo AS
SELECT
    t.tutor_id as id,
    t.nome,
    t.telefone,
    t.email,
    t.is_vip,
    t.is_inativo,
    t.cliente_desde,
    t.total_servicos,
    t.valor_total_gasto,
    t.taxa_conversao,

    -- Último contexto emocional
    (SELECT arquetipo FROM emotional_context WHERE tutor_id = t.tutor_id ORDER BY analisado_em DESC LIMIT 1) as arquetipo_atual,
    (SELECT engagement_level FROM emotional_context WHERE tutor_id = t.tutor_id ORDER BY analisado_em DESC LIMIT 1) as engagement_atual,

    -- Estágio da jornada
    (SELECT estagio_atual FROM journey_tracking WHERE tutor_id = t.tutor_id ORDER BY mudou_em DESC LIMIT 1) as estagio_jornada,

    -- Última conversa
    (SELECT inicio_conversa FROM conversation_episodes WHERE tutor_id = t.tutor_id ORDER BY inicio_conversa DESC LIMIT 1) as ultima_conversa,
    (SELECT converteu FROM conversation_episodes WHERE tutor_id = t.tutor_id ORDER BY inicio_conversa DESC LIMIT 1) as ultima_conversao,

    -- Pets
    (SELECT COUNT(*) FROM pets WHERE tutor_id = t.tutor_id) as total_pets,
    (SELECT json_agg(json_build_object('nome', nome, 'tipo', tipo, 'raca', raca, 'porte', porte))
     FROM pets WHERE tutor_id = t.tutor_id) as pets

FROM tutors t;

-- =====================================================
-- Atualizar cliente_desde para tutors existentes
-- =====================================================
UPDATE tutors
SET cliente_desde = created_at
WHERE cliente_desde IS NULL;

-- =====================================================
-- Calcular estatísticas para tutors existentes
-- =====================================================
UPDATE tutors t
SET
    total_servicos = (SELECT COUNT(*) FROM service_history WHERE tutor_id = t.tutor_id),
    valor_total_gasto = COALESCE((SELECT SUM(valor) FROM service_history WHERE tutor_id = t.tutor_id), 0);

COMMENT ON COLUMN tutors.is_vip IS 'Cliente VIP com tratamento prioritário';
COMMENT ON COLUMN tutors.is_inativo IS 'Cliente inativo (há mais de 90 dias sem interação)';
COMMENT ON TABLE journey_tracking IS 'Rastreamento da jornada do cliente';

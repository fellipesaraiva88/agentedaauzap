-- Migration: Criar tabelas para ContextRetrievalService
-- Data: 2025-10-20
-- Objetivo: Permitir contexto completo e personalização real

-- =====================================================
-- TABELA: tutors (dados dos tutores/clientes)
-- =====================================================
CREATE TABLE IF NOT EXISTS tutors (
    id VARCHAR(255) PRIMARY KEY,
    nome VARCHAR(255),
    telefone VARCHAR(50),
    email VARCHAR(255),
    endereco TEXT,
    bairro VARCHAR(100),
    cidade VARCHAR(100) DEFAULT 'Florianópolis',
    estado VARCHAR(2) DEFAULT 'SC',
    cep VARCHAR(10),
    cpf VARCHAR(14),

    -- Flags importantes
    is_vip BOOLEAN DEFAULT false,
    is_inativo BOOLEAN DEFAULT false,
    cliente_desde TIMESTAMP DEFAULT NOW(),
    ultima_interacao TIMESTAMP DEFAULT NOW(),

    -- Estatísticas
    total_servicos INTEGER DEFAULT 0,
    valor_total_gasto DECIMAL(10,2) DEFAULT 0,
    conversoes INTEGER DEFAULT 0,
    taxa_conversao DECIMAL(5,2) DEFAULT 0,

    -- Preferências
    preferencias JSONB DEFAULT '{}',
    observacoes TEXT,

    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tutors_telefone ON tutors(telefone);
CREATE INDEX idx_tutors_is_vip ON tutors(is_vip);
CREATE INDEX idx_tutors_is_inativo ON tutors(is_inativo);

-- =====================================================
-- TABELA: pets (dados dos pets)
-- =====================================================
CREATE TABLE IF NOT EXISTS pets (
    id SERIAL PRIMARY KEY,
    tutor_id VARCHAR(255) REFERENCES tutors(id) ON DELETE CASCADE,

    nome VARCHAR(100),
    tipo VARCHAR(50), -- cao, gato, etc
    raca VARCHAR(100),
    idade INTEGER,
    porte VARCHAR(20), -- pequeno, medio, grande, gigante
    peso DECIMAL(5,2),
    sexo VARCHAR(10), -- macho, femea

    -- Saúde e comportamento
    temperamento VARCHAR(50), -- calmo, agitado, agressivo, etc
    condicoes_saude TEXT,
    alergias TEXT,
    medicamentos TEXT,

    -- Preferências
    servicos_preferidos JSONB DEFAULT '[]',
    produtos_favoritos JSONB DEFAULT '[]',

    -- Metadata
    foto_url TEXT,
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_pets_tutor_id ON pets(tutor_id);
CREATE INDEX idx_pets_tipo ON pets(tipo);
CREATE INDEX idx_pets_porte ON pets(porte);

-- =====================================================
-- TABELA: emotional_context (histórico emocional)
-- =====================================================
CREATE TABLE IF NOT EXISTS emotional_context (
    id SERIAL PRIMARY KEY,
    tutor_id VARCHAR(255) REFERENCES tutors(id) ON DELETE CASCADE,

    -- Análise psicológica
    arquetipo VARCHAR(50), -- ansioso_controlador, analitico_questionador, etc
    dimensoes_personalidade JSONB, -- {ansioso: 85, detalhista: 70, ...}

    -- Emoções predominantes
    emocao_primaria VARCHAR(50),
    emocao_secundaria VARCHAR(50),
    intensidade_emocional INTEGER, -- 0-100

    -- Sentimentos
    sentimento_predominante VARCHAR(50), -- urgente, frustrado, animado, etc
    tom_conversacao VARCHAR(50), -- formal, casual, amigavel, etc

    -- Engagement
    engagement_score INTEGER, -- 0-100
    engagement_level VARCHAR(20), -- baixo, medio, alto, muito_alto
    sinais_compra JSONB DEFAULT '[]',

    -- Metadata
    analisado_em TIMESTAMP DEFAULT NOW(),
    contexto_conversa TEXT
);

CREATE INDEX idx_emotional_tutor ON emotional_context(tutor_id);
CREATE INDEX idx_emotional_arquetipo ON emotional_context(arquetipo);
CREATE INDEX idx_emotional_data ON emotional_context(analisado_em DESC);

-- =====================================================
-- TABELA: service_history (histórico de serviços)
-- =====================================================
CREATE TABLE IF NOT EXISTS service_history (
    id SERIAL PRIMARY KEY,
    tutor_id VARCHAR(255) REFERENCES tutors(id) ON DELETE CASCADE,
    pet_id INTEGER REFERENCES pets(id) ON DELETE SET NULL,

    -- Serviço
    tipo_servico VARCHAR(50), -- banho, tosa, consulta, hospedagem, etc
    data_servico TIMESTAMP,
    valor DECIMAL(10,2),
    status VARCHAR(50), -- agendado, concluido, cancelado, etc

    -- Detalhes
    descricao TEXT,
    profissional VARCHAR(100),
    observacoes TEXT,

    -- Satisfação
    avaliacao INTEGER, -- 1-5 estrelas
    feedback TEXT,

    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_service_tutor ON service_history(tutor_id);
CREATE INDEX idx_service_pet ON service_history(pet_id);
CREATE INDEX idx_service_tipo ON service_history(tipo_servico);
CREATE INDEX idx_service_data ON service_history(data_servico DESC);
CREATE INDEX idx_service_status ON service_history(status);

-- =====================================================
-- TABELA: learned_preferences (preferências aprendidas)
-- =====================================================
CREATE TABLE IF NOT EXISTS learned_preferences (
    id SERIAL PRIMARY KEY,
    tutor_id VARCHAR(255) REFERENCES tutors(id) ON DELETE CASCADE,

    -- Preferências de comunicação
    horario_preferido VARCHAR(50), -- manha, tarde, noite
    dias_preferidos JSONB DEFAULT '[]', -- ["segunda", "quarta", "sexta"]
    estilo_comunicacao VARCHAR(50), -- rapido, detalhado, casual, formal

    -- Preferências de serviço
    servicos_interesse JSONB DEFAULT '[]',
    faixa_preco VARCHAR(50), -- economico, medio, premium
    frequencia_servico VARCHAR(50), -- semanal, quinzenal, mensal

    -- Sensibilidades
    sensivel_preco BOOLEAN DEFAULT false,
    sensivel_tempo BOOLEAN DEFAULT false,
    valoriza_qualidade BOOLEAN DEFAULT true,

    -- Gatilhos de conversão
    palavras_chave_positivas JSONB DEFAULT '[]',
    objecoes_comuns JSONB DEFAULT '[]',

    -- Padrões comportamentais
    velocidade_resposta_media INTEGER, -- em segundos
    tamanho_msg_preferido VARCHAR(20), -- curto, medio, longo
    usa_audio BOOLEAN DEFAULT false,
    usa_fotos BOOLEAN DEFAULT false,

    -- Metadata
    aprendido_em TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_preferences_tutor ON learned_preferences(tutor_id);

-- =====================================================
-- TABELA: conversation_episodes (últimas conversas)
-- =====================================================
CREATE TABLE IF NOT EXISTS conversation_episodes (
    id SERIAL PRIMARY KEY,
    tutor_id VARCHAR(255) REFERENCES tutors(id) ON DELETE CASCADE,

    -- Dados da conversa
    inicio_conversa TIMESTAMP,
    fim_conversa TIMESTAMP,
    duracao_minutos INTEGER,
    total_mensagens INTEGER DEFAULT 0,

    -- Contexto
    topico_principal VARCHAR(100),
    intencao_detectada VARCHAR(50), -- agendar_servico, tirar_duvida, reclamar, etc
    estagio_jornada VARCHAR(50), -- descoberta, interesse, consideracao, decisao, etc

    -- Resultado
    converteu BOOLEAN DEFAULT false,
    valor_convertido DECIMAL(10,2),
    tipo_conversao VARCHAR(50), -- agendamento, compra, lead_qualificado, etc

    -- Resumo
    resumo_conversa TEXT,
    proximos_passos TEXT,

    -- Metadata
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_episodes_tutor ON conversation_episodes(tutor_id);
CREATE INDEX idx_episodes_data ON conversation_episodes(inicio_conversa DESC);
CREATE INDEX idx_episodes_converteu ON conversation_episodes(converteu);

-- =====================================================
-- TABELA: journey_tracking (rastreamento de jornada)
-- =====================================================
CREATE TABLE IF NOT EXISTS journey_tracking (
    id SERIAL PRIMARY KEY,
    tutor_id VARCHAR(255) REFERENCES tutors(id) ON DELETE CASCADE,

    -- Estágio atual
    estagio_atual VARCHAR(50), -- descoberta, interesse, consideracao, decisao, pos_venda, fidelizado, churn_risk
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

CREATE INDEX idx_journey_tutor ON journey_tracking(tutor_id);
CREATE INDEX idx_journey_estagio ON journey_tracking(estagio_atual);
CREATE INDEX idx_journey_data ON journey_tracking(mudou_em DESC);

-- =====================================================
-- TRIGGERS: Atualizar updated_at automaticamente
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tutors_updated_at BEFORE UPDATE ON tutors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pets_updated_at BEFORE UPDATE ON pets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_updated_at BEFORE UPDATE ON service_history
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_preferences_updated_at BEFORE UPDATE ON learned_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VIEW: Cliente Completo (para facilitar queries)
-- =====================================================
CREATE OR REPLACE VIEW v_cliente_completo AS
SELECT
    t.id,
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
    (SELECT arquetipo FROM emotional_context WHERE tutor_id = t.id ORDER BY analisado_em DESC LIMIT 1) as arquetipo_atual,
    (SELECT engagement_level FROM emotional_context WHERE tutor_id = t.id ORDER BY analisado_em DESC LIMIT 1) as engagement_atual,

    -- Estágio da jornada
    (SELECT estagio_atual FROM journey_tracking WHERE tutor_id = t.id ORDER BY mudou_em DESC LIMIT 1) as estagio_jornada,

    -- Última conversa
    (SELECT inicio_conversa FROM conversation_episodes WHERE tutor_id = t.id ORDER BY inicio_conversa DESC LIMIT 1) as ultima_conversa,
    (SELECT converteu FROM conversation_episodes WHERE tutor_id = t.id ORDER BY inicio_conversa DESC LIMIT 1) as ultima_conversao,

    -- Pets
    (SELECT COUNT(*) FROM pets WHERE tutor_id = t.id) as total_pets,
    (SELECT json_agg(json_build_object('nome', nome, 'tipo', tipo, 'raca', raca, 'porte', porte))
     FROM pets WHERE tutor_id = t.id) as pets

FROM tutors t;

-- =====================================================
-- DADOS INICIAIS: Popular com clientes do CustomerMemoryDB
-- =====================================================
-- Nota: Isso será feito via código TypeScript ao migrar dados existentes

COMMENT ON TABLE tutors IS 'Dados dos tutores/clientes do pet shop';
COMMENT ON TABLE pets IS 'Dados dos pets cadastrados';
COMMENT ON TABLE emotional_context IS 'Histórico de análises emocionais e psicológicas';
COMMENT ON TABLE service_history IS 'Histórico de serviços contratados';
COMMENT ON TABLE learned_preferences IS 'Preferências aprendidas automaticamente';
COMMENT ON TABLE conversation_episodes IS 'Episódios de conversação com resumos';
COMMENT ON TABLE journey_tracking IS 'Rastreamento da jornada do cliente';

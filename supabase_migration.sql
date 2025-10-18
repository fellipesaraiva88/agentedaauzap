-- ==========================================
-- MIGRAÇÃO COMPLETA PARA SUPABASE (PostgreSQL)
-- Adaptado do SQLite para PostgreSQL
-- ==========================================

-- SCHEMA PRINCIPAL (user_profiles e relacionados)

CREATE TABLE IF NOT EXISTS user_profiles (
    chat_id TEXT PRIMARY KEY,
    nome TEXT,
    pet_nome TEXT,
    pet_raca TEXT,
    pet_porte TEXT CHECK(pet_porte IN ('pequeno', 'medio', 'grande')),
    pet_tipo TEXT CHECK(pet_tipo IN ('cachorro', 'gato', 'ave', 'outro')),

    -- Timestamps
    first_contact_date TIMESTAMP NOT NULL DEFAULT NOW(),
    last_message_timestamp BIGINT NOT NULL,
    last_follow_up_date TIMESTAMP,

    -- Análise comportamental
    avg_response_time INTEGER NOT NULL DEFAULT 0,
    engagement_score INTEGER NOT NULL DEFAULT 50 CHECK(engagement_score BETWEEN 0 AND 100),
    engagement_level TEXT NOT NULL DEFAULT 'medio' CHECK(engagement_level IN ('baixo', 'medio', 'alto', 'muito_alto')),

    -- Estágio da conversa
    conversation_stage TEXT NOT NULL DEFAULT 'descoberta' CHECK(conversation_stage IN ('descoberta', 'interesse', 'consideracao', 'decisao', 'pos_venda')),
    purchase_intent INTEGER NOT NULL DEFAULT 0 CHECK(purchase_intent BETWEEN 0 AND 100),

    -- Sentimento
    last_sentiment TEXT DEFAULT 'neutro' CHECK(last_sentiment IN ('positivo', 'neutro', 'negativo', 'urgente', 'frustrado', 'animado', 'pragmatico')),

    -- Estatísticas
    total_messages INTEGER NOT NULL DEFAULT 0,
    total_conversations INTEGER NOT NULL DEFAULT 0,

    -- Preferências (JSONB para PostgreSQL)
    preferences JSONB DEFAULT '{}',

    -- Notas
    notes TEXT,

    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tabela de histórico de tempos de resposta
CREATE TABLE IF NOT EXISTS response_times (
    id SERIAL PRIMARY KEY,
    chat_id TEXT NOT NULL,
    response_time INTEGER NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
    FOREIGN KEY (chat_id) REFERENCES user_profiles(chat_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_response_times_chat_timestamp
ON response_times(chat_id, timestamp DESC);

-- Tabela de interesses
CREATE TABLE IF NOT EXISTS user_interests (
    id SERIAL PRIMARY KEY,
    chat_id TEXT NOT NULL,
    interest TEXT NOT NULL,
    mentioned_at TIMESTAMP NOT NULL DEFAULT NOW(),
    FOREIGN KEY (chat_id) REFERENCES user_profiles(chat_id) ON DELETE CASCADE
);

-- Tabela de objeções
CREATE TABLE IF NOT EXISTS user_objections (
    id SERIAL PRIMARY KEY,
    chat_id TEXT NOT NULL,
    objection TEXT NOT NULL,
    mentioned_at TIMESTAMP NOT NULL DEFAULT NOW(),
    resolved BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (chat_id) REFERENCES user_profiles(chat_id) ON DELETE CASCADE
);

-- Tabela de histórico de compras
CREATE TABLE IF NOT EXISTS purchases (
    id SERIAL PRIMARY KEY,
    chat_id TEXT NOT NULL,
    service TEXT NOT NULL,
    value REAL NOT NULL,
    pet_name TEXT,
    purchase_date TIMESTAMP NOT NULL DEFAULT NOW(),
    FOREIGN KEY (chat_id) REFERENCES user_profiles(chat_id) ON DELETE CASCADE
);

-- Tabela de mensagens armazenadas
CREATE TABLE IF NOT EXISTS conversation_history (
    id SERIAL PRIMARY KEY,
    chat_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    message_id TEXT,
    timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
    sentiment TEXT,
    engagement_score INTEGER,
    FOREIGN KEY (chat_id) REFERENCES user_profiles(chat_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_conversation_history_chat_timestamp
ON conversation_history(chat_id, timestamp DESC);

-- Tabela de follow-ups agendados
CREATE TABLE IF NOT EXISTS scheduled_followups (
    id SERIAL PRIMARY KEY,
    chat_id TEXT NOT NULL,
    scheduled_for TIMESTAMP NOT NULL,
    reason TEXT NOT NULL,
    message TEXT NOT NULL,
    attempt INTEGER NOT NULL DEFAULT 1 CHECK(attempt BETWEEN 1 AND 3),
    last_topic TEXT,
    last_stage TEXT,
    executed BOOLEAN DEFAULT FALSE,
    executed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    FOREIGN KEY (chat_id) REFERENCES user_profiles(chat_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_followups_pending
ON scheduled_followups(executed, scheduled_for);

-- Tabela de análises de conversão
CREATE TABLE IF NOT EXISTS conversion_opportunities (
    id SERIAL PRIMARY KEY,
    chat_id TEXT NOT NULL,
    score INTEGER NOT NULL CHECK(score BETWEEN 0 AND 100),
    reason TEXT NOT NULL,
    suggested_action TEXT NOT NULL,
    urgency_level TEXT NOT NULL CHECK(urgency_level IN ('baixa', 'media', 'alta')),
    close_message TEXT,
    detected_at TIMESTAMP NOT NULL DEFAULT NOW(),
    converted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (chat_id) REFERENCES user_profiles(chat_id) ON DELETE CASCADE
);

-- ==========================================
-- KNOWLEDGE GRAPH (NOVAS TABELAS)
-- ==========================================

-- TUTORES
CREATE TABLE IF NOT EXISTS tutors (
    tutor_id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    chat_id TEXT UNIQUE NOT NULL,

    -- Identificação
    nome TEXT NOT NULL,
    sobrenome TEXT,
    telefone TEXT,
    email TEXT,
    cpf TEXT,
    data_nascimento DATE,

    -- Endereço
    endereco_completo TEXT,
    cep TEXT,
    cidade TEXT DEFAULT 'Florianópolis',
    estado TEXT DEFAULT 'SC',
    bairro TEXT,

    -- Preferências de Comunicação
    horario_preferido TEXT CHECK(horario_preferido IN ('manha', 'tarde', 'noite', 'flexivel')),
    dia_preferido TEXT,
    metodo_pagamento_preferido TEXT CHECK(metodo_pagamento_preferido IN ('pix', 'cartao', 'dinheiro', 'transferencia')),

    estilo_comunicacao TEXT CHECK(estilo_comunicacao IN ('formal', 'casual', 'direto', 'detalhado')),
    frequencia_preferida TEXT CHECK(frequencia_preferida IN ('alta', 'media', 'baixa')),
    aceita_promocoes BOOLEAN DEFAULT TRUE,

    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_interaction TIMESTAMP,

    FOREIGN KEY (chat_id) REFERENCES user_profiles(chat_id) ON DELETE CASCADE
);

-- PETS
CREATE TABLE IF NOT EXISTS pets (
    pet_id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    tutor_id TEXT NOT NULL,

    -- Identificação
    nome TEXT NOT NULL,
    apelido TEXT,
    especie TEXT NOT NULL CHECK(especie IN ('cachorro', 'gato', 'ave', 'roedor', 'outro')),
    raca TEXT,

    -- Características Físicas
    porte TEXT CHECK(porte IN ('mini', 'pequeno', 'medio', 'grande', 'gigante')),
    peso_kg REAL,
    cor_pelagem TEXT,
    tipo_pelo TEXT CHECK(tipo_pelo IN ('curto', 'medio', 'longo', 'encaracolado', 'sem_pelo')),

    -- Informações Biológicas
    sexo TEXT CHECK(sexo IN ('macho', 'femea', 'nao_informado')),
    data_nascimento DATE,
    castrado BOOLEAN DEFAULT FALSE,
    microchip TEXT,

    -- Temperamento
    temperamento TEXT,
    nivel_energia TEXT CHECK(nivel_energia IN ('baixo', 'medio', 'alto', 'muito_alto')),
    sociavel_com_pets BOOLEAN,
    sociavel_com_pessoas BOOLEAN,
    sociavel_com_criancas BOOLEAN,

    -- Medos e Preferências (JSONB)
    tem_medo_de JSONB DEFAULT '[]',
    gosta_de JSONB DEFAULT '[]',

    -- Saúde
    alergias JSONB DEFAULT '[]',
    restricoes_medicas JSONB DEFAULT '[]',
    medicacao_continua TEXT,
    condicoes_cronicas JSONB DEFAULT '[]',

    -- Preferências de Serviço
    prefere_tosa_tesoura BOOLEAN DEFAULT FALSE,
    prefere_tosa_maquina BOOLEAN DEFAULT FALSE,
    sensivel_secador BOOLEAN DEFAULT FALSE,
    precisa_focinheira BOOLEAN DEFAULT FALSE,
    precisa_sedacao_leve BOOLEAN DEFAULT FALSE,

    -- Veterinário
    veterinario_nome TEXT,
    veterinario_telefone TEXT,
    ultima_consulta_veterinaria DATE,
    proxima_vacina DATE,

    -- Status
    ativo BOOLEAN DEFAULT TRUE,
    falecido BOOLEAN DEFAULT FALSE,
    data_falecimento DATE,
    foto_url TEXT,
    observacoes TEXT,

    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    FOREIGN KEY (tutor_id) REFERENCES tutors(tutor_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_pets_tutor ON pets(tutor_id);
CREATE INDEX IF NOT EXISTS idx_pets_ativo ON pets(ativo) WHERE ativo = TRUE;

-- HISTÓRICO DE SERVIÇOS
CREATE TABLE IF NOT EXISTS service_history (
    service_id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    pet_id TEXT NOT NULL,
    tutor_id TEXT NOT NULL,

    -- Tipo e Data
    servico_tipo TEXT NOT NULL CHECK(servico_tipo IN ('banho', 'tosa', 'hotel', 'veterinaria', 'adestramento', 'creche')),
    data_servico TIMESTAMP NOT NULL,
    hora_chegada TIME,
    hora_saida TIME,
    duracao_minutos INTEGER,

    -- Financeiro
    valor_cobrado REAL NOT NULL,
    valor_pago REAL,
    forma_pagamento TEXT,
    desconto_aplicado REAL DEFAULT 0,

    -- Detalhes (JSONB)
    produtos_utilizados JSONB DEFAULT '[]',
    profissional_responsavel TEXT,
    sala_utilizada TEXT,
    equipamentos_usados JSONB DEFAULT '[]',

    -- Comportamento do Pet
    pet_comportamento TEXT CHECK(pet_comportamento IN ('calmo', 'ansioso', 'agressivo', 'medroso', 'cooperativo')),
    nivel_stress INTEGER CHECK(nivel_stress BETWEEN 1 AND 5),
    precisou_contencao BOOLEAN DEFAULT FALSE,
    teve_acidentes BOOLEAN DEFAULT FALSE,
    observacoes_comportamento TEXT,

    -- Resultado
    resultado_servico TEXT CHECK(resultado_servico IN ('excelente', 'bom', 'regular', 'insatisfatorio')),
    satisfacao_cliente INTEGER CHECK(satisfacao_cliente BETWEEN 1 AND 5),
    avaliacao_cliente TEXT,
    observacoes_profissional TEXT,

    -- Fotos (JSONB)
    fotos_antes JSONB DEFAULT '[]',
    fotos_depois JSONB DEFAULT '[]',
    fotos_durante JSONB DEFAULT '[]',

    -- Próximos Passos
    proximo_agendamento_sugerido DATE,
    recomendacoes TEXT,
    alertas TEXT,

    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    FOREIGN KEY (pet_id) REFERENCES pets(pet_id) ON DELETE CASCADE,
    FOREIGN KEY (tutor_id) REFERENCES tutors(tutor_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_service_pet ON service_history(pet_id, data_servico DESC);
CREATE INDEX IF NOT EXISTS idx_service_tutor ON service_history(tutor_id, data_servico DESC);

-- EPISÓDIOS DE CONVERSAÇÃO
CREATE TABLE IF NOT EXISTS conversation_episodes (
    episode_id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    chat_id TEXT NOT NULL,
    tutor_id TEXT,

    -- Contexto Temporal
    inicio_conversa TIMESTAMP NOT NULL,
    fim_conversa TIMESTAMP,
    duracao_minutos INTEGER,
    hora_do_dia TEXT CHECK(hora_do_dia IN ('madrugada', 'manha', 'tarde', 'noite')),
    dia_semana TEXT,

    -- Contexto Emocional
    emocao_inicial TEXT,
    emocao_final TEXT,
    sentimento_geral TEXT CHECK(sentimento_geral IN ('positivo', 'neutro', 'negativo', 'frustrado', 'empolgado')),
    nivel_satisfacao INTEGER CHECK(nivel_satisfacao BETWEEN 1 AND 5),

    -- Contexto da Conversa
    intencao_principal TEXT,
    resultado TEXT,
    estagio_atingido TEXT,

    -- Análise Psicológica
    arquetipo_detectado TEXT,
    modo_marina_usado TEXT,
    mudancas_arquetipo JSONB DEFAULT '[]',

    -- Métricas
    num_mensagens_cliente INTEGER DEFAULT 0,
    num_mensagens_marina INTEGER DEFAULT 0,
    tempo_resposta_medio_ms INTEGER,
    taxa_engajamento REAL,

    -- Contexto de Negócio
    valor_venda REAL DEFAULT 0,
    servicos_mencionados JSONB DEFAULT '[]',
    servicos_vendidos JSONB DEFAULT '[]',
    upsell_realizado BOOLEAN DEFAULT FALSE,
    cross_sell_realizado BOOLEAN DEFAULT FALSE,

    -- Análise de Vendas
    pontos_dor_mencionados JSONB DEFAULT '[]',
    objecoes_levantadas JSONB DEFAULT '[]',
    gatilhos_usados JSONB DEFAULT '[]',
    gatilhos_funcionaram JSONB DEFAULT '[]',
    tecnicas_vendas_usadas JSONB DEFAULT '[]',

    observacoes TEXT,
    tags JSONB DEFAULT '[]',

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    FOREIGN KEY (chat_id) REFERENCES user_profiles(chat_id) ON DELETE CASCADE,
    FOREIGN KEY (tutor_id) REFERENCES tutors(tutor_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_episodes_chat ON conversation_episodes(chat_id, inicio_conversa DESC);

-- CONTEXTO EMOCIONAL
CREATE TABLE IF NOT EXISTS emotional_context (
    context_id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    chat_id TEXT NOT NULL,
    episode_id TEXT,
    message_id TEXT,

    timestamp TIMESTAMP NOT NULL DEFAULT NOW(),

    -- Estado Emocional
    emocao_primaria TEXT NOT NULL,
    emocao_secundaria TEXT,
    intensidade INTEGER CHECK(intensidade BETWEEN 0 AND 100),
    valence REAL CHECK(valence BETWEEN -1 AND 1),
    arousal REAL CHECK(arousal BETWEEN 0 AND 1),

    -- Gatilhos
    gatilho TEXT,
    contexto TEXT,
    mensagem_que_causou TEXT,

    -- Resposta da Marina
    validacao_aplicada BOOLEAN DEFAULT FALSE,
    tom_usado TEXT,
    tecnica_aplicada TEXT,
    resultado_emocional TEXT CHECK(resultado_emocional IN ('melhorou', 'neutro', 'piorou', 'estabilizou')),

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    FOREIGN KEY (episode_id) REFERENCES conversation_episodes(episode_id) ON DELETE CASCADE,
    FOREIGN KEY (chat_id) REFERENCES user_profiles(chat_id) ON DELETE CASCADE
);

-- PREFERÊNCIAS APRENDIDAS
CREATE TABLE IF NOT EXISTS learned_preferences (
    preference_id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    tutor_id TEXT NOT NULL,
    pet_id TEXT,

    -- Classificação
    categoria TEXT NOT NULL CHECK(categoria IN ('comunicacao', 'servico', 'horario', 'preco', 'produto', 'profissional', 'comportamento')),
    preferencia_chave TEXT NOT NULL,
    preferencia_valor TEXT NOT NULL,

    -- Confiança e Evidências
    confianca REAL CHECK(confianca BETWEEN 0 AND 1) DEFAULT 0.5,
    num_evidencias INTEGER DEFAULT 1,
    ultima_confirmacao TIMESTAMP,
    primeira_observacao TIMESTAMP NOT NULL DEFAULT NOW(),

    -- Fontes
    fonte TEXT CHECK(fonte IN ('declarado', 'inferido', 'observado', 'historico')),
    observacoes TEXT,

    -- Status
    ativo BOOLEAN DEFAULT TRUE,
    conflita_com TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    FOREIGN KEY (tutor_id) REFERENCES tutors(tutor_id) ON DELETE CASCADE,
    FOREIGN KEY (pet_id) REFERENCES pets(pet_id) ON DELETE CASCADE,
    UNIQUE(tutor_id, pet_id, categoria, preferencia_chave)
);

-- ONBOARDING PROGRESS
CREATE TABLE IF NOT EXISTS onboarding_progress (
    progress_id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    chat_id TEXT UNIQUE NOT NULL,
    tutor_id TEXT,

    -- Estado do Onboarding
    stage_atual TEXT NOT NULL DEFAULT 'inicial',

    -- Progresso
    campos_coletados JSONB DEFAULT '[]',
    campos_pendentes JSONB DEFAULT '[]',
    progresso_percentual INTEGER DEFAULT 0 CHECK(progresso_percentual BETWEEN 0 AND 100),

    -- Dados temporários
    dados_temporarios JSONB DEFAULT '{}',

    -- Metadata
    iniciado_em TIMESTAMP NOT NULL DEFAULT NOW(),
    completado_em TIMESTAMP,
    ultima_interacao TIMESTAMP,
    num_interacoes INTEGER DEFAULT 0,

    -- Status
    completo BOOLEAN DEFAULT FALSE,
    abandonado BOOLEAN DEFAULT FALSE,

    FOREIGN KEY (chat_id) REFERENCES user_profiles(chat_id) ON DELETE CASCADE,
    FOREIGN KEY (tutor_id) REFERENCES tutors(tutor_id) ON DELETE SET NULL
);

-- PAGAMENTOS
CREATE TABLE IF NOT EXISTS payments (
    payment_id TEXT PRIMARY KEY,
    chat_id TEXT NOT NULL,

    -- Provedor
    provider TEXT NOT NULL DEFAULT 'asaas',

    -- Valores
    amount REAL NOT NULL,
    original_amount REAL,
    discount_amount REAL DEFAULT 0,

    -- Status
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'cancelled', 'expired')),
    method TEXT NOT NULL DEFAULT 'pix' CHECK(method IN ('pix', 'credit_card', 'boleto', 'cash')),

    -- Detalhes
    description TEXT,
    payment_url TEXT,

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    confirmed_at TIMESTAMP,
    expires_at TIMESTAMP,

    FOREIGN KEY (chat_id) REFERENCES user_profiles(chat_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_payments_chat ON payments(chat_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status, created_at DESC);

-- ==========================================
-- FUNCTIONS E TRIGGERS
-- ==========================================

-- Trigger para atualizar updated_at em tutors
CREATE OR REPLACE FUNCTION update_tutors_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tutors_timestamp
BEFORE UPDATE ON tutors
FOR EACH ROW
EXECUTE FUNCTION update_tutors_timestamp();

-- Trigger para atualizar updated_at em pets
CREATE OR REPLACE FUNCTION update_pets_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_pets_timestamp
BEFORE UPDATE ON pets
FOR EACH ROW
EXECUTE FUNCTION update_pets_timestamp();

-- Trigger para atualizar updated_at em user_profiles
CREATE OR REPLACE FUNCTION update_user_profiles_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_profiles_timestamp
BEFORE UPDATE ON user_profiles
FOR EACH ROW
EXECUTE FUNCTION update_user_profiles_timestamp();

-- ==========================================
-- VIEWS
-- ==========================================

-- View: Perfil completo
CREATE OR REPLACE VIEW tutor_profile_complete AS
SELECT
    t.tutor_id,
    t.chat_id,
    t.nome AS tutor_nome,
    t.telefone,
    t.horario_preferido,
    t.estilo_comunicacao,
    COUNT(DISTINCT p.pet_id) AS num_pets,
    STRING_AGG(DISTINCT p.nome, ', ') AS pets_nomes,
    MAX(sh.data_servico) AS ultimo_servico,
    COUNT(sh.service_id) AS total_servicos,
    SUM(sh.valor_pago) AS valor_total_gasto,
    AVG(sh.satisfacao_cliente) AS satisfacao_media
FROM tutors t
LEFT JOIN pets p ON t.tutor_id = p.tutor_id AND p.ativo = TRUE
LEFT JOIN service_history sh ON t.tutor_id = sh.tutor_id
GROUP BY t.tutor_id, t.chat_id, t.nome, t.telefone, t.horario_preferido, t.estilo_comunicacao;

-- ==========================================
-- POLÍTICAS RLS (Row Level Security)
-- ==========================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutors ENABLE ROW LEVEL SECURITY;
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE emotional_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE learned_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso total para service role (usado pelo bot)
CREATE POLICY "Service role has full access" ON user_profiles FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role has full access" ON tutors FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role has full access" ON pets FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role has full access" ON service_history FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role has full access" ON conversation_episodes FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role has full access" ON emotional_context FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role has full access" ON learned_preferences FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role has full access" ON onboarding_progress FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role has full access" ON payments FOR ALL USING (auth.role() = 'service_role');

-- ==========================================
-- DONE! Schema completo migrado para Supabase
-- ==========================================

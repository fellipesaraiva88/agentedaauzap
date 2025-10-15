-- Schema para banco de dados de memória do cliente
-- Armazena perfis, histórico e análises comportamentais

-- Tabela principal de perfis de usuários
CREATE TABLE IF NOT EXISTS user_profiles (
    chat_id TEXT PRIMARY KEY,
    nome TEXT,
    pet_nome TEXT,
    pet_raca TEXT,
    pet_porte TEXT CHECK(pet_porte IN ('pequeno', 'medio', 'grande')),
    pet_tipo TEXT CHECK(pet_tipo IN ('cachorro', 'gato', 'ave', 'outro')),

    -- Timestamps
    first_contact_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_message_timestamp INTEGER NOT NULL,
    last_follow_up_date DATETIME,

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

    -- Preferências (JSON)
    preferences TEXT DEFAULT '{}',

    -- Notas
    notes TEXT,

    -- Metadata
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de histórico de tempos de resposta
CREATE TABLE IF NOT EXISTS response_times (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_id TEXT NOT NULL,
    response_time INTEGER NOT NULL, -- em milissegundos
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chat_id) REFERENCES user_profiles(chat_id) ON DELETE CASCADE
);

-- Índice para buscar últimas 10 respostas
CREATE INDEX IF NOT EXISTS idx_response_times_chat_timestamp
ON response_times(chat_id, timestamp DESC);

-- Tabela de interesses
CREATE TABLE IF NOT EXISTS user_interests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_id TEXT NOT NULL,
    interest TEXT NOT NULL, -- ex: "banho", "tosa", "hotel"
    mentioned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chat_id) REFERENCES user_profiles(chat_id) ON DELETE CASCADE
);

-- Tabela de objeções
CREATE TABLE IF NOT EXISTS user_objections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_id TEXT NOT NULL,
    objection TEXT NOT NULL, -- ex: "preço alto", "sem tempo"
    mentioned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (chat_id) REFERENCES user_profiles(chat_id) ON DELETE CASCADE
);

-- Tabela de histórico de compras/agendamentos
CREATE TABLE IF NOT EXISTS purchases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_id TEXT NOT NULL,
    service TEXT NOT NULL,
    value REAL NOT NULL,
    pet_name TEXT,
    purchase_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chat_id) REFERENCES user_profiles(chat_id) ON DELETE CASCADE
);

-- Tabela de mensagens armazenadas (para análise)
CREATE TABLE IF NOT EXISTS conversation_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    message_id TEXT, -- ID da mensagem do WhatsApp (para citações)
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sentiment TEXT,
    engagement_score INTEGER,
    FOREIGN KEY (chat_id) REFERENCES user_profiles(chat_id) ON DELETE CASCADE
);

-- Índice para buscar histórico recente
CREATE INDEX IF NOT EXISTS idx_conversation_history_chat_timestamp
ON conversation_history(chat_id, timestamp DESC);

-- Tabela de follow-ups agendados
CREATE TABLE IF NOT EXISTS scheduled_followups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_id TEXT NOT NULL,
    scheduled_for DATETIME NOT NULL,
    reason TEXT NOT NULL,
    message TEXT NOT NULL,
    attempt INTEGER NOT NULL DEFAULT 1 CHECK(attempt BETWEEN 1 AND 3),
    last_topic TEXT,
    last_stage TEXT,
    executed BOOLEAN DEFAULT FALSE,
    executed_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chat_id) REFERENCES user_profiles(chat_id) ON DELETE CASCADE
);

-- Índice para buscar follow-ups pendentes
CREATE INDEX IF NOT EXISTS idx_followups_pending
ON scheduled_followups(executed, scheduled_for);

-- Tabela de análises de conversão
CREATE TABLE IF NOT EXISTS conversion_opportunities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_id TEXT NOT NULL,
    score INTEGER NOT NULL CHECK(score BETWEEN 0 AND 100),
    reason TEXT NOT NULL,
    suggested_action TEXT NOT NULL,
    urgency_level TEXT NOT NULL CHECK(urgency_level IN ('baixa', 'media', 'alta')),
    close_message TEXT,
    detected_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    converted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (chat_id) REFERENCES user_profiles(chat_id) ON DELETE CASCADE
);

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER IF NOT EXISTS update_user_profiles_timestamp
AFTER UPDATE ON user_profiles
BEGIN
    UPDATE user_profiles SET updated_at = CURRENT_TIMESTAMP WHERE chat_id = NEW.chat_id;
END;

-- Views úteis

-- View: Clientes mais engajados
CREATE VIEW IF NOT EXISTS top_engaged_users AS
SELECT
    chat_id,
    nome,
    pet_nome,
    engagement_score,
    engagement_level,
    conversation_stage,
    total_messages
FROM user_profiles
WHERE engagement_level IN ('alto', 'muito_alto')
ORDER BY engagement_score DESC;

-- View: Follow-ups pendentes do dia
CREATE VIEW IF NOT EXISTS todays_followups AS
SELECT
    sf.id,
    sf.chat_id,
    up.nome,
    up.pet_nome,
    sf.scheduled_for,
    sf.message,
    sf.attempt
FROM scheduled_followups sf
JOIN user_profiles up ON sf.chat_id = up.chat_id
WHERE sf.executed = FALSE
    AND DATE(sf.scheduled_for) = DATE('now')
ORDER BY sf.scheduled_for;

-- View: Oportunidades de conversão ativas
CREATE VIEW IF NOT EXISTS active_conversion_opportunities AS
SELECT
    co.id,
    co.chat_id,
    up.nome,
    up.pet_nome,
    co.score,
    co.urgency_level,
    co.suggested_action,
    co.detected_at
FROM conversion_opportunities co
JOIN user_profiles up ON co.chat_id = up.chat_id
WHERE co.converted = FALSE
ORDER BY co.score DESC, co.urgency_level DESC;

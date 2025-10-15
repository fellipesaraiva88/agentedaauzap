-- Migration: Adiciona 'pragmatico' ao sentimento e 'ave' ao pet_tipo
-- Data: 2025-10-15
-- Motivo: Nova feature de análise de sentimento pragmático

-- SQLite não permite ALTER TABLE para modificar constraints CHECK
-- Precisamos recriar a tabela

-- 1. Criar tabela temporária com constraints atualizadas
CREATE TABLE user_profiles_new (
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

    -- Sentimento (ATUALIZADO: adicionado 'pragmatico')
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

-- 2. Copiar todos os dados da tabela antiga
INSERT INTO user_profiles_new
SELECT * FROM user_profiles;

-- 3. Deletar tabela antiga
DROP TABLE user_profiles;

-- 4. Renomear nova tabela
ALTER TABLE user_profiles_new RENAME TO user_profiles;

-- 5. Recriar trigger
CREATE TRIGGER IF NOT EXISTS update_user_profiles_timestamp
AFTER UPDATE ON user_profiles
BEGIN
    UPDATE user_profiles SET updated_at = CURRENT_TIMESTAMP WHERE chat_id = NEW.chat_id;
END;

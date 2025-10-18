-- ==========================================
-- KNOWLEDGE GRAPH SCHEMA
-- Modelo de dados para contexto contínuo
-- ==========================================

-- CAMADA 3: MEMÓRIA SEMÂNTICA

-- ENTIDADES PRINCIPAIS: TUTORES
CREATE TABLE IF NOT EXISTS tutors (
    tutor_id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
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
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_interaction DATETIME,

    -- Link com sistema legado
    FOREIGN KEY (chat_id) REFERENCES user_profiles(chat_id) ON DELETE CASCADE
);

-- ENTIDADES PRINCIPAIS: PETS
CREATE TABLE IF NOT EXISTS pets (
    pet_id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
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

    -- Temperamento e Comportamento
    temperamento TEXT, -- "calmo", "ansioso", "agressivo", "timido", "brincalhao"
    nivel_energia TEXT CHECK(nivel_energia IN ('baixo', 'medio', 'alto', 'muito_alto')),
    sociavel_com_pets BOOLEAN,
    sociavel_com_pessoas BOOLEAN,
    sociavel_com_criancas BOOLEAN,

    -- Medos e Preferências (JSON)
    tem_medo_de TEXT DEFAULT '[]', -- JSON: ["agua", "barulho", "estranhos"]
    gosta_de TEXT DEFAULT '[]',    -- JSON: ["carinho", "brincadeiras", "petiscos"]

    -- Saúde
    alergias TEXT DEFAULT '[]',    -- JSON: ["shampoo X", "ração Y"]
    restricoes_medicas TEXT DEFAULT '[]',
    medicacao_continua TEXT,
    condicoes_cronicas TEXT DEFAULT '[]',

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
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (tutor_id) REFERENCES tutors(tutor_id) ON DELETE CASCADE
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_pets_tutor ON pets(tutor_id);
CREATE INDEX IF NOT EXISTS idx_pets_ativo ON pets(ativo) WHERE ativo = TRUE;
CREATE INDEX IF NOT EXISTS idx_pets_especie ON pets(especie);

-- ==========================================
-- HISTÓRICO DE SERVIÇOS ENRIQUECIDO
-- ==========================================

CREATE TABLE IF NOT EXISTS service_history (
    service_id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    pet_id TEXT NOT NULL,
    tutor_id TEXT NOT NULL,

    -- Tipo e Data
    servico_tipo TEXT NOT NULL CHECK(servico_tipo IN ('banho', 'tosa', 'hotel', 'veterinaria', 'adestramento', 'creche')),
    data_servico DATETIME NOT NULL,
    hora_chegada TIME,
    hora_saida TIME,
    duracao_minutos INTEGER,

    -- Financeiro
    valor_cobrado REAL NOT NULL,
    valor_pago REAL,
    forma_pagamento TEXT,
    desconto_aplicado REAL DEFAULT 0,

    -- Detalhes do Serviço
    produtos_utilizados TEXT DEFAULT '[]', -- JSON: [{"nome": "Shampoo X", "marca": "Y"}]
    profissional_responsavel TEXT,
    sala_utilizada TEXT,
    equipamentos_usados TEXT DEFAULT '[]',

    -- Comportamento do Pet
    pet_comportamento TEXT CHECK(pet_comportamento IN ('calmo', 'ansioso', 'agressivo', 'medroso', 'cooperativo')),
    nivel_stress INTEGER CHECK(nivel_stress BETWEEN 1 AND 5),
    precisou_contencao BOOLEAN DEFAULT FALSE,
    teve_acidentes BOOLEAN DEFAULT FALSE,
    observacoes_comportamento TEXT,

    -- Resultado e Feedback
    resultado_servico TEXT CHECK(resultado_servico IN ('excelente', 'bom', 'regular', 'insatisfatorio')),
    satisfacao_cliente INTEGER CHECK(satisfacao_cliente BETWEEN 1 AND 5),
    avaliacao_cliente TEXT,
    observacoes_profissional TEXT,

    -- Fotos
    fotos_antes TEXT DEFAULT '[]', -- JSON: ["url1", "url2"]
    fotos_depois TEXT DEFAULT '[]',
    fotos_durante TEXT DEFAULT '[]',

    -- Próximos Passos
    proximo_agendamento_sugerido DATE,
    recomendacoes TEXT,
    alertas TEXT,

    -- Metadata
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (pet_id) REFERENCES pets(pet_id) ON DELETE CASCADE,
    FOREIGN KEY (tutor_id) REFERENCES tutors(tutor_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_service_pet ON service_history(pet_id, data_servico DESC);
CREATE INDEX IF NOT EXISTS idx_service_tutor ON service_history(tutor_id, data_servico DESC);
CREATE INDEX IF NOT EXISTS idx_service_tipo ON service_history(servico_tipo, data_servico DESC);

-- ==========================================
-- CAMADA 4: MEMÓRIA EPISÓDICA
-- ==========================================

-- EPISÓDIOS DE CONVERSAÇÃO
CREATE TABLE IF NOT EXISTS conversation_episodes (
    episode_id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    chat_id TEXT NOT NULL,
    tutor_id TEXT,

    -- Contexto Temporal
    inicio_conversa DATETIME NOT NULL,
    fim_conversa DATETIME,
    duracao_minutos INTEGER,
    hora_do_dia TEXT CHECK(hora_do_dia IN ('madrugada', 'manha', 'tarde', 'noite')),
    dia_semana TEXT,

    -- Contexto Emocional
    emocao_inicial TEXT,
    emocao_final TEXT,
    sentimento_geral TEXT CHECK(sentimento_geral IN ('positivo', 'neutro', 'negativo', 'frustrado', 'empolgado')),
    nivel_satisfacao INTEGER CHECK(nivel_satisfacao BETWEEN 1 AND 5),

    -- Contexto da Conversa
    intencao_principal TEXT CHECK(intencao_principal IN (
        'agendar_servico', 'tirar_duvida', 'reclamacao', 'elogio',
        'cancelamento', 'reagendamento', 'informacao_preco',
        'acompanhamento', 'emergencia'
    )),
    resultado TEXT CHECK(resultado IN (
        'agendamento_confirmado', 'duvida_resolvida', 'sem_fechamento',
        'cliente_desistiu', 'reagendou', 'cancelou', 'encaminhado'
    )),
    estagio_atingido TEXT CHECK(estagio_atingido IN (
        'descoberta', 'interesse', 'consideracao', 'decisao', 'pos_venda'
    )),

    -- Análise Psicológica
    arquetipo_detectado TEXT,
    modo_marina_usado TEXT,
    mudancas_arquetipo TEXT DEFAULT '[]', -- JSON: histórico de mudanças

    -- Métricas de Interação
    num_mensagens_cliente INTEGER DEFAULT 0,
    num_mensagens_marina INTEGER DEFAULT 0,
    tempo_resposta_medio_ms INTEGER,
    taxa_engajamento REAL,

    -- Contexto de Negócio
    valor_venda REAL DEFAULT 0,
    servicos_mencionados TEXT DEFAULT '[]', -- JSON
    servicos_vendidos TEXT DEFAULT '[]',
    upsell_realizado BOOLEAN DEFAULT FALSE,
    cross_sell_realizado BOOLEAN DEFAULT FALSE,

    -- Análise de Vendas
    pontos_dor_mencionados TEXT DEFAULT '[]', -- JSON
    objecoes_levantadas TEXT DEFAULT '[]',
    gatilhos_usados TEXT DEFAULT '[]',
    gatilhos_funcionaram TEXT DEFAULT '[]',
    tecnicas_vendas_usadas TEXT DEFAULT '[]',

    -- Observações
    observacoes TEXT,
    tags TEXT DEFAULT '[]', -- JSON: ["vip", "recorrente", "primeira_vez"]

    -- Metadata
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (chat_id) REFERENCES user_profiles(chat_id) ON DELETE CASCADE,
    FOREIGN KEY (tutor_id) REFERENCES tutors(tutor_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_episodes_chat ON conversation_episodes(chat_id, inicio_conversa DESC);
CREATE INDEX IF NOT EXISTS idx_episodes_tutor ON conversation_episodes(tutor_id, inicio_conversa DESC);
CREATE INDEX IF NOT EXISTS idx_episodes_resultado ON conversation_episodes(resultado, inicio_conversa DESC);

-- ==========================================
-- CONTEXTO EMOCIONAL HISTÓRICO
-- ==========================================

CREATE TABLE IF NOT EXISTS emotional_context (
    context_id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    chat_id TEXT NOT NULL,
    episode_id TEXT,
    message_id TEXT, -- ID da mensagem específica

    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Estado Emocional
    emocao_primaria TEXT NOT NULL,
    emocao_secundaria TEXT,
    intensidade INTEGER CHECK(intensidade BETWEEN 0 AND 100),
    valence REAL CHECK(valence BETWEEN -1 AND 1), -- -1 negativo, +1 positivo
    arousal REAL CHECK(arousal BETWEEN 0 AND 1),  -- 0 calmo, 1 agitado

    -- Gatilhos
    gatilho TEXT,
    contexto TEXT,
    mensagem_que_causou TEXT,

    -- Resposta da Marina
    validacao_aplicada BOOLEAN DEFAULT FALSE,
    tom_usado TEXT,
    tecnica_aplicada TEXT,
    resultado_emocional TEXT CHECK(resultado_emocional IN ('melhorou', 'neutro', 'piorou', 'estabilizou')),

    -- Metadata
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (episode_id) REFERENCES conversation_episodes(episode_id) ON DELETE CASCADE,
    FOREIGN KEY (chat_id) REFERENCES user_profiles(chat_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_emotional_episode ON emotional_context(episode_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_emotional_chat ON emotional_context(chat_id, timestamp DESC);

-- ==========================================
-- PREFERÊNCIAS APRENDIDAS
-- ==========================================

CREATE TABLE IF NOT EXISTS learned_preferences (
    preference_id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    tutor_id TEXT NOT NULL,
    pet_id TEXT, -- Se for específico de um pet

    -- Classificação
    categoria TEXT NOT NULL CHECK(categoria IN (
        'comunicacao', 'servico', 'horario', 'preco',
        'produto', 'profissional', 'comportamento'
    )),
    preferencia_chave TEXT NOT NULL,
    preferencia_valor TEXT NOT NULL,

    -- Confiança e Evidências
    confianca REAL CHECK(confianca BETWEEN 0 AND 1) DEFAULT 0.5,
    num_evidencias INTEGER DEFAULT 1,
    ultima_confirmacao DATETIME,
    primeira_observacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Fontes
    fonte TEXT CHECK(fonte IN ('declarado', 'inferido', 'observado', 'historico')),
    observacoes TEXT,

    -- Status
    ativo BOOLEAN DEFAULT TRUE,
    conflita_com TEXT, -- preference_id de preferência conflitante

    -- Metadata
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (tutor_id) REFERENCES tutors(tutor_id) ON DELETE CASCADE,
    FOREIGN KEY (pet_id) REFERENCES pets(pet_id) ON DELETE CASCADE,
    UNIQUE(tutor_id, pet_id, categoria, preferencia_chave)
);

CREATE INDEX IF NOT EXISTS idx_preferences_tutor ON learned_preferences(tutor_id, ativo);
CREATE INDEX IF NOT EXISTS idx_preferences_pet ON learned_preferences(pet_id, ativo);
CREATE INDEX IF NOT EXISTS idx_preferences_categoria ON learned_preferences(categoria, ativo);

-- ==========================================
-- SISTEMA DE ONBOARDING
-- ==========================================

CREATE TABLE IF NOT EXISTS onboarding_progress (
    progress_id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    chat_id TEXT UNIQUE NOT NULL,
    tutor_id TEXT,

    -- Estado do Onboarding
    stage_atual TEXT NOT NULL DEFAULT 'inicial' CHECK(stage_atual IN (
        'inicial', 'nome_tutor', 'nome_pet', 'tipo_pet',
        'caracteristicas', 'temperamento', 'necessidade', 'completo'
    )),

    -- Progresso
    campos_coletados TEXT DEFAULT '[]', -- JSON: ["nome_tutor", "nome_pet", ...]
    campos_pendentes TEXT DEFAULT '[]',
    progresso_percentual INTEGER DEFAULT 0 CHECK(progresso_percentual BETWEEN 0 AND 100),

    -- Informações coletadas temporariamente
    dados_temporarios TEXT DEFAULT '{}', -- JSON com dados sendo coletados

    -- Metadata
    iniciado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completado_em DATETIME,
    ultima_interacao DATETIME,
    num_interacoes INTEGER DEFAULT 0,

    -- Status
    completo BOOLEAN DEFAULT FALSE,
    abandonado BOOLEAN DEFAULT FALSE,

    FOREIGN KEY (chat_id) REFERENCES user_profiles(chat_id) ON DELETE CASCADE,
    FOREIGN KEY (tutor_id) REFERENCES tutors(tutor_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_onboarding_stage ON onboarding_progress(stage_atual, completo);
CREATE INDEX IF NOT EXISTS idx_onboarding_chat ON onboarding_progress(chat_id);

-- ==========================================
-- VIEWS ÚTEIS
-- ==========================================

-- View: Perfil completo de tutor + pets
CREATE VIEW IF NOT EXISTS tutor_profile_complete AS
SELECT
    t.tutor_id,
    t.chat_id,
    t.nome AS tutor_nome,
    t.telefone,
    t.horario_preferido,
    t.estilo_comunicacao,
    COUNT(DISTINCT p.pet_id) AS num_pets,
    GROUP_CONCAT(p.nome, ', ') AS pets_nomes,
    MAX(sh.data_servico) AS ultimo_servico,
    COUNT(sh.service_id) AS total_servicos,
    SUM(sh.valor_pago) AS valor_total_gasto,
    AVG(sh.satisfacao_cliente) AS satisfacao_media
FROM tutors t
LEFT JOIN pets p ON t.tutor_id = p.tutor_id AND p.ativo = TRUE
LEFT JOIN service_history sh ON t.tutor_id = sh.tutor_id
GROUP BY t.tutor_id;

-- View: Próximas ações necessárias
CREATE VIEW IF NOT EXISTS next_actions_needed AS
SELECT
    t.tutor_id,
    t.nome AS tutor_nome,
    p.pet_id,
    p.nome AS pet_nome,
    p.proxima_vacina,
    sh.proximo_agendamento_sugerido,
    CASE
        WHEN p.proxima_vacina <= date('now', '+7 days') THEN 'vacina_proxima'
        WHEN sh.proximo_agendamento_sugerido <= date('now', '+3 days') THEN 'servico_sugerido'
        WHEN julianday('now') - julianday(MAX(sh.data_servico)) > 30 THEN 'cliente_inativo'
        ELSE 'nenhuma'
    END AS acao_necessaria
FROM tutors t
JOIN pets p ON t.tutor_id = p.tutor_id
LEFT JOIN service_history sh ON p.pet_id = sh.pet_id
WHERE p.ativo = TRUE
GROUP BY t.tutor_id, p.pet_id
HAVING acao_necessaria != 'nenhuma';

-- View: Análise de conversão por episódio
CREATE VIEW IF NOT EXISTS conversion_analysis AS
SELECT
    ce.episode_id,
    ce.chat_id,
    t.nome AS tutor_nome,
    ce.inicio_conversa,
    ce.intencao_principal,
    ce.resultado,
    ce.arquetipo_detectado,
    ce.valor_venda,
    ce.num_mensagens_cliente + ce.num_mensagens_marina AS total_mensagens,
    ce.duracao_minutos,
    CASE
        WHEN ce.resultado IN ('agendamento_confirmado', 'duvida_resolvida') THEN 'sucesso'
        WHEN ce.resultado IN ('cliente_desistiu', 'sem_fechamento') THEN 'falha'
        ELSE 'neutro'
    END AS status_conversao
FROM conversation_episodes ce
LEFT JOIN tutors t ON ce.tutor_id = t.tutor_id
ORDER BY ce.inicio_conversa DESC;

-- ==========================================
-- TRIGGERS
-- ==========================================

-- Trigger: Atualiza updated_at em tutors
CREATE TRIGGER IF NOT EXISTS update_tutors_timestamp
AFTER UPDATE ON tutors
BEGIN
    UPDATE tutors SET updated_at = CURRENT_TIMESTAMP WHERE tutor_id = NEW.tutor_id;
END;

-- Trigger: Atualiza updated_at em pets
CREATE TRIGGER IF NOT EXISTS update_pets_timestamp
AFTER UPDATE ON pets
BEGIN
    UPDATE pets SET updated_at = CURRENT_TIMESTAMP WHERE pet_id = NEW.pet_id;
END;

-- Trigger: Atualiza confiança de preferência ao adicionar evidência
CREATE TRIGGER IF NOT EXISTS update_preference_confidence
AFTER UPDATE ON learned_preferences
WHEN NEW.num_evidencias > OLD.num_evidencias
BEGIN
    UPDATE learned_preferences
    SET confianca = MIN(1.0, 0.3 + (NEW.num_evidencias * 0.1))
    WHERE preference_id = NEW.preference_id;
END;

-- Trigger: Marca onboarding como completo quando progresso = 100
CREATE TRIGGER IF NOT EXISTS complete_onboarding
AFTER UPDATE ON onboarding_progress
WHEN NEW.progresso_percentual = 100 AND OLD.completo = FALSE
BEGIN
    UPDATE onboarding_progress
    SET
        completo = TRUE,
        completado_em = CURRENT_TIMESTAMP,
        stage_atual = 'completo'
    WHERE progress_id = NEW.progress_id;
END;

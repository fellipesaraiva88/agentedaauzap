-- ================================================================
-- MIGRATION 005: SISTEMA COMPLETO DE AGENDAMENTOS E SERVIÇOS
-- ================================================================
-- Sistema multi-tenant com:
-- - Empresas (petshops)
-- - Serviços configuráveis por empresa
-- - Agendamentos com verificação de disponibilidade
-- - Slots de horário e datas bloqueadas
-- ================================================================

-- ================================================================
-- 1. TABELA DE EMPRESAS (Multi-tenant)
-- ================================================================
CREATE TABLE IF NOT EXISTS companies (
    id SERIAL PRIMARY KEY,

    -- Informações básicas
    nome TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL, -- URL-friendly: "saraiva-pets"

    -- Contato
    whatsapp TEXT, -- Número WhatsApp principal
    email TEXT,
    telefone TEXT,

    -- Endereço
    endereco_rua TEXT,
    endereco_numero TEXT,
    endereco_bairro TEXT,
    endereco_cidade TEXT,
    endereco_estado TEXT,
    endereco_cep TEXT,
    endereco_completo TEXT, -- Formatado para envio
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),

    -- Branding
    logo_url TEXT,
    cor_primaria TEXT, -- hex: #FF5733
    cor_secundaria TEXT,

    -- Configuração do agente
    agente_nome TEXT DEFAULT 'Marina', -- Nome do agente
    agente_persona TEXT DEFAULT 'prestativa', -- Persona: prestativa, formal, casual
    agente_config JSONB DEFAULT '{}', -- Configurações adicionais

    -- Horário de funcionamento (JSON)
    -- Exemplo: {"segunda": "08:00-18:00", "domingo": "fechado"}
    horario_funcionamento JSONB DEFAULT '{}',

    -- Status
    ativo BOOLEAN DEFAULT TRUE,
    plano TEXT DEFAULT 'basic', -- basic, premium, enterprise

    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_companies_slug ON companies(slug);
CREATE INDEX IF NOT EXISTS idx_companies_ativo ON companies(ativo);

-- ================================================================
-- 2. TABELA DE SERVIÇOS
-- ================================================================
CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

    -- Informações do serviço
    nome TEXT NOT NULL, -- "Banho", "Tosa", "Consulta Veterinária"
    descricao TEXT,
    categoria TEXT, -- "higiene", "estetica", "saude", "hospedagem"
    subcategoria TEXT, -- "banho", "tosa", "veterinaria", "hotel"

    -- Duração
    duracao_minutos INTEGER NOT NULL DEFAULT 60, -- Duração em minutos

    -- Preços por porte
    preco_pequeno DECIMAL(10, 2), -- Porte P
    preco_medio DECIMAL(10, 2), -- Porte M
    preco_grande DECIMAL(10, 2), -- Porte G
    preco_base DECIMAL(10, 2), -- Preço fixo (se não variar por porte)

    -- Configurações
    requer_agendamento BOOLEAN DEFAULT TRUE, -- Requer agendamento prévio
    permite_walk_in BOOLEAN DEFAULT FALSE, -- Aceita sem agendamento
    capacidade_simultanea INTEGER DEFAULT 1, -- Quantos pets ao mesmo tempo

    -- Status
    ativo BOOLEAN DEFAULT TRUE,
    ordem INTEGER DEFAULT 0, -- Para ordenação no menu

    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Garantir que cada serviço é único por empresa
    UNIQUE(company_id, nome)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_services_company ON services(company_id);
CREATE INDEX IF NOT EXISTS idx_services_ativo ON services(ativo);
CREATE INDEX IF NOT EXISTS idx_services_categoria ON services(categoria);

-- ================================================================
-- 3. TABELA DE SLOTS DE DISPONIBILIDADE
-- ================================================================
CREATE TABLE IF NOT EXISTS availability_slots (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

    -- Dia da semana (0-6, onde 0 = domingo)
    dia_semana INTEGER NOT NULL CHECK(dia_semana BETWEEN 0 AND 6),

    -- Horário
    hora_inicio TIME NOT NULL, -- "08:00"
    hora_fim TIME NOT NULL, -- "18:00"

    -- Capacidade
    capacidade_simultanea INTEGER DEFAULT 2, -- Quantos agendamentos ao mesmo tempo

    -- Status
    ativo BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Garantir que não há sobreposição de horários no mesmo dia
    UNIQUE(company_id, dia_semana, hora_inicio, hora_fim)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_availability_company ON availability_slots(company_id);
CREATE INDEX IF NOT EXISTS idx_availability_dia ON availability_slots(dia_semana);

-- ================================================================
-- 4. TABELA DE DATAS BLOQUEADAS
-- ================================================================
CREATE TABLE IF NOT EXISTS blocked_dates (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

    -- Data bloqueada
    data DATE NOT NULL,

    -- Motivo
    motivo TEXT, -- "Feriado", "Manutenção", "Evento especial"

    -- Bloqueio parcial ou total
    bloqueio_total BOOLEAN DEFAULT TRUE, -- Se FALSE, alguns horários podem estar disponíveis
    hora_inicio TIME, -- Se bloqueio parcial
    hora_fim TIME, -- Se bloqueio parcial

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(company_id, data, hora_inicio, hora_fim)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_blocked_dates_company ON blocked_dates(company_id);
CREATE INDEX IF NOT EXISTS idx_blocked_dates_data ON blocked_dates(data);

-- ================================================================
-- 5. TABELA DE AGENDAMENTOS
-- ================================================================
CREATE TABLE IF NOT EXISTS appointments (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

    -- Cliente (referência ao tutor, será criado depois)
    chat_id TEXT NOT NULL, -- WhatsApp chat ID
    tutor_nome TEXT,
    tutor_telefone TEXT,

    -- Pet
    pet_nome TEXT,
    pet_tipo TEXT, -- cachorro, gato, etc
    pet_porte TEXT CHECK(pet_porte IN ('pequeno', 'medio', 'grande')),

    -- Serviço
    service_id INTEGER NOT NULL REFERENCES services(id),
    service_nome TEXT NOT NULL, -- Desnormalizado para histórico

    -- Data e hora
    data_agendamento DATE NOT NULL,
    hora_agendamento TIME NOT NULL,
    duracao_minutos INTEGER NOT NULL,

    -- Preço
    preco DECIMAL(10, 2) NOT NULL,

    -- Status
    status TEXT NOT NULL DEFAULT 'pendente'
        CHECK(status IN ('pendente', 'confirmado', 'em_atendimento', 'concluido', 'cancelado', 'nao_compareceu')),

    -- Observações
    observacoes TEXT,
    motivo_cancelamento TEXT,

    -- Confirmações
    confirmado_cliente BOOLEAN DEFAULT FALSE,
    confirmado_empresa BOOLEAN DEFAULT FALSE,

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    cancelado_at TIMESTAMP,
    concluido_at TIMESTAMP
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_appointments_company ON appointments(company_id);
CREATE INDEX IF NOT EXISTS idx_appointments_chat ON appointments(chat_id);
CREATE INDEX IF NOT EXISTS idx_appointments_data ON appointments(data_agendamento);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_service ON appointments(service_id);

-- Índice composto para buscar agendamentos por empresa e data
CREATE INDEX IF NOT EXISTS idx_appointments_company_data
    ON appointments(company_id, data_agendamento, hora_agendamento);

-- ================================================================
-- 6. TABELA DE HISTÓRICO DE STATUS
-- ================================================================
-- Rastreia todas as mudanças de status de um agendamento
CREATE TABLE IF NOT EXISTS appointment_status_history (
    id SERIAL PRIMARY KEY,
    appointment_id INTEGER NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,

    status_anterior TEXT,
    status_novo TEXT NOT NULL,

    motivo TEXT,
    alterado_por TEXT, -- "cliente", "sistema", "empresa"

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índice
CREATE INDEX IF NOT EXISTS idx_status_history_appointment
    ON appointment_status_history(appointment_id, created_at DESC);

-- ================================================================
-- 7. FUNÇÕES E TRIGGERS
-- ================================================================

-- Trigger para atualizar updated_at em companies
DROP TRIGGER IF EXISTS update_companies_timestamp ON companies;
CREATE TRIGGER update_companies_timestamp
    BEFORE UPDATE ON companies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para atualizar updated_at em services
DROP TRIGGER IF EXISTS update_services_timestamp ON services;
CREATE TRIGGER update_services_timestamp
    BEFORE UPDATE ON services
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para atualizar updated_at em appointments
DROP TRIGGER IF EXISTS update_appointments_timestamp ON appointments;
CREATE TRIGGER update_appointments_timestamp
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para registrar mudanças de status
CREATE OR REPLACE FUNCTION log_appointment_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO appointment_status_history (
            appointment_id,
            status_anterior,
            status_novo,
            alterado_por
        ) VALUES (
            NEW.id,
            OLD.status,
            NEW.status,
            'sistema' -- Pode ser parametrizado depois
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS track_appointment_status ON appointments;
CREATE TRIGGER track_appointment_status
    AFTER UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION log_appointment_status_change();

-- ================================================================
-- 8. VIEWS ÚTEIS
-- ================================================================

-- View: Agendamentos do dia
CREATE OR REPLACE VIEW agendamentos_hoje AS
SELECT
    a.id,
    c.nome AS empresa,
    a.chat_id,
    a.tutor_nome,
    a.pet_nome,
    a.service_nome,
    a.hora_agendamento,
    a.duracao_minutos,
    a.status,
    a.preco
FROM appointments a
JOIN companies c ON a.company_id = c.id
WHERE a.data_agendamento = CURRENT_DATE
    AND a.status IN ('pendente', 'confirmado')
ORDER BY a.hora_agendamento;

-- View: Próximos agendamentos (próximos 7 dias)
CREATE OR REPLACE VIEW proximos_agendamentos AS
SELECT
    a.id,
    c.nome AS empresa,
    a.chat_id,
    a.tutor_nome,
    a.pet_nome,
    a.service_nome,
    a.data_agendamento,
    a.hora_agendamento,
    a.status,
    a.preco
FROM appointments a
JOIN companies c ON a.company_id = c.id
WHERE a.data_agendamento BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
    AND a.status IN ('pendente', 'confirmado')
ORDER BY a.data_agendamento, a.hora_agendamento;

-- View: Estatísticas de agendamentos por empresa
CREATE OR REPLACE VIEW stats_agendamentos_empresa AS
SELECT
    company_id,
    COUNT(*) as total_agendamentos,
    COUNT(*) FILTER (WHERE status = 'concluido') as concluidos,
    COUNT(*) FILTER (WHERE status = 'cancelado') as cancelados,
    COUNT(*) FILTER (WHERE status = 'nao_compareceu') as nao_compareceu,
    ROUND(AVG(preco), 2) as valor_medio,
    SUM(preco) FILTER (WHERE status = 'concluido') as receita_total
FROM appointments
GROUP BY company_id;

-- View: Serviços mais populares
CREATE OR REPLACE VIEW servicos_populares AS
SELECT
    s.company_id,
    s.id as service_id,
    s.nome as service_nome,
    COUNT(a.id) as total_agendamentos,
    ROUND(AVG(a.preco), 2) as preco_medio
FROM services s
LEFT JOIN appointments a ON s.id = a.service_id
GROUP BY s.company_id, s.id, s.nome
ORDER BY total_agendamentos DESC;

-- ================================================================
-- 9. DADOS INICIAIS (SEED)
-- ================================================================

-- Inserir empresa padrão (Auzap Pet Shop)
INSERT INTO companies (
    nome,
    slug,
    whatsapp,
    endereco_rua,
    endereco_numero,
    endereco_bairro,
    endereco_cidade,
    endereco_estado,
    endereco_cep,
    endereco_completo,
    agente_nome,
    agente_persona,
    horario_funcionamento
) VALUES (
    'Auzap Pet Shop',
    'auzap-pets',
    '5511991143605',
    'Rua das Gaivotas',
    '86',
    'Ingleses do Rio Vermelho',
    'Florianópolis',
    'SC',
    '88058-500',
    'Rua das Gaivotas, 86 - Ingleses, Florianópolis - SC, 88058-500',
    'Marina',
    'prestativa',
    '{
        "segunda": "08:00-18:00",
        "terca": "08:00-18:00",
        "quarta": "08:00-18:00",
        "quinta": "08:00-18:00",
        "sexta": "08:00-18:00",
        "sabado": "08:00-14:00",
        "domingo": "fechado"
    }'::jsonb
) ON CONFLICT (slug) DO NOTHING;

-- Inserir serviços padrão
INSERT INTO services (
    company_id,
    nome,
    descricao,
    categoria,
    subcategoria,
    duracao_minutos,
    preco_pequeno,
    preco_medio,
    preco_grande,
    ordem
)
SELECT
    c.id,
    s.nome,
    s.descricao,
    s.categoria,
    s.subcategoria,
    s.duracao_minutos,
    s.preco_pequeno,
    s.preco_medio,
    s.preco_grande,
    s.ordem
FROM companies c
CROSS JOIN (VALUES
    ('Banho', 'Banho completo com shampoo especial, condicionador e secagem', 'higiene', 'banho', 60, 50.00, 70.00, 120.00, 1),
    ('Tosa Higiênica', 'Limpeza de pelos das patas, região íntima, barriga e focinho', 'estetica', 'tosa', 45, 40.00, 50.00, 70.00, 2),
    ('Tosa Completa', 'Corte de pelos em todo o corpo conforme raça ou preferência', 'estetica', 'tosa', 90, 70.00, 90.00, 150.00, 3),
    ('Banho e Tosa', 'Pacote completo de banho + tosa com desconto', 'higiene', 'banho', 120, 80.00, 110.00, 180.00, 4),
    ('Hidratação', 'Tratamento especial para pelos ressecados', 'estetica', 'estetica', 30, 25.00, 35.00, 50.00, 5),
    ('Consulta Veterinária', 'Atendimento veterinário com profissionais qualificados', 'saude', 'veterinaria', 30, 150.00, 150.00, 150.00, 6),
    ('Vacinação', 'Aplicação de vacinas essenciais e reforços', 'saude', 'veterinaria', 15, 80.00, 80.00, 80.00, 7),
    ('Hotel Pet', 'Hospedagem com acomodações confortáveis (diária)', 'hospedagem', 'hotel', 1440, 60.00, 80.00, 120.00, 8),
    ('Day Care', 'Cuidados diurnos para seu pet (8 horas)', 'hospedagem', 'hotel', 480, 40.00, 50.00, 70.00, 9)
) AS s(nome, descricao, categoria, subcategoria, duracao_minutos, preco_pequeno, preco_medio, preco_grande, ordem)
WHERE c.slug = 'auzap-pets'
ON CONFLICT (company_id, nome) DO NOTHING;

-- Inserir slots de disponibilidade padrão (segunda a sexta, 8h-18h)
INSERT INTO availability_slots (company_id, dia_semana, hora_inicio, hora_fim, capacidade_simultanea)
SELECT
    c.id,
    dia,
    '08:00'::TIME,
    '18:00'::TIME,
    2
FROM companies c
CROSS JOIN generate_series(1, 5) AS dia -- Segunda (1) a Sexta (5)
WHERE c.slug = 'auzap-pets'
ON CONFLICT DO NOTHING;

-- Inserir slot de sábado (8h-14h)
INSERT INTO availability_slots (company_id, dia_semana, hora_inicio, hora_fim, capacidade_simultanea)
SELECT
    c.id,
    6, -- Sábado
    '08:00'::TIME,
    '14:00'::TIME,
    2
FROM companies c
WHERE c.slug = 'auzap-pets'
ON CONFLICT DO NOTHING;

-- ================================================================
-- FIM DA MIGRATION
-- ================================================================

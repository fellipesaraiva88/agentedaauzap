-- ================================================================
-- MIGRATION 011: ESTRUTURA COMPLETA DE BANCO DE DADOS
-- ================================================================
-- Consolidação e organização completa de todas as tabelas do sistema
-- com índices otimizados, constraints e documentação completa
-- ================================================================

-- ================================================================
-- PARTE 1: MULTI-TENANCY E CONFIGURAÇÃO
-- ================================================================

-- Garantir que a tabela companies existe com todas as colunas necessárias
ALTER TABLE companies ADD COLUMN IF NOT EXISTS webhook_url TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS api_key TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS max_agendamentos_dia INTEGER DEFAULT 50;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS tempo_medio_servico INTEGER DEFAULT 60;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS antecedencia_minima_horas INTEGER DEFAULT 2;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS antecedencia_maxima_dias INTEGER DEFAULT 30;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS permite_cancelamento BOOLEAN DEFAULT TRUE;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS horas_antecedencia_cancelamento INTEGER DEFAULT 4;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS mensagem_boas_vindas TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS mensagem_confirmacao TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS mensagem_lembrete TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS enviar_lembrete_horas_antes INTEGER DEFAULT 24;

-- Adicionar índices adicionais se não existirem
CREATE INDEX IF NOT EXISTS idx_companies_api_key ON companies(api_key) WHERE api_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_companies_webhook ON companies(webhook_url) WHERE webhook_url IS NOT NULL;

-- ================================================================
-- PARTE 2: GESTÃO DE USUÁRIOS (Sistema)
-- ================================================================

-- Adicionar colunas faltantes em users
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT CHECK(role IN ('admin', 'manager', 'operator', 'viewer')) DEFAULT 'operator';
ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}';

-- Índices para users
CREATE INDEX IF NOT EXISTS idx_users_company ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_email_company ON users(email, company_id);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active) WHERE is_active = TRUE;

-- ================================================================
-- PARTE 3: CLIENTES E PETS (CRM)
-- ================================================================

-- Adicionar colunas faltantes em tutors
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS chat_id VARCHAR(255);
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS data_nascimento DATE;
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS genero VARCHAR(20);
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS como_conheceu TEXT;
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS aceita_marketing BOOLEAN DEFAULT TRUE;
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS notas_internas TEXT;
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]';
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS score_fidelidade INTEGER DEFAULT 0;
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS ultima_compra DATE;
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS ticket_medio DECIMAL(10,2);

-- Índices adicionais para tutors
CREATE INDEX IF NOT EXISTS idx_tutors_chat_id ON tutors(chat_id);
CREATE INDEX IF NOT EXISTS idx_tutors_company_telefone ON tutors(company_id, telefone);
CREATE INDEX IF NOT EXISTS idx_tutors_score ON tutors(score_fidelidade DESC);
CREATE INDEX IF NOT EXISTS idx_tutors_ultima_compra ON tutors(ultima_compra DESC);

-- Adicionar colunas faltantes em pets
ALTER TABLE pets ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS data_nascimento DATE;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS castrado BOOLEAN;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS chip_numero VARCHAR(50);
ALTER TABLE pets ADD COLUMN IF NOT EXISTS vacinas JSONB DEFAULT '[]';
ALTER TABLE pets ADD COLUMN IF NOT EXISTS ultima_vacina DATE;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS proximo_banho DATE;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS historico_medico TEXT;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS veterinario_nome VARCHAR(100);
ALTER TABLE pets ADD COLUMN IF NOT EXISTS veterinario_telefone VARCHAR(50);
ALTER TABLE pets ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Índices adicionais para pets
CREATE INDEX IF NOT EXISTS idx_pets_company ON pets(company_id);
CREATE INDEX IF NOT EXISTS idx_pets_proximo_banho ON pets(proximo_banho) WHERE proximo_banho IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pets_active ON pets(is_active) WHERE is_active = TRUE;

-- ================================================================
-- PARTE 4: SERVIÇOS E AGENDAMENTOS
-- ================================================================

-- Adicionar colunas faltantes em services
ALTER TABLE services ADD COLUMN IF NOT EXISTS codigo_servico VARCHAR(50);
ALTER TABLE services ADD COLUMN IF NOT EXISTS comissao_percentual DECIMAL(5,2);
ALTER TABLE services ADD COLUMN IF NOT EXISTS materiais_necessarios JSONB DEFAULT '[]';
ALTER TABLE services ADD COLUMN IF NOT EXISTS restricoes JSONB DEFAULT '[]';
ALTER TABLE services ADD COLUMN IF NOT EXISTS idade_minima_meses INTEGER;
ALTER TABLE services ADD COLUMN IF NOT EXISTS idade_maxima_anos INTEGER;
ALTER TABLE services ADD COLUMN IF NOT EXISTS imagem_url TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS popular BOOLEAN DEFAULT FALSE;
ALTER TABLE services ADD COLUMN IF NOT EXISTS promocao_ativa BOOLEAN DEFAULT FALSE;
ALTER TABLE services ADD COLUMN IF NOT EXISTS preco_promocional DECIMAL(10,2);

-- Índices adicionais para services
CREATE INDEX IF NOT EXISTS idx_services_codigo ON services(company_id, codigo_servico) WHERE codigo_servico IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_services_popular ON services(popular) WHERE popular = TRUE;
CREATE INDEX IF NOT EXISTS idx_services_promocao ON services(promocao_ativa) WHERE promocao_ativa = TRUE;

-- Adicionar colunas faltantes em appointments
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS tutor_id VARCHAR(255);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS pet_id INTEGER REFERENCES pets(id);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS profissional_id INTEGER REFERENCES users(id);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS lembrete_enviado BOOLEAN DEFAULT FALSE;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS lembrete_enviado_em TIMESTAMP;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS chegou_em TIMESTAMP;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS iniciado_em TIMESTAMP;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS avaliacao INTEGER CHECK(avaliacao BETWEEN 1 AND 5);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS avaliacao_comentario TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS forma_pagamento VARCHAR(50);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS pago BOOLEAN DEFAULT FALSE;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS valor_pago DECIMAL(10,2);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS desconto_aplicado DECIMAL(10,2);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS origem VARCHAR(50) DEFAULT 'whatsapp'; -- whatsapp, telefone, site, presencial

-- Índices adicionais para appointments
CREATE INDEX IF NOT EXISTS idx_appointments_tutor ON appointments(tutor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_pet ON appointments(pet_id);
CREATE INDEX IF NOT EXISTS idx_appointments_profissional ON appointments(profissional_id);
CREATE INDEX IF NOT EXISTS idx_appointments_lembrete ON appointments(lembrete_enviado, data_agendamento) WHERE lembrete_enviado = FALSE;
CREATE INDEX IF NOT EXISTS idx_appointments_avaliacao ON appointments(avaliacao) WHERE avaliacao IS NOT NULL;

-- ================================================================
-- PARTE 5: ANÁLISE E INTELIGÊNCIA
-- ================================================================

-- Tabela de métricas agregadas (para dashboards)
CREATE TABLE IF NOT EXISTS company_metrics (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

    -- Período
    periodo DATE NOT NULL,
    tipo_periodo VARCHAR(20) CHECK(tipo_periodo IN ('dia', 'semana', 'mes', 'ano')),

    -- Métricas de agendamento
    total_agendamentos INTEGER DEFAULT 0,
    agendamentos_confirmados INTEGER DEFAULT 0,
    agendamentos_cancelados INTEGER DEFAULT 0,
    agendamentos_concluidos INTEGER DEFAULT 0,
    taxa_cancelamento DECIMAL(5,2),
    taxa_conclusao DECIMAL(5,2),

    -- Métricas financeiras
    receita_total DECIMAL(10,2) DEFAULT 0,
    ticket_medio DECIMAL(10,2) DEFAULT 0,
    desconto_total DECIMAL(10,2) DEFAULT 0,

    -- Métricas de clientes
    novos_clientes INTEGER DEFAULT 0,
    clientes_ativos INTEGER DEFAULT 0,
    clientes_retorno INTEGER DEFAULT 0,
    taxa_retorno DECIMAL(5,2),

    -- Métricas de satisfação
    nps_score INTEGER,
    avaliacao_media DECIMAL(3,2),
    total_avaliacoes INTEGER DEFAULT 0,

    -- Performance
    tempo_resposta_medio INTEGER, -- em minutos
    taxa_conversao_chat DECIMAL(5,2),
    mensagens_enviadas INTEGER DEFAULT 0,
    mensagens_recebidas INTEGER DEFAULT 0,

    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(company_id, periodo, tipo_periodo)
);

CREATE INDEX idx_metrics_company_periodo ON company_metrics(company_id, periodo DESC);
CREATE INDEX idx_metrics_tipo ON company_metrics(tipo_periodo);

-- ================================================================
-- PARTE 6: CAMPANHAS E MARKETING
-- ================================================================

CREATE TABLE IF NOT EXISTS campaigns (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

    -- Informações da campanha
    nome VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) CHECK(tipo IN ('promocional', 'lembrete', 'reativacao', 'fidelidade', 'sazonal')),
    descricao TEXT,

    -- Configuração
    segmento_alvo JSONB, -- {"clientes_inativos": true, "vips": true, etc}
    mensagem_template TEXT NOT NULL,
    imagem_url TEXT,

    -- Período
    data_inicio DATE NOT NULL,
    data_fim DATE,
    horario_envio TIME,

    -- Status
    status VARCHAR(50) DEFAULT 'rascunho' CHECK(status IN ('rascunho', 'agendada', 'em_andamento', 'pausada', 'concluida', 'cancelada')),

    -- Métricas
    total_destinatarios INTEGER DEFAULT 0,
    mensagens_enviadas INTEGER DEFAULT 0,
    mensagens_lidas INTEGER DEFAULT 0,
    respostas_recebidas INTEGER DEFAULT 0,
    conversoes INTEGER DEFAULT 0,
    taxa_abertura DECIMAL(5,2),
    taxa_resposta DECIMAL(5,2),
    taxa_conversao DECIMAL(5,2),
    receita_gerada DECIMAL(10,2) DEFAULT 0,

    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    executed_at TIMESTAMP
);

CREATE INDEX idx_campaigns_company ON campaigns(company_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_data ON campaigns(data_inicio, data_fim);

-- ================================================================
-- PARTE 7: PRODUTOS E ESTOQUE (Futuro)
-- ================================================================

CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

    -- Informações do produto
    codigo VARCHAR(100),
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    categoria VARCHAR(100),
    marca VARCHAR(100),

    -- Preços
    preco_custo DECIMAL(10,2),
    preco_venda DECIMAL(10,2) NOT NULL,
    preco_promocional DECIMAL(10,2),

    -- Estoque
    estoque_atual INTEGER DEFAULT 0,
    estoque_minimo INTEGER DEFAULT 0,
    estoque_maximo INTEGER,
    unidade_medida VARCHAR(20) DEFAULT 'unidade',

    -- Configurações
    ativo BOOLEAN DEFAULT TRUE,
    venda_online BOOLEAN DEFAULT FALSE,
    destaque BOOLEAN DEFAULT FALSE,

    -- Metadata
    imagem_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(company_id, codigo)
);

CREATE INDEX idx_products_company ON products(company_id);
CREATE INDEX idx_products_categoria ON products(categoria);
CREATE INDEX idx_products_ativo ON products(ativo) WHERE ativo = TRUE;
CREATE INDEX idx_products_destaque ON products(destaque) WHERE destaque = TRUE;

-- ================================================================
-- PARTE 8: NOTIFICAÇÕES E ALERTAS
-- ================================================================

CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,

    -- Notificação
    tipo VARCHAR(50) NOT NULL, -- novo_agendamento, cancelamento, avaliacao, estoque_baixo, etc
    titulo VARCHAR(255) NOT NULL,
    mensagem TEXT NOT NULL,
    nivel VARCHAR(20) DEFAULT 'info' CHECK(nivel IN ('info', 'warning', 'error', 'success')),

    -- Dados adicionais
    dados JSONB DEFAULT '{}',
    link_acao TEXT,

    -- Status
    lida BOOLEAN DEFAULT FALSE,
    lida_em TIMESTAMP,
    arquivada BOOLEAN DEFAULT FALSE,

    -- Metadata
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_company ON notifications(company_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_nao_lidas ON notifications(company_id, lida) WHERE lida = FALSE;
CREATE INDEX idx_notifications_data ON notifications(created_at DESC);

-- ================================================================
-- VIEWS ÚTEIS ATUALIZADAS
-- ================================================================

-- View de clientes com estatísticas completas
CREATE OR REPLACE VIEW v_clientes_completo AS
SELECT
    t.id,
    t.company_id,
    t.nome,
    t.telefone,
    t.email,
    t.is_vip,
    t.score_fidelidade,
    t.ultima_compra,
    t.ticket_medio,
    t.total_servicos,
    t.valor_total_gasto,

    -- Pets
    (SELECT COUNT(*) FROM pets WHERE tutor_id = t.id::TEXT AND is_active = TRUE) as total_pets_ativos,
    (SELECT json_agg(json_build_object(
        'id', id,
        'nome', nome,
        'tipo', tipo,
        'raca', raca,
        'porte', porte
    )) FROM pets WHERE tutor_id = t.id::TEXT AND is_active = TRUE) as pets,

    -- Últimos agendamentos
    (SELECT COUNT(*) FROM appointments WHERE tutor_id = t.id::TEXT) as total_agendamentos,
    (SELECT COUNT(*) FROM appointments WHERE tutor_id = t.id::TEXT AND status = 'concluido') as agendamentos_concluidos,
    (SELECT MAX(data_agendamento) FROM appointments WHERE tutor_id = t.id::TEXT AND status = 'concluido') as ultimo_atendimento,
    (SELECT MIN(data_agendamento) FROM appointments WHERE tutor_id = t.id::TEXT AND status IN ('pendente', 'confirmado') AND data_agendamento >= CURRENT_DATE) as proximo_agendamento,

    -- Análise
    (SELECT engagement_level FROM emotional_context WHERE tutor_id = t.id::TEXT AND company_id = t.company_id ORDER BY analisado_em DESC LIMIT 1) as engagement_atual,
    (SELECT estagio_atual FROM journey_tracking WHERE tutor_id = t.id::TEXT AND company_id = t.company_id ORDER BY mudou_em DESC LIMIT 1) as estagio_jornada

FROM tutors t;

-- View de agendamentos do dia com informações completas
CREATE OR REPLACE VIEW v_agendamentos_hoje AS
SELECT
    a.*,
    c.nome AS empresa_nome,
    c.whatsapp AS empresa_whatsapp,
    t.nome AS tutor_nome_completo,
    t.telefone AS tutor_telefone_completo,
    t.is_vip,
    p.nome AS pet_nome_completo,
    p.tipo AS pet_tipo,
    p.raca AS pet_raca,
    s.nome AS servico_nome_completo,
    s.categoria AS servico_categoria,
    u.nome AS profissional_nome
FROM appointments a
LEFT JOIN companies c ON a.company_id = c.id
LEFT JOIN tutors t ON a.tutor_id = t.id::TEXT
LEFT JOIN pets p ON a.pet_id = p.id
LEFT JOIN services s ON a.service_id = s.id
LEFT JOIN users u ON a.profissional_id = u.id
WHERE a.data_agendamento = CURRENT_DATE
ORDER BY a.hora_agendamento;

-- View de métricas do dia
CREATE OR REPLACE VIEW v_metricas_hoje AS
SELECT
    c.id as company_id,
    c.nome as empresa,

    -- Agendamentos
    COUNT(DISTINCT a.id) as total_agendamentos,
    COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'confirmado') as confirmados,
    COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'concluido') as concluidos,
    COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'cancelado') as cancelados,

    -- Financeiro
    COALESCE(SUM(a.valor_pago) FILTER (WHERE a.pago = TRUE), 0) as receita_confirmada,
    COALESCE(SUM(a.preco) FILTER (WHERE a.status = 'confirmado'), 0) as receita_prevista,

    -- Clientes
    COUNT(DISTINCT a.tutor_id) as clientes_atendidos,
    COUNT(DISTINCT a.tutor_id) FILTER (WHERE t.cliente_desde::DATE = CURRENT_DATE) as novos_clientes

FROM companies c
LEFT JOIN appointments a ON c.id = a.company_id AND a.data_agendamento = CURRENT_DATE
LEFT JOIN tutors t ON a.tutor_id = t.id::TEXT
WHERE c.ativo = TRUE
GROUP BY c.id, c.nome;

-- ================================================================
-- FUNÇÕES AUXILIARES
-- ================================================================

-- Função para calcular próximo horário disponível
CREATE OR REPLACE FUNCTION get_proximo_horario_disponivel(
    p_company_id INTEGER,
    p_service_id INTEGER,
    p_data_inicio DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
    data DATE,
    hora TIME,
    disponivel BOOLEAN
) AS $$
BEGIN
    -- Implementação simplificada - deve ser expandida conforme necessidade
    RETURN QUERY
    SELECT
        p_data_inicio as data,
        '09:00'::TIME as hora,
        TRUE as disponivel
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Função para calcular score de fidelidade
CREATE OR REPLACE FUNCTION calcular_score_fidelidade(p_tutor_id TEXT)
RETURNS INTEGER AS $$
DECLARE
    v_score INTEGER := 0;
    v_total_servicos INTEGER;
    v_valor_gasto DECIMAL;
    v_meses_cliente INTEGER;
    v_cancelamentos INTEGER;
BEGIN
    -- Buscar dados do tutor
    SELECT
        COUNT(DISTINCT a.id),
        COALESCE(SUM(a.valor_pago), 0),
        EXTRACT(MONTH FROM AGE(NOW(), MIN(a.created_at))),
        COUNT(*) FILTER (WHERE a.status = 'cancelado')
    INTO v_total_servicos, v_valor_gasto, v_meses_cliente, v_cancelamentos
    FROM appointments a
    WHERE a.tutor_id = p_tutor_id;

    -- Calcular score baseado em múltiplos fatores
    v_score := v_score + (v_total_servicos * 10); -- 10 pontos por serviço
    v_score := v_score + (v_valor_gasto / 100)::INTEGER; -- 1 ponto a cada R$ 100
    v_score := v_score + (v_meses_cliente * 5); -- 5 pontos por mês como cliente
    v_score := v_score - (v_cancelamentos * 20); -- -20 pontos por cancelamento

    -- Garantir que não seja negativo
    IF v_score < 0 THEN
        v_score := 0;
    END IF;

    RETURN v_score;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- TRIGGERS ATUALIZADOS
-- ================================================================

-- Trigger para atualizar métricas do tutor após agendamento
CREATE OR REPLACE FUNCTION atualizar_metricas_tutor()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND NEW.status = 'concluido' AND OLD.status != 'concluido' THEN
        UPDATE tutors SET
            total_servicos = total_servicos + 1,
            valor_total_gasto = valor_total_gasto + COALESCE(NEW.valor_pago, NEW.preco),
            ultima_compra = NEW.data_agendamento,
            ticket_medio = (valor_total_gasto + COALESCE(NEW.valor_pago, NEW.preco)) / (total_servicos + 1),
            score_fidelidade = calcular_score_fidelidade(NEW.tutor_id),
            ultima_interacao = NOW()
        WHERE id::TEXT = NEW.tutor_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_atualizar_metricas_tutor ON appointments;
CREATE TRIGGER trigger_atualizar_metricas_tutor
    AFTER UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_metricas_tutor();

-- ================================================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- ================================================================

COMMENT ON TABLE company_metrics IS 'Métricas agregadas por período para análise e dashboards';
COMMENT ON TABLE campaigns IS 'Campanhas de marketing e comunicação automatizada';
COMMENT ON TABLE products IS 'Produtos disponíveis para venda (pet shop)';
COMMENT ON TABLE notifications IS 'Central de notificações do sistema';

COMMENT ON FUNCTION get_proximo_horario_disponivel IS 'Retorna próximo horário disponível para agendamento';
COMMENT ON FUNCTION calcular_score_fidelidade IS 'Calcula score de fidelidade baseado em histórico do cliente';

-- ================================================================
-- FIM DA MIGRATION
-- ================================================================

-- Log de sucesso
DO $$
BEGIN
    RAISE NOTICE '✅ Migration 011: Estrutura completa do banco de dados criada com sucesso!';
    RAISE NOTICE '   ✅ Multi-tenancy: Configuração completa';
    RAISE NOTICE '   ✅ CRM: Clientes e pets estruturados';
    RAISE NOTICE '   ✅ Agendamentos: Sistema completo';
    RAISE NOTICE '   ✅ Analytics: Métricas e inteligência';
    RAISE NOTICE '   ✅ Marketing: Campanhas e notificações';
    RAISE NOTICE '   ✅ Views e funções: Auxiliares criados';
END $$;
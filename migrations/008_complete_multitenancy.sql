-- ================================================================
-- MIGRATION 008: COMPLETE MULTI-TENANCY IMPLEMENTATION
-- ================================================================
-- Adiciona company_id a todas as tabelas e implementa Row Level Security
-- para isolamento completo de dados entre tenants
-- ================================================================

-- ================================================================
-- 1. ADICIONAR COMPANY_ID ÀS TABELAS PRINCIPAIS
-- ================================================================

-- 1.1 User Profiles (tabela principal de clientes)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN company_id INTEGER NOT NULL DEFAULT 1;
    ALTER TABLE user_profiles ADD CONSTRAINT fk_user_profiles_company
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
    CREATE INDEX idx_user_profiles_company ON user_profiles(company_id);
    CREATE INDEX idx_user_profiles_company_chat ON user_profiles(company_id, chat_id);
  END IF;
END $$;

-- 1.2 Response Times
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'response_times' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE response_times ADD COLUMN company_id INTEGER NOT NULL DEFAULT 1;
    ALTER TABLE response_times ADD CONSTRAINT fk_response_times_company
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
    CREATE INDEX idx_response_times_company ON response_times(company_id);
  END IF;
END $$;

-- 1.3 User Interests
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_interests' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE user_interests ADD COLUMN company_id INTEGER NOT NULL DEFAULT 1;
    ALTER TABLE user_interests ADD CONSTRAINT fk_user_interests_company
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
    CREATE INDEX idx_user_interests_company ON user_interests(company_id);
  END IF;
END $$;

-- 1.4 User Objections
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_objections' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE user_objections ADD COLUMN company_id INTEGER NOT NULL DEFAULT 1;
    ALTER TABLE user_objections ADD CONSTRAINT fk_user_objections_company
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
    CREATE INDEX idx_user_objections_company ON user_objections(company_id);
  END IF;
END $$;

-- 1.5 Purchases
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'purchases' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE purchases ADD COLUMN company_id INTEGER NOT NULL DEFAULT 1;
    ALTER TABLE purchases ADD CONSTRAINT fk_purchases_company
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
    CREATE INDEX idx_purchases_company ON purchases(company_id);
    CREATE INDEX idx_purchases_company_date ON purchases(company_id, purchase_date DESC);
  END IF;
END $$;

-- 1.6 Conversation History
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversation_history' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE conversation_history ADD COLUMN company_id INTEGER NOT NULL DEFAULT 1;
    ALTER TABLE conversation_history ADD CONSTRAINT fk_conversation_history_company
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
    CREATE INDEX idx_conversation_history_company ON conversation_history(company_id);
    CREATE INDEX idx_conversation_history_company_chat ON conversation_history(company_id, chat_id, timestamp DESC);
  END IF;
END $$;

-- 1.7 Scheduled Followups
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scheduled_followups' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE scheduled_followups ADD COLUMN company_id INTEGER NOT NULL DEFAULT 1;
    ALTER TABLE scheduled_followups ADD CONSTRAINT fk_scheduled_followups_company
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
    CREATE INDEX idx_scheduled_followups_company ON scheduled_followups(company_id);
    CREATE INDEX idx_scheduled_followups_company_pending ON scheduled_followups(company_id, executed, scheduled_for);
  END IF;
END $$;

-- 1.8 Conversion Opportunities
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversion_opportunities' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE conversion_opportunities ADD COLUMN company_id INTEGER NOT NULL DEFAULT 1;
    ALTER TABLE conversion_opportunities ADD CONSTRAINT fk_conversion_opportunities_company
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
    CREATE INDEX idx_conversion_opportunities_company ON conversion_opportunities(company_id);
    CREATE INDEX idx_conversion_opportunities_active ON conversion_opportunities(company_id, converted, score DESC);
  END IF;
END $$;

-- ================================================================
-- 2. TABELAS DE CONTEXTO EMOCIONAL (se existirem)
-- ================================================================

-- 2.1 Tutors
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tutors') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'tutors' AND column_name = 'company_id'
    ) THEN
      ALTER TABLE tutors ADD COLUMN company_id INTEGER NOT NULL DEFAULT 1;
      ALTER TABLE tutors ADD CONSTRAINT fk_tutors_company
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
      CREATE INDEX idx_tutors_company ON tutors(company_id);
      CREATE INDEX idx_tutors_company_chat ON tutors(company_id, chat_id);
    END IF;
  END IF;
END $$;

-- 2.2 Pets
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pets') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'pets' AND column_name = 'company_id'
    ) THEN
      ALTER TABLE pets ADD COLUMN company_id INTEGER NOT NULL DEFAULT 1;
      ALTER TABLE pets ADD CONSTRAINT fk_pets_company
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
      CREATE INDEX idx_pets_company ON pets(company_id);
    END IF;
  END IF;
END $$;

-- 2.3 Emotional Context
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'emotional_context') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'emotional_context' AND column_name = 'company_id'
    ) THEN
      ALTER TABLE emotional_context ADD COLUMN company_id INTEGER NOT NULL DEFAULT 1;
      ALTER TABLE emotional_context ADD CONSTRAINT fk_emotional_context_company
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
      CREATE INDEX idx_emotional_context_company ON emotional_context(company_id);
    END IF;
  END IF;
END $$;

-- 2.4 Service History
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'service_history') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'service_history' AND column_name = 'company_id'
    ) THEN
      ALTER TABLE service_history ADD COLUMN company_id INTEGER NOT NULL DEFAULT 1;
      ALTER TABLE service_history ADD CONSTRAINT fk_service_history_company
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
      CREATE INDEX idx_service_history_company ON service_history(company_id);
    END IF;
  END IF;
END $$;

-- 2.5 Learned Preferences
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'learned_preferences') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'learned_preferences' AND column_name = 'company_id'
    ) THEN
      ALTER TABLE learned_preferences ADD COLUMN company_id INTEGER NOT NULL DEFAULT 1;
      ALTER TABLE learned_preferences ADD CONSTRAINT fk_learned_preferences_company
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
      CREATE INDEX idx_learned_preferences_company ON learned_preferences(company_id);
    END IF;
  END IF;
END $$;

-- 2.6 Conversation Episodes
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversation_episodes') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'conversation_episodes' AND column_name = 'company_id'
    ) THEN
      ALTER TABLE conversation_episodes ADD COLUMN company_id INTEGER NOT NULL DEFAULT 1;
      ALTER TABLE conversation_episodes ADD CONSTRAINT fk_conversation_episodes_company
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
      CREATE INDEX idx_conversation_episodes_company ON conversation_episodes(company_id);
    END IF;
  END IF;
END $$;

-- 2.7 Journey Tracking
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'journey_tracking') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'journey_tracking' AND column_name = 'company_id'
    ) THEN
      ALTER TABLE journey_tracking ADD COLUMN company_id INTEGER NOT NULL DEFAULT 1;
      ALTER TABLE journey_tracking ADD CONSTRAINT fk_journey_tracking_company
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
      CREATE INDEX idx_journey_tracking_company ON journey_tracking(company_id);
    END IF;
  END IF;
END $$;

-- 2.8 Response Quality
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'response_quality') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'response_quality' AND column_name = 'company_id'
    ) THEN
      ALTER TABLE response_quality ADD COLUMN company_id INTEGER NOT NULL DEFAULT 1;
      ALTER TABLE response_quality ADD CONSTRAINT fk_response_quality_company
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
      CREATE INDEX idx_response_quality_company ON response_quality(company_id);
    END IF;
  END IF;
END $$;

-- ================================================================
-- 3. HELPER FUNCTIONS PARA TENANT CONTEXT
-- ================================================================

-- 3.1 Function para setar o tenant atual na sessão
CREATE OR REPLACE FUNCTION set_current_company(company_id INTEGER)
RETURNS void AS $$
BEGIN
  -- Define o company_id na configuração da sessão atual
  PERFORM set_config('app.current_company_id', company_id::text, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION set_current_company IS
  'Define o company_id atual para a sessão PostgreSQL (usado por RLS)';

-- 3.2 Function para obter o tenant atual
CREATE OR REPLACE FUNCTION get_current_company()
RETURNS INTEGER AS $$
BEGIN
  -- Retorna o company_id da configuração da sessão
  RETURN current_setting('app.current_company_id', true)::INTEGER;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_current_company IS
  'Retorna o company_id atual da sessão PostgreSQL';

-- ================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ================================================================

-- 4.1 Habilitar RLS nas tabelas principais

-- User Profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_user_profiles ON user_profiles;
CREATE POLICY tenant_isolation_user_profiles ON user_profiles
  USING (company_id = COALESCE(get_current_company(), company_id));

-- Response Times
ALTER TABLE response_times ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_response_times ON response_times;
CREATE POLICY tenant_isolation_response_times ON response_times
  USING (company_id = COALESCE(get_current_company(), company_id));

-- User Interests
ALTER TABLE user_interests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_user_interests ON user_interests;
CREATE POLICY tenant_isolation_user_interests ON user_interests
  USING (company_id = COALESCE(get_current_company(), company_id));

-- User Objections
ALTER TABLE user_objections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_user_objections ON user_objections;
CREATE POLICY tenant_isolation_user_objections ON user_objections
  USING (company_id = COALESCE(get_current_company(), company_id));

-- Purchases
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_purchases ON purchases;
CREATE POLICY tenant_isolation_purchases ON purchases
  USING (company_id = COALESCE(get_current_company(), company_id));

-- Conversation History
ALTER TABLE conversation_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_conversation_history ON conversation_history;
CREATE POLICY tenant_isolation_conversation_history ON conversation_history
  USING (company_id = COALESCE(get_current_company(), company_id));

-- Scheduled Followups
ALTER TABLE scheduled_followups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_scheduled_followups ON scheduled_followups;
CREATE POLICY tenant_isolation_scheduled_followups ON scheduled_followups
  USING (company_id = COALESCE(get_current_company(), company_id));

-- Conversion Opportunities
ALTER TABLE conversion_opportunities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_conversion_opportunities ON conversion_opportunities;
CREATE POLICY tenant_isolation_conversion_opportunities ON conversion_opportunities
  USING (company_id = COALESCE(get_current_company(), company_id));

-- Services (já tem company_id)
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_services ON services;
CREATE POLICY tenant_isolation_services ON services
  USING (company_id = COALESCE(get_current_company(), company_id));

-- Appointments (já tem company_id via service)
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_appointments ON appointments;
CREATE POLICY tenant_isolation_appointments ON appointments
  USING (EXISTS (
    SELECT 1 FROM services
    WHERE services.id = appointments.service_id
    AND services.company_id = COALESCE(get_current_company(), services.company_id)
  ));

-- WhatsApp Sessions (já tem company_id)
ALTER TABLE whatsapp_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_whatsapp_sessions ON whatsapp_sessions;
CREATE POLICY tenant_isolation_whatsapp_sessions ON whatsapp_sessions
  USING (company_id = COALESCE(get_current_company(), company_id));

-- ================================================================
-- 5. RLS PARA TABELAS DE CONTEXTO (se existirem)
-- ================================================================

-- Tutors
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tutors') THEN
    ALTER TABLE tutors ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS tenant_isolation_tutors ON tutors;
    CREATE POLICY tenant_isolation_tutors ON tutors
      USING (company_id = COALESCE(get_current_company(), company_id));
  END IF;
END $$;

-- Pets
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pets') THEN
    ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS tenant_isolation_pets ON pets;
    CREATE POLICY tenant_isolation_pets ON pets
      USING (company_id = COALESCE(get_current_company(), company_id));
  END IF;
END $$;

-- Emotional Context
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'emotional_context') THEN
    ALTER TABLE emotional_context ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS tenant_isolation_emotional_context ON emotional_context;
    CREATE POLICY tenant_isolation_emotional_context ON emotional_context
      USING (company_id = COALESCE(get_current_company(), company_id));
  END IF;
END $$;

-- Service History
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'service_history') THEN
    ALTER TABLE service_history ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS tenant_isolation_service_history ON service_history;
    CREATE POLICY tenant_isolation_service_history ON service_history
      USING (company_id = COALESCE(get_current_company(), company_id));
  END IF;
END $$;

-- Learned Preferences
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'learned_preferences') THEN
    ALTER TABLE learned_preferences ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS tenant_isolation_learned_preferences ON learned_preferences;
    CREATE POLICY tenant_isolation_learned_preferences ON learned_preferences
      USING (company_id = COALESCE(get_current_company(), company_id));
  END IF;
END $$;

-- Conversation Episodes
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversation_episodes') THEN
    ALTER TABLE conversation_episodes ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS tenant_isolation_conversation_episodes ON conversation_episodes;
    CREATE POLICY tenant_isolation_conversation_episodes ON conversation_episodes
      USING (company_id = COALESCE(get_current_company(), company_id));
  END IF;
END $$;

-- Journey Tracking
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'journey_tracking') THEN
    ALTER TABLE journey_tracking ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS tenant_isolation_journey_tracking ON journey_tracking;
    CREATE POLICY tenant_isolation_journey_tracking ON journey_tracking
      USING (company_id = COALESCE(get_current_company(), company_id));
  END IF;
END $$;

-- Response Quality
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'response_quality') THEN
    ALTER TABLE response_quality ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS tenant_isolation_response_quality ON response_quality;
    CREATE POLICY tenant_isolation_response_quality ON response_quality
      USING (company_id = COALESCE(get_current_company(), company_id));
  END IF;
END $$;

-- ================================================================
-- 6. ATUALIZAR VIEWS PARA INCLUIR COMPANY_ID
-- ================================================================

-- Recriar view de usuários engajados
DROP VIEW IF EXISTS top_engaged_users;
CREATE OR REPLACE VIEW top_engaged_users AS
SELECT
    company_id,
    chat_id,
    nome,
    pet_nome,
    engagement_score,
    engagement_level,
    conversation_stage,
    total_messages
FROM user_profiles
WHERE engagement_level IN ('alto', 'muito_alto')
ORDER BY company_id, engagement_score DESC;

-- Recriar view de follow-ups do dia
DROP VIEW IF EXISTS todays_followups;
CREATE OR REPLACE VIEW todays_followups AS
SELECT
    sf.company_id,
    sf.id,
    sf.chat_id,
    up.nome,
    up.pet_nome,
    sf.scheduled_for,
    sf.message,
    sf.attempt
FROM scheduled_followups sf
JOIN user_profiles up ON sf.chat_id = up.chat_id AND sf.company_id = up.company_id
WHERE sf.executed = FALSE
    AND DATE(sf.scheduled_for) = CURRENT_DATE
ORDER BY sf.company_id, sf.scheduled_for;

-- Recriar view de oportunidades de conversão
DROP VIEW IF EXISTS active_conversion_opportunities;
CREATE OR REPLACE VIEW active_conversion_opportunities AS
SELECT
    co.company_id,
    co.id,
    co.chat_id,
    up.nome,
    up.pet_nome,
    co.score,
    co.urgency_level,
    co.suggested_action,
    co.detected_at
FROM conversion_opportunities co
JOIN user_profiles up ON co.chat_id = up.chat_id AND co.company_id = up.company_id
WHERE co.converted = FALSE
ORDER BY co.company_id, co.score DESC, co.urgency_level DESC;

-- ================================================================
-- 7. CRIAR EMPRESA PADRÃO SE NÃO EXISTIR
-- ================================================================

INSERT INTO companies (
  id, nome, slug, whatsapp, agente_nome, agente_persona,
  horario_funcionamento, ativo, plano
) VALUES (
  1,
  'AuZap Demo',
  'auzap-demo',
  '+5511999999999',
  'Marina',
  'prestativa',
  '{
    "segunda": "08:00-18:00",
    "terca": "08:00-18:00",
    "quarta": "08:00-18:00",
    "quinta": "08:00-18:00",
    "sexta": "08:00-18:00",
    "sabado": "09:00-13:00",
    "domingo": "fechado"
  }'::jsonb,
  true,
  'basic'
) ON CONFLICT (id) DO NOTHING;

-- ================================================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- ================================================================

COMMENT ON FUNCTION set_current_company(INTEGER) IS
  'Define o tenant (company_id) atual na sessão PostgreSQL para Row Level Security';

COMMENT ON FUNCTION get_current_company() IS
  'Retorna o tenant (company_id) atual da sessão PostgreSQL';

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 008 completed successfully!';
  RAISE NOTICE '✅ Multi-tenancy: company_id added to all tables';
  RAISE NOTICE '✅ Row Level Security: enabled on all tables';
  RAISE NOTICE '✅ Helper functions: set_current_company() and get_current_company() created';
  RAISE NOTICE '⚠️  Next steps:';
  RAISE NOTICE '   1. Update application code to call set_current_company() on each request';
  RAISE NOTICE '   2. Update services to include company_id in queries';
  RAISE NOTICE '   3. Test tenant isolation thoroughly';
END $$;

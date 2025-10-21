-- Migration 017: Criar tabela user_onboarding_progress
-- Tabela específica para onboarding de usuários no dashboard
-- (separada da tabela onboarding_progress que é para WhatsApp/tutores)

CREATE TABLE IF NOT EXISTS user_onboarding_progress (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  company_id INTEGER NOT NULL,
  current_step INTEGER NOT NULL DEFAULT 1,
  data JSONB DEFAULT '{}'::jsonb,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,

  -- Constraint unique
  CONSTRAINT user_onboarding_progress_user_company_unique
  UNIQUE (user_id, company_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_onboarding_user_id
  ON user_onboarding_progress(user_id);

CREATE INDEX IF NOT EXISTS idx_user_onboarding_company_id
  ON user_onboarding_progress(company_id);

CREATE INDEX IF NOT EXISTS idx_user_onboarding_completed
  ON user_onboarding_progress(completed);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_user_onboarding_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_onboarding_progress_updated_at
  BEFORE UPDATE ON user_onboarding_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_user_onboarding_updated_at();

-- Comentários
COMMENT ON TABLE user_onboarding_progress IS 'Progresso de onboarding de usuários no dashboard';
COMMENT ON COLUMN user_onboarding_progress.user_id IS 'UUID do usuário (FK para users.id)';
COMMENT ON COLUMN user_onboarding_progress.company_id IS 'ID da empresa do usuário';
COMMENT ON COLUMN user_onboarding_progress.current_step IS 'Step atual (1-9)';
COMMENT ON COLUMN user_onboarding_progress.data IS 'Dados salvos de cada step em JSONB';
COMMENT ON COLUMN user_onboarding_progress.completed IS 'Se o onboarding foi concluído';
COMMENT ON COLUMN user_onboarding_progress.completed_at IS 'Timestamp de quando foi concluído';

-- Mensagem final
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 017: Tabela user_onboarding_progress criada com sucesso';
  RAISE NOTICE 'ℹ️  Tabela separada da onboarding_progress (WhatsApp)';
  RAISE NOTICE 'ℹ️  Estrutura: user_id (UUID), company_id, current_step, data (JSONB)';
END $$;

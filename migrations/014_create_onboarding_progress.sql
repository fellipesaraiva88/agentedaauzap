-- Migration 014: Create Onboarding Progress Table
-- Tabela para salvar o progresso do onboarding de cada usuário

CREATE TABLE IF NOT EXISTS onboarding_progress (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id INTEGER NOT NULL,
  current_step INTEGER DEFAULT 1 CHECK (current_step >= 1 AND current_step <= 9),
  completed BOOLEAN DEFAULT false,
  
  -- Dados de cada step (JSON)
  data JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  
  -- Constraints
  UNIQUE(user_id, company_id)
);

-- Índices para performance
CREATE INDEX idx_onboarding_user ON onboarding_progress(user_id);
CREATE INDEX idx_onboarding_company ON onboarding_progress(company_id);
CREATE INDEX idx_onboarding_completed ON onboarding_progress(completed);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_onboarding_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  
  -- Se marcar como completed, setar completed_at
  IF NEW.completed = true AND OLD.completed = false THEN
    NEW.completed_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_onboarding_progress
  BEFORE UPDATE ON onboarding_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_onboarding_progress_updated_at();

-- Comentários
COMMENT ON TABLE onboarding_progress IS 'Progresso do onboarding de cada usuário';
COMMENT ON COLUMN onboarding_progress.current_step IS 'Step atual (1-9)';
COMMENT ON COLUMN onboarding_progress.data IS 'Dados salvos de cada step em JSON';
COMMENT ON COLUMN onboarding_progress.completed IS 'Se o onboarding foi concluído';

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 014: Tabela onboarding_progress criada com sucesso';
END $$;

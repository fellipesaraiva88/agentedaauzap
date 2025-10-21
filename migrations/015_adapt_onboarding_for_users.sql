-- Migration 015: Adaptar onboarding_progress para usar users ao invés de organizations
-- A tabela já existe com organizations, vamos adaptar para nossa estrutura

-- Adicionar coluna user_id se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'onboarding_progress' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE onboarding_progress 
    ADD COLUMN user_id INTEGER;
    
    RAISE NOTICE '✅ Coluna user_id adicionada';
  ELSE
    RAISE NOTICE 'ℹ️ Coluna user_id já existe';
  END IF;
END $$;

-- Adicionar coluna company_id se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'onboarding_progress' 
    AND column_name = 'company_id'
  ) THEN
    ALTER TABLE onboarding_progress 
    ADD COLUMN company_id INTEGER;
    
    RAISE NOTICE '✅ Coluna company_id adicionada';
  ELSE
    RAISE NOTICE 'ℹ️ Coluna company_id já existe';
  END IF;
END $$;

-- Adicionar coluna data (JSONB) se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'onboarding_progress' 
    AND column_name = 'data'
  ) THEN
    ALTER TABLE onboarding_progress 
    ADD COLUMN data JSONB DEFAULT '{}'::jsonb;
    
    RAISE NOTICE '✅ Coluna data (JSONB) adicionada';
  ELSE
    RAISE NOTICE 'ℹ️ Coluna data já existe';
  END IF;
END $$;

-- Adicionar coluna completed (boolean) se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'onboarding_progress' 
    AND column_name = 'completed'
  ) THEN
    ALTER TABLE onboarding_progress 
    ADD COLUMN completed BOOLEAN DEFAULT false;
    
    RAISE NOTICE '✅ Coluna completed adicionada';
  ELSE
    RAISE NOTICE 'ℹ️ Coluna completed já existe';
  END IF;
END $$;

-- Adicionar coluna completed_at se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'onboarding_progress' 
    AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE onboarding_progress 
    ADD COLUMN completed_at TIMESTAMP;
    
    RAISE NOTICE '✅ Coluna completed_at adicionada';
  ELSE
    RAISE NOTICE 'ℹ️ Coluna completed_at já existe';
  END IF;
END $$;

-- Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_onboarding_user_id 
  ON onboarding_progress(user_id);

CREATE INDEX IF NOT EXISTS idx_onboarding_company_id 
  ON onboarding_progress(company_id);

CREATE INDEX IF NOT EXISTS idx_onboarding_completed 
  ON onboarding_progress(completed);

-- Criar constraint unique se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'onboarding_progress_user_company_unique'
  ) THEN
    ALTER TABLE onboarding_progress 
    ADD CONSTRAINT onboarding_progress_user_company_unique 
    UNIQUE (user_id, company_id);
    
    RAISE NOTICE '✅ Constraint unique (user_id, company_id) adicionada';
  ELSE
    RAISE NOTICE 'ℹ️ Constraint unique já existe';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '⚠️ Erro ao adicionar constraint: %', SQLERRM;
END $$;

-- Comentários
COMMENT ON COLUMN onboarding_progress.user_id IS 'ID do usuário (FK para users)';
COMMENT ON COLUMN onboarding_progress.company_id IS 'ID da empresa do usuário';
COMMENT ON COLUMN onboarding_progress.data IS 'Dados salvos de cada step em JSON';
COMMENT ON COLUMN onboarding_progress.completed IS 'Se o onboarding foi concluído';
COMMENT ON COLUMN onboarding_progress.completed_at IS 'Timestamp de quando foi concluído';

-- Mensagem final
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 015: Tabela onboarding_progress adaptada com sucesso';
  RAISE NOTICE 'ℹ️  Colunas adicionadas: user_id, company_id, data, completed, completed_at';
  RAISE NOTICE 'ℹ️  Índices criados para performance';
END $$;

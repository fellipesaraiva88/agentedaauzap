-- Migration 016: Corrigir tipo de user_id de INTEGER para UUID
-- O JWT usa UUID para userId, mas criamos a coluna como INTEGER

-- Remover constraint unique temporariamente
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'onboarding_progress_user_company_unique'
  ) THEN
    ALTER TABLE onboarding_progress
    DROP CONSTRAINT onboarding_progress_user_company_unique;

    RAISE NOTICE '✅ Constraint unique removida temporariamente';
  END IF;
END $$;

-- Alterar tipo de user_id de INTEGER para UUID
DO $$
BEGIN
  -- Verificar se a coluna existe e é INTEGER
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'onboarding_progress'
    AND column_name = 'user_id'
    AND data_type = 'integer'
  ) THEN
    -- Se houver dados, limpar a tabela primeiro
    DELETE FROM onboarding_progress;

    -- Alterar tipo
    ALTER TABLE onboarding_progress
    ALTER COLUMN user_id TYPE UUID USING user_id::text::uuid;

    RAISE NOTICE '✅ Tipo de user_id alterado de INTEGER para UUID';
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'onboarding_progress'
    AND column_name = 'user_id'
    AND data_type = 'uuid'
  ) THEN
    RAISE NOTICE 'ℹ️ user_id já é UUID';
  ELSE
    RAISE NOTICE '⚠️ Coluna user_id não encontrada';
  END IF;
END $$;

-- Recriar constraint unique
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'onboarding_progress_user_company_unique'
  ) THEN
    ALTER TABLE onboarding_progress
    ADD CONSTRAINT onboarding_progress_user_company_unique
    UNIQUE (user_id, company_id);

    RAISE NOTICE '✅ Constraint unique (user_id UUID, company_id) recriada';
  END IF;
END $$;

-- Atualizar comentário
COMMENT ON COLUMN onboarding_progress.user_id IS 'UUID do usuário (FK para users.id)';

-- Mensagem final
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 016: Tipo de user_id corrigido para UUID';
  RAISE NOTICE 'ℹ️  Todos os dados antigos foram removidos';
  RAISE NOTICE 'ℹ️  Sistema pronto para receber novos registros com UUID';
END $$;

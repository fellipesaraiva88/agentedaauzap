/**
 * Script para corrigir o tipo de user_id de INTEGER para UUID
 * Executa a migration 016 diretamente no banco
 */

import { postgresClient } from '../services/PostgreSQLClient';

const migration = `
-- Migration 016: Corrigir tipo de user_id de INTEGER para UUID

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

-- Alterar tipo de user_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'onboarding_progress'
    AND column_name = 'user_id'
    AND data_type = 'integer'
  ) THEN
    -- Limpar dados antigos
    DELETE FROM onboarding_progress;

    -- Alterar tipo para UUID
    ALTER TABLE onboarding_progress
    ALTER COLUMN user_id TYPE UUID USING NULL;

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
`;

async function runMigration() {
  try {
    console.log('🔄 Conectando ao banco de dados...');

    if (!postgresClient.isPostgresConnected()) {
      console.error('❌ PostgreSQL não está conectado');
      process.exit(1);
    }

    console.log('✅ Conectado!');
    console.log('🔄 Executando migration 016: Fix user_id type...');

    const pool = postgresClient.getPool();
    if (!pool) {
      throw new Error('Pool do PostgreSQL não disponível');
    }

    await pool.query(migration);

    console.log('✅ Migration 016 aplicada com sucesso!');
    console.log('ℹ️  user_id agora é UUID');
    console.log('ℹ️  Dados antigos foram removidos');
    console.log('ℹ️  Sistema pronto para novos registros');

    process.exit(0);

  } catch (error) {
    console.error('❌ Erro ao executar migration:', error);
    process.exit(1);
  }
}

runMigration();

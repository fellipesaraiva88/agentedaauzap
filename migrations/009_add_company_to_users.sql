-- ================================================================
-- MIGRATION 009: ADD COMPANY_ID TO USERS TABLE
-- ================================================================
-- Adiciona company_id à tabela users para completar multi-tenancy
-- ================================================================

-- Adicionar company_id à tabela users (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE users ADD COLUMN company_id INTEGER NOT NULL DEFAULT 1;
    ALTER TABLE users ADD CONSTRAINT fk_users_company
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
    CREATE INDEX idx_users_company ON users(company_id);
    RAISE NOTICE '✅ Column company_id added to users table';
  ELSE
    RAISE NOTICE 'ℹ️  Column company_id already exists in users table';
  END IF;
END $$;

-- Habilitar RLS na tabela users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Criar policy para isolamento de tenants
DROP POLICY IF EXISTS tenant_isolation_users ON users;
CREATE POLICY tenant_isolation_users ON users
  USING (company_id = COALESCE(get_current_company(), company_id));

COMMENT ON TABLE users IS 'Usuários do sistema com isolamento por tenant (company_id)';

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 009 completed successfully!';
  RAISE NOTICE '✅ Users table: company_id added and RLS enabled';
END $$;

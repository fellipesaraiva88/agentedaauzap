-- Migration 013: Insert Test User
-- Insere usuário de teste para validação do login
-- Email: feee@saraiva.ai
-- Password: Sucesso2025$

INSERT INTO users (email, password_hash, name, company_name, phone, role, company_id)
VALUES (
  'feee@saraiva.ai',
  '$2a$10$XwgD3wza1fDpIwwgcZQ74.TOap1gTXsqdCr92UlciS1tvgCovpy9S',
  'Fellipe Saraiva',
  'AuZap Test Company',
  '+5511999999999',
  'owner',
  1
) ON CONFLICT (email) DO UPDATE
SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  company_name = EXCLUDED.company_name,
  phone = EXCLUDED.phone,
  role = EXCLUDED.role,
  company_id = EXCLUDED.company_id,
  updated_at = NOW();

COMMENT ON COLUMN users.email IS 'Email do usuário (único)';
COMMENT ON COLUMN users.password_hash IS 'Hash bcrypt da senha';

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 013: Test user created/updated successfully';
  RAISE NOTICE '   Email: feee@saraiva.ai';
  RAISE NOTICE '   Password: Sucesso2025$';
END $$;

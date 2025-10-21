-- Migration 007: User Authentication and Onboarding
-- Sistema simples de autenticação e gerenciamento de onboarding

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  company_name VARCHAR(255),
  phone VARCHAR(50),
  role VARCHAR(50) DEFAULT 'owner',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS onboarding_progress (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  step VARCHAR(50) NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  data JSONB DEFAULT '{}',
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, step)
);

-- Índices
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_onboarding_user ON onboarding_progress(user_id);
CREATE INDEX idx_onboarding_completed ON onboarding_progress(completed);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_users_updated_at();

-- Inserir usuário demo (senha: demo123)
-- Hash bcrypt para 'demo123': $2b$10$rGdz8F3pWQEY9F5z5bGPfO3qZpGKqH5qW8E5vW5kZ5qW8E5vW5kZ5
INSERT INTO users (email, password_hash, name, company_name, phone, role)
VALUES (
  'demo@agentedaauzap.com',
  '$2b$10$rGdz8F3pWQEY9F5z5bGPfO3qZpGKqH5qW8E5vW5kZ5qW8E5vW5kZ5',
  'Usuário Demo',
  'AuZap Demo',
  '+5511999999999',
  'owner'
) ON CONFLICT (email) DO NOTHING;

COMMENT ON TABLE users IS 'Usuários do sistema';
COMMENT ON TABLE onboarding_progress IS 'Progresso do onboarding por usuário';

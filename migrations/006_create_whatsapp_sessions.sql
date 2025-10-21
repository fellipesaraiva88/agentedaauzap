-- Migration 006: WhatsApp Sessions Management
-- Tabela para gerenciar múltiplas sessões WAHA por empresa

CREATE TABLE IF NOT EXISTS whatsapp_sessions (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL DEFAULT 1,
  session_name VARCHAR(100) NOT NULL,
  waha_url VARCHAR(255) NOT NULL,
  waha_api_key VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'disconnected'
    CHECK (status IN ('disconnected', 'connecting', 'connected', 'failed')),
  qr_code TEXT,
  pairing_code VARCHAR(20),
  phone_number VARCHAR(50),
  last_connected TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(company_id, session_name)
);

-- Índices para performance
CREATE INDEX idx_whatsapp_sessions_company ON whatsapp_sessions(company_id);
CREATE INDEX idx_whatsapp_sessions_status ON whatsapp_sessions(status);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_whatsapp_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_whatsapp_sessions_updated_at
BEFORE UPDATE ON whatsapp_sessions
FOR EACH ROW
EXECUTE FUNCTION update_whatsapp_sessions_updated_at();

-- Inserir sessão padrão se configurada via variáveis de ambiente
-- (será feita pelo código da aplicação se WAHA_URL e WAHA_API_KEY existirem)

COMMENT ON TABLE whatsapp_sessions IS 'Gerenciamento de sessões WhatsApp via WAHA';
COMMENT ON COLUMN whatsapp_sessions.session_name IS 'Nome único da sessão (ex: default, vendas, suporte)';
COMMENT ON COLUMN whatsapp_sessions.status IS 'Status atual: disconnected, connecting, connected, failed';
COMMENT ON COLUMN whatsapp_sessions.qr_code IS 'QR Code base64 para autenticação';
COMMENT ON COLUMN whatsapp_sessions.pairing_code IS 'Código de pareamento de 8 dígitos';

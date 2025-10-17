-- ================================================================
-- MIGRATION: IMMEDIATE FOLLOW-UPS COM PNL
-- ================================================================
-- Sistema de follow-ups imediatos (minutos, não dias)
-- com PNL crescente para evitar abandono de leads
-- ================================================================

CREATE TABLE IF NOT EXISTS immediate_followups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chat_id TEXT NOT NULL,
  level INTEGER NOT NULL CHECK(level BETWEEN 1 AND 5),
  message TEXT NOT NULL,
  attempt INTEGER NOT NULL,
  executed_at DATETIME NOT NULL,
  client_responded BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (chat_id) REFERENCES user_profiles(chat_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_immediate_followups_chat ON immediate_followups(chat_id);
CREATE INDEX IF NOT EXISTS idx_immediate_followups_executed ON immediate_followups(executed_at);
CREATE INDEX IF NOT EXISTS idx_immediate_followups_level ON immediate_followups(level);

-- View de estatísticas de follow-ups
CREATE VIEW IF NOT EXISTS followup_stats AS
SELECT
  chat_id,
  COUNT(*) as total_attempts,
  MAX(level) as max_level_reached,
  MAX(executed_at) as last_attempt,
  SUM(CASE WHEN client_responded = 1 THEN 1 ELSE 0 END) as successful_attempts
FROM immediate_followups
GROUP BY chat_id;

-- View de análise de PNL por nível
CREATE VIEW IF NOT EXISTS pnl_effectiveness AS
SELECT
  level,
  COUNT(*) as total_sent,
  SUM(CASE WHEN client_responded = 1 THEN 1 ELSE 0 END) as responses,
  ROUND(CAST(SUM(CASE WHEN client_responded = 1 THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*) * 100, 2) as response_rate
FROM immediate_followups
GROUP BY level
ORDER BY level;

PRAGMA user_version = 2; -- Incrementa versão do schema

-- ================================================================
-- MIGRATION: APPOINTMENT REMINDERS (Lembretes de Agendamento)
-- ================================================================
-- Sistema prestativo que lembra cliente do agendamento
-- - Cliente agenda serviço
-- - Marina oferece lembrete
-- - Sistema envia mensagem na hora certa
-- ================================================================

CREATE TABLE IF NOT EXISTS appointment_reminders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chat_id TEXT NOT NULL,
  service TEXT NOT NULL, -- banho, tosa, consulta, etc
  appointment_time DATETIME NOT NULL, -- Horário do agendamento
  reminder_time DATETIME NOT NULL, -- Quando enviar o lembrete
  minutes_before INTEGER NOT NULL DEFAULT 60, -- Quantos minutos antes
  pet_name TEXT,
  owner_name TEXT,
  sent BOOLEAN DEFAULT 0, -- Se já foi enviado
  sent_at DATETIME, -- Quando foi enviado
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (chat_id) REFERENCES user_profiles(chat_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_reminders_chat ON appointment_reminders(chat_id);
CREATE INDEX IF NOT EXISTS idx_reminders_time ON appointment_reminders(reminder_time);
CREATE INDEX IF NOT EXISTS idx_reminders_sent ON appointment_reminders(sent);
CREATE INDEX IF NOT EXISTS idx_reminders_appointment ON appointment_reminders(appointment_time);

-- View de lembretes pendentes
CREATE VIEW IF NOT EXISTS pending_reminders AS
SELECT
  chat_id,
  service,
  appointment_time,
  reminder_time,
  minutes_before,
  pet_name,
  ROUND((julianday(reminder_time) - julianday('now')) * 24 * 60) as minutes_until_reminder
FROM appointment_reminders
WHERE sent = 0
AND datetime(reminder_time) > datetime('now')
ORDER BY reminder_time ASC;

-- View de estatísticas de lembretes
CREATE VIEW IF NOT EXISTS reminder_stats AS
SELECT
  COUNT(*) as total_reminders,
  SUM(CASE WHEN sent = 1 THEN 1 ELSE 0 END) as sent_reminders,
  SUM(CASE WHEN sent = 0 THEN 1 ELSE 0 END) as pending_reminders,
  service,
  AVG(minutes_before) as avg_minutes_before
FROM appointment_reminders
GROUP BY service;

PRAGMA user_version = 3; -- Incrementa versão do schema

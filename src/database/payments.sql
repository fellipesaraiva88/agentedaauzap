-- Tabela de pagamentos (Asaas PIX)
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chat_id TEXT NOT NULL,
  payment_id TEXT NOT NULL UNIQUE, -- ID da cobrança no Asaas
  provider TEXT DEFAULT 'asaas',
  amount REAL NOT NULL, -- Valor final (com desconto)
  original_amount REAL, -- Valor original (sem desconto)
  discount_amount REAL DEFAULT 0, -- Valor do desconto
  status TEXT DEFAULT 'pending', -- pending, confirmed, expired, cancelled
  method TEXT DEFAULT 'pix', -- pix, boleto, credit_card
  description TEXT,
  payment_url TEXT, -- Link de pagamento
  created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
  confirmed_at INTEGER,
  FOREIGN KEY (chat_id) REFERENCES user_profiles(chat_id)
);

CREATE INDEX IF NOT EXISTS idx_payments_chat_id ON payments(chat_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_id ON payments(payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);

-- View para análise de conversão
CREATE VIEW IF NOT EXISTS payment_analytics AS
SELECT
  p.chat_id,
  up.nome as customer_name,
  COUNT(p.id) as total_payments,
  SUM(CASE WHEN p.status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_payments,
  SUM(CASE WHEN p.status = 'confirmed' THEN p.amount ELSE 0 END) as total_revenue,
  SUM(p.discount_amount) as total_discounts_given,
  AVG(CASE WHEN p.status = 'confirmed' THEN p.amount ELSE NULL END) as avg_ticket,
  MAX(p.created_at) as last_payment_date
FROM payments p
LEFT JOIN user_profiles up ON p.chat_id = up.chat_id
GROUP BY p.chat_id;

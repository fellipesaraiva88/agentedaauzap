-- Migration: Criar tabela de produtos
-- Data: 2025-01-21
-- Descrição: Tabela para gerenciar produtos da empresa (ração, brinquedos, etc)

-- Criar tabela products
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Informações básicas
  codigo VARCHAR(100),
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  categoria VARCHAR(100),
  marca VARCHAR(100),

  -- Preços
  preco_custo DECIMAL(10, 2),
  preco_venda DECIMAL(10, 2) NOT NULL,
  preco_promocional DECIMAL(10, 2),

  -- Estoque
  estoque_atual INTEGER DEFAULT 0,
  estoque_minimo INTEGER DEFAULT 0,
  estoque_maximo INTEGER,
  unidade_medida VARCHAR(20) DEFAULT 'un',

  -- Configurações
  ativo BOOLEAN DEFAULT TRUE,
  venda_online BOOLEAN DEFAULT TRUE,
  destaque BOOLEAN DEFAULT FALSE,

  -- Mídia
  imagem_url TEXT,

  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX idx_products_company ON products(company_id);
CREATE INDEX idx_products_categoria ON products(categoria);
CREATE INDEX idx_products_ativo ON products(ativo);
CREATE INDEX idx_products_low_stock ON products(estoque_atual, estoque_minimo) WHERE ativo = TRUE;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_products_updated_at();

-- Comentários
COMMENT ON TABLE products IS 'Produtos disponíveis para venda na empresa';
COMMENT ON COLUMN products.codigo IS 'Código SKU do produto';
COMMENT ON COLUMN products.estoque_atual IS 'Quantidade atual em estoque';
COMMENT ON COLUMN products.estoque_minimo IS 'Quantidade mínima que gera alerta';
COMMENT ON COLUMN products.venda_online IS 'Disponível para venda online';
COMMENT ON COLUMN products.destaque IS 'Produto destacado na vitrine';

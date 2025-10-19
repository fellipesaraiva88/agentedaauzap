-- =====================================================
-- DOCUMENTS SCHEMA - FALLBACK (Sem pgvector)
-- =====================================================
-- Versão simplificada que funciona em qualquer PostgreSQL
-- Usa JSONB para embeddings e busca em aplicação

-- =====================================================
-- TABELA: documents
-- Armazena documentos da base de conhecimento
-- =====================================================
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Metadados
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(50) NOT NULL, -- 'faq', 'produto', 'servico', 'politica'
  subcategory VARCHAR(100),       -- Ex: 'banho', 'tosa', 'vacina'

  -- Embedding como JSONB (array de 1536 floats)
  embedding JSONB,

  -- Metadata adicional
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Controle
  source VARCHAR(255),            -- Origem do documento
  active BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_active ON documents(active);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_embedding_gin ON documents USING gin(embedding);

-- Comentários
COMMENT ON TABLE documents IS 'Base de conhecimento RAG com embeddings (fallback sem pgvector)';
COMMENT ON COLUMN documents.embedding IS 'Array de 1536 dimensões (OpenAI text-embedding-3-small) armazenado como JSONB';
COMMENT ON COLUMN documents.category IS 'Categoria principal: faq, produto, servico, politica';

-- =====================================================
-- FUNCTION: Update timestamp automático
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE
  ON documents FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- =====================================================
-- VIEWS: Estatísticas
-- =====================================================
CREATE OR REPLACE VIEW documents_stats AS
SELECT
  category,
  COUNT(*) as total_documents,
  COUNT(*) FILTER (WHERE active = true) as active_documents,
  COUNT(DISTINCT subcategory) as subcategories,
  MIN(created_at) as oldest_document,
  MAX(created_at) as newest_document
FROM documents
GROUP BY category;

COMMENT ON VIEW documents_stats IS 'Estatísticas da base de conhecimento por categoria';

-- =====================================================
-- DADOS INICIAIS (SEED)
-- =====================================================
-- Será populado via script de ingestão

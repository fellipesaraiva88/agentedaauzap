-- =====================================================
-- PGVECTOR SCHEMA - RAG (Retrieval-Augmented Generation)
-- =====================================================
-- Sistema de busca semântica para conhecimento do pet shop
-- Permite Marina responder com base em documentação real

-- Habilita extensão pgvector
CREATE EXTENSION IF NOT EXISTS vector;

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

  -- Embedding (1536 dimensões para text-embedding-3-small)
  embedding vector(1536),

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

-- Índice HNSW para busca de similaridade (MUITO mais rápido que ivfflat)
CREATE INDEX IF NOT EXISTS idx_documents_embedding ON documents
USING hnsw (embedding vector_cosine_ops);

-- Comentários
COMMENT ON TABLE documents IS 'Base de conhecimento RAG com embeddings para busca semântica';
COMMENT ON COLUMN documents.embedding IS 'Vetor de 1536 dimensões (OpenAI text-embedding-3-small)';
COMMENT ON COLUMN documents.category IS 'Categoria principal: faq, produto, servico, politica';

-- =====================================================
-- FUNCTION: Busca semântica
-- =====================================================
CREATE OR REPLACE FUNCTION search_documents(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5,
  filter_category text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  title text,
  content text,
  category varchar(50),
  subcategory varchar(100),
  similarity float,
  metadata jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.title,
    d.content,
    d.category,
    d.subcategory,
    1 - (d.embedding <=> query_embedding) as similarity,
    d.metadata
  FROM documents d
  WHERE d.active = true
    AND (filter_category IS NULL OR d.category = filter_category)
    AND 1 - (d.embedding <=> query_embedding) > match_threshold
  ORDER BY d.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

COMMENT ON FUNCTION search_documents IS 'Busca documentos similares usando cosine similarity';

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

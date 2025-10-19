import { OpenAIEmbeddings } from '@langchain/openai';
import { Document } from '@langchain/core/documents';
import { postgresClient } from '../services/PostgreSQLClient';

/**
 * 🔍 SUPABASE VECTOR STORE - RAG
 *
 * Vector store usando Supabase pgvector para busca semântica
 *
 * FEATURES:
 * - Embeddings OpenAI (text-embedding-3-small)
 * - Busca de similaridade cosine
 * - Filtros por categoria
 * - HNSW index para performance
 *
 * COMO FUNCIONA:
 * 1. Documento → Embedding (1536 dims)
 * 2. Salva no Supabase com pgvector
 * 3. Busca: query → embedding → similaridade → docs
 */

export interface DocumentMetadata {
  category: 'faq' | 'produto' | 'servico' | 'politica';
  subcategory?: string;
  source?: string;
  [key: string]: any;
}

export interface SearchResult {
  id: string;
  title: string;
  content: string;
  category: string;
  subcategory?: string;
  similarity: number;
  metadata: any;
}

export class SupabaseVectorStore {
  private embeddings: OpenAIEmbeddings;
  private usePgvector: boolean = false; // Detectado dinamicamente

  constructor(openaiApiKey: string) {
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: openaiApiKey,
      modelName: 'text-embedding-3-small', // 1536 dims, mais barato
      batchSize: 512 // Otimização
    });

    console.log('🔍 SupabaseVectorStore inicializado');
  }

  /**
   * Calcula similaridade cosine entre dois vetores
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Adiciona documentos ao vector store
   */
  async addDocuments(documents: {
    title: string;
    content: string;
    metadata: DocumentMetadata;
  }[]): Promise<string[]> {
    const ids: string[] = [];

    for (const doc of documents) {
      try {
        // Gera embedding
        const embedding = await this.embeddings.embedQuery(doc.content);

        // Insere no Supabase (auto-detecta modo)
        let result;

        if (this.usePgvector) {
          // Modo pgvector (vector type)
          result = await postgresClient.query(`
            INSERT INTO documents (title, content, category, subcategory, embedding, metadata, source)
            VALUES ($1, $2, $3, $4, $5::vector, $6::jsonb, $7)
            RETURNING id
          `, [
            doc.title,
            doc.content,
            doc.metadata.category,
            doc.metadata.subcategory || null,
            `[${embedding.join(',')}]`,
            JSON.stringify(doc.metadata),
            doc.metadata.source || 'manual'
          ]);
        } else {
          // Modo fallback (jsonb)
          result = await postgresClient.query(`
            INSERT INTO documents (title, content, category, subcategory, embedding, metadata, source)
            VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7)
            RETURNING id
          `, [
            doc.title,
            doc.content,
            doc.metadata.category,
            doc.metadata.subcategory || null,
            JSON.stringify(embedding),
            JSON.stringify(doc.metadata),
            doc.metadata.source || 'manual'
          ]);
        }

        const id = result.rows[0].id;
        ids.push(id);

        console.log(`✅ Documento adicionado: ${doc.title} (${id})`);
      } catch (error) {
        console.error(`❌ Erro ao adicionar documento "${doc.title}":`, error);
      }
    }

    return ids;
  }

  /**
   * Busca documentos similares usando embeddings
   */
  async similaritySearch(
    query: string,
    options: {
      k?: number;                    // Número de resultados
      threshold?: number;            // Threshold de similaridade (0-1)
      category?: DocumentMetadata['category']; // Filtro por categoria
    } = {}
  ): Promise<SearchResult[]> {
    const {
      k = 5,
      threshold = 0.7,
      category = null
    } = options;

    try {
      // Gera embedding da query
      const queryEmbedding = await this.embeddings.embedQuery(query);

      let results: SearchResult[] = [];

      if (this.usePgvector) {
        // Modo pgvector (usa função SQL otimizada)
        const result = await postgresClient.query(`
          SELECT * FROM search_documents(
            $1::vector,
            $2::float,
            $3::int,
            $4::text
          )
        `, [
          `[${queryEmbedding.join(',')}]`,
          threshold,
          k,
          category
        ]);

        results = result.rows.map(row => ({
          id: row.id,
          title: row.title,
          content: row.content,
          category: row.category,
          subcategory: row.subcategory,
          similarity: parseFloat(row.similarity),
          metadata: row.metadata
        }));
      } else {
        // Modo fallback (busca em memória)
        let sqlQuery = 'SELECT id, title, content, category, subcategory, embedding, metadata FROM documents WHERE active = true';
        const params: any[] = [];

        if (category) {
          sqlQuery += ' AND category = $1';
          params.push(category);
        }

        const result = await postgresClient.query(sqlQuery, params);

        // Calcula similaridade em memória
        const docsWithSimilarity = result.rows.map(row => {
          const docEmbedding = JSON.parse(row.embedding);
          const similarity = this.cosineSimilarity(queryEmbedding, docEmbedding);

          return {
            id: row.id,
            title: row.title,
            content: row.content,
            category: row.category,
            subcategory: row.subcategory,
            similarity,
            metadata: row.metadata
          };
        });

        // Filtra por threshold e ordena
        results = docsWithSimilarity
          .filter(doc => doc.similarity > threshold)
          .sort((a, b) => b.similarity - a.similarity)
          .slice(0, k);
      }

      console.log(`🔍 Busca RAG: "${query}" → ${results.length} resultados (${this.usePgvector ? 'pgvector' : 'fallback'})`);

      return results;
    } catch (error) {
      console.error('❌ Erro na busca RAG:', error);
      return [];
    }
  }

  /**
   * Busca documentos e retorna como LangChain Documents
   */
  async similaritySearchAsDocuments(
    query: string,
    options: Parameters<typeof this.similaritySearch>[1] = {}
  ): Promise<Document[]> {
    const results = await this.similaritySearch(query, options);

    return results.map(result => new Document({
      pageContent: result.content,
      metadata: {
        title: result.title,
        category: result.category,
        subcategory: result.subcategory,
        similarity: result.similarity,
        ...result.metadata
      }
    }));
  }

  /**
   * Remove documento por ID
   */
  async deleteDocument(id: string): Promise<boolean> {
    try {
      await postgresClient.query(
        'DELETE FROM documents WHERE id = $1',
        [id]
      );

      console.log(`🗑️ Documento removido: ${id}`);
      return true;
    } catch (error) {
      console.error(`❌ Erro ao remover documento ${id}:`, error);
      return false;
    }
  }

  /**
   * Limpa todos os documentos de uma categoria
   */
  async clearCategory(category: DocumentMetadata['category']): Promise<number> {
    try {
      const result = await postgresClient.query(
        'DELETE FROM documents WHERE category = $1',
        [category]
      );

      const count = result.rowCount || 0;
      console.log(`🗑️ ${count} documentos removidos da categoria "${category}"`);

      return count;
    } catch (error) {
      console.error(`❌ Erro ao limpar categoria "${category}":`, error);
      return 0;
    }
  }

  /**
   * Retorna estatísticas da base de conhecimento
   */
  async getStats(): Promise<{
    totalDocuments: number;
    byCategory: Record<string, number>;
  }> {
    try {
      const result = await postgresClient.query(`
        SELECT category, total_documents, active_documents
        FROM documents_stats
      `);

      const byCategory: Record<string, number> = {};
      let totalDocuments = 0;

      result.rows.forEach(row => {
        byCategory[row.category] = parseInt(row.active_documents);
        totalDocuments += parseInt(row.active_documents);
      });

      return { totalDocuments, byCategory };
    } catch (error) {
      console.error('❌ Erro ao buscar estatísticas:', error);
      return { totalDocuments: 0, byCategory: {} };
    }
  }

  /**
   * Testa conexão e configuração
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Verifica se extensão pgvector está instalada
      const result = await postgresClient.query(`
        SELECT EXISTS (
          SELECT 1 FROM pg_extension WHERE extname = 'vector'
        ) as has_pgvector
      `);

      const hasPgvector = result.rows[0].has_pgvector;

      if (!hasPgvector) {
        console.warn('⚠️ Extensão pgvector não está instalada');
        console.warn('   Usando modo fallback (busca em memória)');
        this.usePgvector = false;
      } else {
        console.log('✅ pgvector detectado - usando busca otimizada');
        this.usePgvector = true;
      }

      // Verifica se tabela documents existe
      const tableResult = await postgresClient.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_name = 'documents'
        ) as has_table
      `);

      const hasTable = tableResult.rows[0].has_table;

      if (!hasTable) {
        console.error('❌ Tabela documents não existe!');
        console.error('   Execute: npx ts-node src/scripts/setup-rag-fallback.ts');
        return false;
      }

      console.log(`✅ RAG Vector Store: Configuração OK (${this.usePgvector ? 'pgvector' : 'fallback'})`);
      return true;
    } catch (error) {
      console.error('❌ Erro no health check:', error);
      return false;
    }
  }
}

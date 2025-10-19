import { SupabaseVectorStore, DocumentMetadata } from './SupabaseVectorStore';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 📥 DOCUMENT INGESTION PIPELINE
 *
 * Carrega documentos da base de conhecimento e popula vector store
 *
 * PROCESSO:
 * 1. Lê arquivos JSON de docs/knowledge/
 * 2. Para cada documento:
 *    - Gera embedding
 *    - Insere no Supabase
 * 3. Cria índice HNSW automático
 *
 * ESTRUTURA ESPERADA:
 * docs/knowledge/
 *   ├── faq.json
 *   ├── servicos.json
 *   ├── produtos.json
 *   └── politicas.json
 */

interface KnowledgeDocument {
  title: string;
  content: string;
  category: DocumentMetadata['category'];
  subcategory?: string;
}

export class DocumentIngestion {
  private vectorStore: SupabaseVectorStore;
  private knowledgeBasePath: string;

  constructor(
    vectorStore: SupabaseVectorStore,
    knowledgeBasePath: string = path.join(__dirname, '../../docs/knowledge')
  ) {
    this.vectorStore = vectorStore;
    this.knowledgeBasePath = knowledgeBasePath;
  }

  /**
   * Carrega todos os documentos da base de conhecimento
   */
  async ingestAll(): Promise<{
    success: boolean;
    totalDocuments: number;
    documentsAdded: number;
    errors: string[];
  }> {
    console.log('\n📥 ========================================');
    console.log('📥 INICIANDO INGESTÃO DE DOCUMENTOS');
    console.log('📥 ========================================\n');

    const errors: string[] = [];
    let totalDocuments = 0;
    let documentsAdded = 0;

    try {
      // Verifica se diretório existe
      if (!fs.existsSync(this.knowledgeBasePath)) {
        throw new Error(`Diretório não encontrado: ${this.knowledgeBasePath}`);
      }

      // Lista arquivos JSON
      const files = fs.readdirSync(this.knowledgeBasePath)
        .filter(file => file.endsWith('.json'));

      console.log(`📂 Encontrados ${files.length} arquivos JSON\n`);

      // Processa cada arquivo
      for (const file of files) {
        const filePath = path.join(this.knowledgeBasePath, file);
        console.log(`📄 Processando: ${file}...`);

        try {
          const result = await this.ingestFile(filePath);
          totalDocuments += result.totalDocuments;
          documentsAdded += result.documentsAdded;

          console.log(`   ✅ ${result.documentsAdded}/${result.totalDocuments} documentos adicionados`);
        } catch (error: any) {
          const errorMsg = `Erro ao processar ${file}: ${error.message}`;
          errors.push(errorMsg);
          console.error(`   ❌ ${errorMsg}`);
        }
      }

      console.log('\n📥 ========================================');
      console.log(`📥 INGESTÃO CONCLUÍDA`);
      console.log(`📥 Total: ${documentsAdded}/${totalDocuments} documentos`);
      if (errors.length > 0) {
        console.log(`📥 Erros: ${errors.length}`);
      }
      console.log('📥 ========================================\n');

      return {
        success: errors.length === 0,
        totalDocuments,
        documentsAdded,
        errors
      };

    } catch (error: any) {
      console.error('❌ Erro fatal na ingestão:', error.message);
      return {
        success: false,
        totalDocuments: 0,
        documentsAdded: 0,
        errors: [error.message]
      };
    }
  }

  /**
   * Carrega documentos de um arquivo específico
   */
  async ingestFile(filePath: string): Promise<{
    totalDocuments: number;
    documentsAdded: number;
  }> {
    // Lê arquivo JSON
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const documents: KnowledgeDocument[] = JSON.parse(fileContent);

    // Converte para formato do vector store
    const formattedDocs = documents.map(doc => ({
      title: doc.title,
      content: doc.content,
      metadata: {
        category: doc.category,
        subcategory: doc.subcategory,
        source: path.basename(filePath)
      } as DocumentMetadata
    }));

    // Adiciona ao vector store
    const ids = await this.vectorStore.addDocuments(formattedDocs);

    return {
      totalDocuments: documents.length,
      documentsAdded: ids.length
    };
  }

  /**
   * Limpa toda a base de conhecimento
   */
  async clearAll(): Promise<number> {
    console.log('\n🗑️ Limpando toda a base de conhecimento...');

    let totalDeleted = 0;

    const categories: DocumentMetadata['category'][] = ['faq', 'produto', 'servico', 'politica'];

    for (const category of categories) {
      const count = await this.vectorStore.clearCategory(category);
      totalDeleted += count;
    }

    console.log(`✅ Total removido: ${totalDeleted} documentos\n`);

    return totalDeleted;
  }

  /**
   * Re-indexa toda a base (limpa e carrega novamente)
   */
  async reindex(): Promise<{
    success: boolean;
    totalDocuments: number;
    documentsAdded: number;
    errors: string[];
  }> {
    console.log('\n🔄 ========================================');
    console.log('🔄 RE-INDEXAÇÃO COMPLETA');
    console.log('🔄 ========================================\n');

    // Limpa base atual
    await this.clearAll();

    // Recarrega tudo
    return await this.ingestAll();
  }

  /**
   * Adiciona documento único (útil para testes)
   */
  async addSingleDocument(
    title: string,
    content: string,
    category: DocumentMetadata['category'],
    subcategory?: string
  ): Promise<string> {
    const ids = await this.vectorStore.addDocuments([{
      title,
      content,
      metadata: {
        category,
        subcategory,
        source: 'manual'
      }
    }]);

    return ids[0];
  }

  /**
   * Mostra estatísticas da base de conhecimento
   */
  async showStats(): Promise<void> {
    console.log('\n📊 ========================================');
    console.log('📊 ESTATÍSTICAS DA BASE DE CONHECIMENTO');
    console.log('📊 ========================================\n');

    const stats = await this.vectorStore.getStats();

    console.log(`📚 Total de documentos: ${stats.totalDocuments}\n`);

    console.log('📑 Por categoria:');
    Object.entries(stats.byCategory).forEach(([category, count]) => {
      console.log(`   - ${category}: ${count} documentos`);
    });

    console.log('\n📊 ========================================\n');
  }
}

/**
 * Helper: Cria instância de ingestão
 */
export function createDocumentIngestion(
  openaiApiKey: string,
  knowledgeBasePath?: string
): DocumentIngestion {
  const vectorStore = new SupabaseVectorStore(openaiApiKey);
  return new DocumentIngestion(vectorStore, knowledgeBasePath);
}

/**
 * CLI: Script para rodar ingestão manualmente
 *
 * Usage:
 *   npm run ingest-docs        # Carrega todos os documentos
 *   npm run ingest-docs clear  # Limpa base
 *   npm run ingest-docs reindex # Re-indexa tudo
 *   npm run ingest-docs stats   # Mostra estatísticas
 */
if (require.main === module) {
  const dotenv = require('dotenv');
  dotenv.config({ override: true }); // Force override system env vars

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  if (!OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY não configurada no .env');
    process.exit(1);
  }

  console.log(`🔑 OPENAI_API_KEY carregada: ${OPENAI_API_KEY.substring(0, 20)}... (${OPENAI_API_KEY.length} chars)`);

  const ingestion = createDocumentIngestion(OPENAI_API_KEY);
  const command = process.argv[2] || 'ingest';

  (async () => {
    try {
      switch (command) {
        case 'clear':
          await ingestion.clearAll();
          break;

        case 'reindex':
          await ingestion.reindex();
          break;

        case 'stats':
          await ingestion.showStats();
          break;

        case 'ingest':
        default:
          const result = await ingestion.ingestAll();
          if (!result.success) {
            console.error('\n❌ Ingestão completou com erros:');
            result.errors.forEach(err => console.error(`   - ${err}`));
            process.exit(1);
          }
          await ingestion.showStats();
          break;
      }

      console.log('✅ Comando executado com sucesso!');
      process.exit(0);
    } catch (error: any) {
      console.error('❌ Erro:', error.message);
      process.exit(1);
    }
  })();
}

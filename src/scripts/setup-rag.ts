import * as fs from 'fs';
import * as path from 'path';
import { postgresClient } from '../services/PostgreSQLClient';
import dotenv from 'dotenv';

dotenv.config();

/**
 * 🚀 SETUP RAG - Configuração inicial do sistema RAG
 *
 * Este script:
 * 1. Executa schema pgvector (cria tabela documents + funções)
 * 2. Verifica se extensão pgvector está habilitada
 * 3. Testa busca de similaridade
 *
 * IMPORTANTE: Execute APENAS UMA VEZ na configuração inicial!
 *
 * Usage:
 *   npx ts-node src/scripts/setup-rag.ts
 */

async function setupRAG() {
  console.log('\n🚀 ========================================');
  console.log('🚀 SETUP RAG - Configuração Inicial');
  console.log('🚀 ========================================\n');

  try {
    // 1. Verifica conexão PostgreSQL
    console.log('🐘 Verificando conexão PostgreSQL...');
    const isConnected = await postgresClient.testConnection();

    if (!isConnected) {
      throw new Error('Não foi possível conectar ao PostgreSQL. Verifique suas credenciais no .env');
    }

    console.log('✅ PostgreSQL conectado!\n');

    // 2. Carrega schema SQL
    console.log('📄 Carregando schema pgvector...');
    const schemaPath = path.join(__dirname, '../../src/database/pgvector-schema.sql');

    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema não encontrado: ${schemaPath}`);
    }

    const schema = fs.readFileSync(schemaPath, 'utf-8');
    console.log('✅ Schema carregado!\n');

    // 3. Executa schema
    console.log('⚙️ Executando schema (criando extensão, tabelas, funções)...');

    // Executa schema completo de uma vez (postgres suporta múltiplos statements)
    try {
      await postgresClient.query(schema);
      console.log('✅ Schema executado!\n');
    } catch (error: any) {
      // Se falhar, tenta executar statement por statement (modo fallback)
      console.log('⚠️ Executando em modo fallback (statement por statement)...');

      // Regex melhor para dividir statements (ignora ; dentro de funções)
      const statements: string[] = [];
      let currentStatement = '';
      let insideFunction = false;

      schema.split('\n').forEach(line => {
        if (line.includes('CREATE OR REPLACE FUNCTION') || line.includes('CREATE FUNCTION')) {
          insideFunction = true;
        }

        currentStatement += line + '\n';

        if (line.includes('$$;') && insideFunction) {
          insideFunction = false;
          statements.push(currentStatement.trim());
          currentStatement = '';
        } else if (line.trim().endsWith(';') && !insideFunction) {
          statements.push(currentStatement.trim());
          currentStatement = '';
        }
      });

      if (currentStatement.trim()) {
        statements.push(currentStatement.trim());
      }

      for (const statement of statements) {
        if (!statement || statement.startsWith('--')) continue;

        try {
          await postgresClient.query(statement);
        } catch (err: any) {
          // Ignora erros de "já existe"
          if (!err.message.includes('already exists') && !err.message.includes('duplicate')) {
            console.error(`❌ Erro ao executar: ${statement.substring(0, 100)}...`);
            throw err;
          }
        }
      }

      console.log('✅ Schema executado (fallback)!\n');
    }

    // 4. Verifica extensão pgvector
    console.log('🔍 Verificando extensão pgvector...');
    const extResult = await postgresClient.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'vector'
      ) as has_pgvector
    `);

    if (!extResult.rows[0].has_pgvector) {
      throw new Error('Extensão pgvector não foi instalada! Execute: CREATE EXTENSION vector;');
    }

    console.log('✅ Extensão pgvector habilitada!\n');

    // 5. Verifica tabela documents
    console.log('🔍 Verificando tabela documents...');
    const tableResult = await postgresClient.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'documents'
      ) as has_table
    `);

    if (!tableResult.rows[0].has_table) {
      throw new Error('Tabela documents não foi criada!');
    }

    console.log('✅ Tabela documents criada!\n');

    // 6. Verifica função search_documents
    console.log('🔍 Verificando função search_documents...');
    const funcResult = await postgresClient.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'search_documents'
      ) as has_function
    `);

    if (!funcResult.rows[0].has_function) {
      throw new Error('Função search_documents não foi criada!');
    }

    console.log('✅ Função search_documents criada!\n');

    // 7. Verifica índice HNSW
    console.log('🔍 Verificando índice HNSW...');
    const indexResult = await postgresClient.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'documents'
        AND indexname = 'idx_documents_embedding'
      ) as has_index
    `);

    if (!indexResult.rows[0].has_index) {
      console.warn('⚠️ Índice HNSW não encontrado. Será criado automaticamente ao adicionar documentos.');
    } else {
      console.log('✅ Índice HNSW criado!\n');
    }

    // 8. Testa inserção e busca (smoke test)
    console.log('🧪 Executando smoke test...');

    // Cria vetor de teste (embedding fake de 1536 dims)
    const testEmbedding = Array(1536).fill(0).map(() => Math.random());

    // Insere documento de teste
    const insertResult = await postgresClient.query(`
      INSERT INTO documents (title, content, category, embedding)
      VALUES ($1, $2, $3, $4::vector)
      RETURNING id
    `, [
      'Teste RAG',
      'Documento de teste para verificar funcionamento do RAG',
      'faq',
      `[${testEmbedding.join(',')}]`
    ]);

    const testDocId = insertResult.rows[0].id;
    console.log(`✅ Documento de teste inserido: ${testDocId}`);

    // Busca o documento inserido
    const searchResult = await postgresClient.query(`
      SELECT * FROM search_documents(
        $1::vector,
        0.5,
        1,
        NULL
      )
    `, [`[${testEmbedding.join(',')}]`]);

    if (searchResult.rows.length === 0) {
      throw new Error('Busca de similaridade falhou!');
    }

    console.log(`✅ Busca de similaridade funcionando! (${searchResult.rows.length} resultados)`);

    // Remove documento de teste
    await postgresClient.query('DELETE FROM documents WHERE id = $1', [testDocId]);
    console.log(`✅ Documento de teste removido\n`);

    // 9. Sucesso!
    console.log('🚀 ========================================');
    console.log('🚀 SETUP RAG CONCLUÍDO COM SUCESSO!');
    console.log('🚀 ========================================\n');

    console.log('✅ Sistema RAG está pronto para uso!');
    console.log('\n📝 Próximos passos:');
    console.log('1. Execute: npx ts-node src/rag/DocumentIngestion.ts');
    console.log('   (para carregar a base de conhecimento)');
    console.log('2. Habilite RAG nos pipelines LangChain');
    console.log('3. Teste com queries reais!\n');

    process.exit(0);

  } catch (error: any) {
    console.error('\n❌ ========================================');
    console.error('❌ ERRO NO SETUP RAG');
    console.error('❌ ========================================\n');
    console.error(`❌ ${error.message}\n`);

    if (error.stack) {
      console.error('Stack trace:');
      console.error(error.stack);
    }

    console.error('\n💡 Dicas de troubleshooting:');
    console.error('1. Verifique se PostgreSQL está rodando');
    console.error('2. Confirme credenciais no .env (POSTGRES_*)');
    console.error('3. Verifique se extensão pgvector está disponível');
    console.error('   (pode precisar instalar: sudo apt-get install postgresql-16-pgvector)\n');

    process.exit(1);
  }
}

// Executa setup
setupRAG();

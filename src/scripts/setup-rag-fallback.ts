import * as fs from 'fs';
import * as path from 'path';
import { postgresClient } from '../services/PostgreSQLClient';
import dotenv from 'dotenv';

dotenv.config();

/**
 * 🚀 SETUP RAG FALLBACK - Sem pgvector
 *
 * Este script configura RAG usando JSONB ao invés de pgvector
 * Funciona em QUALQUER PostgreSQL (não precisa de extensões)
 *
 * Usage:
 *   npx ts-node src/scripts/setup-rag-fallback.ts
 */

async function setupRAGFallback() {
  console.log('\n🚀 ========================================');
  console.log('🚀 SETUP RAG - Modo Fallback (Sem pgvector)');
  console.log('🚀 ========================================\n');

  try {
    // 1. Verifica conexão PostgreSQL
    console.log('🐘 Verificando conexão PostgreSQL...');
    const isConnected = await postgresClient.testConnection();

    if (!isConnected) {
      throw new Error('Não foi possível conectar ao PostgreSQL. Verifique suas credenciais no .env');
    }

    console.log('✅ PostgreSQL conectado!\n');

    // 2. Carrega schema fallback
    console.log('📄 Carregando schema fallback (sem pgvector)...');
    const schemaPath = path.join(__dirname, '../../src/database/documents-schema-fallback.sql');

    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema não encontrado: ${schemaPath}`);
    }

    const schema = fs.readFileSync(schemaPath, 'utf-8');
    console.log('✅ Schema carregado!\n');

    // 3. Executa schema
    console.log('⚙️ Executando schema (criando tabelas, funções)...');

    await postgresClient.query(schema);
    console.log('✅ Schema executado!\n');

    // 4. Verifica tabela documents
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

    // 5. Verifica estrutura da tabela
    console.log('🔍 Verificando estrutura...');
    const columnsResult = await postgresClient.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'documents'
      ORDER BY ordinal_position
    `);

    console.log('✅ Colunas encontradas:');
    columnsResult.rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.data_type}`);
    });
    console.log('');

    // 6. Testa inserção e busca (smoke test)
    console.log('🧪 Executando smoke test...');

    // Cria embedding de teste (1536 dims)
    const testEmbedding = Array(1536).fill(0).map(() => Math.random());

    // Insere documento de teste
    const insertResult = await postgresClient.query(`
      INSERT INTO documents (title, content, category, embedding)
      VALUES ($1, $2, $3, $4::jsonb)
      RETURNING id
    `, [
      'Teste RAG Fallback',
      'Documento de teste para verificar funcionamento do RAG sem pgvector',
      'faq',
      JSON.stringify(testEmbedding)
    ]);

    const testDocId = insertResult.rows[0].id;
    console.log(`✅ Documento de teste inserido: ${testDocId}`);

    // Busca o documento inserido
    const searchResult = await postgresClient.query(`
      SELECT id, title, content, category
      FROM documents
      WHERE id = $1
    `, [testDocId]);

    if (searchResult.rows.length === 0) {
      throw new Error('Busca falhou!');
    }

    console.log(`✅ Busca funcionando! (${searchResult.rows.length} resultados)`);

    // Remove documento de teste
    await postgresClient.query('DELETE FROM documents WHERE id = $1', [testDocId]);
    console.log(`✅ Documento de teste removido\n`);

    // 7. Sucesso!
    console.log('🚀 ========================================');
    console.log('🚀 SETUP RAG CONCLUÍDO COM SUCESSO!');
    console.log('🚀 (Modo Fallback - sem pgvector)');
    console.log('🚀 ========================================\n');

    console.log('✅ Sistema RAG está pronto para uso!');
    console.log('\n📝 Próximos passos:');
    console.log('1. Execute: npx ts-node src/rag/DocumentIngestion.ts');
    console.log('   (para carregar a base de conhecimento)');
    console.log('2. Sistema funcionará com busca em memória');
    console.log('3. Para melhor performance, migre para Supabase (com pgvector)\n');

    console.log('ℹ️ NOTA: Modo fallback usa busca em memória.');
    console.log('   Funciona bem até ~1000 documentos.');
    console.log('   Para mais docs, recomendamos Supabase com pgvector.\n');

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
    console.error('3. Teste conexão: psql -h HOST -U USER -d DATABASE\n');

    process.exit(1);
  }
}

// Executa setup
setupRAGFallback();

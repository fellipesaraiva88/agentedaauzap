/**
 * Script para verificar a estrutura da tabela onboarding_progress
 */

import { postgresClient } from '../services/PostgreSQLClient';

async function checkTable() {
  try {
    console.log('🔄 Conectando ao banco de dados...');

    if (!postgresClient.isPostgresConnected()) {
      console.error('❌ PostgreSQL não está conectado');
      process.exit(1);
    }

    console.log('✅ Conectado!');

    const pool = postgresClient.getPool();
    if (!pool) {
      throw new Error('Pool do PostgreSQL não disponível');
    }

    // Verificar se a tabela existe
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'onboarding_progress'
      )
    `);

    console.log('\n📊 Tabela onboarding_progress existe:', tableExists.rows[0].exists);

    if (tableExists.rows[0].exists) {
      // Listar colunas
      const columns = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'onboarding_progress'
        ORDER BY ordinal_position
      `);

      console.log('\n📋 Colunas da tabela:');
      columns.rows.forEach((col: any) => {
        console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
      });

      // Listar constraints
      const constraints = await pool.query(`
        SELECT conname, contype
        FROM pg_constraint
        WHERE conrelid = 'onboarding_progress'::regclass
      `);

      if (constraints.rows.length > 0) {
        console.log('\n🔒 Constraints:');
        constraints.rows.forEach((c: any) => {
          const types: Record<string, string> = {
            'p': 'PRIMARY KEY',
            'u': 'UNIQUE',
            'f': 'FOREIGN KEY',
            'c': 'CHECK'
          };
          console.log(`  - ${c.conname} (${types[c.contype] || c.contype})`);
        });
      }
    }

    process.exit(0);

  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

checkTable();

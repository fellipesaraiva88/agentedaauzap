/**
 * Script para aplicar a migration 017
 * Cria a tabela user_onboarding_progress
 */

import { postgresClient } from '../services/PostgreSQLClient';
import * as fs from 'fs';
import * as path from 'path';

async function applyMigration() {
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

    // Ler arquivo da migration
    const migrationPath = path.join(__dirname, '../../migrations/017_create_user_onboarding_progress.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('🔄 Aplicando migration 017...');
    await pool.query(migrationSQL);

    console.log('✅ Migration 017 aplicada com sucesso!');
    console.log('ℹ️  Tabela user_onboarding_progress criada');
    console.log('ℹ️  Sistema pronto para usar o onboarding');

    process.exit(0);

  } catch (error) {
    console.error('❌ Erro ao aplicar migration:', error);
    process.exit(1);
  }
}

applyMigration();
